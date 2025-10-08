// src/components/StatsCards.jsx
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, DollarSign, Calendar } from 'lucide-react';

export default function StatsCards({ 
  deposits, 
  withdrawals, 
  totalInvested, 
  currentValue, 
  gain, 
  yieldPct,
  dateRange 
}) {
  const netFlow = deposits - withdrawals;
  const isPeriodFiltered = dateRange !== null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Tarjeta de Movimientos */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-blue-50 rounded-lg">
            <DollarSign size={20} className="text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            {isPeriodFiltered ? 'Movimientos en el periodo' : 'Movimientos totales'}
          </h3>
        </div>

        <div className="space-y-4">
          {/* Depósitos */}
          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-full">
                <ArrowUpCircle size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Depósitos</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isPeriodFiltered ? 'Capital agregado' : 'Total histórico'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-green-600">
                +${deposits.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Retiros */}
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-full">
                <ArrowDownCircle size={20} className="text-red-600" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-600">Retiros</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {isPeriodFiltered ? 'Capital retirado' : 'Total histórico'}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xl font-bold text-red-600">
                -${withdrawals.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Flujo neto */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Flujo neto de capital</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Depósitos - Retiros
                </p>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${
                  netFlow >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {netFlow >= 0 ? '+' : '-'}${Math.abs(netFlow).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta de Rendimiento */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="p-2 bg-purple-50 rounded-lg">
            <TrendingUp size={20} className="text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            Análisis de Rendimiento
          </h3>
        </div>

        <div className="space-y-4">
          {/* Capital invertido */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-600">Capital invertido</p>
              <p className="text-xs text-gray-500 mt-0.5">Base de cálculo</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-gray-800">
                ${totalInvested.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Valor actual */}
          <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-600">Valor actual</p>
              <p className="text-xs text-gray-500 mt-0.5">Última valuación</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold text-blue-600">
                ${currentValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Ganancia/Pérdida */}
          <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {gain >= 0 ? 'Ganancia' : 'Pérdida'}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                Valor actual - Capital invertido
              </p>
            </div>
            <div className="text-right">
              <p className={`text-lg font-bold ${
                gain >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {gain >= 0 ? '+' : '-'}${Math.abs(gain).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* ROI */}
          <div className="pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">ROI (Return on Investment)</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Rendimiento porcentual
                </p>
              </div>
              <div className="text-right">
                <div className={`inline-flex items-center gap-1 px-4 py-2 rounded-lg font-bold text-xl ${
                  yieldPct >= 0 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-red-100 text-red-700'
                }`}>
                  {yieldPct >= 0 ? '↑' : '↓'}
                  <span>{Math.abs(yieldPct).toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjeta de información adicional (solo si hay filtro de fecha) */}
      {isPeriodFiltered && (
        <div className="lg:col-span-2 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl shadow-sm p-6 border border-blue-100">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Calendar size={20} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                📊 Análisis del periodo filtrado
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-gray-600 mb-1">Movimientos netos</p>
                  <p className={`text-lg font-bold ${netFlow >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {netFlow >= 0 ? '+' : ''}${netFlow.toLocaleString('es-MX')}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-gray-600 mb-1">Depósitos realizados</p>
                  <p className="text-lg font-bold text-blue-600">
                    {deposits > 0 ? `${deposits.toLocaleString('es-MX')} MXN` : 'Sin depósitos'}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-gray-600 mb-1">Retiros realizados</p>
                  <p className="text-lg font-bold text-orange-600">
                    {withdrawals > 0 ? `${withdrawals.toLocaleString('es-MX')} MXN` : 'Sin retiros'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}