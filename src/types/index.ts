export type UserRole = 'citizen' | 'staff' | 'admin';
export type ReportStatus = 'pending' | 'in_progress' | 'resolved';
export type WorkOrderStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

export interface Report {
  id: number;
  userId: number | null;
  title: string;
  description: string;
  status: ReportStatus;
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
}

export interface NewReport {
  title: string;
  description: string;
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
