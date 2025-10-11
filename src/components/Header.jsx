import { Link, useNavigate } from 'react-router-dom';
import { LucideUser } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase.js';

export default function Header() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login'); // redirige al login
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className="bg-white shadow-md border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-blue-600">
          Mi Portafolio
        </Link>
        <div className="flex items-center space-x-4">
          <button className="flex items-center space-x-1 text-gray-700 hover:text-blue-600">
            <LucideUser size={20} />
            <span>Perfil</span>
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    </header>
  );
}
