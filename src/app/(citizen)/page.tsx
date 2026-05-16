// Citizen Portal — public map view + infrastructure report form
// Branch: feat/citizen — Owner: Hüseyin Taha Adanur
export default function CitizenPage() {
  return (
    <main className="flex min-h-screen flex-col">
      <header className="border-b bg-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold text-sm">
            CS
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">CitySync AI</h1>
            <p className="text-xs text-gray-500">Erzurum Municipal Platform</p>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Map area — replace with <CityMap /> component */}
        <div className="flex-1 bg-gray-100 flex items-center justify-center">
          <p className="text-gray-400 text-sm">Map component goes here</p>
        </div>

        {/* Report form sidebar — replace with <ReportForm /> component */}
        <aside className="w-80 border-l bg-white p-6">
          <h2 className="text-base font-semibold mb-4">Report an Issue</h2>
          <p className="text-sm text-gray-500">Form component goes here</p>
        </aside>
      </div>
    </main>
  );
}
