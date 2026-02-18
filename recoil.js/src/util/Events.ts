/**
 * @module recoil.js/util/Events
 * String constants for all events emitted by {@link RecoilClient}.
 *
 * ## Event Status
 *
 * **Active events** fire during normal REST-based client operation:
 * - `ready`, `error`, `debug`, `apiRequest`, `apiResponse`, `rateLimit`, `destroy`
 *
 * **Reserved events** are defined for forward compatibility with a future
 * WebSocket/gateway connection. They do NOT fire from REST operations:
 * - All domain events (servers, channels, messages, members, roles, etc.)
 *
 * @packageDocumentation
 */

/**
 * All events emitted by the RecoilClient.
 *
 * @example
 * ```ts
 * import { Events } from 'recoil.js';
 *
 * // Active — fires on login
 * client.on(Events.Ready, (client) => {
 *   console.log(`Bot is online as ${client.user!.username}!`);
 * });
 *
 * // Active — fires on every debug message
 * client.on(Events.Debug, (info) => {
 *   console.log(`[DEBUG] ${info}`);
 * });
 *
 * // Active — fires on errors
 * client.on(Events.Error, (error) => {
 *   console.error(`[ERROR] ${error.message}`);
 * });
 * ```
 */
export const Events = {
  // ── Lifecycle (ACTIVE) ─────────────────────────────────
  /** ✅ ACTIVE — Emitted when the client is fully initialized and ready */
  Ready: 'ready',
  /** ✅ ACTIVE — Emitted when an error occurs */
  Error: 'error',
  /** ✅ ACTIVE — Emitted for debug logging */
  Debug: 'debug',
  /** ✅ ACTIVE — Emitted on every API request (for monitoring) */
  ApiRequest: 'apiRequest',
  /** ✅ ACTIVE — Emitted on every API response */
  ApiResponse: 'apiResponse',
  /** ✅ ACTIVE — Emitted when a rate limit is hit */
  RateLimit: 'rateLimit',
  /** ✅ ACTIVE — Emitted when the client is destroyed/disconnected */
  Destroy: 'destroy',

  // ── Server (GATEWAY — reserved) ────────────────────────
  /** 🔮 RESERVED — Emitted when a server's data is updated */
  ServerUpdate: 'serverUpdate',
  /** 🔮 RESERVED — Emitted when the bot leaves or is removed from a server */
  ServerDelete: 'serverDelete',

  // ── Channel (GATEWAY — reserved) ───────────────────────
  /** 🔮 RESERVED — Emitted when a channel is created */
  ChannelCreate: 'channelCreate',
  /** 🔮 RESERVED — Emitted when a channel is updated */
  ChannelUpdate: 'channelUpdate',
  /** 🔮 RESERVED — Emitted when a channel is deleted */
  ChannelDelete: 'channelDelete',

  // ── Message (GATEWAY — reserved) ───────────────────────
  /** 🔮 RESERVED — Emitted when a new message is created */
  MessageCreate: 'messageCreate',
  /** 🔮 RESERVED — Emitted when a message is edited */
  MessageUpdate: 'messageUpdate',
  /** 🔮 RESERVED — Emitted when a message is deleted */
  MessageDelete: 'messageDelete',
  /** 🔮 RESERVED — Emitted when messages are bulk deleted */
  MessageBulkDelete: 'messageBulkDelete',

  // ── Member (GATEWAY — reserved) ────────────────────────
  /** 🔮 RESERVED — Emitted when a new member joins a server */
  MemberJoin: 'memberJoin',
  /** 🔮 RESERVED — Emitted when a member leaves or is removed from a server */
  MemberLeave: 'memberLeave',
  /** 🔮 RESERVED — Emitted when a member is updated (nickname, roles) */
  MemberUpdate: 'memberUpdate',

  // ── Role (GATEWAY — reserved) ──────────────────────────
  /** 🔮 RESERVED — Emitted when a role is created */
  RoleCreate: 'roleCreate',
  /** 🔮 RESERVED — Emitted when a role is updated */
  RoleUpdate: 'roleUpdate',
  /** 🔮 RESERVED — Emitted when a role is deleted */
  RoleDelete: 'roleDelete',

  // ── Reaction (GATEWAY — reserved) ──────────────────────
  /** 🔮 RESERVED — Emitted when a reaction is added to a message */
  ReactionAdd: 'reactionAdd',
  /** 🔮 RESERVED — Emitted when a reaction is removed from a message */
  ReactionRemove: 'reactionRemove',

  // ── Ban (GATEWAY — reserved) ───────────────────────────
  /** 🔮 RESERVED — Emitted when a user is banned */
  BanAdd: 'banAdd',
  /** 🔮 RESERVED — Emitted when a user is unbanned */
  BanRemove: 'banRemove',

  // ── Invite (GATEWAY — reserved) ────────────────────────
  /** 🔮 RESERVED — Emitted when an invite is created */
  InviteCreate: 'inviteCreate',
  /** 🔮 RESERVED — Emitted when an invite is deleted/revoked */
  InviteDelete: 'inviteDelete',

  // ── Thread (GATEWAY — reserved) ────────────────────────
  /** 🔮 RESERVED — Emitted when a thread is created */
  ThreadCreate: 'threadCreate',
  /** 🔮 RESERVED — Emitted when a thread is updated */
  ThreadUpdate: 'threadUpdate',
  /** 🔮 RESERVED — Emitted when a thread is deleted */
  ThreadDelete: 'threadDelete',

  // ── Presence (GATEWAY — reserved) ──────────────────────
  /** 🔮 RESERVED — Emitted when a user's presence (status) changes */
  PresenceUpdate: 'presenceUpdate',

  // ── Interaction (ACTIVE via Bot Gateway) ───────────────
  /** ✅ ACTIVE — Emitted when a user clicks a button on a bot embed */
  InteractionCreate: 'interactionCreate',
} as const;

/** Type for event names */
export type EventName = typeof Events[keyof typeof Events];
