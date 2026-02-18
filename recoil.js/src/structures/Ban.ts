/**
 * @module recoil.js/structures/Ban
 * Represents a ban record in a server.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIBan, Snowflake } from '../types';
import { Base } from './Base';

/**
 * Represents a server ban record.
 *
 * @example
 * ```ts
 * const bans = await server.bans.list();
 * for (const ban of bans.values()) {
 *   console.log(`${ban.username} — ${ban.reason}`);
 * }
 *
 * // Unban a user
 * await server.bans.remove('user-id');
 * ```
 */
export class Ban extends Base {
  /** The server this ban belongs to */
  public readonly serverId: Snowflake;

  /** The banned user's ID */
  public readonly userId: Snowflake;

  /** ID of the moderator who issued the ban */
  public readonly moderatorId: Snowflake | null;

  /** The reason for the ban */
  public readonly reason: string | null;

  /** The banned user's username */
  public readonly username: string;

  /** The banned user's display name */
  public readonly displayName: string | null;

  /** URL to the banned user's avatar */
  public readonly avatarURL: string | null;

  /** When this ban was created */
  public readonly createdAt: Date;

  /** When this ban expires (null = permanent) */
  public readonly expiresAt: Date | null;

  constructor(client: RecoilClient, data: APIBan) {
    super(client, data.id);
    this.serverId = data.server_id;
    this.userId = data.user_id;
    this.moderatorId = data.moderator_id;
    this.reason = data.reason;
    this.username = data.username;
    this.displayName = data.display_name;
    this.avatarURL = data.avatar_url;
    this.createdAt = new Date(data.created_at);
    this.expiresAt = data.expires_at ? new Date(data.expires_at) : null;
  }

  /**
   * Whether this ban is permanent (no expiry).
   */
  get isPermanent(): boolean {
    return this.expiresAt === null;
  }

  /**
   * Whether this ban has expired.
   */
  get isExpired(): boolean {
    if (this.isPermanent) return false;
    return this.expiresAt!.getTime() < Date.now();
  }

  /**
   * Remove (unban) this ban.
   */
  async remove(): Promise<void> {
    await this.client.rest.delete(`/servers/${this.serverId}/bans/${this.userId}`);
  }

  override toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      server_id: this.serverId,
      user_id: this.userId,
      moderator_id: this.moderatorId,
      reason: this.reason,
      username: this.username,
      display_name: this.displayName,
      created_at: this.createdAt.toISOString(),
      expires_at: this.expiresAt?.toISOString() ?? null,
    };
  }
}
