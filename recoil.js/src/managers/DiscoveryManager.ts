/**
 * @module recoil.js/managers/DiscoveryManager
 * Provides access to the public Server Discovery API.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIServer, Snowflake } from '../types';
import { BaseManager } from './BaseManager';

export interface DiscoveryServerData {
  id: Snowflake;
  name: string;
  description: string;
  discovery_description: string;
  discovery_category: string;
  discovery_tags: string[];
  icon_url: string | null;
  banner_url: string | null;
  is_verified: boolean;
  member_count: number;
  created_at: string;
}

export interface DiscoverySearchOptions {
  /** Search query — matches name and description */
  q?: string;
  /** Filter by category */
  category?: string;
  /** Page number (1-indexed, default: 1) */
  page?: number;
}

export interface DiscoveryListResult {
  servers: DiscoveryServerData[];
  total: number;
  page: number;
  page_size: number;
  has_more: boolean;
}

export type DiscoveryCategory =
  | 'gaming' | 'community' | 'education' | 'entertainment'
  | 'tech' | 'art' | 'music' | 'science' | 'sports' | 'general';

export interface DiscoveryCategoriesResult {
  categories: DiscoveryCategory[];
  counts: Array<{ category: string; server_count: number }>;
}

/**
 * Provides access to the public Server Discovery listing.
 * Bots can use this to browse discoverable servers.
 *
 * @example
 * ```ts
 * // Browse all discoverable servers
 * const result = await client.discovery.list();
 * console.log(`Found ${result.total} discoverable servers`);
 *
 * // Search for gaming servers
 * const gaming = await client.discovery.list({ category: 'gaming', q: 'minecraft' });
 * for (const server of gaming.servers) {
 *   console.log(`${server.name} — ${server.member_count} members`);
 * }
 *
 * // Get available categories
 * const { categories, counts } = await client.discovery.getCategories();
 * ```
 */
export class DiscoveryManager extends BaseManager<never> {
  constructor(client: RecoilClient) {
    super(client);
  }

  /**
   * Browse the public server discovery listing.
   *
   * @param options - Search/filter options
   * @returns Paginated list of discoverable servers
   */
  async list(options?: DiscoverySearchOptions): Promise<DiscoveryListResult> {
    const query: Record<string, string | number> = {};
    if (options?.q) query.q = options.q;
    if (options?.category) query.category = options.category;
    if (options?.page) query.page = options.page;

    return this.client.rest.get<DiscoveryListResult>('/discovery', { query });
  }

  /**
   * Get the list of available discovery categories along with their server counts.
   *
   * @returns Category list and per-category server counts
   */
  async getCategories(): Promise<DiscoveryCategoriesResult> {
    return this.client.rest.get<DiscoveryCategoriesResult>('/discovery/categories');
  }
}
