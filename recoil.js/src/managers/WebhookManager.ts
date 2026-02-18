/**
 * @module recoil.js/managers/WebhookManager
 * Manages webhooks within a specific server.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIWebhook, Snowflake } from '../types';
import { BaseManager } from './BaseManager';
import { Webhook } from '../structures/Webhook';
import { Collection } from '../util/Collection';

/**
 * Manages webhooks for a specific server.
 *
 * @example
 * ```ts
 * // List all webhooks
 * const webhooks = await server.webhooks.list();
 * for (const wh of webhooks.values()) {
 *   console.log(`${wh.name} → #${wh.channelName}`);
 * }
 * ```
 */
export class WebhookManager extends BaseManager<Webhook> {
  /** The server ID this manager is scoped to */
  public readonly serverId: Snowflake;

  constructor(client: RecoilClient, serverId: Snowflake) {
    super(client);
    this.serverId = serverId;
  }

  /**
   * Fetches all webhooks in this server.
   * @returns A Collection of Webhook instances
   */
  async list(): Promise<Collection<Snowflake, Webhook>> {
    const data = await this.client.rest.get<{ webhooks: APIWebhook[] }>(
      `/servers/${this.serverId}/webhooks`,
    );

    const result = new Collection<Snowflake, Webhook>();
    for (const webhookData of data.webhooks) {
      const webhook = new Webhook(this.client, webhookData);
      this.cache.set(webhook.id, webhook);
      result.set(webhook.id, webhook);
    }
    return result;
  }

  /**
   * Returns webhooks for a specific channel from cache.
   *
   * @param channelId - The channel to filter by
   */
  forChannel(channelId: Snowflake): Collection<Snowflake, Webhook> {
    return this.cache.filter(w => w.channelId === channelId);
  }
}
