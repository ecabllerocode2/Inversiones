// src/components/ChartSection.jsx
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, PieChart as PieChartIcon, BarChart3, Activity } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function ChartSection({ instruments, dateRange }) {
  if (!instruments || instruments.length === 0) {
    return null;
  }

  // Datos para gráfica de evolución temporal
  const evolutionData = generateEvolutionData(instruments, dateRange);
  
  // Datos para gráfica de distribución
  const distributionData = instruments.map(inst => ({
    name: inst.name,
    value: inst.currentValue || 0
  })).filter(item => item.value > 0);

  // Datos para gráfica de depósitos vs valor
  const depositsVsValueData = instruments.map(inst => {
    const totalDeposits = (inst.cashFlows || [])
      .filter(cf => cf.type === 'deposit')
      .reduce((sum, cf) => sum + cf.amount, 0);
    
    const totalWithdrawals = (inst.cashFlows || [])
      .filter(cf => cf.type === 'withdrawal')
      .reduce((sum, cf) => sum + cf.amount, 0);
    
    return {
      name: inst.name,
      invertido: totalDeposits - totalWithdrawals,
      valorActual: inst.currentValue || 0,
      ganancia: (inst.currentValue || 0) - (totalDeposits - totalWithdrawals)
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
                formatter={(value) => `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px' }}
                iconType="line"
              />
              {instruments.map((inst, idx) => (
                <Line 
                  key={inst.id || inst.name}
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
                  formatter={(value) => `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Gráfica de Comparación: Invertido vs Valor Actual */}
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
                <XAxis 
                  dataKey="name" 
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
                  formatter={(value) => `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
                />
                <Legend />
                <Bar dataKey="invertido" name="Invertido" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                <Bar dataKey="valorActual" name="Valor Actual" fill="#10b981" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Gráfica de Rendimiento por Instrumento */}
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
                formatter={(value) => `$${value.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
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

// Función auxiliar para generar datos de evolución temporal
function generateEvolutionData(instruments, dateRange) {
  const allDates = new Set();
  
  // Recolectar todas las fechas de valuaciones
  instruments.forEach(inst => {
    (inst.valuations || []).forEach(v => {
      const dateStr = format(new Date(v.date), 'yyyy-MM-dd');
      
      // Si hay filtro de fecha, solo incluir fechas dentro del rango
      if (dateRange) {
        const vDate = new Date(v.date);
        if (vDate >= dateRange.start && vDate <= dateRange.end) {
          allDates.add(dateStr);
        }
      } else {
        allDates.add(dateStr);
      }
    });
  });

  if (allDates.size === 0) return [];

  // Ordenar fechas
  const sortedDates = Array.from(allDates).sort();
  
  // Construir datos para cada fecha
  return sortedDates.map(dateStr => {
    const point = { 
      date: format(new Date(dateStr), 'dd/MMM', { locale: es })
    };
    let total = 0;
    
    instruments.forEach(inst => {
      // Buscar valuación en esta fecha o la más reciente anterior
      const valuationsUpToDate = (inst.valuations || [])
        .filter(v => format(new Date(v.date), 'yyyy-MM-dd') <= dateStr)
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