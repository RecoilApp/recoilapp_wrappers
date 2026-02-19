/**
 * @module recoil.js/client/ClientEvents
 * Typed event map for {@link RecoilClient}.
 *
 * Provides full TypeScript intellisense and type checking for
 * `client.on()`, `client.once()`, and `client.emit()`.
 *
 * ## Event Categories
 *
 * ### Lifecycle Events
 * - `ready` — Client authenticated and loaded
 * - `error` — An error occurred
 * - `debug` — Debug information
 * - `rateLimit` — A rate limit was hit
 * - `destroy` — Client was destroyed
 *
 * ### REST Events
 * - `apiRequest` — An API request was made
 * - `apiResponse` — An API response was received
 *
 * ### Domain Events (via Gateway v2)
 * These events are received via the opcode-based Gateway connection:
 * - `messageCreate`, `messageUpdate`, `messageDelete`, `messageBulkDelete`
 * - `memberJoin`, `memberLeave`, `memberUpdate`
 * - `channelCreate`, `channelUpdate`, `channelDelete`
 * - `roleCreate`, `roleUpdate`, `roleDelete`
 * - `reactionAdd`, `reactionRemove`
 * - `banAdd`, `banRemove`
 * - `inviteCreate`, `inviteDelete`
 * - `threadCreate`, `threadUpdate`, `threadDelete`
 * - `presenceUpdate`
 * - `interactionCreate`
 *
 * @packageDocumentation
 */

import type { RecoilClient } from './RecoilClient';
import type { Message } from '../structures/Message';
import type { Server } from '../structures/Server';
import type { Channel } from '../structures/Channel';
import type { Member } from '../structures/Member';
import type { Role } from '../structures/Role';
import type { Ban } from '../structures/Ban';
import type { Invite } from '../structures/Invite';
import type { Thread } from '../structures/Thread';
import type { Reaction } from '../structures/Reaction';
import type { ButtonInteraction } from '../structures/ButtonInteraction';
import type { Snowflake } from '../types';

/**
 * Rate limit event data.
 */
export interface RateLimitData {
  /** The route that was rate limited */
  route: string;
  /** The HTTP method */
  method: string;
  /** Time to wait in milliseconds */
  retryAfter: number;
  /** Whether this is a global rate limit */
  global: boolean;
  /** The rate limit bucket */
  bucket: string;
}

/**
 * API request event data.
 */
export interface ApiRequestData {
  /** HTTP method */
  method: string;
  /** Request path */
  path: string;
  /** Request body (if any) */
  body?: unknown;
}

/**
 * API response event data.
 */
export interface ApiResponseData {
  /** HTTP method */
  method: string;
  /** Request path */
  path: string;
  /** HTTP status code */
  status: number;
  /** Response time in milliseconds */
  latency: number;
}

/**
 * Full typed event map for the RecoilClient.
 *
 * @example
 * ```ts
 * // TypeScript knows the callback signature!
 * client.on('ready', (client) => {
 *   // client is typed as RecoilClient
 *   console.log(client.user!.username);
 * });
 *
 * client.on('debug', (info) => {
 *   // info is typed as string
 *   console.log(`[DEBUG] ${info}`);
 * });
 *
 * client.on('error', (error) => {
 *   // error is typed as Error
 *   console.error(error.message);
 * });
 * ```
 */
export interface ClientEvents {
  // ── Lifecycle ─────────────────────────────────────────
  /** Emitted when the client is fully authenticated and ready */
  ready: [client: RecoilClient];
  /** Emitted when an error occurs */
  error: [error: Error];
  /** Emitted for debug information */
  debug: [info: string];
  /** Emitted when the client is destroyed */
  destroy: [];

  // ── REST ──────────────────────────────────────────────
  /** Emitted when an API request is made */
  apiRequest: [data: ApiRequestData];
  /** Emitted when an API response is received */
  apiResponse: [data: ApiResponseData];
  /** Emitted when a rate limit is encountered */
  rateLimit: [data: RateLimitData];

  // ── Server ────────────────────────────────────────────
  /** Emitted when a server's data is updated */
  serverUpdate: [server: Server];
  /** Emitted when the bot is removed from a server */
  serverDelete: [serverId: Snowflake];

  // ── Channel ───────────────────────────────────────────
  /** Emitted when a channel is created */
  channelCreate: [channel: Channel];
  /** Emitted when a channel is updated */
  channelUpdate: [channel: Channel];
  /** Emitted when a channel is deleted */
  channelDelete: [channelId: Snowflake, serverId: Snowflake];

  // ── Message ───────────────────────────────────────────
  /** Emitted when a new message is created */
  messageCreate: [message: Message];
  /** Emitted when a message is edited */
  messageUpdate: [message: Message];
  /** Emitted when a message is deleted */
  messageDelete: [messageId: Snowflake, channelId: Snowflake];
  /** Emitted when messages are bulk deleted */
  messageBulkDelete: [messageIds: Snowflake[], channelId: Snowflake];

  // ── Member ────────────────────────────────────────────
  /** Emitted when a member joins a server */
  memberJoin: [member: Member];
  /** Emitted when a member leaves a server */
  memberLeave: [userId: Snowflake, serverId: Snowflake];
  /** Emitted when a member is updated */
  memberUpdate: [member: Member];

  // ── Role ──────────────────────────────────────────────
  /** Emitted when a role is created */
  roleCreate: [role: Role];
  /** Emitted when a role is updated */
  roleUpdate: [role: Role];
  /** Emitted when a role is deleted */
  roleDelete: [roleId: Snowflake, serverId: Snowflake];

  // ── Reaction ──────────────────────────────────────────
  /** Emitted when a reaction is added */
  reactionAdd: [reaction: Reaction, messageId: Snowflake, channelId: Snowflake];
  /** Emitted when a reaction is removed */
  reactionRemove: [emoji: string, userId: Snowflake, messageId: Snowflake, channelId: Snowflake];

  // ── Ban ───────────────────────────────────────────────
  /** Emitted when a user is banned */
  banAdd: [ban: Ban];
  /** Emitted when a user is unbanned */
  banRemove: [userId: Snowflake, serverId: Snowflake];

  // ── Invite ────────────────────────────────────────────
  /** Emitted when an invite is created */
  inviteCreate: [invite: Invite];
  /** Emitted when an invite is deleted */
  inviteDelete: [inviteId: Snowflake, serverId: Snowflake];

  // ── Thread ────────────────────────────────────────────
  /** Emitted when a thread is created */
  threadCreate: [thread: Thread];
  /** Emitted when a thread is updated */
  threadUpdate: [thread: Thread];
  /** Emitted when a thread is deleted */
  threadDelete: [threadId: Snowflake, channelId: Snowflake];

  // ── Presence ──────────────────────────────────────────
  /** Emitted when a user's presence changes */
  presenceUpdate: [userId: Snowflake, status: string, serverId: Snowflake];

  // ── Interaction ───────────────────────────────────────
  /** Emitted when a user clicks a button on a bot embed */
  interactionCreate: [interaction: ButtonInteraction];
}

/**
 * All valid event names for the client.
 */
export type ClientEventName = keyof ClientEvents;
