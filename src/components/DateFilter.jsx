// src/components/DateFilter.jsx
import { useState } from 'react';
import { Calendar, X } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export default function DateFilter({ 
  filterType, 
  onFilterChange, 
  selectedMonth, 
  onMonthChange,
  selectedYear,
  onYearChange,
  customStartDate,
  customEndDate,
  onCustomStartChange,
  onCustomEndChange,
  dateRange 
}) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const filterOptions = [
    { value: 'all', label: 'Todo el historial', icon: '📊' },
    { value: '30days', label: 'Últimos 30 días', icon: '📅' },
    { value: 'month', label: 'Por mes', icon: '📆' },
    { value: 'year', label: 'Por año', icon: '🗓️' },
    { value: 'custom', label: 'Personalizado', icon: '🎯' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar size={20} className="text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-800">Filtrar por periodo</h2>
      </div>

      {/* Botones principales de filtro */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        {filterOptions.map((option) => (
          <button
            key={option.value}
            onClick={() => onFilterChange(option.value)}
            className={`px-4 py-3 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              filterType === option.value
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span>{option.icon}</span>
            <span className="hidden sm:inline">{option.label}</span>
            <span className="sm:hidden">{option.label.split(' ')[0]}</span>
          </button>
        ))}
      </div>

      {/* Selector de mes */}
      {filterType === 'month' && (
        <div className="border-t pt-4 mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecciona el mes
          </label>
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-full md:w-auto px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      )}

      {/* Selector de año */}
      {filterType === 'year' && (
        <div className="border-t pt-4 mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecciona el año
          </label>
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(e.target.value)}
            className="w-full md:w-auto px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            {years.map(year => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Selector de rango personalizado */}
      {filterType === 'custom' && (
        <div className="border-t pt-4 mt-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Selecciona el rango de fechas
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Fecha inicial</label>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => onCustomStartChange(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Fecha final</label>
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => onCustomEndChange(e.target.value)}
                min={customStartDate}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          {customStartDate && customEndDate && (
            <button
              onClick={() => {
                onCustomStartChange('');
                onCustomEndChange('');
              }}
              className="mt-3 text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
            >
              <X size={16} />
              Limpiar fechas
            </button>
          )}
        </div>
      )}

      {/* Información del rango activo */}
      {dateRange && filterType !== 'all' && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center gap-2 text-sm">
            <Calendar size={16} className="text-blue-600" />
            <span className="font-medium text-blue-900">Periodo activo:</span>
            <span className="text-blue-700">
              {format(dateRange.start, 'dd MMM yyyy', { locale: es })}
            </span>
            <span className="text-blue-600">→</span>
            <span className="text-blue-700">
              {format(dateRange.end, 'dd MMM yyyy', { locale: es })}
            </span>
          </div>
        </div>
      )}

      {/* Mensaje cuando no hay filtro */}
      {filterType === 'all' && (
        <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-sm text-gray-600">
            📊 Mostrando todos los datos históricos sin filtros
          </p>
        </div>
      )}
    </div>
  );
}