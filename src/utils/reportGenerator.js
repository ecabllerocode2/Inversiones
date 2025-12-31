// src/utils/reportGenerator.js
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { normalizeDate } from './dateHelpers.js';

// Helper para formatear fechas de forma segura
const formatDateSafe = (dateInput, formatStr = 'dd/MMM/yyyy') => {
  if (!dateInput) return 'N/A';
  try {
    const date = normalizeDate(dateInput);
    if (!date || isNaN(date.getTime())) return 'N/A';
    return format(date, formatStr, { locale: es });
  } catch {
    return 'N/A';
  }
};

// Generar reporte en PDF
export function generatePDFReport(portfolio, dateRange, reportType = 'general') {
  try {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    
    // Título
    doc.setFontSize(20);
    doc.setFont(undefined, 'bold');
    doc.text('Reporte de Inversiones', pageWidth / 2, 20, { align: 'center' });
    
    // Subtítulo con fecha
    doc.setFontSize(12);
    doc.setFont(undefined, 'normal');
    const dateStr = dateRange 
      ? `${formatDateSafe(dateRange.start, 'dd/MMM/yyyy')} - ${formatDateSafe(dateRange.end, 'dd/MMM/yyyy')}`
      : 'Histórico completo';
    doc.text(dateStr, pageWidth / 2, 28, { align: 'center' });
    doc.text(`Generado: ${formatDateSafe(new Date(), 'dd/MMM/yyyy HH:mm')}`, pageWidth / 2, 34, { align: 'center' });
    
    // Resumen general
    const instruments = portfolio?.instruments || [];
    const totalInvested = instruments.reduce((sum, inst) => {
      const deposits = (inst.cashFlows || [])
        .filter(cf => cf.type === 'deposit')
        .reduce((s, cf) => s + cf.amount, 0);
      const withdrawals = (inst.cashFlows || [])
        .filter(cf => cf.type === 'withdrawal')
        .reduce((s, cf) => s + cf.amount, 0);
      return sum + Math.max(0, deposits - withdrawals);
    }, 0);
    
    const currentValue = instruments.reduce((sum, inst) => sum + (inst.currentValue || 0), 0);
    const gain = currentValue - totalInvested;
    const yieldPct = totalInvested > 0 ? ((gain / totalInvested) * 100).toFixed(2) : '0.00';
    
    // Tabla de resumen
    doc.autoTable({
      startY: 40,
      head: [['Métrica', 'Valor']],
      body: [
        ['Capital Invertido', `$${totalInvested.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`],
        ['Valor Actual', `$${currentValue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`],
        ['Ganancia/Pérdida', `$${gain.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`],
        ['Rendimiento (%)', `${yieldPct}%`],
        ['Número de Instrumentos', instruments.length.toString()]
      ],
      theme: 'grid',
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    // Tabla de instrumentos
    let finalY = doc.lastAutoTable.finalY + 10;
    
    doc.setFontSize(14);
    doc.setFont(undefined, 'bold');
    doc.text('Detalle por Instrumento', 14, finalY);
    
    const instrumentData = instruments.map(inst => {
      const deposits = (inst.cashFlows || [])
        .filter(cf => cf.type === 'deposit')
        .reduce((s, cf) => s + cf.amount, 0);
      const withdrawals = (inst.cashFlows || [])
        .filter(cf => cf.type === 'withdrawal')
        .reduce((s, cf) => s + cf.amount, 0);
      const netInv = Math.max(0, deposits - withdrawals);
      const currVal = inst.currentValue || 0;
      const instGain = currVal - netInv;
      const instYield = netInv > 0 ? ((instGain / netInv) * 100).toFixed(2) : '0.00';
      
      return [
        inst.name,
        `$${netInv.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        `$${currVal.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        `$${instGain.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        `${instYield}%`
      ];
    });
    
    doc.autoTable({
      startY: finalY + 5,
      head: [['Instrumento', 'Invertido', 'Valor Actual', 'Ganancia', 'Rend. (%)']],
      body: instrumentData,
      theme: 'striped',
      headStyles: { fillColor: [59, 130, 246] }
    });
    
    // Transacciones recientes
    if (reportType === 'detailed') {
      finalY = doc.lastAutoTable.finalY + 10;
      
      // Nueva página si es necesario
      if (finalY > doc.internal.pageSize.height - 40) {
        doc.addPage();
        finalY = 20;
      }
      
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text('Transacciones Recientes', 14, finalY);
      
      const allTransactions = [];
      instruments.forEach(inst => {
        (inst.cashFlows || []).forEach(cf => {
          const cfDate = normalizeDate(cf.date);
          if (cfDate) {
            allTransactions.push({
              date: cfDate,
              instrument: inst.name,
              type: cf.type === 'deposit' ? 'Depósito' : 'Retiro',
              amount: cf.amount,
              description: cf.description || '-'
            });
          }
        });
      });
      
      // Ordenar por fecha descendente y tomar las últimas 20
      allTransactions.sort((a, b) => {
        const dateA = a.date?.getTime() || 0;
        const dateB = b.date?.getTime() || 0;
        return dateB - dateA;
      });
      const recentTransactions = allTransactions.slice(0, 20);
      
      const transactionData = recentTransactions.map(t => [
        formatDateSafe(t.date, 'dd/MMM/yyyy'),
        t.instrument,
        t.type,
        `$${t.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        t.description
      ]);
      
      doc.autoTable({
        startY: finalY + 5,
        head: [['Fecha', 'Instrumento', 'Tipo', 'Monto', 'Descripción']],
        body: transactionData,
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
        styles: { fontSize: 8 }
      });
    }
    
    // Guardar PDF
    const fileName = `reporte-inversiones-${formatDateSafe(new Date(), 'yyyy-MM-dd')}.pdf`;
    doc.save(fileName);
    
    return fileName;
  } catch (error) {
    console.error('Error generando PDF:', error);
    throw new Error('Error al generar el reporte PDF');
  }
}

// Generar reporte en Excel
export function generateExcelReport(portfolio, dateRange) {
  try {
    const instruments = portfolio?.instruments || [];
    
    // Hoja 1: Resumen
    const summaryData = [];
    summaryData.push(['REPORTE DE INVERSIONES']);
    summaryData.push([]);
    
    if (dateRange) {
      summaryData.push(['Período', `${formatDateSafe(dateRange.start, 'dd/MMM/yyyy')} - ${formatDateSafe(dateRange.end, 'dd/MMM/yyyy')}`]);
    } else {
      summaryData.push(['Período', 'Histórico completo']);
    }
    
    summaryData.push(['Generado', formatDateSafe(new Date(), 'dd/MMM/yyyy HH:mm')]);
    summaryData.push([]);
    
    const totalInvested = instruments.reduce((sum, inst) => {
      const deposits = (inst.cashFlows || [])
        .filter(cf => cf.type === 'deposit')
        .reduce((s, cf) => s + cf.amount, 0);
      const withdrawals = (inst.cashFlows || [])
        .filter(cf => cf.type === 'withdrawal')
        .reduce((s, cf) => s + cf.amount, 0);
      return sum + Math.max(0, deposits - withdrawals);
    }, 0);
    
    const currentValue = instruments.reduce((sum, inst) => sum + (inst.currentValue || 0), 0);
    const gain = currentValue - totalInvested;
    const yieldPct = totalInvested > 0 ? ((gain / totalInvested) * 100).toFixed(2) : '0.00';
    
    summaryData.push(['RESUMEN GENERAL']);
    summaryData.push(['Capital Invertido', totalInvested]);
    summaryData.push(['Valor Actual', currentValue]);
    summaryData.push(['Ganancia/Pérdida', gain]);
    summaryData.push(['Rendimiento (%)', parseFloat(yieldPct)]);
    summaryData.push(['Número de Instrumentos', instruments.length]);
    
    // Hoja 2: Instrumentos
    const instrumentsData = [];
    instrumentsData.push(['Instrumento', 'Categoría', 'Broker', 'Capital Invertido', 'Valor Actual', 'Ganancia/Pérdida', 'Rendimiento (%)']);
    
    instruments.forEach(inst => {
      const deposits = (inst.cashFlows || [])
        .filter(cf => cf.type === 'deposit')
        .reduce((s, cf) => s + cf.amount, 0);
      const withdrawals = (inst.cashFlows || [])
        .filter(cf => cf.type === 'withdrawal')
        .reduce((s, cf) => s + cf.amount, 0);
      const netInv = Math.max(0, deposits - withdrawals);
      const currVal = inst.currentValue || 0;
      const instGain = currVal - netInv;
      const instYield = netInv > 0 ? ((instGain / netInv) * 100).toFixed(2) : '0.00';
      
      instrumentsData.push([
        inst.name,
        inst.category || '-',
        inst.broker || '-',
        netInv,
        currVal,
        instGain,
        parseFloat(instYield)
      ]);
    });
    
    // Hoja 3: Transacciones
    const transactionsData = [];
    transactionsData.push(['Fecha', 'Instrumento', 'Tipo', 'Monto', 'Descripción']);
    
    const allTransactions = [];
    instruments.forEach(inst => {
      (inst.cashFlows || []).forEach(cf => {
        const cfDate = normalizeDate(cf.date);
        if (cfDate) {
          allTransactions.push({
            date: cfDate,
            instrument: inst.name,
            type: cf.type === 'deposit' ? 'Depósito' : 'Retiro',
            amount: cf.amount,
            description: cf.description || '-'
          });
        }
      });
    });
    
    allTransactions.sort((a, b) => {
      const dateA = a.date?.getTime() || 0;
      const dateB = b.date?.getTime() || 0;
      return dateB - dateA;
    });
    
    allTransactions.forEach(t => {
      transactionsData.push([
        formatDateSafe(t.date, 'dd/MMM/yyyy'),
        t.instrument,
        t.type,
        t.amount,
        t.description
      ]);
    });
    
    // Hoja 4: Valuaciones
    const valuationsData = [];
    valuationsData.push(['Fecha', 'Instrumento', 'Valor']);
    
    const allValuations = [];
    instruments.forEach(inst => {
      (inst.valuations || []).forEach(val => {
        if (!val.auto) {
          const valDate = normalizeDate(val.date);
          if (valDate) {
            allValuations.push({
              date: valDate,
              instrument: inst.name,
              value: val.value
            });
          }
        }
      });
    });
    
    allValuations.sort((a, b) => {
      const dateA = a.date?.getTime() || 0;
      const dateB = b.date?.getTime() || 0;
      return dateB - dateA;
    });
    
    allValuations.forEach(v => {
      valuationsData.push([
        formatDateSafe(v.date, 'dd/MMM/yyyy'),
        v.instrument,
        v.value
      ]);
    });
    
    // Crear workbook
    const wb = XLSX.utils.book_new();
    
    const ws1 = XLSX.utils.aoa_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, ws1, 'Resumen');
    
    const ws2 = XLSX.utils.aoa_to_sheet(instrumentsData);
    XLSX.utils.book_append_sheet(wb, ws2, 'Instrumentos');
    
    const ws3 = XLSX.utils.aoa_to_sheet(transactionsData);
    XLSX.utils.book_append_sheet(wb, ws3, 'Transacciones');
    
    const ws4 = XLSX.utils.aoa_to_sheet(valuationsData);
    XLSX.utils.book_append_sheet(wb, ws4, 'Valuaciones');
    
    // Guardar archivo
    const fileName = `reporte-inversiones-${formatDateSafe(new Date(), 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, fileName);
    
    return fileName;
  } catch (error) {
    console.error('Error generando Excel:', error);
    throw new Error('Error al generar el reporte Excel');
  }
}

// Generar reporte mensual
export function generateMonthlyReport(portfolio, year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59);
  
  return generatePDFReport(portfolio, { start: startDate, end: endDate }, 'detailed');
}

// Generar reporte trimestral
export function generateQuarterlyReport(portfolio, year, quarter) {
  const startMonth = (quarter - 1) * 3;
  const startDate = new Date(year, startMonth, 1);
  const endDate = new Date(year, startMonth + 3, 0, 23, 59, 59);
  
  return generatePDFReport(portfolio, { start: startDate, end: endDate }, 'detailed');
}

// Generar reporte anual
export function generateAnnualReport(portfolio, year) {
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31, 23, 59, 59);
  
  return generatePDFReport(portfolio, { start: startDate, end: endDate }, 'detailed');
}
