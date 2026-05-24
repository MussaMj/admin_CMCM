export type PotholeStatus = 'reported' | 'in_repair' | 'repaired';
export type PotholeSeverity = 'low' | 'medium' | 'high';

export interface Pothole {
    id: string;
    address?: string;
    neighborhood?: string;
    description: string;
    status: PotholeStatus;
    severity: PotholeSeverity;
    reportCount: number;
    imageUrl: string;
    location: { latitude: number; longitude: number };
    assignedTechnician?: string;
    reporterUids?: string[];
    tags?: string[];
    size?: string;
    impact?: string;
    risk?: string;
    createdAt: Date;
    updatedAt?: Date;
}

export interface ReportRow {
    id: string;
    latitude: number;
    longitude: number;
    address: string | null;
    description: string | null;
    image_url: string | null;
    size: string | null;
    impact: string | null;
    risk: string | null;
    tags: string[] | null;
    severity: PotholeSeverity;
    status: PotholeStatus;
    report_count: number;
    reporter_uids: string[] | null;
    assigned_technician: string | null;
    created_at: string;
    updated_at: string | null;
}

export function mapReportRow(row: ReportRow): Pothole {
    return {
        id: row.id,
        address: row.address ?? undefined,
        description: row.description ?? '',
        status: row.status,
        severity: row.severity,
        reportCount: row.report_count,
        imageUrl: row.image_url ?? '',
        location: { latitude: row.latitude, longitude: row.longitude },
        assignedTechnician: row.assigned_technician ?? undefined,
        reporterUids: row.reporter_uids ?? undefined,
        tags: row.tags ?? undefined,
        size: row.size ?? undefined,
        impact: row.impact ?? undefined,
        risk: row.risk ?? undefined,
        createdAt: new Date(row.created_at),
        updatedAt: row.updated_at ? new Date(row.updated_at) : undefined,
    };
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
