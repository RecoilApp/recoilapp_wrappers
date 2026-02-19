/**
 * @module recoil.js/rest/RESTManager
 * Core HTTP client for making authenticated requests to the RecoilApp Bot API v1.
 * Handles authentication, rate limiting, retries with exponential backoff, and
 * automatic error parsing.
 *
 * @packageDocumentation
 */

import { EventEmitter } from 'node:events';
import { DEFAULT_API_BASE, USER_AGENT, Defaults, type HTTPMethod } from '../util/Constants';
import { RecoilAPIError, RequestTimeoutError, RateLimitError, AuthenticationError } from './APIError';

// ═══════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════

/** Options for configuring the REST manager */
export interface RESTOptions {
  /** Base URL of the API (default: production URL) */
  apiBase?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
  /** Maximum retry attempts for failed requests */
  maxRetries?: number;
  /** Base delay for exponential backoff (ms) */
  retryDelay?: number;
  /** Custom headers to include in every request */
  headers?: Record<string, string>;
}

/** Options for a single request */
export interface RequestOptions {
  /** Request body (will be JSON-serialized) */
  body?: Record<string, unknown> | unknown[];
  /** FormData body for multipart/form-data requests (e.g., file uploads) */
  formData?: FormData;
  /** Query string parameters */
  query?: Record<string, string | number | boolean | undefined>;
  /** Additional headers for this request */
  headers?: Record<string, string>;
  /** Override the default timeout for this request */
  timeout?: number;
  /** Reason header (for audit log entries) */
  reason?: string;
}

/** Internal rate limit bucket */
interface RateLimitBucket {
  remaining: number;
  resetAt: number;
  limit: number;
}

// ═══════════════════════════════════════════════════════════
// REST MANAGER
// ═══════════════════════════════════════════════════════════

/**
 * Manages all HTTP communication with the RecoilApp Bot API.
 *
 * Features:
 * - Automatic `Bot <token>` authentication header
 * - Per-route rate limit tracking with queue-based waiting
 * - Exponential backoff retries on 5xx errors
 * - Request timeout enforcement
 * - Debug event emission for monitoring
 *
 * @example
 * ```ts
 * const rest = new RESTManager({ apiBase: 'https://recoilapp.com/api/v1' });
 * rest.setToken('my-bot-token');
 *
 * const data = await rest.get('/servers');
 * console.log(data.servers);
 * ```
 */
export class RESTManager extends EventEmitter {
  /** The bot token used for authentication */
  private token: string | null = null;

  /** Base URL for all API requests */
  private readonly apiBase: string;

  /** Request timeout in milliseconds */
  private readonly timeout: number;

  /** Maximum retry attempts */
  private readonly maxRetries: number;

  /** Base retry delay for exponential backoff */
  private readonly retryDelay: number;

  /** Custom headers included in every request */
  private readonly customHeaders: Record<string, string>;

  /** Per-route rate limit buckets */
  private readonly buckets = new Map<string, RateLimitBucket>();

  /** Global rate limit state */
  private globalRateLimit: { blocked: boolean; resetAt: number } = {
    blocked: false,
    resetAt: 0,
  };

  /** Request queue for rate-limited routes */
  private readonly queues = new Map<string, Array<() => void>>();

  /**
   * Create a new RESTManager.
   * @param options - Configuration options
   */
  constructor(options: RESTOptions = {}) {
    super();
    this.apiBase = (options.apiBase ?? DEFAULT_API_BASE).replace(/\/+$/, '');
    this.timeout = options.timeout ?? Defaults.REQUEST_TIMEOUT;
    this.maxRetries = options.maxRetries ?? Defaults.MAX_RETRIES;
    this.retryDelay = options.retryDelay ?? Defaults.RETRY_DELAY;
    this.customHeaders = options.headers ?? {};
  }

  /**
   * Sets the bot token used for authentication.
   * @param token - The bot token (without the 'Bot ' prefix)
   */
  setToken(token: string): void {
    this.token = token;
  }

  // ── Convenience Methods ─────────────────────────────────

  /**
   * Perform a GET request.
   * @param path - API path (e.g., '/servers')
   * @param options - Request options
   * @returns The parsed JSON response body
   */
  async get<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', path, options);
  }

  /**
   * Perform a POST request.
   * @param path - API path
   * @param options - Request options (should include `body`)
   * @returns The parsed JSON response body
   */
  async post<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', path, options);
  }

  /**
   * Perform a PUT request.
   * @param path - API path
   * @param options - Request options
   * @returns The parsed JSON response body
   */
  async put<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', path, options);
  }

  /**
   * Perform a PATCH request.
   * @param path - API path
   * @param options - Request options (should include `body`)
   * @returns The parsed JSON response body
   */
  async patch<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', path, options);
  }

  /**
   * Perform a DELETE request.
   * @param path - API path
   * @param options - Request options
   * @returns The parsed JSON response body (usually empty for 204)
   */
  async delete<T = unknown>(path: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', path, options);
  }

  // ── Core Request Method ─────────────────────────────────

  /**
   * Execute an HTTP request to the API with full rate limit handling and retries.
   *
   * @param method - HTTP method
   * @param path - API path (relative to base URL)
   * @param options - Request options
   * @returns Parsed JSON response
   * @throws {RecoilAPIError} On 4xx/5xx responses (after retries exhausted)
   * @throws {RequestTimeoutError} If the request times out
   * @throws {AuthenticationError} If no token is set
   * @throws {RateLimitError} If rate limited and retries exhausted
   */
  async request<T = unknown>(
    method: string,
    path: string,
    options: RequestOptions = {},
  ): Promise<T> {
    if (!this.token) {
      throw new AuthenticationError('No bot token set. Call client.login(token) first.');
    }

    const routeKey = this.getRouteKey(method, path);

    // Wait for rate limit if needed
    await this.waitForRateLimit(routeKey);

    // Build the full URL
    const url = this.buildURL(path, options.query);

    // Build headers
    const headers: Record<string, string> = {
      'Authorization': `Bot ${this.token}`,
      'User-Agent': USER_AGENT,
      'Accept': 'application/json',
      ...this.customHeaders,
      ...(options.headers ?? {}),
    };

    // Don't set Content-Type for FormData — the runtime adds the multipart boundary
    if (!options.formData) {
      headers['Content-Type'] = 'application/json';
    }

    if (options.reason) {
      headers['X-Audit-Log-Reason'] = encodeURIComponent(options.reason);
    }

    // Retry loop
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        // Emit debug event
        this.emit('apiRequest', {
          method,
          path,
          attempt,
          url: url.toString(),
        });

        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          options.timeout ?? this.timeout,
        );

        const fetchOptions: RequestInit = {
          method,
          headers,
          signal: controller.signal,
        };

        if (options.formData && !['GET', 'HEAD'].includes(method)) {
          fetchOptions.body = options.formData;
        } else if (options.body && !['GET', 'HEAD'].includes(method)) {
          fetchOptions.body = JSON.stringify(options.body);
        }

        const response = await fetch(url.toString(), fetchOptions);
        clearTimeout(timeoutId);

        // Update rate limit tracking from response headers
        this.updateRateLimit(routeKey, response.headers);

        // Emit response event
        this.emit('apiResponse', {
          method,
          path,
          status: response.status,
          attempt,
        });

        // Handle rate limiting (429)
        if (response.status === 429) {
          const retryAfter = this.parseRetryAfter(response.headers);
          const isGlobal = response.headers.get('x-ratelimit-global') === 'true';

          if (isGlobal) {
            this.globalRateLimit = {
              blocked: true,
              resetAt: Date.now() + retryAfter,
            };
          }

          this.emit('rateLimit', {
            method,
            path,
            retryAfter,
            global: isGlobal,
            route: routeKey,
          });

          if (attempt < this.maxRetries) {
            await this.sleep(retryAfter);
            continue;
          }

          throw new RateLimitError(retryAfter, routeKey, isGlobal);
        }

        // Handle 204 No Content
        if (response.status === 204) {
          return undefined as unknown as T;
        }

        // Parse response body
        let body: unknown;
        const contentType = response.headers.get('content-type') ?? '';
        if (contentType.includes('application/json')) {
          body = await response.json();
        } else {
          body = await response.text();
        }

        // Handle error responses
        if (!response.ok) {
          const errorMessage = typeof body === 'object' && body !== null && 'error' in body
            ? (body as Record<string, string>).error
            : `HTTP ${response.status}`;

          const apiError = new RecoilAPIError(
            errorMessage,
            response.status,
            method,
            path,
            typeof body === 'object' ? body as Record<string, unknown> : null,
          );

          // Retry on 5xx errors
          if (response.status >= 500 && attempt < this.maxRetries) {
            lastError = apiError;
            const delay = this.retryDelay * Math.pow(2, attempt);
            this.emit('debug', `Retrying ${method} ${path} after ${delay}ms (attempt ${attempt + 1}/${this.maxRetries})`);
            await this.sleep(delay);
            continue;
          }

          throw apiError;
        }

        return body as T;

      } catch (err) {
        if (err instanceof RecoilAPIError || err instanceof RateLimitError) {
          throw err;
        }

        if (err instanceof DOMException && err.name === 'AbortError') {
          if (attempt < this.maxRetries) {
            lastError = new RequestTimeoutError(options.timeout ?? this.timeout, method, path);
            const delay = this.retryDelay * Math.pow(2, attempt);
            await this.sleep(delay);
            continue;
          }
          throw new RequestTimeoutError(options.timeout ?? this.timeout, method, path);
        }

        // Network errors — retry
        if (attempt < this.maxRetries) {
          lastError = err as Error;
          const delay = this.retryDelay * Math.pow(2, attempt);
          this.emit('debug', `Network error on ${method} ${path}, retrying after ${delay}ms`);
          await this.sleep(delay);
          continue;
        }

        throw err;
      }
    }

    throw lastError ?? new Error(`Request failed after ${this.maxRetries} retries`);
  }

  // ── Rate Limit Helpers ──────────────────────────────────

  /**
   * Generates a route key for rate limit bucketing.
   * Replaces dynamic IDs with `:id` to group similar routes.
   */
  private getRouteKey(method: string, path: string): string {
    // Replace UUIDs and numeric IDs with :id
    const normalized = path.replace(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
      ':id',
    );
    return `${method}:${normalized}`;
  }

  /**
   * Waits if the route or global rate limit is active.
   */
  private async waitForRateLimit(routeKey: string): Promise<void> {
    // Check global rate limit
    if (this.globalRateLimit.blocked) {
      const waitTime = this.globalRateLimit.resetAt - Date.now();
      if (waitTime > 0) {
        this.emit('debug', `Global rate limit active, waiting ${waitTime}ms`);
        await this.sleep(waitTime);
      }
      this.globalRateLimit.blocked = false;
    }

    // Check per-route rate limit
    const bucket = this.buckets.get(routeKey);
    if (bucket && bucket.remaining <= 0) {
      const waitTime = bucket.resetAt - Date.now();
      if (waitTime > 0) {
        this.emit('debug', `Route ${routeKey} rate limited, waiting ${waitTime}ms`);
        await this.sleep(waitTime);
      }
    }
  }

  /**
   * Updates rate limit tracking from response headers.
   */
  private updateRateLimit(routeKey: string, headers: Headers): void {
    const remaining = headers.get('x-ratelimit-remaining');
    const reset = headers.get('x-ratelimit-reset');
    const limit = headers.get('x-ratelimit-limit');

    if (remaining !== null && reset !== null) {
      this.buckets.set(routeKey, {
        remaining: parseInt(remaining, 10),
        resetAt: parseFloat(reset) * 1000, // Convert seconds to ms
        limit: limit ? parseInt(limit, 10) : 50,
      });
    }
  }

  /**
   * Parses the retry-after header from a 429 response.
   */
  private parseRetryAfter(headers: Headers): number {
    const retryAfter = headers.get('retry-after');
    if (retryAfter) {
      const ms = parseFloat(retryAfter);
      return ms > 100 ? ms : ms * 1000; // Assume seconds if small number
    }
    return 1000; // Default 1 second
  }

  /**
   * Builds the full URL with query parameters.
   */
  private buildURL(path: string, query?: Record<string, string | number | boolean | undefined>): URL {
    const url = new URL(`${this.apiBase}${path}`);
    if (query) {
      for (const [key, value] of Object.entries(query)) {
        if (value !== undefined) {
          url.searchParams.set(key, String(value));
        }
      }
    }
    return url;
  }

  /**
   * Utility: sleep for a given number of milliseconds.
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
