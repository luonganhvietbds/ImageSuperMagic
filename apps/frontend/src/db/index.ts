/**
 * AI Image Platform - IndexedDB Storage Layer
 * Using Dexie.js for IndexedDB abstraction
 */

import Dexie, { type Table } from 'dexie';
import type {
    Job,
    Batch,
    Asset,
    PromptVersion,
    UserSettings,
    UUID,
    ModuleType,
    JobStatus,
    AssetType
} from '../types';

// ============================================================================
// DATABASE SCHEMA
// ============================================================================

class AIImagePlatformDB extends Dexie {
    jobs!: Table<Job, UUID>;
    batches!: Table<Batch, UUID>;
    assets!: Table<Asset, UUID>;
    prompts!: Table<PromptVersion, UUID>;
    settings!: Table<UserSettings & { key: string }, string>;

    constructor() {
        super('AIImagePlatformDB');

        this.version(1).stores({
            jobs: 'id, module, status, batchId, createdAt',
            batches: 'id, module, status, createdAt',
            assets: 'id, type, jobId, batchId, createdAt',
            prompts: 'id, module, version, isActive, createdAt',
            settings: 'key'
        });
    }
}

export const db = new AIImagePlatformDB();

// ============================================================================
// JOB OPERATIONS
// ============================================================================

export const jobOperations = {
    async create(job: Job): Promise<UUID> {
        return await db.jobs.add(job);
    },

    async get(id: UUID): Promise<Job | undefined> {
        return await db.jobs.get(id);
    },

    async update(id: UUID, updates: Partial<Job>): Promise<void> {
        await db.jobs.update(id, updates);
    },

    async updateStatus(id: UUID, status: JobStatus, error?: string): Promise<void> {
        const updates: Partial<Job> = { status };
        if (status === 'running') updates.startedAt = Date.now();
        else if (status === 'completed' || status === 'failed') updates.completedAt = Date.now();
        if (error) updates.error = error;
        await db.jobs.update(id, updates);
    },

    async getByStatus(status: JobStatus): Promise<Job[]> {
        return await db.jobs.where('status').equals(status).toArray();
    },

    async getByModule(module: ModuleType): Promise<Job[]> {
        return await db.jobs.where('module').equals(module).toArray();
    },

    async getByBatch(batchId: UUID): Promise<Job[]> {
        return await db.jobs.where('batchId').equals(batchId).toArray();
    },

    async getAll(limit?: number): Promise<Job[]> {
        let query = db.jobs.orderBy('createdAt').reverse();
        if (limit) query = query.limit(limit);
        return await query.toArray();
    },

    async delete(id: UUID): Promise<void> {
        await db.jobs.delete(id);
    },

    async incrementRetry(id: UUID): Promise<number> {
        const job = await db.jobs.get(id);
        if (!job) throw new Error(`Job ${id} not found`);
        const newCount = job.retryCount + 1;
        await db.jobs.update(id, { retryCount: newCount, status: 'pending' });
        return newCount;
    }
};

// ============================================================================
// BATCH OPERATIONS
// ============================================================================

export const batchOperations = {
    async create(batch: Batch): Promise<UUID> {
        return await db.batches.add(batch);
    },

    async get(id: UUID): Promise<Batch | undefined> {
        return await db.batches.get(id);
    },

    async update(id: UUID, updates: Partial<Batch>): Promise<void> {
        await db.batches.update(id, updates);
    },

    async updateProgress(id: UUID, completed: number, failed: number): Promise<void> {
        await db.batches.update(id, { completedJobs: completed, failedJobs: failed });
    },

    async getByStatus(status: Batch['status']): Promise<Batch[]> {
        return await db.batches.where('status').equals(status).toArray();
    },

    async getAll(limit?: number): Promise<Batch[]> {
        let query = db.batches.orderBy('createdAt').reverse();
        if (limit) query = query.limit(limit);
        return await query.toArray();
    },

    async delete(id: UUID): Promise<void> {
        await db.transaction('rw', [db.batches, db.jobs], async () => {
            await db.jobs.where('batchId').equals(id).delete();
            await db.batches.delete(id);
        });
    }
};

// ============================================================================
// ASSET OPERATIONS
// ============================================================================

export const assetOperations = {
    async create(asset: Asset): Promise<UUID> {
        return await db.assets.add(asset);
    },

    async get(id: UUID): Promise<Asset | undefined> {
        return await db.assets.get(id);
    },

    async getByType(type: AssetType): Promise<Asset[]> {
        return await db.assets.where('type').equals(type).toArray();
    },

    async getByJob(jobId: UUID): Promise<Asset[]> {
        return await db.assets.where('jobId').equals(jobId).toArray();
    },

    async delete(id: UUID): Promise<void> {
        await db.assets.delete(id);
    },

    async getAll(limit?: number): Promise<Asset[]> {
        let query = db.assets.orderBy('createdAt').reverse();
        if (limit) query = query.limit(limit);
        return await query.toArray();
    }
};

// ============================================================================
// PROMPT OPERATIONS
// ============================================================================

export const promptOperations = {
    async create(prompt: PromptVersion): Promise<UUID> {
        return await db.prompts.add(prompt);
    },

    async get(id: UUID): Promise<PromptVersion | undefined> {
        return await db.prompts.get(id);
    },

    async getActive(module: ModuleType): Promise<PromptVersion | undefined> {
        return await db.prompts.where({ module, isActive: 1 }).first();
    },

    async getByModule(module: ModuleType): Promise<PromptVersion[]> {
        return await db.prompts.where('module').equals(module).reverse().sortBy('createdAt');
    },

    async activate(id: UUID): Promise<void> {
        const prompt = await db.prompts.get(id);
        if (!prompt) throw new Error(`Prompt ${id} not found`);
        await db.transaction('rw', db.prompts, async () => {
            await db.prompts.where('module').equals(prompt.module).modify({ isActive: false });
            await db.prompts.update(id, { isActive: true });
        });
    },

    async getByVersion(module: ModuleType, version: string): Promise<PromptVersion | undefined> {
        return await db.prompts.where({ module, version }).first();
    },

    async delete(id: UUID): Promise<void> {
        const prompt = await db.prompts.get(id);
        if (prompt?.isActive) throw new Error('Cannot delete active prompt');
        await db.prompts.delete(id);
    }
};

// ============================================================================
// SETTINGS OPERATIONS
// ============================================================================

export const settingsOperations = {
    async get(): Promise<UserSettings | null> {
        const result = await db.settings.get('user');
        return result ? { ...result, key: undefined } as unknown as UserSettings : null;
    },

    async save(settings: UserSettings): Promise<void> {
        await db.settings.put({ ...settings, key: 'user' });
    },

    async getApiKey(): Promise<string | null> {
        const settings = await this.get();
        return settings?.apiKey || null;
    },

    async saveApiKey(apiKey: string, validated: boolean): Promise<void> {
        const current = await this.get();
        const settings: UserSettings = current || {
            apiKey: '',
            apiKeyValidated: false,
            theme: 'dark',
            defaultConcurrency: 3,
            autoRetry: true
        };
        settings.apiKey = apiKey;
        settings.apiKeyValidated = validated;
        await this.save(settings);
    }
};

// ============================================================================
// UTILITIES
// ============================================================================

export function generateUUID(): UUID {
    return crypto.randomUUID();
}

export async function clearAllData(): Promise<void> {
    await db.transaction('rw', [db.jobs, db.batches, db.assets, db.prompts], async () => {
        await db.jobs.clear();
        await db.batches.clear();
        await db.assets.clear();
        await db.prompts.clear();
    });
}

export default db;
