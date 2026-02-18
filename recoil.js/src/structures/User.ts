/**
 * @module recoil.js/structures/User
 * Represents a user (human or bot) in the RecoilApp ecosystem.
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIMessageAuthor, APIBotUser, Snowflake } from '../types';
import { UserStatus } from '../types';
import { Base } from './Base';

/**
 * Represents a user in RecoilApp.
 * This can be either a human user or a bot user.
 *
 * @example
 * ```ts
 * const user = message.author;
 * console.log(user.username);    // 'Aurora'
 * console.log(user.displayName); // 'Aurora | Admin'
 * console.log(user.isBot);       // false
 * console.log(user.avatarURL);   // 'https://...'
 * ```
 */
export class User extends Base {
  /** The user's unique username */
  public readonly username: string;

  /** The user's display name (may differ from username) */
  public readonly displayName: string | null;

  /** URL to the user's avatar image */
  public readonly avatarURL: string | null;

  /** Whether this user is a bot */
  public readonly isBot: boolean;

  /**
   * @param client - The RecoilClient instance
   * @param data - Raw API data
   */
  constructor(client: RecoilClient, data: APIMessageAuthor) {
    super(client, data.id);
    this.username = data.username;
    this.displayName = data.display_name;
    this.avatarURL = data.avatar_url;
    this.isBot = data.is_bot;
  }

  /**
   * The name to display for this user. Prefers display_name, falls back to username.
   */
  get tag(): string {
    return this.displayName ?? this.username;
  }

  /**
   * Returns a mention string for this user.
   */
  mention(): string {
    return `@${this.username}`;
  }

  override toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      username: this.username,
      display_name: this.displayName,
      avatar_url: this.avatarURL,
      is_bot: this.isBot,
    };
  }
}

/**
 * Represents the bot's own user profile, with additional fields
 * returned by `GET /@me`.
 *
 * @example
 * ```ts
 * client.on('ready', () => {
 *   console.log(`Logged in as ${client.user.username}`);
 *   console.log(`In ${client.user.serverCount} servers`);
 * });
 * ```
 */
export class ClientUser extends Base {
  /** The bot's username */
  public username: string;

  /** The bot's display name */
  public displayName: string | null;

  /** URL to the bot's avatar */
  public avatarURL: string | null;

  /** The bot's bio / about text */
  public bio: string;

  /** The bot's current status */
  public status: UserStatus;

  /** Raw bot flags as a bigint string */
  public flags: string;

  /** Approved intents bitfield as a bigint string */
  public approvedIntents: string;

  /** Number of servers the bot is in */
  public serverCount: number;

  /** Number of registered commands */
  public commandCount: number;

  /** The parent application info */
  public application: { id: Snowflake; name: string };

  /** When the bot account was created */
  public createdAt: Date;

  /**
   * @param client - The RecoilClient instance
   * @param data - Raw API data from `GET /@me`
   */
  constructor(client: RecoilClient, data: APIBotUser) {
    super(client, data.id);
    this.username = data.username;
    this.displayName = data.display_name;
    this.avatarURL = data.avatar_url;
    this.bio = data.bio;
    this.status = data.status;
    this.flags = data.flags;
    this.approvedIntents = data.approved_intents;
    this.serverCount = data.server_count;
    this.commandCount = data.command_count;
    this.application = data.application;
    this.createdAt = new Date(data.created_at);
  }

  /**
   * The display tag for this bot. Prefers display name, falls back to username.
   */
  get tag(): string {
    return this.displayName ?? this.username;
  }

  /**
   * Update this bot's profile.
   * @param data - Fields to update (status, bio, display_name)
   * @returns The updated ClientUser
   *
   * @example
   * ```ts
   * await client.user.edit({ status: 'dnd', bio: 'Under maintenance' });
   * ```
   */
  async edit(data: { status?: UserStatus; bio?: string; display_name?: string }): Promise<ClientUser> {
    const result = await this.client.rest.patch<{ bot: APIBotUser }>(
      '/@me',
      { body: data as Record<string, unknown> },
    );

    // Update local state
    if (data.status) this.status = data.status;
    if (data.bio !== undefined) this.bio = data.bio;
    if (data.display_name !== undefined) this.displayName = data.display_name;

    return this;
  }

  /**
   * Set the bot's status.
   * @param status - The new status
   */
  async setStatus(status: UserStatus): Promise<ClientUser> {
    return this.edit({ status });
  }

  /**
   * Set the bot's bio.
   * @param bio - The new bio text
   */
  async setBio(bio: string): Promise<ClientUser> {
    return this.edit({ bio });
  }

  override toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      username: this.username,
      display_name: this.displayName,
      avatar_url: this.avatarURL,
      bio: this.bio,
      status: this.status,
      flags: this.flags,
      server_count: this.serverCount,
      command_count: this.commandCount,
      application: this.application,
      created_at: this.createdAt.toISOString(),
    };
  }
}
