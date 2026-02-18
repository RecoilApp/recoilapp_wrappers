/**
 * @module recoil.js/client/ClientOptions
 * Configuration options for the RecoilClient.
 *
 * @packageDocumentation
 */

import type { IntentsBitField } from '../util/Intents';
import type { RESTOptions } from '../rest/RESTManager';
import type { GatewayOptions } from '../gateway/Gateway';

/**
 * Options to configure the {@link RecoilClient}.
 */
export interface ClientOptions {
  /**
   * The intents to use when connecting.
   * Determines which events the bot will receive.
   *
   * @example
   * ```ts
   * new RecoilClient({
   *   intents: Intents.Flags.Servers | Intents.Flags.ServerMessages,
   * });
   * ```
   */
  intents: bigint | number | IntentsBitField;

  /**
   * REST API configuration overrides.
   */
  rest?: Partial<RESTOptions>;

  /**
   * Base URL for the API. Defaults to `https://recoilapp.com/api/v1`.
   */
  apiBaseUrl?: string;

  /**
   * Whether to automatically fetch all servers on login.
   * @defaultValue `true`
   */
  fetchServersOnReady?: boolean;

  /**
   * Maximum number of messages to cache per channel.
   * Set to `0` to disable message caching.
   * @defaultValue `100`
   */
  messageCacheMaxSize?: number;

  /**
   * Options for the Bot Gateway WebSocket connection.
   */
  gateway?: GatewayOptions;
}

/**
 * Default client options (merged with user-provided options).
 */
export const DefaultClientOptions: Required<Omit<ClientOptions, 'intents' | 'rest' | 'apiBaseUrl' | 'gateway'>> = {
  fetchServersOnReady: true,
  messageCacheMaxSize: 100,
};
