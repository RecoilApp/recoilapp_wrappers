/**
 * @module recoil.js/structures/Thread
 * Represents a message thread within a channel.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIThread, Snowflake } from '../types';
import { Base } from './Base';

/**
 * Represents a thread within a channel.
 *
 * @example
 * ```ts
 * const thread = await channel.threads.create({
 *   name: 'Bug Discussion',
 *   parent_message_id: someMessageId,
 * });
 * console.log(thread.name);         // 'Bug Discussion'
 * console.log(thread.messageCount);  // 0
 * ```
 */
export class Thread extends Base {
  /** The channel this thread belongs to */
  public readonly channelId: Snowflake;

  /** The thread's name */
  public name: string;

  /** ID of the user who created this thread */
  public readonly creatorId: Snowflake | null;

  /** ID of the message this thread was created from */
  public readonly parentMessageId: Snowflake | null;

  /** Whether this thread is archived */
  public isArchived: boolean;

  /** Whether this thread is locked */
  public isLocked: boolean;

  /** Auto-archive duration in minutes */
  public autoArchiveMinutes: number;

  /** Number of messages in this thread */
  public messageCount: number;

  /** Number of members in this thread */
  public memberCount: number;

  /** When this thread was created */
  public readonly createdAt: Date;

  constructor(client: RecoilClient, data: APIThread) {
    super(client, data.id);
    this.channelId = data.channel_id;
    this.name = data.name;
    this.creatorId = data.creator_id;
    this.parentMessageId = data.parent_message_id;
    this.isArchived = data.is_archived;
    this.isLocked = data.is_locked;
    this.autoArchiveMinutes = data.auto_archive_minutes;
    this.messageCount = data.message_count ?? 0;
    this.memberCount = data.member_count ?? 0;
    this.createdAt = new Date(data.created_at);
  }

  /**
   * Whether this thread is still active (not archived or locked).
   */
  get isActive(): boolean {
    return !this.isArchived && !this.isLocked;
  }

  override toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      channel_id: this.channelId,
      name: this.name,
      creator_id: this.creatorId,
      parent_message_id: this.parentMessageId,
      is_archived: this.isArchived,
      is_locked: this.isLocked,
      auto_archive_minutes: this.autoArchiveMinutes,
      message_count: this.messageCount,
      member_count: this.memberCount,
      created_at: this.createdAt.toISOString(),
    };
  }
}
