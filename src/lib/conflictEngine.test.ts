import { describe, it, expect } from 'vitest';
import { detectConflicts, type WorkOrderInput } from './conflictEngine';

const baseWorkOrder: WorkOrderInput = {
  id: 0,
  departmentName: 'Generic Department',
  description: 'Test work order',
  plannedStartDate: '2026-06-01',
  plannedEndDate: '2026-06-10',
  locationLat: 39.9,
  locationLng: 41.27,
  status: 'scheduled',
};

const make = (over: Partial<WorkOrderInput>): WorkOrderInput => ({ ...baseWorkOrder, ...over });

describe('detectConflicts', () => {
  it('flags the seed collision as one HIGH pavement conflict', () => {
    const report = detectConflicts([
      make({
        id: 1,
        departmentName: 'Asphalt Department',
        plannedStartDate: '2026-06-01',
        plannedEndDate: '2026-06-15',
        locationLat: 39.907,
        locationLng: 41.268,
      }),
      make({
        id: 2,
        departmentName: 'Water & Sewage Department',
        plannedStartDate: '2026-06-08',
        plannedEndDate: '2026-06-20',
        locationLat: 39.907,
        locationLng: 41.268,
      }),
    ]);

    expect(report.conflicts).toHaveLength(1);
    expect(report.conflicts[0].severity).toBe('high');
    expect(report.conflicts[0].distanceMeters).toBe(0);
    expect(report.conflicts[0].overlapDays).toBe(7);
    expect(report.conflicts[0].reason).toContain('asfalt');
  });

  it('reports no conflict when work orders are far apart', () => {
    const report = detectConflicts([
      make({ id: 1, locationLat: 39.9, locationLng: 41.27 }),
      make({ id: 2, locationLat: 39.92, locationLng: 41.27 }),
    ]);
    expect(report.conflicts).toHaveLength(0);
    expect(report.summary).toContain('Çatışma tespit edilmedi');
  });

  it('reports no conflict when date ranges do not overlap', () => {
    const report = detectConflicts([
      make({ id: 1, plannedStartDate: '2026-06-01', plannedEndDate: '2026-06-05' }),
      make({ id: 2, plannedStartDate: '2026-06-10', plannedEndDate: '2026-06-15' }),
    ]);
    expect(report.conflicts).toHaveLength(0);
  });

  it('rates a nearby (50–300 m) non-pavement overlap as MEDIUM', () => {
    const report = detectConflicts([
      make({ id: 1, departmentName: 'Parks Department', locationLat: 39.9 }),
      make({ id: 2, departmentName: 'Signage Department', locationLat: 39.9015 }),
    ]);
    expect(report.conflicts).toHaveLength(1);
    expect(report.conflicts[0].severity).toBe('medium');
    expect(report.conflicts[0].distanceMeters).toBeGreaterThan(50);
    expect(report.conflicts[0].distanceMeters).toBeLessThanOrEqual(300);
  });

  it('rates a same-site (<50 m) non-pavement overlap as HIGH', () => {
    const report = detectConflicts([
      make({ id: 1, departmentName: 'Parks Department', locationLat: 39.9 }),
      make({ id: 2, departmentName: 'Signage Department', locationLat: 39.9003 }),
    ]);
    expect(report.conflicts).toHaveLength(1);
    expect(report.conflicts[0].severity).toBe('high');
  });

  it('returns an empty report for fewer than two work orders', () => {
    expect(detectConflicts([]).conflicts).toHaveLength(0);
    expect(detectConflicts([make({ id: 1 })]).conflicts).toHaveLength(0);
  });

  it('sorts HIGH-severity conflicts ahead of MEDIUM ones', () => {
    const report = detectConflicts([
      make({ id: 1, departmentName: 'Parks Department', locationLat: 39.9, locationLng: 41.27 }),
      make({ id: 2, departmentName: 'Signage Department', locationLat: 39.9015, locationLng: 41.27 }),
      make({ id: 3, departmentName: 'Asphalt Department', locationLat: 39.95, locationLng: 41.3 }),
      make({ id: 4, departmentName: 'Water & Sewage Department', locationLat: 39.95, locationLng: 41.3 }),
    ]);
    expect(report.conflicts).toHaveLength(2);
    expect(report.conflicts[0].severity).toBe('high');
    expect(report.conflicts[1].severity).toBe('medium');
  });

  it('accepts Date objects as well as ISO strings', () => {
    const report = detectConflicts([
      make({
        id: 1,
        departmentName: 'Asphalt Department',
        plannedStartDate: new Date('2026-06-01'),
        plannedEndDate: new Date('2026-06-15'),
        locationLat: 39.907,
        locationLng: 41.268,
      }),
      make({
        id: 2,
        departmentName: 'Water & Sewage Department',
        plannedStartDate: new Date('2026-06-08'),
        plannedEndDate: new Date('2026-06-20'),
        locationLat: 39.907,
        locationLng: 41.268,
      }),
    ]);
    expect(report.conflicts).toHaveLength(1);
    expect(report.conflicts[0].severity).toBe('high');
  });

  it('matches Turkish department names and aggregates the impact total', () => {
    const report = detectConflicts([
      make({
        id: 1,
        departmentName: 'Asfalt Müdürlüğü',
        plannedStartDate: '2026-06-01',
        plannedEndDate: '2026-06-15',
        locationLat: 39.907,
        locationLng: 41.268,
      }),
      make({
        id: 2,
        departmentName: 'Su ve Kanalizasyon Müdürlüğü',
        plannedStartDate: '2026-06-08',
        plannedEndDate: '2026-06-20',
        locationLat: 39.907,
        locationLng: 41.268,
      }),
    ]);
    expect(report.conflicts).toHaveLength(1);
    expect(report.conflicts[0].severity).toBe('high');
    expect(report.conflicts[0].impact.wastedBudgetTRY).toBeGreaterThan(0);
    expect(report.totalImpact.wastedBudgetTRY).toBe(report.conflicts[0].impact.wastedBudgetTRY);
    expect(report.totalImpact.co2KgSaved).toBeGreaterThan(0);
  });

  it('reports a zero impact total when there are no conflicts', () => {
    const report = detectConflicts([make({ id: 1 })]);
    expect(report.totalImpact).toEqual({ wastedBudgetTRY: 0, co2KgSaved: 0, roadMetersSaved: 0 });
  });
});
