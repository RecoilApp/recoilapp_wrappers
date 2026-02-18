/**
 * @module recoil.js/types/api
 * Raw API response and request types that mirror the RecoilApp Bot API v1.
 * These types represent the JSON shapes sent over the wire.
 *
 * @packageDocumentation
 */

import type { ChannelType, UserStatus, WebhookType, CommandType, CommandOptionType, SubscriptionTier } from './enums';

// ═══════════════════════════════════════════════════════════
// COMMON
// ═══════════════════════════════════════════════════════════

/** A UUID v4 string identifier */
export type Snowflake = string;

// ═══════════════════════════════════════════════════════════
// BOT SELF
// ═══════════════════════════════════════════════════════════

/**
 * The bot's own user data returned from `GET /@me`.
 */
export interface APIBotUser {
  id: Snowflake;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string;
  status: UserStatus;
  flags: string;
  approved_intents: string;
  server_count: number;
  command_count: number;
  application: {
    id: Snowflake;
    name: string;
  };
  created_at: string;
}

/**
 * Fields accepted by `PATCH /@me`.
 */
export interface APIBotUserEdit {
  status?: UserStatus;
  bio?: string;
  display_name?: string;
}

// ═══════════════════════════════════════════════════════════
// SERVER (GUILD)
// ═══════════════════════════════════════════════════════════

/**
 * Server (guild) object from the Bot API.
 */
export interface APIServer {
  id: Snowflake;
  name: string;
  description?: string;
  icon_url: string | null;
  banner_url: string | null;
  owner_id: Snowflake;
  invite_code: string;
  is_public: boolean;
  is_verified?: boolean;
  verified_at?: string | null;
  member_count: number;
  channel_count: number;
  role_count?: number;
  owner_username?: string;
  granted_permissions?: string;
  bot_joined_at?: string;
  bot_config?: Record<string, unknown>;
  created_at: string;
  updated_at?: string;
}

/**
 * Server list item (compact format).
 */
export interface APIServerListItem {
  id: Snowflake;
  name: string;
  icon_url: string | null;
  member_count: number;
  channel_count: number;
  bot_joined_at: string;
  granted_permissions: string;
}

// ═══════════════════════════════════════════════════════════
// CHANNEL
// ═══════════════════════════════════════════════════════════

/**
 * Channel object from the Bot API.
 */
export interface APIChannel {
  id: Snowflake;
  server_id: Snowflake;
  name: string;
  topic: string;
  type: ChannelType;
  position: number;
  is_private: boolean;
  message_count?: number;
  pin_count?: number;
  thread_count?: number;
  created_at: string;
}

/**
 * Fields for creating a new channel.
 */
export interface APIChannelCreate {
  name: string;
  type?: ChannelType;
  topic?: string;
  position?: number;
  is_private?: boolean;
}

/**
 * Fields for editing a channel.
 */
export interface APIChannelEdit {
  name?: string;
  topic?: string;
  position?: number;
  is_private?: boolean;
}

// ═══════════════════════════════════════════════════════════
// MESSAGE
// ═══════════════════════════════════════════════════════════

/**
 * Author information embedded in a message object.
 */
export interface APIMessageAuthor {
  id: Snowflake;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_bot: boolean;
}

/**
 * Message object from the Bot API.
 */
export interface APIMessage {
  id: Snowflake;
  channel_id: Snowflake;
  content: string;
  attachment_url?: string | null;
  attachment_type?: string | null;
  attachment_name?: string | null;
  reply_to_id: Snowflake | null;
  is_edited: boolean;
  embeds?: APIEmbed[] | null;
  created_at: string;
  updated_at?: string;
  author: APIMessageAuthor;
}

/**
 * Options for fetching messages from a channel.
 */
export interface APIMessageFetchOptions {
  /** Maximum number of messages to return (1-100, default 50) */
  limit?: number;
  /** Get messages before this message ID */
  before?: Snowflake;
  /** Get messages after this message ID */
  after?: Snowflake;
  /** Get messages around this message ID */
  around?: Snowflake;
}

/**
 * Fields for creating a message.
 */
export interface APIMessageCreate {
  content?: string;
  reply_to_id?: Snowflake;
  embeds?: APIEmbed[];
}

/**
 * Fields for editing a message.
 */
export interface APIMessageEdit {
  content?: string;
  embeds?: APIEmbed[];
}

// ═══════════════════════════════════════════════════════════
// EMBEDS (Container-based V2 system)
// ═══════════════════════════════════════════════════════════

/**
 * Embed component type identifiers.
 */
export type APIEmbedComponentType =
  | 'container'
  | 'text_display'
  | 'separator'
  | 'section'
  | 'media_gallery'
  | 'action_row'
  | 'button'
  | 'thumbnail'
  | 'file';

/**
 * Button visual styles.
 */
export type APIButtonStyle = 'primary' | 'secondary' | 'success' | 'danger' | 'link';

/**
 * Root container embed — the top-level embed object.
 */
export interface APIEmbed {
  type: 'container';
  accent_color?: string;
  spoiler?: boolean;
  components: APIEmbedComponent[];
}

/**
 * Union of all possible embed child components.
 */
export type APIEmbedComponent =
  | APIEmbedTextDisplay
  | APIEmbedSeparator
  | APIEmbedSection
  | APIEmbedMediaGallery
  | APIEmbedActionRow
  | APIEmbedFileDisplay;

/**
 * A block of text with markdown support.
 */
export interface APIEmbedTextDisplay {
  type: 'text_display';
  content: string;
}

/**
 * A visual divider between components.
 */
export interface APIEmbedSeparator {
  type: 'separator';
  has_divider?: boolean;
  spacing?: 'small' | 'large';
}

/**
 * A section with text and an optional accessory (thumbnail or button).
 */
export interface APIEmbedSection {
  type: 'section';
  components: [APIEmbedTextDisplay];
  accessory?: APIEmbedThumbnail | APIEmbedButton;
}

/**
 * A grid of media items (images).
 */
export interface APIEmbedMediaGallery {
  type: 'media_gallery';
  items: APIEmbedMediaItem[];
}

export interface APIEmbedMediaItem {
  url: string;
  alt?: string;
  description?: string;
}

/**
 * A row of up to 5 buttons.
 */
export interface APIEmbedActionRow {
  type: 'action_row';
  components: APIEmbedButton[];
}

/**
 * An interactive button.
 */
export interface APIEmbedButton {
  type: 'button';
  label: string;
  style: APIButtonStyle;
  url?: string;
  custom_id?: string;
  emoji?: string;
  disabled?: boolean;
}

/**
 * A small thumbnail image (used as a section accessory).
 */
export interface APIEmbedThumbnail {
  type: 'thumbnail';
  url: string;
  alt?: string;
}

/**
 * A file attachment card.
 */
export interface APIEmbedFileDisplay {
  type: 'file';
  url: string;
  name: string;
}

// ═══════════════════════════════════════════════════════════
// MEMBER
// ═══════════════════════════════════════════════════════════

/**
 * Role info as embedded in a member object.
 */
export interface APIMemberRole {
  id: Snowflake;
  name: string;
  color: string;
  position: number;
  permissions?: string;
}

/**
 * Server member object.
 */
export interface APIMember {
  user_id: Snowflake;
  nickname: string | null;
  joined_at: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  status: UserStatus;
  bio?: string;
  banner_url?: string | null;
  subscription_tier?: SubscriptionTier;
  roles: APIMemberRole[];
}

/**
 * Fields for modifying a server member.
 */
export interface APIMemberEdit {
  nickname?: string | null;
  roles?: Snowflake[];
}

// ═══════════════════════════════════════════════════════════
// ROLE
// ═══════════════════════════════════════════════════════════

/**
 * Role object from the Bot API.
 */
export interface APIRole {
  id: Snowflake;
  server_id: Snowflake;
  name: string;
  color: string;
  permissions: string;
  position: number;
  is_hoisted: boolean;
  is_default: boolean;
  is_mentionable?: boolean;
  member_count?: number;
  created_at: string;
}

/**
 * Fields for creating a role.
 */
export interface APIRoleCreate {
  name: string;
  color?: string;
  permissions?: string;
  position?: number;
}

/**
 * Fields for editing a role.
 */
export interface APIRoleEdit {
  name?: string;
  color?: string;
  permissions?: string;
  position?: number;
}

// ═══════════════════════════════════════════════════════════
// REACTION
// ═══════════════════════════════════════════════════════════

/**
 * Reaction group from the Bot API.
 */
export interface APIReaction {
  emoji: string;
  count: number;
  users: Array<{ user_id: Snowflake | null }>;
}

// ═══════════════════════════════════════════════════════════
// PIN
// ═══════════════════════════════════════════════════════════

/**
 * Pinned message from the Bot API.
 */
export interface APIPinnedMessage extends APIMessage {
  pinned_at: string;
  pinned_by: Snowflake | null;
}

// ═══════════════════════════════════════════════════════════
// BAN
// ═══════════════════════════════════════════════════════════

/**
 * Ban record from the Bot API.
 */
export interface APIBan {
  id: Snowflake;
  server_id: Snowflake;
  user_id: Snowflake;
  moderator_id: Snowflake | null;
  reason: string | null;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
  expires_at: string | null;
}

/**
 * Options for banning a member.
 */
export interface APIBanCreate {
  reason?: string;
  delete_message_days?: number;
}

// ═══════════════════════════════════════════════════════════
// INVITE
// ═══════════════════════════════════════════════════════════

/**
 * Invite object from the Bot API.
 */
export interface APIInvite {
  id: Snowflake;
  server_id: Snowflake;
  channel_id: Snowflake | null;
  creator_id: Snowflake | null;
  code: string;
  max_uses: number | null;
  uses: number;
  expires_at: string | null;
  is_revoked: boolean;
  creator_username?: string;
  created_at: string;
}

/**
 * Fields for creating an invite.
 */
export interface APIInviteCreate {
  max_uses?: number;
  max_age_seconds?: number;
  channel_id?: Snowflake;
}

// ═══════════════════════════════════════════════════════════
// THREAD
// ═══════════════════════════════════════════════════════════

/**
 * Thread object from the Bot API.
 */
export interface APIThread {
  id: Snowflake;
  channel_id: Snowflake;
  name: string;
  creator_id: Snowflake | null;
  parent_message_id: Snowflake | null;
  is_archived: boolean;
  is_locked: boolean;
  auto_archive_minutes: number;
  message_count?: number;
  member_count?: number;
  created_at: string;
}

/**
 * Fields for creating a thread.
 */
export interface APIThreadCreate {
  name: string;
  parent_message_id?: Snowflake;
  auto_archive_minutes?: number;
}

// ═══════════════════════════════════════════════════════════
// EMOJI
// ═══════════════════════════════════════════════════════════

/**
 * Custom emoji object from the Bot API.
 */
export interface APIEmoji {
  id: Snowflake;
  server_id: Snowflake;
  name: string;
  image_url: string;
  creator_id: Snowflake | null;
  roles_allowed: Snowflake[] | null;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════
// WEBHOOK
// ═══════════════════════════════════════════════════════════

/**
 * Server webhook object from the Bot API.
 */
export interface APIWebhook {
  id: Snowflake;
  server_id: Snowflake;
  channel_id: Snowflake;
  name: string;
  avatar_url: string | null;
  token: string;
  type: WebhookType;
  channel_name?: string;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════
// GATEWAY
// ═══════════════════════════════════════════════════════════

/**
 * Gateway connection information returned by `GET /gateway`.
 */
export interface APIGateway {
  url: string;
  shards: number;
  session_start_limit: {
    total: number;
    remaining: number;
    reset_after: number;
    max_concurrency: number;
  };
}

// ═══════════════════════════════════════════════════════════
// API INFO
// ═══════════════════════════════════════════════════════════

/**
 * API information returned by `GET /api-info`.
 */
export interface APIInfo {
  version: string;
  api_version: number;
  gateway_version: number;
  intents: Record<string, string>;
  privileged_intents: string;
  rate_limits: {
    global: { requests: number; per_seconds: number };
    message_create: { requests: number; per_seconds: number };
    message_delete: { requests: number; per_seconds: number };
    member_list: { requests: number; per_seconds: number };
  };
  max_message_length: number;
  max_embed_fields: number;
  max_reactions_per_message: number;
  max_pins_per_channel: number;
  max_roles_per_server: number;
  max_channels_per_server: number;
  max_members_per_request: number;
}

// ═══════════════════════════════════════════════════════════
// INTERACTIONS
// ═══════════════════════════════════════════════════════════

/**
 * The type of component interaction.
 */
export type APIInteractionType = 'button';

/**
 * User info embedded in an interaction.
 */
export interface APIInteractionUser {
  id: Snowflake;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

/**
 * Message context embedded in an interaction.
 */
export interface APIInteractionMessage {
  id: Snowflake;
  channel_id: Snowflake;
  content: string;
  embeds: APIEmbed[] | null;
  created_at: string;
}

/**
 * Button interaction event payload (received via gateway or REST).
 */
export interface APIButtonInteraction {
  id: Snowflake;
  type: 'button';
  custom_id: string;
  message: APIInteractionMessage;
  user: APIInteractionUser;
  channel_id: Snowflake;
  server_id: Snowflake;
  created_at: string;
}

// ═══════════════════════════════════════════════════════════
// REST RESPONSE WRAPPERS
// ═══════════════════════════════════════════════════════════

/** Standard error response from the API */
export interface APIError {
  error: string;
}

/** Paginated list response */
export interface APIPaginatedResponse<T> {
  limit: number;
  offset: number;
  items: T[];
}
