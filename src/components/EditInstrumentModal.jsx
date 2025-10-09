// src/components/EditInstrumentModal.jsx
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function EditInstrumentModal({ instrument, onSave, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    initialDeposit: '',
    currentValue: '',
    category: 'other',
    broker: '',
    description: ''
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (instrument) {
      setFormData({
        name: instrument.name || '',
        initialDeposit: instrument.initialDeposit?.toString() || '',
        currentValue: instrument.currentValue?.toString() || '',
        category: instrument.category || 'other',
        broker: instrument.broker || '',
        description: instrument.description || ''
      });
    }
  }, [instrument]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'El nombre es obligatorio';
    }

    if (!formData.initialDeposit || isNaN(parseFloat(formData.initialDeposit))) {
      newErrors.initialDeposit = 'Ingresa un monto válido';
    } else if (parseFloat(formData.initialDeposit) <= 0) {
      newErrors.initialDeposit = 'El monto debe ser mayor a 0';
    }

    if (formData.currentValue && isNaN(parseFloat(formData.currentValue))) {
      newErrors.currentValue = 'Ingresa un valor válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    const instrumentData = {
      name: formData.name.trim(),
      initialDeposit: parseFloat(formData.initialDeposit),
      currentValue: formData.currentValue
        ? parseFloat(formData.currentValue)
        : parseFloat(formData.initialDeposit),
      category: formData.category,
      broker: formData.broker.trim(),
      description: formData.description.trim(),
      createdAt: instrument?.createdAt || new Date(),
      lastValuationDate: instrument?.lastValuationDate || new Date(),
      cashFlows: instrument?.cashFlows || [
        {
          id: Date.now().toString(),
          date: new Date(),
          amount: parseFloat(formData.initialDeposit),
          type: 'deposit',
          description: 'Depósito inicial'
        }
      ],
      valuations: instrument?.valuations || [
        {
          id: Date.now().toString(),
          date: new Date(),
          value: formData.currentValue
            ? parseFloat(formData.currentValue)
            : parseFloat(formData.initialDeposit)
        }
      ]
    };

    onSave(instrumentData);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Limpiar error del campo cuando el usuario empieza a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-800">
            {instrument ? `Editar: ${instrument.name}` : 'Nuevo Instrumento'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          {/* Nombre del instrumento */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nombre del instrumento *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              placeholder="Ej: CETES, Fondo de inversión, Acciones Apple"
              disabled={!!instrument}
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name}</p>
            )}
            {instrument && (
              <p className="mt-1 text-xs text-gray-500">
                No puedes cambiar el nombre de un instrumento existente
              </p>
            )}
          </div>

          {/* Categoría */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Categoría
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="stocks">Acciones</option>
              <option value="bonds">Bonos / CETES</option>
              <option value="funds">Fondos de inversión</option>
              <option value="crypto">Criptomonedas</option>
              <option value="real-estate">Bienes raíces</option>
              <option value="commodities">Commodities</option>
              <option value="SOFIPO">SOFIPO</option>
              <option value="Liquidez/Ahorro">Lquidez/Ahorro</option>
              <option value="Crowdfunding">Crowdfunding</option>
              <option value="other">Otro</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Depósito inicial */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                {instrument ? 'Inversión inicial' : 'Depósito inicial *'}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">$</span>
                <input
                  type="number"
                  name="initialDeposit"
                  value={formData.initialDeposit}
                  onChange={handleChange}
                  step="0.01"
                  className={`w-full pl-8 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.initialDeposit ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="0.00"
                  disabled={!!instrument}
                />
              </div>
              {errors.initialDeposit && (
                <p className="mt-1 text-sm text-red-600">{errors.initialDeposit}</p>
              )}
              {instrument && (
                <p className="mt-1 text-xs text-gray-500">
                  Para agregar capital usa "Flujo de capital" en acciones
                </p>
              )}
            </div>

            {/* Valor actual */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Valor actual (opcional)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-gray-500">$</span>
                <input
                  type="number"
                  name="currentValue"
                  value={formData.currentValue}
                  onChange={handleChange}
                  step="0.01"
                  className={`w-full pl-8 pr-3 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.currentValue ? 'border-red-500' : 'border-gray-300'
                    }`}
                  placeholder="0.00"
                />
              </div>
              {errors.currentValue && (
                <p className="mt-1 text-sm text-red-600">{errors.currentValue}</p>
              )}
              {!formData.currentValue && !instrument && (
                <p className="mt-1 text-xs text-gray-500">
                  Si no ingresas un valor, se usará el depósito inicial
                </p>
              )}
            </div>
          </div>

          {/* Broker / Casa de bolsa */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Broker / Casa de bolsa (opcional)
            </label>
            <input
              type="text"
              name="broker"
              value={formData.broker}
              onChange={handleChange}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: GBM+, Kuspit, Bitso, etc."
            />
          </div>

          {/* Descripción */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Descripción / Notas (opcional)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder="Agrega notas sobre este instrumento..."
            />
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition"
            >
              {instrument ? 'Guardar cambios' : 'Crear instrumento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}