/**
 * AI Service - Gemini API Integration
 * BYOK (Bring Your Own Key) Model
 * With retry logic, exponential backoff, and model fallback
 */

import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import type { IdentityJSON, VisionJSON, RealisticJSON } from '../types';

// Model configuration with fallback chain
const MODEL_CHAIN = [
    'gemini-2.5-pro',           // Primary: Best quality
    'gemini-2.5-flash',         // Fallback 1: Fast but good
    'gemini-2.0-flash-exp',     // Fallback 2: Experimental
    'gemini-1.5-pro',           // Fallback 3: Stable
];

// Retry configuration
const RETRY_CONFIG = {
    maxRetries: 3,
    baseDelayMs: 1000,
    maxDelayMs: 30000,
    backoffMultiplier: 2,
};

// Rate limiting configuration
const RATE_LIMIT = {
    minDelayBetweenCallsMs: 500,  // Minimum 500ms between calls
    lastCallTime: 0,
};

let geminiInstance: GoogleGenerativeAI | null = null;
let primaryModel: GenerativeModel | null = null;
let fallbackModels: GenerativeModel[] = [];
let currentModelIndex = 0;

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff and jitter
 */
function calculateBackoffDelay(attempt: number): number {
    const baseDelay = RETRY_CONFIG.baseDelayMs * Math.pow(RETRY_CONFIG.backoffMultiplier, attempt);
    const jitter = Math.random() * 0.3 * baseDelay; // 0-30% jitter
    return Math.min(baseDelay + jitter, RETRY_CONFIG.maxDelayMs);
}

/**
 * Rate limit enforcement - wait if calling too fast
 */
async function enforceRateLimit(): Promise<void> {
    const now = Date.now();
    const timeSinceLastCall = now - RATE_LIMIT.lastCallTime;

    if (timeSinceLastCall < RATE_LIMIT.minDelayBetweenCallsMs) {
        await sleep(RATE_LIMIT.minDelayBetweenCallsMs - timeSinceLastCall);
    }

    RATE_LIMIT.lastCallTime = Date.now();
}

/**
 * Check if error is retryable (503, 429, network errors)
 */
function isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        return (
            message.includes('503') ||
            message.includes('overloaded') ||
            message.includes('429') ||
            message.includes('rate limit') ||
            message.includes('quota') ||
            message.includes('resource exhausted') ||
            message.includes('temporarily unavailable') ||
            message.includes('network') ||
            message.includes('timeout')
        );
    }
    return false;
}

/**
 * Get the next model in the fallback chain
 */
function getNextModel(): GenerativeModel | null {
    if (currentModelIndex < fallbackModels.length) {
        currentModelIndex++;
        console.log(`🔄 Switching to fallback model: ${MODEL_CHAIN[currentModelIndex]}`);
        return fallbackModels[currentModelIndex - 1];
    }
    return null;
}

/**
 * Reset to primary model
 */
function resetToMainModel(): void {
    currentModelIndex = 0;
}

/**
 * Initialize Gemini with user's API key
 */
export async function initializeGemini(apiKey: string): Promise<boolean> {
    try {
        geminiInstance = new GoogleGenerativeAI(apiKey);

        // Initialize all models in the chain
        primaryModel = geminiInstance.getGenerativeModel({ model: MODEL_CHAIN[0] });
        fallbackModels = MODEL_CHAIN.slice(1).map(modelName =>
            geminiInstance!.getGenerativeModel({ model: modelName })
        );

        currentModelIndex = 0;

        // Validate with retry logic
        let validated = false;
        for (let i = 0; i < MODEL_CHAIN.length && !validated; i++) {
            try {
                const testModel = i === 0 ? primaryModel : fallbackModels[i - 1];
                console.log(`🔍 Validating model: ${MODEL_CHAIN[i]}...`);

                await enforceRateLimit();
                const result = await testModel.generateContent('Say "OK" if you can hear me.');
                const response = await result.response;
                const text = response.text();

                if (text.toLowerCase().includes('ok')) {
                    validated = true;
                    currentModelIndex = i;
                    console.log(`✅ Using model: ${MODEL_CHAIN[i]}`);
                }
            } catch (err) {
                console.warn(`⚠️ Model ${MODEL_CHAIN[i]} validation failed, trying next...`);
                await sleep(1000);
            }
        }

        return validated;
    } catch (error) {
        console.error('Failed to initialize Gemini:', error);
        geminiInstance = null;
        primaryModel = null;
        fallbackModels = [];
        return false;
    }
}

/**
 * Check if Gemini is initialized
 */
export function isInitialized(): boolean {
    return primaryModel !== null;
}

/**
 * Get current active model
 */
function getCurrentModel(): GenerativeModel {
    if (!primaryModel) {
        throw new Error('Gemini not initialized. Please provide an API key first.');
    }

    if (currentModelIndex === 0) {
        return primaryModel;
    }

    return fallbackModels[currentModelIndex - 1] || primaryModel;
}

/**
 * Execute API call with retry logic and model fallback
 */
async function executeWithRetry<T>(
    operation: (model: GenerativeModel) => Promise<T>,
    operationName: string
): Promise<T> {
    let lastError: Error | null = null;
    let totalAttempts = 0;

    // Try with current model and fallbacks
    for (let modelAttempt = 0; modelAttempt <= fallbackModels.length; modelAttempt++) {
        const currentModel = getCurrentModel();

        // Retry loop for current model
        for (let retry = 0; retry < RETRY_CONFIG.maxRetries; retry++) {
            totalAttempts++;

            try {
                await enforceRateLimit();
                console.log(`📡 ${operationName} (Model: ${MODEL_CHAIN[currentModelIndex]}, Attempt: ${retry + 1}/${RETRY_CONFIG.maxRetries})`);

                const result = await operation(currentModel);

                // Success - reset to primary model for next call (if we had fallen back)
                if (currentModelIndex > 0) {
                    console.log(`✅ Success with fallback model. Will try primary next time.`);
                }

                return result;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                console.warn(`❌ ${operationName} failed:`, lastError.message);

                if (isRetryableError(error)) {
                    const delay = calculateBackoffDelay(retry);
                    console.log(`⏳ Retrying in ${Math.round(delay / 1000)}s...`);
                    await sleep(delay);
                } else {
                    // Non-retryable error, throw immediately
                    throw lastError;
                }
            }
        }

        // All retries exhausted for current model, try next model
        const nextModel = getNextModel();
        if (!nextModel) {
            break;
        }

        console.log(`🔄 Switching to next model in chain...`);
        await sleep(2000); // Wait before trying new model
    }

    // All models and retries exhausted
    resetToMainModel();
    throw new Error(`${operationName} failed after ${totalAttempts} total attempts across ${currentModelIndex + 1} models. Last error: ${lastError?.message}`);
}

/**
 * Generate content with image - with retry
 */
async function generateWithImage(
    systemPrompt: string,
    imageBase64: string,
    mimeType: string
): Promise<string> {
    return executeWithRetry(async (model) => {
        const result = await model.generateContent([
            systemPrompt,
            {
                inlineData: {
                    data: imageBase64,
                    mimeType: mimeType,
                },
            },
        ]);

        const response = await result.response;
        return response.text();
    }, 'generateWithImage');
}

/**
 * Generate content with text - with retry
 */
async function generateWithText(systemPrompt: string, userInput: string): Promise<string> {
    return executeWithRetry(async (model) => {
        const result = await model.generateContent([
            systemPrompt,
            userInput,
        ]);

        const response = await result.response;
        return response.text();
    }, 'generateWithText');
}

/**
 * Extract JSON from response text
 */
function extractJson<T>(text: string): T {
    const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (codeBlockMatch) {
        return JSON.parse(codeBlockMatch[1].trim());
    }

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
    }

    throw new Error('No valid JSON found in response');
}

// Grid-to-JSON
export async function analyzeIdentity(
    imageBase64: string,
    mimeType: string,
    systemPrompt: string
): Promise<IdentityJSON> {
    const response = await generateWithImage(systemPrompt, imageBase64, mimeType);
    return extractJson<IdentityJSON>(response);
}

export async function generatePanelSpec(
    identity: IdentityJSON,
    panelNumber: number,
    systemPrompt: string
): Promise<object> {
    const userInput = `Generate panel specification for Panel ${panelNumber}:\n${JSON.stringify(identity, null, 2)}`;
    const response = await generateWithText(systemPrompt, userInput);
    return extractJson<object>(response);
}

// Vision-to-JSON
export async function visualSweep(
    imageBase64: string,
    mimeType: string,
    systemPrompt: string
): Promise<VisionJSON> {
    const response = await generateWithImage(systemPrompt, imageBase64, mimeType);
    return extractJson<VisionJSON>(response);
}

// Realistic-to-JSON
export async function generateSpecFromText(
    textInput: string,
    systemPrompt: string
): Promise<RealisticJSON> {
    const response = await generateWithText(systemPrompt, `Transform into visual spec:\n${textInput}`);
    return extractJson<RealisticJSON>(response);
}

export async function generateSpecFromImage(
    imageBase64: string,
    mimeType: string,
    systemPrompt: string
): Promise<RealisticJSON> {
    const response = await generateWithImage(systemPrompt, imageBase64, mimeType);
    return extractJson<RealisticJSON>(response);
}

export async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve({ base64, mimeType: file.type });
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

/**
 * Get current model info for UI display
 */
export function getCurrentModelInfo(): { name: string; index: number; total: number } {
    return {
        name: MODEL_CHAIN[currentModelIndex] || 'unknown',
        index: currentModelIndex,
        total: MODEL_CHAIN.length,
    };
}

export default {
    initializeGemini,
    isInitialized,
    analyzeIdentity,
    generatePanelSpec,
    visualSweep,
    generateSpecFromText,
    generateSpecFromImage,
    fileToBase64,
    getCurrentModelInfo,
};
