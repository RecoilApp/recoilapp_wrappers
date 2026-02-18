/**
 * @module recoil.js/managers/PinManager
 * Manages pinned messages within a specific channel.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIMessage, Snowflake } from '../types';
import { Message } from '../structures/Message';
import { Collection } from '../util/Collection';

/**
 * Manages pinned messages for a specific channel.
 *
 * @example
 * ```ts
 * // List pinned messages
 * const pins = await channel.pins.list();
 * console.log(`${pins.size} pinned messages`);
 *
 * // Pin a message
 * await channel.pins.add('message-id');
 *
 * // Unpin a message
 * await channel.pins.remove('message-id');
 * ```
 */
export class PinManager {
  /** The RecoilClient instance */
  public readonly client: RecoilClient;

  /** The channel this manager is scoped to */
  public readonly channelId: Snowflake;

  constructor(client: RecoilClient, channelId: Snowflake) {
    this.client = client;
    this.channelId = channelId;
  }

  /**
   * Fetches all pinned messages in this channel.
   * @returns A Collection of Message instances
   */
  async list(): Promise<Collection<Snowflake, Message>> {
    const data = await this.client.rest.get<{ pins: APIMessage[] }>(
      `/channels/${this.channelId}/pins`,
    );

    const result = new Collection<Snowflake, Message>();
    for (const pinData of data.pins) {
      const message = new Message(this.client, pinData);
      result.set(message.id, message);
    }
    return result;
  }

  /**
   * Pins a message in this channel.
   * Maximum 50 pins per channel.
   *
   * @param messageId - The message to pin
   */
  async add(messageId: Snowflake): Promise<void> {
    await this.client.rest.put(`/channels/${this.channelId}/pins/${messageId}`);
  }

  /**
   * Unpins a message from this channel.
   *
   * @param messageId - The message to unpin
   */
  async remove(messageId: Snowflake): Promise<void> {
    await this.client.rest.delete(`/channels/${this.channelId}/pins/${messageId}`);
  }
}
