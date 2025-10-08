// src/pages/Dashboard.jsx
import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subDays, isWithinInterval, parseISO } from 'date-fns';
import { usePortfolio } from '../hooks/usePortfolio.js';
import DashboardHero from '../components/DashboardHero.jsx';
import DateFilter from '../components/DateFilter.jsx';
import StatsCards from '../components/StatsCards.jsx';
import InstrumentsList from '../components/InstrumentsList.jsx';
import ChartSection from '../components/ChartSection.jsx';
import EditInstrumentModal from '../components/EditInstrumentModal.jsx';
import InstrumentActionsModal from '../components/InstrumentActionsModal.jsx';

export default function Dashboard({ userId }) {
  const { portfolio, loading, error, upsertInstrument, addValuation, addCashFlow } = usePortfolio(userId);
  
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

  // Calcular rango de fechas según filtro
  const dateRange = useMemo(() => {
    const now = new Date();
    
    switch (filterType) {
      case 'month': {
        const monthDate = parseISO(selectedMonth + '-01');
        return {
          start: startOfMonth(monthDate),
          end: endOfMonth(monthDate)
        };
      }
      case 'year': {
        const yearDate = parseISO(selectedYear + '-01-01');
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
          return {
            start: parseISO(customStartDate),
            end: parseISO(customEndDate)
          };
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
        const cfDate = new Date(cf.date);
        
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

    const totalInvested = totalDeposits - totalWithdrawals;
    const currentValue = instruments.reduce((sum, i) => sum + (i.currentValue || 0), 0);
    const gain = currentValue - totalInvested;
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
      if (actionData.type === 'valuation') {
        await addValuation(selectedInstrument.name, actionData.data);
      } else if (actionData.type === 'cashflow') {
        await addCashFlow(selectedInstrument.name, actionData.data);
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
      const updatedInstruments = instruments.filter(i => i.name !== instrument.name);
      await upsertInstrument({ 
        instruments: updatedInstruments 
      });
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
      <ChartSection
        instruments={instruments}
        dateRange={dateRange}
      />

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