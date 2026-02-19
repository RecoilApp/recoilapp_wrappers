/**
 * @module recoil.js/rest/Routes
 * Helper functions for constructing API route paths.
 * All paths are relative to the API base URL (`/api/v1`).
 *
 * @example
 * ```ts
 * Routes.channel('abc-123');          // '/channels/abc-123'
 * Routes.channelMessages('abc-123');  // '/channels/abc-123/messages'
 * Routes.serverMembers('xyz-789');    // '/servers/xyz-789/members'
 * ```
 *
 * @packageDocumentation
 */

import type { Snowflake } from '../types';

/**
 * Static class containing all API route builder methods.
 * Every method returns a string path suitable for use with {@link RESTManager}.
 */
export const Routes = {

  // ── Bot Self ────────────────────────────────────────────

  /** `GET/PATCH /@me` — Bot's own user */
  botUser: () => '/@me' as const,

  // ── Servers ─────────────────────────────────────────────

  /** `GET /servers` — List bot's servers */
  servers: () => '/servers' as const,

  /** `GET/DELETE /servers/:id` — Single server */
  server: (serverId: Snowflake) => `/servers/${serverId}` as const,

  // ── Channels ────────────────────────────────────────────

  /** `GET/POST /servers/:id/channels` — Server's channels */
  serverChannels: (serverId: Snowflake) => `/servers/${serverId}/channels` as const,

  /** `GET/PATCH/DELETE /channels/:id` — Single channel */
  channel: (channelId: Snowflake) => `/channels/${channelId}` as const,

  // ── Messages ────────────────────────────────────────────

  /** `GET/POST /channels/:id/messages` — Channel messages */
  channelMessages: (channelId: Snowflake) => `/channels/${channelId}/messages` as const,

  /** `GET/PATCH/DELETE /channels/:id/messages/:id` — Single message */
  channelMessage: (channelId: Snowflake, messageId: Snowflake) =>
    `/channels/${channelId}/messages/${messageId}` as const,

  /** `POST /channels/:id/messages/bulk-delete` — Bulk delete messages */
  channelBulkDelete: (channelId: Snowflake) =>
    `/channels/${channelId}/messages/bulk-delete` as const,

  // ── Members ─────────────────────────────────────────────

  /** `GET /servers/:id/members` — Server members list */
  serverMembers: (serverId: Snowflake) => `/servers/${serverId}/members` as const,

  /** `GET/PATCH/DELETE /servers/:id/members/:id` — Single member */
  serverMember: (serverId: Snowflake, userId: Snowflake) =>
    `/servers/${serverId}/members/${userId}` as const,

  // ── Roles ───────────────────────────────────────────────

  /** `GET/POST /servers/:id/roles` — Server roles */
  serverRoles: (serverId: Snowflake) => `/servers/${serverId}/roles` as const,

  /** `PATCH/DELETE /servers/:id/roles/:id` — Single role */
  serverRole: (serverId: Snowflake, roleId: Snowflake) =>
    `/servers/${serverId}/roles/${roleId}` as const,

  /** `PUT/DELETE /servers/:id/members/:uid/roles/:rid` — Role assignment */
  memberRole: (serverId: Snowflake, userId: Snowflake, roleId: Snowflake) =>
    `/servers/${serverId}/members/${userId}/roles/${roleId}` as const,

  // ── Reactions ───────────────────────────────────────────

  /** `PUT/DELETE /channels/:id/messages/:id/reactions/:emoji` — Add/remove reaction */
  messageReaction: (channelId: Snowflake, messageId: Snowflake, emoji: string) =>
    `/channels/${channelId}/messages/${messageId}/reactions/${encodeURIComponent(emoji)}` as const,

  /** `GET /channels/:id/messages/:id/reactions` — List reactions */
  messageReactions: (channelId: Snowflake, messageId: Snowflake) =>
    `/channels/${channelId}/messages/${messageId}/reactions` as const,

  // ── Pins ────────────────────────────────────────────────

  /** `GET /channels/:id/pins` — Pinned messages */
  channelPins: (channelId: Snowflake) => `/channels/${channelId}/pins` as const,

  /** `PUT/DELETE /channels/:id/pins/:id` — Pin/unpin a message */
  channelPin: (channelId: Snowflake, messageId: Snowflake) =>
    `/channels/${channelId}/pins/${messageId}` as const,

  // ── Bans ────────────────────────────────────────────────

  /** `GET /servers/:id/bans` — Server bans list */
  serverBans: (serverId: Snowflake) => `/servers/${serverId}/bans` as const,

  /** `PUT/DELETE /servers/:id/bans/:id` — Ban/unban a user */
  serverBan: (serverId: Snowflake, userId: Snowflake) =>
    `/servers/${serverId}/bans/${userId}` as const,

  // ── Invites ─────────────────────────────────────────────

  /** `GET/POST /servers/:id/invites` — Server invites */
  serverInvites: (serverId: Snowflake) => `/servers/${serverId}/invites` as const,

  /** `DELETE /servers/:id/invites/:id` — Delete an invite */
  serverInvite: (serverId: Snowflake, inviteId: Snowflake) =>
    `/servers/${serverId}/invites/${inviteId}` as const,

  // ── Threads ─────────────────────────────────────────────

  /** `GET/POST /channels/:id/threads` — Channel threads */
  channelThreads: (channelId: Snowflake) => `/channels/${channelId}/threads` as const,

  // ── Emojis ──────────────────────────────────────────────

  /** `GET /servers/:id/emojis` — Server custom emojis */
  serverEmojis: (serverId: Snowflake) => `/servers/${serverId}/emojis` as const,

  // ── Webhooks ────────────────────────────────────────────

  /** `GET /servers/:id/webhooks` — Server webhooks */
  serverWebhooks: (serverId: Snowflake) => `/servers/${serverId}/webhooks` as const,

  // ── Direct Messages ─────────────────────────────────────

  /** `GET/POST /dms/:id/messages` — DM conversation messages */
  dmMessages: (conversationId: Snowflake) => `/dms/${conversationId}/messages` as const,

  // ── MFA ─────────────────────────────────────────────────

  /** `POST /auth/mfa/verify` — Verify MFA code during login (uses ticket JWT, no Bearer auth) */
  authMfaVerify: () => '/auth/mfa/verify' as const,

  /** `POST /users/@me/mfa/setup` — Start 2FA setup (generate TOTP secret) */
  mfaSetup: () => '/users/@me/mfa/setup' as const,

  /** `POST /users/@me/mfa/verify` — Activate 2FA by verifying a TOTP code */
  mfaVerify: () => '/users/@me/mfa/verify' as const,

  /** `DELETE /users/@me/mfa` — Disable 2FA */
  mfa: () => '/users/@me/mfa' as const,

  /** `GET /users/@me/mfa/backup-codes` — Get backup codes remaining count */
  mfaBackupCodes: () => '/users/@me/mfa/backup-codes' as const,

  /** `POST /users/@me/mfa/regenerate-backup-codes` — Regenerate backup codes */
  mfaRegenerateBackupCodes: () => '/users/@me/mfa/regenerate-backup-codes' as const,

  // ── QR Login ────────────────────────────────────────────

  /** `POST /auth/qr/generate` — Generate a QR login session */
  authQrGenerate: () => '/auth/qr/generate' as const,

  /** `GET /auth/qr/status/:token` — Check QR login session status */
  authQrStatus: (token: string) => `/auth/qr/status/${token}` as const,

  /** `POST /auth/qr/confirm` — Confirm a QR login session (requires auth) */
  authQrConfirm: () => '/auth/qr/confirm' as const,

  // ── Gateway / Info ──────────────────────────────────────

  /** `GET /gateway` — Gateway connection info */
  gateway: () => '/gateway' as const,

  /** `GET /api-info` — API information */
  apiInfo: () => '/api-info' as const,

  // ── System Announcements (Admin) ────────────────────────

  /** `GET/POST /admin/announcements` — List all or create system announcements */
  announcements: () => '/admin/announcements' as const,

  /** `GET/DELETE /admin/announcements/:id` — Get or delete a specific announcement */
  announcement: (announcementId: Snowflake) =>
    `/admin/announcements/${announcementId}` as const,

  /** `POST /admin/announcements/:id/send` — Send a scheduled announcement now */
  announcementSend: (announcementId: Snowflake) =>
    `/admin/announcements/${announcementId}/send` as const,

} as const;
