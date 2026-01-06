/**
 * Global State Store using Zustand
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ModuleType, Asset, IdentityJSON, VisionJSON, RealisticJSON } from '../types';

// ============================================================================
// APP STATE
// ============================================================================

interface AppState {
    currentModule: ModuleType | null;
    sidebarCollapsed: boolean;
    apiKey: string | null;
    apiKeyValid: boolean;

    setCurrentModule: (module: ModuleType | null) => void;
    toggleSidebar: () => void;
    setApiKey: (key: string, valid: boolean) => void;
    clearApiKey: () => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set) => ({
            currentModule: null,
            sidebarCollapsed: false,
            apiKey: null,
            apiKeyValid: false,

            setCurrentModule: (module) => set({ currentModule: module }),
            toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
            setApiKey: (key, valid) => set({ apiKey: key, apiKeyValid: valid }),
            clearApiKey: () => set({ apiKey: null, apiKeyValid: false }),
        }),
        {
            name: 'ai-image-platform-app',
            partialize: (state) => ({
                sidebarCollapsed: state.sidebarCollapsed,
                apiKey: state.apiKey,
                apiKeyValid: state.apiKeyValid,
            }),
        }
    )
);

// ============================================================================
// GRID-TO-JSON STATE
// ============================================================================

interface GridState {
    images: Asset[];
    selectedImageId: string | null;
    currentIdentity: IdentityJSON | null;
    panels: (unknown | null)[];
    activeTab: 'workspace' | 'panels' | 'batch' | 'prompt_usage' | 'exports';
    workspaceSubTab: 'reference' | 'geometry' | 'markers';
    outputSubTab: 'identity' | 'panel' | 'grid_prompt';
    selectedPanelNumber: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

    setImages: (images: Asset[]) => void;
    addImage: (image: Asset) => void;
    removeImage: (id: string) => void;
    selectImage: (id: string | null) => void;
    setIdentity: (identity: IdentityJSON | null) => void;
    setActiveTab: (tab: GridState['activeTab']) => void;
    reset: () => void;
}

export const useGridStore = create<GridState>()((set) => ({
    images: [],
    selectedImageId: null,
    currentIdentity: null,
    panels: [null, null, null, null, null, null, null, null, null],
    activeTab: 'workspace',
    workspaceSubTab: 'reference',
    outputSubTab: 'identity',
    selectedPanelNumber: 1,

    setImages: (images) => set({ images }),
    addImage: (image) => set((state) => ({ images: [...state.images, image] })),
    removeImage: (id) => set((state) => ({
        images: state.images.filter(img => img.id !== id),
        selectedImageId: state.selectedImageId === id ? null : state.selectedImageId,
    })),
    selectImage: (id) => set({ selectedImageId: id }),
    setIdentity: (identity) => set({ currentIdentity: identity }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    reset: () => set({
        images: [],
        selectedImageId: null,
        currentIdentity: null,
        panels: [null, null, null, null, null, null, null, null, null],
        activeTab: 'workspace',
    }),
}));

// ============================================================================
// VISION-TO-JSON STATE
// ============================================================================

interface VisionState {
    image: Asset | null;
    result: VisionJSON | null;
    activeTab: 'input' | 'objects' | 'relationships' | 'text_ocr' | 'json_output';
    selectedObjectId: string | null;

    setImage: (image: Asset | null) => void;
    setResult: (result: VisionJSON | null) => void;
    setActiveTab: (tab: VisionState['activeTab']) => void;
    selectObject: (id: string | null) => void;
    reset: () => void;
}

export const useVisionStore = create<VisionState>()((set) => ({
    image: null,
    result: null,
    activeTab: 'input',
    selectedObjectId: null,

    setImage: (image) => set({ image }),
    setResult: (result) => set({ result }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    selectObject: (id) => set({ selectedObjectId: id }),
    reset: () => set({ image: null, result: null, activeTab: 'input', selectedObjectId: null }),
}));

// ============================================================================
// REALISTIC-TO-JSON STATE
// ============================================================================

interface RealisticState {
    mode: 'text' | 'image' | 'hybrid';
    inputText: string;
    inputImage: Asset | null;
    result: RealisticJSON | null;
    activeTab: 'builder' | 'assumptions' | 'json_spec' | 'variations';
    assumptions: string[];

    setMode: (mode: RealisticState['mode']) => void;
    setInputText: (text: string) => void;
    setInputImage: (image: Asset | null) => void;
    setResult: (result: RealisticJSON | null) => void;
    setActiveTab: (tab: RealisticState['activeTab']) => void;
    setAssumptions: (assumptions: string[]) => void;
    reset: () => void;
}

export const useRealisticStore = create<RealisticState>()((set) => ({
    mode: 'text',
    inputText: '',
    inputImage: null,
    result: null,
    activeTab: 'builder',
    assumptions: [],

    setMode: (mode) => set({ mode }),
    setInputText: (text) => set({ inputText: text }),
    setInputImage: (image) => set({ inputImage: image }),
    setResult: (result) => set({ result }),
    setActiveTab: (tab) => set({ activeTab: tab }),
    setAssumptions: (assumptions) => set({ assumptions }),
    reset: () => set({ mode: 'text', inputText: '', inputImage: null, result: null, activeTab: 'builder', assumptions: [] }),
}));
