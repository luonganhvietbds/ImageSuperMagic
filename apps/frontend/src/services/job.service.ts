/**
 * Job Service
 */

import { jobOperations, generateUUID } from '../db';
import type { Job, ModuleType, JobStatus, UUID } from '../types';
import { getActivePrompt } from './promptBrain.service';

export async function createJob(
    module: ModuleType,
    inputRefs: string[],
    batchId?: UUID
): Promise<Job> {
    const activePrompt = await getActivePrompt(module);

    const job: Job = {
        id: generateUUID(),
        module,
        status: 'pending',
        promptVersion: activePrompt?.version || '1.0.0',
        schemaVersion: activePrompt?.schemaVersion || `${module}_v1`,
        inputRefs,
        outputRefs: [],
        createdAt: Date.now(),
        retryCount: 0,
        batchId,
    };

    await jobOperations.create(job);
    return job;
}

export async function getJob(id: UUID): Promise<Job | null> {
    const job = await jobOperations.get(id);
    return job || null;
}

export async function getAllJobs(limit?: number): Promise<Job[]> {
    return await jobOperations.getAll(limit);
}

export async function getJobsByStatus(status: JobStatus): Promise<Job[]> {
    return await jobOperations.getByStatus(status);
}

export async function startJob(id: UUID): Promise<void> {
    await jobOperations.updateStatus(id, 'running');
}

export async function completeJob(id: UUID, outputRefs: string[]): Promise<void> {
    await jobOperations.update(id, {
        status: 'completed',
        outputRefs,
        completedAt: Date.now(),
    });
}

export async function failJob(id: UUID, error: string): Promise<void> {
    await jobOperations.updateStatus(id, 'failed', error);
}

export async function retryJob(id: UUID): Promise<number> {
    return await jobOperations.incrementRetry(id);
}

export async function getJobStats(): Promise<{
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
}> {
    const jobs = await jobOperations.getAll();
    return {
        total: jobs.length,
        pending: jobs.filter(j => j.status === 'pending').length,
        running: jobs.filter(j => j.status === 'running').length,
        completed: jobs.filter(j => j.status === 'completed').length,
        failed: jobs.filter(j => j.status === 'failed').length,
    };
}

export default {
    createJob,
    getJob,
    getAllJobs,
    getJobsByStatus,
    startJob,
    completeJob,
    failJob,
    retryJob,
    getJobStats,
};
