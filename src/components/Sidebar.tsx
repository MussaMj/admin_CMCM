import React from 'react';
import { LayoutDashboard, Database, Map as MapIcon, Settings } from 'lucide-react';

interface SidebarProps {
    activeTab: 'dashboard' | 'map' | 'potholes';
    setActiveTab: (t: 'dashboard' | 'map' | 'potholes') => void;
    onSeedData: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, onSeedData }) => {
    return (
        <aside className="sidebar">
            <div className="logo">
                <div className="logo-icon">OP</div>
                <h1>Portal <span>de Operações</span></h1>
            </div>
            <nav>
                <button
                    className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`}
                    onClick={() => setActiveTab('dashboard')}
                >
                    <LayoutDashboard size={20} /> Dashboard Operacional
                </button>
                <button
                    className={`nav-item ${activeTab === 'potholes' ? 'active' : ''}`}
                    onClick={() => setActiveTab('potholes')}
                >
                    <Database size={20} /> Gestão de Ocorrências
                </button>
                <button
                    className={`nav-item ${activeTab === 'map' ? 'active' : ''}`}
                    onClick={() => setActiveTab('map')}
                >
                    <MapIcon size={20} /> Mapa do Terreno
                </button>

                <div className="sidebar-footer">
                    <button
                        className="nav-item utility"
                        onClick={onSeedData}
                        title="Ferramenta de Suporte"
                    >
                        <Settings size={18} /> Manutenção do Sistema
                    </button>
                </div>
            </nav>
        </aside>
    );
};

export default Sidebar;
