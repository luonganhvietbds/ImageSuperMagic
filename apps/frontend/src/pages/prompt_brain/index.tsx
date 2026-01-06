import { useState } from 'react';
import {
    Brain,
    Plus,
    Check,
    RotateCcw,
    Eye,
    Copy,
    AlertTriangle
} from 'lucide-react';

type TabId = 'grid_to_json' | 'vision_to_json' | 'realistic_to_json';

interface PromptVersion {
    version: string;
    name: string;
    isActive: boolean;
    createdAt: string;
}

const mockPrompts: Record<TabId, PromptVersion[]> = {
    grid_to_json: [
        { version: '1.0.0', name: 'Grid-to-JSON Identity Cloning', isActive: true, createdAt: '2024-01-01' },
        { version: '0.9.0', name: 'Beta version', isActive: false, createdAt: '2023-12-15' },
    ],
    vision_to_json: [
        { version: '1.0.0', name: 'Vision-to-JSON Visual Sweep', isActive: true, createdAt: '2024-01-01' },
    ],
    realistic_to_json: [
        { version: '1.0.0', name: 'Realistic-to-JSON Visual Architect', isActive: true, createdAt: '2024-01-01' },
    ],
};

const mockPromptContent = `ROLE & OBJECTIVE

You are GridClone, an advanced Portrait Analysis & Multi-Angle Replication Engine. Your sole purpose is to ingest a single reference portrait, extract every possible visual detail about the subject, and output a rigorous JSON specification that enables EXACT recreation of this person from 9 DIFFERENT camera angles in a 3×3 grid.

CORE DIRECTIVE
The reference image is TRUTH. You must capture 100% of the visual identity data. If a detail exists in pixels, it must exist in your JSON output. Your goal is to create a JSON so precise that when pasted into a new generation session WITHOUT the original image, the AI recreates the EXACT same person—not similar, SAME.

You are not describing a person. You are creating a biometric blueprint for perfect cloning.

CRITICAL: The 3x3 grid must show 9 DIFFERENT CAMERA ANGLES of the SAME person. Not 9 copies of the same angle. Each panel = different perspective.

...`;

export default function PromptBrain() {
    const [activeTab, setActiveTab] = useState<TabId>('grid_to_json');
    const [selectedVersion, setSelectedVersion] = useState<string>('1.0.0');

    const tabs = [
        { id: 'grid_to_json' as TabId, label: 'Grid-to-JSON' },
        { id: 'vision_to_json' as TabId, label: 'Vision-to-JSON' },
        { id: 'realistic_to_json' as TabId, label: 'Realistic-to-JSON' },
    ];

    const currentPrompts = mockPrompts[activeTab];
    const activePrompt = currentPrompts.find(p => p.version === selectedVersion);

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
                        onClick={() => {
                            setActiveTab(tab.id);
                            setSelectedVersion(mockPrompts[tab.id][0]?.version || '');
                        }}
                    >
                        <Brain size={16} style={{ marginRight: 'var(--spacing-xs)' }} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-2" style={{ gridTemplateColumns: '280px 1fr' }}>
                {/* Version List */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Versions</h3>
                        <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '12px' }}>
                            <Plus size={14} /> New
                        </button>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {currentPrompts.map(prompt => (
                            <div
                                key={prompt.version}
                                onClick={() => setSelectedVersion(prompt.version)}
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
                                <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginTop: 4 }}>{prompt.createdAt}</div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Prompt Editor */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">
                            {activePrompt?.name}
                            <span style={{
                                fontFamily: 'var(--font-mono)',
                                fontSize: '14px',
                                color: 'var(--color-text-muted)',
                                marginLeft: 'var(--spacing-sm)'
                            }}>
                                {selectedVersion}
                            </span>
                        </h3>
                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                            <button className="btn btn-ghost">
                                <Eye size={16} /> Diff
                            </button>
                            <button className="btn btn-ghost">
                                <Copy size={16} /> Clone
                            </button>
                            {!activePrompt?.isActive && (
                                <>
                                    <button className="btn btn-primary">
                                        <Check size={16} /> Activate
                                    </button>
                                    <button className="btn btn-secondary">
                                        <RotateCcw size={16} /> Rollback
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="json-editor" style={{ maxHeight: 500 }}>
                            <pre style={{ whiteSpace: 'pre-wrap' }}>{mockPromptContent}</pre>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
