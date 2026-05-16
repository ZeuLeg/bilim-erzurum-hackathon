import { tool } from 'ai';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { reports, workOrders } from '@/db/schema';
import { detectConflicts } from '@/lib/conflictEngine';

export const getDetectedConflictsTool = tool({
  description:
    'Runs the deterministic conflict engine over all municipal work orders and ' +
    'returns pre-computed conflicts with EXACT distanceMeters, overlapDays, ' +
    'severity and estimated impact (wastedBudgetTRY, co2KgSaved). Call this first ' +
    'and trust its numbers — never compute distance or date overlap yourself.',
  parameters: z.object({}),
  execute: async () => {
    const data = await db.select().from(workOrders);
    return detectConflicts(data);
  },
});

export const getWorkOrdersTool = tool({
  description:
    'Retrieves all scheduled municipal work orders including department name, dates, location coordinates, and status.',
  parameters: z.object({}),
  execute: async () => {
    const data = await db.select().from(workOrders);
    return data.map((wo) => ({
      ...wo,
      plannedStartDate: wo.plannedStartDate.toISOString(),
      plannedEndDate: wo.plannedEndDate.toISOString(),
    }));
  },
});

export const getCitizenReportsTool = tool({
  description:
    'Retrieves all citizen-submitted infrastructure reports, including title, description, status, and GPS coordinates.',
  parameters: z.object({
    status: z
      .enum(['pending', 'in_progress', 'resolved', 'all'])
      .optional()
      .default('all')
      .describe('Filter reports by status'),
  }),
  execute: async ({ status }) => {
    const query = db.select().from(reports);
    const data =
      status === 'all'
        ? await query
        : await query.where(eq(reports.status, status));

    return data.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }));
  },
});

export const agentTools = {
  getDetectedConflicts: getDetectedConflictsTool,
  getWorkOrders: getWorkOrdersTool,
  getCitizenReports: getCitizenReportsTool,
};
