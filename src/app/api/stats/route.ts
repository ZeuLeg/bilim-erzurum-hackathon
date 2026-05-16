import { db } from '@/db';
import { reports, workOrders } from '@/db/schema';
import { eq, sql } from 'drizzle-orm';
import { NextResponse } from 'next/server';

export async function GET() {
  const [reportStats] = await db
    .select({
      total: sql<number>`count(*)`,
      pending: sql<number>`sum(case when ${reports.status} = 'pending' then 1 else 0 end)`,
      in_progress: sql<number>`sum(case when ${reports.status} = 'in_progress' then 1 else 0 end)`,
      resolved: sql<number>`sum(case when ${reports.status} = 'resolved' then 1 else 0 end)`,
    })
    .from(reports);

  const [orderStats] = await db
    .select({
      total: sql<number>`count(*)`,
      scheduled: sql<number>`sum(case when ${workOrders.status} = 'scheduled' then 1 else 0 end)`,
      in_progress: sql<number>`sum(case when ${workOrders.status} = 'in_progress' then 1 else 0 end)`,
      completed: sql<number>`sum(case when ${workOrders.status} = 'completed' then 1 else 0 end)`,
    })
    .from(workOrders);

  return NextResponse.json({
    reports: {
      total: Number(reportStats.total),
      pending: Number(reportStats.pending),
      in_progress: Number(reportStats.in_progress),
      resolved: Number(reportStats.resolved),
    },
    workOrders: {
      total: Number(orderStats.total),
      scheduled: Number(orderStats.scheduled),
      in_progress: Number(orderStats.in_progress),
      completed: Number(orderStats.completed),
    },
  });
}
