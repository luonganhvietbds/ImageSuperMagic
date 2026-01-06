import { useState, useEffect } from 'react';
import {
    Image as ImageIcon,
    FileJson,
    Type,
    Package,
    Download,
    Trash2,
    Eye,
    Loader2,
    RefreshCw
} from 'lucide-react';
import { assetOperations } from '../../db';
import type { Asset, AssetType } from '../../types';

type TabId = 'all' | 'source_image' | 'identity_json' | 'panel_json' | 'grid_prompt' | 'generated_image';

export default function Assets() {
    const [activeTab, setActiveTab] = useState<TabId>('all');
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);

    const loadAssets = async () => {
        setLoading(true);
        try {
            const allAssets = await assetOperations.getAll();
            setAssets(allAssets);
        } catch (error) {
            console.error('Failed to load assets:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAssets();
    }, []);

    const getAssetsByType = (type: AssetType): Asset[] => {
        return assets.filter(a => a.type === type);
    };

    const filteredAssets = activeTab === 'all'
        ? assets
        : assets.filter(a => a.type === activeTab);

    const tabs = [
        { id: 'all' as TabId, label: 'All', icon: Package, count: assets.length },
        { id: 'source_image' as TabId, label: 'Images', icon: ImageIcon, count: getAssetsByType('source_image').length },
        { id: 'identity_json' as TabId, label: 'Identity JSON', icon: FileJson, count: getAssetsByType('identity_json').length },
        { id: 'panel_json' as TabId, label: 'Panel JSON', icon: FileJson, count: getAssetsByType('panel_json').length },
        { id: 'grid_prompt' as TabId, label: 'Prompts', icon: Type, count: getAssetsByType('grid_prompt').length },
        { id: 'generated_image' as TabId, label: 'Generated', icon: ImageIcon, count: getAssetsByType('generated_image').length },
    ];

    const formatTime = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hr ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    const formatSize = (bytes?: number) => {
        if (!bytes) return 'N/A';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    const getAssetIcon = (type: AssetType) => {
        switch (type) {
            case 'source_image':
            case 'generated_image':
                return <ImageIcon size={32} style={{ color: 'var(--color-text-muted)' }} />;
            case 'identity_json':
            case 'panel_json':
                return <FileJson size={32} style={{ color: 'var(--color-accent-primary)' }} />;
            case 'grid_prompt':
                return <Type size={32} style={{ color: 'var(--color-warning)' }} />;
            default:
                return <Package size={32} style={{ color: 'var(--color-text-muted)' }} />;
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await assetOperations.delete(id);
            await loadAssets();
        } catch (error) {
            console.error('Failed to delete asset:', error);
        }
    };

    const handleDownload = (asset: Asset) => {
        if (!asset.data) return;

        let blob: Blob;
        let filename = asset.filename || `asset-${asset.id}`;

        if (asset.type === 'source_image' || asset.type === 'generated_image') {
            // For images stored as base64
            const byteString = atob(asset.data.split(',')[1] || asset.data);
            const ab = new ArrayBuffer(byteString.length);
            const ia = new Uint8Array(ab);
            for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            blob = new Blob([ab], { type: asset.mimeType || 'image/png' });
        } else {
            // For JSON/text data
            blob = new Blob([asset.data], { type: 'application/json' });
            if (!filename.endsWith('.json')) filename += '.json';
        }

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        URL.revokeObjectURL(url);
    };

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
                            {tab.count}
                        </span>
                    </button>
                ))}
            </div>

            <div className="card">
                <div className="card-header">
                    <h3 className="card-title">{tabs.find(t => t.id === activeTab)?.label}</h3>
                    <button className="btn btn-ghost" onClick={loadAssets} disabled={loading}>
                        {loading ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />} Refresh
                    </button>
                </div>
                <div className="card-body">
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-muted)' }}>
                            <Loader2 size={32} className="spin" />
                        </div>
                    ) : filteredAssets.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-muted)' }}>
                            <Package size={48} style={{ marginBottom: 'var(--spacing-md)' }} />
                            <div>No assets found</div>
                            <div style={{ fontSize: '13px', marginTop: 'var(--spacing-sm)' }}>
                                Assets will appear here as you process images
                            </div>
                        </div>
                    ) : (
                        <div className="grid grid-4">
                            {filteredAssets.map(asset => (
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
                                        marginBottom: 'var(--spacing-md)',
                                        overflow: 'hidden'
                                    }}>
                                        {(asset.type === 'source_image' || asset.type === 'generated_image') && asset.data ? (
                                            <img
                                                src={asset.data.startsWith('data:') ? asset.data : `data:${asset.mimeType};base64,${asset.data}`}
                                                alt={asset.filename}
                                                style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
                                            />
                                        ) : (
                                            getAssetIcon(asset.type)
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
                                        {asset.filename || `${asset.type}-${asset.id.slice(0, 8)}`}
                                    </div>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-sm)' }}>
                                        {formatSize(asset.sizeBytes)} • {formatTime(asset.createdAt)}
                                    </div>

                                    {/* Actions */}
                                    <div style={{ display: 'flex', gap: 'var(--spacing-xs)' }}>
                                        <button
                                            className="btn btn-ghost btn-icon"
                                            style={{ padding: 4 }}
                                            title="Download"
                                            onClick={() => handleDownload(asset)}
                                        >
                                            <Download size={14} />
                                        </button>
                                        <button
                                            className="btn btn-ghost btn-icon"
                                            style={{ padding: 4 }}
                                            title="Delete"
                                            onClick={() => handleDelete(asset.id)}
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

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
