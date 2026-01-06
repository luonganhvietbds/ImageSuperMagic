import { ReactNode } from 'react';

interface ModuleLayoutProps {
    children: ReactNode;
    tabs: { id: string; label: string }[];
    activeTab: string;
    onTabChange: (tabId: string) => void;
}

export default function ModuleLayout({ children, tabs, activeTab, onTabChange }: ModuleLayoutProps) {
    return (
        <div className="module-layout fade-in">
            <div className="tabs">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                        onClick={() => onTabChange(tab.id)}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="module-content">
                {children}
            </div>
        </div>
    );
}
