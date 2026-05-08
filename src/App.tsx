import React, { useState, useEffect, useMemo } from 'react';
import {
    collection,
    query,
    orderBy,
    onSnapshot,
    updateDoc,
    doc,
    Timestamp,
    addDoc
} from 'firebase/firestore';
import { db } from './firebase';
import './App.css';

// Types
import { Pothole } from './types';

// Components
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

    // Simulated "Current User" as "Admin Central" for worker experience
    const CURRENT_USER_NAME = "Admin Central";

    useEffect(() => {
        const q = query(collection(db, 'potholes'), orderBy('createdAt', 'desc'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const data: Pothole[] = [];
            snapshot.forEach((doc) => {
                data.push({ id: doc.id, ...doc.data() } as Pothole);
            });
            setPotholes(data);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const createNotification = async (userId: string, potholeId: string, address: string) => {
        try {
            await addDoc(collection(db, 'notifications'), {
                userId,
                potholeId,
                title: "Problema Resolvido!",
                message: `O problema reportado em ${address || 'sua localização'} foi marcado como concluído. Obrigado por ajudar!`,
                type: 'fix_alert',
                status: 'unread',
                createdAt: Timestamp.now()
            });
        } catch (error) {
            console.error("Error creating notification:", error);
        }
    };

    const handleUpdateStatus = async (id: string, newStatus: string, notes?: string, technicianName?: string) => {
        try {
            const pothole = potholes.find(p => p.id === id);
            if (!pothole) return;

            const updateData: any = {
                status: newStatus,
                updatedAt: Timestamp.now()
            };

            if (technicianName) {
                updateData.assignedTechnician = technicianName;
            } else if (newStatus === 'in_repair' && !pothole.assignedTechnician) {
                updateData.assignedTechnician = CURRENT_USER_NAME;
            }

            if (notes) {
                updateData.repairNotes = notes;
            }

            // Create Activity Log Entry
            const newLogEntry = {
                id: Math.random().toString(36).substr(2, 9),
                userId: "admin_central",
                userName: CURRENT_USER_NAME,
                action: technicianName ? `Atribuiu para ${technicianName}` : `Mudou status para ${newStatus}`,
                timestamp: Timestamp.now(),
                notes: notes,
                newStatus: newStatus
            };

            updateData.activityLog = pothole.activityLog ? [...pothole.activityLog, newLogEntry] : [newLogEntry];

            await updateDoc(doc(db, 'potholes', id), updateData);

            // Notify users if status is 'repaired'
            if (newStatus === 'repaired' && pothole.reporterUids) {
                for (const uid of pothole.reporterUids) {
                    await createNotification(uid, id, pothole.address || '');
                }
                console.log(`Notifications sent for pothole ${id}`);
            }
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const handleSeedDatabase = async () => {
        if (!window.confirm("Deseja carregar dados de teste no sistema?")) return;
        setLoading(true);
        const mockPotholes = [
            {
                address: "Av. Eduardo Mondlane, Maputo",
                neighborhood: "Polana Cimento",
                description: "Buraco profundo no meio da faixa de rodagem.",
                status: "reported",
                severity: "high",
                reportCount: 3,
                imageUrl: "https://images.unsplash.com/photo-1541698444083-023c97d3f4b6",
                location: { latitude: -25.9650, longitude: 32.5830 },
                reporterUids: ["user_1", "user_2", "user_3"],
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                activityLog: []
            },
            {
                address: "Rua da Resistência, Maputo",
                neighborhood: "Maxaquene",
                description: "Vários buracos pequenos dificultando o trânsito.",
                status: "reported",
                severity: "medium",
                reportCount: 1,
                imageUrl: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7",
                location: { latitude: -25.9600, longitude: 32.5900 },
                reporterUids: ["user_4"],
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now(),
                activityLog: []
            }
        ];

        try {
            for (const p of mockPotholes) {
                await addDoc(collection(db, 'potholes'), p);
            }
            alert("Dados carregados com sucesso!");
        } catch (error) {
            console.error("Error seeding database:", error);
        } finally {
            setLoading(false);
        }
    };

    const stats = useMemo(() => {
        const resolved = potholes.filter(p => p.status === 'repaired' || p.status === 'verified').length;
        const pending = potholes.filter(p => p.status === 'reported' || p.status === 'analyzing').length;

        // Group by neighborhood
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
            neighborhoods: Object.entries(byNeighborhood).map(([name, count]) => ({ name, count }))
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
                const createdAt = p.createdAt.toDate();
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
