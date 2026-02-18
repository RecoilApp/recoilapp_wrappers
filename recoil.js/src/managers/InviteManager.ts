/**
 * @module recoil.js/managers/InviteManager
 * Manages invites within a specific server.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIInvite, APIInviteCreate, Snowflake } from '../types';
import { BaseManager } from './BaseManager';
import { Invite } from '../structures/Invite';
import { Collection } from '../util/Collection';

/**
 * Manages invites for a specific server.
 *
 * @example
 * ```ts
 * // List all invites
 * const invites = await server.invites.list();
 *
 * // Create a new invite
 * const invite = await server.invites.create({
 *   max_uses: 10,
 *   max_age_seconds: 86400, // 24 hours
 * });
 * console.log(invite.url);
 *
 * // Delete an invite
 * await server.invites.delete(invite.id);
 * ```
 */
export class InviteManager extends BaseManager<Invite> {
  /** The server ID this manager is scoped to */
  public readonly serverId: Snowflake;

  constructor(client: RecoilClient, serverId: Snowflake) {
    super(client);
    this.serverId = serverId;
  }

  /**
   * Fetches all active invites in this server.
   * @returns A Collection of Invite instances
   */
  async list(): Promise<Collection<Snowflake, Invite>> {
    const data = await this.client.rest.get<{ invites: APIInvite[] }>(
      `/servers/${this.serverId}/invites`,
    );

    const result = new Collection<Snowflake, Invite>();
    for (const inviteData of data.invites) {
      const invite = new Invite(this.client, inviteData);
      this.cache.set(invite.id, invite);
      result.set(invite.id, invite);
    }
    return result;
  }

  /**
   * Creates a new invite for this server.
   *
   * @param options - Invite creation options
   * @returns The newly created Invite
   */
  async create(options?: APIInviteCreate): Promise<Invite> {
    const data = await this.client.rest.post<{ invite: APIInvite }>(
      `/servers/${this.serverId}/invites`,
      { body: (options ?? {}) as unknown as Record<string, unknown> },
    );
    const invite = new Invite(this.client, data.invite);
    this.cache.set(invite.id, invite);
    return invite;
  }

  /**
   * Deletes (revokes) an invite.
   *
   * @param inviteId - The invite to delete
   */
  async delete(inviteId: Snowflake): Promise<void> {
    await this.client.rest.delete(`/servers/${this.serverId}/invites/${inviteId}`);
    this.cache.delete(inviteId);
  }
}
