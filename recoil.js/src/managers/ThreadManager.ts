/**
 * @module recoil.js/managers/ThreadManager
 * Manages threads within a specific channel.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIThread, APIThreadCreate, Snowflake } from '../types';
import { BaseManager } from './BaseManager';
import { Thread } from '../structures/Thread';
import { Collection } from '../util/Collection';

/**
 * Manages threads for a specific channel.
 *
 * @example
 * ```ts
 * // List threads in a channel
 * const threads = await channel.threads.list();
 *
 * // Create a new thread
 * const thread = await channel.threads.create({
 *   name: 'Feature Discussion',
 *   parent_message_id: messageId,
 *   auto_archive_minutes: 1440, // 24 hours
 * });
 * ```
 */
export class ThreadManager extends BaseManager<Thread> {
  /** The channel ID this manager is scoped to */
  public readonly channelId: Snowflake;

  constructor(client: RecoilClient, channelId: Snowflake) {
    super(client);
    this.channelId = channelId;
  }

  /**
   * Fetches all threads in this channel.
   * @returns A Collection of Thread instances
   */
  async list(): Promise<Collection<Snowflake, Thread>> {
    const data = await this.client.rest.get<{ threads: APIThread[] }>(
      `/channels/${this.channelId}/threads`,
    );

    const result = new Collection<Snowflake, Thread>();
    for (const threadData of data.threads) {
      const thread = new Thread(this.client, threadData);
      this.cache.set(thread.id, thread);
      result.set(thread.id, thread);
    }
    return result;
  }

  /**
   * Creates a new thread in this channel.
   *
   * @param options - Thread creation options
   * @returns The newly created Thread
   */
  async create(options: APIThreadCreate): Promise<Thread> {
    const data = await this.client.rest.post<{ thread: APIThread }>(
      `/channels/${this.channelId}/threads`,
      { body: options as unknown as Record<string, unknown> },
    );
    const thread = new Thread(this.client, data.thread);
    this.cache.set(thread.id, thread);
    return thread;
  }

  /**
   * Returns only active (non-archived) threads from cache.
   */
  get active(): Collection<Snowflake, Thread> {
    return this.cache.filter(t => t.isActive);
  }

  /**
   * Returns only archived threads from cache.
   */
  get archived(): Collection<Snowflake, Thread> {
    return this.cache.filter(t => t.isArchived);
  }
}
