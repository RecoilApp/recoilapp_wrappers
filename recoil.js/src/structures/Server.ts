/**
 * @module recoil.js/structures/Server
 * Represents a server (guild) in RecoilApp.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIServer, Snowflake } from '../types';
import { Base } from './Base';
import type { ChannelManager } from '../managers/ChannelManager';
import type { MemberManager } from '../managers/MemberManager';
import type { RoleManager } from '../managers/RoleManager';
import type { BanManager } from '../managers/BanManager';
import type { InviteManager } from '../managers/InviteManager';
import type { EmojiManager } from '../managers/EmojiManager';
import type { WebhookManager } from '../managers/WebhookManager';
import { Permissions } from '../util/Permissions';

/**
 * Represents a server (guild) that the bot is a member of.
 *
 * @example
 * ```ts
 * const server = await client.servers.fetch('server-id');
 * console.log(server.name);        // 'My Cool Server'
 * console.log(server.memberCount);  // 42
 *
 * // Access sub-managers
 * const channels = await server.channels.list();
 * const members = await server.members.list();
 * const roles = await server.roles.list();
 * ```
 */
export class Server extends Base {
  /** The server's name */
  public name: string;

  /** The server's description */
  public description: string | null;

  /** URL to the server's icon */
  public iconURL: string | null;

  /** URL to the server's banner */
  public bannerURL: string | null;

  /** ID of the server owner */
  public ownerId: Snowflake;

  /** The server's invite code */
  public inviteCode: string;

  /** Whether the server is publicly listed */
  public isPublic: boolean;

  /** Total member count */
  public memberCount: number;

  /** Total channel count */
  public channelCount: number;

  /** Total role count */
  public roleCount: number;

  /** Username of the server owner */
  public ownerUsername: string | null;

  /** Permissions granted to the bot in this server */
  public botPermissions: Permissions;

  /** When the bot joined this server */
  public botJoinedAt: Date | null;

  /** Bot configuration in this server */
  public botConfig: Record<string, unknown>;

  /** When the server was created */
  public createdAt: Date;

  /** Whether this server is verified by the Recoil team */
  public isVerified: boolean;

  /** When the server was verified, if applicable */
  public verifiedAt: Date | null;

  // ── Sub-Managers ────────────────────────────────────────

  /** Manager for this server's channels */
  public channels!: ChannelManager;

  /** Manager for this server's members */
  public members!: MemberManager;

  /** Manager for this server's roles */
  public roles!: RoleManager;

  /** Manager for this server's bans */
  public bans!: BanManager;

  /** Manager for this server's invites */
  public invites!: InviteManager;

  /** Manager for this server's custom emojis */
  public emojis!: EmojiManager;

  /** Manager for this server's webhooks */
  public webhooks!: WebhookManager;

  /**
   * @param client - The RecoilClient instance
   * @param data - Raw API server data
   */
  constructor(client: RecoilClient, data: APIServer) {
    super(client, data.id);
    this.name = data.name;
    this.description = data.description ?? null;
    this.iconURL = data.icon_url;
    this.bannerURL = data.banner_url ?? null;
    this.ownerId = data.owner_id;
    this.inviteCode = data.invite_code;
    this.isPublic = data.is_public;
    this.memberCount = data.member_count;
    this.channelCount = data.channel_count;
    this.roleCount = data.role_count ?? 0;
    this.ownerUsername = data.owner_username ?? null;
    this.botPermissions = new Permissions(data.granted_permissions ?? '0');
    this.botJoinedAt = data.bot_joined_at ? new Date(data.bot_joined_at) : null;
    this.botConfig = data.bot_config ?? {};
    this.createdAt = new Date(data.created_at);
    this.isVerified = data.is_verified ?? false;
    this.verifiedAt = data.verified_at ? new Date(data.verified_at) : null;

    // Sub-managers are initialized by the ServerManager after construction
  }

  /**
   * Updates this server's cached data from new API data.
   * @internal
   */
  _patch(data: Partial<APIServer>): this {
    if (data.name !== undefined) this.name = data.name;
    if (data.description !== undefined) this.description = data.description ?? null;
    if (data.icon_url !== undefined) this.iconURL = data.icon_url;
    if (data.banner_url !== undefined) this.bannerURL = data.banner_url ?? null;
    if (data.member_count !== undefined) this.memberCount = data.member_count;
    if (data.channel_count !== undefined) this.channelCount = data.channel_count;
    if (data.role_count !== undefined) this.roleCount = data.role_count ?? 0;
    if (data.granted_permissions !== undefined) {
      this.botPermissions = new Permissions(data.granted_permissions ?? '0');
    }
    if (data.is_verified !== undefined) this.isVerified = data.is_verified ?? false;
    if (data.verified_at !== undefined) this.verifiedAt = data.verified_at ? new Date(data.verified_at) : null;
    return this;
  }

  /**
   * Leave this server. The bot will no longer be a member.
   *
   * @example
   * ```ts
   * await server.leave();
   * ```
   */
  async leave(): Promise<void> {
    await this.client.rest.delete(`/servers/${this.id}`);
    this.client.servers.cache.delete(this.id);
  }

  /**
   * Fetch fresh data for this server from the API.
   * @returns The updated Server instance
   */
  async fetch(): Promise<Server> {
    return this.client.servers.fetch(this.id);
  }

  /**
   * Returns a mention-formatted string for the server (its name).
   */
  mention(): string {
    return this.name;
  }

  override toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      icon_url: this.iconURL,
      banner_url: this.bannerURL,
      owner_id: this.ownerId,
      invite_code: this.inviteCode,
      is_public: this.isPublic,
      member_count: this.memberCount,
      channel_count: this.channelCount,
      role_count: this.roleCount,
      is_verified: this.isVerified,
      verified_at: this.verifiedAt?.toISOString() ?? null,
      created_at: this.createdAt.toISOString(),
    };
  }
}
