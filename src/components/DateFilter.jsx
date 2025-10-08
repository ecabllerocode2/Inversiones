// src/components/DateFilter.jsx
export default function DateFilter({ selectedMonth, onSelectMonth }) {
  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-6">
      <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por mes:</label>
      <select
        value={selectedMonth}
        onChange={(e) => onSelectMonth(e.target.value)}
        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
      >
        <option value="">Todos los meses</option>
        {months.map((month, i) => (
          <option key={i} value={month}>{month}</option>
        ))}
      </select>
    </div>
  );
}