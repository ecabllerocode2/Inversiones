// src/components/Header.jsx
import { Link } from 'react-router-dom';
import { LucideUser } from 'lucide-react';

export default function Header() {
  return (
    <header className="bg-white shadow-md border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600">Mi Portafolio</Link>
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
            <LucideUser size={20} />
            <span>Perfil</span>
          </button>
          <button className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}