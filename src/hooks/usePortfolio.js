// src/hooks/usePortfolio.js
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

export function usePortfolio(userId) {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Si no hay userId, no hacer nada
    if (!userId) {
      setLoading(false);
      return;
    }

    const loadPortfolio = async () => {
      try {
        const portfolioRef = doc(db, 'portfolios', userId);
        const docSnap = await getDoc(portfolioRef);

        if (docSnap.exists()) {
          setPortfolio(docSnap.data());
        } else {
          // Crear portfolio vacío
          const newPortfolio = {
            userId: userId,
            instruments: [],
            createdAt: new Date(),
            updatedAt: new Date()
          };
          await setDoc(portfolioRef, newPortfolio);
          setPortfolio(newPortfolio);
        }
      } catch (err) {
        console.error('Error en usePortfolio:', err);
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    loadPortfolio();
  }, [userId]); // ✅ Solo depende del string userId

  const upsertInstrument = async (instrument) => {
    if (!userId || !portfolio) {
      throw new Error('No se puede guardar: userId o portfolio no disponibles');
    }

    try {
      const portfolioRef = doc(db, 'portfolios', userId);
      const updatedInstruments = [...(portfolio.instruments || [])];
      const existingIndex = updatedInstruments.findIndex(i => i.name === instrument.name);

      if (existingIndex >= 0) {
        updatedInstruments[existingIndex] = instrument;
      } else {
        updatedInstruments.push(instrument);
      }

      await updateDoc(portfolioRef, {
        instruments: updatedInstruments,
        updatedAt: new Date()
      });

      setPortfolio(prev => ({
        ...prev,
        instruments: updatedInstruments,
        updatedAt: new Date()
      }));
    } catch (err) {
      console.error('Error al guardar instrumento:', err);
      throw err;
    }
  };

  return { portfolio, loading, error, upsertInstrument };
}