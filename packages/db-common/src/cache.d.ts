/**
 * Shared CacheLayer abstraction used by both MongooseAdapter and PostgresDrizzleAdapter.
 *
 * Two implementations:
 *   - LocalCacheLayer  → in-process NodeCache (dev / single-node only)
 *   - RedisCacheLayer  → Redis (production / horizontally-scaled deployments)
 *
 * The adapter constructor selects the correct layer based on whether
 * REDIS_URL is set in the environment.
 */
export interface CacheLayer {
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T, collection: string): Promise<void>;
    invalidate(collection: string): Promise<void>;
}
export declare class LocalCacheLayer implements CacheLayer {
    private cache;
    constructor();
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T, _collection: string): Promise<void>;
    invalidate(collection: string): Promise<void>;
}
export declare class RedisCacheLayer implements CacheLayer {
    private redis;
    constructor(redisUrl: string, adapterName?: string);
    get<T>(key: string): Promise<T | undefined>;
    set<T>(key: string, value: T, collection: string): Promise<void>;
    invalidate(collection: string): Promise<void>;
}
/**
 * Factory: returns the appropriate CacheLayer based on environment.
 */
export declare function createCacheLayer(adapterName: string): CacheLayer;
