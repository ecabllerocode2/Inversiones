// src/utils/dateHelpers.js

/**
 * Normaliza una fecha que puede venir en diferentes formatos:
 * - Timestamp de Firebase { seconds, nanoseconds }
 * - String ISO "2025-10-31"
 * - Date object
 * - String de fecha "31 de octubre de 2025..."
 */
export function normalizeDate(dateInput) {
  if (!dateInput) return null;
  
  try {
    // Si es un timestamp de Firebase (tiene seconds)
    if (dateInput && typeof dateInput === 'object' && 'seconds' in dateInput) {
      return new Date(dateInput.seconds * 1000);
    }
    
    // Si es un objeto Date
    if (dateInput instanceof Date) {
      return dateInput;
    }
    
    // Si es un string
    if (typeof dateInput === 'string') {
      const date = new Date(dateInput);
      if (!isNaN(date.getTime())) {
        return date;
      }
    }
    
    // Si es un número (timestamp en milisegundos)
    if (typeof dateInput === 'number') {
      return new Date(dateInput);
    }
    
    return null;
  } catch (error) {
    console.error('Error normalizing date:', error, dateInput);
    return null;
  }
}

/**
 * Normaliza un instrumento completo, convirtiendo todos sus timestamps
 */
export function normalizeInstrument(instrument) {
  if (!instrument) return null;
  
  const normalized = { ...instrument };
  
  // Normalizar fechas principales
  if (normalized.createdAt) {
    normalized.createdAt = normalizeDate(normalized.createdAt);
  }
  if (normalized.lastValuationDate) {
    normalized.lastValuationDate = normalizeDate(normalized.lastValuationDate);
  }
  
  // Normalizar fechas en cashFlows
  if (Array.isArray(normalized.cashFlows)) {
    normalized.cashFlows = normalized.cashFlows.map(cf => ({
      ...cf,
      date: normalizeDate(cf.date),
      createdAt: cf.createdAt ? normalizeDate(cf.createdAt) : null,
      updatedAt: cf.updatedAt ? normalizeDate(cf.updatedAt) : null
    }));
  }
  
  // Normalizar fechas en valuations
  if (Array.isArray(normalized.valuations)) {
    normalized.valuations = normalized.valuations.map(val => ({
      ...val,
      date: normalizeDate(val.date),
      createdAt: val.createdAt ? normalizeDate(val.createdAt) : null,
      updatedAt: val.updatedAt ? normalizeDate(val.updatedAt) : null
    }));
  }
  
  return normalized;
}

/**
 * Normaliza un portfolio completo
 */
export function normalizePortfolio(portfolio) {
  if (!portfolio) return null;
  
  const normalized = { ...portfolio };
  
  if (normalized.createdAt) {
    normalized.createdAt = normalizeDate(normalized.createdAt);
  }
  if (normalized.updatedAt) {
    normalized.updatedAt = normalizeDate(normalized.updatedAt);
  }
  
  if (Array.isArray(normalized.instruments)) {
    normalized.instruments = normalized.instruments.map(normalizeInstrument);
  }
  
  return normalized;
}

/**
 * Convierte una fecha a formato que Firebase entiende
 */
export function toFirebaseDate(date) {
  if (!date) return new Date();
  
  if (date instanceof Date) {
    return date;
  }
  
  if (typeof date === 'string') {
    return new Date(date);
  }
  
  return new Date();
}
