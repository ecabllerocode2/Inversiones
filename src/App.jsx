// src/App.jsx
import { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase.js';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Layout from './components/Layout.jsx';

export default function App() {
  const [userId, setUserId] = useState(null); // ✅ Solo el uid
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserId(user ? user.uid : null); // ✅ Extraer solo el uid
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <Routes>
      <Route path="/login" element={userId ? <Navigate to="/dashboard" /> : <Login />} />
      <Route
        path="/dashboard"
        element={userId ? (
          <Layout>
            <Dashboard userId={userId} /> {/* ✅ Pasar solo el uid */}
          </Layout>
        ) : (
          <Navigate to="/login" />
        )}
      />
      <Route path="*" element={<Navigate to={userId ? "/dashboard" : "/login"} />} />
    </Routes>
  );
}