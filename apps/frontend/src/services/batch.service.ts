/**
 * Batch Service
 */

import { batchOperations, jobOperations, generateUUID } from '../db';
import type { Batch, BatchConfig, ModuleType, UUID, RetryPolicy } from '../types';
import { createJob } from './job.service';
import { getActivePrompt } from './promptBrain.service';

const DEFAULT_RETRY_POLICY: RetryPolicy = {
    maxRetries: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
};

export async function createBatch(
    module: ModuleType,
    inputRefs: string[],
    config?: Partial<BatchConfig>
): Promise<Batch> {
    const activePrompt = await getActivePrompt(module);

    const batchConfig: BatchConfig = {
        concurrency: 3,
        retryPolicy: DEFAULT_RETRY_POLICY,
        promptVersion: activePrompt?.version || '1.0.0',
        ...config,
    };

    const batchId = generateUUID();

    const jobIds: UUID[] = [];
    for (const inputRef of inputRefs) {
        const job = await createJob(module, [inputRef], batchId);
        jobIds.push(job.id);
    }

    const batch: Batch = {
        id: batchId,
        module,
        status: 'pending',
        imageCount: inputRefs.length,
        jobIds,
        completedJobs: 0,
        failedJobs: 0,
        createdAt: Date.now(),
        config: batchConfig,
    };

    await batchOperations.create(batch);
    return batch;
}

export async function getBatch(id: UUID): Promise<Batch | null> {
    const batch = await batchOperations.get(id);
    return batch || null;
}

export async function getAllBatches(limit?: number): Promise<Batch[]> {
    return await batchOperations.getAll(limit);
}

export async function startBatch(id: UUID): Promise<void> {
    await batchOperations.update(id, { status: 'running', startedAt: Date.now() });
}

export async function pauseBatch(id: UUID): Promise<void> {
    await batchOperations.update(id, { status: 'paused' });
}

export async function resumeBatch(id: UUID): Promise<void> {
    await batchOperations.update(id, { status: 'running' });
}

export async function updateBatchProgress(id: UUID): Promise<void> {
    const batch = await batchOperations.get(id);
    if (!batch) return;

    const jobs = await jobOperations.getByBatch(id);
    const completed = jobs.filter(j => j.status === 'completed').length;
    const failed = jobs.filter(j => j.status === 'failed').length;

    await batchOperations.updateProgress(id, completed, failed);

    if (completed + failed === batch.imageCount) {
        await batchOperations.update(id, {
            status: failed > 0 ? 'failed' : 'completed',
            completedAt: Date.now(),
        });
    }
}

export async function retryFailedJobs(id: UUID): Promise<number> {
    const batch = await batchOperations.get(id);
    if (!batch) return 0;

    const jobs = await jobOperations.getByBatch(id);
    const failedJobs = jobs.filter(j => j.status === 'failed');

    let retriedCount = 0;
    for (const job of failedJobs) {
        if (job.retryCount < batch.config.retryPolicy.maxRetries) {
            await jobOperations.incrementRetry(job.id);
            retriedCount++;
        }
    }

    if (retriedCount > 0) {
        await batchOperations.update(id, { status: 'running' });
    }

    return retriedCount;
}

export async function getBatchStats(): Promise<{
    total: number;
    active: number;
    completed: number;
    failed: number;
}> {
    const batches = await batchOperations.getAll();
    return {
        total: batches.length,
        active: batches.filter(b => b.status === 'running' || b.status === 'paused').length,
        completed: batches.filter(b => b.status === 'completed').length,
        failed: batches.filter(b => b.status === 'failed').length,
    };
}

export default {
    createBatch,
    getBatch,
    getAllBatches,
    startBatch,
    pauseBatch,
    resumeBatch,
    updateBatchProgress,
    retryFailedJobs,
    getBatchStats,
};
