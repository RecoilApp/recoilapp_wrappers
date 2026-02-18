/**
 * @module recoil.js/managers/EmojiManager
 * Manages custom emojis within a specific server.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIEmoji, Snowflake } from '../types';
import { BaseManager } from './BaseManager';
import { Emoji } from '../structures/Emoji';
import { Collection } from '../util/Collection';

/**
 * Manages custom emojis for a specific server.
 *
 * @example
 * ```ts
 * // List all custom emojis
 * const emojis = await server.emojis.list();
 * console.log(`Server has ${emojis.size} custom emojis`);
 *
 * // Find an emoji by name
 * const pepe = emojis.find(e => e.name === 'pepe');
 * ```
 */
export class EmojiManager extends BaseManager<Emoji> {
  /** The server ID this manager is scoped to */
  public readonly serverId: Snowflake;

  constructor(client: RecoilClient, serverId: Snowflake) {
    super(client);
    this.serverId = serverId;
  }

  /**
   * Fetches all custom emojis in this server.
   * @returns A Collection of Emoji instances
   */
  async list(): Promise<Collection<Snowflake, Emoji>> {
    const data = await this.client.rest.get<{ emojis: APIEmoji[] }>(
      `/servers/${this.serverId}/emojis`,
    );

    const result = new Collection<Snowflake, Emoji>();
    for (const emojiData of data.emojis) {
      const emoji = new Emoji(this.client, emojiData);
      this.cache.set(emoji.id, emoji);
      result.set(emoji.id, emoji);
    }
    return result;
  }

  /**
   * Finds a cached emoji by name.
   *
   * @param name - The emoji name to search for
   * @returns The Emoji, or `undefined`
   */
  resolveByName(name: string): Emoji | undefined {
    return this.cache.find(e => e.name === name);
  }
}
