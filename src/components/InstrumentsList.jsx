// src/components/InstrumentsList.jsx
import InstrumentCard from './InstrumentCard.jsx';

export default function InstrumentsList({ instruments = [], onEdit }) {
  if (!instruments || instruments.length === 0) {
    return (
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Instrumentos</h2>
        <p className="text-gray-500">No tienes instrumentos registrados.</p>
      </div>
    );
  }

  return (
    <div className="mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Instrumentos</h2>
      {instruments.map((inst, index) => (
        <InstrumentCard
          key={inst.name || index}
          instrument={inst}
          onEdit={() => onEdit(inst)}
        />
      ))}
    </div>
  );
}