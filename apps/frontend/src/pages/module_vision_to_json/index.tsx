import { useState } from 'react';
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
    Move
} from 'lucide-react';

type TabId = 'input' | 'objects' | 'relationships' | 'text_ocr' | 'json_output';

interface DetectedObject {
    id: string;
    label: string;
    category: string;
    location: string;
    prominence: string;
}

const mockObjects: DetectedObject[] = [
    { id: 'obj_001', label: 'Person', category: 'Human', location: 'Center', prominence: 'Foreground' },
    { id: 'obj_002', label: 'Wooden Table', category: 'Furniture', location: 'Bottom-center', prominence: 'Foreground' },
    { id: 'obj_003', label: 'Coffee Cup', category: 'Object', location: 'Center-right', prominence: 'Foreground' },
    { id: 'obj_004', label: 'Window', category: 'Architecture', location: 'Background-left', prominence: 'Background' },
    { id: 'obj_005', label: 'Potted Plant', category: 'Plant', location: 'Right', prominence: 'Background' },
];

const mockRelationships = [
    'Person is sitting at Wooden Table',
    'Coffee Cup is on Wooden Table',
    'Window is behind Person',
    'Potted Plant is next to Window',
    'Light from Window is illuminating Person'
];

const mockVisionJson = {
    meta: {
        image_quality: "High",
        image_type: "Photo",
        resolution_estimation: "4000x3000"
    },
    global_context: {
        scene_description: "An indoor café scene with natural lighting...",
        time_of_day: "Late afternoon",
        lighting: { source: "Natural", direction: "Side-lit from left" }
    },
    objects: mockObjects,
    semantic_relationships: mockRelationships
};

export default function VisionToJson() {
    const [activeTab, setActiveTab] = useState<TabId>('input');
    const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
    const [hasImage, setHasImage] = useState(false);

    const tabs = [
        { id: 'input' as TabId, label: 'Input', icon: ImageIcon },
        { id: 'objects' as TabId, label: 'Objects', icon: Box },
        { id: 'relationships' as TabId, label: 'Relationships', icon: LinkIcon },
        { id: 'text_ocr' as TabId, label: 'Text OCR', icon: Type },
        { id: 'json_output' as TabId, label: 'JSON Output', icon: FileJson },
    ];

    return (
        <div className="vision-to-json-page fade-in">
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
                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                    <button className="btn btn-ghost btn-icon" title="Zoom">
                                        <ZoomIn size={18} />
                                    </button>
                                    <button className="btn btn-ghost btn-icon" title="Pan">
                                        <Move size={18} />
                                    </button>
                                </div>
                            </div>
                            <div className="card-body">
                                {!hasImage ? (
                                    <div
                                        className="upload-area"
                                        style={{ height: 400 }}
                                        onClick={() => setHasImage(true)}
                                    >
                                        <Upload size={48} style={{ color: 'var(--color-accent-primary)', marginBottom: 'var(--spacing-md)' }} />
                                        <div style={{ fontWeight: 500, marginBottom: 'var(--spacing-xs)' }}>Drop any image here</div>
                                        <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                                            Photos, illustrations, screenshots, diagrams...
                                        </div>
                                    </div>
                                ) : (
                                    <div style={{
                                        height: 400,
                                        background: 'var(--color-bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        position: 'relative'
                                    }}>
                                        <div style={{ color: 'var(--color-text-muted)' }}>Image Preview with Inspect Cursor</div>
                                        {/* Bounding box overlays would go here */}
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
                                <button className="btn btn-primary" style={{ width: '100%', marginBottom: 'var(--spacing-md)' }} disabled={!hasImage}>
                                    <Play size={16} /> Analyze Image
                                </button>

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

                                <div style={{ fontSize: '13px', color: 'var(--color-text-muted)' }}>
                                    VisionStruct will capture 100% of visual data in a machine-readable JSON format.
                                </div>
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
                                <span className="badge badge-info">{mockObjects.length}</span>
                            </div>
                            <div className="card-body" style={{ padding: 0 }}>
                                {mockObjects.map(obj => (
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
                                ))}
                            </div>
                        </div>

                        {/* Image with Bounding Boxes */}
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
                                    color: 'var(--color-text-muted)'
                                }}>
                                    Image with Bounding Boxes
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
                                    <div>
                                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 4 }}>LABEL</div>
                                            <div style={{ fontWeight: 600 }}>{mockObjects.find(o => o.id === selectedObjectId)?.label}</div>
                                        </div>
                                        <div style={{ marginBottom: 'var(--spacing-md)' }}>
                                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 4 }}>VISUAL ATTRIBUTES</div>
                                            <div style={{ fontSize: '14px', color: 'var(--color-text-secondary)' }}>
                                                <div>Color: Warm brown tones</div>
                                                <div>Texture: Smooth wood grain</div>
                                                <div>Material: Oak wood</div>
                                                <div>State: Well-maintained</div>
                                            </div>
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 4 }}>MICRO DETAILS</div>
                                            <div style={{ fontSize: '13px', color: 'var(--color-text-secondary)' }}>
                                                • Subtle wood grain patterns visible
                                                <br />• Light reflection on surface
                                                <br />• Small scuff mark on corner
                                            </div>
                                        </div>
                                    </div>
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
                        </div>
                        <div className="card-body">
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: 'var(--spacing-md)'
                            }}>
                                {mockRelationships.map((rel, i) => (
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
                            <div style={{
                                textAlign: 'center',
                                padding: 'var(--spacing-2xl)',
                                color: 'var(--color-text-muted)'
                            }}>
                                <Type size={48} style={{ marginBottom: 'var(--spacing-md)' }} />
                                <div style={{ fontWeight: 500 }}>No text detected in image</div>
                                <div style={{ fontSize: '14px', marginTop: 'var(--spacing-sm)' }}>
                                    Upload an image with visible text to extract OCR data
                                </div>
                            </div>
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
                                <button className="btn btn-ghost">
                                    <Copy size={16} /> Copy
                                </button>
                                <button className="btn btn-ghost">
                                    <Download size={16} /> Download
                                </button>
                            </div>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'flex', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-md)' }}>
                                <span className="badge badge-success">Schema Valid</span>
                                <span className="badge badge-info">5 Objects</span>
                                <span className="badge badge-info">5 Relationships</span>
                            </div>
                            <div className="json-editor" style={{ maxHeight: 500 }}>
                                <pre>{JSON.stringify(mockVisionJson, null, 2)}</pre>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
