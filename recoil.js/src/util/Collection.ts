/**
 * @module recoil.js/util/Collection
 * A Map-like data structure with additional utility methods for managing cached entities.
 * Inspired by Discord.js Collection — provides functional helpers like `filter`, `map`,
 * `find`, `first`, `last`, `random`, and more on top of a standard `Map`.
 *
 * @typeParam K - The key type (typically a Snowflake / UUID string)
 * @typeParam V - The value type (a structure instance)
 *
 * @example
 * ```ts
 * const collection = new Collection<string, User>();
 * collection.set('abc-123', user);
 * const found = collection.find(u => u.username === 'Aurora');
 * ```
 *
 * @packageDocumentation
 */

/**
 * An extended Map with utility methods for managing collections of entities.
 * Used as the primary cache data structure throughout recoil.js.
 */
export class Collection<K, V> extends Map<K, V> {

  /**
   * Create a new Collection, optionally from an iterable of key-value pairs.
   * @param entries - Initial entries to populate the collection
   */
  constructor(entries?: ReadonlyArray<readonly [K, V]> | null) {
    super(entries ?? []);
  }

  /**
   * Returns the first value in the collection.
   * @param amount - Number of values to return from the start
   * @returns The first value, or an array of first N values
   */
  first(): V | undefined;
  first(amount: number): V[];
  first(amount?: number): V | V[] | undefined {
    if (amount === undefined) {
      const iter = this.values();
      return iter.next().value as V | undefined;
    }
    if (amount < 0) return this.last(amount * -1);
    amount = Math.min(this.size, amount);
    const iter = this.values();
    return Array.from({ length: amount }, () => iter.next().value as V);
  }

  /**
   * Returns the first key in the collection.
   * @param amount - Number of keys to return from the start
   * @returns The first key, or an array of first N keys
   */
  firstKey(): K | undefined;
  firstKey(amount: number): K[];
  firstKey(amount?: number): K | K[] | undefined {
    if (amount === undefined) {
      const iter = this.keys();
      return iter.next().value as K | undefined;
    }
    if (amount < 0) return this.lastKey(amount * -1);
    amount = Math.min(this.size, amount);
    const iter = this.keys();
    return Array.from({ length: amount }, () => iter.next().value as K);
  }

  /**
   * Returns the last value(s) in the collection.
   * @param amount - Number of values to return from the end
   */
  last(): V | undefined;
  last(amount: number): V[];
  last(amount?: number): V | V[] | undefined {
    const arr = [...this.values()];
    if (amount === undefined) return arr[arr.length - 1];
    if (amount < 0) return this.first(amount * -1);
    if (!amount) return [];
    return arr.slice(-amount);
  }

  /**
   * Returns the last key(s) in the collection.
   * @param amount - Number of keys to return from the end
   */
  lastKey(): K | undefined;
  lastKey(amount: number): K[];
  lastKey(amount?: number): K | K[] | undefined {
    const arr = [...this.keys()];
    if (amount === undefined) return arr[arr.length - 1];
    if (amount < 0) return this.firstKey(amount * -1);
    if (!amount) return [];
    return arr.slice(-amount);
  }

  /**
   * Returns a random value from the collection.
   * @param amount - Number of random values to return
   */
  random(): V | undefined;
  random(amount: number): V[];
  random(amount?: number): V | V[] | undefined {
    const arr = [...this.values()];
    if (amount === undefined) return arr[Math.floor(Math.random() * arr.length)];
    if (!arr.length || !amount) return [];
    return Array.from(
      { length: Math.min(amount, arr.length) },
      () => arr.splice(Math.floor(Math.random() * arr.length), 1)[0],
    );
  }

  /**
   * Returns a random key from the collection.
   * @param amount - Number of random keys to return
   */
  randomKey(): K | undefined;
  randomKey(amount: number): K[];
  randomKey(amount?: number): K | K[] | undefined {
    const arr = [...this.keys()];
    if (amount === undefined) return arr[Math.floor(Math.random() * arr.length)];
    if (!arr.length || !amount) return [];
    return Array.from(
      { length: Math.min(amount, arr.length) },
      () => arr.splice(Math.floor(Math.random() * arr.length), 1)[0],
    );
  }

  /**
   * Searches for a single item where the provided function returns a truthy value.
   * @param fn - The function to test each element
   * @returns The first matching value, or `undefined` if none found
   *
   * @example
   * ```ts
   * const admin = members.find(m => m.roles.has('admin-role-id'));
   * ```
   */
  find(fn: (value: V, key: K, collection: this) => boolean): V | undefined {
    for (const [key, val] of this) {
      if (fn(val, key, this)) return val;
    }
    return undefined;
  }

  /**
   * Searches for the key of a single item where the function returns truthy.
   * @param fn - The function to test each element
   * @returns The first matching key, or `undefined`
   */
  findKey(fn: (value: V, key: K, collection: this) => boolean): K | undefined {
    for (const [key, val] of this) {
      if (fn(val, key, this)) return key;
    }
    return undefined;
  }

  /**
   * Returns all values that pass the provided filter function.
   * @param fn - The filter function
   * @returns A new Collection of matching entries
   */
  filter(fn: (value: V, key: K, collection: this) => boolean): Collection<K, V> {
    const results = new Collection<K, V>();
    for (const [key, val] of this) {
      if (fn(val, key, this)) results.set(key, val);
    }
    return results;
  }

  /**
   * Maps each value in the collection to a new value.
   * @param fn - The mapping function
   * @returns An array of mapped values
   */
  map<T>(fn: (value: V, key: K, collection: this) => T): T[] {
    const iter = this.entries();
    return Array.from({ length: this.size }, () => {
      const { value } = iter.next();
      const [key, val] = value as [K, V];
      return fn(val, key, this);
    });
  }

  /**
   * Maps each value in the collection and flattens the result.
   * @param fn - Function that returns an iterable for each entry
   * @returns A flattened array of all results
   */
  flatMap<T>(fn: (value: V, key: K, collection: this) => T[]): T[] {
    return this.map(fn).reduce((acc, val) => acc.concat(val), []);
  }

  /**
   * Checks if at least one value passes the provided test function.
   * @param fn - The test function
   * @returns `true` if any value passes
   */
  some(fn: (value: V, key: K, collection: this) => boolean): boolean {
    for (const [key, val] of this) {
      if (fn(val, key, this)) return true;
    }
    return false;
  }

  /**
   * Checks if all values pass the provided test function.
   * @param fn - The test function
   * @returns `true` if every value passes
   */
  every(fn: (value: V, key: K, collection: this) => boolean): boolean {
    for (const [key, val] of this) {
      if (!fn(val, key, this)) return false;
    }
    return true;
  }

  /**
   * Reduces the collection to a single value.
   * @param fn - The reducer function
   * @param initialValue - The initial accumulator value
   * @returns The final accumulated value
   */
  reduce<T>(fn: (accumulator: T, value: V, key: K, collection: this) => T, initialValue: T): T {
    let accumulator = initialValue;
    for (const [key, val] of this) {
      accumulator = fn(accumulator, val, key, this);
    }
    return accumulator;
  }

  /**
   * Identical to {@link Array.forEach}, but on the collection's values.
   * @param fn - The function to execute for each element
   */
  each(fn: (value: V, key: K, collection: this) => void): this {
    for (const [key, val] of this) {
      fn(val, key, this);
    }
    return this;
  }

  /**
   * Returns a new Collection sorted by the provided comparator.
   * @param compareFn - The comparison function
   */
  sort(compareFn: (firstValue: V, secondValue: V, firstKey: K, secondKey: K) => number = () => 0): this {
    const entries = [...this.entries()];
    entries.sort((a, b) => compareFn(a[1], b[1], a[0], b[0]));
    this.clear();
    for (const [key, val] of entries) {
      this.set(key, val);
    }
    return this;
  }

  /**
   * Creates a new Collection that is a combination of this and other collections.
   * @param collections - Other collections to merge
   * @returns A new merged Collection
   */
  concat(...collections: Collection<K, V>[]): Collection<K, V> {
    const newColl = this.clone();
    for (const coll of collections) {
      for (const [key, val] of coll) {
        newColl.set(key, val);
      }
    }
    return newColl;
  }

  /**
   * Returns a shallow clone of this collection.
   */
  clone(): Collection<K, V> {
    return new Collection<K, V>([...this.entries()]);
  }

  /**
   * Checks if this collection is equal to another (same keys and values).
   * @param collection - The other collection to compare to
   */
  equals(collection: Collection<K, V>): boolean {
    if (this === collection) return true;
    if (this.size !== collection.size) return false;
    for (const [key, value] of this) {
      if (!collection.has(key) || collection.get(key) !== value) {
        return false;
      }
    }
    return true;
  }

  /**
   * Partitions the collection into two based on a predicate.
   * @param fn - The predicate function
   * @returns A tuple of [passing, failing] collections
   */
  partition(fn: (value: V, key: K, collection: this) => boolean): [Collection<K, V>, Collection<K, V>] {
    const pass = new Collection<K, V>();
    const fail = new Collection<K, V>();
    for (const [key, val] of this) {
      if (fn(val, key, this)) {
        pass.set(key, val);
      } else {
        fail.set(key, val);
      }
    }
    return [pass, fail];
  }

  /**
   * Converts the collection to a plain array of values.
   */
  toArray(): V[] {
    return [...this.values()];
  }

  /**
   * Converts the collection to a plain array of keys.
   */
  toKeyArray(): K[] {
    return [...this.keys()];
  }

  /**
   * Converts the collection to a JSON-serializable array of values.
   */
  toJSON(): V[] {
    return this.toArray();
  }
}
