// src/components/ChartSection.jsx
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function ChartSection({ data = [] }) {
  // Asegurar que los datos tengan el formato esperado
  const chartData = (data || []).map(item => ({
    name: item.name || 'Desconocido',
    value: item.currentValue || 0
  }));

  if (chartData.length === 0) {
    return (
      <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Distribución por Instrumento</h2>
        <p className="text-gray-500">No hay datos para mostrar</p>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-lg mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Distribución por Instrumento</h2>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Valor']}/>
          <Bar dataKey="value" fill="#4f46e5" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}