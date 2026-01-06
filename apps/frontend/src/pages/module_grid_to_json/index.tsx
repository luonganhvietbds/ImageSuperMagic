import { useState, useCallback } from 'react';
import {
    Upload,
    Image as ImageIcon,
    Play,
    Trash2,
    Copy,
    Download,
    Eye,
    Grid3X3,
    Layers,
    FileJson,
    Sparkles,
    RefreshCw,
    ChevronRight
} from 'lucide-react';

type TabId = 'workspace' | 'panels' | 'batch' | 'prompt_usage' | 'exports';
type WorkspaceSubTab = 'reference' | 'geometry' | 'markers';
type OutputSubTab = 'identity' | 'panel' | 'grid_prompt';
type PanelNumber = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

const PANEL_ANGLES: Record<PanelNumber, string> = {
    1: 'High Angle',
    2: 'Low Angle',
    3: 'Eye-Level',
    4: 'Dutch Angle',
    5: 'Close-Up Low',
    6: 'Over-Shoulder',
    7: 'Profile',
    8: '45-Degree',
    9: "Bird's Eye"
};

interface UploadedImage {
    id: string;
    filename: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    confidence?: number;
    thumbnail?: string;
}

export default function GridToJson() {
    const [activeTab, setActiveTab] = useState<TabId>('workspace');
    const [workspaceSubTab, setWorkspaceSubTab] = useState<WorkspaceSubTab>('reference');
    const [outputSubTab, setOutputSubTab] = useState<OutputSubTab>('identity');
    const [selectedPanelNumber, setSelectedPanelNumber] = useState<PanelNumber>(1);
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const tabs = [
        { id: 'workspace' as TabId, label: 'Workspace' },
        { id: 'panels' as TabId, label: 'Panels' },
        { id: 'batch' as TabId, label: 'Batch' },
        { id: 'prompt_usage' as TabId, label: 'Prompt Usage' },
        { id: 'exports' as TabId, label: 'Exports' },
    ];

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
        const newImages: UploadedImage[] = files.map((file, i) => ({
            id: `img-${Date.now()}-${i}`,
            filename: file.name,
            status: 'pending' as const,
        }));
        setImages(prev => [...prev, ...newImages]);
        if (newImages.length > 0 && !selectedImageId) {
            setSelectedImageId(newImages[0].id);
        }
    }, [selectedImageId]);

    const handleAnalyze = () => {
        if (!selectedImageId) return;
        setImages(prev => prev.map(img =>
            img.id === selectedImageId ? { ...img, status: 'running' as const } : img
        ));
        // Simulate analysis completion
        setTimeout(() => {
            setImages(prev => prev.map(img =>
                img.id === selectedImageId ? { ...img, status: 'completed' as const, confidence: 94 } : img
            ));
        }, 2000);
    };

    const mockIdentityJson = {
        meta: {
            source_image_quality: "High",
            extraction_confidence: "94%",
            critical_identity_markers: "Oval face, hazel eyes, mole on left cheek"
        },
        identity_blueprint: {
            face_geometry: {
                face_shape: "Oval with soft jawline",
                forehead: { height: "Medium", shape: "Slightly rounded" },
                eye_area: { eye_shape: "Almond", eye_color: "#6B8E4E (Hazel-green)" }
            }
        },
        "...": "More data would appear here"
    };

    return (
        <div className="grid-to-json-page fade-in">
            {/* Tabs */}
            <div className="tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Workspace Tab */}
            {activeTab === 'workspace' && (
                <div className="three-column-layout">
                    {/* LEFT COLUMN - Image Input & Queue */}
                    <div className="column">
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Image Input</h3>
                            </div>
                            <div className="card-body">
                                {/* Upload Area */}
                                <div
                                    className={`upload-area ${dragOver ? 'dragover' : ''}`}
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                >
                                    <Upload size={32} style={{ color: 'var(--color-accent-primary)', marginBottom: 'var(--spacing-md)' }} />
                                    <div style={{ fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>Drop images here</div>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>or click to browse</div>
                                </div>

                                {/* Image Queue */}
                                {images.length > 0 && (
                                    <div style={{ marginTop: 'var(--spacing-lg)' }}>
                                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-sm)', textTransform: 'uppercase' }}>
                                            Queue ({images.length})
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                            {images.map(img => (
                                                <div
                                                    key={img.id}
                                                    onClick={() => setSelectedImageId(img.id)}
                                                    style={{
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 'var(--spacing-sm)',
                                                        padding: 'var(--spacing-sm)',
                                                        background: selectedImageId === img.id ? 'rgba(99, 102, 241, 0.15)' : 'var(--color-bg-tertiary)',
                                                        borderRadius: 'var(--radius-md)',
                                                        cursor: 'pointer',
                                                        border: selectedImageId === img.id ? '1px solid var(--color-accent-primary)' : '1px solid transparent'
                                                    }}
                                                >
                                                    <div style={{
                                                        width: 40,
                                                        height: 40,
                                                        background: 'var(--color-bg-secondary)',
                                                        borderRadius: 'var(--radius-sm)',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center'
                                                    }}>
                                                        <ImageIcon size={20} style={{ color: 'var(--color-text-muted)' }} />
                                                    </div>
                                                    <div style={{ flex: 1, minWidth: 0 }}>
                                                        <div style={{ fontSize: '13px', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {img.filename}
                                                        </div>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xs)' }}>
                                                            <span className={`status-indicator ${img.status}`}></span>
                                                            <span style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                                                {img.status === 'completed' && img.confidence ? `${img.confidence}% confidence` : img.status}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <button className="btn btn-ghost btn-icon" style={{ padding: 4 }}>
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Actions */}
                                <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleAnalyze} disabled={!selectedImageId}>
                                        <Play size={16} /> Analyze Selected
                                    </button>
                                    <button className="btn btn-secondary" disabled={images.length === 0}>
                                        <Sparkles size={16} /> Analyze All
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CENTER COLUMN - Identity Analysis + Panel Grid */}
                    <div className="column">
                        {/* Identity Analysis Card */}
                        <div className="card" style={{ flex: '0 0 auto' }}>
                            <div className="card-header">
                                <h3 className="card-title">Identity Analysis</h3>
                                <div className="tabs" style={{ border: 'none', marginBottom: 0 }}>
                                    {(['reference', 'geometry', 'markers'] as WorkspaceSubTab[]).map(tab => (
                                        <button
                                            key={tab}
                                            className={`tab ${workspaceSubTab === tab ? 'active' : ''}`}
                                            onClick={() => setWorkspaceSubTab(tab)}
                                            style={{ padding: 'var(--spacing-sm) var(--spacing-md)' }}
                                        >
                                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="card-body">
                                {workspaceSubTab === 'reference' && (
                                    <div style={{
                                        height: 200,
                                        background: 'var(--color-bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'var(--color-text-muted)'
                                    }}>
                                        {selectedImageId ? 'Portrait Viewer' : 'Select an image to analyze'}
                                    </div>
                                )}
                                {workspaceSubTab === 'geometry' && (
                                    <div style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                                            <div><strong>Face Shape:</strong> Oval</div>
                                            <div><strong>Eye Spacing:</strong> Average</div>
                                            <div><strong>Nose Length:</strong> Medium</div>
                                            <div><strong>Jaw Angle:</strong> Soft</div>
                                        </div>
                                    </div>
                                )}
                                {workspaceSubTab === 'markers' && (
                                    <div style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>• Mole on left cheek (2cm from nose)</div>
                                        <div style={{ marginBottom: 'var(--spacing-sm)' }}>• Light freckles on nose bridge</div>
                                        <div>• Slight asymmetry in eyebrows</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3x3 Panel Grid */}
                        <div className="card" style={{ flex: 1 }}>
                            <div className="card-header">
                                <h3 className="card-title">3×3 Panel Grid</h3>
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '4px 8px' }}>
                                        <Grid3X3 size={14} /> Generate All
                                    </button>
                                </div>
                            </div>
                            <div className="card-body">
                                <div className="panel-grid">
                                    {([1, 2, 3, 4, 5, 6, 7, 8, 9] as PanelNumber[]).map(num => (
                                        <div
                                            key={num}
                                            className="panel-card"
                                            onClick={() => setSelectedPanelNumber(num)}
                                            style={{
                                                border: selectedPanelNumber === num ? '2px solid var(--color-accent-primary)' : undefined
                                            }}
                                        >
                                            <div className="panel-number">{num}</div>
                                            <div className="panel-label">{PANEL_ANGLES[num]}</div>
                                            <div style={{ display: 'flex', gap: 4, marginTop: 'var(--spacing-xs)' }}>
                                                <button className="btn btn-ghost" style={{ padding: 4, fontSize: 10 }} title="Generate">
                                                    <Play size={12} />
                                                </button>
                                                <button className="btn btn-ghost" style={{ padding: 4, fontSize: 10 }} title="View JSON">
                                                    <FileJson size={12} />
                                                </button>
                                                <button className="btn btn-ghost" style={{ padding: 4, fontSize: 10 }} title="Copy Prompt">
                                                    <Copy size={12} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT COLUMN - Output Inspector */}
                    <div className="column">
                        <div className="card" style={{ flex: 1 }}>
                            <div className="card-header">
                                <h3 className="card-title">Output Inspector</h3>
                            </div>
                            <div className="card-body" style={{ padding: 0 }}>
                                {/* Sub-tabs */}
                                <div className="tabs" style={{ padding: '0 var(--spacing-md)', marginBottom: 0 }}>
                                    {(['identity', 'panel', 'grid_prompt'] as OutputSubTab[]).map(tab => (
                                        <button
                                            key={tab}
                                            className={`tab ${outputSubTab === tab ? 'active' : ''}`}
                                            onClick={() => setOutputSubTab(tab)}
                                            style={{ padding: 'var(--spacing-sm) var(--spacing-md)', fontSize: '13px' }}
                                        >
                                            {tab === 'identity' ? 'Identity JSON' : tab === 'panel' ? 'Panel JSON' : 'Grid Prompt'}
                                        </button>
                                    ))}
                                </div>

                                <div style={{ padding: 'var(--spacing-md)' }}>
                                    {outputSubTab === 'identity' && (
                                        <>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                                                <button className="btn btn-ghost" style={{ fontSize: '12px' }}>
                                                    <Copy size={14} /> Copy
                                                </button>
                                                <button className="btn btn-ghost" style={{ fontSize: '12px' }}>
                                                    <Download size={14} /> Download
                                                </button>
                                            </div>
                                            <div className="json-editor">
                                                <pre>{JSON.stringify(mockIdentityJson, null, 2)}</pre>
                                            </div>
                                        </>
                                    )}

                                    {outputSubTab === 'panel' && (
                                        <>
                                            <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                                <select
                                                    className="input"
                                                    value={selectedPanelNumber}
                                                    onChange={(e) => setSelectedPanelNumber(Number(e.target.value) as PanelNumber)}
                                                >
                                                    {([1, 2, 3, 4, 5, 6, 7, 8, 9] as PanelNumber[]).map(num => (
                                                        <option key={num} value={num}>Panel {num} - {PANEL_ANGLES[num]}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="json-editor">
                                                <pre>{JSON.stringify({
                                                    panel: { number: selectedPanelNumber, angle: PANEL_ANGLES[selectedPanelNumber] },
                                                    identity_lock: { "...": "Identity details" },
                                                    prompt: { full_prompt: "Ready-to-paste prompt..." }
                                                }, null, 2)}</pre>
                                            </div>
                                        </>
                                    )}

                                    {outputSubTab === 'grid_prompt' && (
                                        <>
                                            <div style={{
                                                background: 'rgba(245, 158, 11, 0.1)',
                                                border: '1px solid rgba(245, 158, 11, 0.3)',
                                                borderRadius: 'var(--radius-md)',
                                                padding: 'var(--spacing-md)',
                                                marginBottom: 'var(--spacing-md)',
                                                fontSize: '13px',
                                                color: 'var(--color-warning)'
                                            }}>
                                                ⚠️ <strong>CRITICAL:</strong> Each panel must show a DIFFERENT camera angle!
                                            </div>
                                            <div className="json-editor" style={{ maxHeight: 'none' }}>
                                                <pre style={{ whiteSpace: 'pre-wrap', color: 'var(--color-text-secondary)' }}>
                                                    {`Generate a single 3x3 grid image showing the EXACT SAME PERSON from 9 DIFFERENT camera angles.

Portrait of a young woman with light olive skin (#EAC0A8) and scattered freckles across nose and cheeks...

PANEL LAYOUT:
- Row 1: Panel 1 HIGH ANGLE, Panel 2 LOW ANGLE, Panel 3 EYE-LEVEL
- Row 2: Panel 4 DUTCH ANGLE, Panel 5 CLOSE-UP, Panel 6 OVER-SHOULDER
- Row 3: Panel 7 PROFILE, Panel 8 45-DEGREE, Panel 9 BIRD'S EYE

CRITICAL: 9 completely different perspectives.
Background: Solid white #FFFFFF
Lighting: Studio, soft shadows`}
                                                </pre>
                                            </div>
                                            <button className="btn btn-primary" style={{ marginTop: 'var(--spacing-md)', width: '100%' }}>
                                                <Copy size={16} /> Copy Grid Generation Prompt
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Panels Tab */}
            {activeTab === 'panels' && (
                <div className="fade-in">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">All Panels - Expanded View</h3>
                        </div>
                        <div className="card-body">
                            <div className="grid grid-3">
                                {([1, 2, 3, 4, 5, 6, 7, 8, 9] as PanelNumber[]).map(num => (
                                    <div key={num} className="card" style={{ padding: 'var(--spacing-lg)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                                            <span style={{
                                                width: 28,
                                                height: 28,
                                                background: 'var(--color-accent-gradient)',
                                                borderRadius: 'var(--radius-sm)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: 700
                                            }}>{num}</span>
                                            <span style={{ fontWeight: 600 }}>{PANEL_ANGLES[num]}</span>
                                        </div>
                                        <div style={{
                                            height: 150,
                                            background: 'var(--color-bg-tertiary)',
                                            borderRadius: 'var(--radius-md)',
                                            marginBottom: 'var(--spacing-md)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            color: 'var(--color-text-muted)'
                                        }}>
                                            Preview
                                        </div>
                                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                            <button className="btn btn-primary" style={{ flex: 1, fontSize: '12px' }}>
                                                <Play size={14} /> Generate
                                            </button>
                                            <button className="btn btn-secondary" style={{ fontSize: '12px' }}>
                                                <Eye size={14} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Batch Tab */}
            {activeTab === 'batch' && (
                <div className="fade-in">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Batch Processing</h3>
                        </div>
                        <div className="card-body">
                            <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                <Layers size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-md)' }} />
                                <div style={{ fontWeight: 500, marginBottom: 'var(--spacing-sm)' }}>No active batches</div>
                                <div style={{ fontSize: '14px', marginBottom: 'var(--spacing-lg)' }}>
                                    Create a batch to process multiple images at once
                                </div>
                                <button className="btn btn-primary">
                                    <Layers size={16} /> Create New Batch
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Prompt Usage Tab */}
            {activeTab === 'prompt_usage' && (
                <div className="fade-in">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Prompt Version Used</h3>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)', marginBottom: 'var(--spacing-lg)' }}>
                                <span className="badge badge-success">Active</span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>v1.0.0</span>
                                <span style={{ color: 'var(--color-text-secondary)' }}>Grid-to-JSON Identity Cloning</span>
                            </div>
                            <button className="btn btn-secondary">
                                <Eye size={16} /> View Diff vs Current
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Exports Tab */}
            {activeTab === 'exports' && (
                <div className="fade-in">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Export Options</h3>
                        </div>
                        <div className="card-body">
                            <div className="grid grid-3">
                                <button className="btn btn-secondary" style={{ padding: 'var(--spacing-lg)', height: 'auto', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                    <FileJson size={24} />
                                    <span>JSON Only</span>
                                </button>
                                <button className="btn btn-secondary" style={{ padding: 'var(--spacing-lg)', height: 'auto', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                    <ImageIcon size={24} />
                                    <span>Images Only</span>
                                </button>
                                <button className="btn btn-primary" style={{ padding: 'var(--spacing-lg)', height: 'auto', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                    <Download size={24} />
                                    <span>Full Package</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
