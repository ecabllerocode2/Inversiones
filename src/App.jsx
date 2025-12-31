// src/App.jsx
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase.js';
import Login from './pages/Login.jsx';
import DashboardV2 from './pages/DashboardV2.jsx';
import Layout from './components/Layout.jsx';

export default function App() {
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={userId ? <Navigate to="/dashboard" /> : <Login />} />
      <Route
        path="/dashboard"
        element={userId ? (
          <Layout>
            <DashboardV2 userId={userId} />
          </Layout>
        ) : (
          <Navigate to="/login" />
        )}
      />
      <Route path="*" element={<Navigate to={userId ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}