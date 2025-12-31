// src/components/AdvancedCharts.jsx
import React, { useState, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart, ComposedChart
} from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Activity, TrendingDown } from 'lucide-react';
import { format, isWithinInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { normalizeDate } from '../utils/dateHelpers.js';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

// Helper para formatear fechas de forma segura
const formatDateSafe = (dateInput, formatStr = 'dd/MMM') => {
  if (!dateInput) return '';
  try {
    const date = normalizeDate(dateInput);
    if (!date || isNaN(date.getTime())) return '';
    return format(date, formatStr, { locale: es });
  } catch {
    return '';
  }
};

// Generar datos de evolución temporal
function generateEvolutionData(instruments, dateRange, selectedInstruments = []) {
  const filteredInstruments = selectedInstruments.length > 0
    ? instruments.filter(inst => selectedInstruments.includes(inst.name))
    : instruments;

  const allDates = new Set();
  
  filteredInstruments.forEach(inst => {
    (inst.valuations || []).forEach(v => {
      if (!v?.date || typeof v.value !== 'number') return;
      
      const vDate = new Date(v.date);
      if (isNaN(vDate.getTime())) return;
      
      if (!dateRange || isWithinInterval(vDate, dateRange)) {
        allDates.add(format(vDate, 'yyyy-MM-dd'));
      }
    });
  });

  if (allDates.size === 0) return [];

  const sortedDates = Array.from(allDates).sort();
  
  return sortedDates.map(dateStr => {
    const displayDate = formatDateSafe(dateStr);
    const point = { date: displayDate, fullDate: dateStr };
    let total = 0;
    
    filteredInstruments.forEach(inst => {
      const valuationsUpToDate = (inst.valuations || [])
        .filter(v => {
          if (!v?.date || typeof v.value !== 'number') return false;
          const vDate = format(new Date(v.date), 'yyyy-MM-dd');
          return vDate <= dateStr;
        })
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      
      if (valuationsUpToDate.length > 0) {
        const value = valuationsUpToDate[0].value;
        point[inst.name] = value;
        total += value;
      }
    });
    
    point.Total = total;
    return point;
  });
}

// Tooltip personalizado
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
        <p className="font-semibold text-gray-800 mb-2">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: ${entry.value?.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function AdvancedCharts({ instruments, dateRange }) {
  const [selectedChart, setSelectedChart] = useState('evolution');
  const [selectedInstruments, setSelectedInstruments] = useState([]);
  const [showComparison, setShowComparison] = useState(false);

  const validInstruments = useMemo(() => 
    (instruments || []).filter(inst => inst && inst.name && inst.name.trim()),
    [instruments]
  );

  // Datos de evolución
  const evolutionData = useMemo(() => 
    generateEvolutionData(validInstruments, dateRange, selectedInstruments),
    [validInstruments, dateRange, selectedInstruments]
  );

  // Datos de distribución
  const distributionData = useMemo(() => 
    validInstruments
      .map(inst => ({
        name: inst.name,
        value: typeof inst.currentValue === 'number' ? inst.currentValue : 0
      }))
      .filter(item => item.value > 0),
    [validInstruments]
  );

  // Datos de rendimiento
  const performanceData = useMemo(() => 
    validInstruments.map(inst => {
      const totalDeposits = (inst.cashFlows || [])
        .filter(cf => cf.type === 'deposit')
        .reduce((sum, cf) => sum + (cf.amount || 0), 0);
      
      const totalWithdrawals = (inst.cashFlows || [])
        .filter(cf => cf.type === 'withdrawal')
        .reduce((sum, cf) => sum + (cf.amount || 0), 0);
      
      const netInvested = totalDeposits - totalWithdrawals;
      const currentValue = inst.currentValue || 0;
      const gain = currentValue - netInvested;
      const yieldPct = netInvested > 0 ? (gain / netInvested) * 100 : 0;

      return {
        name: inst.name,
        invested: netInvested,
        current: currentValue,
        gain: gain,
        yieldPct: yieldPct
      };
    }),
    [validInstruments]
  );

  // Datos de flujo de efectivo
  const cashFlowData = useMemo(() => {
    const monthlyData = {};
    
    validInstruments.forEach(inst => {
      (inst.cashFlows || []).forEach(cf => {
        if (!cf?.date || typeof cf.amount !== 'number') return;
        
        const cfDate = normalizeDate(cf.date);
        if (!cfDate || isNaN(cfDate.getTime())) return;
        
        if (dateRange && !isWithinInterval(cfDate, dateRange)) return;
        
        const monthKey = format(cfDate, 'yyyy-MM');
        const monthLabel = format(cfDate, 'MMM yyyy', { locale: es });
        
        if (!monthlyData[monthKey]) {
          monthlyData[monthKey] = { month: monthLabel, deposits: 0, withdrawals: 0 };
        }
        
        if (cf.type === 'deposit') {
          monthlyData[monthKey].deposits += cf.amount;
        } else if (cf.type === 'withdrawal') {
          monthlyData[monthKey].withdrawals += cf.amount;
        }
      });
    });
    
    return Object.keys(monthlyData)
      .sort()
      .map(key => monthlyData[key]);
  }, [validInstruments, dateRange]);

  if (validInstruments.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-12 text-center">
        <Activity size={48} className="mx-auto text-gray-400 mb-4" />
        <p className="text-gray-600">No hay datos suficientes para mostrar gráficos</p>
      </div>
    );
  }

  const handleInstrumentToggle = (instName) => {
    setSelectedInstruments(prev => 
      prev.includes(instName)
        ? prev.filter(n => n !== instName)
        : [...prev, instName]
    );
  };

  const chartTabs = [
    { id: 'evolution', label: 'Evolución Temporal', icon: TrendingUp },
    { id: 'distribution', label: 'Distribución', icon: PieChartIcon },
    { id: 'performance', label: 'Rendimiento', icon: BarChart3 },
    { id: 'cashflow', label: 'Flujo de Efectivo', icon: Activity }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-800">Análisis y Gráficos</h2>
        
        {selectedChart === 'evolution' && (
          <button
            onClick={() => setShowComparison(!showComparison)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              showComparison
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {showComparison ? 'Ver Total' : 'Comparar Instrumentos'}
          </button>
        )}
      </div>

      {/* Tabs de gráficos */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {chartTabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedChart(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                selectedChart === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Icon size={18} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Selector de instrumentos para comparación */}
      {showComparison && selectedChart === 'evolution' && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Selecciona los instrumentos a comparar:
          </p>
          <div className="flex flex-wrap gap-2">
            {validInstruments.map((inst) => (
              <button
                key={inst.name}
                onClick={() => handleInstrumentToggle(inst.name)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                  selectedInstruments.length === 0 || selectedInstruments.includes(inst.name)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                }`}
              >
                {inst.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Gráfico de evolución */}
      {selectedChart === 'evolution' && evolutionData.length > 0 && (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={evolutionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            
            {showComparison && selectedInstruments.length > 0 ? (
              validInstruments
                .filter(inst => selectedInstruments.includes(inst.name))
                .map((inst, idx) => (
                  <Area
                    key={inst.name}
                    type="monotone"
                    dataKey={inst.name}
                    stroke={COLORS[idx % COLORS.length]}
                    fill={COLORS[idx % COLORS.length]}
                    fillOpacity={0.6}
                  />
                ))
            ) : (
              <Area
                type="monotone"
                dataKey="Total"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.6}
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      )}

      {/* Gráfico de distribución */}
      {selectedChart === 'distribution' && distributionData.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={distributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {distributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-800 mb-4">Detalle de Distribución</h3>
            {distributionData.map((item, index) => {
              const total = distributionData.reduce((sum, d) => sum + d.value, 0);
              const percentage = ((item.value / total) * 100).toFixed(2);
              
              return (
                <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    />
                    <span className="font-medium text-gray-800">{item.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">
                      ${item.value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </p>
                    <p className="text-sm text-gray-600">{percentage}%</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gráfico de rendimiento */}
      {selectedChart === 'performance' && performanceData.length > 0 && (
        <div className="space-y-6">
          <ResponsiveContainer width="100%" height={350}>
            <ComposedChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis 
                yAxisId="left"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <YAxis 
                yAxisId="right"
                orientation="right"
                stroke="#6b7280"
                style={{ fontSize: '12px' }}
                tickFormatter={(value) => `${value.toFixed(1)}%`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar yAxisId="left" dataKey="invested" fill="#3b82f6" name="Invertido" />
              <Bar yAxisId="left" dataKey="current" fill="#10b981" name="Valor Actual" />
              <Line yAxisId="right" type="monotone" dataKey="yieldPct" stroke="#f59e0b" name="Rendimiento %" strokeWidth={2} />
            </ComposedChart>
          </ResponsiveContainer>

          {/* Tabla de métricas detalladas */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Instrumento</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Invertido</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Valor Actual</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Ganancia</th>
                  <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Rendimiento</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {performanceData.map(item => (
                  <tr key={item.name} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-4 py-3 text-sm text-right text-gray-700">
                      ${item.invested.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-4 py-3 text-sm text-right font-medium text-blue-600">
                      ${item.current.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-medium ${
                      item.gain >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.gain >= 0 ? '+' : ''}${item.gain.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>
                    <td className={`px-4 py-3 text-sm text-right font-bold ${
                      item.yieldPct >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.yieldPct >= 0 ? '+' : ''}{item.yieldPct.toFixed(2)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Gráfico de flujo de efectivo */}
      {selectedChart === 'cashflow' && cashFlowData.length > 0 && (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={cashFlowData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#6b7280"
              style={{ fontSize: '12px' }}
              tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="deposits" fill="#10b981" name="Depósitos" />
            <Bar dataKey="withdrawals" fill="#ef4444" name="Retiros" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
