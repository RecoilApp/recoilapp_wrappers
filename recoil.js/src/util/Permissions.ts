/**
 * @module recoil.js/util/Permissions
 * Handles the 37 bot permission flags used for role-based access control.
 * Extends {@link BitField} with named permission flags.
 *
 * @example
 * ```ts
 * import { Permissions } from 'recoil.js';
 *
 * const perms = new Permissions(Permissions.Flags.SendMessages | Permissions.Flags.ViewChannels);
 * console.log(perms.has(Permissions.Flags.Administrator)); // false
 * console.log(perms.toArray()); // ['ViewChannels', 'SendMessages']
 * ```
 *
 * @packageDocumentation
 */

import { BitField, type BitFieldResolvable } from './BitField';

/**
 * Represents a set of permission flags for a bot within a server.
 * Uses a bigint bitfield to efficiently store 37+ boolean permission flags.
 */
export class Permissions extends BitField {

  /**
   * All available permission flags.
   *
   * Each flag is a `bigint` representing a single bit position. Multiple flags
   * can be combined using the bitwise OR operator (`|`).
   */
  static override readonly Flags = {
    // ── General ───────────────────────────────────────────
    /** Allows viewing channels and reading messages */
    ViewChannels:           1n << 0n,
    /** Allows sending messages in text channels */
    SendMessages:           1n << 1n,
    /** Allows managing (deleting, pinning) messages by others */
    ManageMessages:         1n << 2n,
    /** Allows creating, editing, and deleting channels */
    ManageChannels:         1n << 3n,
    /** Allows editing server settings */
    ManageServer:           1n << 4n,
    /** Allows creating, editing, and deleting roles */
    ManageRoles:            1n << 5n,
    /** Allows kicking members from the server */
    KickMembers:            1n << 6n,
    /** Allows banning and unbanning members */
    BanMembers:             1n << 7n,
    /** Allows creating instant invites */
    InviteMembers:          1n << 8n,
    /** Allows uploading files and attachments */
    AttachFiles:            1n << 9n,
    /** Allows changing nicknames of other members */
    ManageNicknames:        1n << 10n,
    /** Grants all permissions and bypasses all checks */
    Administrator:          1n << 11n,

    // ── Moderation ────────────────────────────────────────
    /** Allows managing webhooks */
    ManageWebhooks:         1n << 12n,
    /** Allows managing custom emojis */
    ManageEmojis:           1n << 13n,
    /** Allows managing server invites */
    ManageInvites:          1n << 14n,
    /** Allows viewing the server audit log */
    ViewAuditLog:           1n << 15n,

    // ── Text ──────────────────────────────────────────────
    /** Allows adding reactions to messages */
    AddReactions:           1n << 16n,
    /** Allows pinning messages in channels */
    PinMessages:            1n << 17n,
    /** Allows using emojis from other servers */
    UseExternalEmojis:      1n << 18n,
    /** Allows using @everyone and @here mentions */
    MentionEveryone:        1n << 19n,
    /** Allows embedding links in messages */
    EmbedLinks:             1n << 20n,
    /** Allows reading message history in channels */
    ReadMessageHistory:     1n << 21n,

    // ── Threads ───────────────────────────────────────────
    /** Allows managing threads (archive, lock, delete) */
    ManageThreads:          1n << 22n,
    /** Allows creating public threads */
    CreatePublicThreads:    1n << 23n,
    /** Allows creating private threads */
    CreatePrivateThreads:   1n << 24n,
    /** Allows sending messages in threads */
    SendThreadMessages:     1n << 25n,

    // ── Voice ─────────────────────────────────────────────
    /** Allows connecting to voice channels */
    ConnectVoice:           1n << 26n,
    /** Allows speaking in voice channels */
    SpeakVoice:             1n << 27n,
    /** Allows muting members in voice */
    MuteMembers:            1n << 28n,
    /** Allows deafening members in voice */
    DeafenMembers:          1n << 29n,
    /** Allows moving members between voice channels */
    MoveMembers:            1n << 30n,
    /** Allows using priority speaker mode */
    PrioritySpeaker:        1n << 31n,
    /** Allows using voice activity detection */
    UseVoiceActivity:       1n << 32n,
    /** Allows streaming video in voice channels */
    Stream:                 1n << 33n,

    // ── Events ────────────────────────────────────────────
    /** Allows managing scheduled events */
    ManageEvents:           1n << 34n,

    // ── Advanced ──────────────────────────────────────────
    /** Allows changing own nickname */
    ChangeNickname:         1n << 35n,
    /** Allows using application commands */
    UseApplicationCommands: 1n << 36n,
  } as const;

  /**
   * Preset: Default permissions granted to all members.
   * Includes basic viewing and messaging capabilities.
   */
  static readonly Default = new Permissions(
    Permissions.Flags.ViewChannels |
    Permissions.Flags.SendMessages |
    Permissions.Flags.ReadMessageHistory |
    Permissions.Flags.AddReactions |
    Permissions.Flags.AttachFiles |
    Permissions.Flags.EmbedLinks |
    Permissions.Flags.UseExternalEmojis |
    Permissions.Flags.ChangeNickname |
    Permissions.Flags.ConnectVoice |
    Permissions.Flags.SpeakVoice |
    Permissions.Flags.UseVoiceActivity |
    Permissions.Flags.CreatePublicThreads |
    Permissions.Flags.SendThreadMessages |
    Permissions.Flags.UseApplicationCommands
  ).freeze();

  /**
   * Preset: Moderator permissions — everything in Default plus moderation tools.
   */
  static readonly Moderator = new Permissions(
    Permissions.Default.bitfield |
    Permissions.Flags.KickMembers |
    Permissions.Flags.BanMembers |
    Permissions.Flags.ManageMessages |
    Permissions.Flags.ManageNicknames |
    Permissions.Flags.ManageInvites |
    Permissions.Flags.MuteMembers |
    Permissions.Flags.DeafenMembers |
    Permissions.Flags.MoveMembers |
    Permissions.Flags.ManageThreads |
    Permissions.Flags.ViewAuditLog |
    Permissions.Flags.PinMessages |
    Permissions.Flags.MentionEveryone
  ).freeze();

  /**
   * Preset: Administrator — all permissions.
   */
  static readonly Admin = new Permissions(
    Object.values(Permissions.Flags).reduce((acc, flag) => acc | flag, 0n)
  ).freeze();

  /**
   * Combination of all available permission bits.
   */
  static readonly All = Permissions.Admin.bitfield;

  /**
   * Create a new Permissions bitfield.
   * @param bits - Initial permission bits
   */
  constructor(bits: BitFieldResolvable = 0n) {
    super(bits);
  }

  /**
   * Whether this permission set includes the Administrator flag.
   * Administrators bypass all permission checks.
   */
  get isAdministrator(): boolean {
    return this.has(Permissions.Flags.Administrator);
  }
}
