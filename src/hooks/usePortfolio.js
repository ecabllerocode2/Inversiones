// src/hooks/usePortfolio.js
import { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';

export function usePortfolio(userId) {
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
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
  }, [userId]);

  const upsertInstrument = async (instrumentData) => {
    if (!userId) throw new Error('User ID is required');
    if (!instrumentData?.name) throw new Error('Instrument must have a name');

    const currentInstruments = portfolio?.instruments || [];
    const existingIndex = currentInstruments.findIndex(inst => inst.name === instrumentData.name);

    let updatedInstruments;

    if (existingIndex >= 0) {
      // Actualizar instrumento existente
      const updatedInst = {
        ...currentInstruments[existingIndex],
        ...instrumentData,
        currentValue: instrumentData.currentValue ?? currentInstruments[existingIndex].currentValue,
        lastValuationDate: new Date()
      };
      updatedInstruments = [...currentInstruments];
      updatedInstruments[existingIndex] = updatedInst;
    } else {
      // Crear nuevo instrumento
      const newInstrument = {
        ...instrumentData,
        cashFlows: instrumentData.cashFlows || [],
        valuations: instrumentData.valuations || [],
        currentValue: instrumentData.currentValue || 0,
        lastValuationDate: new Date()
      };
      updatedInstruments = [...currentInstruments, newInstrument];
    }

    const portfolioRef = doc(db, 'portfolios', userId);
    await updateDoc(portfolioRef, {
      instruments: updatedInstruments,
      updatedAt: new Date()
    });

    setPortfolio(prev => ({
      ...prev,
      instruments: updatedInstruments,
      updatedAt: new Date()
    }));
  };

  const addValuation = async (instrumentName, valuation) => {
    if (!portfolio) throw new Error('Portfolio not loaded');
    const inst = (portfolio.instruments || []).find(i => i.name === instrumentName);
    if (!inst) throw new Error('Instrument not found');

    const updatedInstrument = {
      ...inst,
      valuations: [...(inst.valuations || []), { id: Date.now().toString(), ...valuation }],
      currentValue: valuation.value,
      lastValuationDate: valuation.date
    };

    await upsertInstrument(updatedInstrument);
  };

  const addCashFlow = async (instrumentName, cashFlow) => {
    if (!portfolio) throw new Error('Portfolio not loaded');
    const inst = (portfolio.instruments || []).find(i => i.name === instrumentName);
    if (!inst) throw new Error('Instrument not found');

    const updatedInstrument = {
      ...inst,
      cashFlows: [...(inst.cashFlows || []), { id: Date.now().toString(), ...cashFlow }]
    };

    await upsertInstrument(updatedInstrument);
  };

  return { 
    portfolio, 
    loading, 
    error, 
    upsertInstrument,
    addValuation,
    addCashFlow 
  };
}