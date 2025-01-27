class CacheItem<T> {
  constructor(
    public value: T,
    public lastAccessed: number,
    public ttl: number // Time-To-Live in milliseconds
  ) {}
}

export class Cache<K, V> {
  private cache: Map<K, CacheItem<V>>;
  private maxSize: number;

  constructor(maxSize: number) {
    this.cache = new Map<K, CacheItem<V>>();
    this.maxSize = maxSize;
  }

  stats(): string {
    return `Cache size: ${this.cache.size}`;
  }

  get(key: K): V | undefined {
    const item = this.cache.get(key);
    if (item) {
      const now = Date.now();
      if (now - item.lastAccessed > item.ttl) {
        this.cache.delete(key);
        return undefined;
      }
      item.lastAccessed = now;
      return item.value;
    }
    return undefined;
  }

  set(key: K, value: V, ttl: number): void {
    if (this.cache.size >= this.maxSize) {
      this.evict();
    }
    this.cache.set(key, new CacheItem(value, Date.now(), ttl * 1000));
  }

  private evict(): void {
    let oldestKey: K | undefined;
    let oldestTime = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.lastAccessed < oldestTime) {
        oldestTime = item.lastAccessed;
        oldestKey = key;
      }
    }

    if (oldestKey !== undefined) {
      this.cache.delete(oldestKey);
    }
  }
}
