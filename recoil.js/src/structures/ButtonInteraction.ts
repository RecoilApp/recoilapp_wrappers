/**
 * @module recoil.js/structures/ButtonInteraction
 * Represents a button interaction received from the gateway.
 *
 * @example
 * ```ts
 * client.on('interactionCreate', (interaction) => {
 *   console.log(`${interaction.user.username} clicked button ${interaction.customId}`);
 *   console.log(`On message ${interaction.messageId} in channel ${interaction.channelId}`);
 * });
 * ```
 *
 * @packageDocumentation
 */

import type { RecoilClient } from '../client/RecoilClient';
import type { APIButtonInteraction, APIEmbed, Snowflake } from '../types';
import { Base } from './Base';

/**
 * Minimal user information attached to an interaction.
 */
export interface InteractionUser {
  id: Snowflake;
  username: string;
  displayName: string | null;
  avatarURL: string | null;
}

/**
 * Minimal message context attached to an interaction.
 */
export interface InteractionMessage {
  id: Snowflake;
  channelId: Snowflake;
  content: string;
  embeds: APIEmbed[] | null;
  createdAt: Date;
}

export class ButtonInteraction extends Base {
  /** The type of interaction (always 'button') */
  public readonly type = 'button' as const;

  /** The custom_id of the button that was clicked */
  public readonly customId: string;

  /** The user who clicked the button */
  public readonly user: InteractionUser;

  /** The message the button belongs to */
  public readonly message: InteractionMessage;

  /** The message ID shorthand */
  public readonly messageId: Snowflake;

  /** The channel where the interaction happened */
  public readonly channelId: Snowflake;

  /** The server where the interaction happened */
  public readonly serverId: Snowflake;

  /** When the interaction was created */
  public readonly createdAt: Date;

  constructor(client: RecoilClient, data: APIButtonInteraction) {
    super(client, data.id);
    this.customId = data.custom_id;
    this.user = {
      id: data.user.id,
      username: data.user.username,
      displayName: data.user.display_name,
      avatarURL: data.user.avatar_url,
    };
    this.message = {
      id: data.message.id,
      channelId: data.message.channel_id,
      content: data.message.content,
      embeds: data.message.embeds,
      createdAt: new Date(data.message.created_at),
    };
    this.messageId = data.message.id;
    this.channelId = data.channel_id;
    this.serverId = data.server_id;
    this.createdAt = new Date(data.created_at);
  }

  /** Whether this interaction was triggered by a specific custom_id */
  isCustomId(id: string): boolean {
    return this.customId === id;
  }

  /** Timestamp in seconds */
  get createdTimestamp(): number {
    return Math.floor(this.createdAt.getTime() / 1000);
  }

  override toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      type: this.type,
      custom_id: this.customId,
      message_id: this.messageId,
      channel_id: this.channelId,
      server_id: this.serverId,
      user: {
        id: this.user.id,
        username: this.user.username,
        display_name: this.user.displayName,
        avatar_url: this.user.avatarURL,
      },
      created_at: this.createdAt.toISOString(),
    };
  }
}
