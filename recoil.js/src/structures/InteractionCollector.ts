/**
 * @module recoil.js/structures/InteractionCollector
 * Collects button interactions for a specific message with filtering and timeout.
 *
 * @example
 * ```ts
 * // Send a message with buttons, then collect interactions
 * const message = await channel.messages.send({
 *   embeds: [embed],
 * });
 *
 * // Collect one interaction within 30 seconds
 * const collector = new InteractionCollector(client, {
 *   messageId: message.id,
 *   filter: (i) => i.customId === 'confirm',
 *   max: 1,
 *   time: 30_000,
 * });
 *
 * collector.on('collect', (interaction) => {
 *   console.log(`${interaction.user.username} confirmed!`);
 * });
 *
 * collector.on('end', (collected, reason) => {
 *   console.log(`Collected ${collected.length} interactions. Reason: ${reason}`);
 * });
 * ```
 *
 * @packageDocumentation
 */

import { EventEmitter } from 'events';
import type { RecoilClient } from '../client/RecoilClient';
import type { ButtonInteraction } from './ButtonInteraction';
import type { Snowflake } from '../types';
import { Events } from '../util/Events';

/**
 * Options for creating an InteractionCollector.
 */
export interface InteractionCollectorOptions {
  /** Only collect interactions for this message ID. */
  messageId?: Snowflake;
  /** Only collect interactions for this channel ID. */
  channelId?: Snowflake;
  /** Only collect interactions matching specific custom_ids. */
  customIds?: string[];
  /** Custom filter function. Return true to collect the interaction. */
  filter?: (interaction: ButtonInteraction) => boolean;
  /** Maximum number of interactions to collect before ending. */
  max?: number;
  /** Maximum time in milliseconds before the collector ends. */
  time?: number;
  /** Whether to stop collecting after the first matching interaction (shortcut for max: 1). */
  once?: boolean;
}

/**
 * Typed events for InteractionCollector.
 */
export interface InteractionCollectorEvents {
  /** Emitted when a matching interaction is collected. */
  collect: [interaction: ButtonInteraction];
  /** Emitted when the collector ends. */
  end: [collected: ButtonInteraction[], reason: 'limit' | 'time' | 'manual'];
}

export class InteractionCollector extends EventEmitter {
  public readonly client: RecoilClient;
  public readonly options: InteractionCollectorOptions;
  public readonly collected: ButtonInteraction[] = [];
  private _ended = false;
  private _timer: ReturnType<typeof setTimeout> | null = null;
  private _handler: (interaction: ButtonInteraction) => void;

  // Typed event overrides
  public override on<K extends keyof InteractionCollectorEvents>(
    event: K,
    listener: (...args: InteractionCollectorEvents[K]) => void,
  ): this;
  public override on(event: string | symbol, listener: (...args: unknown[]) => void): this;
  public override on(event: string | symbol, listener: (...args: unknown[]) => void): this {
    return super.on(event, listener);
  }

  public override once<K extends keyof InteractionCollectorEvents>(
    event: K,
    listener: (...args: InteractionCollectorEvents[K]) => void,
  ): this;
  public override once(event: string | symbol, listener: (...args: unknown[]) => void): this;
  public override once(event: string | symbol, listener: (...args: unknown[]) => void): this {
    return super.once(event, listener);
  }

  public override emit<K extends keyof InteractionCollectorEvents>(
    event: K,
    ...args: InteractionCollectorEvents[K]
  ): boolean;
  public override emit(event: string | symbol, ...args: unknown[]): boolean;
  public override emit(event: string | symbol, ...args: unknown[]): boolean {
    return super.emit(event, ...args);
  }

  constructor(client: RecoilClient, options: InteractionCollectorOptions = {}) {
    super();
    this.client = client;
    this.options = options;

    if (options.once) {
      this.options.max = 1;
    }

    // Bind handler to the client's interactionCreate event
    this._handler = (interaction: ButtonInteraction) => {
      if (this._ended) return;
      if (!this._matches(interaction)) return;

      this.collected.push(interaction);
      this.emit('collect', interaction);

      if (this.options.max && this.collected.length >= this.options.max) {
        this.stop('limit');
      }
    };

    this.client.on(Events.InteractionCreate as 'interactionCreate', this._handler);

    // Set up timeout
    if (options.time && options.time > 0) {
      this._timer = setTimeout(() => {
        if (!this._ended) this.stop('time');
      }, options.time);
    }
  }

  /**
   * Check if an interaction matches this collector's filters.
   */
  private _matches(interaction: ButtonInteraction): boolean {
    if (this.options.messageId && interaction.messageId !== this.options.messageId) {
      return false;
    }
    if (this.options.channelId && interaction.channelId !== this.options.channelId) {
      return false;
    }
    if (this.options.customIds && !this.options.customIds.includes(interaction.customId)) {
      return false;
    }
    if (this.options.filter && !this.options.filter(interaction)) {
      return false;
    }
    return true;
  }

  /**
   * Whether the collector has ended.
   */
  get ended(): boolean {
    return this._ended;
  }

  /**
   * The total number of collected interactions.
   */
  get total(): number {
    return this.collected.length;
  }

  /**
   * Stop the collector manually.
   */
  stop(reason: 'limit' | 'time' | 'manual' = 'manual'): void {
    if (this._ended) return;
    this._ended = true;

    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }

    this.client.off(Events.InteractionCreate as 'interactionCreate', this._handler);
    this.emit('end', this.collected, reason);
    this.removeAllListeners();
  }

  /**
   * Returns a Promise that resolves with the first matching interaction,
   * or rejects if the collector ends before getting one.
   */
  awaitOne(): Promise<ButtonInteraction> {
    return new Promise((resolve, reject) => {
      if (this.collected.length > 0) {
        resolve(this.collected[0]);
        return;
      }

      this.on('collect', (interaction) => {
        resolve(interaction);
        this.stop('limit');
      });

      this.on('end', (collected, reason) => {
        if (collected.length > 0) {
          resolve(collected[0]);
        } else {
          reject(new Error(`Collector ended with reason: ${reason}`));
        }
      });
    });
  }
}
