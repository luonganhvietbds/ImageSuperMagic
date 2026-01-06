import { useState, useCallback, useEffect } from 'react';
import {
    Upload,
    Image as ImageIcon,
    Play,
    Trash2,
    Copy,
    Download,
    Grid3X3,
    Layers,
    FileJson,
    Sparkles,
    Loader2,
    Check,
    AlertCircle
} from 'lucide-react';
import { useAppStore } from '../../state';
import { analyzeIdentity, generatePanelSpec, fileToBase64, isInitialized } from '../../services/ai.service';
import { createJob, completeJob, failJob } from '../../services/job.service';
import { getActivePrompt } from '../../services/promptBrain.service';
import { assetOperations, generateUUID } from '../../db';
import type { IdentityJSON, Asset, PromptVersion } from '../../types';

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
    dataUrl?: string;
    base64?: string;
    mimeType?: string;
    error?: string;
}

// Fallback prompt if none is configured in Prompt Brain
const FALLBACK_PROMPT = `Analyze this portrait image and extract detailed identity information in JSON format. Return a JSON with meta, identity_blueprint (face_geometry, skin_texture, hair).`;

export default function GridToJson() {
    const { apiKeyValid } = useAppStore();
    const [activeTab, setActiveTab] = useState<TabId>('workspace');
    const [workspaceSubTab, setWorkspaceSubTab] = useState<WorkspaceSubTab>('reference');
    const [outputSubTab, setOutputSubTab] = useState<OutputSubTab>('identity');
    const [selectedPanelNumber, setSelectedPanelNumber] = useState<PanelNumber>(1);
    const [images, setImages] = useState<UploadedImage[]>([]);
    const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [identityResult, setIdentityResult] = useState<IdentityJSON | null>(null);
    const [panelResults, setPanelResults] = useState<Record<number, object>>({});
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activePrompt, setActivePrompt] = useState<PromptVersion | null>(null);

    // Load active prompt from Prompt Brain on mount
    useEffect(() => {
        getActivePrompt('grid_to_json').then(setActivePrompt);
    }, []);

    const tabs = [
        { id: 'workspace' as TabId, label: 'Workspace' },
        { id: 'panels' as TabId, label: 'Panels' },
        { id: 'batch' as TabId, label: 'Batch' },
        { id: 'prompt_usage' as TabId, label: 'Prompt Usage' },
        { id: 'exports' as TabId, label: 'Exports' },
    ];

    const handleFileUpload = async (files: File[]) => {
        const imageFiles = files.filter(f => f.type.startsWith('image/'));

        for (const file of imageFiles) {
            const id = generateUUID();
            const { base64, mimeType } = await fileToBase64(file);

            const newImage: UploadedImage = {
                id,
                filename: file.name,
                status: 'pending',
                dataUrl: `data:${mimeType};base64,${base64}`,
                base64,
                mimeType
            };

            setImages(prev => [...prev, newImage]);

            if (!selectedImageId) {
                setSelectedImageId(id);
            }

            // Save to IndexedDB
            const asset: Asset = {
                id,
                type: 'source_image',
                filename: file.name,
                mimeType,
                data: `data:${mimeType};base64,${base64}`,
                sizeBytes: file.size,
                createdAt: Date.now()
            };
            await assetOperations.create(asset);
        }
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const files = Array.from(e.dataTransfer.files);
        handleFileUpload(files);
    }, [selectedImageId]);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFileUpload(Array.from(e.target.files));
        }
    };

    const handleAnalyze = async () => {
        if (!selectedImageId || !apiKeyValid) return;

        const selectedImage = images.find(img => img.id === selectedImageId);
        if (!selectedImage?.base64 || !selectedImage.mimeType) return;

        setAnalyzing(true);
        setError(null);
        setImages(prev => prev.map(img =>
            img.id === selectedImageId ? { ...img, status: 'running' as const } : img
        ));

        // Create job record
        const job = await createJob('grid_to_json', [selectedImageId]);

        try {
            // Use active prompt from Prompt Brain, fallback to default
            const systemPrompt = activePrompt?.content || FALLBACK_PROMPT;
            const result = await analyzeIdentity(
                selectedImage.base64,
                selectedImage.mimeType,
                systemPrompt
            );

            setIdentityResult(result);
            setImages(prev => prev.map(img =>
                img.id === selectedImageId ? {
                    ...img,
                    status: 'completed' as const,
                    confidence: parseInt(result.meta?.extraction_confidence || '90')
                } : img
            ));

            // Save identity JSON as asset
            const identityAsset: Asset = {
                id: generateUUID(),
                type: 'identity_json',
                filename: `identity_${selectedImage.filename}.json`,
                mimeType: 'application/json',
                data: JSON.stringify(result, null, 2),
                jobId: job.id,
                createdAt: Date.now()
            };
            await assetOperations.create(identityAsset);
            await completeJob(job.id, [identityAsset.id]);

        } catch (err: any) {
            const errorMsg = err.message || 'Analysis failed';
            setError(errorMsg);
            setImages(prev => prev.map(img =>
                img.id === selectedImageId ? { ...img, status: 'failed' as const, error: errorMsg } : img
            ));
            await failJob(job.id, errorMsg);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleGeneratePanel = async (panelNum: PanelNumber) => {
        if (!identityResult || !apiKeyValid) return;

        try {
            const panelPrompt = `Generate a panel specification for Panel ${panelNum} (${PANEL_ANGLES[panelNum]}) based on this identity data. Return JSON with camera angle, lighting, and prompt details.`;
            const result = await generatePanelSpec(identityResult, panelNum, panelPrompt);
            setPanelResults(prev => ({ ...prev, [panelNum]: result }));
        } catch (err: any) {
            setError(err.message || 'Panel generation failed');
        }
    };

    const handleCopy = async (data: object) => {
        await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = (data: object, filename: string) => {
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

    const removeImage = async (id: string) => {
        setImages(prev => prev.filter(img => img.id !== id));
        if (selectedImageId === id) {
            setSelectedImageId(null);
            setIdentityResult(null);
        }
        await assetOperations.delete(id);
    };

    const selectedImage = images.find(img => img.id === selectedImageId);

    const gridPrompt = identityResult ? `Generate a single 3x3 grid image showing the EXACT SAME PERSON from 9 DIFFERENT camera angles.

Portrait of a person with: ${identityResult.identity_blueprint?.skin_texture?.base_tone || 'natural'} skin tone, ${identityResult.identity_blueprint?.hair?.color || 'dark'} ${identityResult.identity_blueprint?.hair?.texture || ''} hair.

Face shape: ${identityResult.identity_blueprint?.face_geometry?.face_shape || 'oval'}
Eyes: ${identityResult.identity_blueprint?.face_geometry?.eye_area?.eye_color || 'brown'}
Unique markers: ${identityResult.meta?.critical_identity_markers || 'none specified'}

PANEL LAYOUT:
- Row 1: Panel 1 HIGH ANGLE, Panel 2 LOW ANGLE, Panel 3 EYE-LEVEL
- Row 2: Panel 4 DUTCH ANGLE, Panel 5 CLOSE-UP, Panel 6 OVER-SHOULDER
- Row 3: Panel 7 PROFILE, Panel 8 45-DEGREE, Panel 9 BIRD'S EYE

CRITICAL: All 9 panels must show the EXACT SAME PERSON with IDENTICAL features.
Background: Solid white #FFFFFF
Lighting: Studio, soft shadows` : '';

    return (
        <div className="grid-to-json-page fade-in">
            {/* API Key Warning */}
            {!apiKeyValid && (
                <div style={{
                    background: 'rgba(245, 158, 11, 0.1)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    borderRadius: 'var(--radius-md)',
                    padding: 'var(--spacing-md)',
                    marginBottom: 'var(--spacing-lg)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)'
                }}>
                    <AlertCircle size={20} style={{ color: 'var(--color-warning)' }} />
                    <span>Please configure your Gemini API key in Settings to enable AI analysis.</span>
                </div>
            )}

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
                                <label
                                    className={`upload-area ${dragOver ? 'dragover' : ''}`}
                                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                    onDragLeave={() => setDragOver(false)}
                                    onDrop={handleDrop}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple
                                        onChange={handleFileInput}
                                        style={{ display: 'none' }}
                                    />
                                    <Upload size={32} style={{ color: 'var(--color-accent-primary)', marginBottom: 'var(--spacing-md)' }} />
                                    <div style={{ fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>Drop images here</div>
                                    <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>or click to browse</div>
                                </label>

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
                                                        justifyContent: 'center',
                                                        overflow: 'hidden'
                                                    }}>
                                                        {img.dataUrl ? (
                                                            <img src={img.dataUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        ) : (
                                                            <ImageIcon size={20} style={{ color: 'var(--color-text-muted)' }} />
                                                        )}
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
                                                    <button
                                                        className="btn btn-ghost btn-icon"
                                                        style={{ padding: 4 }}
                                                        onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Error Display */}
                                {error && (
                                    <div style={{
                                        marginTop: 'var(--spacing-md)',
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: 'var(--spacing-sm)',
                                        fontSize: '13px',
                                        color: 'var(--color-error)'
                                    }}>
                                        {error}
                                    </div>
                                )}

                                {/* Actions */}
                                <div style={{ marginTop: 'var(--spacing-lg)', display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    <button
                                        className="btn btn-primary"
                                        style={{ flex: 1 }}
                                        onClick={handleAnalyze}
                                        disabled={!selectedImageId || !apiKeyValid || analyzing}
                                    >
                                        {analyzing ? (
                                            <><Loader2 size={16} className="spin" /> Analyzing...</>
                                        ) : (
                                            <><Play size={16} /> Analyze Selected</>
                                        )}
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
                                        color: 'var(--color-text-muted)',
                                        overflow: 'hidden'
                                    }}>
                                        {selectedImage?.dataUrl ? (
                                            <img src={selectedImage.dataUrl} alt="Selected" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                        ) : (
                                            'Select an image to analyze'
                                        )}
                                    </div>
                                )}
                                {workspaceSubTab === 'geometry' && (
                                    <div style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                                        {identityResult?.identity_blueprint?.face_geometry ? (
                                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                                                <div><strong>Face Shape:</strong> {identityResult.identity_blueprint.face_geometry.face_shape}</div>
                                                <div><strong>Eye Shape:</strong> {identityResult.identity_blueprint.face_geometry.eye_area?.eye_shape}</div>
                                                <div><strong>Eye Color:</strong> {identityResult.identity_blueprint.face_geometry.eye_area?.eye_color}</div>
                                                <div><strong>Jaw:</strong> {identityResult.identity_blueprint.face_geometry.jaw_chin?.jaw_angle}</div>
                                            </div>
                                        ) : (
                                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                                Analyze an image to see geometry data
                                            </div>
                                        )}
                                    </div>
                                )}
                                {workspaceSubTab === 'markers' && (
                                    <div style={{ padding: 'var(--spacing-md)', color: 'var(--color-text-secondary)' }}>
                                        {identityResult?.identity_blueprint?.skin_texture?.unique_marks ? (
                                            identityResult.identity_blueprint.skin_texture.unique_marks.map((mark, i) => (
                                                <div key={i} style={{ marginBottom: 'var(--spacing-sm)' }}>• {mark}</div>
                                            ))
                                        ) : (
                                            <div style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                                Analyze an image to see unique markers
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* 3x3 Panel Grid */}
                        <div className="card" style={{ flex: 1 }}>
                            <div className="card-header">
                                <h3 className="card-title">3×3 Panel Grid</h3>
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
                                                <button
                                                    className="btn btn-ghost"
                                                    style={{ padding: 4, fontSize: 10 }}
                                                    title="Generate"
                                                    onClick={(e) => { e.stopPropagation(); handleGeneratePanel(num); }}
                                                    disabled={!identityResult}
                                                >
                                                    <Play size={12} />
                                                </button>
                                                <button
                                                    className="btn btn-ghost"
                                                    style={{ padding: 4, fontSize: 10 }}
                                                    title="Copy JSON"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (panelResults[num]) handleCopy(panelResults[num]);
                                                    }}
                                                    disabled={!panelResults[num]}
                                                >
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
                                                <button
                                                    className="btn btn-ghost"
                                                    style={{ fontSize: '12px' }}
                                                    onClick={() => identityResult && handleCopy(identityResult)}
                                                    disabled={!identityResult}
                                                >
                                                    {copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copied!' : 'Copy'}
                                                </button>
                                                <button
                                                    className="btn btn-ghost"
                                                    style={{ fontSize: '12px' }}
                                                    onClick={() => identityResult && handleDownload(identityResult, 'identity.json')}
                                                    disabled={!identityResult}
                                                >
                                                    <Download size={14} /> Download
                                                </button>
                                            </div>
                                            <div className="json-editor">
                                                <pre>{identityResult ? JSON.stringify(identityResult, null, 2) : '// Analyze an image to see results'}</pre>
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
                                                <pre>{panelResults[selectedPanelNumber]
                                                    ? JSON.stringify(panelResults[selectedPanelNumber], null, 2)
                                                    : '// Generate panel to see results'}</pre>
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
                                                    {gridPrompt || '// Analyze an image to generate grid prompt'}
                                                </pre>
                                            </div>
                                            <button
                                                className="btn btn-primary"
                                                style={{ marginTop: 'var(--spacing-md)', width: '100%' }}
                                                onClick={() => navigator.clipboard.writeText(gridPrompt)}
                                                disabled={!gridPrompt}
                                            >
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

            {/* Other tabs remain similar but simplified */}
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
                                            {panelResults[num] && <span className="badge badge-success">Generated</span>}
                                        </div>
                                        <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                            <button
                                                className="btn btn-primary"
                                                style={{ flex: 1, fontSize: '12px' }}
                                                onClick={() => handleGeneratePanel(num)}
                                                disabled={!identityResult}
                                            >
                                                <Play size={14} /> Generate
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'exports' && (
                <div className="fade-in">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Export Options</h3>
                        </div>
                        <div className="card-body">
                            <div className="grid grid-3">
                                <button
                                    className="btn btn-secondary"
                                    style={{ padding: 'var(--spacing-lg)', height: 'auto', flexDirection: 'column', gap: 'var(--spacing-sm)' }}
                                    onClick={() => identityResult && handleDownload(identityResult, 'identity.json')}
                                    disabled={!identityResult}
                                >
                                    <FileJson size={24} />
                                    <span>Identity JSON</span>
                                </button>
                                <button
                                    className="btn btn-secondary"
                                    style={{ padding: 'var(--spacing-lg)', height: 'auto', flexDirection: 'column', gap: 'var(--spacing-sm)' }}
                                    onClick={() => {
                                        const all = { identity: identityResult, panels: panelResults };
                                        handleDownload(all, 'full_export.json');
                                    }}
                                    disabled={!identityResult}
                                >
                                    <Download size={24} />
                                    <span>Full Package</span>
                                </button>
                                <button
                                    className="btn btn-primary"
                                    style={{ padding: 'var(--spacing-lg)', height: 'auto', flexDirection: 'column', gap: 'var(--spacing-sm)' }}
                                    onClick={() => navigator.clipboard.writeText(gridPrompt)}
                                    disabled={!gridPrompt}
                                >
                                    <Copy size={24} />
                                    <span>Copy Grid Prompt</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'batch' && (
                <div className="fade-in">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Batch Processing</h3>
                        </div>
                        <div className="card-body">
                            <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                                <Layers size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-md)' }} />
                                <div style={{ fontWeight: 500, marginBottom: 'var(--spacing-sm)' }}>Batch mode coming soon</div>
                                <div style={{ fontSize: '14px' }}>
                                    Process multiple images at once with batch operations
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

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
