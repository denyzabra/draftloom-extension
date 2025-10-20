/**
 * Tests for CacheStore
 */

describe('CacheStore', () => {
  let cacheStore;

  beforeEach(() => {
    jest.resetModules();
    cacheStore = require('../../src/storage/cache-store.js').default;
    cacheStore.clear();
  });

  describe('get and set', () => {
    it('should store and retrieve values', () => {
      cacheStore.set('test-key', 'test-value');
      const value = cacheStore.get('test-key');
      expect(value).toBe('test-value');
    });

    it('should return null for non-existent keys', () => {
      const value = cacheStore.get('non-existent');
      expect(value).toBeNull();
    });

    it('should store complex objects', () => {
      const obj = { foo: 'bar', nested: { value: 123 } };
      cacheStore.set('object-key', obj);
      const retrieved = cacheStore.get('object-key');
      expect(retrieved).toEqual(obj);
    });
  });

  describe('TTL (Time To Live)', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should expire items after default TTL', () => {
      cacheStore.set('expiring-key', 'value');

      // advance time by 1 hour + 1ms
      jest.advanceTimersByTime(60 * 60 * 1000 + 1);

      const value = cacheStore.get('expiring-key');
      expect(value).toBeNull();
    });

    it('should allow custom TTL', () => {
      const customTTL = 5000; // 5 secs
      cacheStore.set('custom-ttl-key', 'value', customTTL);

      // advance time by 4 seconds (should still exist)
      jest.advanceTimersByTime(4000);
      expect(cacheStore.get('custom-ttl-key')).toBe('value');

      // advance time by 2 more seconds (should expire)
      jest.advanceTimersByTime(2000);
      expect(cacheStore.get('custom-ttl-key')).toBeNull();
    });

    it('should not expire before TTL', () => {
      cacheStore.set('valid-key', 'value');

      // advance time by 30 minutes (half of default TTL)
      jest.advanceTimersByTime(30 * 60 * 1000);

      const value = cacheStore.get('valid-key');
      expect(value).toBe('value');
    });
  });

  describe('LRU eviction', () => {
    it('should evict oldest item when max size is reached', () => {
      // set max size to 3 for testing
      cacheStore.maxCacheSize = 3;

      cacheStore.set('key1', 'value1');
      cacheStore.set('key2', 'value2');
      cacheStore.set('key3', 'value3');
      cacheStore.set('key4', 'value4'); //  evict key1

      expect(cacheStore.get('key1')).toBeNull();
      expect(cacheStore.get('key2')).toBe('value2');
      expect(cacheStore.get('key3')).toBe('value3');
      expect(cacheStore.get('key4')).toBe('value4');
    });
  });

  describe('getCacheKey', () => {
    it('should generate consistent cache keys', () => {
      const key1 = cacheStore.getCacheKey('apiName', { foo: 'bar' });
      const key2 = cacheStore.getCacheKey('apiName', { foo: 'bar' });
      expect(key1).toBe(key2);
    });

    it('should generate different keys for different params', () => {
      const key1 = cacheStore.getCacheKey('apiName', { foo: 'bar' });
      const key2 = cacheStore.getCacheKey('apiName', { foo: 'baz' });
      expect(key1).not.toBe(key2);
    });

    it('should include API name in key', () => {
      const key1 = cacheStore.getCacheKey('api1', { foo: 'bar' });
      const key2 = cacheStore.getCacheKey('api2', { foo: 'bar' });
      expect(key1).not.toBe(key2);
    });
  });

  describe('clear', () => {
    it('should remove all cached items', () => {
      cacheStore.set('key1', 'value1');
      cacheStore.set('key2', 'value2');

      cacheStore.clear();

      expect(cacheStore.get('key1')).toBeNull();
      expect(cacheStore.get('key2')).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', () => {
      cacheStore.set('key1', 'value1');
      cacheStore.set('key2', 'value2');

      const stats = cacheStore.getStats();

      expect(stats).toMatchObject({
        size: 2,
        maxSize: expect.any(Number),
        items: expect.arrayContaining(['key1', 'key2']),
      });
    });

    it('should show correct size after clear', () => {
      cacheStore.set('key1', 'value1');
      cacheStore.clear();

      const stats = cacheStore.getStats();
      expect(stats.size).toBe(0);
    });
  });
});
