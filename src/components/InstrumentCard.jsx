// src/components/InstrumentCard.jsx
export default function InstrumentCard({ instrument, onEdit }) {
  const { name = 'Sin nombre', category = 'Otro', initialDeposit = 0, currentValue = 0 } = instrument;
  const gain = currentValue - initialDeposit;
  const yieldPct = initialDeposit > 0 ? (gain / initialDeposit) * 100 : 0;

  const categoryColors = {
    Liquidez: 'bg-blue-100 border-blue-300',
    'Renta fija': 'bg-green-100 border-green-300',
    Crecimiento: 'bg-orange-100 border-orange-300'
  };

  return (
    <div className={`border ${categoryColors[category] || 'bg-gray-100'} rounded-lg p-4 shadow-sm mb-3`}>
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-lg">{name}</h3>
          <p className="text-sm text-gray-600">{category}</p>
        </div>
        <button
          onClick={onEdit}
          className="text-gray-500 hover:text-blue-600 font-bold"
        >
          Editar
        </button>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-gray-500">Depósito</p>
          <p className="font-semibold">${Number(initialDeposit).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div>
          <p className="text-gray-500">Actual</p>
          <p className="font-semibold">${Number(currentValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
        </div>
        <div>
          <p className="text-gray-500">Ganancia</p>
          <p className={`font-semibold ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {gain >= 0 ? '+' : ''}${Math.abs(gain).toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Rendimiento</p>
          <p className={`font-semibold ${yieldPct >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {yieldPct >= 0 ? '+' : ''}{yieldPct.toFixed(2)}%
          </p>
        </div>
      </div>
    </div>
  );
}