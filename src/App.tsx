import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './utils/supabase';
import './App.css';

import { Pothole, ReportRow, mapReportRow } from './types';

import Sidebar from './components/Sidebar';
import DashboardStats from './components/DashboardStats';
import PotholeTable from './components/PotholeTable';
import PotholeMap from './components/PotholeMap';
import PotholeDetails from './components/PotholeDetails';

const App: React.FC = () => {
    const [potholes, setPotholes] = useState<Pothole[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterNeighborhood, setFilterNeighborhood] = useState<string>('all');
    const [filterDate, setFilterDate] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'potholes'>('dashboard');
    const [selectedPothole, setSelectedPothole] = useState<Pothole | null>(null);
    const [myTasksOnly, setMyTasksOnly] = useState(false);

    const CURRENT_USER_NAME = "Admin Central";

    const fetchReports = useCallback(async () => {
        const { data, error } = await supabase
            .from('reports')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading reports:', error);
            setLoading(false);
            return;
        }

        setPotholes((data as ReportRow[]).map(mapReportRow));
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchReports();

        const channel = supabase
            .channel('reports-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'reports' },
                () => {
                    fetchReports();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [fetchReports]);

    const handleUpdateStatus = async (
        id: string,
        newStatus: string,
        notes?: string,
        technicianName?: string
    ) => {
        try {
            const pothole = potholes.find(p => p.id === id);
            if (!pothole) return;

            const updateData: Record<string, unknown> = {
                status: newStatus,
                updated_at: new Date().toISOString(),
            };

            if (technicianName) {
                updateData.assigned_technician = technicianName;
            } else if (newStatus === 'in_repair' && !pothole.assignedTechnician) {
                updateData.assigned_technician = CURRENT_USER_NAME;
            }

            const { error } = await supabase
                .from('reports')
                .update(updateData)
                .eq('id', id);

            if (error) {
                console.error('Error updating status:', error);
                return;
            }

            if (notes) {
                console.info(`Repair notes for ${id}:`, notes);
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    const handleSeedDatabase = async () => {
        if (!window.confirm("Deseja carregar dados de teste no sistema?")) return;
        setLoading(true);

        const mockReports = [
            {
                address: "Av. Eduardo Mondlane, Maputo",
                description: "Buraco profundo no meio da faixa de rodagem.",
                status: "reported",
                severity: "high",
                report_count: 3,
                image_url: "https://images.unsplash.com/photo-1541698444083-023c97d3f4b6",
                latitude: -25.9650,
                longitude: 32.5830,
                reporter_uids: ["user_1", "user_2", "user_3"],
            },
            {
                address: "Rua da Resistência, Maputo",
                description: "Vários buracos pequenos dificultando o trânsito.",
                status: "reported",
                severity: "medium",
                report_count: 1,
                image_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7",
                latitude: -25.9600,
                longitude: 32.5900,
                reporter_uids: ["user_4"],
            },
        ];

        const { error } = await supabase.from('reports').insert(mockReports);

        if (error) {
            console.error('Error seeding database:', error);
            alert('Erro ao carregar dados.');
        } else {
            alert('Dados carregados com sucesso!');
            await fetchReports();
        }

        setLoading(false);
    };

    const stats = useMemo(() => {
        const resolved = potholes.filter(p => p.status === 'repaired').length;
        const pending = potholes.filter(p => p.status === 'reported').length;

        const byNeighborhood: Record<string, number> = {};
        potholes.forEach(p => {
            const n = p.neighborhood || 'Outros';
            byNeighborhood[n] = (byNeighborhood[n] || 0) + 1;
        });

        return {
            total: potholes.length,
            resolved,
            pending,
            critical: potholes.filter(p => p.severity === 'high' && p.status !== 'repaired').length,
            neighborhoods: Object.entries(byNeighborhood).map(([name, count]) => ({ name, count })),
        };
    }, [potholes]);

    const filteredPotholes = useMemo(() => {
        return potholes.filter(p => {
            const matchesSearch = (p.address?.toLowerCase() || p.description.toLowerCase()).includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || p.status === filterStatus;
            const matchesMyTasks = !myTasksOnly || p.assignedTechnician === CURRENT_USER_NAME;

            const matchesNeighborhood = filterNeighborhood === 'all'
                || p.neighborhood?.toLowerCase() === filterNeighborhood.toLowerCase();

            let matchesDate = true;
            if (filterDate !== 'all') {
                const now = new Date();
                const createdAt = p.createdAt;
                if (filterDate === 'today') {
                    matchesDate = createdAt.toDateString() === now.toDateString();
                } else if (filterDate === 'week') {
                    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    matchesDate = createdAt >= weekAgo;
                } else if (filterDate === 'month') {
                    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                    matchesDate = createdAt >= monthAgo;
                }
            }

            return matchesSearch && matchesStatus && matchesMyTasks && matchesNeighborhood && matchesDate;
        });
    }, [potholes, searchTerm, filterStatus, filterNeighborhood, filterDate, myTasksOnly]);

    const allNeighborhoods = useMemo(() => {
        const neighborhoods = new Set<string>();
        potholes.forEach(p => {
            if (p.neighborhood) neighborhoods.add(p.neighborhood);
        });
        return Array.from(neighborhoods).sort();
    }, [potholes]);

    return (
        <div className="admin-container">
            <Sidebar
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                onSeedData={handleSeedDatabase}
            />

            <main className="content">
                <header>
                    <div className="header-info">
                        <h2>
                            {activeTab === 'dashboard' && 'Visão Geral das Operações'}
                            {activeTab === 'potholes' && 'Painel de Intervenções'}
                            {activeTab === 'map' && 'Mapeamento de Campo'}
                        </h2>
                        <p>
                            {activeTab === 'dashboard' && 'Monitoramento em tempo real de infraestrutura crítica'}
                            {activeTab === 'potholes' && 'Gestão e execução de ordens de serviço'}
                            {activeTab === 'map' && 'Localização geográfica de ocorrências'}
                        </p>
                    </div>
                    <div className="user-profile">
                        <div className="user-avatar">AC</div>
                        <span>{CURRENT_USER_NAME} (Operador)</span>
                    </div>
                </header>

                {activeTab === 'dashboard' && (
                    <>
                        <DashboardStats
                            total={stats.total}
                            resolved={stats.resolved}
                            pending={stats.pending}
                            critical={stats.critical}
                            neighborhoods={stats.neighborhoods}
                        />

                        <div className="dashboard-grid">
                            <div className="recent-activity">
                                <h3>Ocorrências Críticas Prioritárias</h3>
                                <div className="activity-list">
                                    {potholes.filter(p => p.severity === 'high' && p.status !== 'repaired').slice(0, 6).map(p => (
                                        <div key={p.id} className="activity-item" onClick={() => setSelectedPothole(p)}>
                                            <div className="severity-dot high"></div>
                                            <div className="activity-info">
                                                <strong>{p.address || 'Localização Pendente'}</strong>
                                                <span>{p.status === 'reported' ? 'Aguardando Início' : 'Em Execução'}</span>
                                            </div>
                                        </div>
                                    ))}
                                    {potholes.filter(p => p.severity === 'high' && p.status !== 'repaired').length === 0 && (
                                        <p className="empty-state">Sem ocorrências críticas pendentes.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}

                {activeTab === 'potholes' && (
                    <PotholeTable
                        potholes={filteredPotholes}
                        loading={loading}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        filterNeighborhood={filterNeighborhood}
                        setFilterNeighborhood={setFilterNeighborhood}
                        filterDate={filterDate}
                        setFilterDate={setFilterDate}
                        neighborhoods={allNeighborhoods}
                        onUpdateStatus={handleUpdateStatus}
                        onShowDetails={setSelectedPothole}
                        myTasksOnly={myTasksOnly}
                        setMyTasksOnly={setMyTasksOnly}
                    />
                )}

                {activeTab === 'map' && (
                    <PotholeMap
                        potholes={filteredPotholes}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                        filterNeighborhood={filterNeighborhood}
                        setFilterNeighborhood={setFilterNeighborhood}
                        filterDate={filterDate}
                        setFilterDate={setFilterDate}
                        neighborhoods={allNeighborhoods}
                    />
                )}

                {selectedPothole && (
                    <PotholeDetails
                        pothole={selectedPothole}
                        onClose={() => setSelectedPothole(null)}
                        onUpdateStatus={handleUpdateStatus}
                    />
                )}
            </main>
        </div>
    );
};

export default App;
