/**
 * @module recoil.js/types/enums
 * All enumeration types used throughout the recoil.js library.
 *
 * @packageDocumentation
 */

// ═══════════════════════════════════════════════════════════
// CHANNEL TYPES
// ═══════════════════════════════════════════════════════════

/**
 * The type of a channel within a server.
 */
export enum ChannelType {
  /** A standard text channel for sending messages */
  Text = 'text',
  /** A voice channel for audio communication */
  Voice = 'voice',
  /** An announcement channel for important updates */
  Announcement = 'announcement',
}

// ═══════════════════════════════════════════════════════════
// USER STATUS
// ═══════════════════════════════════════════════════════════

/**
 * Presence status of a user or bot.
 */
export enum UserStatus {
  /** User is actively online */
  Online = 'online',
  /** User is away from keyboard */
  Idle = 'idle',
  /** User does not wish to be disturbed */
  DoNotDisturb = 'dnd',
  /** User is offline or invisible */
  Offline = 'offline',
}

// ═══════════════════════════════════════════════════════════
// BOT FLAGS
// ═══════════════════════════════════════════════════════════

/**
 * Bitfield flags describing a bot's properties and capabilities.
 * These are stored as a bigint bitmask on the bot entity.
 */
export enum BotFlags {
  /** Bot requires OAuth2 code grant for authorization */
  RequiresCodeGrant = 1 << 0,
  /** Bot can be invited by any user (public) */
  PublicBot = 1 << 1,
  /** Bot has been approved for the Presence intent */
  PresenceIntent = 1 << 2,
  /** Bot has been approved for the Server Members intent */
  ServerMembersIntent = 1 << 3,
  /** Bot has been approved for the Message Content intent */
  MessageContentIntent = 1 << 4,
  /** Bot has been quarantined by platform administrators */
  Quarantined = 1 << 5,
  /** Bot has been verified by the platform */
  VerifiedBot = 1 << 6,
  /** Bot supports interaction-based commands */
  SupportsInteractions = 1 << 7,
}

// ═══════════════════════════════════════════════════════════
// APPLICATION FLAGS
// ═══════════════════════════════════════════════════════════

/**
 * Bitfield flags for application-level properties.
 */
export enum ApplicationFlags {
  /** Application is managed by the platform */
  Managed = 1 << 0,
  /** Application has registered slash commands */
  ApplicationCommands = 1 << 1,
  /** Application has active commands */
  HasCommands = 1 << 2,
  /** Application is discoverable in the directory */
  Discoverable = 1 << 3,
  /** Application has been verified */
  Verified = 1 << 4,
  /** Application has monetization enabled */
  MonetizationEnabled = 1 << 5,
  /** Application holds a developer license */
  DeveloperLicense = 1 << 6,
}

// ═══════════════════════════════════════════════════════════
// AUDIT LOG ACTIONS
// ═══════════════════════════════════════════════════════════

/**
 * Actions recorded in the server audit log.
 */
export enum AuditLogAction {
  /** A member was kicked */
  Kick = 'kick',
  /** A member was banned */
  Ban = 'ban',
  /** A member was unbanned */
  Unban = 'unban',
  /** A role was created */
  RoleCreate = 'role_create',
  /** A role was updated */
  RoleUpdate = 'role_update',
  /** A role was deleted */
  RoleDelete = 'role_delete',
  /** A channel was created */
  ChannelCreate = 'channel_create',
  /** A channel was updated */
  ChannelUpdate = 'channel_update',
  /** A channel was deleted */
  ChannelDelete = 'channel_delete',
  /** Server settings were updated */
  ServerUpdate = 'server_update',
  /** A message was pinned */
  MessagePin = 'message_pin',
  /** A message was unpinned */
  MessageUnpin = 'message_unpin',
}

// ═══════════════════════════════════════════════════════════
// WEBHOOK TYPE
// ═══════════════════════════════════════════════════════════

/**
 * The type of a server webhook.
 */
export enum WebhookType {
  /** Posts messages to a channel via webhook URL */
  Incoming = 'incoming',
  /** Follows an announcement channel */
  ChannelFollower = 'channel_follower',
}

// ═══════════════════════════════════════════════════════════
// COMMAND TYPES
// ═══════════════════════════════════════════════════════════

/**
 * The type of a bot command.
 */
export enum CommandType {
  /** A slash command invoked with `/` */
  Slash = 'slash',
  /** A context menu command on a user */
  User = 'user',
  /** A context menu command on a message */
  Message = 'message',
}

/**
 * The type of a command option parameter.
 */
export enum CommandOptionType {
  SubCommand = 'sub_command',
  SubCommandGroup = 'sub_command_group',
  String = 'string',
  Integer = 'integer',
  Boolean = 'boolean',
  User = 'user',
  Channel = 'channel',
  Role = 'role',
  Mentionable = 'mentionable',
  Number = 'number',
  Attachment = 'attachment',
}

// ═══════════════════════════════════════════════════════════
// EVENT RSVP STATUS
// ═══════════════════════════════════════════════════════════

/**
 * RSVP status for a scheduled server event.
 */
export enum EventRSVPStatus {
  Interested = 'interested',
  Going = 'going',
  NotGoing = 'not_going',
}

// ═══════════════════════════════════════════════════════════
// EVENT STATUS
// ═══════════════════════════════════════════════════════════

/**
 * Status of a scheduled server event.
 */
export enum EventStatus {
  Scheduled = 'scheduled',
  Active = 'active',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

// ═══════════════════════════════════════════════════════════
// INVITE
// ═══════════════════════════════════════════════════════════

/**
 * Verification status of an application.
 */
export enum VerifyStatus {
  Unverified = 'unverified',
  Pending = 'pending',
  Verified = 'verified',
  Rejected = 'rejected',
}

// ═══════════════════════════════════════════════════════════
// RATE LIMIT TIER
// ═══════════════════════════════════════════════════════════

/**
 * Rate limit tier for a bot token.
 */
export enum RateLimitTier {
  Standard = 'standard',
  Elevated = 'elevated',
  Unlimited = 'unlimited',
}

// ═══════════════════════════════════════════════════════════
// SUBSCRIPTION TIER
// ═══════════════════════════════════════════════════════════

/**
 * Subscription tier for a user's premium plan.
 */
export enum SubscriptionTier {
  /** No subscription — free tier */
  Free = 0,
  /** Recoil Premium — $4.99/mo */
  Premium = 1,
  /** Recoil Premium+ — $9.99/mo */
  PremiumPlus = 2,
}
