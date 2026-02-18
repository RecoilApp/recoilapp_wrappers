/**
 * @module recoil.js/structures/Emoji
 * Represents a custom emoji in a server.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIEmoji, Snowflake } from '../types';
import { Base } from './Base';

/**
 * Represents a custom server emoji.
 *
 * @example
 * ```ts
 * const emojis = await server.emojis.list();
 * const pepe = emojis.find(e => e.name === 'pepe');
 * console.log(pepe?.imageURL); // 'https://...'
 * console.log(pepe?.toString()); // ':pepe:'
 * ```
 */
export class Emoji extends Base {
  /** The server this emoji belongs to */
  public readonly serverId: Snowflake;

  /** The emoji's name (used as `:name:` in messages) */
  public readonly name: string;

  /** URL to the emoji's image */
  public readonly imageURL: string;

  /** ID of the user who created this emoji */
  public readonly creatorId: Snowflake | null;

  /** Role IDs that can use this emoji (null = everyone) */
  public readonly rolesAllowed: Snowflake[] | null;

  /** When this emoji was created */
  public readonly createdAt: Date;

  constructor(client: RecoilClient, data: APIEmoji) {
    super(client, data.id);
    this.serverId = data.server_id;
    this.name = data.name;
    this.imageURL = data.image_url;
    this.creatorId = data.creator_id;
    this.rolesAllowed = data.roles_allowed;
    this.createdAt = new Date(data.created_at);
  }

  /**
   * Whether this emoji is restricted to specific roles.
   */
  get isRestricted(): boolean {
    return this.rolesAllowed !== null && this.rolesAllowed.length > 0;
  }

  /**
   * Returns the emoji in mention format.
   */
  override toString(): string {
    return `:${this.name}:`;
  }

  override toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      server_id: this.serverId,
      name: this.name,
      image_url: this.imageURL,
      creator_id: this.creatorId,
      roles_allowed: this.rolesAllowed,
      created_at: this.createdAt.toISOString(),
    };
  }
}
