// src/components/InstrumentActionsModal.jsx
import { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, TrendingUp, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Helper seguro para formatear fechas
const safeFormatDate = (dateStr, formatStr = 'dd/MMM/yyyy') => {
  if (!dateStr) return 'Fecha inválida';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return 'Fecha inválida';
  return format(date, formatStr, { locale: es });
};

export default function InstrumentActionsModal({ 
  instrument, 
  onSave, 
  onClose 
}) {
  const [activeTab, setActiveTab] = useState('valuations');
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    date: format(new Date(), 'yyyy-MM-dd'),
    value: '',
    amount: '',
    type: 'deposit'
  });

  // Reset form when switching tabs or closing form
  useEffect(() => {
    setEditingItem(null);
    setShowForm(false);
    setFormData({
      date: format(new Date(), 'yyyy-MM-dd'),
      value: '',
      amount: '',
      type: activeTab === 'valuations' ? '' : 'deposit'
    });
  }, [activeTab]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      // Editar
      if (activeTab === 'valuations') {
        onSave({
          type: 'valuation',
          data: { id: editingItem.id, ...formData }
        });
      } else {
        onSave({
          type: 'cashflow',
          data: { id: editingItem.id, ...formData }
        });
      }
    } else {
      // Nuevo
      if (activeTab === 'valuations') {
        onSave({
          type: 'valuation',
          data: formData
        });
      } else {
        onSave({
          type: 'cashflow',
          data: formData
        });
      }
    }
    setEditingItem(null);
    setShowForm(false);
  };

  const handleEdit = (item, type) => {
    setEditingItem(item);
    setActiveTab(type);
    setShowForm(true);
    setFormData({
      date: item.date ? format(new Date(item.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
      value: type === 'valuations' ? (item.value || '') : '',
      amount: type === 'cashflows' ? (item.amount || '') : '',
      type: type === 'cashflows' ? (item.type || 'deposit') : 'deposit'
    });
  };

  const handleDelete = (item, type) => {
    if (!window.confirm('¿Estás seguro de eliminar esta operación?')) return;
    
    if (type === 'valuations') {
      onSave({
        type: 'deleteValuation',
        data: { id: item.id, instrumentName: instrument.name }
      });
    } else {
      onSave({
        type: 'deleteCashFlow',
        data: { id: item.id, instrumentName: instrument.name }
      });
    }
  };

  const sortedValuations = [...(instrument.valuations || [])]
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const sortedCashFlows = [...(instrument.cashFlows || [])]
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Operaciones: {instrument.name}
            </h2>
            <p className="text-gray-600">Gestiona valuaciones y flujos de efectivo</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b">
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-4 font-medium ${
              activeTab === 'valuations'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('valuations')}
          >
            <TrendingUp size={18} />
            Valuaciones ({sortedValuations.length})
          </button>
          <button
            className={`flex-1 flex items-center justify-center gap-2 py-4 font-medium ${
              activeTab === 'cashflows'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
            onClick={() => setActiveTab('cashflows')}
          >
            <DollarSign size={18} />
            Flujos de efectivo ({sortedCashFlows.length})
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {/* Botón para nueva operación */}
          {!showForm && (
            <button
              onClick={() => setShowForm(true)}
              className="mb-6 w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium flex items-center justify-center gap-2"
            >
              <Plus size={18} />
              {activeTab === 'valuations' ? 'Nueva valuación' : 'Nuevo flujo de efectivo'}
            </button>
          )}

          {/* Formulario */}
          {showForm && (
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <h3 className="font-medium text-gray-800 mb-4">
                {editingItem ? 'Editar' : 'Agregar'}{' '}
                {activeTab === 'valuations' ? 'valuación' : 'flujo de efectivo'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>

                {activeTab === 'valuations' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor actual ($)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className="w-full p-2 border border-gray-300 rounded-lg"
                      required
                    />
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tipo
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                      >
                        <option value="deposit">Depósito</option>
                        <option value="withdrawal">Retiro</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Monto ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full p-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                  </>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                  >
                    {editingItem ? 'Actualizar' : 'Guardar'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      setEditingItem(null);
                    }}
                    className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Lista de operaciones */}
          {activeTab === 'valuations' ? (
            <div className="space-y-3">
              {sortedValuations.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hay valuaciones registradas</p>
              ) : (
                sortedValuations.map((valuation) => (
                  <div key={valuation.id || valuation.date} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className="font-medium">
                        ${valuation.value?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {safeFormatDate(valuation.date)}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(valuation, 'valuations')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(valuation, 'valuations')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {sortedCashFlows.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No hay flujos de efectivo registrados</p>
              ) : (
                sortedCashFlows.map((cf) => (
                  <div key={cf.id || cf.date} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div>
                      <p className={`font-medium ${
                        cf.type === 'deposit' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {cf.type === 'deposit' ? '+' : '-'}$
                        {cf.amount?.toLocaleString('es-MX', { minimumFractionDigits: 2 }) || '0.00'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {safeFormatDate(cf.date)} • {cf.type === 'deposit' ? 'Depósito' : 'Retiro'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(cf, 'cashflows')}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(cf, 'cashflows')}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}