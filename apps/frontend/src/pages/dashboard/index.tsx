import { useState, useEffect } from 'react';
import {
    Image as ImageIcon,
    FileJson,
    Clock,
    AlertCircle,
    Upload,
    Layers,
    Brain,
    Activity,
    CheckCircle,
    XCircle,
    RefreshCw
} from 'lucide-react';

// Mock data for demonstration
const mockStats = {
    totalImages: 1234,
    totalJson: 3456,
    activeJobs: 5,
    failedJobs: 2
};

const mockRecentJobs = [
    { id: 'job-001', module: 'grid_to_json', status: 'completed', time: '2 min ago', promptVersion: 'v1.0.0' },
    { id: 'job-002', module: 'vision_to_json', status: 'running', time: '5 min ago', promptVersion: 'v1.0.0' },
    { id: 'job-003', module: 'realistic_to_json', status: 'failed', time: '10 min ago', promptVersion: 'v1.0.0' },
    { id: 'job-004', module: 'grid_to_json', status: 'completed', time: '15 min ago', promptVersion: 'v1.0.0' },
    { id: 'job-005', module: 'grid_to_json', status: 'pending', time: '20 min ago', promptVersion: 'v1.0.0' },
];

const mockWorkerStatus = [
    { name: 'Grid-to-JSON Worker', status: 'running', jobs: 3 },
    { name: 'Vision-to-JSON Worker', status: 'running', jobs: 1 },
    { name: 'Realistic-to-JSON Worker', status: 'idle', jobs: 0 },
];

const mockActivity = [
    { type: 'batch_completed', message: 'Batch #42 completed with 10 images', time: '1 min ago' },
    { type: 'prompt_updated', message: 'Grid-to-JSON prompt updated to v1.0.1', time: '5 min ago' },
    { type: 'batch_started', message: 'Batch #43 started with 5 images', time: '8 min ago' },
    { type: 'job_failed', message: 'Job #789 failed - API quota exceeded', time: '12 min ago' },
];

type TabId = 'overview' | 'health' | 'activity';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState<TabId>('overview');

    const tabs = [
        { id: 'overview' as TabId, label: 'Overview' },
        { id: 'health' as TabId, label: 'System Health' },
        { id: 'activity' as TabId, label: 'Activity' },
    ];

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'completed': return <span className="badge badge-success">Completed</span>;
            case 'running': return <span className="badge badge-info">Running</span>;
            case 'failed': return <span className="badge badge-error">Failed</span>;
            case 'pending': return <span className="badge badge-warning">Pending</span>;
            default: return <span className="badge">{status}</span>;
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

    return (
        <div className="dashboard fade-in">
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

            {/* Overview Tab */}
            {activeTab === 'overview' && (
                <div className="fade-in">
                    {/* KPI Cards */}
                    <div className="grid grid-4" style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <div className="card kpi-card">
                            <div className="kpi-value">{mockStats.totalImages.toLocaleString()}</div>
                            <div className="kpi-label">Total Images Processed</div>
                            <ImageIcon size={24} style={{ color: 'var(--color-accent-primary)', marginTop: 'var(--spacing-md)' }} />
                        </div>
                        <div className="card kpi-card">
                            <div className="kpi-value">{mockStats.totalJson.toLocaleString()}</div>
                            <div className="kpi-label">Total JSON Generated</div>
                            <FileJson size={24} style={{ color: 'var(--color-accent-secondary)', marginTop: 'var(--spacing-md)' }} />
                        </div>
                        <div className="card kpi-card">
                            <div className="kpi-value">{mockStats.activeJobs}</div>
                            <div className="kpi-label">Active Jobs</div>
                            <Clock size={24} style={{ color: 'var(--color-info)', marginTop: 'var(--spacing-md)' }} />
                        </div>
                        <div className="card kpi-card">
                            <div className="kpi-value">{mockStats.failedJobs}</div>
                            <div className="kpi-label">Failed Jobs</div>
                            <AlertCircle size={24} style={{ color: 'var(--color-error)', marginTop: 'var(--spacing-md)' }} />
                        </div>
                    </div>

                    {/* Recent Jobs Table */}
                    <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <div className="card-header">
                            <h3 className="card-title">Recent Jobs</h3>
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
                                        <th>Time</th>
                                        <th>Prompt Version</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {mockRecentJobs.map((job) => (
                                        <tr key={job.id}>
                                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{job.id}</td>
                                            <td>{getModuleLabel(job.module)}</td>
                                            <td>{getStatusBadge(job.status)}</td>
                                            <td style={{ color: 'var(--color-text-secondary)' }}>{job.time}</td>
                                            <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{job.promptVersion}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Quick Actions</h3>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                                <button className="btn btn-primary">
                                    <Upload size={16} /> Upload Image
                                </button>
                                <button className="btn btn-secondary">
                                    <Layers size={16} /> Create Batch
                                </button>
                                <button className="btn btn-secondary">
                                    <Brain size={16} /> Open Prompt Brain
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* System Health Tab */}
            {activeTab === 'health' && (
                <div className="fade-in">
                    {/* Worker Status */}
                    <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <div className="card-header">
                            <h3 className="card-title">Worker Status</h3>
                        </div>
                        <div className="card-body">
                            <div className="grid grid-3">
                                {mockWorkerStatus.map((worker) => (
                                    <div
                                        key={worker.name}
                                        className="card"
                                        style={{
                                            padding: 'var(--spacing-lg)',
                                            background: worker.status === 'running'
                                                ? 'rgba(59, 130, 246, 0.1)'
                                                : 'var(--color-bg-tertiary)'
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                                            <span className={`status-indicator ${worker.status}`}></span>
                                            <span style={{ fontWeight: 500 }}>{worker.name}</span>
                                        </div>
                                        <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                                            {worker.jobs} jobs in queue
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Queue Depth */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Queue Depth</h3>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-xl)' }}>
                                <div>
                                    <div style={{ fontSize: '48px', fontWeight: 700, color: 'var(--color-accent-primary)' }}>4</div>
                                    <div style={{ color: 'var(--color-text-secondary)' }}>Total Jobs Queued</div>
                                </div>
                                <div style={{ flex: 1, height: '8px', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-full)' }}>
                                    <div
                                        style={{
                                            width: '40%',
                                            height: '100%',
                                            background: 'var(--color-accent-gradient)',
                                            borderRadius: 'var(--radius-full)'
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Activity Tab */}
            {activeTab === 'activity' && (
                <div className="fade-in">
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Activity Timeline</h3>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                {mockActivity.map((item, index) => (
                                    <div
                                        key={index}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'flex-start',
                                            gap: 'var(--spacing-md)',
                                            padding: 'var(--spacing-md)',
                                            background: 'var(--color-bg-tertiary)',
                                            borderRadius: 'var(--radius-md)'
                                        }}
                                    >
                                        <div style={{
                                            width: 32,
                                            height: 32,
                                            borderRadius: 'var(--radius-full)',
                                            background: item.type === 'job_failed'
                                                ? 'rgba(239, 68, 68, 0.2)'
                                                : 'rgba(99, 102, 241, 0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexShrink: 0
                                        }}>
                                            {item.type === 'batch_completed' && <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />}
                                            {item.type === 'batch_started' && <Layers size={16} style={{ color: 'var(--color-info)' }} />}
                                            {item.type === 'prompt_updated' && <Brain size={16} style={{ color: 'var(--color-accent-primary)' }} />}
                                            {item.type === 'job_failed' && <XCircle size={16} style={{ color: 'var(--color-error)' }} />}
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <div style={{ fontWeight: 500 }}>{item.message}</div>
                                            <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>{item.time}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
