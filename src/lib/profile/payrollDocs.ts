/**
 * Payroll & report document builders used by the Profile page.
 *
 * - buildTodaySalarySlips(): one .xlsx (one slip per sheet) + one .docx
 *   containing all slips for every active staff member (regular + MLT).
 * - buildBulkSalaryTemplate(): downloads an .xlsx of all active staff
 *   wages so Abhay can edit and re-upload it.
 * - parseBulkSalaryFile(): reads the re-uploaded sheet and returns
 *   per-row diffs/errors without writing anything.
 * - applyBulkSalaryUpdates(): persists confirmed updates.
 * - buildRangeReports(): generates Word + Excel reports for a
 *   custom from→to date range covering attendance, advances and payroll.
 */

import * as XLSX from 'xlsx';
import { asBlob } from 'html-docx-js-typescript';
import { format, eachDayOfInterval, parseISO } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import {
  DOCX_MIME,
  XLSX_MIME,
} from '@/lib/file-manager/createBlankFile';

// ---------- shared helpers ----------

export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

const wrapHtml = (body: string) =>
  `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
  body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;color:#111;}
  h1{font-size:18pt;margin:0 0 6pt;} h2{font-size:13pt;margin:12pt 0 4pt;}
  h3{font-size:11pt;margin:10pt 0 4pt;}
  table{border-collapse:collapse;width:100%;margin:6pt 0;}
  th,td{border:1px solid #999;padding:5pt 7pt;text-align:left;font-size:10pt;}
  th{background:#f3f3f3;}
  .right{text-align:right;} .muted{color:#666;font-size:9pt;}
  .slip{page-break-after:always;margin-bottom:18pt;}
  </style></head><body>${body}</body></html>`;

async function htmlToDocx(html: string): Promise<Blob> {
  const result = await asBlob(html);
  if (result instanceof Blob) return result;
  return new Blob([result as BlobPart], { type: DOCX_MIME });
}

// ---------- staff fetchers ----------

interface StaffRow {
  id: string;
  name: string;
  designation: string | null;
  category: string;
  base_salary: number;
  shift_rate: number;
  shift_rate_28: number;
  shift_rate_30: number;
  shift_rate_31: number;
  source: 'staff' | 'mlt_staff';
}

async function fetchAllActiveStaff(): Promise<StaffRow[]> {
  const [{ data: s = [] }, { data: m = [] }] = await Promise.all([
    supabase
      .from('staff')
      .select('id,name,designation,category,base_salary,shift_rate,shift_rate_28,shift_rate_30,shift_rate_31')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('mlt_staff')
      .select('id,name,designation,category,base_salary,shift_rate,shift_rate_28,shift_rate_30,shift_rate_31')
      .eq('is_active', true)
      .order('name'),
  ]);
  const out: StaffRow[] = [];
  (s || []).forEach((r: any) => out.push({
    id: r.id, name: r.name, designation: r.designation, category: r.category || '',
    base_salary: Number(r.base_salary || 0),
    shift_rate: Number(r.shift_rate || 0),
    shift_rate_28: Number(r.shift_rate_28 || 0),
    shift_rate_30: Number(r.shift_rate_30 || 0),
    shift_rate_31: Number(r.shift_rate_31 || 0),
    source: 'staff',
  }));
  (m || []).forEach((r: any) => out.push({
    id: r.id, name: r.name, designation: r.designation, category: `MLT · ${r.category || ''}`,
    base_salary: Number(r.base_salary || 0),
    shift_rate: Number(r.shift_rate || 0),
    shift_rate_28: Number(r.shift_rate_28 || 0),
    shift_rate_30: Number(r.shift_rate_30 || 0),
    shift_rate_31: Number(r.shift_rate_31 || 0),
    source: 'mlt_staff',
  }));
  return out;
}

// ---------- 1. Today's salary slips ----------

export async function buildTodaySalarySlips() {
  const staff = await fetchAllActiveStaff();
  const today = new Date();
  const dateStr = format(today, 'yyyy-MM-dd');
  const monthLabel = format(today, 'MMMM yyyy');

  // ---- Excel: one workbook, one sheet per staff ----
  const wb = XLSX.utils.book_new();
  const usedSheetNames = new Set<string>();
  const safeSheet = (name: string) => {
    let base = name.replace(/[\\\/\?\*\[\]:]/g, ' ').slice(0, 28).trim() || 'Slip';
    let n = base, i = 2;
    while (usedSheetNames.has(n)) { n = `${base.slice(0, 26)} ${i++}`; }
    usedSheetNames.add(n);
    return n;
  };

  staff.forEach((st, idx) => {
    const rows: (string | number)[][] = [
      ['Tibrewal Group · Salary Slip'],
      [`Date: ${dateStr}`, `Month: ${monthLabel}`],
      [],
      ['Employee', st.name],
      ['Designation', st.designation || '-'],
      ['Category', st.category],
      [],
      ['Component', 'Amount (Rs.)'],
      ['Base Salary', st.base_salary],
      ['Shift Rate (default)', st.shift_rate],
      ['Shift Rate (28-day month)', st.shift_rate_28],
      ['Shift Rate (30-day month)', st.shift_rate_30],
      ['Shift Rate (31-day month)', st.shift_rate_31],
      [],
      ['Shifts worked', ''],
      ['Bonus', ''],
      ['Advances deducted', ''],
      ['Net Payable', ''],
      [],
      ['Signature', ''],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 28 }, { wch: 22 }];
    XLSX.utils.book_append_sheet(wb, ws, safeSheet(`${idx + 1}-${st.name}`));
  });

  if (staff.length === 0) {
    const ws = XLSX.utils.aoa_to_sheet([['No active staff found']]);
    XLSX.utils.book_append_sheet(wb, ws, 'Empty');
  }

  const xlsxArr = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const xlsx = new Blob([xlsxArr], { type: XLSX_MIME });

  // ---- Word: one document, every slip on its own page ----
  const slipsHtml = staff.map((st) => `
    <div class="slip">
      <h1>SALARY SLIP</h1>
      <p class="muted">Tibrewal Group · ${dateStr} · ${monthLabel}</p>
      <table>
        <tr><th>Employee</th><td>${st.name}</td>
            <th>Designation</th><td>${st.designation || '-'}</td></tr>
        <tr><th>Category</th><td colspan="3">${st.category}</td></tr>
      </table>
      <h3>Earnings</h3>
      <table>
        <tr><th>Component</th><th class="right">Amount (Rs.)</th></tr>
        <tr><td>Base Salary</td><td class="right">${st.base_salary.toFixed(2)}</td></tr>
        <tr><td>Shift Rate (default)</td><td class="right">${st.shift_rate.toFixed(2)}</td></tr>
        <tr><td>Shifts × Rate</td><td class="right">_______</td></tr>
        <tr><td>Bonus</td><td class="right">_______</td></tr>
        <tr><th>Gross</th><th class="right">_______</th></tr>
      </table>
      <h3>Deductions</h3>
      <table>
        <tr><th>Component</th><th class="right">Amount (Rs.)</th></tr>
        <tr><td>Advances</td><td class="right">_______</td></tr>
        <tr><th>Total Deductions</th><th class="right">_______</th></tr>
      </table>
      <h3>Net Payable</h3>
      <p style="font-size:13pt;"><strong>Rs. _______</strong></p>
      <p class="muted">Signature: _________________________</p>
    </div>
  `).join('');

  const docx = await htmlToDocx(wrapHtml(
    slipsHtml || '<p>No active staff found.</p>',
  ));

  return { xlsx, docx, dateStr, count: staff.length };
}

// ---------- 2. Bulk salary update ----------

const BULK_HEADERS = [
  'staff_id', 'source', 'name', 'category', 'designation',
  'base_salary', 'shift_rate', 'shift_rate_28', 'shift_rate_30', 'shift_rate_31',
] as const;

export async function buildBulkSalaryTemplate(): Promise<Blob> {
  const staff = await fetchAllActiveStaff();
  const rows: (string | number)[][] = [
    [...BULK_HEADERS],
    ...staff.map((s) => [
      s.id, s.source, s.name, s.category, s.designation || '',
      s.base_salary, s.shift_rate, s.shift_rate_28, s.shift_rate_30, s.shift_rate_31,
    ]),
  ];
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 38 }, { wch: 10 }, { wch: 24 }, { wch: 18 }, { wch: 18 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Wages');
  // Add a help sheet
  const help = XLSX.utils.aoa_to_sheet([
    ['Bulk Salary Update — Instructions'],
    [],
    ['1. Edit only the numeric columns: base_salary, shift_rate, shift_rate_28/30/31.'],
    ['2. Do NOT change staff_id or source — those identify the row.'],
    ['3. Leave a row unchanged to skip it. Empty numeric cells are treated as 0.'],
    ['4. Re-upload this file from the Profile page → Bulk Salary Update.'],
    ['5. You will see a preview of every change before anything is saved.'],
  ]);
  XLSX.utils.book_append_sheet(wb, help, 'Read me');
  const arr = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([arr], { type: XLSX_MIME });
}

export interface BulkRowDiff {
  staff_id: string;
  source: 'staff' | 'mlt_staff';
  name: string;
  status: 'updated' | 'unchanged' | 'error';
  message?: string;
  changes: { field: string; from: number; to: number }[];
  newValues?: {
    base_salary: number;
    shift_rate: number;
    shift_rate_28: number;
    shift_rate_30: number;
    shift_rate_31: number;
  };
}

const NUM_FIELDS: (keyof StaffRow)[] = [
  'base_salary', 'shift_rate', 'shift_rate_28', 'shift_rate_30', 'shift_rate_31',
];

export async function parseBulkSalaryFile(file: File): Promise<BulkRowDiff[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const sheetName = wb.SheetNames.find((n) => n.toLowerCase().includes('wage')) || wb.SheetNames[0];
  const ws = wb.Sheets[sheetName];
  const json = XLSX.utils.sheet_to_json<Record<string, any>>(ws, { defval: '' });

  const current = await fetchAllActiveStaff();
  const byId = new Map(current.map((s) => [s.id, s]));
  const diffs: BulkRowDiff[] = [];

  for (const row of json) {
    const id = String(row.staff_id || '').trim();
    const source = String(row.source || '').trim() as 'staff' | 'mlt_staff';
    if (!id) continue;
    const existing = byId.get(id);
    if (!existing) {
      diffs.push({
        staff_id: id, source, name: String(row.name || id),
        status: 'error', changes: [],
        message: 'Staff ID not found in active staff list',
      });
      continue;
    }
    if (existing.source !== source) {
      diffs.push({
        staff_id: id, source: existing.source, name: existing.name,
        status: 'error', changes: [],
        message: `Source mismatch (file: ${source}, db: ${existing.source})`,
      });
      continue;
    }
    const newValues = {
      base_salary: Number(row.base_salary) || 0,
      shift_rate: Number(row.shift_rate) || 0,
      shift_rate_28: Number(row.shift_rate_28) || 0,
      shift_rate_30: Number(row.shift_rate_30) || 0,
      shift_rate_31: Number(row.shift_rate_31) || 0,
    };
    const changes: BulkRowDiff['changes'] = [];
    NUM_FIELDS.forEach((f) => {
      const from = Number(existing[f] || 0);
      const to = Number((newValues as any)[f] || 0);
      if (Math.abs(from - to) > 0.001) changes.push({ field: f as string, from, to });
    });
    diffs.push({
      staff_id: id, source: existing.source, name: existing.name,
      status: changes.length ? 'updated' : 'unchanged',
      changes, newValues,
    });
  }
  return diffs;
}

export async function applyBulkSalaryUpdates(diffs: BulkRowDiff[]) {
  const toSave = diffs.filter((d) => d.status === 'updated' && d.newValues);
  let ok = 0, failed = 0;
  for (const d of toSave) {
    const table = d.source === 'mlt_staff' ? 'mlt_staff' : 'staff';
    const { error } = await supabase
      .from(table)
      .update(d.newValues!)
      .eq('id', d.staff_id);
    if (error) { failed++; d.status = 'error'; d.message = error.message; }
    else ok++;
  }
  return { ok, failed, total: toSave.length };
}

// ---------- 3. Range reports (attendance / advances / payroll) ----------

export interface RangeReportInput {
  from: string; // yyyy-mm-dd
  to: string;   // yyyy-mm-dd
}

interface RangeData {
  attendance: any[];
  mltAttendance: any[];
  advances: any[];
  mltAdvances: any[];
  salary: any[];
  staffMap: Map<string, string>;
}

async function fetchRange(input: RangeReportInput): Promise<RangeData> {
  const [att, mAtt, adv, mAdv, sal, staff, mStaff] = await Promise.all([
    supabase.from('attendance').select('*').gte('date', input.from).lte('date', input.to),
    supabase.from('mlt_attendance').select('*').gte('date', input.from).lte('date', input.to),
    supabase.from('advances').select('*').gte('date', input.from).lte('date', input.to),
    supabase.from('mlt_advances').select('*').gte('date', input.from).lte('date', input.to),
    supabase.from('salary_records').select('*'),
    supabase.from('staff').select('id,name'),
    supabase.from('mlt_staff').select('id,name'),
  ]);
  const map = new Map<string, string>();
  (staff.data || []).forEach((s: any) => map.set(s.id, s.name));
  (mStaff.data || []).forEach((s: any) => map.set(s.id, `${s.name} (MLT)`));
  return {
    attendance: att.data || [],
    mltAttendance: mAtt.data || [],
    advances: adv.data || [],
    mltAdvances: mAdv.data || [],
    salary: sal.data || [],
    staffMap: map,
  };
}

export async function buildRangeReports(input: RangeReportInput) {
  const data = await fetchRange(input);
  const days = eachDayOfInterval({ start: parseISO(input.from), end: parseISO(input.to) });
  const rangeLabel = `${input.from} → ${input.to}`;

  // ---- Excel ----
  const wb = XLSX.utils.book_new();

  const attRows: (string | number)[][] = [
    ['Date', 'Staff', 'Status', 'Shifts', 'Notes'],
    ...[...data.attendance, ...data.mltAttendance]
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .map((r) => [r.date, data.staffMap.get(r.staff_id) || r.staff_id, r.status, r.shift_count || 1, r.notes || '']),
  ];
  const wsAtt = XLSX.utils.aoa_to_sheet(attRows);
  wsAtt['!cols'] = [{ wch: 12 }, { wch: 28 }, { wch: 10 }, { wch: 8 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsAtt, 'Attendance');

  const advRows: (string | number)[][] = [
    ['Date', 'Staff', 'Amount (Rs.)', 'Deducted', 'Notes'],
    ...[...data.advances, ...data.mltAdvances]
      .sort((a, b) => (a.date > b.date ? 1 : -1))
      .map((r) => [r.date, data.staffMap.get(r.staff_id) || r.staff_id, Number(r.amount || 0), r.is_deducted ? 'Yes' : 'No', r.notes || '']),
  ];
  const wsAdv = XLSX.utils.aoa_to_sheet(advRows);
  wsAdv['!cols'] = [{ wch: 12 }, { wch: 28 }, { wch: 14 }, { wch: 10 }, { wch: 24 }];
  XLSX.utils.book_append_sheet(wb, wsAdv, 'Advances');

  const fromMonth = parseISO(input.from).getMonth() + 1;
  const fromYear = parseISO(input.from).getFullYear();
  const toMonth = parseISO(input.to).getMonth() + 1;
  const toYear = parseISO(input.to).getFullYear();
  const payRows: (string | number)[][] = [
    ['Month', 'Year', 'Staff', 'Shifts', 'Gross', 'Advances', 'Paid', 'Pending'],
    ...data.salary
      .filter((r: any) => {
        const k = r.year * 12 + r.month;
        return k >= fromYear * 12 + fromMonth && k <= toYear * 12 + toMonth;
      })
      .map((r: any) => [
        r.month, r.year, data.staffMap.get(r.staff_id) || r.staff_id,
        Number(r.total_shifts || 0), Number(r.gross_salary || 0),
        Number(r.total_advances || 0), Number(r.total_paid || 0), Number(r.pending_amount || 0),
      ]),
  ];
  const wsPay = XLSX.utils.aoa_to_sheet(payRows);
  wsPay['!cols'] = [{ wch: 8 }, { wch: 8 }, { wch: 28 }, { wch: 8 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }];
  XLSX.utils.book_append_sheet(wb, wsPay, 'Payroll');

  const summary = XLSX.utils.aoa_to_sheet([
    ['Tibrewal Group · Range Report'],
    ['Range', rangeLabel],
    ['Days', days.length],
    [],
    ['Attendance entries', attRows.length - 1],
    ['Advance entries', advRows.length - 1],
    ['Payroll rows in range', payRows.length - 1],
  ]);
  XLSX.utils.book_append_sheet(wb, summary, 'Summary', true);

  const xlsxArr = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const xlsx = new Blob([xlsxArr], { type: XLSX_MIME });

  // ---- Word ----
  const html = wrapHtml(`
    <h1>Range Report</h1>
    <p class="muted">Tibrewal Group · ${rangeLabel} · ${days.length} day(s)</p>

    <h2>Attendance (${attRows.length - 1})</h2>
    <table>${attRows.map((r, i) =>
      i === 0
        ? `<tr>${r.map((c) => `<th>${c}</th>`).join('')}</tr>`
        : `<tr>${r.map((c) => `<td>${c ?? ''}</td>`).join('')}</tr>`,
    ).join('')}</table>

    <h2>Advances (${advRows.length - 1})</h2>
    <table>${advRows.map((r, i) =>
      i === 0
        ? `<tr>${r.map((c) => `<th>${c}</th>`).join('')}</tr>`
        : `<tr>${r.map((c) => `<td>${c ?? ''}</td>`).join('')}</tr>`,
    ).join('')}</table>

    <h2>Payroll (${payRows.length - 1})</h2>
    <table>${payRows.map((r, i) =>
      i === 0
        ? `<tr>${r.map((c) => `<th>${c}</th>`).join('')}</tr>`
        : `<tr>${r.map((c) => `<td>${c ?? ''}</td>`).join('')}</tr>`,
    ).join('')}</table>

    <p class="muted">Note: If you have any queries regarding this report, please contact us.</p>
  `);
  const docx = await htmlToDocx(html);

  return { xlsx, docx, rangeLabel };
}
