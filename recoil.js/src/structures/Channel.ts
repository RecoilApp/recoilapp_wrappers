/**
 * @module recoil.js/structures/Channel
 * Represents a text, voice, or announcement channel in a server.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIChannel, APIChannelEdit, Snowflake } from '../types';
import { ChannelType } from '../types';
import { Base } from './Base';
import type { MessageManager } from '../managers/MessageManager';
import type { ThreadManager } from '../managers/ThreadManager';
import type { PinManager } from '../managers/PinManager';

/**
 * Represents a channel within a server.
 *
 * @example
 * ```ts
 * const channel = await server.channels.fetch('channel-id');
 * console.log(channel.name);     // 'general'
 * console.log(channel.type);     // 'text'
 * console.log(channel.isText()); // true
 *
 * // Send a message
 * await channel.send('Hello from the bot!');
 *
 * // Fetch messages
 * const messages = await channel.messages.list({ limit: 10 });
 * ```
 */
export class Channel extends Base {
  /** The server this channel belongs to */
  public readonly serverId: Snowflake;

  /** The channel's name */
  public name: string;

  /** The channel's topic / description */
  public topic: string;

  /** The channel type (text, voice, announcement) */
  public type: ChannelType;

  /** The channel's position in the server's channel list */
  public position: number;

  /** Whether this channel is private (hidden from non-permitted members) */
  public isPrivate: boolean;

  /** Number of messages in this channel */
  public messageCount: number;

  /** Number of pinned messages in this channel */
  public pinCount: number;

  /** Number of threads in this channel */
  public threadCount: number;

  /** When this channel was created */
  public createdAt: Date;

  // ── Sub-Managers ────────────────────────────────────────

  /** Manager for messages in this channel */
  public messages!: MessageManager;

  /** Manager for threads in this channel */
  public threads!: ThreadManager;

  /** Manager for pinned messages in this channel */
  public pins!: PinManager;

  /**
   * @param client - The RecoilClient instance
   * @param data - Raw API channel data
   */
  constructor(client: RecoilClient, data: APIChannel) {
    super(client, data.id);
    this.serverId = data.server_id;
    this.name = data.name;
    this.topic = data.topic;
    this.type = data.type;
    this.position = data.position;
    this.isPrivate = data.is_private;
    this.messageCount = data.message_count ?? 0;
    this.pinCount = data.pin_count ?? 0;
    this.threadCount = data.thread_count ?? 0;
    this.createdAt = new Date(data.created_at);

    // Sub-managers are initialized after construction by ChannelManager
  }

  /**
   * Updates this channel's cached data from new API data.
   * @internal
   */
  _patch(data: Partial<APIChannel>): this {
    if (data.name !== undefined) this.name = data.name;
    if (data.topic !== undefined) this.topic = data.topic;
    if (data.position !== undefined) this.position = data.position;
    if (data.is_private !== undefined) this.isPrivate = data.is_private;
    if (data.message_count !== undefined) this.messageCount = data.message_count;
    if (data.pin_count !== undefined) this.pinCount = data.pin_count ?? 0;
    if (data.thread_count !== undefined) this.threadCount = data.thread_count ?? 0;
    return this;
  }

  /**
   * Whether this is a text channel.
   */
  isText(): boolean {
    return this.type === ChannelType.Text;
  }

  /**
   * Whether this is a voice channel.
   */
  isVoice(): boolean {
    return this.type === ChannelType.Voice;
  }

  /**
   * Whether this is an announcement channel.
   */
  isAnnouncement(): boolean {
    return this.type === ChannelType.Announcement;
  }

  /**
   * Send a message to this channel.
   * Convenience shortcut for `channel.messages.send(content)`.
   *
   * @param content - The message content (or options object)
   * @returns The created Message
   *
   * @example
   * ```ts
   * await channel.send('Hello, world!');
   * await channel.send({ content: 'Reply!', reply_to_id: someMessageId });
   * ```
   */
  async send(content: string | { content: string; reply_to_id?: Snowflake }) {
    const body = typeof content === 'string' ? { content } : content;
    return this.messages.send(body);
  }

  /**
   * Edit this channel's properties.
   *
   * @param data - Fields to update
   * @returns The updated Channel instance
   *
   * @example
   * ```ts
   * await channel.edit({ name: 'announcements', topic: 'Important stuff only' });
   * ```
   */
  async edit(data: APIChannelEdit): Promise<Channel> {
    const result = await this.client.rest.patch<{ channel: APIChannel }>(
      `/channels/${this.id}`,
      { body: data as Record<string, unknown> },
    );
    return this._patch(result.channel);
  }

  /**
   * Delete this channel.
   *
   * @example
   * ```ts
   * await channel.delete();
   * ```
   */
  async delete(): Promise<void> {
    await this.client.rest.delete(`/channels/${this.id}`);
  }

  /**
   * Fetch fresh data for this channel from the API.
   */
  async fetch(): Promise<Channel> {
    const result = await this.client.rest.get<{ channel: APIChannel }>(
      `/channels/${this.id}`,
    );
    return this._patch(result.channel);
  }

  /**
   * Returns a formatted mention string for this channel.
   */
  mention(): string {
    return `#${this.name}`;
  }

  override toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      server_id: this.serverId,
      name: this.name,
      topic: this.topic,
      type: this.type,
      position: this.position,
      is_private: this.isPrivate,
      message_count: this.messageCount,
      pin_count: this.pinCount,
      thread_count: this.threadCount,
      created_at: this.createdAt.toISOString(),
    };
  }
}
