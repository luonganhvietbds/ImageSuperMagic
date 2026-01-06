import { useState } from 'react';
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
    Shirt
} from 'lucide-react';

type TabId = 'builder' | 'assumptions' | 'json_spec' | 'variations';
type InputMode = 'text' | 'image' | 'hybrid';

const mockAssumptions = [
    'Age range: 25-30 (fashion style default)',
    'Expression: Neutral with direct eye contact',
    'Camera: 85mm lens at f/2.8',
    'Lighting: Controlled studio with softbox',
    'Background: Studio seamless, neutral gray',
    'Post-processing: Moderate color grading'
];

const mockRealisticJson = {
    meta: {
        intent: "Fashion editorial portrait",
        priorities: ["Subject presence", "Lighting quality", "Wardrobe detail"]
    },
    subject: {
        identity: "Young professional woman",
        demographics: { age_range: "25-30", gender_presentation: "Feminine" },
        expression: "Confident, slight smile",
        pose: "Standing, 3/4 turn toward camera"
    },
    wardrobe: [
        { garment: "Tailored blazer", material: "Wool blend", color: "#2C3E50", fit: "Fitted" }
    ],
    lighting: {
        key: "Softbox 45° camera left",
        fill: "Reflector camera right",
        rim: "Hair light from above"
    },
    camera: {
        lens: "85mm",
        aperture: "f/2.8",
        focus: "Eyes sharp"
    }
};

export default function RealisticToJson() {
    const [activeTab, setActiveTab] = useState<TabId>('builder');
    const [inputMode, setInputMode] = useState<InputMode>('text');
    const [textInput, setTextInput] = useState('');
    const [assumptions, setAssumptions] = useState(mockAssumptions);

    const tabs = [
        { id: 'builder' as TabId, label: 'Builder' },
        { id: 'assumptions' as TabId, label: 'Assumptions' },
        { id: 'json_spec' as TabId, label: 'JSON Spec' },
        { id: 'variations' as TabId, label: 'Variations' },
    ];

    return (
        <div className="realistic-to-json-page fade-in">
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
                                                    <input className="input" placeholder="e.g., Young professional woman" />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Style</label>
                                                    <select className="input">
                                                        <option>Fashion/Editorial</option>
                                                        <option>Portrait</option>
                                                        <option>Street/Documentary</option>
                                                        <option>Dynamic/Action</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Environment</label>
                                                    <input className="input" placeholder="e.g., Modern studio" />
                                                </div>
                                                <div>
                                                    <label style={{ fontSize: '13px', color: 'var(--color-text-secondary)', display: 'block', marginBottom: 4 }}>Camera</label>
                                                    <input className="input" placeholder="e.g., 85mm portrait lens" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {inputMode === 'image' && (
                                    <div className="upload-area" style={{ height: 300 }}>
                                        <ImageIcon size={48} style={{ color: 'var(--color-accent-primary)', marginBottom: 'var(--spacing-md)' }} />
                                        <div style={{ fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>Drop reference image</div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                                            System will reverse-engineer all visual elements
                                        </div>
                                    </div>
                                )}

                                {inputMode === 'hybrid' && (
                                    <div>
                                        <div className="upload-area" style={{ height: 150, marginBottom: 'var(--spacing-md)' }}>
                                            <ImageIcon size={32} style={{ color: 'var(--color-accent-primary)' }} />
                                            <div style={{ fontSize: '13px', marginTop: 'var(--spacing-sm)' }}>Reference image (base)</div>
                                        </div>
                                        <textarea
                                            className="input"
                                            style={{ height: 100, resize: 'vertical' }}
                                            placeholder="Modifications to apply...

Example: Change outfit to red evening gown, add dramatic backlight..."
                                        />
                                    </div>
                                )}

                                <button className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--spacing-lg)' }}>
                                    <Play size={16} /> Generate Specification
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
                                <span className="badge badge-success">Valid</span>
                                <button className="btn btn-ghost">
                                    <Copy size={16} /> Copy
                                </button>
                                <button className="btn btn-ghost">
                                    <Download size={16} /> Download
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            <div className="json-editor" style={{ maxHeight: 500 }}>
                                <pre>{JSON.stringify(mockRealisticJson, null, 2)}</pre>
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

                                {/* Outfit Intensity */}
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

                            <button className="btn btn-primary" style={{ width: '100%', marginTop: 'var(--spacing-xl)' }}>
                                <SlidersHorizontal size={16} /> Apply Variations
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
