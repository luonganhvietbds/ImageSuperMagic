import { useState, useCallback } from 'react';
import {
    Upload,
    Image as ImageIcon,
    Play,
    Box,
    Link as LinkIcon,
    Type,
    FileJson,
    Copy,
    Download,
    ZoomIn,
    Move,
    Loader2,
    Check,
    AlertCircle
} from 'lucide-react';
import { useAppStore } from '../../state';
import { visualSweep, fileToBase64 } from '../../services/ai.service';
import { createJob, completeJob, failJob } from '../../services/job.service';
import { assetOperations, generateUUID } from '../../db';
import type { VisionJSON, Asset } from '../../types';

type TabId = 'input' | 'objects' | 'relationships' | 'text_ocr' | 'json_output';

const VISION_PROMPT = `Analyze this image comprehensively and return a detailed JSON structure.

Return JSON with:
{
  "meta": {
    "image_quality": "High/Medium/Low",
    "image_type": "Photo/Illustration/Screenshot/Diagram",
    "resolution_estimation": "WxH"
  },
  "global_context": {
    "scene_description": "detailed description",
    "scene_type": "indoor/outdoor/abstract",
    "time_of_day": "if determinable",
    "lighting": {
      "source": "Natural/Artificial/Mixed",
      "direction": "description",
      "quality": "Soft/Hard/Mixed"
    },
    "mood": "description"
  },
  "objects": [
    {
      "id": "obj_001",
      "label": "object name",
      "category": "Human/Animal/Furniture/Object/Architecture/Nature/Vehicle",
      "location": "position in image",
      "prominence": "Foreground/Midground/Background",
      "visual_attributes": {
        "color": "description",
        "texture": "description",
        "material": "if identifiable",
        "state": "description"
      },
      "micro_details": ["list of fine details"]
    }
  ],
  "semantic_relationships": ["list of relationships between objects"],
  "detected_text": ["any text visible in the image"]
}`;

export default function VisionToJson() {
    const { apiKeyValid } = useAppStore();
    const [activeTab, setActiveTab] = useState<TabId>('input');
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
    const [imageData, setImageData] = useState<{ dataUrl: string; base64: string; mimeType: string; filename: string } | null>(null);
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<VisionJSON | null>(null);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);

    const tabs = [
        { id: 'input' as TabId, label: 'Input', icon: ImageIcon },
        { id: 'objects' as TabId, label: 'Objects', icon: Box },
        { id: 'relationships' as TabId, label: 'Relationships', icon: LinkIcon },
        { id: 'text_ocr' as TabId, label: 'Text OCR', icon: Type },
        { id: 'json_output' as TabId, label: 'JSON Output', icon: FileJson },
    ];

    const handleFileUpload = async (file: File) => {
        const { base64, mimeType } = await fileToBase64(file);
        const dataUrl = `data:${mimeType};base64,${base64}`;
        setImageData({ dataUrl, base64, mimeType, filename: file.name });
        setResult(null);
        setError(null);

        // Save to IndexedDB
        const asset: Asset = {
            id: generateUUID(),
            type: 'source_image',
            filename: file.name,
            mimeType,
            data: dataUrl,
            sizeBytes: file.size,
            createdAt: Date.now()
        };
        await assetOperations.create(asset);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file?.type.startsWith('image/')) {
            handleFileUpload(file);
        }
    }, []);

    const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFileUpload(file);
    };

    const handleAnalyze = async () => {
        if (!imageData || !apiKeyValid) return;

        setAnalyzing(true);
        setError(null);

        const job = await createJob('vision_to_json', [imageData.filename]);

        try {
            const visionResult = await visualSweep(imageData.base64, imageData.mimeType, VISION_PROMPT);
            setResult(visionResult);

            // Save result as asset
            const resultAsset: Asset = {
                id: generateUUID(),
                type: 'identity_json', // Using identity_json for vision results
                filename: `vision_${imageData.filename}.json`,
                mimeType: 'application/json',
                data: JSON.stringify(visionResult, null, 2),
                jobId: job.id,
                createdAt: Date.now()
            };
            await assetOperations.create(resultAsset);
            await completeJob(job.id, [resultAsset.id]);

            setActiveTab('json_output');
        } catch (err: any) {
            const errorMsg = err.message || 'Analysis failed';
            setError(errorMsg);
            await failJob(job.id, errorMsg);
        } finally {
            setAnalyzing(false);
        }
    };

    const handleCopy = async () => {
        if (!result) return;
        await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleDownload = () => {
        if (!result) return;
        const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vision_output_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const objects = result?.objects || [];
    const relationships = result?.semantic_relationships || [];
    const detectedText = result?.detected_text || [];

    return (
        <div className="vision-to-json-page fade-in">
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
                        <tab.icon size={16} style={{ marginRight: 'var(--spacing-xs)' }} />
                        {tab.label}
                        {tab.id === 'objects' && objects.length > 0 && (
                            <span className="badge badge-info" style={{ marginLeft: 4 }}>{objects.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Input Tab */}
            {activeTab === 'input' && (
                <div className="fade-in">
                    <div className="grid grid-2" style={{ gridTemplateColumns: '1fr 300px' }}>
                        {/* Image Viewer */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Image Viewer</h3>
                            </div>
                            <div className="card-body">
                                {!imageData ? (
                                    <label
                                        className={`upload-area ${dragOver ? 'dragover' : ''}`}
                                        style={{ height: 400, cursor: 'pointer' }}
                                        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                        onDragLeave={() => setDragOver(false)}
                                        onDrop={handleDrop}
                                    >
                                        <input
                                            type="file"
                                            accept="image/*"
                                            onChange={handleFileInput}
                                            style={{ display: 'none' }}
                                        />
                                        <Upload size={48} style={{ color: 'var(--color-accent-primary)', marginBottom: 'var(--spacing-md)' }} />
                                        <div style={{ fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>Drop any image here</div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                                            Photos, illustrations, screenshots, diagrams...
                                        </div>
                                    </label>
                                ) : (
                                    <div style={{
                                        height: 400,
                                        background: 'var(--color-bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        overflow: 'hidden'
                                    }}>
                                        <img
                                            src={imageData.dataUrl}
                                            alt="Uploaded"
                                            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions Panel */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Actions</h3>
                            </div>
                            <div className="card-body">
                                <button
                                    className="btn btn-primary"
                                    style={{ width: '100%', marginBottom: 'var(--spacing-md)' }}
                                    disabled={!imageData || !apiKeyValid || analyzing}
                                    onClick={handleAnalyze}
                                >
                                    {analyzing ? (
                                        <><Loader2 size={16} className="spin" /> Analyzing...</>
                                    ) : (
                                        <><Play size={16} /> Analyze Image</>
                                    )}
                                </button>

                                {error && (
                                    <div style={{
                                        background: 'rgba(239, 68, 68, 0.1)',
                                        border: '1px solid rgba(239, 68, 68, 0.3)',
                                        borderRadius: 'var(--radius-md)',
                                        padding: 'var(--spacing-sm)',
                                        marginBottom: 'var(--spacing-md)',
                                        fontSize: '13px',
                                        color: 'var(--color-error)'
                                    }}>
                                        {error}
                                    </div>
                                )}

                                <div style={{
                                    padding: 'var(--spacing-md)',
                                    background: 'var(--color-bg-tertiary)',
                                    borderRadius: 'var(--radius-md)',
                                    marginBottom: 'var(--spacing-md)'
                                }}>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-sm)' }}>
                                        ANALYSIS SWEEPS
                                    </div>
                                    <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                                        <div>1. Macro Sweep - Scene & subjects</div>
                                        <div>2. Micro Sweep - Textures & details</div>
                                        <div>3. Relationship Sweep - Object connections</div>
                                    </div>
                                </div>

                                {imageData && (
                                    <button
                                        className="btn btn-secondary"
                                        style={{ width: '100%' }}
                                        onClick={() => { setImageData(null); setResult(null); }}
                                    >
                                        Clear Image
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Objects Tab */}
            {activeTab === 'objects' && (
                <div className="fade-in">
                    <div className="grid grid-3" style={{ gridTemplateColumns: '280px 1fr 320px' }}>
                        {/* Object List */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Detected Objects</h3>
                                <span className="badge badge-info">{objects.length}</span>
                            </div>
                            <div className="card-body" style={{ padding: 0 }}>
                                {objects.length === 0 ? (
                                    <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                        Analyze an image to detect objects
                                    </div>
                                ) : (
                                    objects.map((obj: any) => (
                                        <div
                                            key={obj.id}
                                            onClick={() => setSelectedObjectId(obj.id)}
                                            style={{
                                                padding: 'var(--spacing-md)',
                                                borderBottom: '1px solid var(--color-border)',
                                                cursor: 'pointer',
                                                background: selectedObjectId === obj.id ? 'rgba(99, 102, 241, 0.1)' : 'transparent'
                                            }}
                                        >
                                            <div style={{ fontWeight: 500, marginBottom: 2 }}>{obj.label}</div>
                                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
                                                {obj.category} • {obj.location}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Image with Preview */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Visual Map</h3>
                            </div>
                            <div className="card-body">
                                <div style={{
                                    height: 400,
                                    background: 'var(--color-bg-tertiary)',
                                    borderRadius: 'var(--radius-md)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    overflow: 'hidden'
                                }}>
                                    {imageData ? (
                                        <img src={imageData.dataUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                    ) : (
                                        <span style={{ color: 'var(--color-text-muted)' }}>No image loaded</span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Object Detail */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Object Details</h3>
                            </div>
                            <div className="card-body">
                                {selectedObjectId ? (
                                    (() => {
                                        const obj = objects.find((o: any) => o.id === selectedObjectId);
                                        if (!obj) return null;
                                        return (
                                            <div>
                                                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 4 }}>LABEL</div>
                                                    <div style={{ fontWeight: 600 }}>{obj.label}</div>
                                                </div>
                                                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 4 }}>CATEGORY</div>
                                                    <div>{obj.category}</div>
                                                </div>
                                                <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 4 }}>LOCATION</div>
                                                    <div>{obj.location}</div>
                                                </div>
                                                {obj.visual_attributes && (
                                                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 4 }}>VISUAL ATTRIBUTES</div>
                                                        <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                                                            {obj.visual_attributes.color && <div>Color: {obj.visual_attributes.color}</div>}
                                                            {obj.visual_attributes.texture && <div>Texture: {obj.visual_attributes.texture}</div>}
                                                            {obj.visual_attributes.material && <div>Material: {obj.visual_attributes.material}</div>}
                                                        </div>
                                                    </div>
                                                )}
                                                {obj.micro_details && obj.micro_details.length > 0 && (
                                                    <div>
                                                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 4 }}>MICRO DETAILS</div>
                                                        <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                                                            {obj.micro_details.map((d: string, i: number) => (
                                                                <div key={i}>• {d}</div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })()
                                ) : (
                                    <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                                        Select an object to view details
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Relationships Tab */}
            {activeTab === 'relationships' && (
                <div className="fade-in">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Semantic Relationships</h3>
                            <span className="badge badge-info">{relationships.length}</span>
                        </div>
                        <div className="card-body">
                            {relationships.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-muted)' }}>
                                    <LinkIcon size={48} style={{ marginBottom: 'var(--spacing-md)' }} />
                                    <div>Analyze an image to detect relationships</div>
                                </div>
                            ) : (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 'var(--spacing-md)' }}>
                                    {relationships.map((rel: string, i: number) => (
                                        <div
                                            key={i}
                                            style={{
                                                padding: 'var(--spacing-md)',
                                                background: 'var(--color-bg-tertiary)',
                                                borderRadius: 'var(--radius-md)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-md)'
                                            }}
                                        >
                                            <LinkIcon size={16} style={{ color: 'var(--color-accent-primary)' }} />
                                            <span>{rel}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Text OCR Tab */}
            {activeTab === 'text_ocr' && (
                <div className="fade-in">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Detected Text</h3>
                        </div>
                        <div className="card-body">
                            {detectedText.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-muted)' }}>
                                    <Type size={48} style={{ marginBottom: 'var(--spacing-md)' }} />
                                    <div style={{ fontWeight: 500 }}>No text detected in image</div>
                                    <div style={{ fontSize: '14px', marginTop: 'var(--spacing-sm)' }}>
                                        Upload an image with visible text to extract OCR data
                                    </div>
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
                                    {detectedText.map((text: string, i: number) => (
                                        <div key={i} style={{
                                            padding: 'var(--spacing-md)',
                                            background: 'var(--color-bg-tertiary)',
                                            borderRadius: 'var(--radius-md)',
                                            fontFamily: 'var(--font-mono)'
                                        }}>
                                            {text}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* JSON Output Tab */}
            {activeTab === 'json_output' && (
                <div className="fade-in">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Complete JSON Output</h3>
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                <button className="btn btn-ghost" onClick={handleCopy} disabled={!result}>
                                    {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied!' : 'Copy'}
                                </button>
                                <button className="btn btn-ghost" onClick={handleDownload} disabled={!result}>
                                    <Download size={16} /> Download
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            {result && (
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                                    <span className="badge badge-success">Schema Valid</span>
                                    <span className="badge badge-info">{objects.length} Objects</span>
                                    <span className="badge badge-info">{relationships.length} Relationships</span>
                                </div>
                            )}
                            <div className="json-editor" style={{ maxHeight: 500 }}>
                                <pre>{result ? JSON.stringify(result, null, 2) : '// Analyze an image to see results'}</pre>
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
