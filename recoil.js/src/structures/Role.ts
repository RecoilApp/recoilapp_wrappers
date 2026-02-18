/**
 * @module recoil.js/structures/Role
 * Represents a role in a server with associated permissions.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIRole, APIRoleEdit, Snowflake } from '../types';
import { Base } from './Base';
import { Permissions } from '../util/Permissions';

/**
 * Represents a role within a server.
 * Roles define permission sets and can be assigned to members.
 *
 * @example
 * ```ts
 * const role = await server.roles.create({ name: 'Moderator', color: '#00BFBF' });
 * console.log(role.name);         // 'Moderator'
 * console.log(role.color);        // '#00BFBF'
 * console.log(role.permissions);  // Permissions instance
 *
 * // Check if role has a permission
 * role.permissions.has(Permissions.Flags.BanMembers); // false
 *
 * // Edit the role
 * await role.edit({ permissions: Permissions.Flags.BanMembers.toString() });
 * ```
 */
export class Role extends Base {
  /** The server this role belongs to */
  public readonly serverId: Snowflake;

  /** The role's display name */
  public name: string;

  /** The role's hex color string */
  public color: string;

  /** The role's permission bitfield */
  public permissions: Permissions;

  /** The role's position in the hierarchy (higher = more authority) */
  public position: number;

  /** Whether this role is hoisted (shown separately in member list) */
  public isHoisted: boolean;

  /** Whether this is the server's default @everyone role */
  public isDefault: boolean;

  /** Whether this role can be mentioned by members */
  public isMentionable: boolean;

  /** Number of members with this role (if available) */
  public memberCount: number;

  /** When this role was created */
  public createdAt: Date;

  /**
   * @param client - The RecoilClient instance
   * @param data - Raw API role data
   */
  constructor(client: RecoilClient, data: APIRole) {
    super(client, data.id);
    this.serverId = data.server_id;
    this.name = data.name;
    this.color = data.color;
    this.permissions = new Permissions(data.permissions);
    this.position = data.position;
    this.isHoisted = data.is_hoisted;
    this.isDefault = data.is_default;
    this.isMentionable = data.is_mentionable ?? false;
    this.memberCount = data.member_count ?? 0;
    this.createdAt = new Date(data.created_at);
  }

  /**
   * Updates this role's cached data.
   * @internal
   */
  _patch(data: Partial<APIRole>): this {
    if (data.name !== undefined) this.name = data.name;
    if (data.color !== undefined) this.color = data.color;
    if (data.permissions !== undefined) this.permissions = new Permissions(data.permissions);
    if (data.position !== undefined) this.position = data.position;
    if (data.is_hoisted !== undefined) this.isHoisted = data.is_hoisted;
    if (data.member_count !== undefined) this.memberCount = data.member_count ?? 0;
    return this;
  }

  /**
   * The integer representation of this role's color.
   */
  get colorInt(): number {
    return parseInt(this.color.replace('#', ''), 16);
  }

  /**
   * Edit this role's properties.
   *
   * @param data - Fields to update
   * @returns The updated Role instance
   *
   * @example
   * ```ts
   * await role.edit({ name: 'Admin', color: '#FF0000' });
   * ```
   */
  async edit(data: APIRoleEdit): Promise<Role> {
    const result = await this.client.rest.patch<{ role: APIRole }>(
      `/servers/${this.serverId}/roles/${this.id}`,
      { body: data as Record<string, unknown> },
    );
    return this._patch(result.role);
  }

  /**
   * Delete this role.
   *
   * @example
   * ```ts
   * await role.delete();
   * ```
   */
  async delete(): Promise<void> {
    await this.client.rest.delete(`/servers/${this.serverId}/roles/${this.id}`);
  }

  /**
   * Returns a mention string for this role.
   */
  mention(): string {
    return `@${this.name}`;
  }

  /**
   * Compare this role's position to another.
   * @param other - The other role to compare against
   * @returns Positive if this role is higher, negative if lower, 0 if equal
   */
  comparePositionTo(other: Role): number {
    return this.position - other.position;
  }

  override toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      server_id: this.serverId,
      name: this.name,
      color: this.color,
      permissions: this.permissions.toString(),
      position: this.position,
      is_hoisted: this.isHoisted,
      is_default: this.isDefault,
      member_count: this.memberCount,
      created_at: this.createdAt.toISOString(),
    };
  }
}
