// src/components/QuickActionsModal.jsx
import React, { useState } from 'react';
import { X, Plus, ArrowRightLeft, TrendingUp, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export default function QuickActionsModal({ instruments, onClose, onAction }) {
  const [actionType, setActionType] = useState(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    instrument: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    amount: '',
    type: 'deposit',
    description: '',
    value: '',
    fromInstrument: '',
    toInstrument: ''
  });

  const [errors, setErrors] = useState({});

  const resetForm = () => {
    setActionType(null);
    setStep(1);
    setFormData({
      instrument: '',
      date: format(new Date(), 'yyyy-MM-dd'),
      amount: '',
      type: 'deposit',
      description: '',
      value: '',
      fromInstrument: '',
      toInstrument: ''
    });
    setErrors({});
  };

  const validateStep = () => {
    const newErrors = {};

    if (actionType === 'transaction') {
      if (step === 1 && !formData.instrument) {
        newErrors.instrument = 'Selecciona un instrumento';
      }
      if (step === 2) {
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
          newErrors.amount = 'Ingresa un monto válido mayor a 0';
        }
        if (!formData.date) {
          newErrors.date = 'Selecciona una fecha';
        }
      }
    } else if (actionType === 'valuation') {
      if (step === 1 && !formData.instrument) {
        newErrors.instrument = 'Selecciona un instrumento';
      }
      if (step === 2) {
        if (!formData.value || parseFloat(formData.value) <= 0) {
          newErrors.value = 'Ingresa un valor válido mayor a 0';
        }
        if (!formData.date) {
          newErrors.date = 'Selecciona una fecha';
        }
      }
    } else if (actionType === 'transfer') {
      if (step === 1) {
        if (!formData.fromInstrument) {
          newErrors.fromInstrument = 'Selecciona el instrumento de origen';
        }
        if (!formData.toInstrument) {
          newErrors.toInstrument = 'Selecciona el instrumento destino';
        }
        if (formData.fromInstrument === formData.toInstrument) {
          newErrors.toInstrument = 'Debe ser diferente al instrumento de origen';
        }
      }
      if (step === 2) {
        if (!formData.amount || parseFloat(formData.amount) <= 0) {
          newErrors.amount = 'Ingresa un monto válido mayor a 0';
        }
        
        const fromInst = instruments.find(i => i.name === formData.fromInstrument);
        if (fromInst && parseFloat(formData.amount) > (fromInst.currentValue || 0)) {
          newErrors.amount = 'Monto mayor al valor disponible';
        }
        
        if (!formData.date) {
          newErrors.date = 'Selecciona una fecha';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    setStep(step - 1);
    setErrors({});
  };

  const handleSubmit = () => {
    if (!validateStep()) return;

    if (actionType === 'transaction') {
      onAction({
        type: 'transaction',
        data: {
          instrumentName: formData.instrument,
          date: formData.date,
          amount: parseFloat(formData.amount),
          type: formData.type,
          description: formData.description
        }
      });
    } else if (actionType === 'valuation') {
      onAction({
        type: 'valuation',
        data: {
          instrumentName: formData.instrument,
          date: formData.date,
          value: parseFloat(formData.value)
        }
      });
    } else if (actionType === 'transfer') {
      onAction({
        type: 'transfer',
        data: {
          fromInstrument: formData.fromInstrument,
          toInstrument: formData.toInstrument,
          amount: parseFloat(formData.amount),
          date: formData.date,
          description: formData.description
        }
      });
    }

    resetForm();
    onClose();
  };

  const actionTypes = [
    {
      id: 'transaction',
      icon: DollarSign,
      title: 'Depósito o Retiro',
      description: 'Registra un movimiento de dinero',
      color: 'bg-green-100 text-green-700'
    },
    {
      id: 'valuation',
      icon: TrendingUp,
      title: 'Actualizar Valor',
      description: 'Registra el valor actual del instrumento',
      color: 'bg-blue-100 text-blue-700'
    },
    {
      id: 'transfer',
      icon: ArrowRightLeft,
      title: 'Transferir',
      description: 'Mueve fondos entre instrumentos',
      color: 'bg-purple-100 text-purple-700'
    }
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">
              {!actionType ? 'Acción Rápida' : actionTypes.find(a => a.id === actionType)?.title}
            </h2>
            {actionType && (
              <p className="text-sm text-gray-600 mt-1">
                Paso {step} de {actionType === 'transaction' ? 3 : actionType === 'valuation' ? 3 : 3}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          {/* Selección de tipo de acción */}
          {!actionType && (
            <div className="space-y-4">
              <p className="text-gray-600 mb-6">¿Qué deseas hacer?</p>
              {actionTypes.map(action => {
                const Icon = action.icon;
                return (
                  <button
                    key={action.id}
                    onClick={() => setActionType(action.id)}
                    className="w-full p-6 border-2 border-gray-200 rounded-xl hover:border-blue-500 hover:shadow-md transition text-left group"
                  >
                    <div className="flex items-start gap-4">
                      <div className={`p-3 rounded-lg ${action.color} group-hover:scale-110 transition`}>
                        <Icon size={24} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {action.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Formulario para Transacción */}
          {actionType === 'transaction' && (
            <>
              {step === 1 && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">
                      Selecciona el instrumento
                    </span>
                    <select
                      value={formData.instrument}
                      onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
                      className={`w-full p-3 border rounded-lg ${
                        errors.instrument ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">-- Selecciona --</option>
                      {instruments.map(inst => (
                        <option key={inst.name} value={inst.name}>
                          {inst.name} (${(inst.currentValue || 0).toLocaleString('es-MX')})
                        </option>
                      ))}
                    </select>
                    {errors.instrument && (
                      <p className="mt-1 text-sm text-red-600">{errors.instrument}</p>
                    )}
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">
                      Tipo de transacción
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'deposit' })}
                        className={`p-4 border-2 rounded-lg font-medium transition ${
                          formData.type === 'deposit'
                            ? 'border-green-500 bg-green-50 text-green-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        💰 Depósito
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, type: 'withdrawal' })}
                        className={`p-4 border-2 rounded-lg font-medium transition ${
                          formData.type === 'withdrawal'
                            ? 'border-red-500 bg-red-50 text-red-700'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        💸 Retiro
                      </button>
                    </div>
                  </label>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">
                      Monto ($)
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className={`w-full p-3 border rounded-lg text-lg ${
                        errors.amount ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                      autoFocus
                    />
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                    )}
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">
                      Fecha
                    </span>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className={`w-full p-3 border rounded-lg ${
                        errors.date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                    )}
                  </label>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">
                      Descripción (opcional)
                    </span>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      rows={3}
                      placeholder="Agrega notas adicionales..."
                    />
                  </label>

                  {/* Resumen */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-3">Resumen</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Instrumento:</span>
                        <span className="font-medium">{formData.instrument}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Tipo:</span>
                        <span className="font-medium">
                          {formData.type === 'deposit' ? '💰 Depósito' : '💸 Retiro'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Monto:</span>
                        <span className="font-bold text-lg">
                          ${parseFloat(formData.amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Fecha:</span>
                        <span className="font-medium">{formData.date}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Formulario para Valuación */}
          {actionType === 'valuation' && (
            <>
              {step === 1 && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">
                      Selecciona el instrumento
                    </span>
                    <select
                      value={formData.instrument}
                      onChange={(e) => setFormData({ ...formData, instrument: e.target.value })}
                      className={`w-full p-3 border rounded-lg ${
                        errors.instrument ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">-- Selecciona --</option>
                      {instruments.map(inst => (
                        <option key={inst.name} value={inst.name}>
                          {inst.name} (Actual: ${(inst.currentValue || 0).toLocaleString('es-MX')})
                        </option>
                      ))}
                    </select>
                    {errors.instrument && (
                      <p className="mt-1 text-sm text-red-600">{errors.instrument}</p>
                    )}
                  </label>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">
                      Nuevo valor ($)
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.value}
                      onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                      className={`w-full p-3 border rounded-lg text-lg ${
                        errors.value ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                      autoFocus
                    />
                    {errors.value && (
                      <p className="mt-1 text-sm text-red-600">{errors.value}</p>
                    )}
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">
                      Fecha de valuación
                    </span>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className={`w-full p-3 border rounded-lg ${
                        errors.date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                    )}
                  </label>

                  {/* Mostrar cambio */}
                  {formData.instrument && formData.value && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      {(() => {
                        const inst = instruments.find(i => i.name === formData.instrument);
                        const oldValue = inst?.currentValue || 0;
                        const newValue = parseFloat(formData.value);
                        const diff = newValue - oldValue;
                        const diffPct = oldValue > 0 ? (diff / oldValue) * 100 : 0;
                        
                        return (
                          <>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-600">Valor anterior:</span>
                              <span className="font-medium">${oldValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-sm text-gray-600">Nuevo valor:</span>
                              <span className="font-bold text-lg">${newValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                              <span className="text-sm font-medium text-gray-700">Cambio:</span>
                              <div className="text-right">
                                <p className={`font-bold ${diff >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  {diff >= 0 ? '+' : ''}${diff.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                </p>
                                <p className={`text-sm ${diffPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                  ({diffPct >= 0 ? '+' : ''}{diffPct.toFixed(2)}%)
                                </p>
                              </div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Confirmar Valuación</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Instrumento:</span>
                      <span className="font-medium">{formData.instrument}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Nuevo valor:</span>
                      <span className="font-bold text-lg text-blue-600">
                        ${parseFloat(formData.value || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Fecha:</span>
                      <span className="font-medium">{formData.date}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Formulario para Transferencia */}
          {actionType === 'transfer' && (
            <>
              {step === 1 && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">
                      Desde (instrumento origen)
                    </span>
                    <select
                      value={formData.fromInstrument}
                      onChange={(e) => setFormData({ ...formData, fromInstrument: e.target.value })}
                      className={`w-full p-3 border rounded-lg ${
                        errors.fromInstrument ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">-- Selecciona --</option>
                      {instruments.map(inst => (
                        <option key={inst.name} value={inst.name}>
                          {inst.name} (${(inst.currentValue || 0).toLocaleString('es-MX')})
                        </option>
                      ))}
                    </select>
                    {errors.fromInstrument && (
                      <p className="mt-1 text-sm text-red-600">{errors.fromInstrument}</p>
                    )}
                  </label>

                  <div className="flex justify-center py-2">
                    <ArrowRightLeft size={24} className="text-gray-400" />
                  </div>

                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">
                      Hacia (instrumento destino)
                    </span>
                    <select
                      value={formData.toInstrument}
                      onChange={(e) => setFormData({ ...formData, toInstrument: e.target.value })}
                      className={`w-full p-3 border rounded-lg ${
                        errors.toInstrument ? 'border-red-500' : 'border-gray-300'
                      }`}
                    >
                      <option value="">-- Selecciona --</option>
                      {instruments
                        .filter(inst => inst.name !== formData.fromInstrument)
                        .map(inst => (
                          <option key={inst.name} value={inst.name}>
                            {inst.name} (${(inst.currentValue || 0).toLocaleString('es-MX')})
                          </option>
                        ))
                      }
                    </select>
                    {errors.toInstrument && (
                      <p className="mt-1 text-sm text-red-600">{errors.toInstrument}</p>
                    )}
                  </label>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">
                      Monto a transferir ($)
                    </span>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className={`w-full p-3 border rounded-lg text-lg ${
                        errors.amount ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="0.00"
                      autoFocus
                    />
                    {errors.amount && (
                      <p className="mt-1 text-sm text-red-600">{errors.amount}</p>
                    )}
                    
                    {/* Mostrar saldo disponible */}
                    {formData.fromInstrument && (
                      <p className="mt-1 text-sm text-gray-600">
                        Disponible: ${(instruments.find(i => i.name === formData.fromInstrument)?.currentValue || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </p>
                    )}
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">
                      Fecha
                    </span>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      className={`w-full p-3 border rounded-lg ${
                        errors.date ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.date && (
                      <p className="mt-1 text-sm text-red-600">{errors.date}</p>
                    )}
                  </label>

                  <label className="block">
                    <span className="text-sm font-semibold text-gray-700 mb-2 block">
                      Descripción (opcional)
                    </span>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg"
                      placeholder="Motivo de la transferencia..."
                    />
                  </label>
                </div>
              )}

              {step === 3 && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h4 className="font-semibold text-gray-800 mb-3">Confirmar Transferencia</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white rounded-lg">
                      <div>
                        <p className="text-xs text-gray-600">Desde</p>
                        <p className="font-semibold text-gray-800">{formData.fromInstrument}</p>
                      </div>
                      <ArrowRightLeft size={20} className="text-purple-600" />
                      <div className="text-right">
                        <p className="text-xs text-gray-600">Hacia</p>
                        <p className="font-semibold text-gray-800">{formData.toInstrument}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Monto:</span>
                      <span className="font-bold text-xl text-purple-600">
                        ${parseFloat(formData.amount || 0).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Fecha:</span>
                      <span className="text-sm font-medium">{formData.date}</span>
                    </div>
                    
                    {formData.description && (
                      <div className="pt-2 border-t border-purple-200">
                        <p className="text-xs text-gray-600">Descripción:</p>
                        <p className="text-sm">{formData.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Botones de navegación */}
          {actionType && (
            <div className="flex gap-3 mt-6">
              {step > 1 && (
                <button
                  onClick={handleBack}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Atrás
                </button>
              )}
              
              {step === 1 && (
                <button
                  onClick={() => {
                    setActionType(null);
                    setStep(1);
                    setErrors({});
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
              )}

              {step < (actionType === 'transaction' || actionType === 'valuation' || actionType === 'transfer' ? 3 : 2) ? (
                <button
                  onClick={handleNext}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
                >
                  Siguiente
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition"
                >
                  Confirmar
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
