import { tool } from 'ai';
import { z } from 'zod';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { reports, workOrders } from '@/db/schema';

export const getWorkOrdersTool = tool({
  description:
    'Retrieves all scheduled municipal work orders from the database, including department name, dates, location, and status.',
  parameters: z.object({}),
  execute: async () => {
    const data = db.select().from(workOrders).all();
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
        ? query.all()
        : query.where(eq(reports.status, status)).all();

    return data.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
    }));
  },
});

export const agentTools = {
  getWorkOrders: getWorkOrdersTool,
  getCitizenReports: getCitizenReportsTool,
};
