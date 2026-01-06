import { useState } from 'react';
import {
    Image as ImageIcon,
    FileJson,
    Type,
    Package,
    Download,
    Trash2,
    Eye
} from 'lucide-react';

type TabId = 'images' | 'identity_json' | 'panel_json' | 'prompts' | 'generated' | 'exports';

interface AssetItem {
    id: string;
    filename: string;
    type: string;
    size: string;
    createdAt: string;
}

const mockAssets: Record<TabId, AssetItem[]> = {
    images: [
        { id: 'img-001', filename: 'portrait_01.jpg', type: 'image/jpeg', size: '2.4 MB', createdAt: '1 hour ago' },
        { id: 'img-002', filename: 'portrait_02.png', type: 'image/png', size: '3.1 MB', createdAt: '2 hours ago' },
    ],
    identity_json: [
        { id: 'id-001', filename: 'identity_portrait_01.json', type: 'application/json', size: '12 KB', createdAt: '1 hour ago' },
    ],
    panel_json: [
        { id: 'panel-001', filename: 'panel_1_portrait_01.json', type: 'application/json', size: '8 KB', createdAt: '1 hour ago' },
        { id: 'panel-002', filename: 'panel_2_portrait_01.json', type: 'application/json', size: '8 KB', createdAt: '1 hour ago' },
    ],
    prompts: [
        { id: 'prompt-001', filename: 'grid_prompt_portrait_01.txt', type: 'text/plain', size: '4 KB', createdAt: '1 hour ago' },
    ],
    generated: [
        { id: 'gen-001', filename: 'grid_portrait_01.png', type: 'image/png', size: '5.2 MB', createdAt: '30 min ago' },
    ],
    exports: [
        { id: 'exp-001', filename: 'batch_42_export.zip', type: 'application/zip', size: '45 MB', createdAt: '1 hour ago' },
    ],
};

export default function Assets() {
    const [activeTab, setActiveTab] = useState<TabId>('images');

    const tabs = [
        { id: 'images' as TabId, label: 'Images', icon: ImageIcon },
        { id: 'identity_json' as TabId, label: 'Identity JSON', icon: FileJson },
        { id: 'panel_json' as TabId, label: 'Panel JSON', icon: FileJson },
        { id: 'prompts' as TabId, label: 'Prompts', icon: Type },
        { id: 'generated' as TabId, label: 'Generated', icon: ImageIcon },
        { id: 'exports' as TabId, label: 'Exports', icon: Package },
    ];

    const currentAssets = mockAssets[activeTab];

    return (
        <div className="assets-page fade-in">
            <div className="tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        <tab.icon size={16} style={{ marginRight: 'var(--spacing-xs)' }} />
                        {tab.label}
                        <span className="badge badge-info" style={{ marginLeft: 'var(--spacing-sm)' }}>
                            {mockAssets[tab.id].length}
                        </span>
                    </button>
                ))}
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">{tabs.find(t => t.id === activeTab)?.label}</h3>
                </div>
                <div className="card-body">
                    {currentAssets.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-muted)' }}>
                            No assets found
                        </div>
                    ) : (
                        <div className="grid grid-4">
                            {currentAssets.map(asset => (
                                <div
                                    key={asset.id}
                                    className="card"
                                    style={{
                                        padding: 'var(--spacing-md)',
                                        cursor: 'pointer',
                                        transition: 'all var(--transition-fast)'
                                    }}
                                >
                                    {/* Preview */}
                                    <div style={{
                                        height: 100,
                                        background: 'var(--color-bg-tertiary)',
                                        borderRadius: 'var(--radius-md)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        marginBottom: 'var(--spacing-md)'
                                    }}>
                                        {asset.type.startsWith('image') ? (
                                            <ImageIcon size={32} style={{ color: 'var(--color-text-muted)' }} />
                                        ) : asset.type === 'application/json' ? (
                                            <FileJson size={32} style={{ color: 'var(--color-accent-primary)' }} />
                                        ) : asset.type === 'application/zip' ? (
                                            <Package size={32} style={{ color: 'var(--color-success)' }} />
                                        ) : (
                                            <Type size={32} style={{ color: 'var(--color-text-muted)' }} />
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div style={{
                                        fontSize: '13px',
                                        fontWeight: 500,
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                        whiteSpace: 'nowrap',
                                        marginBottom: 4
                                    }}>
                                        {asset.filename}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-sm)' }}>
                                        {asset.size} • {asset.createdAt}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                        <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} title="Preview">
                                            <Eye size={14} />
                                        </button>
                                        <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} title="Download">
                                            <Download size={14} />
                                        </button>
                                        <button className="btn btn-ghost btn-icon" style={{ padding: 4 }} title="Delete">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
