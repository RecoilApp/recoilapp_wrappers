/**
 * @module recoil.js/structures/EmbedBuilder
 * Provides builder classes for constructing rich container embeds.
 *
 * @example
 * ```ts
 * import { ContainerBuilder, TextDisplay, Separator, ActionRowBuilder, ButtonBuilder } from 'recoil.js';
 *
 * const embed = new ContainerBuilder()
 *   .setAccentColor('#00bfbf')
 *   .addTextDisplay('# Hello World\nThis is a **rich** embed!')
 *   .addSeparator()
 *   .addActionRow(
 *     new ActionRowBuilder()
 *       .addButton(new ButtonBuilder().setLabel('Visit').setStyle('link').setURL('https://example.com'))
 *       .addButton(new ButtonBuilder().setLabel('OK').setStyle('success'))
 *   )
 *   .build();
 *
 * await channel.messages.send({ embeds: [embed] });
 * ```
 *
 * @packageDocumentation
 */

import type {
  APIEmbed,
  APIEmbedComponent,
  APIEmbedTextDisplay,
  APIEmbedSeparator,
  APIEmbedSection,
  APIEmbedMediaGallery,
  APIEmbedMediaItem,
  APIEmbedActionRow,
  APIEmbedButton,
  APIEmbedThumbnail,
  APIEmbedFileDisplay,
  APIButtonStyle,
} from '../types';

// ─── ButtonBuilder ──────────────────────────────────────────────

/**
 * Builder for creating embed buttons.
 *
 * @example
 * ```ts
 * const btn = new ButtonBuilder()
 *   .setLabel('Click Me')
 *   .setStyle('primary')
 *   .setEmoji('🚀');
 * ```
 */
export class ButtonBuilder {
  private data: APIEmbedButton = {
    type: 'button',
    label: '',
    style: 'primary',
  };

  /** Set the button label text. */
  setLabel(label: string): this {
    this.data.label = label;
    return this;
  }

  /** Set the button style. */
  setStyle(style: APIButtonStyle): this {
    this.data.style = style;
    return this;
  }

  /** Set the URL for link-style buttons. */
  setURL(url: string): this {
    this.data.url = url;
    return this;
  }

  /** Set the custom_id for non-link buttons (required for interaction handling). */
  setCustomId(customId: string): this {
    this.data.custom_id = customId;
    return this;
  }

  /** Set the emoji displayed before the label. */
  setEmoji(emoji: string): this {
    this.data.emoji = emoji;
    return this;
  }

  /** Set whether the button is disabled. */
  setDisabled(disabled: boolean): this {
    this.data.disabled = disabled;
    return this;
  }

  /** Returns the raw API button object. */
  build(): APIEmbedButton {
    if (!this.data.label) throw new Error('Button must have a label');
    if (this.data.style === 'link' && !this.data.url) throw new Error('Link buttons must have a URL');
    if (this.data.style !== 'link' && !this.data.custom_id) throw new Error('Non-link buttons must have a custom_id');
    return { ...this.data };
  }
}

// ─── ActionRowBuilder ───────────────────────────────────────────

/**
 * Builder for a row of buttons (max 5).
 *
 * @example
 * ```ts
 * const row = new ActionRowBuilder()
 *   .addButton(new ButtonBuilder().setLabel('Yes').setStyle('success'))
 *   .addButton(new ButtonBuilder().setLabel('No').setStyle('danger'));
 * ```
 */
export class ActionRowBuilder {
  private buttons: APIEmbedButton[] = [];

  /** Add a button to this row. Maximum 5 buttons per row. */
  addButton(button: ButtonBuilder | APIEmbedButton): this {
    if (this.buttons.length >= 5) throw new Error('An action row can have at most 5 buttons');
    this.buttons.push(button instanceof ButtonBuilder ? button.build() : button);
    return this;
  }

  /** Returns the raw API action row object. */
  build(): APIEmbedActionRow {
    if (this.buttons.length === 0) throw new Error('An action row must have at least 1 button');
    return {
      type: 'action_row',
      components: [...this.buttons],
    };
  }
}

// ─── SectionBuilder ─────────────────────────────────────────────

/**
 * Builder for a section component (text + optional accessory).
 *
 * @example
 * ```ts
 * const section = new SectionBuilder()
 *   .setText('User information goes here.')
 *   .setThumbnail('https://example.com/avatar.png');
 * ```
 */
export class SectionBuilder {
  private text: string = '';
  private accessory: APIEmbedThumbnail | APIEmbedButton | null = null;

  /** Set the section text content. */
  setText(text: string): this {
    this.text = text;
    return this;
  }

  /** Set a thumbnail image as the section accessory. */
  setThumbnail(url: string, alt?: string): this {
    this.accessory = { type: 'thumbnail', url, ...(alt ? { alt } : {}) };
    return this;
  }

  /** Set a button as the section accessory. */
  setButton(button: ButtonBuilder | APIEmbedButton): this {
    this.accessory = button instanceof ButtonBuilder ? button.build() : button;
    return this;
  }

  /** Returns the raw API section object. */
  build(): APIEmbedSection {
    const section: APIEmbedSection = {
      type: 'section',
      components: [{ type: 'text_display', content: this.text }],
    };
    if (this.accessory) section.accessory = this.accessory;
    return section;
  }
}

// ─── ContainerBuilder ───────────────────────────────────────────

/**
 * Builder for the top-level container embed.
 * Containers hold a list of child components rendered as a rich card.
 *
 * @example
 * ```ts
 * const embed = new ContainerBuilder()
 *   .setAccentColor('#FF5733')
 *   .setSpoiler(true)
 *   .addTextDisplay('Hidden spoiler content!')
 *   .build();
 * ```
 */
export class ContainerBuilder {
  private accentColor?: string;
  private spoiler?: boolean;
  private components: APIEmbedComponent[] = [];

  /** Set the left-border accent color (hex string, e.g. '#00bfbf'). */
  setAccentColor(color: string): this {
    this.accentColor = color;
    return this;
  }

  /** Mark this embed as a spoiler (blurred until clicked). */
  setSpoiler(spoiler: boolean = true): this {
    this.spoiler = spoiler;
    return this;
  }

  /**
   * Add a text display component.
   * @param content - Text content with optional markdown (bold, italic, code, links)
   */
  addTextDisplay(content: string): this {
    this.components.push({ type: 'text_display', content } as APIEmbedTextDisplay);
    return this;
  }

  /**
   * Add a separator (visual divider).
   * @param options - Separator options
   */
  addSeparator(options?: { hasDivider?: boolean; spacing?: 'small' | 'large' }): this {
    const sep: APIEmbedSeparator = { type: 'separator' };
    if (options?.hasDivider !== undefined) sep.has_divider = options.hasDivider;
    if (options?.spacing) sep.spacing = options.spacing;
    this.components.push(sep);
    return this;
  }

  /**
   * Add a section component.
   * @param section - A SectionBuilder instance or raw API section object
   */
  addSection(section: SectionBuilder | APIEmbedSection): this {
    this.components.push(section instanceof SectionBuilder ? section.build() : section);
    return this;
  }

  /**
   * Add a media gallery.
   * @param items - Array of media items with url and optional alt text
   */
  addMediaGallery(items: APIEmbedMediaItem[]): this {
    this.components.push({
      type: 'media_gallery',
      items: [...items],
    } as APIEmbedMediaGallery);
    return this;
  }

  /**
   * Add an action row of buttons.
   * @param row - An ActionRowBuilder instance or raw API action row object
   */
  addActionRow(row: ActionRowBuilder | APIEmbedActionRow): this {
    this.components.push(row instanceof ActionRowBuilder ? row.build() : row);
    return this;
  }

  /**
   * Add a file display component.
   * @param url - URL to the file
   * @param name - Display filename
   */
  addFile(url: string, name: string): this {
    this.components.push({ type: 'file', url, name } as APIEmbedFileDisplay);
    return this;
  }

  /**
   * Add a raw component directly.
   */
  addComponent(component: APIEmbedComponent): this {
    this.components.push(component);
    return this;
  }

  /**
   * Build and return the final embed object ready for the API.
   */
  build(): APIEmbed {
    if (this.components.length === 0) throw new Error('Container must have at least one component');
    if (this.components.length > 20) throw new Error('Container can have at most 20 components');

    const embed: APIEmbed = {
      type: 'container',
      components: [...this.components],
    };
    if (this.accentColor) embed.accent_color = this.accentColor;
    if (this.spoiler) embed.spoiler = true;
    return embed;
  }
}

/** Helper to quickly build a text-only container embed. */
export function textEmbed(content: string, accentColor?: string): APIEmbed {
  const builder = new ContainerBuilder().addTextDisplay(content);
  if (accentColor) builder.setAccentColor(accentColor);
  return builder.build();
}
