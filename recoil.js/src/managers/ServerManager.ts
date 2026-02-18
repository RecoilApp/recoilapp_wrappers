/**
 * @module recoil.js/managers/ServerManager
 * Manages the bot's servers (guilds) — listing, fetching, and caching.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIServer, Snowflake } from '../types';
import { BaseManager } from './BaseManager';
import { Server } from '../structures/Server';
import { Collection } from '../util/Collection';
import { ChannelManager } from './ChannelManager';
import { MemberManager } from './MemberManager';
import { RoleManager } from './RoleManager';
import { BanManager } from './BanManager';
import { InviteManager } from './InviteManager';
import { EmojiManager } from './EmojiManager';
import { WebhookManager } from './WebhookManager';

/**
 * Manages the bot's servers. Provides methods to list, fetch, and leave servers.
 *
 * @example
 * ```ts
 * // List all servers
 * const servers = await client.servers.list();
 * console.log(`Bot is in ${servers.size} servers`);
 *
 * // Fetch a specific server
 * const server = await client.servers.fetch('server-id');
 * console.log(server.name);
 *
 * // Leave a server
 * await server.leave();
 * ```
 */
export class ServerManager extends BaseManager<Server> {

  constructor(client: RecoilClient) {
    super(client);
  }

  /**
   * Fetches all servers the bot is a member of.
   *
   * @param options - Pagination options
   * @returns A Collection of Server instances
   */
  async list(options?: { limit?: number; offset?: number }): Promise<Collection<Snowflake, Server>> {
    const query: Record<string, string | number> = {};
    if (options?.limit) query.limit = options.limit;
    if (options?.offset) query.offset = options.offset;

    const data = await this.client.rest.get<{ servers: APIServer[]; limit: number; offset: number }>(
      '/servers',
      { query },
    );

    const result = new Collection<Snowflake, Server>();
    for (const serverData of data.servers) {
      const server = this._add(serverData);
      result.set(server.id, server);
    }
    return result;
  }

  /**
   * Fetches a specific server by ID.
   * Updates the cache with fresh data.
   *
   * @param serverId - The server's UUID
   * @returns The Server instance
   * @throws {RecoilAPIError} If the server is not found or bot is not a member
   */
  async fetch(serverId: Snowflake): Promise<Server> {
    const data = await this.client.rest.get<{ server: APIServer }>(
      `/servers/${serverId}`,
    );
    return this._add(data.server);
  }

  /**
   * Leave a server by ID.
   *
   * @param serverId - The server to leave
   */
  async leave(serverId: Snowflake): Promise<void> {
    await this.client.rest.delete(`/servers/${serverId}`);
    this.cache.delete(serverId);
  }

  /**
   * Adds a server to the cache and initializes its sub-managers.
   * @internal
   */
  _add(data: APIServer): Server {
    let server = this.cache.get(data.id);
    if (server) {
      server._patch(data);
    } else {
      server = new Server(this.client, data);
      this.cache.set(data.id, server);
    }

    // Initialize sub-managers if not already set
    if (!server.channels) {
      server.channels = new ChannelManager(this.client, server.id);
    }
    if (!server.members) {
      server.members = new MemberManager(this.client, server.id);
    }
    if (!server.roles) {
      server.roles = new RoleManager(this.client, server.id);
    }
    if (!server.bans) {
      server.bans = new BanManager(this.client, server.id);
    }
    if (!server.invites) {
      server.invites = new InviteManager(this.client, server.id);
    }
    if (!server.emojis) {
      server.emojis = new EmojiManager(this.client, server.id);
    }
    if (!server.webhooks) {
      server.webhooks = new WebhookManager(this.client, server.id);
    }

    return server;
  }
}
