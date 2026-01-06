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
    systemPrompt: string;
    schemaVersion: string;
    isActive: boolean;
    createdAt: Timestamp;
    createdBy: string;
    notes?: string;
}

export interface PromptRegistry {
    modules: {
        [key in ModuleType]: {
            activeVersion: string;
            versions: string[];
        };
    };
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
// GRID-TO-JSON MODULE
// ============================================================================

export interface IdentityJSON {
    meta: {
        source_image_quality: 'Low' | 'Medium' | 'High' | 'Professional';
        source_angle: string;
        extraction_confidence: string;
        critical_identity_markers: string;
    };
    identity_blueprint: {
        face_geometry: FaceGeometry;
        unique_markers: UniqueMarkers;
        skin: SkinDetails;
    };
    hair: HairDetails;
    facial_hair?: FacialHairDetails;
    makeup_grooming?: MakeupDetails;
    outfit: OutfitDetails;
    accessories: AccessoryItem[];
    source_lighting: LightingDetails;
    generation_settings: GenerationSettings;
    negative_prompt: string;
}

export interface FaceGeometry {
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
        smile_characteristics?: string;
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
}

export interface UniqueMarkers {
    moles: Array<{
        location: string;
        size: string;
        color: string;
    }>;
    freckles: {
        present: boolean;
        density?: string;
        location?: string;
    };
    scars: Array<{
        location: string;
        size: string;
        appearance: string;
    }>;
    dimples: {
        present: boolean;
        location?: string;
    };
    asymmetries: string[];
    piercings: Array<{
        location: string;
        type: string;
        material: string;
        size: string;
    }>;
}

export interface SkinDetails {
    tone: string;
    hex_approximation: HexColor;
    texture: string;
    finish: string;
    characteristics: string[];
}

export interface HairDetails {
    color: {
        primary: string;
        hex_approximation: HexColor;
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
}

export interface FacialHairDetails {
    present: boolean;
    type?: string;
    details?: string;
}

export interface MakeupDetails {
    makeup_present: boolean;
    makeup_level?: string;
    foundation?: string;
    eye_makeup?: string;
    lip_product?: string;
    other?: string;
}

export interface OutfitDetails {
    garment_type: string;
    color: {
        primary: string;
        hex_approximation: HexColor;
        pattern: string;
        pattern_details?: string;
    };
    material: string;
    material_appearance: string;
    fit: string;
    neckline: string;
    sleeves: string;
    distinguishing_features: string[];
}

export interface AccessoryItem {
    type: string;
    description: string;
    material: string;
    color_hex?: HexColor;
    placement: string;
}

export interface LightingDetails {
    type: string;
    direction: string;
    quality: string;
    color_temperature: string;
}

export interface GenerationSettings {
    grid_layout: string;
    background: string;
    lighting_style: string;
    expression: string;
    universal_identity_prompt: string;
    grid_generation_prompt: string;
}

// ============================================================================
// PANEL JSON (Grid-to-JSON per-panel output)
// ============================================================================

export interface PanelJSON {
    panel: {
        number: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
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

export type PanelNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export const PANEL_ANGLES: Record<PanelNumber, string> = {
    1: 'High angle (top-down)',
    2: 'Low angle (from below)',
    3: 'Eye-level straight-on',
    4: 'Dutch angle (tilted frame)',
    5: 'Close-up low angle',
    6: 'Over-the-shoulder',
    7: 'Wide shot from side (profile)',
    8: '45-degree from front',
    9: 'Slight bird\'s-eye'
};

export const PANEL_POSITIONS: Record<PanelNumber, string> = {
    1: 'Top-left',
    2: 'Top-center',
    3: 'Top-right',
    4: 'Middle-left',
    5: 'Middle-center',
    6: 'Middle-right',
    7: 'Bottom-left',
    8: 'Bottom-center',
    9: 'Bottom-right'
};

// ============================================================================
// VISION-TO-JSON MODULE
// ============================================================================

export interface VisionJSON {
    meta: {
        image_quality: 'Low' | 'Medium' | 'High';
        image_type: string;
        resolution_estimation: string;
    };
    global_context: {
        scene_description: string;
        time_of_day: string;
        weather_atmosphere: string;
        lighting: {
            source: string;
            direction: string;
            quality: string;
            color_temp: string;
        };
    };
    color_palette: {
        dominant_hex_estimates: HexColor[];
        accent_colors: string[];
        contrast_level: 'High' | 'Low' | 'Medium';
    };
    composition: {
        camera_angle: string;
        framing: string;
        depth_of_field: string;
        focal_point: string;
    };
    objects: VisionObject[];
    text_ocr: {
        present: boolean;
        content: Array<{
            text: string;
            location: string;
            font_style: string;
            legibility: string;
        }>;
    };
    semantic_relationships: string[];
}

export interface VisionObject {
    id: string;
    label: string;
    category: string;
    location: string;
    prominence: 'Foreground' | 'Background';
    visual_attributes: {
        color: string;
        texture: string;
        material: string;
        state: string;
        dimensions_relative: string;
    };
    micro_details: string[];
    pose_or_orientation: string;
    text_content: string | null;
}

// ============================================================================
// REALISTIC-TO-JSON MODULE
// ============================================================================

export interface RealisticJSON {
    meta: {
        intent: string;
        priorities: string[];
    };
    frame: {
        aspect: string;
        composition: string;
        layout: string;
    };
    subject: {
        identity: string;
        demographics: {
            age_range: string;
            gender_presentation: string;
            ethnicity: string;
        };
        face: Record<string, string>;
        hair: Record<string, string>;
        body: {
            build: string;
            posture: string;
            height_impression: string;
        };
        expression: string;
        pose: string;
    };
    wardrobe: WardrobeItem[];
    accessories: AccessoryItem[];
    environment: {
        setting: string;
        surfaces: string[];
        depth: string;
        atmosphere: string;
    };
    lighting: {
        key: string;
        fill: string;
        rim: string;
        shadows: string;
        color_temperature: string;
    };
    camera: {
        lens: string;
        aperture: string;
        focus: string;
        perspective: string;
        distortion: string;
    };
    post_processing: {
        color: string;
        tonality: string;
        texture: string;
        film_qualities: string;
    };
    negative_specifications: string[];
    panel_specifications?: Array<{
        panel_number: number;
        overrides: Record<string, unknown>;
    }>;
}

export interface WardrobeItem {
    garment: string;
    material: string;
    color: string;
    fit: string;
    light_behavior: string;
}

// ============================================================================
// UI STATE TYPES
// ============================================================================

export interface AppState {
    currentModule: ModuleType | null;
    sidebarCollapsed: boolean;
    apiKey: string | null;
    apiKeyValid: boolean;
}

export interface GridModuleState {
    images: Asset[];
    selectedImageId: UUID | null;
    currentIdentity: IdentityJSON | null;
    panels: (PanelJSON | null)[];
    activeTab: 'workspace' | 'panels' | 'batch' | 'prompt_usage' | 'exports';
    workspaceSubTab: 'reference' | 'geometry' | 'markers';
    outputSubTab: 'identity' | 'panel' | 'grid_prompt';
    selectedPanelNumber: PanelNumber;
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
// API KEY & SETTINGS
// ============================================================================

export interface UserSettings {
    apiKey: string;
    apiKeyValidated: boolean;
    theme: 'dark' | 'light';
    defaultConcurrency: number;
    autoRetry: boolean;
}

// ============================================================================
// WORKER MESSAGES
// ============================================================================

export interface WorkerMessage {
    type: 'job_start' | 'job_progress' | 'job_complete' | 'job_error';
    jobId: UUID;
    data?: unknown;
    error?: string;
    progress?: number;
}
