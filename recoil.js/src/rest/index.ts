/**
 * @module recoil.js/rest
 * Barrel export for REST infrastructure.
 *
 * @packageDocumentation
 */

export { RESTManager, type RESTOptions, type RequestOptions } from './RESTManager';
export {
  RecoilAPIError,
  RequestTimeoutError,
  AuthenticationError,
  PermissionError,
  RateLimitError,
} from './APIError';
export * as Routes from './Routes';
