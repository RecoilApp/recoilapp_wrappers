/**
 * @module recoil.js/util/Constants
 * Library-wide constants including API endpoints, version info, and limits.
 *
 * @packageDocumentation
 */

/** The default RecoilApp API base URL */
export const DEFAULT_API_BASE = 'https://recoilapp.com/api/v1';

/** The current API version */
export const API_VERSION = 1;

/** Package version (keep in sync with package.json) */
export const LIB_VERSION = '1.1.0';

/** Default user agent string sent with every request */
export const USER_AGENT = `RecoilBot (https://recoilapp.com, ${LIB_VERSION})`;

/** HTTP methods used by the REST manager */
export enum HTTPMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
}

/**
 * API rate limit windows (from the server's api-info endpoint).
 */
export const RateLimits = {
  /** Global: 50 requests per second */
  GLOBAL: { requests: 50, perSeconds: 1 },
  /** Message creation: 5 per 5 seconds */
  MESSAGE_CREATE: { requests: 5, perSeconds: 5 },
  /** Message deletion: 5 per second */
  MESSAGE_DELETE: { requests: 5, perSeconds: 1 },
  /** Member listing: 10 per 10 seconds */
  MEMBER_LIST: { requests: 10, perSeconds: 10 },
} as const;

/**
 * Hard limits enforced by the API.
 */
export const Limits = {
  /** Maximum characters in a single message */
  MAX_MESSAGE_LENGTH: 4000,
  /** Maximum fields in an embed */
  MAX_EMBED_FIELDS: 25,
  /** Maximum reactions per message */
  MAX_REACTIONS_PER_MESSAGE: 20,
  /** Maximum pinned messages per channel */
  MAX_PINS_PER_CHANNEL: 50,
  /** Maximum roles per server */
  MAX_ROLES_PER_SERVER: 250,
  /** Maximum channels per server */
  MAX_CHANNELS_PER_SERVER: 500,
  /** Maximum members returned in a single request */
  MAX_MEMBERS_PER_REQUEST: 1000,
  /** Maximum messages to fetch at once */
  MAX_MESSAGES_PER_FETCH: 100,
  /** Maximum messages to bulk delete at once */
  MAX_BULK_DELETE: 100,
  /** Maximum character length for channel names */
  MAX_CHANNEL_NAME_LENGTH: 100,
  /** Maximum character length for role names */
  MAX_ROLE_NAME_LENGTH: 64,
  /** Maximum character length for thread names */
  MAX_THREAD_NAME_LENGTH: 100,
} as const;

/**
 * Default values for various options.
 */
export const Defaults = {
  /** Default message fetch limit */
  MESSAGE_FETCH_LIMIT: 50,
  /** Default member fetch limit */
  MEMBER_FETCH_LIMIT: 100,
  /** Default role color */
  ROLE_COLOR: '#99AAB5',
  /** Default auto-archive duration for threads (minutes) */
  THREAD_AUTO_ARCHIVE: 1440,
  /** Request timeout in milliseconds */
  REQUEST_TIMEOUT: 15000,
  /** Maximum number of retry attempts for failed requests */
  MAX_RETRIES: 3,
  /** Base delay for exponential backoff (milliseconds) */
  RETRY_DELAY: 1000,
} as const;

/**
 * Color constants for common role colors.
 */
export const Colors = {
  Default:    0x99AAB5,
  White:      0xFFFFFF,
  Aqua:       0x1ABC9C,
  Green:      0x57F287,
  Blue:       0x3498DB,
  Yellow:     0xFEE75C,
  Purple:     0x9B59B6,
  Fuchsia:    0xEB459E,
  Gold:       0xF1C40F,
  Orange:     0xE67E22,
  Red:        0xED4245,
  Grey:       0x95A5A6,
  Navy:       0x34495E,
  DarkAqua:   0x11806A,
  DarkGreen:  0x1F8B4C,
  DarkBlue:   0x206694,
  DarkPurple: 0x71368A,
  DarkGold:   0xC27C0E,
  DarkOrange: 0xA84300,
  DarkRed:    0x992D22,
  DarkGrey:   0x979C9F,
  DarkNavy:   0x2C3E50,
  Aurora:     0x00BFBF,
} as const;
