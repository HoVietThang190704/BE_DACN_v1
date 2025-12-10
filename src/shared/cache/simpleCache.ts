export interface CacheOptions {
  ttlMs: number;
  maxItems?: number;
}

interface CacheEntry<V> {
  value: V;
  expiresAt: number;
}

/**
 * Tiny in-memory cache with TTL + bounded size.
 * Useful for hot-path lookups that hit Mongo repeatedly.
 */
export class SimpleCache<K, V> {
  private store = new Map<K, CacheEntry<V>>();

  constructor(private readonly options: CacheOptions) {}

  get(key: K): V | undefined {
    const entry = this.store.get(key);
    if (!entry) {
      return undefined;
    }

    if (Date.now() >= entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }

    return entry.value;
  }

  set(key: K, value: V, ttlOverrideMs?: number): void {
    const ttl = ttlOverrideMs ?? this.options.ttlMs;
    const expiresAt = Date.now() + ttl;
    this.store.set(key, { value, expiresAt });
    this.pruneExpired();
    this.enforceSizeLimit();
  }

  delete(key: K): void {
    this.store.delete(key);
  }

  clear(): void {
    this.store.clear();
  }

  size(): number {
    return this.store.size;
  }

  private pruneExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now >= entry.expiresAt) {
        this.store.delete(key);
      }
    }
  }

  private enforceSizeLimit(): void {
    const max = this.options.maxItems;
    if (!max) {
      return;
    }

    while (this.store.size > max) {
      const oldestKey = this.store.keys().next().value;
      if (oldestKey === undefined) {
        break;
      }
      this.store.delete(oldestKey);
    }
  }
}

export const createCache = <K, V>(options: CacheOptions): SimpleCache<K, V> => {
  return new SimpleCache<K, V>(options);
};
