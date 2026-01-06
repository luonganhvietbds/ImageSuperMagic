/**
 * AI Image Platform - Shared Types
 * Core type definitions for the entire platform
 */

// ============================================================================
// COMMON TYPES
// ============================================================================

export type UUID = string;
export type Timestamp = number;
export type HexColor = `#${string}`;

export type JobStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type ModuleType = 'grid_to_json' | 'vision_to_json' | 'realistic_to_json';

// ============================================================================
// JOB SYSTEM
// ============================================================================

export interface Job {
    id: UUID;
    module: ModuleType;
    status: JobStatus;
    promptVersion: string;
    schemaVersion: string;
    inputRefs: string[];
    outputRefs: string[];
    createdAt: Timestamp;
    startedAt?: Timestamp;
    completedAt?: Timestamp;
    error?: string;
    retryCount: number;
    batchId?: UUID;
}

export interface JobManifest {
    jobId: UUID;
    module: ModuleType;
    promptSnapshot: string;
    schemaSnapshot: string;
    inputSnapshot: Record<string, unknown>;
    config: Record<string, unknown>;
}

// ============================================================================
// BATCH SYSTEM
// ============================================================================

export interface Batch {
    id: UUID;
    module: ModuleType;
    status: 'pending' | 'running' | 'paused' | 'completed' | 'failed';
    imageCount: number;
    jobIds: UUID[];
    completedJobs: number;
    failedJobs: number;
    createdAt: Timestamp;
    startedAt?: Timestamp;
    completedAt?: Timestamp;
    config: BatchConfig;
}

export interface BatchConfig {
    concurrency: number;
    retryPolicy: RetryPolicy;
    promptVersion: string;
}

export interface RetryPolicy {
    maxRetries: number;
    backoffMs: number;
    backoffMultiplier: number;
}

// ============================================================================
// PROMPT BRAIN
// ============================================================================

export interface PromptVersion {
    id: UUID;
    module: ModuleType;
    version: string;
    name: string;
    content: string;
    isActive: boolean;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
}

// ============================================================================
// ASSET TYPES
// ============================================================================

export interface Asset {
    id: UUID;
    type: AssetType;
    filename: string;
    mimeType: string;
    size: number;
    data: Blob | string;
    metadata: Record<string, unknown>;
    createdAt: Timestamp;
    jobId?: UUID;
    batchId?: UUID;
}

export type AssetType =
    | 'input_image'
    | 'identity_json'
    | 'panel_json'
    | 'vision_json'
    | 'realistic_json'
    | 'grid_prompt'
    | 'generated_image'
    | 'export_package';

// ============================================================================
// MODULE OUTPUT TYPES
// ============================================================================

export interface IdentityJSON {
    meta: {
        source_image_quality: string;
        extraction_confidence: string;
        critical_identity_markers: string;
    };
    identity_blueprint: {
        face_geometry: Record<string, unknown>;
        unique_markers: Record<string, unknown>;
        skin: Record<string, unknown>;
    };
    hair: Record<string, unknown>;
    outfit: Record<string, unknown>;
    accessories: unknown[];
    generation_settings: {
        grid_generation_prompt: string;
    };
}

export interface VisionJSON {
    meta: {
        image_quality: string;
        image_type: string;
        resolution_estimation: string;
    };
    global_context: Record<string, unknown>;
    objects: unknown[];
    semantic_relationships: string[];
}

export interface RealisticJSON {
    meta: {
        intent: string;
        priorities: string[];
    };
    subject: Record<string, unknown>;
    wardrobe: unknown[];
    lighting: Record<string, unknown>;
    camera: Record<string, unknown>;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface GridModuleState {
    images: Asset[];
    selectedImageId: UUID | null;
    currentIdentity: IdentityJSON | null;
    panels: (unknown | null)[];
    activeTab: 'workspace' | 'panels' | 'batch' | 'prompt_usage' | 'exports';
    workspaceSubTab: 'reference' | 'geometry' | 'markers';
    outputSubTab: 'identity' | 'panel' | 'grid_prompt';
    selectedPanelNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
}

export interface VisionModuleState {
    image: Asset | null;
    result: VisionJSON | null;
    activeTab: 'input' | 'objects' | 'relationships' | 'text_ocr' | 'json_output';
    selectedObjectId: string | null;
}

export interface RealisticModuleState {
    mode: 'text' | 'image' | 'hybrid';
    inputText: string;
    inputImage: Asset | null;
    result: RealisticJSON | null;
    activeTab: 'builder' | 'assumptions' | 'json_spec' | 'variations';
    assumptions: string[];
}

// ============================================================================
// USER SETTINGS
// ============================================================================

export interface UserSettings {
    apiKey: string;
    apiKeyValidated: boolean;
    theme: 'dark' | 'light';
    defaultConcurrency: number;
    autoRetry: boolean;
}
