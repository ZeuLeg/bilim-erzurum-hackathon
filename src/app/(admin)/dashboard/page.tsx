import { db } from '@/db';
import { reports, workOrders } from '@/db/schema';
import ClientDashboard from './ClientDashboard';

export default async function DashboardPage() {
  const [workOrdersData, reportsData] = await Promise.all([
    db.select().from(workOrders).all(),
    db.select().from(reports).all(),
  ]);

  const clientWorkOrders = workOrdersData.map((order) => ({
    ...order,
    plannedStartDate: new Date(order.plannedStartDate).toISOString(),
    plannedEndDate: new Date(order.plannedEndDate).toISOString(),
  }));

  const clientReports = reportsData.map((r) => ({
    ...r,
    createdAt: new Date(r.createdAt).toISOString(),
  }));

  return (
    <ClientDashboard
      workOrders={clientWorkOrders}
      reports={clientReports}
      totalWorkOrders={workOrdersData.length}
      pendingReportsCount={reportsData.filter((r) => r.status === 'pending').length}
    />
  );
}
