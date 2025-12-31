// src/components/AdvancedFilters.jsx
import React, { useState } from 'react';
import { Calendar, Download, Filter, X } from 'lucide-react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, subYears } from 'date-fns';
import { es } from 'date-fns/locale';

export default function AdvancedFilters({ 
  onFilterChange, 
  onExport,
  dateRange
}) {
  const [showFilters, setShowFilters] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [filterType, setFilterType] = useState('all');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  const predefinedRanges = [
    { id: 'all', label: 'Todo el historial' },
    { id: 'thisMonth', label: 'Este mes' },
    { id: 'lastMonth', label: 'Mes pasado' },
    { id: 'last3Months', label: 'Últimos 3 meses' },
    { id: 'last6Months', label: 'Últimos 6 meses' },
    { id: 'thisYear', label: 'Este año' },
    { id: 'lastYear', label: 'Año pasado' },
    { id: 'custom', label: 'Rango personalizado' }
  ];

  const handleRangeSelect = (rangeId) => {
    setFilterType(rangeId);
    const now = new Date();
    let range = null;

    switch (rangeId) {
      case 'thisMonth':
        range = { start: startOfMonth(now), end: endOfMonth(now) };
        break;
      case 'lastMonth': {
        const lastMonth = subMonths(now, 1);
        range = { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
        break;
      }
      case 'last3Months':
        range = { start: subMonths(now, 3), end: now };
        break;
      case 'last6Months':
        range = { start: subMonths(now, 6), end: now };
        break;
      case 'thisYear':
        range = { start: startOfYear(now), end: endOfYear(now) };
        break;
      case 'lastYear': {
        const lastYear = subYears(now, 1);
        range = { start: startOfYear(lastYear), end: endOfYear(lastYear) };
        break;
      }
      case 'custom':
        if (customStart && customEnd) {
          range = { start: new Date(customStart), end: new Date(customEnd) };
        }
        break;
      default:
        range = null;
    }

    onFilterChange(range);
  };

  const handleCustomRange = () => {
    if (customStart && customEnd) {
      const range = { start: new Date(customStart), end: new Date(customEnd) };
      onFilterChange(range);
    }
  };

  const exportOptions = [
    { id: 'pdf-general', label: 'PDF - Resumen General', format: 'pdf', type: 'general' },
    { id: 'pdf-detailed', label: 'PDF - Reporte Detallado', format: 'pdf', type: 'detailed' },
    { id: 'excel-complete', label: 'Excel - Reporte Completo', format: 'excel', type: 'complete' },
    { id: 'monthly', label: 'Reporte Mensual (PDF)', format: 'pdf', type: 'monthly' },
    { id: 'quarterly', label: 'Reporte Trimestral (PDF)', format: 'pdf', type: 'quarterly' },
    { id: 'annual', label: 'Reporte Anual (PDF)', format: 'pdf', type: 'annual' }
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div className="flex flex-wrap items-center gap-3">
        {/* Botón de filtros */}
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${
            showFilters
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          <Filter size={18} />
          Filtros
        </button>

        {/* Botón de exportar */}
        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
          >
            <Download size={18} />
            Exportar
          </button>

          {showExportMenu && (
            <>
              <div 
                className="fixed inset-0 z-10" 
                onClick={() => setShowExportMenu(false)}
              />
              <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
                <div className="p-2">
                  {exportOptions.map(option => (
                    <button
                      key={option.id}
                      onClick={() => {
                        onExport(option.format, option.type);
                        setShowExportMenu(false);
                      }}
                      className="w-full text-left px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-700 transition"
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Mostrar rango activo */}
        {dateRange && (
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
            <Calendar size={16} />
            <span className="text-sm font-medium">
              {format(dateRange.start, 'dd/MMM/yyyy', { locale: es })} - {format(dateRange.end, 'dd/MMM/yyyy', { locale: es })}
            </span>
            <button
              onClick={() => {
                setFilterType('all');
                onFilterChange(null);
              }}
              className="ml-2 hover:bg-blue-100 rounded p-1 transition"
            >
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Panel de filtros expandido */}
      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h3 className="font-semibold text-gray-800 mb-3">Seleccionar período</h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
            {predefinedRanges.filter(r => r.id !== 'custom').map(range => (
              <button
                key={range.id}
                onClick={() => handleRangeSelect(range.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  filterType === range.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>

          {/* Rango personalizado */}
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-3">Rango personalizado</h4>
            <div className="grid md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">Desde</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">Hasta</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={handleCustomRange}
                  disabled={!customStart || !customEnd}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition text-sm"
                >
                  Aplicar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
