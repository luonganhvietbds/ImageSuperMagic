import { useState, useEffect } from 'react';
import {
    Clock,
    CheckCircle,
    XCircle,
    RefreshCw,
    Eye,
    FileJson,
    Image as ImageIcon,
    Loader2,
    Trash2
} from 'lucide-react';
import { getAllJobs, getJobsByStatus, retryJob } from '../../services/job.service';
import { jobOperations } from '../../db';
import type { Job, JobStatus } from '../../types';

type TabId = 'all' | 'running' | 'failed';

export default function Jobs() {
    const [activeTab, setActiveTab] = useState<TabId>('all');
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState(false);

    const loadJobs = async () => {
        setLoading(true);
        try {
            const allJobs = await getAllJobs();
            setJobs(allJobs);
        } catch (error) {
            console.error('Failed to load jobs:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadJobs();
    }, []);

    const filteredJobs = jobs.filter(job => {
        if (activeTab === 'running') return job.status === 'running' || job.status === 'pending';
        if (activeTab === 'failed') return job.status === 'failed';
        return true;
    });

    const tabs = [
        { id: 'all' as TabId, label: 'All Jobs', count: jobs.length },
        { id: 'running' as TabId, label: 'Running', count: jobs.filter(j => j.status === 'running' || j.status === 'pending').length },
        { id: 'failed' as TabId, label: 'Failed', count: jobs.filter(j => j.status === 'failed').length },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <span className="badge badge-success">Completed</span>;
            case 'running': return <span className="badge badge-info">Running</span>;
            case 'failed': return <span className="badge badge-error">Failed</span>;
            case 'pending': return <span className="badge badge-warning">Pending</span>;
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

    const selectedJob = jobs.find(j => j.id === selectedJobId);

    const handleRetry = async () => {
        if (!selectedJobId) return;
        setRetrying(true);
        try {
            await retryJob(selectedJobId);
            await loadJobs();
        } catch (error) {
            console.error('Failed to retry job:', error);
        } finally {
            setRetrying(false);
        }
    };

    const handleDelete = async (jobId: string) => {
        try {
            await jobOperations.delete(jobId);
            setSelectedJobId(null);
            await loadJobs();
        } catch (error) {
            console.error('Failed to delete job:', error);
        }
    };

    return (
        <div className="jobs-page fade-in">
            <div className="tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => setActiveTab(tab.id)}
                    >
                        {tab.label}
                        <span className="badge badge-info" style={{ marginLeft: 'var(--spacing-sm)' }}>{tab.count}</span>
                    </button>
                ))}
            </div>

            <div className="grid grid-2" style={{ gridTemplateColumns: '1fr 400px' }}>
                {/* Jobs Table */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Jobs</h3>
                        <button className="btn btn-ghost" onClick={loadJobs} disabled={loading}>
                            {loading ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />} Refresh
                        </button>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
                        {loading ? (
                            <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                <Loader2 size={24} className="spin" />
                            </div>
                        ) : filteredJobs.length === 0 ? (
                            <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                <Clock size={32} style={{ marginBottom: 'var(--spacing-sm)' }} />
                                <div>No jobs found</div>
                            </div>
                        ) : (
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Job ID</th>
                                        <th>Module</th>
                                        <th>Status</th>
                                        <th>Prompt</th>
                                        <th>Time</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredJobs.map(job => (
                                        <tr
                                            key={job.id}
                                            onClick={() => setSelectedJobId(job.id)}
                                            style={{
                                                cursor: 'pointer',
                                                background: selectedJobId === job.id ? 'rgba(99, 102, 241, 0.1)' : undefined
                                            }}
                                        >
                                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{job.id.slice(0, 8)}...</td>
                                            <td>{getModuleLabel(job.module)}</td>
                                            <td>{getStatusBadge(job.status)}</td>
                                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{job.promptVersion}</td>
                                            <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{formatTime(job.createdAt)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>

                {/* Job Detail Drawer */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Job Details</h3>
                    </div>
                    <div className="card-body">
                        {selectedJob ? (
                            <div>
                                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 4 }}>JOB ID</div>
                                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '13px', wordBreak: 'break-all' }}>{selectedJob.id}</div>
                                </div>

                                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 4 }}>MODULE</div>
                                    <div>{getModuleLabel(selectedJob.module)}</div>
                                </div>

                                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 4 }}>STATUS</div>
                                    {getStatusBadge(selectedJob.status)}
                                </div>

                                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 4 }}>PROMPT VERSION</div>
                                    <div style={{ fontFamily: 'var(--font-mono)' }}>{selectedJob.promptVersion}</div>
                                </div>

                                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 4 }}>CREATED</div>
                                    <div>{new Date(selectedJob.createdAt).toLocaleString()}</div>
                                </div>

                                {selectedJob.error && (
                                    <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                        <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 4 }}>ERROR</div>
                                        <div style={{
                                            background: 'rgba(239, 68, 68, 0.1)',
                                            border: '1px solid rgba(239, 68, 68, 0.3)',
                                            borderRadius: 'var(--radius-md)',
                                            padding: 'var(--spacing-sm)',
                                            fontSize: '13px',
                                            color: 'var(--color-error)'
                                        }}>
                                            {selectedJob.error}
                                        </div>
                                    </div>
                                )}

                                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 4 }}>RETRIES</div>
                                    <div>{selectedJob.retryCount}</div>
                                </div>

                                <div style={{ display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
                                    {selectedJob.status === 'failed' && (
                                        <button
                                            className="btn btn-primary"
                                            onClick={handleRetry}
                                            disabled={retrying}
                                        >
                                            {retrying ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />} Retry
                                        </button>
                                    )}
                                    <button
                                        className="btn btn-secondary"
                                        onClick={() => handleDelete(selectedJob.id)}
                                    >
                                        <Trash2 size={16} /> Delete
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div style={{ color: 'var(--color-text-muted)', textAlign: 'center', padding: 'var(--spacing-xl)' }}>
                                <Clock size={32} style={{ marginBottom: 'var(--spacing-md)' }} />
                                <div>Select a job to view details</div>
                            </div>
                        )}
                    </div>
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
