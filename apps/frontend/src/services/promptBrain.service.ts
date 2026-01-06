/**
 * Prompt Brain Service
 */

import { promptOperations, generateUUID } from '../db';
import type { PromptVersion, ModuleType, UUID } from '../types';

const DEFAULT_PROMPTS: Record<ModuleType, Omit<PromptVersion, 'id' | 'createdAt'>> = {
    grid_to_json: {
        module: 'grid_to_json',
        version: '1.0.0',
        name: 'Grid-to-JSON Identity Cloning',
        schemaVersion: 'grid_to_json_v1',
        isActive: true,
        createdBy: 'system',
        systemPrompt: `You are GridClone, an advanced Portrait Analysis & Multi-Angle Replication Engine. Your sole purpose is to ingest a single reference portrait, extract every possible visual detail about the subject, and output a rigorous JSON specification that enables EXACT recreation of this person from 9 DIFFERENT camera angles in a 3×3 grid.

CORE DIRECTIVE: The reference image is TRUTH. Capture 100% of the visual identity data.

ANALYSIS PROTOCOL:
1. Face Geometry Sweep: Measure proportions
2. Unique Marker Sweep: Find moles, freckles, scars, asymmetries
3. Color Extraction Sweep: Exact skin tone, hair color, eye color
4. Texture Sweep: Skin, hair, fabric textures
5. Style Sweep: Hair styling, makeup, grooming
6. Outfit Sweep: Every garment detail

OUTPUT: Valid JSON with identity_blueprint, hair, outfit, accessories, generation_settings (including grid_generation_prompt).`,
    },
    vision_to_json: {
        module: 'vision_to_json',
        version: '1.0.0',
        name: 'Vision-to-JSON Visual Sweep',
        schemaVersion: 'vision_to_json_v1',
        isActive: true,
        createdBy: 'system',
        systemPrompt: `You are VisionStruct, an advanced Computer Vision & Data Serialization Engine. Transcode every discernible visual element into machine-readable JSON.

CORE DIRECTIVE: Do not summarize. Capture 100% of visual data.

ANALYSIS PROTOCOL:
1. Macro Sweep: Scene type, lighting, atmosphere, primary subjects
2. Micro Sweep: Textures, imperfections, reflections, shadow gradients, text (OCR)
3. Relationship Sweep: Spatial and semantic connections between objects

OUTPUT: JSON with meta, global_context, color_palette, composition, objects, text_ocr, semantic_relationships.`,
    },
    realistic_to_json: {
        module: 'realistic_to_json',
        version: '1.0.0',
        name: 'Realistic-to-JSON Visual Architect',
        schemaVersion: 'realistic_to_json_v1',
        isActive: true,
        createdBy: 'system',
        systemPrompt: `You are a Visual Prompt Architect. Transform minimal input (text, images, or both) into comprehensive JSON visual specifications.

EXPERTISE: Photography, cinematography, lighting, composition, fashion, human anatomy, material properties, color theory.

MODES:
• Text → Spec: Extract explicit info, infer gaps, generate complete JSON
• Image → Spec: Reverse-engineer all visual elements
• Hybrid: Analyze image as base, apply text modifications

OUTPUT: Complete JSON covering meta, frame, subject, wardrobe, accessories, environment, lighting, camera, post_processing, negative_specifications.`,
    },
};

export async function initializeDefaultPrompts(): Promise<void> {
    for (const [module, promptData] of Object.entries(DEFAULT_PROMPTS)) {
        const existing = await promptOperations.getActive(module as ModuleType);
        if (!existing) {
            const prompt: PromptVersion = {
                id: generateUUID(),
                ...promptData,
                createdAt: Date.now(),
            };
            await promptOperations.create(prompt);
        }
    }
}

export async function getActivePrompt(module: ModuleType): Promise<PromptVersion | null> {
    const prompt = await promptOperations.getActive(module);
    return prompt || null;
}

export async function getPromptVersions(module: ModuleType): Promise<PromptVersion[]> {
    return await promptOperations.getByModule(module);
}

export async function createPromptVersion(
    module: ModuleType,
    version: string,
    name: string,
    systemPrompt: string
): Promise<PromptVersion> {
    const prompt: PromptVersion = {
        id: generateUUID(),
        module,
        version,
        name,
        systemPrompt,
        schemaVersion: `${module}_v1`,
        isActive: false,
        createdAt: Date.now(),
        createdBy: 'user',
    };
    await promptOperations.create(prompt);
    return prompt;
}

export async function activatePromptVersion(id: UUID): Promise<void> {
    await promptOperations.activate(id);
}

export default {
    initializeDefaultPrompts,
    getActivePrompt,
    getPromptVersions,
    createPromptVersion,
    activatePromptVersion,
};
