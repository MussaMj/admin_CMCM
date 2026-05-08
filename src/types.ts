import { Timestamp, GeoPoint } from 'firebase/firestore';

export interface ActivityLog {
    id: string;
    userId: string;
    userName: string;
    action: string;
    timestamp: Timestamp;
    notes?: string;
    newStatus?: string;
}

export interface Pothole {
    id: string;
    address?: string;
    neighborhood?: string; // Bairro
    description: string;
    status: 'reported' | 'analyzing' | 'in_repair' | 'repaired' | 'verified';
    severity: 'low' | 'medium' | 'high';
    reportCount: number;
    imageUrl: string;
    location: GeoPoint;
    assignedTechnician?: string;
    reporterUids?: string[];
    repairNotes?: string;
    createdAt: Timestamp;
    updatedAt?: Timestamp;
    activityLog?: ActivityLog[];
}

export interface Technician {
    id: string;
    name: string;
}

export const TECHNICIANS: Technician[] = [
    { id: 'tech_1', name: 'Carlos Muchanga' },
    { id: 'tech_2', name: 'Ana Mabunda' },
    { id: 'tech_3', name: 'Zélia Mondlane' },
    { id: 'tech_4', name: 'Pedro Sitoe' },
];

export const MAPUTO_CENTER: [number, number] = [-25.9692, 32.5732];
