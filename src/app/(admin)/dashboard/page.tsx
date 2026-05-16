// Admin Dashboard — work order management + AI conflict alerts
// Branch: feat/admin-ai — Owner: Ozan Osman Akan
export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
              CS
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">CitySync AI — Admin</h1>
              <p className="text-xs text-gray-500">Municipal Operations Dashboard</p>
            </div>
          </div>
          {/* AI Analysis button goes here */}
        </div>
      </header>

      <div className="p-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Stats cards */}
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">Active Work Orders</p>
          <p className="text-2xl font-bold">–</p>
        </div>
        <div className="rounded-lg border bg-white p-4">
          <p className="text-sm text-gray-500">Pending Reports</p>
          <p className="text-2xl font-bold">–</p>
        </div>
        <div className="rounded-lg border bg-red-50 border-red-200 p-4">
          <p className="text-sm text-red-600">AI Conflict Alerts</p>
          <p className="text-2xl font-bold text-red-700">–</p>
        </div>

        {/* Work orders list — replace with real data */}
        <div className="lg:col-span-2 rounded-lg border bg-white p-4">
          <h2 className="font-semibold mb-3">Scheduled Work Orders</h2>
          <p className="text-sm text-gray-400">Work orders list goes here</p>
        </div>

        {/* AI conflict panel — replace with AI agent output */}
        <div className="rounded-lg border bg-white p-4">
          <h2 className="font-semibold mb-3">AI Conflict Analysis</h2>
          <p className="text-sm text-gray-400">AI agent output goes here</p>
        </div>
      </div>
    </main>
  );
}
