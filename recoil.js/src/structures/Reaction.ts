/**
 * @module recoil.js/structures/Reaction
 * Represents a group of reactions with the same emoji on a message.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIReaction, Snowflake } from '../types';

/**
 * Represents a reaction group on a message.
 * Each group represents all reactions with the same emoji.
 *
 * @example
 * ```ts
 * const reactions = await message.reactions.list();
 * for (const reaction of reactions) {
 *   console.log(`${reaction.emoji} × ${reaction.count}`);
 * }
 * ```
 */
export class Reaction {
  /** The RecoilClient instance */
  public readonly client: RecoilClient;

  /** The emoji (Unicode or custom name) */
  public readonly emoji: string;

  /** Number of reactions with this emoji */
  public readonly count: number;

  /** User IDs who reacted with this emoji */
  public readonly userIds: (Snowflake | null)[];

  constructor(client: RecoilClient, data: APIReaction) {
    this.client = client;
    this.emoji = data.emoji;
    this.count = data.count;
    this.userIds = data.users.map(u => u.user_id);
  }

  /**
   * Returns the emoji as a string.
   */
  toString(): string {
    return this.emoji;
  }

  toJSON(): Record<string, unknown> {
    return {
      emoji: this.emoji,
      count: this.count,
      users: this.userIds,
    };
  }
}
