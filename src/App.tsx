import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './utils/supabase';
import './App.css';

import { Pothole, ReportRow, mapReportRow } from './types';
import { Session } from '@supabase/supabase-js';

import Sidebar from './components/Sidebar';
import DashboardStats from './components/DashboardStats';
import PotholeTable from './components/PotholeTable';
import PotholeMap from './components/PotholeMap';
import PotholeDetails from './components/PotholeDetails';
import Login from './components/Login';
import UserProfile from './components/UserProfile';

const App: React.FC = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [potholes, setPotholes] = useState<Pothole[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterNeighborhood, setFilterNeighborhood] = useState<string>('all');
    const [filterDate, setFilterDate] = useState<string>('all');
    const [activeTab, setActiveTab] = useState<'dashboard' | 'map' | 'potholes' | 'profile'>('dashboard');
    const [selectedPothole, setSelectedPothole] = useState<Pothole | null>(null);
    const [myTasksOnly, setMyTasksOnly] = useState(false);

    const CURRENT_USER_NAME = session?.user?.user_metadata?.full_name || session?.user?.email || "Admin Central";

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
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
        });

        return () => subscription.unsubscribe();
    }, []);

    useEffect(() => {
        if (!session) return;

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
    }, [fetchReports, session]);

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

            if (technicianName !== undefined) {
                updateData.assigned_technician = technicianName === "" ? null : technicianName;
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

        const now = new Date();
        const mockReports = [
            {
                address: "Av. Julius Nyerere, Polana",
                description: "Buraco profundo na faixa de rodagem, perigoso para pneus.",
                status: "reported",
                severity: "high",
                report_count: 5,
                image_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7",
                latitude: -25.9750,
                longitude: 32.5950,
                reporter_uids: ["user_10", "user_11"],
                created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                address: "Rua da França, Sommerschield",
                description: "Pavimento danificado após chuvas recentes.",
                status: "in_repair",
                severity: "medium",
                report_count: 3,
                assigned_technician: "Carlos Muchanga",
                image_url: "https://images.unsplash.com/photo-1541698444083-023c97d3f4b6",
                latitude: -25.9605,
                longitude: 32.6001,
                reporter_uids: ["user_20"],
                created_at: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                address: "Av. Vladimir Lenine, Malhangalene",
                description: "Cratera junto à paragem de chapa.",
                status: "repaired",
                severity: "high",
                report_count: 8,
                assigned_technician: "Ana Mabunda",
                image_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7",
                latitude: -25.9552,
                longitude: 32.5805,
                reporter_uids: ["user_30", "user_31", "user_32"],
                created_at: new Date(now.getTime() - 25 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                address: "Av. FPLM, Coop",
                description: "Pequenos buracos ao longo da via.",
                status: "reported",
                severity: "low",
                report_count: 2,
                image_url: "https://images.unsplash.com/photo-1541698444083-023c97d3f4b6",
                latitude: -25.9550,
                longitude: 32.5900,
                reporter_uids: ["user_40"],
                created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                address: "Av. Acordos de Lusaka, Maxaquene",
                description: "Asfalto cedendo, criando declive perigoso.",
                status: "in_repair",
                severity: "high",
                report_count: 6,
                assigned_technician: "Zélia Mondlane",
                image_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7",
                latitude: -25.9405,
                longitude: 32.5855,
                reporter_uids: ["user_50", "user_51"],
                created_at: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                address: "Av. Eduardo Mondlane, Alto Maé",
                description: "Buraco médio na faixa central.",
                status: "repaired",
                severity: "medium",
                report_count: 4,
                assigned_technician: "Admin Central",
                image_url: "https://images.unsplash.com/photo-1541698444083-023c97d3f4b6",
                latitude: -25.9655,
                longitude: 32.5700,
                reporter_uids: ["user_60", "user_61"],
                created_at: new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                address: "Rua Consiglieri Pedroso, Baixa",
                description: "Desgaste profundo do asfalto, afeta trânsito lento.",
                status: "reported",
                severity: "medium",
                report_count: 3,
                image_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7",
                latitude: -25.9755,
                longitude: 32.5705,
                reporter_uids: ["user_70"],
                created_at: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                address: "Av. Milagre Mabote, Mafalala",
                description: "Buraco largo que acumula água.",
                status: "in_repair",
                severity: "low",
                report_count: 1,
                assigned_technician: "Pedro Sitoe",
                image_url: "https://images.unsplash.com/photo-1541698444083-023c97d3f4b6",
                latitude: -25.9455,
                longitude: 32.5755,
                reporter_uids: ["user_80"],
                created_at: new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                address: "Av. de Moçambique, Hulene",
                description: "Cratera grande dificultando acesso.",
                status: "repaired",
                severity: "high",
                report_count: 7,
                assigned_technician: "Carlos Muchanga",
                image_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7",
                latitude: -25.9205,
                longitude: 32.6005,
                reporter_uids: ["user_90", "user_91"],
                created_at: new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                address: "Rua do Tchamba, Polana",
                description: "Pequena fissura virando buraco.",
                status: "reported",
                severity: "low",
                report_count: 1,
                image_url: "https://images.unsplash.com/photo-1541698444083-023c97d3f4b6",
                latitude: -25.9780,
                longitude: 32.5980,
                reporter_uids: ["user_100"],
                created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                address: "Av. Marginal, Sommerschield",
                description: "Buraco na via rápida.",
                status: "in_repair",
                severity: "high",
                report_count: 5,
                assigned_technician: "Admin Central",
                image_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7",
                latitude: -25.9580,
                longitude: 32.6050,
                reporter_uids: ["user_110"],
                created_at: new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                address: "Rua de Goa, Malhangalene",
                description: "Vários buracos médios seguidos.",
                status: "repaired",
                severity: "medium",
                report_count: 4,
                assigned_technician: "Ana Mabunda",
                image_url: "https://images.unsplash.com/photo-1541698444083-023c97d3f4b6",
                latitude: -25.9520,
                longitude: 32.5820,
                reporter_uids: ["user_120", "user_121"],
                created_at: new Date(now.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                address: "Av. OUA, Alto Maé",
                description: "Asfalto irregular com rachaduras e buraco profundo.",
                status: "reported",
                severity: "high",
                report_count: 6,
                image_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7",
                latitude: -25.9620,
                longitude: 32.5650,
                reporter_uids: ["user_130"],
                created_at: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                address: "Av. 25 de Setembro, Baixa",
                description: "Buraco perigoso perto da passadeira.",
                status: "in_repair",
                severity: "medium",
                report_count: 3,
                assigned_technician: "Zélia Mondlane",
                image_url: "https://images.unsplash.com/photo-1541698444083-023c97d3f4b6",
                latitude: -25.9720,
                longitude: 32.5680,
                reporter_uids: ["user_140"],
                created_at: new Date(now.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                address: "Rua da Resistência, Coop",
                description: "Abatimento de via.",
                status: "repaired",
                severity: "high",
                report_count: 8,
                assigned_technician: "Pedro Sitoe",
                image_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7",
                latitude: -25.9530,
                longitude: 32.5880,
                reporter_uids: ["user_150"],
                created_at: new Date(now.getTime() - 22 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                address: "Av. Karl Marx, Alto Maé",
                description: "Buraco alagado após chuva.",
                status: "reported",
                severity: "medium",
                report_count: 2,
                image_url: "https://images.unsplash.com/photo-1541698444083-023c97d3f4b6",
                latitude: -25.9680,
                longitude: 32.5750,
                reporter_uids: ["user_160"],
                created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                address: "Rua dos Irmãos Roby, Mafalala",
                description: "Via de terra com cratera.",
                status: "in_repair",
                severity: "high",
                report_count: 4,
                assigned_technician: "Carlos Muchanga",
                image_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7",
                latitude: -25.9480,
                longitude: 32.5780,
                reporter_uids: ["user_170"],
                created_at: new Date(now.getTime() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                address: "Av. Nelson Mandela, Maxaquene",
                description: "Borda do asfalto destruída.",
                status: "reported",
                severity: "low",
                report_count: 1,
                image_url: "https://images.unsplash.com/photo-1541698444083-023c97d3f4b6",
                latitude: -25.9350,
                longitude: 32.5880,
                reporter_uids: ["user_180"],
                created_at: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                address: "Rua do Jardim, Hulene",
                description: "Cratera no meio da intersecção.",
                status: "in_repair",
                severity: "medium",
                report_count: 5,
                assigned_technician: "Admin Central",
                image_url: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7",
                latitude: -25.9250,
                longitude: 32.5950,
                reporter_uids: ["user_190"],
                created_at: new Date(now.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                address: "Av. Patrice Lumumba, Polana",
                description: "Piso irregular com múltiplos pequenos buracos.",
                status: "reported",
                severity: "low",
                report_count: 2,
                image_url: "https://images.unsplash.com/photo-1541698444083-023c97d3f4b6",
                latitude: -25.9730,
                longitude: 32.5900,
                reporter_uids: ["user_200"],
                created_at: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            },
            {
                address: "Via Desconhecida (Atualizar)",
                description: "Múltiplos buracos rasos numa via degradada, com pedras soltas e gravilha acumulada.",
                status: "reported",
                severity: "medium",
                report_count: 4,
                image_url: "/images/exemplo.png", // Imagem deve estar na pasta admin/public/images/exemplo.png
                latitude: -25.9600,
                longitude: 32.5800,
                reporter_uids: ["user_201", "user_202"],
                created_at: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            }
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

    if (!session) {
        return <Login />;
    }

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
                            {activeTab === 'profile' && 'Configurações de Conta'}
                        </h2>
                        <p>
                            {activeTab === 'dashboard' && 'Monitoramento em tempo real de infraestrutura crítica'}
                            {activeTab === 'potholes' && 'Gestão e execução de ordens de serviço'}
                            {activeTab === 'map' && 'Localização geográfica de ocorrências'}
                            {activeTab === 'profile' && 'Gerencie seus dados pessoais e de acesso'}
                        </p>
                    </div>
                    <div
                        className="user-profile clickable"
                        onClick={() => setActiveTab('profile')}
                        title="Ir para o Perfil"
                    >
                        <div className="user-avatar">
                            {CURRENT_USER_NAME.substring(0, 2).toUpperCase()}
                        </div>
                        <span>{CURRENT_USER_NAME}</span>
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

                {activeTab === 'profile' && (
                    <UserProfile session={session} />
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
