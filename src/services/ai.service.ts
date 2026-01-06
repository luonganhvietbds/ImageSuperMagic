/**
 * AI Service - Gemini API Integration
 * BYOK (Bring Your Own Key) Model
 */

import { GoogleGenerativeAI, type GenerativeModel } from '@google/generative-ai';
import type { IdentityJSON, VisionJSON, RealisticJSON } from '../types';

let geminiInstance: GoogleGenerativeAI | null = null;
let model: GenerativeModel | null = null;

/**
 * Initialize Gemini with user's API key
 */
export async function initializeGemini(apiKey: string): Promise<boolean> {
    try {
        geminiInstance = new GoogleGenerativeAI(apiKey);
        model = geminiInstance.getGenerativeModel({ model: 'gemini-2.5-pro' });

        // Validate by making a simple request
        const result = await model.generateContent('Say "OK" if you can hear me.');
        const response = await result.response;
        const text = response.text();

        return text.toLowerCase().includes('ok');
    } catch (error) {
        console.error('Failed to initialize Gemini:', error);
        geminiInstance = null;
        model = null;
        return false;
    }
}

/**
 * Check if Gemini is initialized
 */
export function isInitialized(): boolean {
    return model !== null;
}

function getModel(): GenerativeModel {
    if (!model) {
        throw new Error('Gemini not initialized. Please provide an API key first.');
    }
    return model;
}

async function generateWithImage(
    systemPrompt: string,
    imageBase64: string,
    mimeType: string
): Promise<string> {
    const currentModel = getModel();

    const result = await currentModel.generateContent([
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
}

async function generateWithText(systemPrompt: string, userInput: string): Promise<string> {
    const currentModel = getModel();

    const result = await currentModel.generateContent([
        systemPrompt,
        userInput,
    ]);

    const response = await result.response;
    return response.text();
}

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

export default {
    initializeGemini,
    isInitialized,
    analyzeIdentity,
    generatePanelSpec,
    visualSweep,
    generateSpecFromText,
    generateSpecFromImage,
    fileToBase64,
};
