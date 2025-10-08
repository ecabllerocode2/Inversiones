// src/pages/Dashboard.jsx
import { useState } from 'react';
import { usePortfolio } from '../hooks/usePortfolio.js';
import DashboardHero from '../components/DashboardHero.jsx';
import DateFilter from '../components/DateFilter.jsx';
import InstrumentsList from '../components/InstrumentsList.jsx';
import ChartSection from '../components/ChartSection.jsx';
import EditInstrumentModal from '../components/EditInstrumentModal.jsx';

export default function Dashboard({ userId }) {
  const { portfolio, loading, error, upsertInstrument } = usePortfolio(userId);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstrument, setEditingInstrument] = useState(null);

  if (loading) return <div className="p-10">Cargando...</div>;
  if (error) return <div className="p-10 text-red-500">Error: {error.message || error}</div>;
  if (!portfolio) return <div className="p-10">Sin portfolio</div>;

  const instruments = portfolio.instruments || [];
  const totalInvested = instruments.reduce((sum, i) => sum + (i.initialDeposit || 0), 0);
  const currentValue = instruments.reduce((sum, i) => sum + (i.currentValue || 0), 0);
  const gain = currentValue - totalInvested;
  const yieldPct = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;

  const handleEdit = (instrument) => {
    setEditingInstrument(instrument);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingInstrument(null);
    setIsModalOpen(true);
  };

  const handleSave = (instrumentData) => {
    upsertInstrument(instrumentData);
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Mi Portafolio</h1>
        <button
          onClick={handleAddNew}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-medium"
        >
          + Nuevo Instrumento
        </button>
      </div>

      <DashboardHero 
        totalInvested={totalInvested}
        currentValue={currentValue}
        gain={gain}
        yieldPct={yieldPct}
      />
      <DateFilter selectedMonth={selectedMonth} onSelectMonth={setSelectedMonth} />
      <InstrumentsList 
        instruments={instruments} 
        onEdit={handleEdit} 
      />
      <ChartSection data={instruments} />

      {isModalOpen && (
        <EditInstrumentModal
          instrument={editingInstrument}
          onSave={handleSave}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </div>
  );
}