// src/pages/Dashboard.jsx
import { useState, useMemo } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  subDays,
  isWithinInterval,
  parseISO
} from 'date-fns';
import { usePortfolio } from '../hooks/usePortfolio.js';
import DashboardHero from '../components/DashboardHero.jsx';
import DateFilter from '../components/DateFilter.jsx';
import StatsCards from '../components/StatsCards.jsx';
import InstrumentsList from '../components/InstrumentsList.jsx';
import ChartSection from '../components/ChartSection.jsx';
import EditInstrumentModal from '../components/EditInstrumentModal.jsx';
import InstrumentActionsModal from '../components/InstrumentActionsModal.jsx';

export default function Dashboard({ userId }) {
  const {
    portfolio,
    loading,
    error,
    upsertInstrument,
    addValuation,
    addCashFlow,
    deleteInstrument
  } = usePortfolio(userId);

  // Estados para modales
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActionsModalOpen, setIsActionsModalOpen] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState(null);
  const [selectedInstrument, setSelectedInstrument] = useState(null);

  // Estados para filtros de fecha
  const [filterType, setFilterType] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedYear, setSelectedYear] = useState(format(new Date(), 'yyyy').toString());
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Helper seguro para parsear fechas
  const safeParseISO = (dateStr) => {
    if (!dateStr) return null;
    const parsed = parseISO(dateStr);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  // Calcular rango de fechas según filtro
  const dateRange = useMemo(() => {
    const now = new Date();

    switch (filterType) {
      case 'month': {
        const dateStr = selectedMonth ? selectedMonth + '-01' : null;
        const monthDate = safeParseISO(dateStr);
        if (!monthDate) return null;
        return {
          start: startOfMonth(monthDate),
          end: endOfMonth(monthDate)
        };
      }
      case 'year': {
        const dateStr = selectedYear ? selectedYear + '-01-01' : null;
        const yearDate = safeParseISO(dateStr);
        if (!yearDate) return null;
        return {
          start: startOfYear(yearDate),
          end: endOfYear(yearDate)
        };
      }
      case '30days':
        return {
          start: subDays(now, 30),
          end: now
        };
      case 'custom':
        if (customStartDate && customEndDate) {
          const start = safeParseISO(customStartDate);
          const end = safeParseISO(customEndDate);
          if (!start || !end) return null;
          return { start, end };
        }
        return null;
      default:
        return null;
    }
  }, [filterType, selectedMonth, selectedYear, customStartDate, customEndDate]);

  // Obtener instrumentos del portfolio
  const instruments = useMemo(() => {
    return Array.isArray(portfolio?.instruments) ? portfolio.instruments : [];
  }, [portfolio]);

  // Calcular estadísticas con filtro de fecha
  const stats = useMemo(() => {
    let totalDeposits = 0;
    let totalWithdrawals = 0;
    let filteredDeposits = 0;
    let filteredWithdrawals = 0;

    instruments.forEach(inst => {
      (inst.cashFlows || []).forEach(cf => {
        // Validar datos mínimos
        if (!cf?.type || typeof cf.amount !== 'number' || !cf.date) return;

        const cfDate = new Date(cf.date);
        if (isNaN(cfDate)) return; // Fecha inválida

        // Totales históricos
        if (cf.type === 'deposit') totalDeposits += cf.amount;
        if (cf.type === 'withdrawal') totalWithdrawals += cf.amount;

        // Totales filtrados por fecha
        if (dateRange && isWithinInterval(cfDate, dateRange)) {
          if (cf.type === 'deposit') filteredDeposits += cf.amount;
          if (cf.type === 'withdrawal') filteredWithdrawals += cf.amount;
        }
      });
    });

    // ✅ Capital invertido neto: nunca negativo
    const totalInvested = Math.max(0, totalDeposits - totalWithdrawals);

    // Valor actual total
    const currentValue = instruments.reduce((sum, i) => sum + (typeof i.currentValue === 'number' ? i.currentValue : 0), 0);

    // Ganancia = valor actual - capital invertido neto
    const gain = currentValue - totalInvested;

    // ROI solo si hay capital invertido
    const yieldPct = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;

    return {
      totalInvested,
      currentValue,
      gain,
      yieldPct,
      deposits: dateRange ? filteredDeposits : totalDeposits,
      withdrawals: dateRange ? filteredWithdrawals : totalWithdrawals
    };
  }, [instruments, dateRange]);

  // Handlers para modales
  const handleOpenEditModal = (instrument = null) => {
    setEditingInstrument(instrument);
    setIsEditModalOpen(true);
  };

  const handleOpenActionsModal = (instrument) => {
    setSelectedInstrument(instrument);
    setIsActionsModalOpen(true);
  };

  const handleSaveInstrument = async (instrumentData) => {
    try {
      await upsertInstrument(instrumentData);
      setIsEditModalOpen(false);
      setEditingInstrument(null);
    } catch (err) {
      console.error('Error al guardar instrumento:', err);
      alert('Error al guardar el instrumento. Por favor intenta de nuevo.');
    }
  };

  const handleSaveAction = async (actionData) => {
    if (!selectedInstrument) return;

    try {
      const currentInstruments = Array.isArray(portfolio?.instruments) ? portfolio.instruments : [];
      const currentInst = currentInstruments.find(i => i.name === selectedInstrument.name);

      if (!currentInst) {
        throw new Error('Instrumento no encontrado');
      }

      if (actionData.type === 'valuation') {
        const valuations = [...(currentInst.valuations || [])];
        const newCurrentValue = parseFloat(actionData.data.value);

        if (actionData.data.id) {
          // Editar valuación existente
          const index = valuations.findIndex(v => v.id === actionData.data.id);
          if (index >= 0) {
            valuations[index] = {
              ...valuations[index],
              date: actionData.data.date,
              value: newCurrentValue
            };
          }
        } else {
          // Nueva valuación
          valuations.push({
            id: Date.now().toString(),
            date: actionData.data.date,
            value: newCurrentValue
          });
        }

        await upsertInstrument({
          ...currentInst,
          valuations,
          currentValue: newCurrentValue,
          lastValuationDate: actionData.data.date
        });

      } else if (actionData.type === 'cashflow') {
        const cashFlows = [...(currentInst.cashFlows || [])];

        if (actionData.data.id) {
          // Editar flujo existente
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
          // Nuevo flujo
          cashFlows.push({
            id: Date.now().toString(),
            date: actionData.data.date,
            amount: parseFloat(actionData.data.amount),
            type: actionData.data.type
          });
        }

        // ✅ Actualizar el instrumento con los nuevos flujos
        // Recalcular totales
        const totalDeposited = cashFlows
          .filter(cf => cf.type === 'deposit')
          .reduce((sum, cf) => sum + cf.amount, 0);
        const totalWithdrawn = cashFlows
          .filter(cf => cf.type === 'withdrawal')
          .reduce((sum, cf) => sum + cf.amount, 0);

        // Nuevo valor actual: si se retiró todo, queda en 0
        const remaining = Math.max(0, currentInst.currentValue - (actionData.data.type === 'withdrawal' ? actionData.data.amount : 0));
        const newCurrentValue = remaining === 0 ? 0 : currentInst.currentValue;

        // Actualiza el instrumento completo
        await upsertInstrument({
          ...currentInst,
          cashFlows,
          totalDeposited,
          totalWithdrawn,
          netInvested: Math.max(0, totalDeposited - totalWithdrawn),
          currentValue: newCurrentValue,
          lastValuationDate: new Date().toISOString()
        });


      } else if (actionData.type === 'deleteValuation') {
        const updatedValuations = (currentInst.valuations || []).filter(v => v.id !== actionData.data.id);
        const latestValuation = updatedValuations.reduce((latest, v) =>
          !latest || new Date(v.date) > new Date(latest.date) ? v : latest, null
        );

        await upsertInstrument({
          ...currentInst,
          valuations: updatedValuations,
          currentValue: latestValuation ? latestValuation.value : 0,
          lastValuationDate: latestValuation ? latestValuation.date : null
        });

      } else if (actionData.type === 'deleteCashFlow') {
        const updatedCashFlows = (currentInst.cashFlows || []).filter(cf => cf.id !== actionData.data.id);
        await upsertInstrument({
          ...currentInst,
          cashFlows: updatedCashFlows
        });
      }

      setIsActionsModalOpen(false);
      setSelectedInstrument(null);
    } catch (err) {
      console.error('Error al guardar acción:', err);
      alert('Error al guardar. Por favor intenta de nuevo.');
    }
  };

  const handleDeleteInstrument = async (instrument) => {
    try {
      await deleteInstrument(instrument.name);
    } catch (err) {
      console.error('Error al eliminar instrumento:', err);
      alert('Error al eliminar el instrumento. Por favor intenta de nuevo.');
    }
  };

  // Estados de carga y error
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Cargando tu portafolio...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <h2 className="text-xl font-bold text-red-800 mb-2">Error al cargar</h2>
          <p className="text-red-600 mb-4">{error.message || 'Ocurrió un error al cargar tu portafolio'}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Hero Section */}
      <DashboardHero
        totalInvested={stats.totalInvested}
        currentValue={stats.currentValue}
        gain={stats.gain}
        yieldPct={stats.yieldPct}
      />

      {/* Filtros de fecha */}
      <DateFilter
        filterType={filterType}
        onFilterChange={setFilterType}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
        customStartDate={customStartDate}
        customEndDate={customEndDate}
        onCustomStartChange={setCustomStartDate}
        onCustomEndChange={setCustomEndDate}
        dateRange={dateRange}
      />

      {/* Estadísticas detalladas */}
      <StatsCards
        deposits={stats.deposits}
        withdrawals={stats.withdrawals}
        totalInvested={stats.totalInvested}
        currentValue={stats.currentValue}
        gain={stats.gain}
        yieldPct={stats.yieldPct}
        dateRange={dateRange}
      />

      {/* Lista de instrumentos */}
      <InstrumentsList
        instruments={instruments}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteInstrument}
        onOpenActions={handleOpenActionsModal}
      />

      {/* Gráficas */}
      {instruments.length > 0 && (
        <ChartSection
          instruments={instruments}
          dateRange={dateRange}
        />
      )}

      {/* Modal de edición */}
      {isEditModalOpen && (
        <EditInstrumentModal
          instrument={editingInstrument}
          onSave={handleSaveInstrument}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingInstrument(null);
          }}
        />
      )}

      {/* Modal de acciones */}
      {isActionsModalOpen && selectedInstrument && (
        <InstrumentActionsModal
          instrument={selectedInstrument}
          onSave={handleSaveAction}
          onClose={() => {
            setIsActionsModalOpen(false);
            setSelectedInstrument(null);
          }}
        />
      )}
    </div>
  );
}