/**
 * @module recoil.js/managers/MemberManager
 * Manages members within a specific server.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIMember, APIMemberEdit, Snowflake } from '../types';
import { BaseManager } from './BaseManager';
import { Member } from '../structures/Member';
import { Collection } from '../util/Collection';

/**
 * Manages members for a specific server.
 *
 * @example
 * ```ts
 * // List members
 * const members = await server.members.list({ limit: 100 });
 *
 * // Fetch a specific member
 * const member = await server.members.fetch('user-id');
 *
 * // Modify a member
 * await server.members.edit('user-id', { nickname: 'Cool Nick' });
 *
 * // Kick a member
 * await server.members.kick('user-id', 'Violated rules');
 * ```
 */
export class MemberManager extends BaseManager<Member> {
  /** The server ID this manager is scoped to */
  public readonly serverId: Snowflake;

  constructor(client: RecoilClient, serverId: Snowflake) {
    super(client);
    this.serverId = serverId;
  }

  /**
   * Fetches members from this server.
   *
   * @param options - Pagination options
   * @returns A Collection of Member instances
   */
  async list(options?: { limit?: number; offset?: number }): Promise<Collection<Snowflake, Member>> {
    const query: Record<string, string | number> = {};
    if (options?.limit) query.limit = options.limit;
    if (options?.offset) query.offset = options.offset;

    const data = await this.client.rest.get<{ members: APIMember[]; limit: number; offset: number }>(
      `/servers/${this.serverId}/members`,
      { query },
    );

    const result = new Collection<Snowflake, Member>();
    for (const memberData of data.members) {
      const member = this._add(memberData);
      result.set(member.id, member);
    }
    return result;
  }

  /**
   * Fetches a specific member by user ID.
   *
   * @param userId - The user's UUID
   * @returns The Member instance
   */
  async fetch(userId: Snowflake): Promise<Member> {
    const data = await this.client.rest.get<{ member: APIMember }>(
      `/servers/${this.serverId}/members/${userId}`,
    );
    return this._add(data.member);
  }

  /**
   * Modifies a member's properties.
   *
   * @param userId - The user's UUID
   * @param options - Fields to update (nickname, roles)
   * @returns The updated Member
   */
  async edit(userId: Snowflake, options: APIMemberEdit): Promise<Member> {
    const data = await this.client.rest.patch<{ member: APIMember }>(
      `/servers/${this.serverId}/members/${userId}`,
      { body: options as unknown as Record<string, unknown> },
    );
    return this._add(data.member);
  }

  /**
   * Kicks a member from the server.
   *
   * @param userId - The user to kick
   * @param reason - Optional audit log reason
   */
  async kick(userId: Snowflake, reason?: string): Promise<void> {
    await this.client.rest.delete(
      `/servers/${this.serverId}/members/${userId}`,
      { body: reason ? { reason } : undefined },
    );
    this.cache.delete(userId);
  }

  /**
   * Adds a role to a member.
   *
   * @param userId - The user's UUID
   * @param roleId - The role's UUID
   */
  async addRole(userId: Snowflake, roleId: Snowflake): Promise<void> {
    await this.client.rest.put(
      `/servers/${this.serverId}/members/${userId}/roles/${roleId}`,
    );
  }

  /**
   * Removes a role from a member.
   *
   * @param userId - The user's UUID
   * @param roleId - The role's UUID
   */
  async removeRole(userId: Snowflake, roleId: Snowflake): Promise<void> {
    await this.client.rest.delete(
      `/servers/${this.serverId}/members/${userId}/roles/${roleId}`,
    );
  }

  /**
   * Adds a member to the cache, patching existing entries.
   * @internal
   */
  _add(data: APIMember): Member {
    const existing = this.cache.get(data.user_id);
    if (existing) {
      // Patch existing member instead of creating a new instance
      existing._patch(data);
      return existing;
    }
    const member = new Member(this.client, this.serverId, data);
    this.cache.set(data.user_id, member);
    return member;
  }
}
