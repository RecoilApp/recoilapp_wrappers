/**
 * @module recoil.js/util/Intents
 * Handles the 16 gateway intent flags that control which events the bot receives.
 * Extends {@link BitField} with named intent flags.
 *
 * @example
 * ```ts
 * import { IntentsBitField } from 'recoil.js';
 *
 * const intents = new IntentsBitField(
 *   IntentsBitField.Flags.Servers |
 *   IntentsBitField.Flags.ServerMessages |
 *   IntentsBitField.Flags.MessageContent
 * );
 * ```
 *
 * @packageDocumentation
 */

import { BitField, type BitFieldResolvable } from './BitField';

/**
 * Represents a set of intent flags that determine which events the bot receives.
 *
 * Some intents are **privileged** and require explicit approval:
 * - `ServerMembers` — access to member join/leave/update events
 * - `ServerPresences` — access to presence (status) changes
 * - `MessageContent` — access to message content (otherwise empty)
 */
export class IntentsBitField extends BitField {

  /**
   * All available intent flags.
   *
   * @remarks
   * Privileged intents (`ServerMembers`, `ServerPresences`, `MessageContent`)
   * must be enabled in the application's developer settings and approved
   * before the bot can use them.
   */
  static override readonly Flags = {
    /** Receive server create, update, delete events */
    Servers:                  1n << 0n,
    /** ⚠️ PRIVILEGED — Receive member add, update, remove events */
    ServerMembers:            1n << 1n,
    /** Receive moderation events (bans, unbans) */
    ServerModeration:         1n << 2n,
    /** Receive emoji and sticker updates */
    ServerEmojis:             1n << 3n,
    /** Receive integration updates */
    ServerIntegrations:       1n << 4n,
    /** Receive webhook updates */
    ServerWebhooks:           1n << 5n,
    /** Receive invite create and delete events */
    ServerInvites:            1n << 6n,
    /** Receive voice state updates */
    ServerVoiceStates:        1n << 7n,
    /** ⚠️ PRIVILEGED — Receive presence updates (status, activity) */
    ServerPresences:          1n << 8n,
    /** Receive new messages in server channels (content may be empty without MessageContent) */
    ServerMessages:           1n << 9n,
    /** Receive message reaction events */
    ServerMessageReactions:   1n << 10n,
    /** Receive typing start events in servers */
    ServerMessageTyping:      1n << 11n,
    /** Receive direct message events */
    DirectMessages:           1n << 12n,
    /** Receive DM reaction events */
    DirectMessageReactions:   1n << 13n,
    /** Receive typing events in DMs */
    DirectMessageTyping:      1n << 14n,
    /** ⚠️ PRIVILEGED — Receive full message content (otherwise content is empty) */
    MessageContent:           1n << 15n,
  } as const;

  /**
   * The three privileged intents combined.
   */
  static readonly Privileged =
    IntentsBitField.Flags.ServerMembers |
    IntentsBitField.Flags.ServerPresences |
    IntentsBitField.Flags.MessageContent;

  /**
   * All non-privileged intents combined — safe to use without approval.
   */
  static readonly NonPrivileged = Object.values(IntentsBitField.Flags)
    .reduce((acc, flag) => acc | flag, 0n) & ~IntentsBitField.Privileged;

  /**
   * All intents combined.
   */
  static readonly All = Object.values(IntentsBitField.Flags)
    .reduce((acc, flag) => acc | flag, 0n);

  /**
   * Create a new IntentsBitField.
   * @param bits - Initial intent bits
   */
  constructor(bits: BitFieldResolvable = 0n) {
    super(bits);
  }

  /**
   * Whether this intent set includes any privileged intents.
   */
  get hasPrivileged(): boolean {
    return (this.bitfield & IntentsBitField.Privileged) !== 0n;
  }

  /**
   * Returns an array of the privileged intent names that are set.
   */
  get privilegedIntents(): string[] {
    const result: string[] = [];
    if (this.has(IntentsBitField.Flags.ServerMembers)) result.push('ServerMembers');
    if (this.has(IntentsBitField.Flags.ServerPresences)) result.push('ServerPresences');
    if (this.has(IntentsBitField.Flags.MessageContent)) result.push('MessageContent');
    return result;
  }
}

/**
 * Convenience alias for creating intents via static flags.
 * @example
 * ```ts
 * import { Intents } from 'recoil.js';
 * const intents = Intents.Flags.Servers | Intents.Flags.ServerMessages;
 * ```
 */
export const Intents = IntentsBitField;
export type Intents = IntentsBitField;
