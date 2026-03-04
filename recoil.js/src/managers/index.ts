/**
 * @module recoil.js/managers
 * Barrel export for all manager classes.
 *
 * @packageDocumentation
 */

export { BaseManager } from './BaseManager';
export { ServerManager } from './ServerManager';
export { ChannelManager } from './ChannelManager';
export { MessageManager } from './MessageManager';
export { MemberManager } from './MemberManager';
export { RoleManager } from './RoleManager';
export { ReactionManager } from './ReactionManager';
export { PinManager } from './PinManager';
export { BanManager } from './BanManager';
export { InviteManager } from './InviteManager';
export { ThreadManager } from './ThreadManager';
export { EmojiManager } from './EmojiManager';
export { WebhookManager } from './WebhookManager';
export { DiscoveryManager } from './DiscoveryManager';
export type {
  DiscoveryServerData,
  DiscoverySearchOptions,
  DiscoveryListResult,
  DiscoveryCategoriesResult,
  DiscoveryCategory,
} from './DiscoveryManager';
export { SurgeManager } from './SurgeManager';
export type {
  SurgeTierPerkInfo,
  SurgeUser,
  ServerSurgeInfo,
  SurgeActionResult,
} from './SurgeManager';
export { OrbsManager } from './OrbsManager';
export type {
  OrbsBalance,
  OrbsTransaction,
  OrbsTransactionList,
  DailyClaimResult,
  DailyStatus,
  OrbsEarningRule,
} from './OrbsManager';
export { ShopManager } from './ShopManager';
export type {
  ShopItem,
  ShopItemType,
  ShopItemRarity,
  InventoryItem,
  PurchaseResult,
  EquipResult,
  ShopListOptions,
} from './ShopManager';
