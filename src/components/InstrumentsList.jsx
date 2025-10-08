// src/components/InstrumentsList.jsx
import { Edit, TrendingUp, TrendingDown, Activity, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function InstrumentsList({ instruments, onEdit, onDelete, onOpenActions }) {
  if (!instruments || instruments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <div className="max-w-md mx-auto">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Activity size={40} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            No tienes instrumentos registrados
          </h3>
          <p className="text-gray-600 mb-6">
            Comienza agregando tu primer instrumento de inversión para empezar a trackear tu portafolio
          </p>
          <button
            onClick={() => onEdit(null)}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
          >
            + Agregar primer instrumento
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Mis Instrumentos</h2>
          <p className="text-sm text-gray-600 mt-1">
            {instruments.length} {instruments.length === 1 ? 'instrumento' : 'instrumentos'} en tu portafolio
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {instruments.map((instrument) => (
          <InstrumentCard
            key={instrument.id || instrument.name}
            instrument={instrument}
            onEdit={onEdit}
            onDelete={onDelete}
            onOpenActions={onOpenActions}
          />
        ))}
      </div>
    </div>
  );
}

function InstrumentCard({ instrument, onEdit, onDelete, onOpenActions }) {
  // Calcular totales de flujos de capital
  const totalDeposits = (instrument.cashFlows || [])
    .filter(cf => cf.type === 'deposit')
    .reduce((sum, cf) => sum + cf.amount, 0);
  
  const totalWithdrawals = (instrument.cashFlows || [])
    .filter(cf => cf.type === 'withdrawal')
    .reduce((sum, cf) => sum + cf.amount, 0);
  
  const netInvested = totalDeposits - totalWithdrawals;
  const currentValue = instrument.currentValue || 0;
  const gain = currentValue - netInvested;
  const yieldPct = netInvested > 0 ? (gain / netInvested) * 100 : 0;

  // Obtener categoría
  const categories = {
    stocks: { label: 'Acciones', icon: '📈', color: 'blue' },
    bonds: { label: 'Bonos/CETES', icon: '🏦', color: 'green' },
    funds: { label: 'Fondos', icon: '💼', color: 'purple' },
    crypto: { label: 'Crypto', icon: '₿', color: 'orange' },
    'real-estate': { label: 'Bienes Raíces', icon: '🏠', color: 'red' },
    commodities: { label: 'Commodities', icon: '🥇', color: 'yellow' },
    other: { label: 'Otro', icon: '📊', color: 'gray' }
  };

  const category = categories[instrument.category] || categories.other;
  
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    green: 'bg-green-100 text-green-700 border-green-200',
    purple: 'bg-purple-100 text-purple-700 border-purple-200',
    orange: 'bg-orange-100 text-orange-700 border-orange-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200'
  };

  return (
    <div className="border border-gray-200 rounded-lg hover:shadow-md transition-all p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-lg font-bold text-gray-800">
              {instrument.name}
            </h3>
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colorClasses[category.color]}`}>
              {category.icon} {category.label}
            </span>
          </div>
          
          {instrument.broker && (
            <p className="text-sm text-gray-600">
              📍 {instrument.broker}
            </p>
          )}
          
          {instrument.description && (
            <p className="text-sm text-gray-500 mt-1">
              {instrument.description}
            </p>
          )}
        </div>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-4 bg-gray-50 rounded-lg">
        <div>
          <p className="text-xs text-gray-600 mb-1">Capital invertido</p>
          <p className="text-base font-bold text-gray-800">
            ${netInvested.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-600 mb-1">Valor actual</p>
          <p className="text-base font-bold text-blue-600">
            ${currentValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-600 mb-1">Ganancia/Pérdida</p>
          <p className={`text-base font-bold ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {gain >= 0 ? '+' : '-'}${Math.abs(gain).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        </div>
        
        <div>
          <p className="text-xs text-gray-600 mb-1">Rendimiento</p>
          <div className="flex items-center gap-1">
            {yieldPct >= 0 ? (
              <TrendingUp size={16} className="text-green-600" />
            ) : (
              <TrendingDown size={16} className="text-red-600" />
            )}
            <p className={`text-base font-bold ${yieldPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {yieldPct >= 0 ? '+' : ''}{yieldPct.toFixed(2)}%
            </p>
          </div>
        </div>
      </div>

      {/* Información adicional */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-600 mb-4">
        <div className="flex items-center gap-1">
          <span>💰 Depósitos:</span>
          <span className="font-semibold text-green-600">
            ${totalDeposits.toLocaleString('es-MX')}
          </span>
        </div>
        
        {totalWithdrawals > 0 && (
          <div className="flex items-center gap-1">
            <span>💸 Retiros:</span>
            <span className="font-semibold text-red-600">
              ${totalWithdrawals.toLocaleString('es-MX')}
            </span>
          </div>
        )}
        
        <div className="flex items-center gap-1">
          <span>📊 Valuaciones:</span>
          <span className="font-semibold">
            {(instrument.valuations || []).length}
          </span>
        </div>
        
        {instrument.lastValuationDate && (
          <div className="flex items-center gap-1">
            <span>📅 Última valuación:</span>
            <span className="font-semibold">
              {format(new Date(instrument.lastValuationDate), 'dd/MMM/yyyy', { locale: es })}
            </span>
          </div>
        )}
      </div>

      {/* Botones de acción */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => onOpenActions(instrument)}
          className="flex-1 min-w-[140px] px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2 transition"
        >
          <Activity size={16} />
          Acciones
        </button>
        
        <button
          onClick={() => onEdit(instrument)}
          className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 font-medium flex items-center gap-2 transition"
        >
          <Edit size={16} />
          Editar
        </button>
        
        {onDelete && (
          <button
            onClick={() => {
              if (window.confirm(`¿Estás seguro de eliminar "${instrument.name}"? Esta acción no se puede deshacer.`)) {
                onDelete(instrument);
              }
            }}
            className="px-4 py-2.5 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 font-medium flex items-center gap-2 transition"
          >
            <Trash2 size={16} />
            Eliminar
          </button>
        )}
      </div>
    </div>
  );
}