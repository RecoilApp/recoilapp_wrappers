/**
 * @module recoil.js/managers/ShopManager
 * Browse the Orb Shop, purchase items and manage inventory.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { Snowflake } from '../types';

// ── API response shapes ───────────────────────────────────────────────────────

export type ShopItemType = 'badge' | 'avatar_frame' | 'chat_effect' | 'theme' | 'emoji_pack' | 'title';
export type ShopItemRarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface ShopItem {
  id: Snowflake;
  name: string;
  description: string | null;
  type: ShopItemType;
  price: number;
  image_url: string | null;
  preview_url: string | null;
  badge_data: Record<string, unknown> | null;
  rarity: ShopItemRarity;
  is_available: boolean;
  limited_quantity: number | null;
  sold_count: number;
  sort_order: number;
  created_at: string;
  owned?: boolean;
}

export interface InventoryItem extends ShopItem {
  inventory_id: Snowflake;
  equipped: boolean;
  acquired_at: string;
}

export interface PurchaseResult {
  success: boolean;
  item: ShopItem;
  new_balance: number;
  orbs_spent: number;
}

export interface EquipResult {
  success: boolean;
  equipped: boolean;
}

export interface ShopListOptions {
  type?: ShopItemType;
  rarity?: ShopItemRarity;
}

// ── Manager ───────────────────────────────────────────────────────────────────

export class ShopManager {
  private readonly client: RecoilClient;

  constructor(client: RecoilClient) {
    this.client = client;
  }

  /**
   * List all available shop items, optionally filtered by type or rarity.
   */
  async getItems(options: ShopListOptions = {}): Promise<ShopItem[]> {
    const params = new URLSearchParams();
    if (options.type) params.set('type', options.type);
    if (options.rarity) params.set('rarity', options.rarity);
    const qs = params.toString();
    return this.client.rest.get(`/shop/items${qs ? '?' + qs : ''}`) as Promise<ShopItem[]>;
  }

  /**
   * Fetch a single shop item by ID.
   */
  async getItem(itemId: Snowflake): Promise<ShopItem> {
    return this.client.rest.get(`/shop/items/${itemId}`) as Promise<ShopItem>;
  }

  /**
   * Purchase an item from the shop using Orbs.
   */
  async purchase(itemId: Snowflake): Promise<PurchaseResult> {
    return this.client.rest.post('/shop/purchase', { body: { item_id: itemId } }) as Promise<PurchaseResult>;
  }

  /**
   * Fetch the authenticated user's item inventory.
   */
  async getInventory(type?: ShopItemType): Promise<InventoryItem[]> {
    const qs = type ? `?type=${type}` : '';
    return this.client.rest.get(`/shop/inventory${qs}`) as Promise<InventoryItem[]>;
  }

  /**
   * Equip or unequip an item from inventory.
   */
  async equip(itemId: Snowflake, equipped: boolean): Promise<EquipResult> {
    return this.client.rest.post('/shop/equip', { body: { item_id: itemId, equipped } }) as Promise<EquipResult>;
  }
}
