import React, { useState } from 'react';
import {
    X, MapPin, User, ClipboardEdit, AlertTriangle, CheckCircle2, Clock,
    ExternalLink, Camera, FileText, History, Users
} from 'lucide-react';
import { Pothole, TECHNICIANS } from '../types';

interface PotholeDetailsProps {
    pothole: Pothole;
    onClose: () => void;
    onUpdateStatus: (id: string, s: string, notes?: string, technician?: string) => void;
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
    repaired: { label: 'RESOLVIDO', icon: <CheckCircle2 size={14} />, color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)' },
    in_repair: { label: 'EM REPARAÇÃO', icon: <Clock size={14} />, color: '#2563eb', bg: 'rgba(37, 99, 235, 0.12)' },
    reported: { label: 'PENDENTE', icon: <AlertTriangle size={14} />, color: '#475569', bg: 'rgba(71, 85, 105, 0.08)' },
};

const severityConfig = {
    high: { label: 'CRÍTICA', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)', barColor: '#dc2626' },
    medium: { label: 'MODERADA', color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)', barColor: '#d97706' },
    low: { label: 'LEVE', color: '#16a34a', bg: 'rgba(22, 163, 74, 0.12)', barColor: '#16a34a' },
};

const PotholeDetails: React.FC<PotholeDetailsProps> = ({ pothole, onClose, onUpdateStatus }) => {
    const [notes, setNotes] = useState('');
    const [selectedTech, setSelectedTech] = useState(pothole.assignedTechnician || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [imgError, setImgError] = useState(false);

    const sc = statusConfig[pothole.status] || statusConfig.reported;
    const sev = severityConfig[pothole.severity] || severityConfig.low;

    const handleUpdate = async (newStatus: string) => {
        setIsSubmitting(true);
        await onUpdateStatus(pothole.id, newStatus, notes, selectedTech);
        setIsSubmitting(false);
    };

    const handleAssignTech = async (tech: string) => {
        setSelectedTech(tech);
        await onUpdateStatus(pothole.id, pothole.status, notes, tech);
    };

    const mapsUrl = pothole.location
        ? `https://maps.google.com/?q=${pothole.location.latitude},${pothole.location.longitude}`
        : null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="detail-modal-v2" onClick={e => e.stopPropagation()}>
                <div className="modal-accent-bar" style={{ background: sev.barColor }} />

                <div className="detail-header">
                    <div className="detail-header-left">
                        <span className="detail-ticket-id">Ticket #{pothole.id.slice(-6).toUpperCase()}</span>
                        <h3 className="detail-title">{pothole.address || 'Localização via Coordenadas'}</h3>
                    </div>
                    <button className="detail-close-btn" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <div className="detail-body">
                    <div className="detail-left-col">
                        <div className="detail-img-container">
                            {!imgError && pothole.imageUrl ? (
                                <img
                                    src={pothole.imageUrl}
                                    alt="Evidência fotográfica"
                                    className="detail-img"
                                    onError={() => setImgError(true)}
                                />
                            ) : (
                                <div className="detail-img-placeholder">
                                    <Camera size={40} color="#475569" />
                                    <span>Sem evidência fotográfica</span>
                                </div>
                            )}
                        </div>

                        {mapsUrl && (
                            <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="detail-maps-btn"
                            >
                                <MapPin size={16} />
                                Abrir no Google Maps
                                <ExternalLink size={14} />
                            </a>
                        )}

                        <div className="detail-meta-chips">
                            <div className="meta-chip">
                                <span className="meta-chip-label">Reportes</span>
                                <span className="meta-chip-value">{pothole.reportCount}</span>
                            </div>
                            <div className="meta-chip">
                                <span className="meta-chip-label">Criado em</span>
                                <span className="meta-chip-value">
                                    {pothole.createdAt.toLocaleDateString('pt-MZ')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="detail-right-col">
                        <div className="detail-badges-row">
                            <div
                                className="detail-status-pill"
                                style={{ color: sc.color, background: sc.bg }}
                            >
                                {sc.icon}
                                {sc.label}
                            </div>
                            <div
                                className="detail-severity-pill"
                                style={{ color: sev.color, background: sev.bg }}
                            >
                                <AlertTriangle size={13} />
                                {sev.label}
                            </div>
                        </div>

                        <div className="detail-field">
                            <label className="detail-field-label">
                                <Users size={13} /> Atribuir Equipa
                            </label>
                            <select
                                className="detail-select"
                                value={selectedTech}
                                onChange={(e) => handleAssignTech(e.target.value)}
                            >
                                <option value="">Não atribuído</option>
                                {TECHNICIANS.map(t => (
                                    <option key={t.id} value={t.name}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        <div className="detail-field">
                            <label className="detail-field-label">
                                <FileText size={13} /> Descrição do Problema
                            </label>
                            <p className="detail-field-value detail-desc">{pothole.description}</p>
                        </div>

                        <div className="detail-field">
                            <label className="detail-field-label">
                                <User size={13} /> Reportado por
                            </label>
                            <p className="detail-field-value">
                                {pothole.reporterUids?.join(', ') || 'Anónimo'}
                            </p>
                        </div>

                        <div className="detail-field">
                            <label className="detail-field-label">Atualizar Estado</label>
                            <div className="status-actions-grid">
                                {Object.entries(statusConfig).map(([key, config]) => (
                                    <button
                                        key={key}
                                        className={`status-action-btn ${pothole.status === key ? 'active' : ''}`}
                                        onClick={() => handleUpdate(key)}
                                        disabled={isSubmitting}
                                        style={{
                                            borderColor: pothole.status === key ? config.color : 'var(--border-color)',
                                            color: pothole.status === key ? config.color : 'var(--text-secondary)'
                                        }}
                                    >
                                        {config.icon}
                                        {config.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="detail-field detail-field-notes">
                            <label className="detail-field-label">
                                <ClipboardEdit size={13} /> Notas de Intervenção
                            </label>
                            <textarea
                                className="detail-notes-textarea"
                                placeholder="Adicione notas sobre a análise ou reparo..."
                                value={notes}
                                onChange={e => setNotes(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <div className="activity-history">
                            <h4><History size={16} /> Histórico de Atividades</h4>
                            <div className="log-list">
                                <p className="empty-state">Sem histórico disponível.</p>
                            </div>
                        </div>

                        <div className="detail-footer-actions">
                            <button className="detail-back-btn" onClick={onClose}>Fechar</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PotholeDetails;
