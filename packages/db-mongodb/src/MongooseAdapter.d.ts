import { CollectionConfig, DatabaseAdapter, FindOptions, BaseOptions, AuditLogData, VersionData, WebhookDeliveryData, WebhookDeliveryRecord } from '@zenith-open/zenithcms-types';
/**
 * Mongoose Database Adapter — Hardened Edition
 * ──────────────────────────────────────────
 * High-performance implementation for MongoDB.
 * Features: Neural Cache Layer, automatic session management, and health monitoring.
 */
export declare class MongooseAdapter implements DatabaseAdapter {
    private uri;
    name: string;
    private models;
    private cache;
    private consecutiveFailures;
    private circuitBreakerCooldown;
    private readonly CIRCUIT_BREAKER_THRESHOLD;
    private readonly CIRCUIT_BREAKER_RESET_TIMEOUT_MS;
    private _withCircuitBreaker;
    constructor(uri: string);
    getNativeClient<T = any>(): T;
    executeRaw(query: string, params?: any[]): Promise<any>;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getHealth(): 'ok' | 'connecting' | 'disconnected' | 'error';
    private _initSystemModels;
    registerCollection(config: CollectionConfig): Promise<void>;
    getExistingCollections(): Promise<string[]>;
    private getModel;
    private _getCacheKey;
    find<T = unknown>(collection: string, query: Record<string, unknown>, options?: FindOptions): Promise<T[]>;
    findOne<T = unknown>(collection: string, query: Record<string, unknown>, options?: FindOptions): Promise<T | null>;
    findMany<T = unknown>(collection: string, ids: string[], options?: BaseOptions): Promise<T[]>;
    private _invalidateCache;
    create<T = unknown>(collection: string, data: Partial<T>, options?: BaseOptions): Promise<T>;
    update<T = unknown>(collection: string, id: string, data: Partial<T>, options?: BaseOptions): Promise<T | null>;
    private _normalizeQuery;
    findOneAndUpdate<T = unknown>(collection: string, query: Record<string, unknown>, update: Record<string, unknown>, options?: BaseOptions & {
        returnDocument?: 'before' | 'after';
    }): Promise<T | null>;
    updateMany(collection: string, query: Record<string, unknown>, data: unknown, options?: BaseOptions): Promise<number>;
    delete(collection: string, id: string, options?: BaseOptions): Promise<boolean>;
    deleteMany(collection: string, query: Record<string, unknown>, options?: BaseOptions): Promise<number>;
    count(collection: string, query: Record<string, unknown>, options?: BaseOptions): Promise<number>;
    aggregate<T = unknown>(collection: string, pipeline: unknown[], options?: BaseOptions): Promise<T[]>;
    transaction<T>(fn: (session: any) => Promise<T>): Promise<T>;
    createAuditLog(data: AuditLogData, options?: BaseOptions): Promise<void>;
    createVersion(data: VersionData, options?: BaseOptions): Promise<void>;
    getVersions(collection: string, documentId: string): Promise<VersionData[]>;
    createWebhookDelivery(data: WebhookDeliveryData): Promise<void>;
    getWebhookDeliveries(webhookId: string, limit?: number): Promise<WebhookDeliveryRecord[]>;
    search<T = unknown>(collection: string, query: string, fields: string[], limit?: number, options?: BaseOptions): Promise<T[]>;
}
