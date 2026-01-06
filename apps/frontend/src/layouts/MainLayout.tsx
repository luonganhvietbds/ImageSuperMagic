import { useState } from 'react';
import { Outlet, NavLink, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Grid3X3,
    Eye,
    Sparkles,
    Layers,
    Clock,
    FolderOpen,
    Brain,
    Settings,
    ChevronLeft,
    ChevronRight,
    Activity,
    User,
    Bell,
    Key
} from 'lucide-react';
import { useAppStore } from '../state';

const navItems = [
    {
        section: 'Overview', items: [
            { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        ]
    },
    {
        section: 'AI Modules', items: [
            { path: '/grid-to-json', label: 'Grid-to-JSON', icon: Grid3X3 },
            { path: '/vision-to-json', label: 'Vision-to-JSON', icon: Eye },
            { path: '/realistic-to-json', label: 'Realistic-to-JSON', icon: Sparkles },
        ]
    },
    {
        section: 'Operations', items: [
            { path: '/batch-manager', label: 'Batch Manager', icon: Layers },
            { path: '/jobs', label: 'Jobs', icon: Clock },
            { path: '/assets', label: 'Assets', icon: FolderOpen },
        ]
    },
    {
        section: 'System', items: [
            { path: '/prompt-brain', label: 'Prompt Brain', icon: Brain },
            { path: '/settings', label: 'Settings', icon: Settings },
        ]
    },
];

const moduleLabels: Record<string, string> = {
    '/': 'Dashboard',
    '/dashboard': 'Dashboard',
    '/grid-to-json': 'Grid-to-JSON · Identity Cloning Engine',
    '/vision-to-json': 'Vision-to-JSON · Visual Data Serialization',
    '/realistic-to-json': 'Realistic-to-JSON · Generative Visual Architect',
    '/batch-manager': 'Batch Manager',
    '/jobs': 'Jobs',
    '/assets': 'Assets',
    '/prompt-brain': 'Prompt Brain · AI Control Plane',
    '/settings': 'Settings',
};

export default function MainLayout() {
    const [collapsed, setCollapsed] = useState(false);
    const location = useLocation();
    const { apiKeyValid } = useAppStore();
    const currentModuleLabel = moduleLabels[location.pathname] || 'AI Image Platform';

    return (
        <div className="app-layout">
            {/* Sidebar */}
            <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <div className="sidebar-logo-icon">AI</div>
                        {!collapsed && <span className="sidebar-logo-text">Image Platform</span>}
                    </div>
                </div>

                <nav className="sidebar-nav">
                    {navItems.map((section) => (
                        <div key={section.section} className="nav-section">
                            {!collapsed && <div className="nav-section-title">{section.section}</div>}
                            {section.items.map((item) => (
                                <NavLink
                                    key={item.path}
                                    to={item.path}
                                    className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                                >
                                    <item.icon className="nav-item-icon" size={20} />
                                    {!collapsed && <span className="nav-item-text">{item.label}</span>}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>

                {/* API Key Status */}
                {!collapsed && (
                    <div style={{
                        padding: 'var(--spacing-md)',
                        borderTop: '1px solid var(--color-border)',
                        marginTop: 'auto'
                    }}>
                        <NavLink
                            to="/settings"
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 'var(--spacing-sm)',
                                padding: 'var(--spacing-sm) var(--spacing-md)',
                                background: apiKeyValid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                                borderRadius: 'var(--radius-md)',
                                fontSize: '13px',
                                color: apiKeyValid ? 'var(--color-success)' : 'var(--color-warning)'
                            }}
                        >
                            <Key size={16} />
                            {apiKeyValid ? 'API Connected' : 'Setup API Key'}
                        </NavLink>
                    </div>
                )}

                <div style={{ padding: 'var(--spacing-md)', borderTop: '1px solid var(--color-border)' }}>
                    <button
                        className="btn btn-ghost btn-icon"
                        onClick={() => setCollapsed(!collapsed)}
                        style={{ width: '100%', justifyContent: collapsed ? 'center' : 'flex-start' }}
                    >
                        {collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
                        {!collapsed && <span style={{ marginLeft: 'var(--spacing-sm)' }}>Collapse</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="main-wrapper">
                <header className="header">
                    <div className="header-left">
                        <h1 className="header-module-label">{currentModuleLabel}</h1>
                    </div>
                    <div className="header-right">
                        {/* API Status */}
                        {!apiKeyValid && (
                            <NavLink to="/settings" className="btn btn-secondary" style={{ fontSize: '13px' }}>
                                <Key size={16} /> Setup API Key
                            </NavLink>
                        )}

                        {/* Job Indicator */}
                        <button className="btn btn-ghost btn-icon" title="Running Jobs">
                            <Activity size={20} />
                        </button>

                        {/* Notifications */}
                        <button className="btn btn-ghost btn-icon" title="Notifications">
                            <Bell size={20} />
                        </button>

                        {/* Settings */}
                        <NavLink to="/settings" className="btn btn-ghost btn-icon" title="Settings">
                            <Settings size={20} />
                        </NavLink>

                        {/* User */}
                        <button className="btn btn-ghost btn-icon" title="User Profile">
                            <User size={20} />
                        </button>
                    </div>
                </header>

                <main className="main-content">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
