// src/components/DashboardHero.jsx
export default function DashboardHero({ totalInvested = 0, currentValue = 0, gain = 0, yieldPct = 0 }) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl shadow-lg mb-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Resumen General</h2>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Invertido</p>
          <p className="text-2xl font-bold text-gray-900">${Number(totalInvested).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Valor Actual</p>
          <p className="text-2xl font-bold text-green-600">${Number(currentValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Ganancia</p>
          <p className={`text-2xl font-bold ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {gain >= 0 ? '+' : ''}${Math.abs(gain).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <p className="text-sm text-gray-500">Rendimiento</p>
          <p className={`text-2xl font-bold ${yieldPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {yieldPct >= 0 ? '+' : ''}{yieldPct.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
}