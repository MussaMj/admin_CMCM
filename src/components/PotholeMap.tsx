import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Search, Filter } from 'lucide-react';
import { Pothole, MAPUTO_CENTER } from '../types';

interface PotholeMapProps {
    potholes: Pothole[];
    filterStatus: string;
    setFilterStatus: (s: string) => void;
    filterNeighborhood: string;
    setFilterNeighborhood: (s: string) => void;
    filterDate: string;
    setFilterDate: (s: string) => void;
    neighborhoods: string[];
}

const PotholeMap: React.FC<PotholeMapProps> = ({
    potholes,
    filterStatus,
    setFilterStatus,
    filterNeighborhood,
    setFilterNeighborhood,
    filterDate,
    setFilterDate,
    neighborhoods
}) => {
    return (
        <div className="map-view-container" style={{ position: 'relative' }}>
            {/* Map Filters Overlay */}
            <div className="map-filters-overlay">
                <div className="filter-select">
                    <Filter size={16} />
                    <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                        <option value="all">Status: Todos</option>
                        <option value="reported">Pendente</option>
                        <option value="analyzing">Em Análise</option>
                        <option value="in_repair">Em Reparo</option>
                        <option value="repaired">Resolvido</option>
                    </select>
                </div>
                <div className="filter-select">
                    <select value={filterNeighborhood} onChange={(e) => setFilterNeighborhood(e.target.value)}>
                        <option value="all">Bairro: Todos</option>
                        {neighborhoods.map(n => (
                            <option key={n} value={n}>{n}</option>
                        ))}
                    </select>
                </div>
                <div className="filter-select">
                    <select value={filterDate} onChange={(e) => setFilterDate(e.target.value)}>
                        <option value="all">Filtro: Qualquer Data</option>
                        <option value="today">Hoje</option>
                        <option value="week">Últimos 7 dias</option>
                        <option value="month">Último mês</option>
                    </select>
                </div>
            </div>

            <MapContainer
                center={MAPUTO_CENTER}
                zoom={13}
                style={{ height: '600px', width: '100%', borderRadius: '16px', zIndex: 1 }}
            >
                <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                {potholes.filter(p => p.location).map(p => (
                    <Marker
                        key={p.id}
                        position={[p.location.latitude, p.location.longitude]}
                    >
                        <Popup>
                            <div className="popup-content">
                                <div className="popup-header">
                                    <span className={`popup-severity-dot ${p.severity}`}></span>
                                    <strong>{p.address || 'Localização sem nome'}</strong>
                                </div>
                                <p className="popup-desc">{p.description}</p>
                                <div className={`status-tag ${p.status}`}>
                                    {p.status === 'repaired' ? 'RESOLVIDO' :
                                        p.status === 'in_repair' ? 'EM REPARO' :
                                            p.status === 'analyzing' ? 'EM ANÁLISE' : 'PENDENTE'}
                                </div>
                                {p.assignedTechnician && (
                                    <p className="popup-tech">Técnico: {p.assignedTechnician}</p>
                                )}
                            </div>
                        </Popup>
                    </Marker>
                ))}
            </MapContainer>
        </div>
    );
};

export default PotholeMap;
