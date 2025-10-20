/**
 * cache store manages API response caching
 */

class CacheStore {
    constructor() {
        this.cache = new Map();
        this.ttl = 60 * 60 * 1000; // 1 hr default
        this.maxCacheSize = 50; // max items to cache
    }

    get(key) {
        const item = this.cache.get(key);
        
        if (!item) return null;
        
        if (Date.now() > item.expiry) {
            this.cache.delete(key);
            return null;
        }

        return item.value;
    }

    set(key, value, customTTL = null) {
        // implement LRU cache eviction
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            value,
            expiry: Date.now() + (customTTL || this.ttl),
        });
    }

    clear() {
        this.cache.clear();
    }

    getCacheKey(apiName, params) {
        return `${apiName}:${JSON.stringify(params)}`;
    }

    getStats() {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize,
            items: Array.from(this.cache.keys()),
        };
    }
}

export default new CacheStore();