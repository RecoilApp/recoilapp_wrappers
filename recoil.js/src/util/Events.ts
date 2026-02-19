/**
 * @module recoil.js/util/Events
 * String constants for all events emitted by {@link RecoilClient}.
 *
 * ## Event Status
 *
 * **Active events** fire during normal client operation via REST or the
 * Gateway v2 opcode-based protocol:
 * - Lifecycle: `ready`, `error`, `debug`, `destroy`
 * - REST: `apiRequest`, `apiResponse`, `rateLimit`
 * - Domain (via Gateway): all message, member, channel, role, reaction,
 *   ban, invite, thread, presence, and interaction events
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
 * client.on(Events.Ready, (client) => {
 *   console.log(`Bot is online as ${client.user!.username}!`);
 * });
 *
 * client.on(Events.MessageCreate, (message) => {
 *   if (message.content === '!ping') {
 *     message.reply('Pong!');
 *   }
 * });
 *
 * client.on(Events.MemberJoin, (member) => {
 *   console.log(`${member.username} joined!`);
 * });
 * ```
 */
export const Events = {
  // ── Lifecycle ──────────────────────────────────────────
  /** Emitted when the client is fully initialized and ready */
  Ready: 'ready',
  /** Emitted when an error occurs */
  Error: 'error',
  /** Emitted for debug logging */
  Debug: 'debug',
  /** Emitted on every API request (for monitoring) */
  ApiRequest: 'apiRequest',
  /** Emitted on every API response */
  ApiResponse: 'apiResponse',
  /** Emitted when a rate limit is hit */
  RateLimit: 'rateLimit',
  /** Emitted when the client is destroyed/disconnected */
  Destroy: 'destroy',

  // ── Server (via Gateway) ───────────────────────────────
  /** Emitted when a server's data is updated */
  ServerUpdate: 'serverUpdate',
  /** Emitted when the bot leaves or is removed from a server */
  ServerDelete: 'serverDelete',

  // ── Channel (via Gateway) ──────────────────────────────
  /** Emitted when a channel is created */
  ChannelCreate: 'channelCreate',
  /** Emitted when a channel is updated */
  ChannelUpdate: 'channelUpdate',
  /** Emitted when a channel is deleted */
  ChannelDelete: 'channelDelete',

  // ── Message (via Gateway) ──────────────────────────────
  /** Emitted when a new message is created */
  MessageCreate: 'messageCreate',
  /** Emitted when a message is edited */
  MessageUpdate: 'messageUpdate',
  /** Emitted when a message is deleted */
  MessageDelete: 'messageDelete',
  /** Emitted when messages are bulk deleted */
  MessageBulkDelete: 'messageBulkDelete',

  // ── Member (via Gateway) ───────────────────────────────
  /** Emitted when a new member joins a server */
  MemberJoin: 'memberJoin',
  /** Emitted when a member leaves or is removed from a server */
  MemberLeave: 'memberLeave',
  /** Emitted when a member is updated (nickname, roles) */
  MemberUpdate: 'memberUpdate',

  // ── Role (via Gateway) ─────────────────────────────────
  /** Emitted when a role is created */
  RoleCreate: 'roleCreate',
  /** Emitted when a role is updated */
  RoleUpdate: 'roleUpdate',
  /** Emitted when a role is deleted */
  RoleDelete: 'roleDelete',

  // ── Reaction (via Gateway) ─────────────────────────────
  /** Emitted when a reaction is added to a message */
  ReactionAdd: 'reactionAdd',
  /** Emitted when a reaction is removed from a message */
  ReactionRemove: 'reactionRemove',

  // ── Ban (via Gateway) ──────────────────────────────────
  /** Emitted when a user is banned */
  BanAdd: 'banAdd',
  /** Emitted when a user is unbanned */
  BanRemove: 'banRemove',

  // ── Invite (via Gateway) ───────────────────────────────
  /** Emitted when an invite is created */
  InviteCreate: 'inviteCreate',
  /** Emitted when an invite is deleted/revoked */
  InviteDelete: 'inviteDelete',

  // ── Thread (via Gateway) ───────────────────────────────
  /** Emitted when a thread is created */
  ThreadCreate: 'threadCreate',
  /** Emitted when a thread is updated */
  ThreadUpdate: 'threadUpdate',
  /** Emitted when a thread is deleted */
  ThreadDelete: 'threadDelete',

  // ── Presence (via Gateway) ─────────────────────────────
  /** Emitted when a user's presence (status) changes */
  PresenceUpdate: 'presenceUpdate',

  // ── Interaction (via Gateway) ──────────────────────────
  /** Emitted when a user clicks a button on a bot embed */
  InteractionCreate: 'interactionCreate',
} as const;

/** Type for event names */
export type EventName = typeof Events[keyof typeof Events];
