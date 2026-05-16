import { getDistanceMeters, getOverlapDays } from './utils';

/** Two work orders closer than this (meters) count as a spatial conflict. */
export const PROXIMITY_METERS = 300;
/** Below this distance (meters) the work orders share effectively the same site. */
export const SAME_SITE_METERS = 50;

const ASPHALT_KEYWORDS = ['asphalt', 'asfalt'];
const EXCAVATION_KEYWORDS = [
  'water',
  'sewage',
  'electric',
  'gas',
  'kanaliz',
  'elektrik',
  'dogalgaz',
  'doğalgaz',
];

export type WorkOrderInput = {
  id: number;
  departmentName: string;
  description: string;
  plannedStartDate: Date | string;
  plannedEndDate: Date | string;
  locationLat: number;
  locationLng: number;
  status: string;
};

export type DetectedConflict = {
  workOrderA: WorkOrderInput;
  workOrderB: WorkOrderInput;
  distanceMeters: number;
  overlapDays: number;
  severity: 'low' | 'medium' | 'high';
  reason: string;
};

export type ConflictImpact = {
  wastedBudgetTRY: number;
  co2KgSaved: number;
  roadMetersSaved: number;
};

export type ConflictReport = {
  summary: string;
  conflicts: DetectedConflict[];
  totalImpact: ConflictImpact;
};

function includesAny(text: string, keywords: string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((keyword) => lower.includes(keyword));
}

/** True when one order resurfaces a road and the other excavates it. */
function isPavementConflict(a: WorkOrderInput, b: WorkOrderInput): boolean {
  const aAsphalt = includesAny(a.departmentName, ASPHALT_KEYWORDS);
  const bAsphalt = includesAny(b.departmentName, ASPHALT_KEYWORDS);
  const aExcavates = includesAny(a.departmentName, EXCAVATION_KEYWORDS);
  const bExcavates = includesAny(b.departmentName, EXCAVATION_KEYWORDS);
  return (aAsphalt && bExcavates) || (bAsphalt && aExcavates);
}

const severityRank: Record<DetectedConflict['severity'], number> = {
  high: 0,
  medium: 1,
  low: 2,
};

/**
 * Deterministically detects scheduling conflicts between municipal work orders.
 *
 * A conflict is any pair of work orders within {@link PROXIMITY_METERS} of each
 * other whose planned date ranges overlap by at least one day. Severity is HIGH
 * for pavement conflicts (resurfacing vs. excavation) or same-site overlaps,
 * MEDIUM otherwise.
 *
 * Pure function — no database, no AI, no network. This is the guaranteed
 * detection path that works even when the AI agent is unavailable.
 */
export function detectConflicts(workOrders: WorkOrderInput[]): ConflictReport {
  const conflicts: DetectedConflict[] = [];

  for (let i = 0; i < workOrders.length; i += 1) {
    for (let j = i + 1; j < workOrders.length; j += 1) {
      const a = workOrders[i];
      const b = workOrders[j];

      const distanceMeters = Math.round(
        getDistanceMeters(a.locationLat, a.locationLng, b.locationLat, b.locationLng),
      );
      const overlapDays = getOverlapDays(
        new Date(a.plannedStartDate),
        new Date(a.plannedEndDate),
        new Date(b.plannedStartDate),
        new Date(b.plannedEndDate),
      );

      if (distanceMeters > PROXIMITY_METERS || overlapDays < 1) continue;

      let severity: DetectedConflict['severity'];
      let reason: string;

      if (isPavementConflict(a, b)) {
        severity = 'high';
        reason =
          `${a.departmentName} ve ${b.departmentName} aynı bölgede ${overlapDays} gün ` +
          `örtüşen tarihlerde çalışacak. Yeni dökülen asfalt kazı sırasında tahrip olur — ` +
          `kazı çalışmasını asfaltlamadan önce planlayın.`;
      } else if (distanceMeters <= SAME_SITE_METERS) {
        severity = 'high';
        reason =
          `İki iş emri neredeyse aynı noktada (${distanceMeters} m) ve ${overlapDays} gün ` +
          `boyunca örtüşüyor. Ekipler aynı alanda çakışacak.`;
      } else {
        severity = 'medium';
        reason =
          `İki iş emri ${distanceMeters} m mesafede ve ${overlapDays} gün örtüşüyor. ` +
          `Trafik ve ekip koordinasyonu gerekir.`;
      }

      conflicts.push({ workOrderA: a, workOrderB: b, distanceMeters, overlapDays, severity, reason });
    }
  }

  conflicts.sort((x, y) => severityRank[x.severity] - severityRank[y.severity]);

  const highCount = conflicts.filter((c) => c.severity === 'high').length;
  const summary =
    conflicts.length === 0
      ? 'Çatışma tespit edilmedi. Tüm iş emirleri güvenli şekilde planlanmış.'
      : `${conflicts.length} çatışma tespit edildi (${highCount} yüksek öncelikli).`;

  return {
    summary,
    conflicts,
    totalImpact: calculateTotalImpact(conflicts),
  };
}

function calculateTotalImpact(conflicts: DetectedConflict[]): ConflictImpact {
  return conflicts.reduce(
    (impact, conflict) => {
      const severityMultiplier = conflict.severity === 'high' ? 1.5 : conflict.severity === 'medium' ? 1 : 0.6;
      const dailyBudget = conflict.severity === 'high' ? 180000 : conflict.severity === 'medium' ? 90000 : 32000;
      const dailyCo2 = conflict.severity === 'high' ? 1280 : conflict.severity === 'medium' ? 560 : 180;

      return {
        wastedBudgetTRY: impact.wastedBudgetTRY + Math.round(dailyBudget * conflict.overlapDays * severityMultiplier),
        co2KgSaved: impact.co2KgSaved + Math.round(dailyCo2 * conflict.overlapDays),
        roadMetersSaved:
          impact.roadMetersSaved + Math.round(conflict.distanceMeters * Math.min(conflict.overlapDays, 3) * 0.8),
      };
    },
    {
      wastedBudgetTRY: 0,
      co2KgSaved: 0,
      roadMetersSaved: 0,
    },
  );
}
