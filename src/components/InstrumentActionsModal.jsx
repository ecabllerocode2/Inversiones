// src/components/InstrumentActionsModal.jsx
import { useState } from 'react';
import { format } from 'date-fns';

export default function InstrumentActionsModal({ instrument, onSave, onClose }) {
  const [action, setAction] = useState('valuation'); // 'valuation' o 'cashflow'
  const [valuationDate, setValuationDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [valuationValue, setValuationValue] = useState(instrument?.currentValue?.toString() || '');
  
  const [cashFlowDate, setCashFlowDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [cashFlowAmount, setCashFlowAmount] = useState('');
  const [cashFlowType, setCashFlowType] = useState('deposit');
  const [cashFlowDescription, setCashFlowDescription] = useState('');

  const handleSaveValuation = () => {
    if (!valuationValue || isNaN(parseFloat(valuationValue))) {
      alert('Ingresa un valor válido');
      return;
    }
    onSave({
      type: 'valuation',
      data: { // 👈 Aquí estaba el error: faltaba la clave "data"
        date: new Date(valuationDate),
        value: parseFloat(valuationValue)
      }
    });
    onClose();
  };

  const handleSaveCashFlow = () => {
    if (!cashFlowAmount || isNaN(parseFloat(cashFlowAmount))) {
      alert('Ingresa un monto válido');
      return;
    }
    onSave({
      type: 'cashflow',
      data: { // 👈 Aquí también faltaba "data"
        date: new Date(cashFlowDate),
        amount: parseFloat(cashFlowAmount),
        type: cashFlowType,
        description: cashFlowDescription.trim()
      }
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">
          {instrument ? `Acciones: ${instrument.name}` : 'Nuevo Instrumento'}
        </h2>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de acción</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded"
          >
            <option value="valuation">Registrar valor actual</option>
            <option value="cashflow">Agregar flujo de capital</option>
          </select>
        </div>

        {action === 'valuation' ? (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de valuación *</label>
              <input
                type="date"
                value={valuationDate}
                onChange={(e) => setValuationDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Valor total *</label>
              <input
                type="number"
                step="0.01"
                value={valuationValue}
                onChange={(e) => setValuationValue(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="0.00"
                required
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600">Cancelar</button>
              <button type="button" onClick={handleSaveValuation} className="px-4 py-2 bg-blue-600 text-white rounded">
                Guardar Valor
              </button>
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha *</label>
              <input
                type="date"
                value={cashFlowDate}
                onChange={(e) => setCashFlowDate(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
              <select
                value={cashFlowType}
                onChange={(e) => setCashFlowType(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
              >
                <option value="deposit">Depósito</option>
                <option value="withdrawal">Retiro</option>
              </select>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Monto *</label>
              <input
                type="number"
                step="0.01"
                value={cashFlowAmount}
                onChange={(e) => setCashFlowAmount(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="0.00"
                required
              />
            </div>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
              <input
                type="text"
                value={cashFlowDescription}
                onChange={(e) => setCashFlowDescription(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Ej: Ahorro mensual"
              />
            </div>
            <div className="flex justify-end space-x-3">
              <button type="button" onClick={onClose} className="px-4 py-2 text-gray-600">Cancelar</button>
              <button type="button" onClick={handleSaveCashFlow} className="px-4 py-2 bg-green-600 text-white rounded">
                Agregar Flujo
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}