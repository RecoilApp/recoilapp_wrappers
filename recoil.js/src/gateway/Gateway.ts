/**
 * @module recoil.js/gateway/Gateway
 * WebSocket gateway client for receiving real-time events from the RecoilApp
 * Bot Gateway v2 (Socket.IO `/bot-gateway` namespace).
 *
 * Supports the full opcode-based protocol:
 *   - HELLO → IDENTIFY handshake
 *   - Heartbeat / keepalive with latency tracking
 *   - Intent-filtered event dispatch
 *   - Session resume on reconnect
 *   - All domain events (messages, members, channels, roles, etc.)
 *
 * The gateway connects automatically when {@link RecoilClient.login} is called,
 * and disconnects on {@link RecoilClient.destroy}.
 *
 * @packageDocumentation
 */

import { io, type Socket } from 'socket.io-client';
import type { RecoilClient } from '../client/RecoilClient';
import { ButtonInteraction } from '../structures/ButtonInteraction';
import { Message } from '../structures/Message';
import { Channel } from '../structures/Channel';
import { Member } from '../structures/Member';
import { Role } from '../structures/Role';
import { Ban } from '../structures/Ban';
import { Invite } from '../structures/Invite';
import { Thread } from '../structures/Thread';
import { Reaction } from '../structures/Reaction';
import { Events } from '../util/Events';
import { LIB_VERSION } from '../util/Constants';
import type {
  APIButtonInteraction, APIMessage, APIChannel, APIMember, APIBan,
  APIInvite, APIThread, APIRole, APIReaction, Snowflake
} from '../types';

// ═══════════════════════════════════════════════════════════
// GATEWAY OPCODES (must mirror server-side)
// ═══════════════════════════════════════════════════════════

/** Gateway opcodes matching the server-side protocol. */
export enum GatewayOpcode {
  // Server → Client
  DISPATCH            = 0,
  HEARTBEAT_REQUEST   = 1,
  HELLO               = 2,
  HEARTBEAT_ACK       = 3,
  RECONNECT           = 7,
  INVALID_SESSION     = 9,

  // Client → Server
  IDENTIFY            = 10,
  HEARTBEAT           = 11,
  RESUME              = 12,
  REQUEST_MEMBERS     = 13,
  VOICE_STATE_UPDATE  = 14,
  PRESENCE_UPDATE     = 15,
}

/** Gateway dispatch event names (the `t` field). */
export const GatewayDispatchEvents = {
  READY:                  'READY',
  RESUMED:                'RESUMED',
  SERVER_CREATE:          'SERVER_CREATE',
  SERVER_UPDATE:          'SERVER_UPDATE',
  SERVER_DELETE:          'SERVER_DELETE',
  CHANNEL_CREATE:         'CHANNEL_CREATE',
  CHANNEL_UPDATE:         'CHANNEL_UPDATE',
  CHANNEL_DELETE:         'CHANNEL_DELETE',
  MEMBER_JOIN:            'MEMBER_JOIN',
  MEMBER_LEAVE:           'MEMBER_LEAVE',
  MEMBER_UPDATE:          'MEMBER_UPDATE',
  MEMBER_CHUNK:           'MEMBER_CHUNK',
  BAN_ADD:                'BAN_ADD',
  BAN_REMOVE:             'BAN_REMOVE',
  MESSAGE_CREATE:         'MESSAGE_CREATE',
  MESSAGE_UPDATE:         'MESSAGE_UPDATE',
  MESSAGE_DELETE:         'MESSAGE_DELETE',
  MESSAGE_DELETE_BULK:    'MESSAGE_DELETE_BULK',
  REACTION_ADD:           'REACTION_ADD',
  REACTION_REMOVE:        'REACTION_REMOVE',
  ROLE_CREATE:            'ROLE_CREATE',
  ROLE_UPDATE:            'ROLE_UPDATE',
  ROLE_DELETE:            'ROLE_DELETE',
  INVITE_CREATE:          'INVITE_CREATE',
  INVITE_DELETE:          'INVITE_DELETE',
  THREAD_CREATE:          'THREAD_CREATE',
  THREAD_UPDATE:          'THREAD_UPDATE',
  THREAD_DELETE:          'THREAD_DELETE',
  TYPING_START:           'TYPING_START',
  PRESENCE_UPDATE:        'PRESENCE_UPDATE',
  INTERACTION_CREATE:     'INTERACTION_CREATE',
  EMOJI_CREATE:           'EMOJI_CREATE',
  EMOJI_UPDATE:           'EMOJI_UPDATE',
  EMOJI_DELETE:           'EMOJI_DELETE',
  WEBHOOK_UPDATE:         'WEBHOOK_UPDATE',
  MESSAGE_PIN:            'MESSAGE_PIN',
  MESSAGE_UNPIN:          'MESSAGE_UNPIN',
  DM_MESSAGE_CREATE:      'DM_MESSAGE_CREATE',
  DM_MESSAGE_UPDATE:      'DM_MESSAGE_UPDATE',
  DM_MESSAGE_DELETE:      'DM_MESSAGE_DELETE',
  DM_CHANNEL_CREATE:      'DM_CHANNEL_CREATE',
} as const;

/** Gateway payload envelope. */
interface GatewayPayload {
  op: GatewayOpcode;
  d: unknown;
  s?: number;
  t?: string;
}

/** Gateway connection states. */
export enum GatewayStatus {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Identifying = 'identifying',
  Ready = 'ready',
  Reconnecting = 'reconnecting',
  Resuming = 'resuming',
}

/**
 * Options for configuring the bot gateway connection.
 */
export interface GatewayOptions {
  /**
   * The WebSocket URL to connect to.
   * Defaults to deriving from the API base URL.
   */
  url?: string;

  /**
   * Auto-reconnect on disconnect.
   * @defaultValue `true`
   */
  autoReconnect?: boolean;

  /**
   * Maximum number of reconnection attempts.
   * @defaultValue `10`
   */
  maxReconnectAttempts?: number;

  /**
   * Reconnection delay in milliseconds.
   * @defaultValue `2000`
   */
  reconnectDelay?: number;

  /**
   * Heartbeat interval in milliseconds (overridden by HELLO payload).
   * @defaultValue `30000`
   */
  heartbeatInterval?: number;
}

const DEFAULT_GATEWAY_OPTIONS: Required<Omit<GatewayOptions, 'url'>> = {
  autoReconnect: true,
  maxReconnectAttempts: 10,
  reconnectDelay: 2000,
  heartbeatInterval: 30_000,
};

/**
 * Manages the WebSocket connection to the RecoilApp Bot Gateway v2.
 *
 * Implements the full opcode-based protocol:
 * 1. Connect with bot token → receive HELLO
 * 2. Send IDENTIFY with intents → receive READY dispatch
 * 3. Send HEARTBEAT at the interval from HELLO
 * 4. Receive DISPATCH events filtered by intents
 * 5. On disconnect, attempt RESUME with session_id + sequence
 *
 * All domain events (messages, members, channels, etc.) are automatically
 * dispatched as typed events on the parent {@link RecoilClient}.
 *
 * @example
 * ```ts
 * client.on('messageCreate', (message) => {
 *   if (message.content === '!ping') {
 *     await message.reply('Pong!');
 *   }
 * });
 *
 * client.on('memberJoin', (member) => {
 *   console.log(`${member.username} joined ${member.serverId}`);
 * });
 *
 * await client.login(token);
 * ```
 */
export class Gateway {
  /** Reference to the parent client. */
  public readonly client: RecoilClient;

  /** Current connection status. */
  public status: GatewayStatus = GatewayStatus.Disconnected;

  /** Resolved gateway options. */
  public readonly options: Required<Omit<GatewayOptions, 'url'>> & { url?: string };

  /** The underlying Socket.IO socket. */
  private _socket: Socket | null = null;

  /** Heartbeat interval timer. */
  private _heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  /** Heartbeat interval from the server HELLO payload (ms). */
  private _heartbeatIntervalMs: number = 30_000;

  /** Last heartbeat ACK timestamp for latency calculation. */
  private _lastHeartbeatAckAt = 0;

  /** Last heartbeat send timestamp. */
  private _lastHeartbeatSentAt = 0;

  /** Whether we've received a heartbeat ACK since the last heartbeat. */
  private _heartbeatAcked = true;

  /** The measured gateway latency in milliseconds. */
  public ping = -1;

  /** Last received sequence number (used for heartbeat and resume). */
  private _sequence: number | null = null;

  /** The session ID from the READY dispatch (used for resume). */
  private _sessionId: string | null = null;

  /** The resume gateway URL from READY (if provided). */
  private _resumeGatewayUrl: string | null = null;

  /** The bot token (stored for IDENTIFY/RESUME). */
  private _token: string | null = null;

  /** Whether we should attempt to resume on next reconnect. */
  private _canResume = false;

  constructor(client: RecoilClient, options: GatewayOptions = {}) {
    this.client = client;
    this.options = {
      ...DEFAULT_GATEWAY_OPTIONS,
      ...options,
    };
  }

  /**
   * Connect to the Bot Gateway.
   *
   * @param token - The bot token used for authentication.
   */
  connect(token: string): void {
    if (this._socket?.connected) {
      this.client.emit(Events.Debug, '[Gateway] Already connected, skipping.');
      return;
    }

    this._token = token;
    this.status = GatewayStatus.Connecting;
    this.client.emit(Events.Debug, '[Gateway] Connecting to bot gateway v2...');

    const gatewayUrl = this._resolveGatewayUrl();

    this._socket = io(`${gatewayUrl}/bot-gateway`, {
      auth: { token: `Bot ${token}` },
      transports: ['websocket', 'polling'],
      reconnection: this.options.autoReconnect,
      reconnectionAttempts: this.options.maxReconnectAttempts,
      reconnectionDelay: this.options.reconnectDelay,
      timeout: 10_000,
    });

    this._bindEvents();
  }

  /**
   * Disconnect from the Bot Gateway.
   */
  disconnect(): void {
    this.client.emit(Events.Debug, '[Gateway] Disconnecting...');
    this._stopHeartbeat();
    this._canResume = false;
    this._sessionId = null;
    this._sequence = null;

    if (this._socket) {
      this._socket.removeAllListeners();
      this._socket.disconnect();
      this._socket = null;
    }

    this.status = GatewayStatus.Disconnected;
    this.ping = -1;
  }

  /**
   * Whether the gateway is currently connected and ready.
   */
  get connected(): boolean {
    return this._socket?.connected === true;
  }

  /**
   * Whether the gateway has completed the IDENTIFY handshake.
   */
  get ready(): boolean {
    return this.status === GatewayStatus.Ready;
  }

  /**
   * The current session ID (null if not identified).
   */
  get sessionId(): string | null {
    return this._sessionId;
  }

  /**
   * The last received sequence number.
   */
  get sequence(): number | null {
    return this._sequence;
  }

  /**
   * Send a raw gateway payload.
   * @internal
   */
  private _send(op: GatewayOpcode, d: unknown): void {
    if (!this._socket?.connected) return;
    this._socket.emit('gateway', { op, d });
  }

  /**
   * Send IDENTIFY to the gateway.
   */
  private _identify(): void {
    if (!this._token) return;

    this.status = GatewayStatus.Identifying;
    this.client.emit(Events.Debug, '[Gateway] Sending IDENTIFY...');

    this._send(GatewayOpcode.IDENTIFY, {
      token: this._token,
      intents: this.client.intents.bitfield.toString(),
      properties: {
        os: typeof process !== 'undefined' ? process.platform : 'unknown',
        library: 'recoil.js',
        library_version: LIB_VERSION,
      },
    });
  }

  /**
   * Send RESUME to the gateway.
   */
  private _resume(): void {
    if (!this._token || !this._sessionId) return;

    this.status = GatewayStatus.Resuming;
    this.client.emit(Events.Debug, `[Gateway] Sending RESUME (session: ${this._sessionId}, seq: ${this._sequence})...`);

    this._send(GatewayOpcode.RESUME, {
      token: this._token,
      session_id: this._sessionId,
      seq: this._sequence ?? 0,
    });
  }

  /**
   * Resolve the gateway WebSocket URL from the API base.
   */
  private _resolveGatewayUrl(): string {
    // Use resume URL if available and we're resuming
    if (this._canResume && this._resumeGatewayUrl) {
      return this._resumeGatewayUrl;
    }

    if (this.options.url) return this.options.url;

    const apiBase = this.client.options.apiBaseUrl ?? this.client.rest['apiBase'] ?? '';
    try {
      const url = new URL(apiBase);
      return url.origin;
    } catch {
      return apiBase.replace(/\/api\/v\d+\/?$/, '');
    }
  }

  /**
   * Bind Socket.IO event handlers.
   */
  private _bindEvents(): void {
    const socket = this._socket!;

    // ── Connection lifecycle ────────────────────────────

    socket.on('connect', () => {
      this.status = GatewayStatus.Connected;
      this.client.emit(Events.Debug, `[Gateway] Connected (socket: ${socket.id})`);
      // Wait for HELLO before IDENTIFY — HELLO triggers the handshake
    });

    socket.on('disconnect', (reason: string) => {
      this._stopHeartbeat();

      if (reason === 'io client disconnect') {
        // Intentional disconnect — don't resume
        this.status = GatewayStatus.Disconnected;
        this._canResume = false;
      } else {
        // Unexpected disconnect — attempt resume on reconnect
        this.status = GatewayStatus.Reconnecting;
        this._canResume = this._sessionId !== null;
      }

      this.client.emit(Events.Debug, `[Gateway] Disconnected: ${reason} (canResume: ${this._canResume})`);
    });

    socket.on('connect_error', (error: Error) => {
      this.client.emit(Events.Debug, `[Gateway] Connection error: ${error.message}`);
      this.client.emit(Events.Error, error);
    });

    socket.io.on('reconnect', (attempt: number) => {
      this.status = GatewayStatus.Connected;
      this.client.emit(Events.Debug, `[Gateway] Reconnected after ${attempt} attempt(s)`);
      // HELLO will be sent by server, which triggers IDENTIFY or RESUME
    });

    socket.io.on('reconnect_failed', () => {
      this.status = GatewayStatus.Disconnected;
      this._canResume = false;
      this.client.emit(Events.Debug, '[Gateway] Reconnection failed — giving up');
      this.client.emit(Events.Error, new Error('Gateway reconnection failed'));
    });

    // ── v2 Opcode-based protocol ────────────────────────

    socket.on('gateway', (payload: GatewayPayload) => {
      this._handleGatewayPayload(payload);
    });

    // ── Legacy v1 support (backward compat) ─────────────

    socket.on('pong_gateway', () => {
      this.ping = Date.now() - this._lastHeartbeatSentAt;
    });

    socket.on('button_interaction', (payload: APIButtonInteraction) => {
      this.client.emit(Events.Debug, `[Gateway] Legacy button_interaction: ${payload.custom_id}`);
      try {
        const interaction = new ButtonInteraction(this.client, payload);
        this.client.emit(Events.InteractionCreate, interaction);
      } catch (error) {
        this.client.emit(Events.Error, error as Error);
      }
    });

    // ── Gateway close (server-initiated) ────────────────

    socket.on('gateway_close', (data: { code: number; reason: string }) => {
      this.client.emit(Events.Debug, `[Gateway] Server close: ${data.code} — ${data.reason}`);

      // Non-resumable close codes should reset session
      const nonResumable = [4004, 4005, 4014, 4015]; // AUTH_FAILED, ALREADY_AUTH, DISALLOWED_INTENTS, TOKEN_REVOKED
      if (nonResumable.includes(data.code)) {
        this._canResume = false;
        this._sessionId = null;
        this._sequence = null;
      }
    });
  }

  /**
   * Handle an incoming v2 gateway payload.
   */
  private _handleGatewayPayload(payload: GatewayPayload): void {
    if (!payload || typeof payload.op !== 'number') return;

    switch (payload.op) {
      case GatewayOpcode.HELLO:
        this._handleHello(payload.d as { heartbeat_interval: number });
        break;

      case GatewayOpcode.DISPATCH:
        this._handleDispatch(payload);
        break;

      case GatewayOpcode.HEARTBEAT_ACK:
        this._handleHeartbeatAck();
        break;

      case GatewayOpcode.HEARTBEAT_REQUEST:
        // Server is requesting an immediate heartbeat
        this._sendHeartbeat();
        break;

      case GatewayOpcode.RECONNECT:
        this.client.emit(Events.Debug, '[Gateway] Server requested reconnect');
        this._canResume = true;
        this._socket?.disconnect();
        break;

      case GatewayOpcode.INVALID_SESSION:
        this.client.emit(Events.Debug, `[Gateway] Invalid session (resumable: ${payload.d})`);
        this._canResume = payload.d === true;
        if (!this._canResume) {
          this._sessionId = null;
          this._sequence = null;
        }
        // Re-identify after a short delay
        setTimeout(() => this._identify(), 1000 + Math.random() * 4000);
        break;

      default:
        this.client.emit(Events.Debug, `[Gateway] Unknown opcode: ${payload.op}`);
    }
  }

  /**
   * Handle HELLO — start heartbeat and send IDENTIFY or RESUME.
   */
  private _handleHello(data: { heartbeat_interval: number }): void {
    this._heartbeatIntervalMs = data.heartbeat_interval ?? 30_000;
    this.client.emit(Events.Debug, `[Gateway] HELLO received (heartbeat: ${this._heartbeatIntervalMs}ms)`);

    this._startHeartbeat();

    // Decide whether to IDENTIFY or RESUME
    if (this._canResume && this._sessionId) {
      this._resume();
    } else {
      this._identify();
    }
  }

  /**
   * Handle a DISPATCH event — the core event router.
   */
  private _handleDispatch(payload: GatewayPayload): void {
    // Update sequence number
    if (payload.s !== undefined && payload.s !== null) {
      this._sequence = payload.s;
    }

    const event = payload.t;
    const data = payload.d as Record<string, unknown>;

    if (!event) return;

    this.client.emit(Events.Debug, `[Gateway] DISPATCH ${event} (seq: ${payload.s})`);

    try {
      switch (event) {
        case GatewayDispatchEvents.READY:
          this._handleReady(data);
          break;

        case GatewayDispatchEvents.RESUMED:
          this.status = GatewayStatus.Ready;
          this._canResume = false;
          this.client.emit(Events.Debug, '[Gateway] Session resumed successfully');
          break;

        // ── Messages ──────────────────────────────────
        case GatewayDispatchEvents.MESSAGE_CREATE:
          this._handleMessageCreate(data as unknown as APIMessage & { server_id: string });
          break;

        case GatewayDispatchEvents.MESSAGE_UPDATE:
          this._handleMessageUpdate(data as unknown as APIMessage & { server_id: string });
          break;

        case GatewayDispatchEvents.MESSAGE_DELETE:
          this.client.emit(Events.MessageDelete, data.id as string, data.channel_id as string);
          break;

        case GatewayDispatchEvents.MESSAGE_DELETE_BULK:
          this.client.emit(Events.MessageBulkDelete, data.ids as string[], data.channel_id as string);
          break;

        // ── Members ───────────────────────────────────
        case GatewayDispatchEvents.MEMBER_JOIN:
          this._handleMemberJoin(data);
          break;

        case GatewayDispatchEvents.MEMBER_LEAVE:
          this._handleMemberLeave(data);
          break;

        case GatewayDispatchEvents.MEMBER_UPDATE:
          this._handleMemberUpdate(data);
          break;

        // ── Channels ──────────────────────────────────
        case GatewayDispatchEvents.CHANNEL_CREATE:
          this._handleChannelCreate(data as unknown as APIChannel);
          break;

        case GatewayDispatchEvents.CHANNEL_UPDATE:
          this._handleChannelUpdate(data as unknown as APIChannel);
          break;

        case GatewayDispatchEvents.CHANNEL_DELETE:
          this._handleChannelDelete(data);
          break;

        // ── Roles ─────────────────────────────────────
        case GatewayDispatchEvents.ROLE_CREATE:
          this._handleRoleEvent(data, Events.RoleCreate);
          break;

        case GatewayDispatchEvents.ROLE_UPDATE:
          this._handleRoleEvent(data, Events.RoleUpdate);
          break;

        case GatewayDispatchEvents.ROLE_DELETE:
          this.client.emit(Events.RoleDelete, data.id as string, data.server_id as string);
          break;

        // ── Reactions ─────────────────────────────────
        case GatewayDispatchEvents.REACTION_ADD:
          this.client.emit(
            Events.ReactionAdd,
            new Reaction(this.client, {
              emoji: data.emoji as string,
              count: 1,
              users: [{ user_id: data.user_id as string }],
            }),
            data.message_id as string,
            data.channel_id as string,
          );
          break;

        case GatewayDispatchEvents.REACTION_REMOVE:
          this.client.emit(
            Events.ReactionRemove,
            data.emoji as string,
            data.user_id as string,
            data.message_id as string,
            data.channel_id as string,
          );
          break;

        // ── Bans ──────────────────────────────────────
        case GatewayDispatchEvents.BAN_ADD:
          this.client.emit(Events.BanAdd, new Ban(this.client, data as unknown as APIBan));
          break;

        case GatewayDispatchEvents.BAN_REMOVE:
          this.client.emit(Events.BanRemove, data.user_id as string, data.server_id as string);
          break;

        // ── Invites ───────────────────────────────────
        case GatewayDispatchEvents.INVITE_CREATE:
          this.client.emit(Events.InviteCreate, new Invite(this.client, data as unknown as APIInvite));
          break;

        case GatewayDispatchEvents.INVITE_DELETE:
          this.client.emit(Events.InviteDelete, data.id as string, data.server_id as string);
          break;

        // ── Threads ───────────────────────────────────
        case GatewayDispatchEvents.THREAD_CREATE:
          this.client.emit(Events.ThreadCreate, new Thread(this.client, data as unknown as APIThread));
          break;

        case GatewayDispatchEvents.THREAD_UPDATE:
          this.client.emit(Events.ThreadUpdate, new Thread(this.client, data as unknown as APIThread));
          break;

        case GatewayDispatchEvents.THREAD_DELETE:
          this.client.emit(Events.ThreadDelete, data.id as string, data.channel_id as string);
          break;

        // ── Presence ──────────────────────────────────
        case GatewayDispatchEvents.PRESENCE_UPDATE:
          this.client.emit(Events.PresenceUpdate, data.user_id as string, data.status as string, data.server_id as string);
          break;

        // ── Interactions ──────────────────────────────
        case GatewayDispatchEvents.INTERACTION_CREATE:
          this._handleInteraction(data as unknown as APIButtonInteraction);
          break;

        // ── Server ────────────────────────────────────
        case GatewayDispatchEvents.SERVER_UPDATE:
          this._handleServerUpdate(data);
          break;

        case GatewayDispatchEvents.SERVER_DELETE:
          this._handleServerDelete(data);
          break;

        default:
          this.client.emit(Events.Debug, `[Gateway] Unhandled dispatch event: ${event}`);
      }
    } catch (error) {
      this.client.emit(Events.Debug, `[Gateway] Error handling ${event}: ${(error as Error).message}`);
      this.client.emit(Events.Error, error as Error);
    }
  }

  // ═══════════════════════════════════════════════════════
  // EVENT HANDLERS
  // ═══════════════════════════════════════════════════════

  private _handleReady(data: Record<string, unknown>): void {
    this.status = GatewayStatus.Ready;
    this._canResume = false;

    // Store session info for resume
    this._sessionId = data.session_id as string || null;
    this._resumeGatewayUrl = data.resume_gateway_url as string || null;

    this.client.emit(Events.Debug, `[Gateway] READY (session: ${this._sessionId})`);
  }

  private _handleMessageCreate(data: APIMessage & { server_id?: string }): void {
    // Try to add to channel cache if the channel manager exists
    const serverId = data.server_id;
    let message: Message;

    if (serverId) {
      const server = this.client.servers.cache.get(serverId);
      const channel = server?.channels?.cache.get(data.channel_id);
      if (channel?.messages) {
        message = channel.messages._add(data);
      } else {
        message = new Message(this.client, data);
      }
    } else {
      message = new Message(this.client, data);
    }

    this.client.emit(Events.MessageCreate, message);
  }

  private _handleMessageUpdate(data: APIMessage & { server_id?: string }): void {
    const serverId = data.server_id;
    let message: Message;

    if (serverId) {
      const server = this.client.servers.cache.get(serverId);
      const channel = server?.channels?.cache.get(data.channel_id);
      if (channel?.messages) {
        message = channel.messages._add(data);
      } else {
        message = new Message(this.client, data);
      }
    } else {
      message = new Message(this.client, data);
    }

    this.client.emit(Events.MessageUpdate, message);
  }

  private _handleMemberJoin(data: Record<string, unknown>): void {
    const serverId = data.server_id as string;
    const server = this.client.servers.cache.get(serverId);
    let member: Member;

    if (server?.members) {
      member = server.members._add(data as unknown as APIMember);
    } else {
      member = new Member(this.client, serverId, data as unknown as APIMember);
    }

    // Update server member count
    if (server) server.memberCount++;

    this.client.emit(Events.MemberJoin, member);
  }

  private _handleMemberLeave(data: Record<string, unknown>): void {
    const serverId = data.server_id as string;
    const userId = data.user_id as string;
    const server = this.client.servers.cache.get(serverId);

    // Remove from cache
    server?.members?.cache.delete(userId);
    if (server) server.memberCount = Math.max(0, server.memberCount - 1);

    this.client.emit(Events.MemberLeave, userId, serverId);
  }

  private _handleMemberUpdate(data: Record<string, unknown>): void {
    const serverId = data.server_id as string;
    const server = this.client.servers.cache.get(serverId);
    let member: Member;

    if (server?.members) {
      member = server.members._add(data as unknown as APIMember);
    } else {
      member = new Member(this.client, serverId, data as unknown as APIMember);
    }

    this.client.emit(Events.MemberUpdate, member);
  }

  private _handleChannelCreate(data: APIChannel): void {
    const serverId = data.server_id;
    const server = this.client.servers.cache.get(serverId);
    let channel: Channel;

    if (server?.channels) {
      channel = server.channels._add(data);
      server.channelCount++;
    } else {
      channel = new Channel(this.client, data);
    }

    this.client.emit(Events.ChannelCreate, channel);
  }

  private _handleChannelUpdate(data: APIChannel): void {
    const serverId = data.server_id;
    const server = this.client.servers.cache.get(serverId);
    let channel: Channel;

    if (server?.channels) {
      channel = server.channels._add(data);
    } else {
      channel = new Channel(this.client, data);
    }

    this.client.emit(Events.ChannelUpdate, channel);
  }

  private _handleChannelDelete(data: Record<string, unknown>): void {
    const channelId = data.id as string;
    const serverId = data.server_id as string;
    const server = this.client.servers.cache.get(serverId);

    server?.channels?.cache.delete(channelId);
    if (server) server.channelCount = Math.max(0, server.channelCount - 1);

    this.client.emit(Events.ChannelDelete, channelId, serverId);
  }

  private _handleRoleEvent(data: Record<string, unknown>, eventName: string): void {
    const serverId = data.server_id as string;
    const server = this.client.servers.cache.get(serverId);
    const role = new Role(this.client, data as unknown as APIRole);

    // Update cache
    server?.roles?.cache.set(role.id, role);

    if (eventName === Events.RoleCreate) {
      this.client.emit(Events.RoleCreate, role);
    } else {
      this.client.emit(Events.RoleUpdate, role);
    }
  }

  private _handleInteraction(data: APIButtonInteraction): void {
    const interaction = new ButtonInteraction(this.client, data);
    this.client.emit(Events.InteractionCreate, interaction);
  }

  private _handleServerUpdate(data: Record<string, unknown>): void {
    const serverId = data.id as string;
    const server = this.client.servers.cache.get(serverId);
    if (server) {
      server._patch(data as Record<string, unknown> & { id: string });
      this.client.emit(Events.ServerUpdate, server);
    }
  }

  private _handleServerDelete(data: Record<string, unknown>): void {
    const serverId = data.id as string;
    this.client.servers.cache.delete(serverId);
    this.client.emit(Events.ServerDelete, serverId);
  }

  // ═══════════════════════════════════════════════════════
  // HEARTBEAT
  // ═══════════════════════════════════════════════════════

  /**
   * Send a heartbeat to the gateway.
   */
  private _sendHeartbeat(): void {
    if (!this._socket?.connected) return;

    if (!this._heartbeatAcked) {
      // Missed ACK — connection may be zombie, reconnect
      this.client.emit(Events.Debug, '[Gateway] Heartbeat ACK missed — reconnecting');
      this._canResume = this._sessionId !== null;
      this._socket.disconnect();
      return;
    }

    this._heartbeatAcked = false;
    this._lastHeartbeatSentAt = Date.now();
    this._send(GatewayOpcode.HEARTBEAT, { seq: this._sequence });

    // Also send legacy ping for backward compat
    this._socket.emit('ping_gateway');
  }

  /**
   * Handle HEARTBEAT_ACK from the server.
   */
  private _handleHeartbeatAck(): void {
    this._heartbeatAcked = true;
    this._lastHeartbeatAckAt = Date.now();
    this.ping = this._lastHeartbeatAckAt - this._lastHeartbeatSentAt;
  }

  /**
   * Start the heartbeat loop.
   */
  private _startHeartbeat(): void {
    this._stopHeartbeat();
    this._heartbeatAcked = true;

    // Send first heartbeat after a jittered delay
    const jitter = Math.random() * this._heartbeatIntervalMs;
    setTimeout(() => {
      this._sendHeartbeat();
      this._heartbeatTimer = setInterval(
        () => this._sendHeartbeat(),
        this._heartbeatIntervalMs,
      );
    }, jitter);
  }

  /**
   * Stop the heartbeat loop.
   */
  private _stopHeartbeat(): void {
    if (this._heartbeatTimer) {
      clearInterval(this._heartbeatTimer);
      this._heartbeatTimer = null;
    }
  }
}
