/**
 * @module recoil.js/gateway/Gateway
 * WebSocket gateway client for receiving real-time events from the RecoilApp
 * Bot Gateway (Socket.IO `/bot-gateway` namespace).
 *
 * The gateway connects automatically when {@link RecoilClient.login} is called,
 * and disconnects on {@link RecoilClient.destroy}.
 *
 * @packageDocumentation
 */

import { io, type Socket } from 'socket.io-client';
import type { RecoilClient } from '../client/RecoilClient';
import { ButtonInteraction } from '../structures/ButtonInteraction';
import { Events } from '../util/Events';
import type { APIButtonInteraction } from '../types';

/** Gateway connection states. */
export enum GatewayStatus {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Reconnecting = 'reconnecting',
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
   * Heartbeat interval in milliseconds.
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
 * Manages the WebSocket connection to the RecoilApp Bot Gateway.
 *
 * Receives real-time events (button interactions, etc.) and dispatches
 * them as typed events on the parent {@link RecoilClient}.
 *
 * @example
 * ```ts
 * // The gateway is managed automatically by RecoilClient.
 * // After login, it connects and starts receiving events:
 *
 * client.on('interactionCreate', (interaction) => {
 *   console.log(`${interaction.user.username} clicked ${interaction.customId}`);
 * });
 *
 * await client.login(token);
 * // Gateway is now connected and listening for events.
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

  /** Ping timestamp for latency calculation. */
  private _lastPingAt = 0;

  /** The measured gateway latency in milliseconds. */
  public ping = -1;

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

    this.status = GatewayStatus.Connecting;
    this.client.emit(Events.Debug, '[Gateway] Connecting to bot gateway...');

    // Derive the gateway URL from the API base URL.
    // API base is like https://recoilapp.com/api/v1 — gateway is at the origin root.
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

    if (this._socket) {
      this._socket.removeAllListeners();
      this._socket.disconnect();
      this._socket = null;
    }

    this.status = GatewayStatus.Disconnected;
    this.ping = -1;
  }

  /**
   * Whether the gateway is currently connected.
   */
  get connected(): boolean {
    return this._socket?.connected === true;
  }

  /**
   * Resolve the gateway WebSocket URL from the API base.
   */
  private _resolveGatewayUrl(): string {
    if (this.options.url) return this.options.url;

    // API base might be like "https://recoilapp.com/api/v1"
    // We need just the origin "https://recoilapp.com"
    const apiBase = this.client.options.apiBaseUrl ?? this.client.rest['apiBase'] ?? '';
    try {
      const url = new URL(apiBase);
      return url.origin;
    } catch {
      // Fallback: strip /api/v1 suffix
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
      this._startHeartbeat();
    });

    socket.on('disconnect', (reason: string) => {
      this.status = reason === 'io client disconnect'
        ? GatewayStatus.Disconnected
        : GatewayStatus.Reconnecting;
      this.client.emit(Events.Debug, `[Gateway] Disconnected: ${reason}`);
      this._stopHeartbeat();
    });

    socket.on('connect_error', (error: Error) => {
      this.client.emit(Events.Debug, `[Gateway] Connection error: ${error.message}`);
      this.client.emit(Events.Error, error);
    });

    socket.io.on('reconnect', (attempt: number) => {
      this.status = GatewayStatus.Connected;
      this.client.emit(Events.Debug, `[Gateway] Reconnected after ${attempt} attempt(s)`);
      this._startHeartbeat();
    });

    socket.io.on('reconnect_failed', () => {
      this.status = GatewayStatus.Disconnected;
      this.client.emit(Events.Debug, '[Gateway] Reconnection failed — giving up');
      this.client.emit(Events.Error, new Error('Gateway reconnection failed'));
    });

    // ── Heartbeat ───────────────────────────────────────

    socket.on('pong_gateway', () => {
      this.ping = Date.now() - this._lastPingAt;
      this.client.emit(Events.Debug, `[Gateway] Pong (latency: ${this.ping}ms)`);
    });

    // ── Domain events ───────────────────────────────────

    socket.on('button_interaction', (payload: APIButtonInteraction) => {
      this.client.emit(Events.Debug, `[Gateway] button_interaction: ${payload.custom_id} from ${payload.user?.username ?? 'unknown'}`);

      try {
        const interaction = new ButtonInteraction(this.client, payload);
        this.client.emit(Events.InteractionCreate, interaction);
      } catch (error) {
        this.client.emit(Events.Debug, `[Gateway] Failed to construct ButtonInteraction: ${(error as Error).message}`);
        this.client.emit(Events.Error, error as Error);
      }
    });
  }

  /**
   * Start the heartbeat loop.
   */
  private _startHeartbeat(): void {
    this._stopHeartbeat();
    this._heartbeatTimer = setInterval(() => {
      if (this._socket?.connected) {
        this._lastPingAt = Date.now();
        this._socket.emit('ping_gateway');
      }
    }, this.options.heartbeatInterval);
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
