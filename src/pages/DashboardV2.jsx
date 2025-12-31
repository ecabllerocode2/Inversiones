// src/pages/DashboardV2.jsx
import { useState, useMemo } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { Plus, TrendingUp, TrendingDown, DollarSign, PieChart as PieChartIcon } from 'lucide-react';
import { usePortfolio } from '../hooks/usePortfolio.js';
import { useTransactions } from '../hooks/useTransactions.js';
import { 
  generatePDFReport, 
  generateExcelReport, 
  generateMonthlyReport,
  generateQuarterlyReport,
  generateAnnualReport 
} from '../utils/reportGenerator.js';
import { normalizeDate } from '../utils/dateHelpers.js';
import AdvancedFilters from '../components/AdvancedFilters.jsx';
import AdvancedCharts from '../components/AdvancedCharts.jsx';
import QuickActionsModal from '../components/QuickActionsModal.jsx';
import EditInstrumentModal from '../components/EditInstrumentModal.jsx';
import InstrumentsList from '../components/InstrumentsList.jsx';
import InstrumentActionsModal from '../components/InstrumentActionsModal.jsx';
import { isWithinInterval } from 'date-fns';

export default function DashboardV2({ userId }) {
  const {
    portfolio,
    loading,
    error,
    upsertInstrument,
    deleteInstrument
  } = usePortfolio(userId);

  const [dateRange, setDateRange] = useState(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState(null);
  const [showActionsModal, setShowActionsModal] = useState(false);
  const [selectedInstrument, setSelectedInstrument] = useState(null);

  // Hook de transacciones
  const transactionsHook = useTransactions(userId);

  const instruments = useMemo(() => {
    return Array.isArray(portfolio?.instruments) ? portfolio.instruments : [];
  }, [portfolio]);

  // Calcular estadísticas generales
  const stats = useMemo(() => {
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let filteredDeposits = 0;
    let filteredWithdrawals = 0;

    instruments.forEach(inst => {
      (inst.cashFlows || []).forEach(cf => {
        if (!cf?.type || typeof cf.amount !== 'number' || !cf.date) return;

        const cfDate = normalizeDate(cf.date);
        if (!cfDate || isNaN(cfDate.getTime())) return;

        if (cf.type === 'deposit') totalDeposits += cf.amount;
        if (cf.type === 'withdrawal') totalWithdrawals += cf.amount;

        if (dateRange && isWithinInterval(cfDate, dateRange)) {
          if (cf.type === 'deposit') filteredDeposits += cf.amount;
          if (cf.type === 'withdrawal') filteredWithdrawals += cf.amount;
        }
      });
    });

    const totalInvested = Math.max(0, totalDeposits - totalWithdrawals);
    const currentValue = instruments.reduce((sum, i) => sum + (i.currentValue || 0), 0);
    const gain = currentValue - totalInvested;
    const yieldPct = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;

    return {
      totalInvested,
      currentValue,
      gain,
      yieldPct,
      deposits: dateRange ? filteredDeposits : totalDeposits,
      withdrawals: dateRange ? filteredWithdrawals : totalWithdrawals,
      instrumentsCount: instruments.length
    };
  }, [instruments, dateRange]);

  // Manejar acciones rápidas
  const handleQuickAction = async (action) => {
    try {
      if (action.type === 'transaction') {
        await transactionsHook.addTransaction(
          action.data.instrumentName,
          {
            date: action.data.date,
            amount: action.data.amount,
            type: action.data.type,
            description: action.data.description
          }
        );
      } else if (action.type === 'valuation') {
        await transactionsHook.addValuation(
          action.data.instrumentName,
          {
            date: action.data.date,
            value: action.data.value
          }
        );
      } else if (action.type === 'transfer') {
        await transactionsHook.transferBetweenInstruments(action.data);
      }
    } catch (error) {
      console.error('Error en acción rápida:', error);
    }
  };

  // Manejar guardado de instrumento
  const handleSaveInstrument = async (instrumentData) => {
    try {
      await upsertInstrument(instrumentData);
      setShowEditModal(false);
      setEditingInstrument(null);
      toast.success('Instrumento guardado exitosamente');
    } catch (error) {
      console.error('Error saving instrument:', error);
      toast.error('Error al guardar el instrumento');
    }
  };

  // Manejar eliminación de instrumento
  const handleDeleteInstrument = async (instrumentName) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${instrumentName}"? Esta acción no se puede deshacer.`)) {
      return;
    }

    try {
      await deleteInstrument(instrumentName);
      toast.success('Instrumento eliminado');
    } catch (error) {
      console.error('Error deleting instrument:', error);
      toast.error('Error al eliminar el instrumento');
    }
  };

  // Manejar acciones en modal de instrumento
  const handleInstrumentAction = async (actionData) => {
    if (!selectedInstrument) return;

    try {
      const inst = instruments.find(i => i.name === selectedInstrument.name);
      if (!inst) throw new Error('Instrumento no encontrado');

      if (actionData.type === 'valuation') {
        const valuations = [...(inst.valuations || [])];
        
        if (actionData.data.id) {
          // Editar
          const index = valuations.findIndex(v => v.id === actionData.data.id);
          if (index >= 0) {
            valuations[index] = {
              ...valuations[index],
              date: actionData.data.date,
              value: parseFloat(actionData.data.value)
            };
          }
        } else {
          // Nueva
          valuations.push({
            id: Date.now().toString(),
            date: actionData.data.date,
            value: parseFloat(actionData.data.value)
          });
        }

        await upsertInstrument({
          ...inst,
          valuations,
          currentValue: parseFloat(actionData.data.value),
          lastValuationDate: actionData.data.date
        });

        toast.success('Valuación guardada');
      } else if (actionData.type === 'cashflow') {
        const cashFlows = [...(inst.cashFlows || [])];
        
        if (actionData.data.id) {
          // Editar
          const index = cashFlows.findIndex(cf => cf.id === actionData.data.id);
          if (index >= 0) {
            cashFlows[index] = {
              ...cashFlows[index],
              date: actionData.data.date,
              amount: parseFloat(actionData.data.amount),
              type: actionData.data.type
            };
          }
        } else {
          // Nuevo
          cashFlows.push({
            id: Date.now().toString(),
            date: actionData.data.date,
            amount: parseFloat(actionData.data.amount),
            type: actionData.data.type
          });
        }

        // Recalcular
        const totalDeposited = cashFlows
          .filter(cf => cf.type === 'deposit')
          .reduce((sum, cf) => sum + cf.amount, 0);
        
        const totalWithdrawn = cashFlows
          .filter(cf => cf.type === 'withdrawal')
          .reduce((sum, cf) => sum + cf.amount, 0);

        await upsertInstrument({
          ...inst,
          cashFlows,
          totalDeposited,
          totalWithdrawn,
          netInvested: Math.max(0, totalDeposited - totalWithdrawn)
        });

        toast.success('Flujo de efectivo guardado');
      }
    } catch (error) {
      console.error('Error en acción:', error);
      toast.error('Error al guardar');
    }
  };

  // Manejar exportación
  const handleExport = (format, type) => {
    try {
      if (format === 'pdf') {
        if (type === 'monthly') {
          const now = new Date();
          generateMonthlyReport(portfolio, now.getFullYear(), now.getMonth() + 1);
        } else if (type === 'quarterly') {
          const now = new Date();
          const quarter = Math.floor(now.getMonth() / 3) + 1;
          generateQuarterlyReport(portfolio, now.getFullYear(), quarter);
        } else if (type === 'annual') {
          const now = new Date();
          generateAnnualReport(portfolio, now.getFullYear());
        } else {
          generatePDFReport(portfolio, dateRange, type);
        }
      } else if (format === 'excel') {
        generateExcelReport(portfolio, dateRange, type);
      }
      toast.success('Reporte generado exitosamente');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Error al generar el reporte');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando tu portafolio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">Error al cargar el portafolio</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <Toaster position="top-right" />

      {/* Header Hero */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-8 px-6 mb-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold mb-2">Mi Portafolio de Inversiones</h1>
              <p className="text-blue-100">Gestiona y analiza tus inversiones de forma intuitiva</p>
            </div>
            <button
              onClick={() => setShowQuickActions(true)}
              className="flex items-center gap-2 px-6 py-3 bg-white text-blue-600 rounded-lg font-semibold hover:bg-blue-50 transition shadow-lg"
            >
              <Plus size={20} />
              Acción Rápida
            </button>
          </div>

          {/* Métricas principales */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white rounded-lg p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <DollarSign size={20} className="text-blue-600" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Capital Invertido</p>
              </div>
              <p className="text-2xl font-bold text-gray-900">
                ${stats.totalInvested.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-white rounded-lg p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <PieChartIcon size={20} className="text-purple-600" />
                </div>
                <p className="text-sm text-gray-600 font-medium">Valor Actual</p>
              </div>
              <p className="text-2xl font-bold text-purple-600">
                ${stats.currentValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-white rounded-lg p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${stats.gain >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                  {stats.gain >= 0 ? (
                    <TrendingUp size={20} className="text-green-600" />
                  ) : (
                    <TrendingDown size={20} className="text-red-600" />
                  )}
                </div>
                <p className="text-sm text-gray-600 font-medium">Ganancia/Pérdida</p>
              </div>
              <p className={`text-2xl font-bold ${stats.gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.gain >= 0 ? '+' : ''}${Math.abs(stats.gain).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="bg-white rounded-lg p-5 shadow-lg">
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${stats.yieldPct >= 0 ? 'bg-emerald-100' : 'bg-orange-100'}`}>
                  <TrendingUp size={20} className={stats.yieldPct >= 0 ? 'text-emerald-600' : 'text-orange-600'} />
                </div>
                <p className="text-sm text-gray-600 font-medium">Rendimiento</p>
              </div>
              <p className={`text-2xl font-bold ${stats.yieldPct >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
                {stats.yieldPct >= 0 ? '+' : ''}{stats.yieldPct.toFixed(2)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Filtros avanzados */}
        <AdvancedFilters
          onFilterChange={setDateRange}
          onExport={handleExport}
          dateRange={dateRange}
        />

        {/* Resumen por rango de fechas */}
        {dateRange && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              Resumen del Período Seleccionado
            </h2>
            
            {/* Totales del período */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 pb-6 border-b">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4">
                <p className="text-sm text-blue-700 font-medium mb-1">Depósitos</p>
                <p className="text-2xl font-bold text-blue-900">
                  ${stats.deposits.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg p-4">
                <p className="text-sm text-red-700 font-medium mb-1">Retiros</p>
                <p className="text-2xl font-bold text-red-900">
                  ${stats.withdrawals.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4">
                <p className="text-sm text-purple-700 font-medium mb-1">Flujo Neto</p>
                <p className="text-2xl font-bold text-purple-900">
                  ${(stats.deposits - stats.withdrawals).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg p-4">
                <p className="text-sm text-amber-700 font-medium mb-1">Utilidad Total</p>
                <p className={`text-2xl font-bold ${(() => {
                  // Calcular utilidad total del período
                  let totalUtility = 0;
                  instruments.forEach(inst => {
                    let deposits = 0;
                    let withdrawals = 0;
                    (inst.cashFlows || []).forEach(cf => {
                      const cfDate = normalizeDate(cf.date);
                      if (cfDate && isWithinInterval(cfDate, dateRange)) {
                        if (cf.type === 'deposit') deposits += cf.amount;
                        if (cf.type === 'withdrawal') withdrawals += cf.amount;
                      }
                    });

                    const sortedValuations = [...(inst.valuations || [])]
                      .map(v => ({ ...v, date: normalizeDate(v.date) }))
                      .filter(v => v.date)
                      .sort((a, b) => a.date.getTime() - b.date.getTime());

                    let valueAtStart = 0;
                    let valueAtEnd = inst.currentValue || 0;

                    for (let i = sortedValuations.length - 1; i >= 0; i--) {
                      if (sortedValuations[i].date <= dateRange.start) {
                        valueAtStart = sortedValuations[i].value;
                        break;
                      }
                    }

                    for (let i = sortedValuations.length - 1; i >= 0; i--) {
                      if (sortedValuations[i].date <= dateRange.end) {
                        valueAtEnd = sortedValuations[i].value;
                        break;
                      }
                    }

                    const netFlow = deposits - withdrawals;
                    const valueChange = valueAtEnd - valueAtStart;
                    totalUtility += (valueChange - netFlow);
                  });
                  return totalUtility >= 0 ? 'text-green-700' : 'text-red-700';
                })()}`}>
                  {(() => {
                    let totalUtility = 0;
                    instruments.forEach(inst => {
                      let deposits = 0;
                      let withdrawals = 0;
                      (inst.cashFlows || []).forEach(cf => {
                        const cfDate = normalizeDate(cf.date);
                        if (cfDate && isWithinInterval(cfDate, dateRange)) {
                          if (cf.type === 'deposit') deposits += cf.amount;
                          if (cf.type === 'withdrawal') withdrawals += cf.amount;
                        }
                      });

                      const sortedValuations = [...(inst.valuations || [])]
                        .map(v => ({ ...v, date: normalizeDate(v.date) }))
                        .filter(v => v.date)
                        .sort((a, b) => a.date.getTime() - b.date.getTime());

                      let valueAtStart = 0;
                      let valueAtEnd = inst.currentValue || 0;

                      for (let i = sortedValuations.length - 1; i >= 0; i--) {
                        if (sortedValuations[i].date <= dateRange.start) {
                          valueAtStart = sortedValuations[i].value;
                          break;
                        }
                      }

                      for (let i = sortedValuations.length - 1; i >= 0; i--) {
                        if (sortedValuations[i].date <= dateRange.end) {
                          valueAtEnd = sortedValuations[i].value;
                          break;
                        }
                      }

                      const netFlow = deposits - withdrawals;
                      const valueChange = valueAtEnd - valueAtStart;
                      totalUtility += (valueChange - netFlow);
                    });
                    return `${totalUtility >= 0 ? '+' : ''}$${Math.abs(totalUtility).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
                  })()}
                </p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4">
                <p className="text-sm text-green-700 font-medium mb-1">Movimientos</p>
                <p className="text-2xl font-bold text-green-900">
                  {(() => {
                    let count = 0;
                    instruments.forEach(inst => {
                      (inst.cashFlows || []).forEach(cf => {
                        const cfDate = normalizeDate(cf.date);
                        if (cfDate && isWithinInterval(cfDate, dateRange)) {
                          count++;
                        }
                      });
                    });
                    return count;
                  })()}
                </p>
              </div>
            </div>

            {/* Detalle por instrumento */}
            <h3 className="text-lg font-semibold text-gray-800 mb-3">Detalle por Instrumento</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Instrumento
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Depósitos
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Retiros
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Flujo Neto
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Valor Inicial
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Valor Final
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-600 uppercase tracking-wider">
                      Rendimiento
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {instruments.map(inst => {
                    // Calcular movimientos en el período
                    let deposits = 0;
                    let withdrawals = 0;
                    (inst.cashFlows || []).forEach(cf => {
                      const cfDate = normalizeDate(cf.date);
                      if (cfDate && isWithinInterval(cfDate, dateRange)) {
                        if (cf.type === 'deposit') deposits += cf.amount;
                        if (cf.type === 'withdrawal') withdrawals += cf.amount;
                      }
                    });

                    // Calcular valor al inicio y al final del período
                    const sortedValuations = [...(inst.valuations || [])]
                      .map(v => ({ ...v, date: normalizeDate(v.date) }))
                      .filter(v => v.date)
                      .sort((a, b) => a.date.getTime() - b.date.getTime());

                    let valueAtStart = 0;
                    let valueAtEnd = inst.currentValue || 0;

                    // Valor al inicio del período
                    for (let i = sortedValuations.length - 1; i >= 0; i--) {
                      if (sortedValuations[i].date <= dateRange.start) {
                        valueAtStart = sortedValuations[i].value;
                        break;
                      }
                    }

                    // Valor al final del período
                    for (let i = sortedValuations.length - 1; i >= 0; i--) {
                      if (sortedValuations[i].date <= dateRange.end) {
                        valueAtEnd = sortedValuations[i].value;
                        break;
                      }
                    }

                    const netFlow = deposits - withdrawals;
                    const valueChange = valueAtEnd - valueAtStart;
                    const performance = valueChange - netFlow;
                    const performancePct = valueAtStart + netFlow > 0 
                      ? (performance / (valueAtStart + netFlow)) * 100 
                      : 0;

                    // Solo mostrar instrumentos con actividad en el período
                    if (deposits === 0 && withdrawals === 0 && valueAtStart === 0 && valueAtEnd === 0) {
                      return null;
                    }

                    return (
                      <tr key={inst.name} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {inst.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-green-600">
                          ${deposits.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-red-600">
                          ${withdrawals.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900">
                          ${netFlow.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-600">
                          ${valueAtStart.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 font-medium">
                          ${valueAtEnd.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-sm text-right">
                          <div className={`font-semibold ${performance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            ${Math.abs(performance).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                          </div>
                          <div className={`text-xs ${performancePct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {performance >= 0 ? '+' : ''}{performancePct.toFixed(2)}%
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Gráficos avanzados */}
        <AdvancedCharts instruments={instruments} dateRange={dateRange} />

        {/* Lista de instrumentos */}
        <InstrumentsList
          instruments={instruments}
          onEdit={(inst) => {
            setEditingInstrument(inst);
            setShowEditModal(true);
          }}
          onDelete={handleDeleteInstrument}
          onOpenActions={(inst) => {
            setSelectedInstrument(inst);
            setShowActionsModal(true);
          }}
        />
      </div>

      {/* Modales */}
      {showQuickActions && (
        <QuickActionsModal
          instruments={instruments}
          onClose={() => setShowQuickActions(false)}
          onAction={handleQuickAction}
        />
      )}

      {showEditModal && (
        <EditInstrumentModal
          instrument={editingInstrument}
          onSave={handleSaveInstrument}
          onClose={() => {
            setShowEditModal(false);
            setEditingInstrument(null);
          }}
        />
      )}

      {showActionsModal && selectedInstrument && (
        <InstrumentActionsModal
          instrument={selectedInstrument}
          onSave={handleInstrumentAction}
          onClose={() => {
            setShowActionsModal(false);
            setSelectedInstrument(null);
          }}
        />
      )}
    </div>
  );
}
