import { useState } from 'react';
import {
    Clock,
    CheckCircle,
    XCircle,
    RefreshCw,
    Eye,
    FileJson,
    Image as ImageIcon
} from 'lucide-react';

type TabId = 'all' | 'running' | 'failed';

interface JobItem {
    id: string;
    module: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    promptVersion: string;
    createdAt: string;
    duration?: string;
}

const mockJobs: JobItem[] = [
    { id: 'job-001', module: 'grid_to_json', status: 'running', promptVersion: 'v1.0.0', createdAt: '2 min ago' },
    { id: 'job-002', module: 'vision_to_json', status: 'completed', promptVersion: 'v1.0.0', createdAt: '5 min ago', duration: '45s' },
    { id: 'job-003', module: 'realistic_to_json', status: 'failed', promptVersion: 'v1.0.0', createdAt: '10 min ago' },
    { id: 'job-004', module: 'grid_to_json', status: 'completed', promptVersion: 'v1.0.0', createdAt: '15 min ago', duration: '1m 23s' },
    { id: 'job-005', module: 'grid_to_json', status: 'pending', promptVersion: 'v1.0.0', createdAt: '20 min ago' },
];

export default function Jobs() {
    const [activeTab, setActiveTab] = useState<TabId>('all');
    const [selectedJobId, setSelectedJobId] = useState<string | null>(null);

    const tabs = [
        { id: 'all' as TabId, label: 'All Jobs', count: mockJobs.length },
        { id: 'running' as TabId, label: 'Running', count: mockJobs.filter(j => j.status === 'running' || j.status === 'pending').length },
        { id: 'failed' as TabId, label: 'Failed', count: mockJobs.filter(j => j.status === 'failed').length },
    ];

    const filteredJobs = mockJobs.filter(job => {
        if (activeTab === 'running') return job.status === 'running' || job.status === 'pending';
        if (activeTab === 'failed') return job.status === 'failed';
        return true;
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <span className="badge badge-success">Completed</span>;
            case 'running': return <span className="badge badge-info">Running</span>;
            case 'failed': return <span className="badge badge-error">Failed</span>;
            case 'pending': return <span className="badge badge-warning">Pending</span>;
            default: return null;
        }
    };

    const selectedJob = mockJobs.find(j => j.id === selectedJobId);

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
                        <button className="btn btn-ghost">
                            <RefreshCw size={16} /> Refresh
                        </button>
                    </div>
                    <div className="card-body" style={{ padding: 0 }}>
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
                                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{job.id}</td>
                                        <td>{job.module.replace(/_/g, '-')}</td>
                                        <td>{getStatusBadge(job.status)}</td>
                                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>{job.promptVersion}</td>
                                        <td style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{job.createdAt}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
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
                                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{selectedJob.id}</div>
                                </div>

                                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 4 }}>STATUS</div>
                                    {getStatusBadge(selectedJob.status)}
                                </div>

                                <div style={{ marginBottom: 'var(--spacing-lg)' }}>
                                    <div style={{ fontSize: '12px', color: 'var(--color-text-muted)', marginBottom: 4 }}>SNAPSHOTS</div>
                                    <div style={{ display: 'flex', gap: 'var(--spacing-sm)' }}>
                                        <button className="btn btn-secondary" style={{ fontSize: '12px' }}>
                                            <ImageIcon size={14} /> Input
                                        </button>
                                        <button className="btn btn-secondary" style={{ fontSize: '12px' }}>
                                            <FileJson size={14} /> Prompt
                                        </button>
                                        <button className="btn btn-secondary" style={{ fontSize: '12px' }}>
                                            <Eye size={14} /> Output
                                        </button>
                                    </div>
                                </div>

                                {selectedJob.status === 'failed' && (
                                    <button className="btn btn-primary" style={{ width: '100%' }}>
                                        <RefreshCw size={16} /> Retry Job
                                    </button>
                                )}
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
        </div>
    );
}
