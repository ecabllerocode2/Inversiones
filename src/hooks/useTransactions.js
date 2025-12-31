// src/hooks/useTransactions.js
import { useState } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase.js';
import toast from 'react-hot-toast';
import { normalizePortfolio } from '../utils/dateHelpers.js';

export function useTransactions(userId) {
  const [loading, setLoading] = useState(false);

  const getPortfolio = async () => {
    const portfolioRef = doc(db, 'portfolios', userId);
    const docSnap = await getDoc(portfolioRef);
    if (!docSnap.exists()) return null;
    
    const rawData = docSnap.data();
    return normalizePortfolio(rawData);
  };

  const updatePortfolio = async (updatedInstruments) => {
    if (!userId) throw new Error('User ID is required');
    
    const portfolioRef = doc(db, 'portfolios', userId);
    await updateDoc(portfolioRef, {
      instruments: updatedInstruments,
      updatedAt: new Date()
    });
  };

  // Agregar depósito o retiro
  const addTransaction = async (instrumentName, transactionData) => {
    setLoading(true);
    try {
      const portfolio = await getPortfolio();
      const instruments = [...(portfolio?.instruments || [])];
      const instIndex = instruments.findIndex(i => i.name === instrumentName);
      
      if (instIndex === -1) throw new Error('Instrumento no encontrado');
      
      const instrument = { ...instruments[instIndex] };
      const transaction = {
        id: Date.now().toString(),
        ...transactionData,
        createdAt: new Date()
      };

      instrument.cashFlows = [...(instrument.cashFlows || []), transaction];
      
      // Recalcular totales
      const totalDeposited = instrument.cashFlows
        .filter(cf => cf.type === 'deposit')
        .reduce((sum, cf) => sum + cf.amount, 0);
      
      const totalWithdrawn = instrument.cashFlows
        .filter(cf => cf.type === 'withdrawal')
        .reduce((sum, cf) => sum + cf.amount, 0);
      
      instrument.totalDeposited = totalDeposited;
      instrument.totalWithdrawn = totalWithdrawn;
      instrument.netInvested = Math.max(0, totalDeposited - totalWithdrawn);
      
      // Si es un depósito, incrementar el valor actual
      if (transactionData.type === 'deposit') {
        instrument.currentValue = (instrument.currentValue || 0) + transactionData.amount;
        
        // Agregar una valuación automática
        instrument.valuations = [...(instrument.valuations || []), {
          id: Date.now().toString() + '_auto',
          date: transactionData.date,
          value: instrument.currentValue,
          auto: true
        }];
      }
      
      instruments[instIndex] = instrument;
      await updatePortfolio(instruments);
      
      toast.success(`${transactionData.type === 'deposit' ? 'Depósito' : 'Retiro'} registrado exitosamente`);
      
      // Recargar la página para actualizar los datos
      window.location.reload();
      
      return transaction;
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast.error('Error al registrar la transacción');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Agregar valuación
  const addValuation = async (instrumentName, valuationData) => {
    setLoading(true);
    try {
      const portfolio = await getPortfolio();
      const instruments = [...(portfolio?.instruments || [])];
      const instIndex = instruments.findIndex(i => i.name === instrumentName);
      
      if (instIndex === -1) throw new Error('Instrumento no encontrado');
      
      const instrument = { ...instruments[instIndex] };
      const valuation = {
        id: Date.now().toString(),
        ...valuationData,
        createdAt: new Date()
      };

      instrument.valuations = [...(instrument.valuations || []), valuation];
      instrument.currentValue = valuationData.value;
      instrument.lastValuationDate = valuationData.date;
      
      instruments[instIndex] = instrument;
      await updatePortfolio(instruments);
      
      toast.success('Valuación registrada exitosamente');
      
      // Recargar la página para actualizar los datos
      window.location.reload();
      
      return valuation;
    } catch (error) {
      console.error('Error adding valuation:', error);
      toast.error('Error al registrar la valuación');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Transferir entre instrumentos
  const transferBetweenInstruments = async (transferData) => {
    const { fromInstrument, toInstrument, amount, date, description } = transferData;
    
    setLoading(true);
    try {
      const portfolio = await getPortfolio();
      const instruments = [...(portfolio?.instruments || [])];
      const fromIndex = instruments.findIndex(i => i.name === fromInstrument);
      const toIndex = instruments.findIndex(i => i.name === toInstrument);
      
      if (fromIndex === -1 || toIndex === -1) {
        throw new Error('Uno de los instrumentos no fue encontrado');
      }
      
      const fromInst = { ...instruments[fromIndex] };
      const toInst = { ...instruments[toIndex] };
      
      // Validar que haya fondos suficientes
      if ((fromInst.currentValue || 0) < amount) {
        throw new Error('Fondos insuficientes en el instrumento de origen');
      }
      
      const transferId = Date.now().toString();
      
      // Retiro del instrumento origen
      const withdrawalCF = {
        id: transferId + '_withdrawal',
        date,
        amount,
        type: 'withdrawal',
        description: description || `Transferencia a ${toInstrument}`,
        transferTo: toInstrument,
        transferId,
        createdAt: new Date()
      };
      
      fromInst.cashFlows = [...(fromInst.cashFlows || []), withdrawalCF];
      fromInst.currentValue = Math.max(0, (fromInst.currentValue || 0) - amount);
      
      // Depósito en el instrumento destino
      const depositCF = {
        id: transferId + '_deposit',
        date,
        amount,
        type: 'deposit',
        description: description || `Transferencia desde ${fromInstrument}`,
        transferFrom: fromInstrument,
        transferId,
        createdAt: new Date()
      };
      
      toInst.cashFlows = [...(toInst.cashFlows || []), depositCF];
      toInst.currentValue = (toInst.currentValue || 0) + amount;
      
      // Recalcular totales para ambos
      [fromInst, toInst].forEach(inst => {
        const totalDeposited = inst.cashFlows
          .filter(cf => cf.type === 'deposit')
          .reduce((sum, cf) => sum + cf.amount, 0);
        
        const totalWithdrawn = inst.cashFlows
          .filter(cf => cf.type === 'withdrawal')
          .reduce((sum, cf) => sum + cf.amount, 0);
        
        inst.totalDeposited = totalDeposited;
        inst.totalWithdrawn = totalWithdrawn;
        inst.netInvested = Math.max(0, totalDeposited - totalWithdrawn);
      });
      
      // Agregar valuaciones automáticas
      fromInst.valuations = [...(fromInst.valuations || []), {
        id: transferId + '_from_val',
        date,
        value: fromInst.currentValue,
        auto: true
      }];
      
      toInst.valuations = [...(toInst.valuations || []), {
        id: transferId + '_to_val',
        date,
        value: toInst.currentValue,
        auto: true
      }];
      
      instruments[fromIndex] = fromInst;
      instruments[toIndex] = toInst;
      
      await updatePortfolio(instruments);
      
      toast.success(`Transferencia de $${amount.toLocaleString()} completada`);
      
      // Recargar la página para actualizar los datos
      window.location.reload();
      
      return { withdrawalCF, depositCF };
    } catch (error) {
      console.error('Error transferring:', error);
      toast.error(error.message || 'Error al realizar la transferencia');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    addTransaction,
    addValuation,
    transferBetweenInstruments
  };
}
