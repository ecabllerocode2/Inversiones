// src/components/ChartSection.jsx
import React from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Helper seguro para fechas
const formatDateSafe = (dateInput, formatStr = 'yyyy-MM-dd') => {
  if (!dateInput) return null;
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) return null;
  return format(date, formatStr, { locale: es });
};

function generateEvolutionData(instruments, dateRange) {
  const allDates = new Set();
  
  instruments.forEach(inst => {
    (inst.valuations || []).forEach(v => {
      if (!v?.date || typeof v.value !== 'number') return;
      
      const formattedDate = formatDateSafe(v.date, 'yyyy-MM-dd');
      if (!formattedDate) return;
      
      if (dateRange) {
        const vDate = new Date(v.date);
        if (isNaN(vDate.getTime())) return;
        if (vDate >= dateRange.start && vDate <= dateRange.end) {
          allDates.add(formattedDate);
        }
      } else {
        allDates.add(formattedDate);
      }
    });
  });

  if (allDates.size === 0) return [];

  const sortedDates = Array.from(allDates).sort();
  
  return sortedDates.map(dateStr => {
    const displayDate = formatDateSafe(dateStr, 'dd/MMM') || dateStr;
    const point = { date: displayDate };
    let total = 0;
    
    instruments.forEach(inst => {
      if (!inst || typeof inst.name !== 'string' || !inst.name.trim()) return;
      
      const valuationsUpToDate = (inst.valuations || [])
        .filter(v => {
          if (!v?.date || typeof v.value !== 'number') return false;
          const vFormatted = formatDateSafe(v.date, 'yyyy-MM-dd');
          return vFormatted && vFormatted <= dateStr;
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

export default function ChartSection({ instruments, dateRange }) {
  // Filtrar instrumentos válidos
  const validInstruments = (instruments || []).filter(
    inst => inst && typeof inst.name === 'string' && inst.name.trim()
  );

  if (validInstruments.length === 0) {
    return null;
  }

  const evolutionData = generateEvolutionData(validInstruments, dateRange);
  
  const distributionData = validInstruments.map(inst => ({
    name: inst.name,
    value: typeof inst.currentValue === 'number' ? inst.currentValue : 0
  })).filter(item => item.value > 0);

  const depositsVsValueData = validInstruments.map(inst => {
    const totalDeposits = (inst.cashFlows || [])
      .filter(cf => cf.type === 'deposit' && typeof cf.amount === 'number')
      .reduce((sum, cf) => sum + cf.amount, 0);
    
    const totalWithdrawals = (inst.cashFlows || [])
      .filter(cf => cf.type === 'withdrawal' && typeof cf.amount === 'number')
      .reduce((sum, cf) => sum + cf.amount, 0);
    
    const netInvested = totalDeposits - totalWithdrawals;
    const currentValue = typeof inst.currentValue === 'number' ? inst.currentValue : 0;
    const gain = currentValue - netInvested;

    return {
      name: inst.name,
      invertido: netInvested,
      valorActual: currentValue,
      ganancia: gain
    };
  }).filter(item => item.invertido > 0);

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

  return (
    <div className="space-y-6">
      {/* Gráfica de Evolución Temporal */}
      {evolutionData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp size={20} className="text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Evolución del Portafolio</h2>
              <p className="text-sm text-gray-600">Valor histórico de tus inversiones</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={evolutionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value) => `$${Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
              />
              <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="line" />
              
              {validInstruments.map((inst, idx) => (
                <Line 
                  key={inst.name}
                  type="monotone" 
                  dataKey={inst.name} 
                  stroke={COLORS[idx % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                />
              ))}
              <Line 
                type="monotone" 
                dataKey="Total" 
                stroke="#000" 
                strokeWidth={3}
                dot={{ r: 5 }}
                activeDot={{ r: 7 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfica de Distribución (Pie) */}
        {distributionData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-purple-50 rounded-lg">
                <PieChartIcon size={20} className="text-purple-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Distribución del Portafolio</h2>
                <p className="text-sm text-gray-600">Proporción por instrumento</p>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={distributionData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {distributionData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value) => `$${Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gráfica de Comparación */}
        {depositsVsValueData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center gap-2 mb-6">
              <div className="p-2 bg-green-50 rounded-lg">
                <BarChart3 size={20} className="text-green-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-800">Invertido vs Valor Actual</h2>
                <p className="text-sm text-gray-600">Comparación por instrumento</p>
              </div>
            </div>
            
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={depositsVsValueData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} stroke="#6b7280" />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  stroke="#6b7280"
                  tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#fff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                  formatter={(value) => `$${Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                />
                <Legend />
                <Bar dataKey="invertido" name="Invertido" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="valorActual" name="Valor Actual" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Gráfica de Rendimiento */}
      {depositsVsValueData.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-2 bg-orange-50 rounded-lg">
              <Activity size={20} className="text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800">Ganancia/Pérdida por Instrumento</h2>
              <p className="text-sm text-gray-600">Rendimiento absoluto en cada inversión</p>
            </div>
          </div>
          
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={depositsVsValueData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                type="number"
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
              />
              <YAxis 
                type="category"
                dataKey="name" 
                tick={{ fontSize: 12 }}
                stroke="#6b7280"
                width={120}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#fff', 
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
                formatter={(value) => `$${Number(value).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
              />
              <Bar 
                dataKey="ganancia" 
                name="Ganancia/Pérdida"
                radius={[0, 8, 8, 0]}
              >
                {depositsVsValueData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.ganancia >= 0 ? '#10b981' : '#ef4444'} 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}