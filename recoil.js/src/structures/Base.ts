/**
 * @module recoil.js/structures/Base
 * Abstract base class for all API structures (Server, Channel, Message, etc.).
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { Snowflake } from '../types';

/**
 * The base class that all structures extend.
 * Provides a reference to the client and a common `id` property.
 *
 * @example
 * ```ts
 * // All structures inherit from Base:
 * const server = await client.servers.fetch('some-id');
 * console.log(server.id);     // UUID
 * console.log(server.client); // RecoilClient instance
 * ```
 */
export abstract class Base {
  /** The client that instantiated this structure */
  public readonly client: RecoilClient;

  /** The unique identifier (UUID) of this entity */
  public readonly id: Snowflake;

  /**
   * @param client - The RecoilClient instance
   * @param id - The entity's UUID
   */
  constructor(client: RecoilClient, id: Snowflake) {
    this.client = client;
    this.id = id;
  }

  /**
   * Returns the string representation (the ID).
   */
  toString(): string {
    return this.id;
  }

  /**
   * Returns the JSON representation for serialization.
   */
  toJSON(): Record<string, unknown> {
    return { id: this.id };
  }

  /**
   * Returns the primitive value (the ID string).
   */
  valueOf(): string {
    return this.id;
  }
}
