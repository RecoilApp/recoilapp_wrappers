/**
 * @module recoil.js/util/BitField
 * A generic bitfield utility class for working with permission and intent bitmasks.
 * Subclassed by {@link Permissions} and {@link IntentsBitField}.
 *
 * @packageDocumentation
 */

/** A resolvable value that can be converted to a bigint bitfield */
export type BitFieldResolvable = bigint | number | string | BitField | BitFieldResolvable[];

/**
 * Abstract base class for bitfield manipulation.
 * Stores a set of boolean flags as a single `bigint` value.
 *
 * @example
 * ```ts
 * const perms = new Permissions(Permissions.Flags.SendMessages | Permissions.Flags.ViewChannels);
 * console.log(perms.has(Permissions.Flags.SendMessages)); // true
 * perms.add(Permissions.Flags.ManageMessages);
 * perms.remove(Permissions.Flags.SendMessages);
 * ```
 */
export class BitField {
  /** The raw bitfield value as a bigint */
  public bitfield: bigint;

  /** The flags available on this BitField class (override in subclass) */
  static Flags: Record<string, bigint> = {};

  /** The default bit (0n) */
  static DefaultBit: bigint = 0n;

  /**
   * Create a new BitField instance.
   * @param bits - The initial bits to set
   */
  constructor(bits: BitFieldResolvable = 0n) {
    this.bitfield = BitField.resolve(bits);
  }

  /**
   * Checks whether the bitfield has a specific bit or combination of bits.
   * @param bit - The bit(s) to check for
   * @returns `true` if all specified bits are set
   *
   * @example
   * ```ts
   * perms.has(Permissions.Flags.Administrator); // true or false
   * perms.has([Permissions.Flags.SendMessages, Permissions.Flags.ViewChannels]); // both must be set
   * ```
   */
  has(bit: BitFieldResolvable): boolean {
    const resolved = BitField.resolve(bit);
    return (this.bitfield & resolved) === resolved;
  }

  /**
   * Checks if any of the specified bits are set.
   * @param bits - The bit(s) to check
   * @returns `true` if at least one of the bits is set
   */
  any(bits: BitFieldResolvable): boolean {
    const resolved = BitField.resolve(bits);
    return (this.bitfield & resolved) !== 0n;
  }

  /**
   * Adds one or more bits to the bitfield.
   * @param bits - The bits to add
   * @returns `this` for chaining
   */
  add(...bits: BitFieldResolvable[]): this {
    let total = 0n;
    for (const bit of bits) {
      total |= BitField.resolve(bit);
    }
    this.bitfield |= total;
    return this;
  }

  /**
   * Removes one or more bits from the bitfield.
   * @param bits - The bits to remove
   * @returns `this` for chaining
   */
  remove(...bits: BitFieldResolvable[]): this {
    let total = 0n;
    for (const bit of bits) {
      total |= BitField.resolve(bit);
    }
    this.bitfield &= ~total;
    return this;
  }

  /**
   * Checks if the bitfield is missing one or more bits.
   * @param bits - The bits to check
   * @returns An array of flag names that are NOT set
   */
  missing(bits: BitFieldResolvable): string[] {
    const resolved = BitField.resolve(bits);
    const missing: string[] = [];
    for (const [flag, value] of Object.entries((this.constructor as typeof BitField).Flags)) {
      if ((resolved & value) !== 0n && (this.bitfield & value) === 0n) {
        missing.push(flag);
      }
    }
    return missing;
  }

  /**
   * Returns an array of flag names that are currently set.
   * @returns Array of string flag names
   */
  toArray(): string[] {
    const flags = (this.constructor as typeof BitField).Flags;
    return Object.entries(flags)
      .filter(([, value]) => this.has(value))
      .map(([key]) => key);
  }

  /**
   * Freezes the bitfield, making it immutable.
   * @returns `this` (frozen)
   */
  freeze(): Readonly<this> {
    return Object.freeze(this);
  }

  /**
   * Serializes the bitfield to a string representation.
   */
  serialize(): Record<string, boolean> {
    const flags = (this.constructor as typeof BitField).Flags;
    const result: Record<string, boolean> = {};
    for (const [key, value] of Object.entries(flags)) {
      result[key] = this.has(value);
    }
    return result;
  }

  /**
   * Returns the string representation of the bitfield.
   */
  toString(): string {
    return this.bitfield.toString();
  }

  /**
   * Returns the bigint value for JSON serialization.
   */
  toJSON(): string {
    return this.bitfield.toString();
  }

  /**
   * Returns the primitive value when used in comparisons.
   */
  valueOf(): bigint {
    return this.bitfield;
  }

  /**
   * Creates an iterator over the flag names that are set.
   */
  *[Symbol.iterator](): IterableIterator<string> {
    yield* this.toArray();
  }

  /**
   * Resolves a {@link BitFieldResolvable} to a `bigint`.
   * @param bit - The value to resolve
   * @returns The resolved bigint
   */
  static resolve(bit: BitFieldResolvable): bigint {
    if (typeof bit === 'bigint') return bit;
    if (typeof bit === 'number') return BigInt(bit);
    if (typeof bit === 'string') return BigInt(bit);
    if (bit instanceof BitField) return bit.bitfield;
    if (Array.isArray(bit)) {
      return bit.reduce<bigint>((acc, val) => acc | BitField.resolve(val), 0n);
    }
    throw new RangeError(`BitField: Cannot resolve value: ${bit}`);
  }
}
