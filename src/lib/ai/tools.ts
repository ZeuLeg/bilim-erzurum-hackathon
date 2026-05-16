import { tool } from 'ai';
import { z } from 'zod';
import { db } from '@/db';
import { reports, workOrders } from '@/db/schema';

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
    'Retrieves citizen-submitted infrastructure reports including title, description, status, and GPS coordinates.',
  parameters: z.object({}),
  execute: async () => {
    const data = await db.select().from(reports);
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
