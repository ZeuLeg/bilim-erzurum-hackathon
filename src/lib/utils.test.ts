import { describe, it, expect } from 'vitest';
import { getDistanceMeters, getOverlapDays } from './utils';

describe('getDistanceMeters', () => {
  it('returns 0 for the same point', () => {
    expect(getDistanceMeters(39.907, 41.268, 39.907, 41.268)).toBe(0);
  });

  it('is symmetric — distance A→B equals B→A', () => {
    const ab = getDistanceMeters(39.907, 41.268, 39.912, 41.278);
    const ba = getDistanceMeters(39.912, 41.278, 39.907, 41.268);
    expect(ab).toBeCloseTo(ba, 6);
  });

  it('measures ~111 km for one degree of latitude', () => {
    const d = getDistanceMeters(0, 0, 1, 0);
    expect(d).toBeGreaterThan(110_000);
    expect(d).toBeLessThan(112_000);
  });

  it('flags two work orders at identical coordinates as within the 300 m rule', () => {
    // Seed collision: WO#1 and WO#2 share lat/lng 39.907 / 41.268
    const d = getDistanceMeters(39.907, 41.268, 39.907, 41.268);
    expect(d).toBeLessThan(300);
  });

  it('flags clearly separate locations as outside the 300 m rule', () => {
    const d = getDistanceMeters(39.907, 41.268, 39.912, 41.278);
    expect(d).toBeGreaterThan(300);
  });
});

describe('getOverlapDays', () => {
  const d = (iso: string) => new Date(iso);

  it('returns 7 days for the seed collision (Jun 1–15 vs Jun 8–20)', () => {
    const overlap = getOverlapDays(
      d('2026-06-01'),
      d('2026-06-15'),
      d('2026-06-08'),
      d('2026-06-20'),
    );
    expect(overlap).toBe(7);
  });

  it('returns 0 when the ranges do not overlap', () => {
    const overlap = getOverlapDays(
      d('2026-06-01'),
      d('2026-06-05'),
      d('2026-06-10'),
      d('2026-06-15'),
    );
    expect(overlap).toBe(0);
  });

  it('returns 0 for ranges that only touch at the boundary', () => {
    const overlap = getOverlapDays(
      d('2026-06-01'),
      d('2026-06-10'),
      d('2026-06-10'),
      d('2026-06-20'),
    );
    expect(overlap).toBe(0);
  });

  it('returns the inner span when one range fully contains the other', () => {
    const overlap = getOverlapDays(
      d('2026-06-01'),
      d('2026-06-30'),
      d('2026-06-10'),
      d('2026-06-15'),
    );
    expect(overlap).toBe(5);
  });

  it('is order-independent — swapping the two ranges yields the same result', () => {
    const a = getOverlapDays(d('2026-06-01'), d('2026-06-15'), d('2026-06-08'), d('2026-06-20'));
    const b = getOverlapDays(d('2026-06-08'), d('2026-06-20'), d('2026-06-01'), d('2026-06-15'));
    expect(a).toBe(b);
  });
});
