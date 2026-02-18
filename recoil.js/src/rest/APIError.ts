/**
 * @module recoil.js/rest/APIError
 * Custom error classes for API and HTTP errors.
 *
 * @packageDocumentation
 */

/**
 * Represents an error returned by the RecoilApp REST API.
 * Contains the HTTP status code, error message, and the request method/path.
 *
 * @example
 * ```ts
 * try {
 *   await client.servers.fetch('nonexistent-id');
 * } catch (err) {
 *   if (err instanceof RecoilAPIError) {
 *     console.log(err.status);  // 404
 *     console.log(err.message); // 'Server not found or bot is not a member'
 *     console.log(err.method);  // 'GET'
 *     console.log(err.path);    // '/servers/nonexistent-id'
 *   }
 * }
 * ```
 */
export class RecoilAPIError extends Error {
  /** HTTP status code returned by the API */
  public readonly status: number;

  /** HTTP method of the failed request */
  public readonly method: string;

  /** API path (relative to base URL) of the failed request */
  public readonly path: string;

  /** Raw error body from the API (if JSON) */
  public readonly body: Record<string, unknown> | null;

  /**
   * Creates a new RecoilAPIError.
   * @param message - Human-readable error message
   * @param status - HTTP status code
   * @param method - HTTP method used
   * @param path - Request path
   * @param body - Raw response body
   */
  constructor(
    message: string,
    status: number,
    method: string,
    path: string,
    body: Record<string, unknown> | null = null,
  ) {
    super(message);
    this.name = 'RecoilAPIError';
    this.status = status;
    this.method = method;
    this.path = path;
    this.body = body;

    // Maintain proper stack trace in V8
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RecoilAPIError);
    }
  }

  /**
   * Returns a formatted string representation of the error.
   */
  override toString(): string {
    return `${this.name} [${this.status}]: ${this.method} ${this.path} — ${this.message}`;
  }

  /**
   * Converts the error to a plain object for logging.
   */
  toJSON(): Record<string, unknown> {
    return {
      name: this.name,
      message: this.message,
      status: this.status,
      method: this.method,
      path: this.path,
      body: this.body,
    };
  }
}

/**
 * Thrown when a request times out before receiving a response.
 */
export class RequestTimeoutError extends Error {
  /** The timeout duration in milliseconds */
  public readonly timeout: number;

  /** HTTP method of the timed-out request */
  public readonly method: string;

  /** API path of the timed-out request */
  public readonly path: string;

  constructor(timeout: number, method: string, path: string) {
    super(`Request timed out after ${timeout}ms: ${method} ${path}`);
    this.name = 'RequestTimeoutError';
    this.timeout = timeout;
    this.method = method;
    this.path = path;
  }
}

/**
 * Thrown when the bot token is invalid or missing.
 */
export class AuthenticationError extends Error {
  constructor(message = 'Invalid or missing bot token') {
    super(message);
    this.name = 'AuthenticationError';
  }
}

/**
 * Thrown when the bot lacks required permissions for an action.
 */
export class PermissionError extends Error {
  /** The permissions that were required */
  public readonly required: string[];

  /** The permissions that were missing */
  public readonly missing: string[];

  constructor(required: string[], missing: string[]) {
    super(`Missing permissions: ${missing.join(', ')}`);
    this.name = 'PermissionError';
    this.required = required;
    this.missing = missing;
  }
}

/**
 * Thrown when a rate limit is exceeded.
 */
export class RateLimitError extends Error {
  /** Milliseconds to wait before retrying */
  public readonly retryAfter: number;

  /** Whether this is a global rate limit */
  public readonly global: boolean;

  /** The route bucket that was rate limited */
  public readonly route: string;

  constructor(retryAfter: number, route: string, global = false) {
    super(`Rate limited on ${route}. Retry after ${retryAfter}ms${global ? ' (global)' : ''}`);
    this.name = 'RateLimitError';
    this.retryAfter = retryAfter;
    this.global = global;
    this.route = route;
  }
}
