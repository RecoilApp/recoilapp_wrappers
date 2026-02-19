/**
 * @module recoil.js/client/RecoilClient
 * The main entry point for the recoil.js library.
 *
 * @packageDocumentation
 */

import { EventEmitter } from 'events';
import type { ClientOptions } from './ClientOptions';
import { DefaultClientOptions } from './ClientOptions';
import type { ClientEvents } from './ClientEvents';
import { RESTManager } from '../rest/RESTManager';
import { ServerManager } from '../managers/ServerManager';
import { ClientUser } from '../structures/User';
import { IntentsBitField, Intents } from '../util/Intents';
import { Events } from '../util/Events';
import { Gateway } from '../gateway/Gateway';
import type { APIBotUser, APIGateway, APIInfo, APIMessage, APIMessageCreate, Snowflake } from '../types';

/**
 * The main client class for interacting with the RecoilApp Bot API.
 *
 * Extends `EventEmitter` to provide lifecycle and debug events.
 *
 * @example
 * ```ts
 * import { RecoilClient, Intents } from 'recoil.js';
 *
 * const client = new RecoilClient({
 *   intents: Intents.Flags.Servers | Intents.Flags.ServerMessages | Intents.Flags.MessageContent,
 * });
 *
 * client.on('ready', () => {
 *   console.log(`Logged in as ${client.user!.username}!`);
 *   console.log(`Serving ${client.servers.size} servers`);
 * });
 *
 * client.login('your-bot-token-here');
 * ```
 *
 * @example
 * ```ts
 * // Using intents presets
 * const client = new RecoilClient({
 *   intents: Intents.resolve(Intents.Presets.NonPrivileged),
 * });
 * ```
 */
export class RecoilClient extends EventEmitter {

  // ── Typed Event Overrides ───────────────────────────────
  // These provide full TypeScript intellisense for client.on(), .once(), .emit(), etc.

  /** Register an event listener with full type safety. */
  public override on<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;
  public override on(event: string | symbol, listener: (...args: unknown[]) => void): this;
  public override on(event: string | symbol, listener: (...args: unknown[]) => void): this {
    return super.on(event, listener as (...args: unknown[]) => void);
  }

  /** Register a one-time event listener with full type safety. */
  public override once<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;
  public override once(event: string | symbol, listener: (...args: unknown[]) => void): this;
  public override once(event: string | symbol, listener: (...args: unknown[]) => void): this {
    return super.once(event, listener as (...args: unknown[]) => void);
  }

  /** Emit a typed event. */
  public override emit<K extends keyof ClientEvents>(event: K, ...args: ClientEvents[K]): boolean;
  public override emit(event: string | symbol, ...args: unknown[]): boolean;
  public override emit(event: string | symbol, ...args: unknown[]): boolean {
    return super.emit(event, ...args);
  }

  /** Remove an event listener with full type safety. */
  public override off<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;
  public override off(event: string | symbol, listener: (...args: unknown[]) => void): this;
  public override off(event: string | symbol, listener: (...args: unknown[]) => void): this {
    return super.off(event, listener as (...args: unknown[]) => void);
  }

  /** Remove an event listener (alias for {@link off}). */
  public override removeListener<K extends keyof ClientEvents>(event: K, listener: (...args: ClientEvents[K]) => void): this;
  public override removeListener(event: string | symbol, listener: (...args: unknown[]) => void): this;
  public override removeListener(event: string | symbol, listener: (...args: unknown[]) => void): this {
    return super.removeListener(event, listener as (...args: unknown[]) => void);
  }

  // ── Properties ──────────────────────────────────────────

  /** The REST manager for making API requests */
  public readonly rest: RESTManager;

  /** The server manager — access and cache bot's servers */
  public readonly servers: ServerManager;

  /** The bot gateway — WebSocket connection for real-time events */
  public readonly gateway: Gateway;

  /** The resolved intents bitfield */
  public readonly intents: IntentsBitField;

  /** The client options (merged with defaults) */
  public readonly options: ClientOptions;

  /** The authenticated bot user (populated after {@link login}) */
  public user: ClientUser | null = null;

  /** The bot's token (set during {@link login}) */
  private _token: string | null = null;

  /** Timestamp of when the client became ready */
  private _readyAt: Date | null = null;

  /** Whether the client has been destroyed */
  private _destroyed = false;

  /**
   * Creates a new RecoilClient.
   *
   * @param options - Client configuration
   */
  constructor(options: ClientOptions) {
    super();

    this.options = {
      ...DefaultClientOptions,
      ...options,
    };

    // Resolve intents
    if (options.intents instanceof IntentsBitField) {
      this.intents = options.intents;
    } else {
      this.intents = new IntentsBitField(BigInt(options.intents));
    }

    // Initialize REST manager
    this.rest = new RESTManager({
      apiBase: options.apiBaseUrl,
      ...options.rest,
    });

    // Forward REST events to the client so client.on('rateLimit', ...) etc. works
    this.rest.on('apiRequest', (data: unknown) => this.emit(Events.ApiRequest, data));
    this.rest.on('apiResponse', (data: unknown) => this.emit(Events.ApiResponse, data));
    this.rest.on('rateLimit', (data: unknown) => this.emit(Events.RateLimit, data));
    this.rest.on('debug', (info: string) => this.emit(Events.Debug, `[REST] ${info}`));

    // Initialize managers
    this.servers = new ServerManager(this);

    // Initialize gateway
    this.gateway = new Gateway(this, options.gateway);
  }

  /**
   * Logs the bot in, authenticating with the provided token.
   *
   * This method:
   * 1. Sets the bot token on the REST manager
   * 2. Fetches the authenticated bot user (`GET /@me`)
   * 3. Optionally fetches all servers the bot belongs to
   * 4. Emits the `ready` event
   *
   * @param token - The bot token
   * @returns The bot token (for chaining)
   *
   * @example
   * ```ts
   * await client.login(process.env.BOT_TOKEN!);
   * ```
   */
  async login(token: string): Promise<string> {
    if (this._destroyed) {
      throw new Error('Cannot login on a destroyed client. Create a new RecoilClient.');
    }

    this._token = token;
    this.rest.setToken(token);

    this.emit(Events.Debug, 'Authenticating with bot token...');

    try {
      // Fetch bot user
      const userData = await this.rest.get<{ user: APIBotUser }>('/@me');
      this.user = new ClientUser(this, userData.user);

      this.emit(Events.Debug, `Authenticated as ${this.user.username} (${this.user.id})`);

      // Optionally fetch servers
      if (this.options.fetchServersOnReady !== false) {
        this.emit(Events.Debug, 'Fetching servers...');
        await this.servers.list();
        this.emit(Events.Debug, `Loaded ${this.servers.size} servers`);
      }

      this._readyAt = new Date();
      this.emit(Events.Ready, this);

      // Connect to the bot gateway for real-time events
      this.gateway.connect(token);

      return token;
    } catch (error) {
      this.emit(Events.Error, error);
      throw error;
    }
  }

  /**
   * Fetches gateway connection information.
   *
   * @returns Gateway info (URL, shards, session limits)
   */
  async fetchGateway(): Promise<APIGateway> {
    return this.rest.get<APIGateway>('/gateway');
  }

  /**
   * Fetches API information (version, rate limits, etc.).
   *
   * @returns API info
   */
  async fetchApiInfo(): Promise<APIInfo> {
    return this.rest.get<APIInfo>('/info');
  }

  /**
   * Sends a direct message to a DM conversation.
   *
   * @param conversationId - The DM conversation ID
   * @param options - Message content and options
   * @returns The raw API message data
   *
   * @example
   * ```ts
   * await client.sendDM(conversationId, { content: 'Hello via DM!' });
   *
   * // With attachments
   * await client.sendDM(conversationId, {
   *   content: 'Check these out!',
   *   attachments: [file1, file2],
   * });
   * ```
   */
  async sendDM(conversationId: Snowflake, options: APIMessageCreate): Promise<APIMessage> {
    if (options.attachments?.length) {
      const formData = new FormData();
      if (options.content) formData.append('content', options.content);
      if (options.reply_to_id) formData.append('reply_to_id', options.reply_to_id);
      if (options.embeds) formData.append('embeds', JSON.stringify(options.embeds));
      for (const file of options.attachments) {
        formData.append('attachments', file);
      }
      const data = await this.rest.post<{ message: APIMessage }>(
        `/dms/${conversationId}/messages`,
        { formData },
      );
      return data.message;
    }

    const data = await this.rest.post<{ message: APIMessage }>(
      `/dms/${conversationId}/messages`,
      { body: options as unknown as Record<string, unknown> },
    );
    return data.message;
  }

  // ── QR Login Methods ────────────────────────────────────

  /**
   * Generate a new QR login session.
   * No authentication required. The returned token should be encoded into a QR code
   * for the mobile app to scan.
   *
   * @returns The QR session token, expiry time, and TTL in seconds
   *
   * @example
   * ```ts
   * const session = await client.generateQrSession();
   * console.log(session.token); // Encode this into a QR code
   * console.log(`Expires in ${session.ttl} seconds`);
   * ```
   */
  async generateQrSession(): Promise<{ token: string; expires_at: string; ttl: number }> {
    return this.rest.post('/auth/qr/generate');
  }

  /**
   * Check the status of a QR login session.
   * No authentication required. Poll this endpoint to detect when the mobile
   * device has scanned and confirmed the QR code.
   *
   * @param token - The QR session token from {@link generateQrSession}
   * @returns The session status — `'pending'`, `'confirmed'` (with auth tokens), or `'expired'`
   *
   * @example
   * ```ts
   * const status = await client.checkQrStatus(token);
   * if (status.status === 'confirmed') {
   *   console.log(status.accessToken);
   * }
   * ```
   */
  async checkQrStatus(token: string): Promise<
    | { status: 'pending' }
    | { status: 'confirmed'; accessToken: string; refreshToken: string; sessionId: string; user: unknown }
    | { status: 'expired' }
  > {
    return this.rest.get(`/auth/qr/status/${token}`);
  }

  /**
   * Confirm a QR login session from the authenticated device.
   * Requires authentication (Bearer token). Called by the mobile app after
   * scanning the QR code to authorize the desktop session.
   *
   * @param token - The QR session token scanned from the QR code
   * @returns Confirmation of successful QR login
   *
   * @example
   * ```ts
   * await client.confirmQrLogin(scannedToken);
   * ```
   */
  async confirmQrLogin(token: string): Promise<{ success: true; message: string }> {
    return this.rest.post('/auth/qr/confirm', {
      body: { token },
    });
  }

  // ── MFA Methods ─────────────────────────────────────────

  /**
   * Verify an MFA code during login.
   * Uses the ticket JWT from the login response — does not require Bearer auth.
   *
   * @param ticket - The ticket JWT returned from login when MFA is required
   * @param code - The 6-digit TOTP code from the authenticator app
   * @returns Auth tokens and user object
   *
   * @example
   * ```ts
   * const result = await client.verifyMfaLogin(ticket, '123456');
   * console.log(result.accessToken);
   * ```
   */
  async verifyMfaLogin(ticket: string, code: string): Promise<{ user: unknown; accessToken: string; refreshToken: string; sessionId: string }> {
    return this.rest.post('/auth/mfa/verify', {
      body: { ticket, code },
    });
  }

  /**
   * Start two-factor authentication setup.
   * Generates a TOTP secret and provisioning URL for an authenticator app.
   *
   * @returns The TOTP secret, OTP URL, and setup message
   *
   * @example
   * ```ts
   * const setup = await client.setupMfa();
   * console.log(setup.otp_url); // Use to generate QR code
   * ```
   */
  async setupMfa(): Promise<{ secret: string; otp_url: string; message: string }> {
    return this.rest.post('/users/@me/mfa/setup');
  }

  /**
   * Activate two-factor authentication by verifying a TOTP code.
   * Must be called after {@link setupMfa}.
   *
   * @param code - The 6-digit TOTP code from the authenticator app
   * @returns Confirmation message, one-time backup codes, and a warning
   *
   * @example
   * ```ts
   * const result = await client.verifyMfa('123456');
   * console.log(result.backup_codes); // Store securely!
   * ```
   */
  async verifyMfa(code: string): Promise<{ message: string; backup_codes: string[]; warning: string }> {
    return this.rest.post('/users/@me/mfa/verify', {
      body: { code },
    });
  }

  /**
   * Disable two-factor authentication.
   *
   * @param password - The user's current password for confirmation
   * @returns Confirmation message
   *
   * @example
   * ```ts
   * await client.disableMfa('mySecurePassword');
   * ```
   */
  async disableMfa(password: string): Promise<{ message: string }> {
    return this.rest.delete('/users/@me/mfa', {
      body: { password },
    });
  }

  /**
   * Get the remaining and total count of MFA backup codes.
   *
   * @returns Remaining and total backup code counts
   *
   * @example
   * ```ts
   * const info = await client.getBackupCodesInfo();
   * console.log(`${info.remaining_codes} of ${info.total_codes} remaining`);
   * ```
   */
  async getBackupCodesInfo(): Promise<{ remaining_codes: number; total_codes: number }> {
    return this.rest.get('/users/@me/mfa/backup-codes');
  }

  /**
   * Regenerate all MFA backup codes, invalidating previous ones.
   *
   * @param password - The user's current password for confirmation
   * @returns New backup codes and a warning
   *
   * @example
   * ```ts
   * const result = await client.regenerateBackupCodes('mySecurePassword');
   * console.log(result.backup_codes); // Store securely!
   * ```
   */
  async regenerateBackupCodes(password: string): Promise<{ backup_codes: string[]; warning: string }> {
    return this.rest.post('/users/@me/mfa/regenerate-backup-codes', {
      body: { password },
    });
  }

  /**
   * Destroys the client, cleaning up resources and invalidating the token.
   */
  destroy(): void {
    this._destroyed = true;
    this._token = null;
    this.rest.setToken('');
    this.user = null;
    this.servers.cache.clear();
    this._readyAt = null;
    this.gateway.disconnect();

    this.emit(Events.Destroy);
    this.removeAllListeners();
  }

  /**
   * Sweep (evict) cached messages across all channels to free memory.
   * Uses the per-channel message cache size from `messageCacheMaxSize`.
   *
   * @param maxPerChannel - Override the maximum messages to keep per channel
   * @returns The total number of messages evicted
   *
   * @example
   * ```ts
   * // Sweep using the default max from options
   * const evicted = client.sweepMessages();
   * console.log(`Evicted ${evicted} cached messages`);
   *
   * // Sweep down to 10 messages per channel
   * client.sweepMessages(10);
   * ```
   */
  sweepMessages(maxPerChannel?: number): number {
    let total = 0;
    for (const server of this.servers.cache.values()) {
      if (!server.channels) continue;
      for (const channel of server.channels.cache.values()) {
        if (channel.messages) {
          total += channel.messages.sweep(maxPerChannel);
        }
      }
    }
    return total;
  }

  /**
   * Whether the client is ready (has authenticated and loaded).
   */
  get isReady(): boolean {
    return this._readyAt !== null && !this._destroyed;
  }

  /**
   * The timestamp when the client became ready, or `null`.
   */
  get readyAt(): Date | null {
    return this._readyAt;
  }

  /**
   * How long the client has been running (in milliseconds), or `null`.
   */
  get uptime(): number | null {
    if (!this._readyAt) return null;
    return Date.now() - this._readyAt.getTime();
  }

  /**
   * The bot's token. Returns a masked version for safety.
   */
  get token(): string | null {
    return this._token;
  }

  /**
   * Returns a human-readable summary of the client state.
   */
  toString(): string {
    if (!this.user) return 'RecoilClient (not logged in)';
    return `RecoilClient<${this.user.username}> (${this.servers.size} servers)`;
  }

  /**
   * JSON representation of the client state.
   */
  toJSON(): Record<string, unknown> {
    return {
      ready: this.isReady,
      user: this.user?.toJSON() ?? null,
      servers: this.servers.size,
      uptime: this.uptime,
    };
  }
}
