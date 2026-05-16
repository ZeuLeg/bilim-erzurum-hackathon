import { db } from '@/db';
import { reports, workOrders } from '@/db/schema';
import ClientDashboard from './ClientDashboard';

async function getWorkOrders() {
  return db.select().from(workOrders).all();
}

async function getPendingReportsCount(): Promise<number> {
  const allReports = db.select().from(reports).all();
  return allReports.filter((r) => r.status === 'pending').length;
}

export default async function DashboardPage() {
  const workOrdersData = await getWorkOrders();
  const pendingReportsCount = await getPendingReportsCount();

  const clientWorkOrders = workOrdersData.map((order) => ({
    ...order,
    plannedStartDate: new Date(order.plannedStartDate).toISOString(),
    plannedEndDate: new Date(order.plannedEndDate).toISOString(),
  }));

  return (
    <ClientDashboard
      workOrders={clientWorkOrders}
      totalWorkOrders={workOrdersData.length}
      pendingReportsCount={pendingReportsCount}
    />
  );
}
