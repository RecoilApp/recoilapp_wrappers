/**
 * @module recoil.js/managers/ReactionManager
 * Manages reactions on a specific message.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIReaction, Snowflake } from '../types';
import { Reaction } from '../structures/Reaction';

/**
 * Manages reactions for a specific message.
 *
 * @example
 * ```ts
 * // Add a reaction
 * await message.reactions.add('👍');
 *
 * // Remove a reaction
 * await message.reactions.remove('👍');
 *
 * // List all reactions
 * const reactions = await message.reactions.list();
 * for (const r of reactions) {
 *   console.log(`${r.emoji} × ${r.count}`);
 * }
 * ```
 */
export class ReactionManager {
  /** The RecoilClient instance */
  public readonly client: RecoilClient;

  /** The channel containing the message */
  public readonly channelId: Snowflake;

  /** The message this manager is scoped to */
  public readonly messageId: Snowflake;

  constructor(client: RecoilClient, channelId: Snowflake, messageId: Snowflake) {
    this.client = client;
    this.channelId = channelId;
    this.messageId = messageId;
  }

  /**
   * Adds a reaction to this message (as the bot).
   *
   * @param emoji - The emoji to react with (Unicode or custom name)
   */
  async add(emoji: string): Promise<void> {
    await this.client.rest.put(
      `/channels/${this.channelId}/messages/${this.messageId}/reactions/${encodeURIComponent(emoji)}`,
    );
  }

  /**
   * Removes the bot's reaction from this message.
   *
   * @param emoji - The emoji to remove
   */
  async remove(emoji: string): Promise<void> {
    await this.client.rest.delete(
      `/channels/${this.channelId}/messages/${this.messageId}/reactions/${encodeURIComponent(emoji)}`,
    );
  }

  /**
   * Fetches all reactions on this message.
   *
   * @returns Array of Reaction instances
   */
  async list(): Promise<Reaction[]> {
    const data = await this.client.rest.get<{ reactions: APIReaction[] }>(
      `/channels/${this.channelId}/messages/${this.messageId}/reactions`,
    );
    return data.reactions.map(r => new Reaction(this.client, r));
  }
}
