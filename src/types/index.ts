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
        source_image_quality: 'Low' | 'Medium' | 'High' | 'Professional';
        source_angle: string;
        extraction_confidence: string;
        critical_identity_markers: string;
    };
    identity_blueprint: {
        face_geometry: {
            face_shape: string;
            face_length_to_width_ratio: string;
            forehead: {
                height: string;
                width: string;
                shape: string;
                hairline_shape: string;
            };
            eye_area: {
                eye_shape: string;
                eye_size: string;
                eye_color: string;
                eye_spacing: string;
                eyelid_type: string;
                lash_description: string;
                brow_to_eye_distance: string;
                under_eye: string;
            };
            eyebrows: {
                shape: string;
                thickness: string;
                color: string;
                grooming: string;
                spacing_from_center: string;
            };
            nose: {
                overall_shape: string;
                bridge_height: string;
                bridge_width: string;
                nose_length: string;
                tip_shape: string;
                nostril_shape: string;
                nostril_visibility: string;
            };
            mouth_area: {
                lip_shape: string;
                upper_lip: string;
                lower_lip: string;
                lip_color: string;
                mouth_width: string;
                philtrum: string;
                smile_characteristics: string;
            };
            cheek_area: {
                cheekbone_prominence: string;
                cheek_fullness: string;
            };
            jaw_and_chin: {
                jawline_shape: string;
                jaw_width: string;
                chin_shape: string;
                chin_prominence: string;
            };
        };
        unique_markers: {
            moles: Array<{ location: string; size: string; color: string }>;
            freckles: { present: boolean; density: string; location: string };
            scars: Array<{ location: string; size: string; appearance: string }>;
            dimples: { present: boolean; location: string };
            asymmetries: string[];
            piercings: Array<{ location: string; type: string; material: string; size: string }>;
        };
        skin: {
            tone: string;
            hex_approximation: string;
            texture: string;
            finish: string;
            characteristics: string[];
        };
    };
    hair: {
        color: {
            primary: string;
            hex_approximation: string;
            secondary: string;
            color_pattern: string;
            shine_level: string;
        };
        texture: string;
        thickness: string;
        density: string;
        length: string;
        style: {
            current_styling: string;
            parting: string;
            volume_distribution: string;
            front_framing: string;
        };
        hairline: {
            shape: string;
            visibility: string;
        };
    };
    facial_hair: {
        present: boolean;
        type: string | null;
        details: string | null;
    };
    makeup_grooming: {
        makeup_present: boolean;
        makeup_level: string;
        foundation: string;
        eye_makeup: string;
        lip_product: string;
        other: string;
    };
    outfit: {
        garment_type: string;
        color: {
            primary: string;
            hex_approximation: string;
            pattern: string;
            pattern_details: string;
        };
        material: string;
        material_appearance: string;
        fit: string;
        neckline: string;
        sleeves: string;
        distinguishing_features: string[];
    };
    accessories: Array<{
        type: string;
        description: string;
        material: string;
        color_hex: string;
        placement: string;
    }>;
    source_lighting: {
        type: string;
        direction: string;
        quality: string;
        color_temperature: string;
    };
    generation_settings: {
        grid_layout: string;
        background: string;
        lighting_style: string;
        expression: string;
        universal_identity_prompt: string;
        grid_generation_prompt: string;
    };
    negative_prompt: string;
}

// Panel JSON for individual angle outputs
export interface PanelJSON {
    panel: {
        number: number;
        position: string;
        angle_name: string;
        camera_position: string;
        subject_direction: string;
    };
    identity_lock: {
        face_shape: string;
        skin_tone: string;
        eye_details: string;
        nose_details: string;
        lip_details: string;
        hair: string;
        makeup: string;
        outfit: string;
        accessories: string;
        unique_markers: string;
    };
    prompt: {
        full_prompt: string;
        negative_prompt: string;
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
