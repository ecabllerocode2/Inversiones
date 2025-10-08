// src/components/EditInstrumentModal.jsx
import { useState, useEffect } from 'react';

export default function EditInstrumentModal({ instrument = null, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    category: 'Liquidez',
    initialDeposit: '',
    currentValue: ''
  });

  // Si se pasa un instrumento, lo cargamos en el formulario
  useEffect(() => {
    if (instrument) {
      setFormData({
        name: instrument.name || '',
        category: instrument.category || 'Liquidez',
        initialDeposit: instrument.initialDeposit?.toString() || '',
        currentValue: instrument.currentValue?.toString() || ''
      });
    } else {
      // Modo "nuevo"
      setFormData({
        name: '',
        category: 'Liquidez',
        initialDeposit: '',
        currentValue: ''
      });
    }
  }, [instrument]);

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validación básica
    if (!formData.name.trim()) {
      alert('Por favor ingresa un nombre.');
      return;
    }

    const initialDeposit = parseFloat(formData.initialDeposit);
    const currentValue = parseFloat(formData.currentValue);

    if (isNaN(initialDeposit) || isNaN(currentValue)) {
      alert('Por favor ingresa valores numéricos válidos.');
      return;
    }

    const gain = currentValue - initialDeposit;
    const yieldPct = initialDeposit > 0 ? (gain / initialDeposit) * 100 : 0;

    onSave({
      name: formData.name.trim(),
      category: formData.category,
      initialDeposit: initialDeposit,
      currentValue: currentValue,
      gain: gain,
      yieldPct: yieldPct,
      lastUpdated: new Date()
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md p-6">
        <h2 className="text-xl font-bold mb-4">
          {instrument ? 'Editar Instrumento' : 'Nuevo Instrumento'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Nu, CETES, GBM"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            >
              <option value="Liquidez">Liquidez</option>
              <option value="Renta fija">Renta fija</option>
              <option value="Crecimiento">Crecimiento</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Depósito Inicial *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.initialDeposit}
                onChange={(e) => setFormData({ ...formData, initialDeposit: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Valor Actual *
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.currentValue}
                onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
                required
              />
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
            >
              Guardar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}