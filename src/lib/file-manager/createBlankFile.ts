/**
 * Generates blank or templated .docx / .xlsx blobs entirely in-browser
 * so the user can create new Office files inside the ERP without any
 * external dependency. The resulting blobs are uploaded to the same
 * Supabase Storage bucket used by the rest of the File Manager and are
 * fully editable by the existing DocxEditor / XlsxEditor.
 */

import * as XLSX from 'xlsx';
import { asBlob } from 'html-docx-js-typescript';

export type DocxTemplate = 'blank' | 'invoice' | 'salary-slip';
export type XlsxTemplate = 'blank' | 'attendance-sheet' | 'salary-sheet';

export const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
export const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

const wrapHtml = (body: string) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  body{font-family:Arial,Helvetica,sans-serif;font-size:12pt;color:#111;}
  h1{font-size:20pt;margin:0 0 8pt;} h2{font-size:14pt;margin:14pt 0 6pt;}
  table{border-collapse:collapse;width:100%;margin:8pt 0;}
  th,td{border:1px solid #999;padding:6pt 8pt;text-align:left;}
  th{background:#f3f3f3;}
  .right{text-align:right;} .muted{color:#666;font-size:10pt;}
  </style></head><body>${body}</body></html>`;

const docxBodies: Record<DocxTemplate, string> = {
  blank: '<p></p>',
  invoice: `
    <h1>INVOICE</h1>
    <p class="muted">Tibrewal Group · Invoice #: ____ · Date: ____</p>
    <h2>Bill To</h2>
    <p>Customer Name<br/>Address Line 1<br/>City, State - PIN</p>
    <h2>Items</h2>
    <table>
      <thead><tr><th>#</th><th>Description</th><th class="right">Qty</th>
        <th class="right">Rate</th><th class="right">Amount</th></tr></thead>
      <tbody>
        <tr><td>1</td><td>Item description</td><td class="right">1</td>
          <td class="right">0.00</td><td class="right">0.00</td></tr>
        <tr><td>2</td><td></td><td class="right"></td>
          <td class="right"></td><td class="right"></td></tr>
      </tbody>
      <tfoot>
        <tr><th colspan="4" class="right">Total</th><th class="right">0.00</th></tr>
      </tfoot>
    </table>
    <p class="muted">Note: If you have any queries regarding this document, please contact us.</p>
  `,
  'salary-slip': `
    <h1>SALARY SLIP</h1>
    <p class="muted">Tibrewal Group · Month: ____ · Employee: ____</p>
    <h2>Earnings</h2>
    <table>
      <tr><th>Component</th><th class="right">Amount</th></tr>
      <tr><td>Base Salary</td><td class="right">0.00</td></tr>
      <tr><td>Shifts × Rate</td><td class="right">0.00</td></tr>
      <tr><td>Bonus</td><td class="right">0.00</td></tr>
      <tr><th>Gross</th><th class="right">0.00</th></tr>
    </table>
    <h2>Deductions</h2>
    <table>
      <tr><th>Component</th><th class="right">Amount</th></tr>
      <tr><td>Advances</td><td class="right">0.00</td></tr>
      <tr><th>Total Deductions</th><th class="right">0.00</th></tr>
    </table>
    <h2>Net Payable</h2>
    <p style="font-size:14pt;"><strong>Rs. 0.00</strong></p>
  `,
};

export async function generateDocxBlob(
  template: DocxTemplate = 'blank',
): Promise<Blob> {
  const body = docxBodies[template] || docxBodies.blank;
  const result = await asBlob(wrapHtml(body));
  if (result instanceof Blob) return result;
  return new Blob([result as BlobPart], { type: DOCX_MIME });
}

function buildSheet(rows: (string | number)[][]) {
  const ws = XLSX.utils.aoa_to_sheet(rows);
  return ws;
}

export function generateXlsxBlob(template: XlsxTemplate = 'blank'): Blob {
  const wb = XLSX.utils.book_new();

  if (template === 'attendance-sheet') {
    const header = ['S.No', 'Staff Name', 'Designation'];
    const days: string[] = [];
    for (let d = 1; d <= 31; d++) days.push(String(d));
    const totals = ['Present', 'Half', 'Absent', 'Total Shifts'];
    const fullHeader = [...header, ...days, ...totals];
    const rows: (string | number)[][] = [fullHeader];
    for (let i = 1; i <= 20; i++) {
      const row: (string | number)[] = [i, '', ''];
      for (let d = 0; d < 31; d++) row.push('');
      // Excel-style summary formulas (placeholder columns; users adjust)
      const startCol = XLSX.utils.encode_col(3); // D
      const endCol = XLSX.utils.encode_col(33); // AH
      const r = i + 1;
      row.push({ f: `COUNTIF(${startCol}${r}:${endCol}${r},"P")` } as any);
      row.push({ f: `COUNTIF(${startCol}${r}:${endCol}${r},"H")` } as any);
      row.push({ f: `COUNTIF(${startCol}${r}:${endCol}${r},"A")` } as any);
      row.push({ f: `${XLSX.utils.encode_col(34)}${r}+${XLSX.utils.encode_col(35)}${r}*0.5` } as any);
      rows.push(row);
    }
    const ws = buildSheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Attendance');
  } else if (template === 'salary-sheet') {
    const rows: (string | number)[][] = [
      ['S.No', 'Staff Name', 'Shifts', 'Rate', 'Gross', 'Advances', 'Net'],
    ];
    for (let i = 1; i <= 20; i++) {
      const r = i + 1;
      rows.push([
        i, '', '', '',
        { f: `C${r}*D${r}` } as any,
        '',
        { f: `E${r}-F${r}` } as any,
      ]);
    }
    rows.push([
      '', 'TOTAL',
      { f: 'SUM(C2:C21)' } as any,
      '',
      { f: 'SUM(E2:E21)' } as any,
      { f: 'SUM(F2:F21)' } as any,
      { f: 'SUM(G2:G21)' } as any,
    ]);
    const ws = buildSheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Salary');
  } else {
    const ws = buildSheet([['']]);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  }

  const arr = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([arr], { type: XLSX_MIME });
}

export interface NewFileSpec {
  kind: 'docx' | 'xlsx';
  template: DocxTemplate | XlsxTemplate;
  baseName: string; // without extension
}

export async function buildNewFile(spec: NewFileSpec): Promise<{
  blob: Blob;
  fileName: string;
  mime: string;
}> {
  const ext = spec.kind === 'docx' ? '.docx' : '.xlsx';
  const safe = (spec.baseName || 'Untitled').trim() || 'Untitled';
  const fileName = safe.toLowerCase().endsWith(ext) ? safe : `${safe}${ext}`;
  if (spec.kind === 'docx') {
    const blob = await generateDocxBlob(spec.template as DocxTemplate);
    return { blob, fileName, mime: DOCX_MIME };
  }
  const blob = generateXlsxBlob(spec.template as XlsxTemplate);
  return { blob, fileName, mime: XLSX_MIME };
}
