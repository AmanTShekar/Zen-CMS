import NodeCache from 'node-cache';
import Redis from 'ioredis';
import pino from 'pino';
const logger = pino();
export class LocalCacheLayer {
    cache;
    constructor() {
        this.cache = new NodeCache({ stdTTL: 60, checkperiod: 120 });
        logger.warn('LocalCacheLayer: Initialized (Warning: Cache desync risk under horizontal scaling). ' +
            'Set REDIS_URL to enable distributed caching.');
    }
    async get(key) {
        return this.cache.get(key);
    }
    async set(key, value, _collection) {
        this.cache.set(key, value);
    }
    async invalidate(collection) {
        const keys = this.cache.keys();
        const targets = keys.filter((k) => k.startsWith(`${collection}:`) || k.startsWith(`find:${collection}:`) || k.startsWith(`findOne:${collection}:`));
        console.log(`[DEBUG CACHE] invalidate(${collection}) - all keys:`, keys, 'targets:', targets);
        this.cache.del(targets);
    }
}
export class RedisCacheLayer {
    redis;
    constructor(redisUrl, adapterName = 'Adapter') {
        this.redis = new Redis(redisUrl, {
            maxRetriesPerRequest: 3,
        });
        logger.info(`${adapterName}: Redis_Cache_Layer Initialized`);
    }
    async get(key) {
        try {
            const data = await this.redis.get(key);
            return data ? JSON.parse(data) : undefined;
        }
        catch (error) {
            logger.warn({ error: error.message }, 'RedisCacheLayer: Get failed');
            return undefined;
        }
    }
    async set(key, value, collection) {
        try {
            const setKey = `zenith:cache:collection:${collection}`;
            await this.redis.setex(key, 60, JSON.stringify(value));
            await this.redis.sadd(setKey, key);
            await this.redis.expire(setKey, 120);
        }
        catch (error) {
            logger.warn({ error: error.message }, 'RedisCacheLayer: Set failed');
        }
    }
    async invalidate(collection) {
        try {
            const setKey = `zenith:cache:collection:${collection}`;
            const keys = await this.redis.smembers(setKey);
            if (keys.length > 0) {
                await this.redis.del(...keys);
            }
            await this.redis.del(setKey);
        }
        catch (error) {
            logger.warn({ error: error.message }, 'RedisCacheLayer: Invalidate failed');
        }
    }
}
/**
 * Factory: returns the appropriate CacheLayer based on environment.
 */
export function createCacheLayer(adapterName) {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
        return new RedisCacheLayer(redisUrl, adapterName);
    }
    return new LocalCacheLayer();
}
//# sourceMappingURL=cache.js.map