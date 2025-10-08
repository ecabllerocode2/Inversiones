// src/components/DashboardHero.jsx
import { TrendingUp, TrendingDown, DollarSign, Percent, PiggyBank, Wallet } from 'lucide-react';

export default function DashboardHero({ totalInvested, currentValue, gain, yieldPct }) {
  const isPositive = gain >= 0;

  const cards = [
    {
      title: 'Capital Invertido',
      value: totalInvested,
      icon: <PiggyBank size={24} />,
      color: 'blue',
      bgColor: 'bg-blue-50',
      iconColor: 'text-blue-600',
      description: 'Total depositado'
    },
    {
      title: 'Valor Actual',
      value: currentValue,
      icon: <Wallet size={24} />,
      color: 'purple',
      bgColor: 'bg-purple-50',
      iconColor: 'text-purple-600',
      description: 'Valor del portafolio'
    },
    {
      title: 'Ganancia',
      value: gain,
      icon: isPositive ? <TrendingUp size={24} /> : <TrendingDown size={24} />,
      color: isPositive ? 'green' : 'red',
      bgColor: isPositive ? 'bg-green-50' : 'bg-red-50',
      iconColor: isPositive ? 'text-green-600' : 'text-red-600',
      description: isPositive ? 'Ganancia neta' : 'Pérdida neta',
      showPercentage: true,
      percentage: yieldPct
    },
    {
      title: 'Rendimiento',
      value: yieldPct,
      icon: <Percent size={24} />,
      color: isPositive ? 'green' : 'red',
      bgColor: isPositive ? 'bg-green-50' : 'bg-red-50',
      iconColor: isPositive ? 'text-green-600' : 'text-red-600',
      description: 'ROI total',
      isPercentage: true
    }
  ];

  return (
    <div className="mb-6">
      {/* Título principal con resumen rápido */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg p-6 mb-6 text-white">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-2">Resumen del Portafolio</h2>
            <p className="text-blue-100 text-sm">
              Estado actualizado de tus inversiones
            </p>
          </div>
          <div className="mt-4 md:mt-0 text-right">
            <div className="text-3xl font-bold">
              ${currentValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className={`text-lg font-semibold mt-1 ${isPositive ? 'text-green-200' : 'text-red-200'}`}>
              {isPositive ? '↑' : '↓'} {Math.abs(yieldPct).toFixed(2)}% 
              <span className="text-sm ml-1">
                (${Math.abs(gain).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tarjetas de métricas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, index) => (
          <MetricCard key={index} {...card} />
        ))}
      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  icon, 
  bgColor, 
  iconColor, 
  description, 
  showPercentage, 
  percentage,
  isPercentage 
}) {
  const formatValue = (val) => {
    if (isPercentage) {
      return `${val >= 0 ? '+' : ''}${val.toFixed(2)}%`;
    }
    return `$${Math.abs(val).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-5 hover:shadow-md transition-shadow">
      {/* Header con icono */}
      <div className="flex items-center justify-between mb-3">
        <div className={`p-3 rounded-lg ${bgColor}`}>
          <div className={iconColor}>
            {icon}
          </div>
        </div>
        {showPercentage && (
          <div className={`text-sm font-bold px-2.5 py-1 rounded-full ${
            value >= 0 
              ? 'bg-green-100 text-green-700' 
              : 'bg-red-100 text-red-700'
          }`}>
            {value >= 0 ? '+' : ''}{percentage.toFixed(2)}%
          </div>
        )}
      </div>

      {/* Título */}
      <h3 className="text-sm font-medium text-gray-600 mb-1">
        {title}
      </h3>

      {/* Valor principal */}
      <div className={`text-2xl font-bold mb-1 ${
        !isPercentage && value < 0 ? 'text-red-600' : 'text-gray-800'
      }`}>
        {!isPercentage && value < 0 && '-'}
        {formatValue(value)}
      </div>

      {/* Descripción */}
      <p className="text-xs text-gray-500">
        {description}
      </p>
    </div>
  );
}