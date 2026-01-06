import { useState } from 'react';
import {
    Layers,
    Play,
    Pause,
    RefreshCw,
    Download,
    ChevronDown,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react';

type TabId = 'active' | 'completed' | 'failed';

interface BatchItem {
    id: string;
    module: string;
    imageCount: number;
    progress: number;
    status: 'running' | 'paused' | 'completed' | 'failed';
    createdAt: string;
}

const mockBatches: BatchItem[] = [
    { id: 'batch-001', module: 'grid_to_json', imageCount: 10, progress: 70, status: 'running', createdAt: '5 min ago' },
    { id: 'batch-002', module: 'vision_to_json', imageCount: 25, progress: 100, status: 'completed', createdAt: '1 hour ago' },
    { id: 'batch-003', module: 'grid_to_json', imageCount: 5, progress: 40, status: 'failed', createdAt: '2 hours ago' },
];

export default function BatchManager() {
    const [activeTab, setActiveTab] = useState<TabId>('active');
    const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);

    const tabs = [
        { id: 'active' as TabId, label: 'Active Batches', count: mockBatches.filter(b => b.status === 'running' || b.status === 'paused').length },
        { id: 'completed' as TabId, label: 'Completed', count: mockBatches.filter(b => b.status === 'completed').length },
        { id: 'failed' as TabId, label: 'Failed', count: mockBatches.filter(b => b.status === 'failed').length },
    ];

    const filteredBatches = mockBatches.filter(batch => {
        if (activeTab === 'active') return batch.status === 'running' || batch.status === 'paused';
        if (activeTab === 'completed') return batch.status === 'completed';
        if (activeTab === 'failed') return batch.status === 'failed';
        return true;
    });

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'running': return <Clock size={16} style={{ color: 'var(--color-info)' }} />;
            case 'completed': return <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />;
            case 'failed': return <XCircle size={16} style={{ color: 'var(--color-error)' }} />;
            case 'paused': return <Pause size={16} style={{ color: 'var(--color-warning)' }} />;
            default: return null;
        }
    };

    return (
        <div className="batch-manager-page fade-in">
            <div className="tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                        {tab.count > 0 && (
                            <span className="badge badge-info" style={{ marginLeft: 'var(--spacing-sm)' }}>{tab.count}</span>
                        )}
                    </button>
                ))}
            </div>

            {filteredBatches.length === 0 ? (
                <div className="card">
                    <div className="card-body" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                        <Layers size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-md)' }} />
                        <div style={{ fontWeight: 500, marginBottom: 'var(--spacing-sm)' }}>No batches found</div>
                        <button className="btn btn-primary" style={{ marginTop: 'var(--spacing-md)' }}>
                            <Layers size={16} /> Create New Batch
                        </button>
                    </div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                    {filteredBatches.map(batch => (
                        <div key={batch.id} className="card">
                            <div
                                className="card-header"
                                style={{ cursor: 'pointer' }}
                                onClick={() => setExpandedBatchId(expandedBatchId === batch.id ? null : batch.id)}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                    {getStatusIcon(batch.status)}
                                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{batch.id}</span>
                                    <span style={{ color: 'var(--color-text-secondary)' }}>{batch.module.replace('_', '-')}</span>
                                    <span className="badge badge-info">{batch.imageCount} images</span>
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                    <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{batch.createdAt}</span>
                                    <ChevronDown
                                        size={20}
                                        style={{
                                            transform: expandedBatchId === batch.id ? 'rotate(180deg)' : 'none',
                                            transition: 'transform 0.2s'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Progress Bar */}
                            <div style={{ padding: '0 var(--spacing-lg) var(--spacing-lg)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--spacing-xs)', fontSize: '13px' }}>
                                    <span>Progress</span>
                                    <span>{batch.progress}%</span>
                                </div>
                                <div style={{ height: 8, background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-full)' }}>
                                    <div
                                        style={{
                                            width: `${batch.progress}%`,
                                            height: '100%',
                                            background: batch.status === 'failed' ? 'var(--color-error)' : 'var(--color-accent-gradient)',
                                            borderRadius: 'var(--radius-full)',
                                            transition: 'width 0.3s'
                                        }}
                                    />
                                </div>
                            </div>

                            {/* Expanded Content */}
                            {expandedBatchId === batch.id && (
                                <div className="card-body" style={{ borderTop: '1px solid var(--color-border)' }}>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                                        {batch.status === 'running' && (
                                            <button className="btn btn-secondary">
                                                <Pause size={16} /> Pause
                                            </button>
                                        )}
                                        {batch.status === 'paused' && (
                                            <button className="btn btn-primary">
                                                <Play size={16} /> Resume
                                            </button>
                                        )}
                                        {batch.status === 'failed' && (
                                            <button className="btn btn-primary">
                                                <RefreshCw size={16} /> Retry Failed
                                            </button>
                                        )}
                                        {batch.status === 'completed' && (
                                            <button className="btn btn-primary">
                                                <Download size={16} /> Export
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
