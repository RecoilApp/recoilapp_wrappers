/**
 * @module recoil.js/managers/RoleManager
 * Manages roles within a specific server.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIRole, APIRoleCreate, APIRoleEdit, Snowflake } from '../types';
import { BaseManager } from './BaseManager';
import { Role } from '../structures/Role';
import { Collection } from '../util/Collection';

/**
 * Manages roles for a specific server.
 *
 * @example
 * ```ts
 * // List all roles
 * const roles = await server.roles.list();
 *
 * // Create a new role
 * const role = await server.roles.create({
 *   name: 'Moderator',
 *   color: '#00BFBF',
 *   permissions: (Permissions.Flags.BanMembers | Permissions.Flags.KickMembers).toString(),
 * });
 *
 * // Edit a role
 * await server.roles.edit(role.id, { name: 'Senior Mod' });
 *
 * // Delete a role
 * await server.roles.delete(role.id);
 * ```
 */
export class RoleManager extends BaseManager<Role> {
  /** The server ID this manager is scoped to */
  public readonly serverId: Snowflake;

  constructor(client: RecoilClient, serverId: Snowflake) {
    super(client);
    this.serverId = serverId;
  }

  /**
   * Fetches all roles in this server.
   * @returns A Collection of Role instances (sorted by position descending)
   */
  async list(): Promise<Collection<Snowflake, Role>> {
    const data = await this.client.rest.get<{ roles: APIRole[] }>(
      `/servers/${this.serverId}/roles`,
    );

    const result = new Collection<Snowflake, Role>();
    for (const roleData of data.roles) {
      const role = this._add(roleData);
      result.set(role.id, role);
    }
    return result;
  }

  /**
   * Creates a new role in this server.
   *
   * @param options - Role creation options
   * @returns The newly created Role
   */
  async create(options: APIRoleCreate): Promise<Role> {
    const data = await this.client.rest.post<{ role: APIRole }>(
      `/servers/${this.serverId}/roles`,
      { body: options as unknown as Record<string, unknown> },
    );
    return this._add(data.role);
  }

  /**
   * Edits a role's properties.
   *
   * @param roleId - The role to edit
   * @param options - Fields to update
   * @returns The updated Role
   */
  async edit(roleId: Snowflake, options: APIRoleEdit): Promise<Role> {
    const data = await this.client.rest.patch<{ role: APIRole }>(
      `/servers/${this.serverId}/roles/${roleId}`,
      { body: options as unknown as Record<string, unknown> },
    );
    return this._add(data.role);
  }

  /**
   * Deletes a role.
   *
   * @param roleId - The role to delete
   */
  async delete(roleId: Snowflake): Promise<void> {
    await this.client.rest.delete(`/servers/${this.serverId}/roles/${roleId}`);
    this.cache.delete(roleId);
  }

  /**
   * Returns the highest role in the cache (by position).
   */
  get highest(): Role | undefined {
    return this.cache.reduce<Role | undefined>((highest, role) => {
      if (!highest || role.position > highest.position) return role;
      return highest;
    }, undefined);
  }

  /**
   * Returns the default (@everyone) role from cache.
   */
  get everyone(): Role | undefined {
    return this.cache.find(r => r.isDefault);
  }

  /**
   * Adds a role to the cache.
   * @internal
   */
  _add(data: APIRole): Role {
    let role = this.cache.get(data.id);
    if (role) {
      role._patch(data);
    } else {
      role = new Role(this.client, data);
      this.cache.set(data.id, role);
    }
    return role;
  }
}
