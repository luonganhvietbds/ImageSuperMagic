/**
 * AI Image Platform - IndexedDB Storage Layer
 * Using Dexie.js for IndexedDB abstraction
 */

import Dexie, { Table } from 'dexie';
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
} from '@ai-image-platform/types';

// ============================================================================
// DATABASE SCHEMA
// ============================================================================

export class AIImagePlatformDB extends Dexie {
    // Tables
    jobs!: Table<Job, UUID>;
    batches!: Table<Batch, UUID>;
    assets!: Table<Asset, UUID>;
    prompts!: Table<PromptVersion, UUID>;
    settings!: Table<UserSettings, string>;

    constructor() {
        super('AIImagePlatformDB');

        this.version(1).stores({
            // Job indexing: by id, module, status, batchId
            jobs: 'id, module, status, batchId, createdAt',

            // Batch indexing: by id, module, status
            batches: 'id, module, status, createdAt',

            // Asset indexing: by id, type, jobId, batchId
            assets: 'id, type, jobId, batchId, createdAt',

            // Prompt indexing: by id, module, version, isActive
            prompts: 'id, module, version, isActive, createdAt',

            // Settings: single key-value store
            settings: 'key'
        });
    }
}

// Singleton database instance
export const db = new AIImagePlatformDB();

// ============================================================================
// JOB OPERATIONS
// ============================================================================

export const jobOperations = {
    /**
     * Create a new job
     */
    async create(job: Job): Promise<UUID> {
        return await db.jobs.add(job);
    },

    /**
     * Get job by ID
     */
    async get(id: UUID): Promise<Job | undefined> {
        return await db.jobs.get(id);
    },

    /**
     * Update job
     */
    async update(id: UUID, updates: Partial<Job>): Promise<void> {
        await db.jobs.update(id, updates);
    },

    /**
     * Update job status
     */
    async updateStatus(id: UUID, status: JobStatus, error?: string): Promise<void> {
        const updates: Partial<Job> = { status };

        if (status === 'running') {
            updates.startedAt = Date.now();
        } else if (status === 'completed' || status === 'failed') {
            updates.completedAt = Date.now();
        }

        if (error) {
            updates.error = error;
        }

        await db.jobs.update(id, updates);
    },

    /**
     * Get jobs by status
     */
    async getByStatus(status: JobStatus): Promise<Job[]> {
        return await db.jobs.where('status').equals(status).toArray();
    },

    /**
     * Get jobs by module
     */
    async getByModule(module: ModuleType): Promise<Job[]> {
        return await db.jobs.where('module').equals(module).toArray();
    },

    /**
     * Get jobs by batch ID
     */
    async getByBatch(batchId: UUID): Promise<Job[]> {
        return await db.jobs.where('batchId').equals(batchId).toArray();
    },

    /**
     * Get all jobs ordered by creation time
     */
    async getAll(limit?: number): Promise<Job[]> {
        let query = db.jobs.orderBy('createdAt').reverse();
        if (limit) {
            query = query.limit(limit);
        }
        return await query.toArray();
    },

    /**
     * Delete job
     */
    async delete(id: UUID): Promise<void> {
        await db.jobs.delete(id);
    },

    /**
     * Increment retry count
     */
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
    /**
     * Create a new batch
     */
    async create(batch: Batch): Promise<UUID> {
        return await db.batches.add(batch);
    },

    /**
     * Get batch by ID
     */
    async get(id: UUID): Promise<Batch | undefined> {
        return await db.batches.get(id);
    },

    /**
     * Update batch
     */
    async update(id: UUID, updates: Partial<Batch>): Promise<void> {
        await db.batches.update(id, updates);
    },

    /**
     * Update batch progress
     */
    async updateProgress(id: UUID, completed: number, failed: number): Promise<void> {
        await db.batches.update(id, { completedJobs: completed, failedJobs: failed });
    },

    /**
     * Get batches by status
     */
    async getByStatus(status: Batch['status']): Promise<Batch[]> {
        return await db.batches.where('status').equals(status).toArray();
    },

    /**
     * Get all batches
     */
    async getAll(limit?: number): Promise<Batch[]> {
        let query = db.batches.orderBy('createdAt').reverse();
        if (limit) {
            query = query.limit(limit);
        }
        return await query.toArray();
    },

    /**
     * Delete batch and associated jobs
     */
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
    /**
     * Create a new asset
     */
    async create(asset: Asset): Promise<UUID> {
        return await db.assets.add(asset);
    },

    /**
     * Get asset by ID
     */
    async get(id: UUID): Promise<Asset | undefined> {
        return await db.assets.get(id);
    },

    /**
     * Get assets by type
     */
    async getByType(type: AssetType): Promise<Asset[]> {
        return await db.assets.where('type').equals(type).toArray();
    },

    /**
     * Get assets by job ID
     */
    async getByJob(jobId: UUID): Promise<Asset[]> {
        return await db.assets.where('jobId').equals(jobId).toArray();
    },

    /**
     * Get assets by batch ID
     */
    async getByBatch(batchId: UUID): Promise<Asset[]> {
        return await db.assets.where('batchId').equals(batchId).toArray();
    },

    /**
     * Delete asset
     */
    async delete(id: UUID): Promise<void> {
        await db.assets.delete(id);
    },

    /**
     * Get all assets
     */
    async getAll(limit?: number): Promise<Asset[]> {
        let query = db.assets.orderBy('createdAt').reverse();
        if (limit) {
            query = query.limit(limit);
        }
        return await query.toArray();
    }
};

// ============================================================================
// PROMPT BRAIN OPERATIONS
// ============================================================================

export const promptOperations = {
    /**
     * Create a new prompt version
     */
    async create(prompt: PromptVersion): Promise<UUID> {
        return await db.prompts.add(prompt);
    },

    /**
     * Get prompt by ID
     */
    async get(id: UUID): Promise<PromptVersion | undefined> {
        return await db.prompts.get(id);
    },

    /**
     * Get active prompt for a module
     */
    async getActive(module: ModuleType): Promise<PromptVersion | undefined> {
        return await db.prompts
            .where({ module, isActive: 1 })
            .first();
    },

    /**
     * Get all versions for a module
     */
    async getByModule(module: ModuleType): Promise<PromptVersion[]> {
        return await db.prompts
            .where('module')
            .equals(module)
            .reverse()
            .sortBy('createdAt');
    },

    /**
     * Activate a prompt version (deactivates others for same module)
     */
    async activate(id: UUID): Promise<void> {
        const prompt = await db.prompts.get(id);
        if (!prompt) throw new Error(`Prompt ${id} not found`);

        await db.transaction('rw', db.prompts, async () => {
            // Deactivate all prompts for this module
            await db.prompts
                .where('module')
                .equals(prompt.module)
                .modify({ isActive: false });

            // Activate the selected prompt
            await db.prompts.update(id, { isActive: true });
        });
    },

    /**
     * Get prompt by module and version
     */
    async getByVersion(module: ModuleType, version: string): Promise<PromptVersion | undefined> {
        return await db.prompts
            .where({ module, version })
            .first();
    },

    /**
     * Delete prompt version
     */
    async delete(id: UUID): Promise<void> {
        const prompt = await db.prompts.get(id);
        if (prompt?.isActive) {
            throw new Error('Cannot delete active prompt version');
        }
        await db.prompts.delete(id);
    }
};

// ============================================================================
// SETTINGS OPERATIONS
// ============================================================================

export const settingsOperations = {
    /**
     * Get all settings
     */
    async get(): Promise<UserSettings | null> {
        const result = await db.settings.get('user');
        return result || null;
    },

    /**
     * Save settings
     */
    async save(settings: UserSettings): Promise<void> {
        await db.settings.put({ ...settings, key: 'user' } as UserSettings & { key: string });
    },

    /**
     * Update specific setting
     */
    async update(key: keyof UserSettings, value: unknown): Promise<void> {
        const current = await this.get();
        if (current) {
            await db.settings.update('user', { [key]: value });
        } else {
            const defaultSettings: UserSettings = {
                apiKey: '',
                apiKeyValidated: false,
                theme: 'dark',
                defaultConcurrency: 3,
                autoRetry: true
            };
            await this.save({ ...defaultSettings, [key]: value });
        }
    },

    /**
     * Get API key
     */
    async getApiKey(): Promise<string | null> {
        const settings = await this.get();
        return settings?.apiKey || null;
    },

    /**
     * Save API key
     */
    async saveApiKey(apiKey: string, validated: boolean): Promise<void> {
        await this.update('apiKey', apiKey);
        await this.update('apiKeyValidated', validated);
    }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Generate a UUID
 */
export function generateUUID(): UUID {
    return crypto.randomUUID();
}

/**
 * Clear all data (for testing/reset)
 */
export async function clearAllData(): Promise<void> {
    await db.transaction('rw', [db.jobs, db.batches, db.assets, db.prompts], async () => {
        await db.jobs.clear();
        await db.batches.clear();
        await db.assets.clear();
        await db.prompts.clear();
    });
}

/**
 * Export all data as JSON
 */
export async function exportAllData(): Promise<object> {
    const [jobs, batches, assets, prompts, settings] = await Promise.all([
        db.jobs.toArray(),
        db.batches.toArray(),
        db.assets.toArray(),
        db.prompts.toArray(),
        db.settings.toArray()
    ]);

    return {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        data: { jobs, batches, assets, prompts, settings }
    };
}

/**
 * Get database statistics
 */
export async function getStats(): Promise<{
    totalJobs: number;
    pendingJobs: number;
    runningJobs: number;
    completedJobs: number;
    failedJobs: number;
    totalBatches: number;
    totalAssets: number;
    totalPrompts: number;
}> {
    const [jobs, batches, assets, prompts] = await Promise.all([
        db.jobs.toArray(),
        db.batches.count(),
        db.assets.count(),
        db.prompts.count()
    ]);

    return {
        totalJobs: jobs.length,
        pendingJobs: jobs.filter(j => j.status === 'pending').length,
        runningJobs: jobs.filter(j => j.status === 'running').length,
        completedJobs: jobs.filter(j => j.status === 'completed').length,
        failedJobs: jobs.filter(j => j.status === 'failed').length,
        totalBatches: batches,
        totalAssets: assets,
        totalPrompts: prompts
    };
}

// Export database instance and all operations
export default db;
