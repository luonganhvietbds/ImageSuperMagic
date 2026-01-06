import { useState, useEffect } from 'react';
import {
    Brain,
    Plus,
    Check,
    RotateCcw,
    Eye,
    Copy,
    AlertTriangle,
    Loader2,
    Trash2,
    Save
} from 'lucide-react';
import { promptOperations, generateUUID } from '../../db';
import type { PromptVersion, ModuleType } from '../../types';

type TabId = 'grid_to_json' | 'vision_to_json' | 'realistic_to_json';

const DEFAULT_PROMPTS: Record<TabId, { name: string; content: string }> = {
    grid_to_json: {
        name: 'Grid-to-JSON Identity Cloning',
        content: `ROLE & OBJECTIVE

You are GridClone, an advanced Portrait Analysis & Multi-Angle Replication Engine. Your sole purpose is to ingest a single reference portrait, extract every possible visual detail about the subject, and output a rigorous JSON specification that enables EXACT recreation of this person from 9 DIFFERENT camera angles in a 3×3 grid.

CORE DIRECTIVE
The reference image is TRUTH. You must capture 100% of the visual identity data. If a detail exists in pixels, it must exist in your JSON output. Your goal is to create a JSON so precise that when pasted into a new generation session WITHOUT the original image, the AI recreates the EXACT same person—not similar, SAME.

CRITICAL: The 3x3 grid must show 9 DIFFERENT CAMERA ANGLES of the SAME person. Not 9 copies of the same angle. Each panel = different perspective.`
    },
    vision_to_json: {
        name: 'Vision-to-JSON Visual Sweep',
        content: `ROLE & OBJECTIVE

You are VisionStruct, an advanced Visual Analysis Engine. Your purpose is to perform a comprehensive multi-pass sweep of any image and output a structured JSON specification capturing all visual data.

ANALYSIS SWEEPS:
1. Macro Sweep - Identify main subjects, scene context, and composition
2. Micro Sweep - Capture textures, materials, fine details
3. Relationship Sweep - Map spatial and semantic connections between objects

OUTPUT FORMAT:
Complete structured JSON with meta, objects, relationships, and detected text.`
    },
    realistic_to_json: {
        name: 'Realistic-to-JSON Visual Architect',
        content: `ROLE & OBJECTIVE

You are Visual Prompt Architect, a system that transforms minimal input into comprehensive image generation specifications. Your goal is to fill gaps with intelligent defaults based on genre-specific inference rules.

INFERENCE RULES:
- Fashion/Editorial: 85mm lens, f/2.8, controlled studio lighting
- Street/Documentary: 35mm lens, f/8, natural ambient light
- Portrait: 85mm lens, f/2, flattering soft light
- No age given: Default to 25-30
- No expression given: Neutral with eye contact

OUTPUT: Complete JSON specification with subject, wardrobe, lighting, camera settings, and declared assumptions.`
    }
};

export default function PromptBrain() {
    const [activeTab, setActiveTab] = useState<TabId>('grid_to_json');
    const [prompts, setPrompts] = useState<PromptVersion[]>([]);
    const [selectedVersion, setSelectedVersion] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editContent, setEditContent] = useState('');
    const [editName, setEditName] = useState('');
    const [copied, setCopied] = useState(false);

    const loadPrompts = async () => {
        setLoading(true);
        try {
            const all = await promptOperations.getByModule(activeTab as ModuleType);

            // If no prompts exist for this module, create default
            if (all.length === 0) {
                const defaultPrompt = DEFAULT_PROMPTS[activeTab];
                const newPrompt: PromptVersion = {
                    id: generateUUID(),
                    module: activeTab as ModuleType,
                    version: '1.0.0',
                    name: defaultPrompt.name,
                    content: defaultPrompt.content,
                    isActive: true,
                    createdAt: Date.now(),
                    updatedAt: Date.now()
                };
                await promptOperations.create(newPrompt);
                setPrompts([newPrompt]);
                setSelectedVersion(newPrompt.version);
                setEditContent(newPrompt.content);
                setEditName(newPrompt.name);
            } else {
                setPrompts(all);
                const active = all.find(p => p.isActive) || all[0];
                setSelectedVersion(active.version);
                setEditContent(active.content);
                setEditName(active.name);
            }
        } catch (error) {
            console.error('Failed to load prompts:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPrompts();
    }, [activeTab]);

    const selectedPrompt = prompts.find(p => p.version === selectedVersion);

    const handleSelectVersion = (version: string) => {
        setSelectedVersion(version);
        const prompt = prompts.find(p => p.version === version);
        if (prompt) {
            setEditContent(prompt.content);
            setEditName(prompt.name);
        }
    };

    const handleSave = async () => {
        if (!selectedPrompt) return;
        setSaving(true);
        try {
            await promptOperations.update(selectedPrompt.id, {
                name: editName,
                content: editContent,
                updatedAt: Date.now()
            });
            await loadPrompts();
        } finally {
            setSaving(false);
        }
    };

    const handleActivate = async () => {
        if (!selectedPrompt) return;
        try {
            await promptOperations.activate(selectedPrompt.id);
            await loadPrompts();
        } catch (error) {
            console.error('Failed to activate:', error);
        }
    };

    const handleCreateNew = async () => {
        const versions = prompts.map(p => p.version);
        const lastVersion = versions.sort().pop() || '0.0.0';
        const parts = lastVersion.split('.').map(Number);
        parts[1] += 1;
        const newVersion = parts.join('.');

        const newPrompt: PromptVersion = {
            id: generateUUID(),
            module: activeTab as ModuleType,
            version: newVersion,
            name: `${DEFAULT_PROMPTS[activeTab].name} (New)`,
            content: selectedPrompt?.content || DEFAULT_PROMPTS[activeTab].content,
            isActive: false,
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        await promptOperations.create(newPrompt);
        await loadPrompts();
        setSelectedVersion(newVersion);
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(editContent);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDelete = async () => {
        if (!selectedPrompt || selectedPrompt.isActive) return;
        await promptOperations.delete(selectedPrompt.id);
        await loadPrompts();
    };

    const tabs = [
        { id: 'grid_to_json' as TabId, label: 'Grid-to-JSON' },
        { id: 'vision_to_json' as TabId, label: 'Vision-to-JSON' },
        { id: 'realistic_to_json' as TabId, label: 'Realistic-to-JSON' },
    ];

    return (
        <div className="prompt-brain-page fade-in">
            {/* Warning Banner */}
            <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: 'var(--radius-md)',
                padding: 'var(--spacing-md)',
                marginBottom: 'var(--spacing-lg)',
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-md)'
            }}>
                <AlertTriangle size={20} style={{ color: 'var(--color-warning)' }} />
                <div style={{ fontSize: '14px' }}>
                    <strong>Admin Area:</strong> Changes to prompts affect all future jobs. Jobs in progress use their snapshotted prompt version.
                </div>
            </div>

            <div className="tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <Brain size={16} style={{ marginRight: 'var(--spacing-xs)' }} />
                        {tab.label}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-muted)' }}>
                    <Loader2 size={32} className="spin" />
                </div>
            ) : (
                <div className="grid grid-2" style={{ gridTemplateColumns: '280px 1fr' }}>
                    {/* Version List */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Versions</h3>
                            <button
                                className="btn btn-primary"
                                style={{ padding: '4px 8px', fontSize: '12px' }}
                                onClick={handleCreateNew}
                            >
                                <Plus size={14} /> New
                            </button>
                        </div>
                        <div className="card-body" style={{ padding: 0 }}>
                            {prompts.map(prompt => (
                                <div
                                    key={prompt.version}
                                    onClick={() => handleSelectVersion(prompt.version)}
                                    style={{
                                        padding: 'var(--spacing-md)',
                                        borderBottom: '1px solid var(--color-border)',
                                        cursor: 'pointer',
                                        background: selectedVersion === prompt.version ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 4 }}>
                                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{prompt.version}</span>
                                        {prompt.isActive && <span className="badge badge-success">Active</span>}
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>{prompt.name}</div>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: 4 }}>
                                        {new Date(prompt.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Prompt Editor */}
                    <div className="card">
                        <div className="card-header">
                            <div style={{ flex: 1 }}>
                                <input
                                    className="input"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    style={{ fontWeight: 600, fontSize: '16px', marginBottom: 4 }}
                                />
                                <span style={{
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '13px',
                                    color: 'var(--color-text-muted)'
                                }}>
                                    v{selectedVersion}
                                </span>
                            </div>
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                <button className="btn btn-ghost" onClick={handleCopy}>
                                    {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied!' : 'Copy'}
                                </button>
                                <button
                                    className="btn btn-primary"
                                    onClick={handleSave}
                                    disabled={saving}
                                >
                                    {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />} Save
                                </button>
                                {!selectedPrompt?.isActive && (
                                    <>
                                        <button className="btn btn-success" onClick={handleActivate}>
                                            <Check size={16} /> Activate
                                        </button>
                                        <button className="btn btn-ghost" onClick={handleDelete}>
                                            <Trash2 size={16} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="card-body">
                            <textarea
                                className="input"
                                value={editContent}
                                onChange={(e) => setEditContent(e.target.value)}
                                style={{
                                    height: 400,
                                    fontFamily: 'var(--font-mono)',
                                    fontSize: '13px',
                                    lineHeight: '1.6',
                                    resize: 'vertical'
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
                .spin {
                    animation: spin 1s linear infinite;
                }
            `}</style>
        </div>
    );
}
