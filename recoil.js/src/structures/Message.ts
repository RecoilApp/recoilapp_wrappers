/**
 * @module recoil.js/structures/Message
 * Represents a message sent in a channel.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIMessage, APIMessageEdit, APIEmbed, Snowflake } from '../types';
import { Base } from './Base';
import { User } from './User';
import type { ReactionManager } from '../managers/ReactionManager';

/**
 * Represents a message in a channel.
 *
 * @example
 * ```ts
 * const message = await channel.messages.fetch('message-id');
 * console.log(message.content);      // 'Hello!'
 * console.log(message.author.tag);   // 'Aurora'
 * console.log(message.isEdited);     // false
 *
 * // Reply to the message
 * await message.reply('Hi back!');
 *
 * // Edit the message (only works for bot's own messages)
 * await message.edit('Updated content');
 *
 * // React to the message
 * await message.react('👍');
 * ```
 */
export class Message extends Base {
  /** The channel this message was sent in */
  public readonly channelId: Snowflake;

  /** The message content */
  public content: string;

  /** URL to the message's attachment (if any) */
  public attachmentURL: string | null;

  /** MIME type of the attachment */
  public attachmentType: string | null;

  /** Original filename of the attachment */
  public attachmentName: string | null;

  /** ID of the message this is replying to */
  public replyToId: Snowflake | null;

  /** Rich container embeds attached to this message */
  public embeds: APIEmbed[];

  /** Whether this message has been edited */
  public isEdited: boolean;

  /** When this message was created */
  public createdAt: Date;

  /** When this message was last edited (null if never edited) */
  public updatedAt: Date | null;

  /** The author of this message */
  public readonly author: User;

  /** Manager for reactions on this message */
  public reactions!: ReactionManager;

  /**
   * @param client - The RecoilClient instance
   * @param data - Raw API message data
   */
  constructor(client: RecoilClient, data: APIMessage) {
    super(client, data.id);
    this.channelId = data.channel_id;
    this.content = data.content;
    this.attachmentURL = data.attachment_url ?? null;
    this.attachmentType = data.attachment_type ?? null;
    this.attachmentName = data.attachment_name ?? null;
    this.replyToId = data.reply_to_id;
    this.embeds = data.embeds ?? [];
    this.isEdited = data.is_edited;
    this.createdAt = new Date(data.created_at);
    this.updatedAt = data.updated_at ? new Date(data.updated_at) : null;
    this.author = new User(client, data.author);

    // ReactionManager is initialized after construction
  }

  /**
   * Updates this message's cached data.
   * @internal
   */
  _patch(data: Partial<APIMessage>): this {
    if (data.content !== undefined) this.content = data.content;
    if (data.is_edited !== undefined) this.isEdited = data.is_edited;
    if (data.updated_at !== undefined) this.updatedAt = data.updated_at ? new Date(data.updated_at) : null;
    if (data.attachment_url !== undefined) this.attachmentURL = data.attachment_url ?? null;
    if (data.embeds !== undefined) this.embeds = data.embeds ?? [];
    return this;
  }

  /**
   * Whether this message was sent by the bot.
   */
  get isFromBot(): boolean {
    return this.author.isBot && this.author.id === this.client.user?.id;
  }

  /**
   * Whether this message is a reply to another message.
   */
  get isReply(): boolean {
    return this.replyToId !== null;
  }

  /**
   * Whether this message has an attachment.
   */
  get hasAttachment(): boolean {
    return this.attachmentURL !== null;
  }

  /**
   * Whether this message has rich embeds.
   */
  get hasEmbeds(): boolean {
    return this.embeds.length > 0;
  }

  /**
   * The timestamp of this message as a Unix timestamp (seconds).
   */
  get createdTimestamp(): number {
    return Math.floor(this.createdAt.getTime() / 1000);
  }

  /**
   * Edit this message's content.
   * Only works for messages sent by the bot.
   *
   * @param content - New message content (string or edit options object)
   * @returns The updated Message
   *
   * @example
   * ```ts
   * // Simple string
   * const msg = await channel.send('Loading...');
   * await msg.edit('Done! ✅');
   *
   * // Using APIMessageEdit object
   * await msg.edit({ content: 'Updated content' });
   *
   * // Edit with embeds
   * await msg.edit({ embeds: [embed.build()] });
   * ```
   */
  async edit(content: string | APIMessageEdit): Promise<Message> {
    const body: APIMessageEdit = typeof content === 'string' ? { content } : content;
    const result = await this.client.rest.patch<{ message: APIMessage }>(
      `/channels/${this.channelId}/messages/${this.id}`,
      { body: body as unknown as Record<string, unknown> },
    );
    return this._patch(result.message);
  }

  /**
   * Delete this message.
   *
   * @example
   * ```ts
   * await message.delete();
   * ```
   */
  async delete(): Promise<void> {
    await this.client.rest.delete(`/channels/${this.channelId}/messages/${this.id}`);
  }

  /**
   * Reply to this message.
   *
   * @param content - The reply content (string or message create options)
   * @returns The new reply Message
   *
   * @example
   * ```ts
   * await message.reply('Thanks for the message!');
   *
   * // Reply with embeds
   * await message.reply({ content: 'Check this out', embeds: [embed.build()] });
   * ```
   */
  async reply(content: string | { content?: string; embeds?: APIEmbed[] }): Promise<Message> {
    const body = typeof content === 'string'
      ? { content, reply_to_id: this.id }
      : { ...content, reply_to_id: this.id };
    const result = await this.client.rest.post<{ message: APIMessage }>(
      `/channels/${this.channelId}/messages`,
      { body },
    );
    return new Message(this.client, result.message);
  }

  /**
   * Add a reaction to this message.
   *
   * @param emoji - The emoji to react with (Unicode or custom emoji name)
   *
   * @example
   * ```ts
   * await message.react('👍');
   * await message.react('🎉');
   * ```
   */
  async react(emoji: string): Promise<void> {
    await this.client.rest.put(
      `/channels/${this.channelId}/messages/${this.id}/reactions/${encodeURIComponent(emoji)}`,
    );
  }

  /**
   * Remove the bot's reaction from this message.
   *
   * @param emoji - The emoji to remove
   */
  async unreact(emoji: string): Promise<void> {
    await this.client.rest.delete(
      `/channels/${this.channelId}/messages/${this.id}/reactions/${encodeURIComponent(emoji)}`,
    );
  }

  /**
   * Pin this message in its channel.
   */
  async pin(): Promise<void> {
    await this.client.rest.put(`/channels/${this.channelId}/pins/${this.id}`);
  }

  /**
   * Unpin this message from its channel.
   */
  async unpin(): Promise<void> {
    await this.client.rest.delete(`/channels/${this.channelId}/pins/${this.id}`);
  }

  /**
   * Fetch the message this is replying to (if any).
   * @returns The referenced Message, or `null` if not a reply
   */
  async fetchReference(): Promise<Message | null> {
    if (!this.replyToId) return null;
    const result = await this.client.rest.get<{ message: APIMessage }>(
      `/channels/${this.channelId}/messages/${this.replyToId}`,
    );
    return new Message(this.client, result.message);
  }

  override toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      channel_id: this.channelId,
      content: this.content,
      attachment_url: this.attachmentURL,
      reply_to_id: this.replyToId,
      embeds: this.embeds.length > 0 ? this.embeds : null,
      is_edited: this.isEdited,
      created_at: this.createdAt.toISOString(),
      author: this.author.toJSON(),
    };
  }
}
