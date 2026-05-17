export type ConflictAlertDTO = {
  workOrderA: {
    departmentName: string;
    description?: string;
    plannedStartDate?: string;
    plannedEndDate?: string;
    locationLat?: number;
    locationLng?: number;
    status?: string;
  };
  workOrderB: {
    departmentName: string;
    description?: string;
    plannedStartDate?: string;
    plannedEndDate?: string;
    locationLat?: number;
    locationLng?: number;
    status?: string;
  };
  distanceMeters: number;
  overlapDays: number;
  severity: 'low' | 'medium' | 'high';
  reason: string;
  budgetImpact?: string | number;
  workOrderId?: number | string;
  newStart?: string;
  newEnd?: string;
};

export type ParsedConflictReport = {
  summary: string;
  conflicts: ConflictAlertDTO[];
};

const jsonFenceRegex = /```json\s*([\s\S]*?)```/i;
const firstJsonObjectRegex = /({[\s\S]*})/;

function parseJsonString(value: string): any | null {
  try {
    return JSON.parse(value.trim());
  } catch {
    return null;
  }
}

function normalizeParsedReport(data: unknown): ParsedConflictReport | null {
  if (!data || typeof data !== 'object') return null;
  const record = data as Record<string, unknown>;

  const summary = typeof record.summary === 'string' ? record.summary : '';
  const conflicts = Array.isArray(record.conflicts) ? record.conflicts : [];

  if (typeof summary !== 'string' || !Array.isArray(conflicts)) return null;

  const normalizedConflicts: ConflictAlertDTO[] = conflicts
    .filter((item) => item && typeof item === 'object')
    .map((item) => ({
      workOrderA: {
        departmentName: String(item.workOrderA?.departmentName ?? 'N/A'),
        description: item.workOrderA?.description,
        plannedStartDate: item.workOrderA?.plannedStartDate,
        plannedEndDate: item.workOrderA?.plannedEndDate,
        locationLat: typeof item.workOrderA?.locationLat === 'number' ? item.workOrderA.locationLat : undefined,
        locationLng: typeof item.workOrderA?.locationLng === 'number' ? item.workOrderA.locationLng : undefined,
        status: typeof item.workOrderA?.status === 'string' ? item.workOrderA.status : undefined,
      },
      workOrderB: {
        departmentName: String(item.workOrderB?.departmentName ?? 'N/A'),
        description: item.workOrderB?.description,
        plannedStartDate: item.workOrderB?.plannedStartDate,
        plannedEndDate: item.workOrderB?.plannedEndDate,
        locationLat: typeof item.workOrderB?.locationLat === 'number' ? item.workOrderB.locationLat : undefined,
        locationLng: typeof item.workOrderB?.locationLng === 'number' ? item.workOrderB.locationLng : undefined,
        status: typeof item.workOrderB?.status === 'string' ? item.workOrderB.status : undefined,
      },
      distanceMeters: typeof item.distanceMeters === 'number' ? item.distanceMeters : Number(item.distanceMeters) || 0,
      overlapDays: typeof item.overlapDays === 'number' ? item.overlapDays : Number(item.overlapDays) || 0,
      severity: ['low', 'medium', 'high'].includes(item.severity) ? item.severity : 'low',
      reason: String(item.reason ?? ''),
      budgetImpact:
        typeof item.budgetImpact === 'string'
          ? item.budgetImpact
          : typeof item.budgetImpact === 'number'
          ? item.budgetImpact
          : item.budgetImpact != null
          ? String(item.budgetImpact)
          : undefined,
      workOrderId:
        typeof item.workOrderId === 'number'
          ? item.workOrderId
          : item.workOrderId != null
          ? String(item.workOrderId)
          : undefined,
      newStart: typeof item.newStart === 'string' ? item.newStart : typeof item.newStartDate === 'string' ? item.newStartDate : undefined,
      newEnd: typeof item.newEnd === 'string' ? item.newEnd : typeof item.newEndDate === 'string' ? item.newEndDate : undefined,
    }));

  return {
    summary,
    conflicts: normalizedConflicts,
  };
}

export function parseConflictReportFromText(text: string): ParsedConflictReport | null {
  const jsonMatch = text.match(jsonFenceRegex);
  const rawJson = jsonMatch ? jsonMatch[1] : null;
  const contentToParse = rawJson ?? text;

  let parsed = parseJsonString(contentToParse);
  if (!parsed) {
    const firstObjectMatch = contentToParse.match(firstJsonObjectRegex);
    parsed = firstObjectMatch ? parseJsonString(firstObjectMatch[1]) : null;
  }

  return normalizeParsedReport(parsed);
}
