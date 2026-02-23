/**
 * @module recoil.js/managers/SurgeManager
 * Read surge information and manage surge state for a server.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { Snowflake } from '../types';

// ── API response shapes ───────────────────────────────────────────────────────

export interface SurgeTierPerkInfo {
  tier: number;
  label: string;
  min_surges: number;
  next_tier_surges: number | null;
  emoji_slots: number;
  max_file_mb: number;
  perks: string[];
}

export interface SurgeUser {
  id: string;
  server_id: string;
  user_id: string;
  created_at: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
}

export interface ServerSurgeInfo {
  surge_count: number;
  surge_tier: number;
  tier_info: SurgeTierPerkInfo;
  is_surging: boolean;
  surged_at: string | null;
  recent_surgers: SurgeUser[];
  surges_needed_for_next_tier: number | null;
  progress_percent: number;
  next_tier_threshold: number | null;
}

export interface SurgeActionResult extends ServerSurgeInfo {
  message: string;
}

// ── Manager ───────────────────────────────────────────────────────────────────

/**
 * Manages surge interactions for a server.
 *
 * @example
 * ```ts
 * // Get surge info
 * const info = await server.surges.fetch();
 * console.log(`Surge level: ${info.surge_tier}, count: ${info.surge_count}`);
 *
 * // Surge a server (bot-token surging is reserved for future server-to-server boosts)
 * const result = await server.surges.surge();
 * console.log(result.message);
 * ```
 */
export class SurgeManager {
  /** The client that instantiated this manager */
  public readonly client: RecoilClient;

  /** The server ID this manager is scoped to */
  public readonly serverId: Snowflake;

  constructor(client: RecoilClient, serverId: Snowflake) {
    this.client = client;
    this.serverId = serverId;
  }

  /**
   * Fetches surge information for this server.
   *
   * @returns Full surge state: count, tier, perks, recent surgers, progress
   */
  async fetch(): Promise<ServerSurgeInfo> {
    return this.client.rest.get<ServerSurgeInfo>(
      `/servers/${this.serverId}/surges`,
    );
  }

  /**
   * Surge this server on behalf of the authenticated bot/user.
   *
   * @returns Updated surge state + a confirmation message
   * @throws If the bot is already surging this server, or is not a member
   */
  async surge(): Promise<SurgeActionResult> {
    return this.client.rest.post<SurgeActionResult>(
      `/servers/${this.serverId}/surges`,
      {},
    );
  }

  /**
   * Remove the surge from this server.
   *
   * @returns Updated surge state + a confirmation message
   * @throws If the bot is not currently surging this server
   */
  async unsurge(): Promise<SurgeActionResult> {
    return this.client.rest.delete<SurgeActionResult>(
      `/servers/${this.serverId}/surges`,
    );
  }
}
