/**
 * @module recoil.js/managers/BaseManager
 * Abstract base class for all entity managers.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import { Collection } from '../util/Collection';
import type { Snowflake } from '../types';

/**
 * Abstract base manager that provides a `Collection`-based cache and
 * a reference to the client. All entity-specific managers extend this.
 *
 * @typeParam T - The structure type managed by this manager
 */
export abstract class BaseManager<T extends { id: Snowflake }> {
  /** The client that instantiated this manager */
  public readonly client: RecoilClient;

  /** The in-memory cache of entities */
  public readonly cache: Collection<Snowflake, T>;

  /**
   * @param client - The RecoilClient instance
   */
  constructor(client: RecoilClient) {
    this.client = client;
    this.cache = new Collection<Snowflake, T>();
  }

  /**
   * Resolves an entity from cache by its ID.
   * Does NOT make an API call — returns `undefined` if not cached.
   *
   * @param id - The entity's ID
   * @returns The cached entity, or `undefined`
   */
  resolve(id: Snowflake): T | undefined {
    return this.cache.get(id);
  }

  /**
   * Returns the number of cached entities.
   */
  get size(): number {
    return this.cache.size;
  }
}
