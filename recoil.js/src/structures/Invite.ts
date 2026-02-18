/**
 * @module recoil.js/structures/Invite
 * Represents a server invite link.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIInvite, Snowflake } from '../types';
import { Base } from './Base';

/**
 * Represents an invite to a server.
 *
 * @example
 * ```ts
 * const invite = await server.invites.create({ max_uses: 10, max_age_seconds: 3600 });
 * console.log(invite.code);      // 'a1b2c3d4'
 * console.log(invite.url);       // 'https://recoilapp.com/invite/a1b2c3d4'
 * console.log(invite.uses);      // 0
 * console.log(invite.isExpired); // false
 * ```
 */
export class Invite extends Base {
  /** The server this invite is for */
  public readonly serverId: Snowflake;

  /** The channel this invite leads to */
  public readonly channelId: Snowflake | null;

  /** ID of the user who created this invite */
  public readonly creatorId: Snowflake | null;

  /** The unique invite code */
  public readonly code: string;

  /** Maximum number of uses (null = unlimited) */
  public readonly maxUses: number | null;

  /** Number of times this invite has been used */
  public readonly uses: number;

  /** When this invite expires (null = never) */
  public readonly expiresAt: Date | null;

  /** Whether this invite has been revoked */
  public readonly isRevoked: boolean;

  /** Username of the invite creator */
  public readonly creatorUsername: string | null;

  /** When this invite was created */
  public readonly createdAt: Date;

  constructor(client: RecoilClient, data: APIInvite) {
    super(client, data.id);
    this.serverId = data.server_id;
    this.channelId = data.channel_id;
    this.creatorId = data.creator_id;
    this.code = data.code;
    this.maxUses = data.max_uses;
    this.uses = data.uses;
    this.expiresAt = data.expires_at ? new Date(data.expires_at) : null;
    this.isRevoked = data.is_revoked;
    this.creatorUsername = data.creator_username ?? null;
    this.createdAt = new Date(data.created_at);
  }

  /**
   * Whether this invite has expired.
   */
  get isExpired(): boolean {
    if (this.isRevoked) return true;
    if (this.expiresAt && this.expiresAt.getTime() < Date.now()) return true;
    if (this.maxUses !== null && this.uses >= this.maxUses) return true;
    return false;
  }

  /**
   * Remaining uses for this invite (null if unlimited).
   */
  get remainingUses(): number | null {
    if (this.maxUses === null) return null;
    return Math.max(0, this.maxUses - this.uses);
  }

  /**
   * The full invite URL.
   */
  get url(): string {
    return `https://recoilapp.com/invite/${this.code}`;
  }

  /**
   * Delete (revoke) this invite.
   */
  async delete(): Promise<void> {
    await this.client.rest.delete(`/servers/${this.serverId}/invites/${this.id}`);
  }

  override toString(): string {
    return this.url;
  }

  override toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      server_id: this.serverId,
      channel_id: this.channelId,
      code: this.code,
      max_uses: this.maxUses,
      uses: this.uses,
      expires_at: this.expiresAt?.toISOString() ?? null,
      is_revoked: this.isRevoked,
      created_at: this.createdAt.toISOString(),
    };
  }
}
