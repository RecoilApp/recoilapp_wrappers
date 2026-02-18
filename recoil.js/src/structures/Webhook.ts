/**
 * @module recoil.js/structures/Webhook
 * Represents a webhook configured for a server channel.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIWebhook, Snowflake } from '../types';
import { WebhookType } from '../types';
import { Base } from './Base';

/**
 * Represents a server webhook.
 *
 * @example
 * ```ts
 * const webhooks = await server.webhooks.list();
 * for (const wh of webhooks.values()) {
 *   console.log(`${wh.name} → #${wh.channelName}`);
 * }
 * ```
 */
export class Webhook extends Base {
  /** The server this webhook belongs to */
  public readonly serverId: Snowflake;

  /** The channel this webhook posts to */
  public readonly channelId: Snowflake;

  /** The webhook's display name */
  public readonly name: string;

  /** URL to the webhook's avatar */
  public readonly avatarURL: string | null;

  /** The webhook's secret token */
  public readonly token: string;

  /** The type of webhook */
  public readonly type: WebhookType;

  /** The name of the channel this webhook posts to */
  public readonly channelName: string | null;

  /** When this webhook was created */
  public readonly createdAt: Date;

  constructor(client: RecoilClient, data: APIWebhook) {
    super(client, data.id);
    this.serverId = data.server_id;
    this.channelId = data.channel_id;
    this.name = data.name;
    this.avatarURL = data.avatar_url;
    this.token = data.token;
    this.type = data.type;
    this.channelName = data.channel_name ?? null;
    this.createdAt = new Date(data.created_at);
  }

  /**
   * Whether this is an incoming webhook.
   */
  get isIncoming(): boolean {
    return this.type === WebhookType.Incoming;
  }

  /**
   * Whether this is a channel follower webhook.
   */
  get isChannelFollower(): boolean {
    return this.type === WebhookType.ChannelFollower;
  }

  override toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      server_id: this.serverId,
      channel_id: this.channelId,
      name: this.name,
      avatar_url: this.avatarURL,
      type: this.type,
      channel_name: this.channelName,
      created_at: this.createdAt.toISOString(),
    };
  }
}
