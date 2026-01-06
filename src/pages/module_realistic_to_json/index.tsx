import { useState, useCallback, useEffect } from 'react';
import {
    Type,
    Image as ImageIcon,
    Layers,
    Play,
    FileJson,
    Copy,
    Download,
    Lightbulb,
    SlidersHorizontal,
    Camera,
    Sun,
    Shirt,
    Loader2,
    Check,
    AlertCircle,
    Trash2
} from 'lucide-react';
import { useAppStore } from '../../state';
import { generateSpecFromText, generateSpecFromImage, fileToBase64 } from '../../services/ai.service';
import { createJob, completeJob, failJob } from '../../services/job.service';
import { getActivePrompt } from '../../services/promptBrain.service';
import { assetOperations, generateUUID } from '../../db';
import type { RealisticJSON, Asset, PromptVersion } from '../../types';

type TabId = 'builder' | 'assumptions' | 'json_spec' | 'variations';
type InputMode = 'text' | 'image' | 'hybrid';

// Fallback prompt if none configured in Prompt Brain
const FALLBACK_PROMPT = `Generate a JSON specification for realistic image generation with meta, subject, wardrobe, environment, lighting, camera, and assumptions.`;

export default function RealisticToJson() {
    const { apiKeyValid } = useAppStore();
    const [activeTab, setActiveTab] = useState<TabId>('builder');
    const [inputMode, setInputMode] = useState<InputMode>('text');
    const [textInput, setTextInput] = useState('');
    const [structuredFields, setStructuredFields] = useState({ subject: '', style: 'Fashion/Editorial', environment: '', camera: '' });
    const [imageData, setImageData] = useState<{ dataUrl: string; base64: string; mimeType: string; filename: string } | null>(null);
    const [hybridText, setHybridText] = useState('');
    const [analyzing, setAnalyzing] = useState(false);
    const [result, setResult] = useState<RealisticJSON | null>(null);
    const [assumptions, setAssumptions] = useState<string[]>([]);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dragOver, setDragOver] = useState(false);
    const [activePrompt, setActivePrompt] = useState<PromptVersion | null>(null);

    // Load active prompt from Prompt Brain on mount
    useEffect(() => {
        getActivePrompt('realistic_to_json').then(setActivePrompt);
    }, []);

    const tabs = [
        { id: 'builder' as TabId, label: 'Builder' },
        { id: 'assumptions' as TabId, label: 'Assumptions' },
        { id: 'json_spec' as TabId, label: 'JSON Spec' },
        { id: 'variations' as TabId, label: 'Variations' },
    ];

    const handleFileUpload = async (file: File) => {
        const { base64, mimeType } = await fileToBase64(file);
        const dataUrl = `data:${mimeType};base64,${base64}`;
        setImageData({ dataUrl, base64, mimeType, filename: file.name });
        setError(null);
    };

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setDragOver(false);
        const file = e.dataTransfer.files[0];
        if (file?.type.startsWith('image/')) {
            handleFileUpload(file);
        }
    }, []);

    const handleGenerate = async () => {
        if (!apiKeyValid) return;

        setAnalyzing(true);
        setError(null);

        let inputDescription = '';
        let inputAssets: string[] = [];

        if (inputMode === 'text') {
            const parts = [textInput];
            if (structuredFields.subject) parts.push(`Subject: ${structuredFields.subject}`);
            if (structuredFields.style) parts.push(`Style: ${structuredFields.style}`);
            if (structuredFields.environment) parts.push(`Environment: ${structuredFields.environment}`);
            if (structuredFields.camera) parts.push(`Camera: ${structuredFields.camera}`);
            inputDescription = parts.join('\n');
        } else if (inputMode === 'hybrid') {
            inputDescription = hybridText;
        }

        if (inputMode === 'image' || inputMode === 'hybrid') {
            if (imageData) inputAssets.push(imageData.filename);
        }

        const job = await createJob('realistic_to_json', inputAssets.length > 0 ? inputAssets : [inputDescription.slice(0, 50)]);

        try {
            let generatedResult: RealisticJSON;
            // Use active prompt from Prompt Brain, fallback to default
            const systemPrompt = activePrompt?.content || FALLBACK_PROMPT;

            if (inputMode === 'text') {
                generatedResult = await generateSpecFromText(inputDescription, systemPrompt);
            } else if (inputMode === 'image' && imageData) {
                generatedResult = await generateSpecFromImage(imageData.base64, imageData.mimeType, systemPrompt);
            } else if (inputMode === 'hybrid' && imageData) {
                const hybridPrompt = `${systemPrompt}\n\nModifications to apply: ${hybridText}`;
                generatedResult = await generateSpecFromImage(imageData.base64, imageData.mimeType, hybridPrompt);
            } else {
                throw new Error('Invalid input');
            }

            setResult(generatedResult);
            setAssumptions((generatedResult as any).assumptions || []);

            // Save result as asset
            const resultAsset: Asset = {
                id: generateUUID(),
                type: 'identity_json',
                filename: `realistic_spec_${Date.now()}.json`,
                mimeType: 'application/json',
                data: JSON.stringify(generatedResult, null, 2),
                jobId: job.id,
                createdAt: Date.now()
            };
            await assetOperations.create(resultAsset);
            await completeJob(job.id, [resultAsset.id]);

            setActiveTab('json_spec');
        } catch (err: any) {
            const errorMsg = err.message || 'Generation failed';
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
        a.download = `realistic_spec_${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="realistic-to-json-page fade-in">
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
                    <span>Please configure your Gemini API key in Settings to enable AI generation.</span>
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
                        {tab.id === 'assumptions' && assumptions.length > 0 && (
                            <span className="badge badge-warning" style={{ marginLeft: 4 }}>{assumptions.length}</span>
                        )}
                    </button>
                ))}
            </div>

            {/* Builder Tab */}
            {activeTab === 'builder' && (
                <div className="fade-in">
                    <div className="grid grid-2" style={{ gridTemplateColumns: '1fr 360px' }}>
                        {/* Input Section */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Input</h3>
                                {/* Mode Selector */}
                                <div style={{ display: 'flex', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-md)', padding: 2 }}>
                                    {(['text', 'image', 'hybrid'] as InputMode[]).map(mode => (
                                        <button
                                            key={mode}
                                            onClick={() => setInputMode(mode)}
                                            style={{
                                                padding: '6px 12px',
                                                borderRadius: 'var(--radius-sm)',
                                                fontSize: '13px',
                                                fontWeight: 500,
                                                background: inputMode === mode ? 'var(--color-accent-primary)' : 'transparent',
                                                color: inputMode === mode ? 'white' : 'var(--color-text-secondary)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 'var(--spacing-xs)'
                                            }}
                                        >
                                            {mode === 'text' && <Type size={14} />}
                                            {mode === 'image' && <ImageIcon size={14} />}
                                            {mode === 'hybrid' && <Layers size={14} />}
                                            {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="card-body">
                                {inputMode === 'text' && (
                                    <div>
                                        <textarea
                                            className="input"
                                            style={{ height: 200, resize: 'vertical' }}
                                            placeholder="Describe the person and scene you want to generate...

Example: A confident businesswoman in her 30s wearing a navy blue tailored suit, standing in a modern office with floor-to-ceiling windows, afternoon sunlight creating dramatic shadows..."
                                            value={textInput}
                                            onChange={(e) => setTextInput(e.target.value)}
                                        />
                                        <div style={{ marginTop: 'var(--spacing-md)' }}>
                                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-sm)' }}>
                                                STRUCTURED FIELDS (Optional)
                                            </div>
                                            <div className="grid grid-2" style={{ gap: 'var(--spacing-md)' }}>
                                                <div>
                                                    <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Subject</label>
                                                    <input
                                                        className="input"
                                                        placeholder="e.g., Young professional woman"
                                                        value={structuredFields.subject}
                                                        onChange={(e) => setStructuredFields(f => ({ ...f, subject: e.target.value }))}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Style</label>
                                                    <select
                                                        className="input"
                                                        value={structuredFields.style}
                                                        onChange={(e) => setStructuredFields(f => ({ ...f, style: e.target.value }))}
                                                    >
                                                        <option>Fashion/Editorial</option>
                                                        <option>Portrait</option>
                                                        <option>Street/Documentary</option>
                                                        <option>Dynamic/Action</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Environment</label>
                                                    <input
                                                        className="input"
                                                        placeholder="e.g., Modern studio"
                                                        value={structuredFields.environment}
                                                        onChange={(e) => setStructuredFields(f => ({ ...f, environment: e.target.value }))}
                                                    />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Camera</label>
                                                    <input
                                                        className="input"
                                                        placeholder="e.g., 85mm portrait lens"
                                                        value={structuredFields.camera}
                                                        onChange={(e) => setStructuredFields(f => ({ ...f, camera: e.target.value }))}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {inputMode === 'image' && (
                                    imageData ? (
                                        <div>
                                            <div style={{
                                                height: 300,
                                                background: 'var(--color-bg-tertiary)',
                                                borderRadius: 'var(--radius-md)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                overflow: 'hidden',
                                                marginBottom: 'var(--spacing-md)'
                                            }}>
                                                <img src={imageData.dataUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                            </div>
                                            <button
                                                className="btn btn-secondary"
                                                onClick={() => setImageData(null)}
                                                style={{ width: '100%' }}
                                            >
                                                <Trash2 size={16} /> Clear Image
                                            </button>
                                        </div>
                                    ) : (
                                        <label
                                            className={`upload-area ${dragOver ? 'dragover' : ''}`}
                                            style={{ height: 300, cursor: 'pointer' }}
                                            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                            onDragLeave={() => setDragOver(false)}
                                            onDrop={handleDrop}
                                        >
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                                style={{ display: 'none' }}
                                            />
                                            <ImageIcon size={48} style={{ color: 'var(--color-accent-primary)', marginBottom: 'var(--spacing-md)' }} />
                                            <div style={{ fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>Drop reference image</div>
                                            <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                                                System will reverse-engineer all visual elements
                                            </div>
                                        </label>
                                    )
                                )}

                                {inputMode === 'hybrid' && (
                                    <div>
                                        {imageData ? (
                                            <div style={{ position: 'relative', marginBottom: 'var(--spacing-md)' }}>
                                                <div style={{
                                                    height: 150,
                                                    background: 'var(--color-bg-tertiary)',
                                                    borderRadius: 'var(--radius-md)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    overflow: 'hidden'
                                                }}>
                                                    <img src={imageData.dataUrl} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                                                </div>
                                                <button
                                                    className="btn btn-ghost btn-icon"
                                                    onClick={() => setImageData(null)}
                                                    style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.5)' }}
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        ) : (
                                            <label
                                                className={`upload-area ${dragOver ? 'dragover' : ''}`}
                                                style={{ height: 150, marginBottom: 'var(--spacing-md)', cursor: 'pointer' }}
                                                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                                                onDragLeave={() => setDragOver(false)}
                                                onDrop={handleDrop}
                                            >
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
                                                    style={{ display: 'none' }}
                                                />
                                                <ImageIcon size={32} style={{ color: 'var(--color-accent-primary)' }} />
                                                <div style={{ fontSize: '13px', marginTop: 'var(--spacing-sm)' }}>Reference image (base)</div>
                                            </label>
                                        )}
                                        <textarea
                                            className="input"
                                            style={{ height: 100, resize: 'vertical' }}
                                            placeholder="Modifications to apply...

Example: Change outfit to red evening gown, add dramatic backlight..."
                                            value={hybridText}
                                            onChange={(e) => setHybridText(e.target.value)}
                                        />
                                    </div>
                                )}

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

                                <button
                                    className="btn btn-primary"
                                    style={{ width: '100%', marginTop: 'var(--spacing-lg)' }}
                                    onClick={handleGenerate}
                                    disabled={!apiKeyValid || analyzing || (inputMode === 'text' && !textInput) || (inputMode === 'image' && !imageData) || (inputMode === 'hybrid' && !imageData)}
                                >
                                    {analyzing ? (
                                        <><Loader2 size={16} className="spin" /> Generating...</>
                                    ) : (
                                        <><Play size={16} /> Generate Specification</>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Inference Info */}
                        <div className="card">
                            <div className="card-header">
                                <h3 className="card-title">Inference Rules</h3>
                            </div>
                            <div className="card-body">
                                <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                                    <div style={{
                                        padding: 'var(--spacing-md)',
                                        background: 'var(--color-bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                        marginBottom: 'var(--spacing-md)'
                                    }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                                            <Lightbulb size={16} style={{ color: 'var(--color-warning)' }} />
                                            <span style={{ fontWeight: 600 }}>Visual Prompt Architect</span>
                                        </div>
                                        Transforms minimal input into comprehensive JSON specifications.
                                    </div>

                                    <div style={{ marginBottom: 'var(--spacing-sm)' }}><strong>Fashion/Editorial:</strong> 85mm, f/2.8, controlled lighting</div>
                                    <div style={{ marginBottom: 'var(--spacing-sm)' }}><strong>Street/Documentary:</strong> 35mm, f/8, natural light</div>
                                    <div style={{ marginBottom: 'var(--spacing-sm)' }}><strong>Portrait:</strong> 85mm, f/2, flattering light</div>
                                    <div style={{ marginBottom: 'var(--spacing-sm)' }}><strong>No age given:</strong> Default 25-30</div>
                                    <div><strong>No expression:</strong> Neutral with eye contact</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Assumptions Tab */}
            {activeTab === 'assumptions' && (
                <div className="fade-in">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Declared Assumptions</h3>
                            <span className="badge badge-warning">{assumptions.length} inferences</span>
                        </div>
                        <div className="card-body">
                            {assumptions.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-muted)' }}>
                                    <Lightbulb size={48} style={{ marginBottom: 'var(--spacing-md)' }} />
                                    <div>Generate a specification to see assumptions</div>
                                </div>
                            ) : (
                                <>
                                    <div style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                                        These assumptions were made based on inference rules. Edit any to override:
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                        {assumptions.map((assumption, i) => (
                                            <div
                                                key={i}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: 'var(--spacing-md)',
                                                    padding: 'var(--spacing-md)',
                                                    background: 'var(--color-bg-tertiary)',
                                                    borderRadius: 'var(--radius-md)'
                                                }}
                                            >
                                                <span style={{
                                                    width: 24,
                                                    height: 24,
                                                    background: 'rgba(245, 158, 11, 0.2)',
                                                    borderRadius: 'var(--radius-full)',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    fontSize: '12px',
                                                    color: 'var(--color-warning)'
                                                }}>
                                                    {i + 1}
                                                </span>
                                                <input
                                                    className="input"
                                                    value={assumption}
                                                    onChange={(e) => {
                                                        const newAssumptions = [...assumptions];
                                                        newAssumptions[i] = e.target.value;
                                                        setAssumptions(newAssumptions);
                                                    }}
                                                    style={{ flex: 1 }}
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* JSON Spec Tab */}
            {activeTab === 'json_spec' && (
                <div className="fade-in">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Complete Specification</h3>
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                {result && <span className="badge badge-success">Valid</span>}
                                <button className="btn btn-ghost" onClick={handleCopy} disabled={!result}>
                                    {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Copied!' : 'Copy'}
                                </button>
                                <button className="btn btn-ghost" onClick={handleDownload} disabled={!result}>
                                    <Download size={16} /> Download
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="json-editor" style={{ maxHeight: 500 }}>
                                <pre>{result ? JSON.stringify(result, null, 2) : '// Generate a specification to see results'}</pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Variations Tab */}
            {activeTab === 'variations' && (
                <div className="fade-in">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Parameter Variations</h3>
                        </div>
                        <div className="card-body">
                            <div style={{ marginBottom: 'var(--spacing-lg)', color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                                Adjust parameters to explore different directions:
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xl)' }}>
                                {/* Lens Slider */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                                        <Camera size={16} style={{ color: 'var(--color-accent-primary)' }} />
                                        <span style={{ fontWeight: 500 }}>Lens</span>
                                        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>85mm</span>
                                    </div>
                                    <input type="range" min="24" max="200" defaultValue="85" style={{ width: '100%' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                        <span>24mm (Wide)</span>
                                        <span>200mm (Telephoto)</span>
                                    </div>
                                </div>

                                {/* Lighting Slider */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                                        <Sun size={16} style={{ color: 'var(--color-warning)' }} />
                                        <span style={{ fontWeight: 500 }}>Lighting Intensity</span>
                                        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>Medium</span>
                                    </div>
                                    <input type="range" min="0" max="100" defaultValue="50" style={{ width: '100%' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                        <span>Soft/Diffused</span>
                                        <span>Hard/Dramatic</span>
                                    </div>
                                </div>

                                {/* Outfit Formality */}
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                                        <Shirt size={16} style={{ color: 'var(--color-success)' }} />
                                        <span style={{ fontWeight: 500 }}>Outfit Formality</span>
                                        <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontSize: '13px' }}>Business</span>
                                    </div>
                                    <input type="range" min="0" max="100" defaultValue="70" style={{ width: '100%' }} />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--color-text-muted)' }}>
                                        <span>Casual</span>
                                        <span>Formal</span>
                                    </div>
                                </div>
                            </div>

                            <button className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--spacing-xl)' }} disabled={!result}>
                                <SlidersHorizontal size={16} /> Apply Variations
                            </button>
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
