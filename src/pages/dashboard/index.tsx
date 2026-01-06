import { useState, useEffect } from 'react';
import {
    Image as ImageIcon,
    FileJson,
    Clock,
    AlertCircle,
    Upload,
    Layers,
    Brain,
    CheckCircle,
    XCircle,
    RefreshCw,
    Loader2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getJobStats, getAllJobs } from '../../services/job.service';
import type { Job } from '../../types';

type TabId = 'overview' | 'health' | 'activity';

interface DashboardStats {
    total: number;
    pending: number;
    running: number;
    completed: number;
    failed: number;
}

export default function Dashboard() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<TabId>('overview');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats>({ total: 0, pending: 0, running: 0, completed: 0, failed: 0 });
    const [recentJobs, setRecentJobs] = useState<Job[]>([]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [statsData, jobsData] = await Promise.all([
                getJobStats(),
                getAllJobs(10)
            ]);
            setStats(statsData);
            setRecentJobs(jobsData);
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

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

    const formatTime = (timestamp: number) => {
        const diff = Date.now() - timestamp;
        const minutes = Math.floor(diff / 60000);
        if (minutes < 1) return 'Just now';
        if (minutes < 60) return `${minutes} min ago`;
        const hours = Math.floor(minutes / 60);
        if (hours < 24) return `${hours} hr ago`;
        return new Date(timestamp).toLocaleDateString();
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
                            <div className="kpi-value">{loading ? '...' : stats.total.toLocaleString()}</div>
                            <div className="kpi-label">Total Jobs</div>
                            <FileJson size={24} style={{ color: 'var(--color-accent-primary)', marginTop: 'var(--spacing-md)' }} />
                        </div>
                        <div className="card kpi-card">
                            <div className="kpi-value">{loading ? '...' : stats.completed.toLocaleString()}</div>
                            <div className="kpi-label">Completed</div>
                            <CheckCircle size={24} style={{ color: 'var(--color-success)', marginTop: 'var(--spacing-md)' }} />
                        </div>
                        <div className="card kpi-card">
                            <div className="kpi-value">{loading ? '...' : (stats.running + stats.pending)}</div>
                            <div className="kpi-label">Active Jobs</div>
                            <Clock size={24} style={{ color: 'var(--color-info)', marginTop: 'var(--spacing-md)' }} />
                        </div>
                        <div className="card kpi-card">
                            <div className="kpi-value">{loading ? '...' : stats.failed}</div>
                            <div className="kpi-label">Failed Jobs</div>
                            <AlertCircle size={24} style={{ color: 'var(--color-error)', marginTop: 'var(--spacing-md)' }} />
                        </div>
                    </div>

                    {/* Recent Jobs Table */}
                    <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <div className="card-header">
                            <h3 className="card-title">Recent Jobs</h3>
                            <button className="btn btn-ghost" onClick={loadData} disabled={loading}>
                                {loading ? <Loader2 size={16} className="spin" /> : <RefreshCw size={16} />} Refresh
                            </button>
                        </div>
                        <div className="card-body" style={{ padding: 0 }}>
                            {loading ? (
                                <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    <Loader2 size={24} className="spin" style={{ marginBottom: 'var(--spacing-sm)' }} />
                                    <div>Loading...</div>
                                </div>
                            ) : recentJobs.length === 0 ? (
                                <div style={{ padding: 'var(--spacing-xl)', textAlign: 'center', color: 'var(--color-text-muted)' }}>
                                    <FileJson size={32} style={{ marginBottom: 'var(--spacing-sm)' }} />
                                    <div>No jobs yet. Start by uploading an image!</div>
                                </div>
                            ) : (
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
                                        {recentJobs.map((job) => (
                                            <tr key={job.id} onClick={() => navigate('/jobs')} style={{ cursor: 'pointer' }}>
                                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{job.id.slice(0, 8)}...</td>
                                                <td>{getModuleLabel(job.module)}</td>
                                                <td>{getStatusBadge(job.status)}</td>
                                                <td style={{ color: 'var(--color-text-secondary)' }}>{formatTime(job.createdAt)}</td>
                                                <td style={{ fontFamily: 'var(--font-mono)', fontSize: '13px' }}>{job.promptVersion}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="card">
                        <div className="card-header">
                            <h3 className="card-title">Quick Actions</h3>
                        </div>
                        <div className="card-body">
                            <div style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
                                <button className="btn btn-primary" onClick={() => navigate('/grid-to-json')}>
                                    <Upload size={16} /> Grid-to-JSON
                                </button>
                                <button className="btn btn-secondary" onClick={() => navigate('/batch-manager')}>
                                    <Layers size={16} /> Batch Manager
                                </button>
                                <button className="btn btn-secondary" onClick={() => navigate('/prompt-brain')}>
                                    <Brain size={16} /> Prompt Brain
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* System Health Tab */}
            {activeTab === 'health' && (
                <div className="fade-in">
                    <div className="card" style={{ marginBottom: 'var(--spacing-xl)' }}>
                        <div className="card-header">
                            <h3 className="card-title">System Status</h3>
                        </div>
                        <div className="card-body">
                            <div className="grid grid-3">
                                <div className="card" style={{ padding: 'var(--spacing-lg)', background: 'rgba(16, 185, 129, 0.1)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                                        <span className="status-indicator running"></span>
                                        <span style={{ fontWeight: 500 }}>Database</span>
                                    </div>
                                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                                        IndexedDB Connected
                                    </div>
                                </div>
                                <div className="card" style={{ padding: 'var(--spacing-lg)', background: 'rgba(16, 185, 129, 0.1)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                                        <span className="status-indicator running"></span>
                                        <span style={{ fontWeight: 500 }}>Frontend</span>
                                    </div>
                                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                                        React + Vite
                                    </div>
                                </div>
                                <div className="card" style={{ padding: 'var(--spacing-lg)', background: 'var(--color-bg-tertiary)' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', marginBottom: 'var(--spacing-sm)' }}>
                                        <span className="status-indicator idle"></span>
                                        <span style={{ fontWeight: 500 }}>AI Workers</span>
                                    </div>
                                    <div style={{ color: 'var(--color-text-secondary)', fontSize: '14px' }}>
                                        Ready (need API key)
                                    </div>
                                </div>
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
                                    <div style={{ fontSize: '48px', fontWeight: 700, color: 'var(--color-accent-primary)' }}>
                                        {stats.pending + stats.running}
                                    </div>
                                    <div style={{ color: 'var(--color-text-secondary)' }}>Total Jobs Queued</div>
                                </div>
                                <div style={{ flex: 1, height: '8px', background: 'var(--color-bg-tertiary)', borderRadius: 'var(--radius-full)' }}>
                                    <div
                                        style={{
                                            width: stats.total > 0 ? `${((stats.pending + stats.running) / Math.max(stats.total, 1)) * 100}%` : '0%',
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
                            <h3 className="card-title">Recent Activity</h3>
                        </div>
                        <div className="card-body">
                            {recentJobs.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: 'var(--spacing-xl)', color: 'var(--color-text-muted)' }}>
                                    No activity yet
                                </div>
                            ) : (
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
                                    {recentJobs.map((job) => (
                                        <div
                                            key={job.id}
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
                                                background: job.status === 'failed'
                                                    ? 'rgba(239, 68, 68, 0.2)'
                                                    : job.status === 'completed'
                                                        ? 'rgba(16, 185, 129, 0.2)'
                                                        : 'rgba(99, 102, 241, 0.2)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexShrink: 0
                                            }}>
                                                {job.status === 'completed' && <CheckCircle size={16} style={{ color: 'var(--color-success)' }} />}
                                                {job.status === 'running' && <Clock size={16} style={{ color: 'var(--color-info)' }} />}
                                                {job.status === 'failed' && <XCircle size={16} style={{ color: 'var(--color-error)' }} />}
                                                {job.status === 'pending' && <Clock size={16} style={{ color: 'var(--color-warning)' }} />}
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontWeight: 500 }}>
                                                    {getModuleLabel(job.module)} job {job.status}
                                                </div>
                                                <div style={{ color: 'var(--color-text-muted)', fontSize: '13px' }}>
                                                    {formatTime(job.createdAt)}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
