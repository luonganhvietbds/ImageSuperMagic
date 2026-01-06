import { useState, useEffect } from 'react';
import {
    Layers,
    Play,
    Pause,
    RefreshCw,
    Download,
    ChevronDown,
    CheckCircle,
    XCircle,
    Clock,
    Loader2,
    Trash2,
    Plus
} from 'lucide-react';
import { batchOperations, generateUUID } from '../../db';
import type { Batch, BatchStatus } from '../../types';

type TabId = 'active' | 'completed' | 'failed';

export default function BatchManager() {
    const [activeTab, setActiveTab] = useState<TabId>('active');
    const [expandedBatchId, setExpandedBatchId] = useState<string | null>(null);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);

    const loadBatches = async () => {
        setLoading(true);
        try {
            const all = await batchOperations.getAll();
            setBatches(all);
        } catch (error) {
            console.error('Failed to load batches:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBatches();
    }, []);

    const filteredBatches = batches.filter(batch => {
        if (activeTab === 'active') return batch.status === 'running' || batch.status === 'paused' || batch.status === 'pending';
        if (activeTab === 'completed') return batch.status === 'completed';
        if (activeTab === 'failed') return batch.status === 'failed';
        return true;
    });

    const tabs = [
        { id: 'active' as TabId, label: 'Active Batches', count: batches.filter(b => b.status === 'running' || b.status === 'paused' || b.status === 'pending').length },
        { id: 'completed' as TabId, label: 'Completed', count: batches.filter(b => b.status === 'completed').length },
        { id: 'failed' as TabId, label: 'Failed', count: batches.filter(b => b.status === 'failed').length },
    ];

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'running': return <Clock size={16} style={{ color: 'var(--color-info)' }} />;
            case 'completed': return <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />;
            case 'failed': return <XCircle size={16} style={{ color: 'var(--color-error)' }} />;
            case 'paused': return <Pause size={16} style={{ color: 'var(--color-warning)' }} />;
            case 'pending': return <Clock size={16} style={{ color: 'var(--color-text-muted)' }} />;
            default: return null;
        }
    };

    const getModuleLabel = (module: string) => {
        switch (module) {
            case 'grid_to_json': return 'Grid-to-JSON';
            case 'vision_to_json': return 'Vision-to-JSON';
            case 'realistic_to_json': return 'Realistic-to-JSON';
            default: return module;
        }
    };

    const formatTime = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hr ago`;
        return new Date(timestamp).toLocaleDateString();
    };

    const handleUpdateStatus = async (batchId: string, status: BatchStatus) => {
        try {
            await batchOperations.updateStatus(batchId, status);
            await loadBatches();
        } catch (error) {
            console.error('Failed to update batch:', error);
        }
    };

    const handleDelete = async (batchId: string) => {
        try {
            await batchOperations.delete(batchId);
            await loadBatches();
        } catch (error) {
            console.error('Failed to delete batch:', error);
        }
    };

    const handleCreateBatch = async () => {
        const newBatch: Batch = {
            id: generateUUID(),
            module: 'grid_to_json',
            jobIds: [],
            totalJobs: 0,
            completedJobs: 0,
            failedJobs: 0,
            status: 'pending',
            createdAt: Date.now(),
            updatedAt: Date.now()
        };
        try {
            await batchOperations.create(newBatch);
            await loadBatches();
        } catch (error) {
            console.error('Failed to create batch:', error);
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

            {loading ? (
                <div style={{ textAlign: 'center', padding: 'var(--spacing-2xl)', color: 'var(--color-text-muted)' }}>
                    <Loader2 size={32} className="spin" />
                </div>
            ) : filteredBatches.length === 0 ? (
                <div className="card">
                    <div className="card-body" style={{ textAlign: 'center', padding: 'var(--spacing-2xl)' }}>
                        <Layers size={48} style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-md)' }} />
                        <div style={{ fontWeight: 500, marginBottom: 'var(--spacing-sm)' }}>No batches found</div>
                        <div style={{ fontSize: '14px', color: 'var(--color-text-muted)', marginBottom: 'var(--spacing-lg)' }}>
                            Create a batch to process multiple images at once
                        </div>
                        <button className="btn btn-primary" onClick={handleCreateBatch}>
                            <Plus size={16} /> Create New Batch
                        </button>
                    </div>
                </div>
            ) : (
                <>
                    <div style={{ marginBottom: 'var(--spacing-md)', display: 'flex', justifyContent: 'flex-end' }}>
                        <button className="btn btn-primary" onClick={handleCreateBatch}>
                            <Plus size={16} /> New Batch
                        </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                        {filteredBatches.map(batch => {
                            const progress = batch.totalJobs > 0
                                ? Math.round((batch.completedJobs / batch.totalJobs) * 100)
                                : 0;

                            return (
                                <div key={batch.id} className="card">
                                    <div
                                        className="card-header"
                                        style={{ cursor: 'pointer' }}
                                        onClick={() => setExpandedBatchId(expandedBatchId === batch.id ? null : batch.id)}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                            {getStatusIcon(batch.status)}
                                            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                                                {batch.id.slice(0, 8)}...
                                            </span>
                                            <span style={{ color: 'var(--color-text-secondary)' }}>
                                                {getModuleLabel(batch.module)}
                                            </span>
                                            <span className="badge badge-info">{batch.totalJobs} jobs</span>
                                        </div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-md)' }}>
                                            <span style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                                                {formatTime(batch.createdAt)}
                                            </span>
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
                                            <span>{batch.completedJobs}/{batch.totalJobs} ({progress}%)</span>
                                        </div>
                                        <div style={{ height: 8, background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-full)' }}>
                                            <div
                                                style={{
                                                    width: `${progress}%`,
                                                    height: '100%',
                                                    background: batch.status === 'failed' ? 'var(--color-error)' : 'var(--color-accent-gradient)',
                                                    borderRadius: 'var(--radius-full)',
                                                    transition: 'width 0.3s'
                                                }}
                                            />
                                        </div>
                                        {batch.failedJobs > 0 && (
                                            <div style={{ fontSize: '12px', color: 'var(--color-error)', marginTop: 'var(--spacing-xs)' }}>
                                                {batch.failedJobs} failed
                                            </div>
                                        )}
                                    </div>

                                    {/* Expanded Content */}
                                    {expandedBatchId === batch.id && (
                                        <div className="card-body" style={{ borderTop: '1px solid var(--color-border)' }}>
                                            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                                                {batch.status === 'running' && (
                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={() => handleUpdateStatus(batch.id, 'paused')}
                                                    >
                                                        <Pause size={16} /> Pause
                                                    </button>
                                                )}
                                                {batch.status === 'paused' && (
                                                    <button
                                                        className="btn btn-primary"
                                                        onClick={() => handleUpdateStatus(batch.id, 'running')}
                                                    >
                                                        <Play size={16} /> Resume
                                                    </button>
                                                )}
                                                {batch.status === 'failed' && (
                                                    <button
                                                        className="btn btn-primary"
                                                        onClick={() => handleUpdateStatus(batch.id, 'pending')}
                                                    >
                                                        <RefreshCw size={16} /> Retry Failed
                                                    </button>
                                                )}
                                                {batch.status === 'completed' && (
                                                    <button className="btn btn-primary">
                                                        <Download size={16} /> Export
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-ghost"
                                                    onClick={() => handleDelete(batch.id)}
                                                >
                                                    <Trash2 size={16} /> Delete
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </>
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
