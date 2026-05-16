import { describe, it, expect } from 'vitest';
import { parseConflictReportFromText } from './conflictParser';

const fullConflict = {
  workOrderA: {
    departmentName: 'Asphalt Department',
    description: 'Road resurfacing',
    plannedStartDate: '2026-06-01',
    plannedEndDate: '2026-06-15',
    locationLat: 39.907,
    locationLng: 41.268,
    status: 'scheduled',
  },
  workOrderB: {
    departmentName: 'Water & Sewage Department',
    description: 'Pipe replacement',
    plannedStartDate: '2026-06-08',
    plannedEndDate: '2026-06-20',
    locationLat: 39.907,
    locationLng: 41.268,
    status: 'scheduled',
  },
  distanceMeters: 0,
  overlapDays: 7,
  severity: 'high',
  reason: 'Delay asphalt work until pipe replacement completes.',
};

describe('parseConflictReportFromText', () => {
  it('parses a plain JSON string', () => {
    const result = parseConflictReportFromText(
      '{"summary":"No conflicts detected.","conflicts":[]}',
    );
    expect(result).not.toBeNull();
    expect(result?.summary).toBe('No conflicts detected.');
    expect(result?.conflicts).toEqual([]);
  });

  it('extracts JSON from a fenced ```json code block', () => {
    const text = [
      'Here is the conflict report for Erzurum.',
      '```json',
      JSON.stringify({ summary: 'Found 1 conflict', conflicts: [fullConflict] }),
      '```',
    ].join('\n');

    const result = parseConflictReportFromText(text);
    expect(result?.summary).toBe('Found 1 conflict');
    expect(result?.conflicts).toHaveLength(1);
    expect(result?.conflicts[0].severity).toBe('high');
    expect(result?.conflicts[0].distanceMeters).toBe(0);
    expect(result?.conflicts[0].overlapDays).toBe(7);
  });

  it('extracts a raw JSON object embedded in surrounding prose', () => {
    const text =
      'Analysis complete. ' +
      JSON.stringify({ summary: 'ok', conflicts: [] }) +
      ' End of report.';
    const result = parseConflictReportFromText(text);
    expect(result?.summary).toBe('ok');
  });

  it('returns null for text containing no JSON', () => {
    expect(parseConflictReportFromText('Sorry, I could not analyze that.')).toBeNull();
  });

  it('falls back to "low" for an invalid severity value', () => {
    const text = JSON.stringify({
      summary: 's',
      conflicts: [{ ...fullConflict, severity: 'CATASTROPHIC' }],
    });
    const result = parseConflictReportFromText(text);
    expect(result?.conflicts[0].severity).toBe('low');
  });

  it('substitutes "N/A" when a department name is missing', () => {
    const text = JSON.stringify({
      summary: 's',
      conflicts: [{ ...fullConflict, workOrderA: {} }],
    });
    const result = parseConflictReportFromText(text);
    expect(result?.conflicts[0].workOrderA.departmentName).toBe('N/A');
  });

  it('coerces numeric fields supplied as strings', () => {
    const text = JSON.stringify({
      summary: 's',
      conflicts: [{ ...fullConflict, distanceMeters: '250', overlapDays: '3' }],
    });
    const result = parseConflictReportFromText(text);
    expect(result?.conflicts[0].distanceMeters).toBe(250);
    expect(result?.conflicts[0].overlapDays).toBe(3);
  });

  it('ignores non-object entries inside the conflicts array', () => {
    const text = JSON.stringify({
      summary: 's',
      conflicts: [fullConflict, null, 'garbage', 42],
    });
    const result = parseConflictReportFromText(text);
    expect(result?.conflicts).toHaveLength(1);
  });
});
