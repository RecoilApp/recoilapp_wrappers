/**
 * @module recoil.js/structures/Member
 * Represents a member of a server.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIMember, APIMemberEdit, APIMemberRole, Snowflake } from '../types';
import { UserStatus } from '../types';
import { Base } from './Base';
import { Collection } from '../util/Collection';
import { Permissions } from '../util/Permissions';

/**
 * Represents a member within a specific server.
 * A member is a user with server-specific attributes like nickname and roles.
 *
 * @example
 * ```ts
 * const member = await server.members.fetch('user-id');
 * console.log(member.username);     // 'Aurora'
 * console.log(member.nickname);     // 'Admin Aurora'
 * console.log(member.displayTag);   // 'Admin Aurora' (prefers nickname)
 * console.log(member.roles.size);   // 3
 *
 * // Modify the member
 * await member.setNickname('New Nick');
 * await member.kick('Violated rules');
 * ```
 */
export class Member extends Base {
  /** The server this member belongs to */
  public readonly serverId: Snowflake;

  /** The member's username */
  public readonly username: string;

  /** The member's display name */
  public readonly displayName: string | null;

  /** URL to the member's avatar */
  public readonly avatarURL: string | null;

  /** The member's server-specific nickname */
  public nickname: string | null;

  /** The member's current status */
  public status: UserStatus;

  /** The member's bio */
  public bio: string | null;

  /** URL to the member's banner image */
  public bannerURL: string | null;

  /** When this member joined the server */
  public joinedAt: Date;

  /** The member's roles, cached as a Collection */
  public readonly roles: Collection<Snowflake, MemberRole>;

  /**
   * @param client - The RecoilClient instance
   * @param serverId - The server this member belongs to
   * @param data - Raw API member data
   */
  constructor(client: RecoilClient, serverId: Snowflake, data: APIMember) {
    super(client, data.user_id);
    this.serverId = serverId;
    this.username = data.username;
    this.displayName = data.display_name;
    this.avatarURL = data.avatar_url;
    this.nickname = data.nickname;
    this.status = data.status;
    this.bio = data.bio ?? null;
    this.bannerURL = data.banner_url ?? null;
    this.joinedAt = new Date(data.joined_at);

    this.roles = new Collection<Snowflake, MemberRole>();
    if (Array.isArray(data.roles)) {
      for (const role of data.roles) {
        this.roles.set(role.id, new MemberRole(role));
      }
    }
  }

  /**
   * The name to display. Prefers nickname, then display_name, then username.
   */
  get displayTag(): string {
    return this.nickname ?? this.displayName ?? this.username;
  }

  /**
   * Returns a mention string for this member.
   */
  mention(): string {
    return `@${this.username}`;
  }

  /**
   * Calculates the combined permissions from all of this member's roles.
   */
  get permissions(): Permissions {
    let bits = 0n;
    for (const role of this.roles.values()) {
      if (role.permissions) {
        bits |= BigInt(role.permissions);
      }
    }
    return new Permissions(bits);
  }

  /**
   * The highest role this member has (by position).
   */
  get highestRole(): MemberRole | null {
    if (this.roles.size === 0) return null;
    return this.roles.reduce<MemberRole | null>((highest, role) => {
      if (!highest || role.position > highest.position) return role;
      return highest;
    }, null);
  }

  /**
   * The display color from the highest colored role.
   */
  get displayColor(): string | null {
    const sorted = this.roles
      .filter(r => r.color !== '#000000' && r.color !== '#99AAB5')
      .sort((a, b) => b.position - a.position);
    return sorted.first()?.color ?? null;
  }

  /**
   * Modify this member's properties.
   *
   * @param data - Fields to update (nickname, roles)
   * @returns The updated Member
   *
   * @example
   * ```ts
   * await member.edit({ nickname: 'Cool Nick', roles: ['role-id-1', 'role-id-2'] });
   * ```
   */
  async edit(data: APIMemberEdit): Promise<this> {
    await this.client.rest.patch(
      `/servers/${this.serverId}/members/${this.id}`,
      { body: data as Record<string, unknown> },
    );
    if (data.nickname !== undefined) this.nickname = data.nickname;
    return this;
  }

  /**
   * Set this member's nickname.
   * @param nickname - The new nickname (or `null` to clear)
   */
  async setNickname(nickname: string | null): Promise<this> {
    return this.edit({ nickname });
  }

  /**
   * Add a role to this member.
   * @param roleId - The ID of the role to add
   */
  async addRole(roleId: Snowflake): Promise<void> {
    await this.client.rest.put(
      `/servers/${this.serverId}/members/${this.id}/roles/${roleId}`,
    );
  }

  /**
   * Remove a role from this member.
   * @param roleId - The ID of the role to remove
   */
  async removeRole(roleId: Snowflake): Promise<void> {
    await this.client.rest.delete(
      `/servers/${this.serverId}/members/${this.id}/roles/${roleId}`,
    );
  }

  /**
   * Kick this member from the server.
   * @param reason - Optional audit log reason
   */
  async kick(reason?: string): Promise<void> {
    await this.client.rest.delete(
      `/servers/${this.serverId}/members/${this.id}`,
      { body: reason ? { reason } : undefined },
    );
  }

  /**
   * Ban this member from the server.
   * @param options - Ban options (reason, delete_message_days)
   */
  async ban(options?: { reason?: string; deleteMessageDays?: number }): Promise<void> {
    await this.client.rest.put(
      `/servers/${this.serverId}/bans/${this.id}`,
      {
        body: options ? {
          reason: options.reason,
          delete_message_days: options.deleteMessageDays,
        } : undefined,
      },
    );
  }

  override toJSON(): Record<string, unknown> {
    return {
      user_id: this.id,
      server_id: this.serverId,
      username: this.username,
      display_name: this.displayName,
      nickname: this.nickname,
      avatar_url: this.avatarURL,
      status: this.status,
      joined_at: this.joinedAt.toISOString(),
      roles: this.roles.toArray().map(r => r.toJSON()),
    };
  }
}

/**
 * A lightweight role object embedded in a Member structure.
 * Contains the basic role info without full CRUD capabilities.
 */
export class MemberRole {
  public readonly id: Snowflake;
  public readonly name: string;
  public readonly color: string;
  public readonly position: number;
  public readonly permissions: string | null;

  constructor(data: APIMemberRole) {
    this.id = data.id;
    this.name = data.name;
    this.color = data.color;
    this.position = data.position;
    this.permissions = data.permissions ?? null;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      color: this.color,
      position: this.position,
    };
  }
}
