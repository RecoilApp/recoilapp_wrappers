/**
 * # recoil.js
 *
 * The official Node.js API wrapper for the RecoilApp Bot API.
 *
 * ## Quick Start
 * ```ts
 * import { RecoilClient, Intents } from 'recoil.js';
 *
 * const client = new RecoilClient({
 *   intents: Intents.Flags.Servers | Intents.Flags.ServerMessages,
 * });
 *
 * client.on('ready', () => {
 *   console.log(`Logged in as ${client.user!.username}`);
 * });
 *
 * client.login('your-bot-token');
 * ```
 *
 * @module recoil.js
 * @packageDocumentation
 */

// ── Client ──────────────────────────────────────────────────────────────────
export { RecoilClient } from './client/RecoilClient';
export { type ClientOptions, DefaultClientOptions } from './client/ClientOptions';
export {
  type ClientEvents,
  type ClientEventName,
  type RateLimitData,
  type ApiRequestData,
  type ApiResponseData,
} from './client/ClientEvents';

// ── Structures ──────────────────────────────────────────────────────────────
export {
  Base,
  User,
  ClientUser,
  Server,
  Channel,
  Message,
  Member,
  MemberRole,
  Role,
  Emoji,
  Invite,
  Ban,
  Thread,
  Webhook,
  Reaction,
  ContainerBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  SectionBuilder,
  textEmbed,
  ButtonInteraction,
  InteractionCollector,
  type InteractionCollectorOptions,
  type InteractionCollectorEvents,
} from './structures';

// ── Gateway ─────────────────────────────────────────────────────────────────
export {
  Gateway,
  GatewayStatus,
  type GatewayOptions,
} from './gateway';

// ── Managers ────────────────────────────────────────────────────────────────
export {
  BaseManager,
  ServerManager,
  ChannelManager,
  MessageManager,
  MemberManager,
  RoleManager,
  ReactionManager,
  PinManager,
  BanManager,
  InviteManager,
  ThreadManager,
  EmojiManager,
  WebhookManager,
  DiscoveryManager,
  type DiscoveryServerData,
  type DiscoverySearchOptions,
  type DiscoveryListResult,
  type DiscoveryCategoriesResult,
  type DiscoveryCategory,
  SurgeManager,
  type SurgeTierPerkInfo,
  type SurgeUser,
  type ServerSurgeInfo,
  type SurgeActionResult,
} from './managers';

// ── REST ────────────────────────────────────────────────────────────────────
export {
  RESTManager,
  type RESTOptions,
  type RequestOptions,
  RecoilAPIError,
  RequestTimeoutError,
  AuthenticationError,
  PermissionError,
  RateLimitError,
  Routes,
} from './rest';

// ── Utilities ───────────────────────────────────────────────────────────────
export {
  Collection,
  BitField,
  Permissions,
  Intents,
  Events,
  DEFAULT_API_BASE,
  API_VERSION,
  LIB_VERSION,
  USER_AGENT,
  HTTPMethod,
  RateLimits,
  Limits,
  Defaults,
  Colors,
} from './util';

// ── Types & Enums ───────────────────────────────────────────────────────────
export {
  // Enums
  ChannelType,
  UserStatus,
  BotFlags,
  ApplicationFlags,
  AuditLogAction,
  WebhookType,
  CommandType,
  CommandOptionType,
  EventRSVPStatus,
  EventStatus,
  VerifyStatus,
  RateLimitTier,
  // API types
  type Snowflake,
  type APIBotUser,
  type APIBotUserEdit,
  type APIServer,
  type APIServerListItem,
  type APIChannel,
  type APIChannelCreate,
  type APIChannelEdit,
  type APIMessageAuthor,
  type APIMessage,
  type APIMessageFetchOptions,
  type APIMessageCreate,
  type APIMessageEdit,
  type APIMemberRole,
  type APIMember,
  type APIMemberEdit,
  type APIRole,
  type APIRoleCreate,
  type APIRoleEdit,
  type APIReaction,
  type APIPinnedMessage,
  type APIBan,
  type APIBanCreate,
  type APIInvite,
  type APIInviteCreate,
  type APIThread,
  type APIThreadCreate,
  type APIEmoji,
  type APIWebhook,
  type APIGateway,
  type APIInfo,
  type APIError,
  type APIPaginatedResponse,
  // Embed types
  type APIEmbed,
  type APIEmbedComponent,
  type APIEmbedComponentType,
  type APIButtonStyle,
  type APIEmbedTextDisplay,
  type APIEmbedSeparator,
  type APIEmbedSection,
  type APIEmbedMediaGallery,
  type APIEmbedMediaItem,
  type APIEmbedActionRow,
  type APIEmbedButton,
  type APIEmbedThumbnail,
  type APIEmbedFileDisplay,
  // Interaction types
  type APIInteractionType,
  type APIInteractionUser,
  type APIInteractionMessage,
  type APIButtonInteraction,
} from './types';
