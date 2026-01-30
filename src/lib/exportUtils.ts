import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

// Bilingual note to add to all exports - without any names
export const REPORT_NOTE_ENGLISH = 'Note: If you have any queries, contact 6203229118';
export const REPORT_NOTE_HINDI = 'नोट: यदि आपके कोई प्रश्न हैं, तो 6203229118 पर संपर्क करें';
export const REPORT_FOOTER = 'Tibrewal Staff Manager';

// Excel export helper with bilingual notes
export const createExcelWithNotes = (
  data: any[][],
  headers: string[],
  fileName: string,
  title?: string
) => {
  exportToExcel(data, headers, fileName, 'Sheet1', title);
};

export const addReportNotes = (doc: jsPDF, yPosition: number) => {
  const pageHeight = doc.internal.pageSize.height;
  const bottomMargin = 30;
  
  // Check if we need a new page for notes
  if (yPosition > pageHeight - bottomMargin) {
    doc.addPage();
    yPosition = 20;
  }
  
  doc.setFontSize(9);
  doc.setTextColor(100);
  doc.text(REPORT_NOTE_ENGLISH, 14, yPosition);
  doc.text(REPORT_NOTE_HINDI, 14, yPosition + 6);
  doc.text(REPORT_FOOTER, 14, yPosition + 14);
  
  return yPosition + 20;
};

export const exportToExcel = (
  data: any[][],
  headers: string[],
  fileName: string,
  sheetName: string = 'Sheet1',
  title?: string
) => {
  const wb = XLSX.utils.book_new();
  
  // Create worksheet data with title and headers
  const wsData: any[][] = [];
  
  if (title) {
    wsData.push([title]);
    wsData.push([REPORT_FOOTER]);
    wsData.push([]); // Empty row
  }
  
  wsData.push(headers);
  data.forEach(row => wsData.push(row));
  
  // Add notes at the end
  wsData.push([]);
  wsData.push([REPORT_NOTE_ENGLISH]);
  wsData.push([REPORT_NOTE_HINDI]);
  
  const ws = XLSX.utils.aoa_to_sheet(wsData);
  
  // Set column widths
  const colWidths = headers.map((h, i) => {
    const maxLen = Math.max(
      h.length,
      ...data.map(row => String(row[i] || '').length)
    );
    return { wch: Math.min(maxLen + 2, 30) };
  });
  ws['!cols'] = colWidths;
  
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, `${fileName}.xlsx`);
};

export const createPDFWithNotes = (
  doc: jsPDF,
  tableData: any[][],
  headers: string[],
  startY: number = 50
) => {
  autoTable(doc, {
    head: [headers],
    body: tableData,
    startY,
    styles: { fontSize: 8 },
  });
  
  const finalY = (doc as any).lastAutoTable.finalY + 15;
  addReportNotes(doc, finalY);
  
  return doc;
};
