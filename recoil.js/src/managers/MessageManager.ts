/**
 * @module recoil.js/managers/MessageManager
 * Manages messages within a specific channel.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIMessage, APIMessageCreate, APIMessageEdit, APIMessageFetchOptions, Snowflake } from '../types';
import { BaseManager } from './BaseManager';
import { Message } from '../structures/Message';
import { Collection } from '../util/Collection';
import { ReactionManager } from './ReactionManager';

/**
 * Manages messages for a specific channel.
 *
 * @example
 * ```ts
 * // Fetch recent messages
 * const messages = await channel.messages.list({ limit: 25 });
 *
 * // Send a message
 * const msg = await channel.messages.send({ content: 'Hello!' });
 *
 * // Edit a message
 * await channel.messages.edit(msg.id, 'Updated content');
 *
 * // Bulk delete messages
 * await channel.messages.bulkDelete(['msg-1', 'msg-2', 'msg-3']);
 * ```
 */
export class MessageManager extends BaseManager<Message> {
  /** The channel ID this manager is scoped to */
  public readonly channelId: Snowflake;

  constructor(client: RecoilClient, channelId: Snowflake) {
    super(client);
    this.channelId = channelId;
  }

  /**
   * Fetches messages from this channel.
   *
   * @param options - Fetch options (limit, before, after, around)
   * @returns A Collection of Message instances (newest first)
   *
   * @example
   * ```ts
   * // Get last 10 messages
   * const messages = await channel.messages.list({ limit: 10 });
   *
   * // Get messages before a specific message
   * const older = await channel.messages.list({ before: 'message-id', limit: 50 });
   * ```
   */
  async list(options?: APIMessageFetchOptions): Promise<Collection<Snowflake, Message> & { hasMore: boolean }> {
    const query: Record<string, string | number> = {};
    if (options?.limit) query.limit = options.limit;
    if (options?.before) query.before = options.before;
    if (options?.after) query.after = options.after;
    if (options?.around) query.around = options.around;

    const data = await this.client.rest.get<{ messages: APIMessage[]; hasMore?: boolean }>(
      `/channels/${this.channelId}/messages`,
      { query },
    );

    const result = new Collection<Snowflake, Message>() as Collection<Snowflake, Message> & { hasMore: boolean };
    for (const msgData of data.messages) {
      const message = this._add(msgData);
      result.set(message.id, message);
    }
    result.hasMore = data.hasMore ?? false;
    return result;
  }

  /**
   * Fetches a single message by ID.
   *
   * @param messageId - The message's UUID
   * @returns The Message instance
   */
  async fetch(messageId: Snowflake): Promise<Message> {
    const data = await this.client.rest.get<{ message: APIMessage }>(
      `/channels/${this.channelId}/messages/${messageId}`,
    );
    return this._add(data.message);
  }

  /**
   * Sends a new message to this channel.
   *
   * @param options - Message content and options
   * @returns The created Message
   *
   * @example
   * ```ts
   * // Simple text message
   * const msg = await channel.messages.send({ content: 'Hello, world!' });
   *
   * // Reply to another message
   * const reply = await channel.messages.send({
   *   content: 'This is a reply!',
   *   reply_to_id: originalMessageId,
   * });
   * ```
   */
  async send(options: APIMessageCreate): Promise<Message> {
    const data = await this.client.rest.post<{ message: APIMessage }>(
      `/channels/${this.channelId}/messages`,
      { body: options as unknown as Record<string, unknown> },
    );
    return this._add(data.message);
  }

  /**
   * Edits a message sent by the bot.
   *
   * @param messageId - The message to edit
   * @param content - The new message content (string or edit options object)
   * @returns The updated Message
   *
   * @example
   * ```ts
   * // Simple string
   * await channel.messages.edit(msg.id, 'Updated!');
   *
   * // With embeds
   * await channel.messages.edit(msg.id, { embeds: [embed.build()] });
   * ```
   */
  async edit(messageId: Snowflake, content: string | APIMessageEdit): Promise<Message> {
    const body: APIMessageEdit = typeof content === 'string' ? { content } : content;
    const data = await this.client.rest.patch<{ message: APIMessage }>(
      `/channels/${this.channelId}/messages/${messageId}`,
      { body: body as unknown as Record<string, unknown> },
    );
    return this._add(data.message);
  }

  /**
   * Deletes a message.
   *
   * @param messageId - The message to delete
   */
  async delete(messageId: Snowflake): Promise<void> {
    await this.client.rest.delete(`/channels/${this.channelId}/messages/${messageId}`);
    this.cache.delete(messageId);
  }

  /**
   * Bulk deletes multiple messages (up to 100).
   *
   * @param messageIds - Array of message IDs to delete
   * @returns The number of messages actually deleted
   *
   * @example
   * ```ts
   * // Delete last 50 messages
   * const messages = await channel.messages.list({ limit: 50 });
   * await channel.messages.bulkDelete(messages.toKeyArray());
   * ```
   */
  async bulkDelete(messageIds: Snowflake[]): Promise<number> {
    const data = await this.client.rest.post<{ deleted: number }>(
      `/channels/${this.channelId}/messages/bulk-delete`,
      { body: { message_ids: messageIds } },
    );

    // Remove from cache
    for (const id of messageIds) {
      this.cache.delete(id);
    }

    return data.deleted;
  }

  /**
   * Adds a message to the cache and initializes its reaction manager.
   * @internal
   */
  _add(data: APIMessage): Message {
    let message = this.cache.get(data.id);
    if (message) {
      message._patch(data);
    } else {
      message = new Message(this.client, data);
      this.cache.set(data.id, message);
    }

    if (!message.reactions) {
      message.reactions = new ReactionManager(this.client, this.channelId, message.id);
    }

    return message;
  }
}
