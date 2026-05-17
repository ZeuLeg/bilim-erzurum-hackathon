export type UserRole = 'citizen' | 'staff' | 'admin';
export type ReportStatus = 'pending' | 'in_progress' | 'resolved';
export type ReportCategory = 'road' | 'water' | 'electricity' | 'gas' | 'other';
export type WorkOrderStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export const CATEGORY_META: Record<ReportCategory, { label: string; department: string; color: string }> = {
  road:        { label: 'Yol / Asfalt',   department: 'Asfalt Müdürlüğü',              color: 'bg-amber-100 text-amber-800' },
  water:       { label: 'Su / Kanalizasyon', department: 'Su ve Kanalizasyon Müdürlüğü', color: 'bg-blue-100 text-blue-800' },
  electricity: { label: 'Elektrik',        department: 'Elektrik İşleri Müdürlüğü',     color: 'bg-yellow-100 text-yellow-800' },
  gas:         { label: 'Doğalgaz',        department: 'Doğalgaz Müdürlüğü',            color: 'bg-orange-100 text-orange-800' },
  other:       { label: 'Diğer',           department: 'Genel Hizmetler',               color: 'bg-slate-100 text-slate-700' },
};

export interface Report {
  id: number;
  userId: number | null;
  title: string;
  description: string;
  status: ReportStatus;
  category: ReportCategory;
  locationLat: number;
  locationLng: number;
  createdAt: Date;
}

export interface WorkOrder {
  id: number;
  departmentName: string;
  description: string;
  plannedStartDate: Date;
  plannedEndDate: Date;
  locationLat: number;
  locationLng: number;
  status: WorkOrderStatus;
}

export interface ConflictAlert {
  workOrderA: WorkOrder;
  workOrderB: WorkOrder;
  distanceMeters: number;
  overlapDays: number;
  severity: 'low' | 'medium' | 'high';
  reason: string;
  budgetImpact?: string | number;
}

export interface NewReport {
  title: string;
  description: string;
  category?: ReportCategory;
  locationLat: number;
  locationLng: number;
  userId?: number;
}

export interface NewWorkOrder {
  departmentName: string;
  description: string;
  plannedStartDate: string;
  plannedEndDate: string;
  locationLat: number;
  locationLng: number;
}
