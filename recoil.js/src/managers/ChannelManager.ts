/**
 * @module recoil.js/managers/ChannelManager
 * Manages channels within a specific server.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIChannel, APIChannelCreate, APIChannelEdit, Snowflake } from '../types';
import { BaseManager } from './BaseManager';
import { Channel } from '../structures/Channel';
import { Collection } from '../util/Collection';
import { MessageManager } from './MessageManager';
import { ThreadManager } from './ThreadManager';
import { PinManager } from './PinManager';

/**
 * Manages channels for a specific server.
 *
 * @example
 * ```ts
 * // List all channels
 * const channels = await server.channels.list();
 *
 * // Create a new channel
 * const channel = await server.channels.create({
 *   name: 'bot-commands',
 *   type: 'text',
 *   topic: 'Use bot commands here',
 * });
 *
 * // Fetch a specific channel
 * const general = await server.channels.fetch('channel-id');
 * ```
 */
export class ChannelManager extends BaseManager<Channel> {
  /** The server ID this manager is scoped to */
  public readonly serverId: Snowflake;

  constructor(client: RecoilClient, serverId: Snowflake) {
    super(client);
    this.serverId = serverId;
  }

  /**
   * Fetches all channels in this server.
   * @returns A Collection of Channel instances
   */
  async list(): Promise<Collection<Snowflake, Channel>> {
    const data = await this.client.rest.get<{ channels: APIChannel[] }>(
      `/servers/${this.serverId}/channels`,
    );

    const result = new Collection<Snowflake, Channel>();
    for (const channelData of data.channels) {
      const channel = this._add({ ...channelData, server_id: this.serverId });
      result.set(channel.id, channel);
    }
    return result;
  }

  /**
   * Fetches a specific channel by ID.
   *
   * @param channelId - The channel's UUID
   * @returns The Channel instance
   */
  async fetch(channelId: Snowflake): Promise<Channel> {
    const data = await this.client.rest.get<{ channel: APIChannel }>(
      `/channels/${channelId}`,
    );
    return this._add(data.channel);
  }

  /**
   * Creates a new channel in this server.
   *
   * @param options - Channel creation options
   * @returns The newly created Channel
   *
   * @example
   * ```ts
   * const channel = await server.channels.create({
   *   name: 'announcements',
   *   type: 'announcement',
   *   topic: 'Server announcements',
   *   position: 0,
   * });
   * ```
   */
  async create(options: APIChannelCreate): Promise<Channel> {
    const data = await this.client.rest.post<{ channel: APIChannel }>(
      `/servers/${this.serverId}/channels`,
      { body: options as unknown as Record<string, unknown> },
    );
    return this._add(data.channel);
  }

  /**
   * Edits a channel's properties.
   *
   * @param channelId - The channel to edit
   * @param options - Fields to update
   * @returns The updated Channel
   */
  async edit(channelId: Snowflake, options: APIChannelEdit): Promise<Channel> {
    const data = await this.client.rest.patch<{ channel: APIChannel }>(
      `/channels/${channelId}`,
      { body: options as unknown as Record<string, unknown> },
    );
    return this._add(data.channel);
  }

  /**
   * Deletes a channel.
   *
   * @param channelId - The channel to delete
   */
  async delete(channelId: Snowflake): Promise<void> {
    await this.client.rest.delete(`/channels/${channelId}`);
    this.cache.delete(channelId);
  }

  /**
   * Adds a channel to the cache and initializes sub-managers.
   * @internal
   */
  _add(data: APIChannel): Channel {
    let channel = this.cache.get(data.id);
    if (channel) {
      channel._patch(data);
    } else {
      channel = new Channel(this.client, data);
      this.cache.set(data.id, channel);
    }

    // Initialize sub-managers
    if (!channel.messages) {
      channel.messages = new MessageManager(this.client, channel.id);
    }
    if (!channel.threads) {
      channel.threads = new ThreadManager(this.client, channel.id);
    }
    if (!channel.pins) {
      channel.pins = new PinManager(this.client, channel.id);
    }

    return channel;
  }
}
