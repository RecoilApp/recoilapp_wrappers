/**
 * @module recoil.js/managers/BanManager
 * Manages bans within a specific server.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIBan, APIBanCreate, Snowflake } from '../types';
import { BaseManager } from './BaseManager';
import { Ban } from '../structures/Ban';
import { Collection } from '../util/Collection';

/**
 * Manages bans for a specific server.
 *
 * @example
 * ```ts
 * // List all bans
 * const bans = await server.bans.list();
 *
 * // Ban a user
 * await server.bans.create('user-id', { reason: 'Spamming', deleteMessageDays: 7 });
 *
 * // Unban a user
 * await server.bans.remove('user-id');
 * ```
 */
export class BanManager extends BaseManager<Ban> {
  /** The server ID this manager is scoped to */
  public readonly serverId: Snowflake;

  constructor(client: RecoilClient, serverId: Snowflake) {
    super(client);
    this.serverId = serverId;
  }

  /**
   * Fetches all bans in this server.
   * @returns A Collection of Ban instances
   */
  async list(): Promise<Collection<Snowflake, Ban>> {
    const data = await this.client.rest.get<{ bans: APIBan[] }>(
      `/servers/${this.serverId}/bans`,
    );

    const result = new Collection<Snowflake, Ban>();
    for (const banData of data.bans) {
      const ban = new Ban(this.client, banData);
      this.cache.set(ban.id, ban);
      result.set(ban.id, ban);
    }
    return result;
  }

  /**
   * Bans a user from this server.
   *
   * @param userId - The user to ban
   * @param options - Ban options (reason, delete_message_days)
   */
  async create(userId: Snowflake, options?: APIBanCreate): Promise<void> {
    await this.client.rest.put(
      `/servers/${this.serverId}/bans/${userId}`,
      { body: options as unknown as Record<string, unknown> },
    );
  }

  /**
   * Unbans a user from this server.
   *
   * @param userId - The user to unban
   */
  async remove(userId: Snowflake): Promise<void> {
    await this.client.rest.delete(`/servers/${this.serverId}/bans/${userId}`);
    // Remove from cache by user_id
    const ban = this.cache.find(b => b.userId === userId);
    if (ban) this.cache.delete(ban.id);
  }
}
