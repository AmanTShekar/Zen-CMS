import { CollectionConfig, DatabaseAdapter, FindOptions, BaseOptions, AuditLogData, VersionData, WebhookDeliveryData, WebhookDeliveryRecord } from '@zenith-open/zenithcms-types';
import { NodePgDatabase } from 'drizzle-orm/node-postgres';
/**
 * PostgreSQL Database Adapter with Drizzle ORM
 * ─────────────────────────────────────────────
 * Phase B: "The Tightening"
 * Features:
 * - Dynamic Column Mapping (No more JSONB traps)
 * - Auto-Migration Engine (safe DDL execution on boot)
 * - Atomic Multi-Table Transactions.
 * - Pre-compiled Zod validation caching.
 */
export declare class PostgresDrizzleAdapter implements DatabaseAdapter {
    private connectionString;
    name: string;
    private pool;
    db: NodePgDatabase;
    private cache;
    private tables;
    private configs;
    private tenantPools;
    private systemTables;
    constructor(connectionString: string);
    /**
     * Executes a database operation within a tenant-isolated RLS context.
     * If siteId is provided, it begins a transaction, sets the local config parameter,
     * and yields the transaction object.
     */
    runWithTenantContext<T>(siteId: string | undefined, operation: (tx: any) => Promise<T>): Promise<T>;
    registerTenant(tenantId: string, tenantConnectionString: string): Promise<void>;
    getNativeClient<T = any>(): T;
    executeRaw(query: string, params?: any[]): Promise<any>;
    private getDbClient;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getHealth(): 'ok' | 'connecting' | 'disconnected' | 'error';
    private _ensureSystemTables;
    private mapFieldToDrizzleColumn;
    private mapFieldToSqlType;
    registerCollection(config: CollectionConfig, db?: NodePgDatabase<any>): Promise<void>;
    getExistingCollections(): Promise<string[]>;
    private _runAutoMigrations;
    private getTable;
    private _getCacheKey;
    private _invalidateCache;
    private buildWhereClause;
    /** Inject tenant scoping into the WHERE clause to prevent cross-tenant data access */
    private tenantScope;
    private mapAstToDrizzle;
    find<T = unknown>(collection: string, query: Record<string, unknown>, options?: FindOptions): Promise<T[]>;
    findOne<T = unknown>(collection: string, query: Record<string, unknown>, options?: FindOptions): Promise<T | null>;
    findMany<T = unknown>(collection: string, ids: string[], options?: FindOptions): Promise<T[]>;
    /**
     * Builds a Drizzle select query, optionally scoped to a subset of columns.
     * When options.select is populated, only those columns are fetched (plus
     * always-loaded metadata: id, createdAt, updatedAt, status).
     */
    private _selectWithColumns;
    /** Maximum depth for nested relation population to prevent query explosion */
    private static readonly MAX_POPULATE_DEPTH;
    private _populateRelations;
    private _loadJunctionIds;
    private _writeJunctionRelations;
    create<T = unknown>(collection: string, data: Partial<T>, options?: BaseOptions): Promise<T>;
    update<T = unknown>(collection: string, id: string, data: Partial<T>, options?: BaseOptions): Promise<T | null>;
    findOneAndUpdate<T = unknown>(collection: string, query: Record<string, unknown>, update: Record<string, unknown>, options?: BaseOptions & {
        returnDocument?: 'before' | 'after';
    }): Promise<T | null>;
    updateMany(collection: string, query: Record<string, unknown>, data: unknown, options?: BaseOptions): Promise<number>;
    delete(collection: string, id: string, options?: BaseOptions): Promise<boolean>;
    deleteMany(collection: string, query: Record<string, unknown>, options?: BaseOptions): Promise<number>;
    count(collection: string, query: Record<string, unknown>, options?: BaseOptions): Promise<number>;
    aggregate(_collection: string, _pipeline: any[], _options?: BaseOptions): Promise<any[]>;
    transaction<T>(fn: (session: unknown) => Promise<T>): Promise<T>;
    createAuditLog(data: AuditLogData, options?: BaseOptions): Promise<void>;
    createVersion(data: VersionData, options?: BaseOptions): Promise<void>;
    getVersions(collection: string, documentId: string, options?: BaseOptions): Promise<VersionData[]>;
    createWebhookDelivery(data: WebhookDeliveryData, options?: BaseOptions): Promise<void>;
    getWebhookDeliveries(webhookId: string, limit?: number): Promise<WebhookDeliveryRecord[]>;
    search<T = unknown>(collection: string, query: string, fields: string[], limit?: number, options?: BaseOptions): Promise<T[]>;
}
