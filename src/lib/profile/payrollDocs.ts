/**
 * Profile-page payroll & reporting helpers — pure browser logic that
 * pulls live data from Supabase and produces .xlsx / .docx blobs.
 */

import * as XLSX from 'xlsx';
import { asBlob } from 'html-docx-js-typescript';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

export const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
export const DOCX_MIME =
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

// ----- types -----
export interface StaffWageRow {
  id: string;
  name: string;
  category: string;
  designation: string | null;
  base_salary: number;
  shift_rate: number;
  shift_rate_28: number;
  shift_rate_30: number;
  shift_rate_31: number;
  source: 'staff' | 'mlt_staff';
}

export interface BulkWageDiff {
  id: string;
  name: string;
  source: 'staff' | 'mlt_staff';
  changes: { field: string; from: number; to: number }[];
}

const WAGE_FIELDS = [
  'base_salary', 'shift_rate', 'shift_rate_28', 'shift_rate_30', 'shift_rate_31',
] as const;

// ----- file save -----
export function saveBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

// ============= Active staff fetch =============
export async function fetchAllActiveStaff(): Promise<StaffWageRow[]> {
  const [staffRes, mltRes] = await Promise.all([
    supabase.from('staff')
      .select('id,name,category,designation,base_salary,shift_rate,shift_rate_28,shift_rate_30,shift_rate_31')
      .eq('is_active', true).order('name'),
    supabase.from('mlt_staff')
      .select('id,name,category,designation,base_salary,shift_rate,shift_rate_28,shift_rate_30,shift_rate_31')
      .eq('is_active', true).order('name'),
  ]);
  const out: StaffWageRow[] = [];
  (staffRes.data || []).forEach((s: any) => out.push({
    id: s.id, name: s.name, category: s.category, designation: s.designation,
    base_salary: Number(s.base_salary || 0),
    shift_rate: Number(s.shift_rate || 0),
    shift_rate_28: Number(s.shift_rate_28 || 0),
    shift_rate_30: Number(s.shift_rate_30 || 0),
    shift_rate_31: Number(s.shift_rate_31 || 0),
    source: 'staff',
  }));
  (mltRes.data || []).forEach((s: any) => out.push({
    id: s.id, name: s.name, category: `MLT · ${s.category || ''}`, designation: s.designation,
    base_salary: Number(s.base_salary || 0),
    shift_rate: Number(s.shift_rate || 0),
    shift_rate_28: Number(s.shift_rate_28 || 0),
    shift_rate_30: Number(s.shift_rate_30 || 0),
    shift_rate_31: Number(s.shift_rate_31 || 0),
    source: 'mlt_staff',
  }));
  return out;
}

// ============= Bulk wage template =============
export function buildBulkWageTemplate(staff: StaffWageRow[]): Blob {
  const wb = XLSX.utils.book_new();
  const header = [
    'id', 'source', 'name', 'category', 'designation',
    'base_salary', 'shift_rate', 'shift_rate_28', 'shift_rate_30', 'shift_rate_31',
  ];
  const rows: (string | number)[][] = [header];
  staff.forEach((s) => rows.push([
    s.id, s.source, s.name, s.category, s.designation || '',
    s.base_salary, s.shift_rate, s.shift_rate_28, s.shift_rate_30, s.shift_rate_31,
  ]));
  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws['!cols'] = [
    { wch: 38 }, { wch: 10 }, { wch: 26 }, { wch: 16 }, { wch: 18 },
    { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
  ];
  XLSX.utils.book_append_sheet(wb, ws, 'Wages');

  // Notes sheet
  const notes = [
    ['Bulk Salary Update Template'],
    [''],
    ['• Edit ONLY the wage columns: base_salary, shift_rate, shift_rate_28/30/31.'],
    ['• Do NOT change id or source — they identify the row to update.'],
    ['• Leave a cell blank to keep the existing value.'],
    ['• Re-upload this file from the Profile page to preview & save.'],
  ];
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(notes), 'Instructions');

  const arr = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([arr], { type: XLSX_MIME });
}

export interface ParsedWageRow {
  id: string;
  source: 'staff' | 'mlt_staff';
  name: string;
  values: Partial<Record<typeof WAGE_FIELDS[number], number>>;
}

export async function parseBulkWageFile(file: File): Promise<ParsedWageRow[]> {
  const buf = await file.arrayBuffer();
  const wb = XLSX.read(buf, { type: 'array' });
  const ws = wb.Sheets['Wages'] || wb.Sheets[wb.SheetNames[0]];
  if (!ws) return [];
  const json = XLSX.utils.sheet_to_json<any>(ws, { defval: '' });
  const out: ParsedWageRow[] = [];
  for (const r of json) {
    const id = String(r.id || '').trim();
    const source = String(r.source || '').trim() as 'staff' | 'mlt_staff';
    if (!id || (source !== 'staff' && source !== 'mlt_staff')) continue;
    const values: ParsedWageRow['values'] = {};
    for (const f of WAGE_FIELDS) {
      const raw = r[f];
      if (raw === '' || raw === null || raw === undefined) continue;
      const n = Number(raw);
      if (!Number.isFinite(n)) continue;
      values[f] = n;
    }
    out.push({ id, source, name: String(r.name || ''), values });
  }
  return out;
}

export function diffWageRows(
  parsed: ParsedWageRow[],
  current: StaffWageRow[],
): { diffs: BulkWageDiff[]; missing: ParsedWageRow[] } {
  const map = new Map(current.map((s) => [`${s.source}:${s.id}`, s]));
  const diffs: BulkWageDiff[] = [];
  const missing: ParsedWageRow[] = [];
  for (const p of parsed) {
    const cur = map.get(`${p.source}:${p.id}`);
    if (!cur) { missing.push(p); continue; }
    const changes: BulkWageDiff['changes'] = [];
    for (const f of WAGE_FIELDS) {
      const next = p.values[f];
      if (next === undefined) continue;
      const prev = Number(cur[f] || 0);
      if (Number(next.toFixed(2)) !== Number(prev.toFixed(2))) {
        changes.push({ field: f, from: prev, to: next });
      }
    }
    if (changes.length) diffs.push({ id: p.id, name: p.name || cur.name, source: p.source, changes });
  }
  return { diffs, missing };
}

export async function applyWageDiffs(diffs: BulkWageDiff[]): Promise<{ updated: number; failed: number }> {
  let updated = 0, failed = 0;
  for (const d of diffs) {
    const patch: Record<string, number> = {};
    d.changes.forEach((c) => { patch[c.field] = c.to; });
    const table = d.source === 'mlt_staff' ? 'mlt_staff' : 'staff';
    const { error } = await supabase.from(table as any).update(patch).eq('id', d.id);
    if (error) failed++; else updated++;
  }
  return { updated, failed };
}

// ============= Today's salary slips =============
export async function buildTodaySalarySlips(date = new Date()): Promise<{
  xlsx: Blob; docx: Blob; dateStr: string; count: number;
}> {
  const dateStr = format(date, 'yyyy-MM-dd');
  const monthLabel = format(date, 'MMMM yyyy');
  const staff = await fetchAllActiveStaff();

  // XLSX: one sheet per staff (Excel limits sheet names to 31 chars + uniqueness)
  const wb = XLSX.utils.book_new();
  const used = new Set<string>();
  const safeSheetName = (name: string) => {
    let s = name.replace(/[\\/?*[\]:]/g, '').slice(0, 28).trim() || 'Slip';
    let candidate = s, n = 1;
    while (used.has(candidate.toLowerCase())) { candidate = `${s}_${++n}`.slice(0, 31); }
    used.add(candidate.toLowerCase());
    return candidate;
  };
  staff.forEach((s) => {
    const rows: (string | number)[][] = [
      ['Tibrewal Group · Salary Slip'],
      [`Month: ${monthLabel}`, '', `Date: ${dateStr}`],
      [],
      ['Employee', s.name],
      ['Category', s.category],
      ['Designation', s.designation || '—'],
      [],
      ['Earnings', 'Amount (Rs.)'],
      ['Base Salary', s.base_salary],
      ['Shift Rate', s.shift_rate],
      ['Shift Rate (28-day)', s.shift_rate_28],
      ['Shift Rate (30-day)', s.shift_rate_30],
      ['Shift Rate (31-day)', s.shift_rate_31],
      [],
      ['Shifts worked', ''],
      ['Gross', { f: 'B9+B15*B10' } as any],
      [],
      ['Deductions', 'Amount (Rs.)'],
      ['Advances', 0],
      ['Other', 0],
      ['Total Deductions', { f: 'B19+B20' } as any],
      [],
      ['Net Payable (Rs.)', { f: 'B16-B21' } as any],
      [],
      ['Note: If you have any queries regarding this document, please contact us.'],
    ];
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws['!cols'] = [{ wch: 24 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, safeSheetName(s.name));
  });
  if (staff.length === 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['No active staff']]), 'Empty');
  }
  const xlsxArr = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const xlsx = new Blob([xlsxArr], { type: XLSX_MIME });

  // DOCX: one slip per page
  const slipHtml = staff.map((s, i) => `
    <h1>SALARY SLIP</h1>
    <p class="muted">Tibrewal Group · ${monthLabel} · Generated ${dateStr}</p>
    <table>
      <tr><th>Employee</th><td>${escapeHtml(s.name)}</td></tr>
      <tr><th>Category</th><td>${escapeHtml(s.category)}</td></tr>
      <tr><th>Designation</th><td>${escapeHtml(s.designation || '—')}</td></tr>
    </table>
    <h2>Earnings</h2>
    <table>
      <tr><th>Component</th><th class="right">Amount (Rs.)</th></tr>
      <tr><td>Base Salary</td><td class="right">${s.base_salary.toFixed(2)}</td></tr>
      <tr><td>Shift Rate</td><td class="right">${s.shift_rate.toFixed(2)}</td></tr>
      <tr><td>Shift Rate (28/30/31)</td><td class="right">${s.shift_rate_28.toFixed(2)} / ${s.shift_rate_30.toFixed(2)} / ${s.shift_rate_31.toFixed(2)}</td></tr>
    </table>
    <h2>Deductions</h2>
    <table>
      <tr><th>Advances</th><td class="right">0.00</td></tr>
      <tr><th>Other</th><td class="right">0.00</td></tr>
    </table>
    <p style="font-size:13pt;"><strong>Net Payable: Rs. _______</strong></p>
    <p class="muted">Note: If you have any queries regarding this document, please contact us.</p>
    ${i < staff.length - 1 ? '<p style="page-break-after:always;"></p>' : ''}
  `).join('') || '<p>No active staff.</p>';

  const docxResult = await asBlob(wrapHtml(slipHtml));
  const docx = docxResult instanceof Blob ? docxResult : new Blob([docxResult as BlobPart], { type: DOCX_MIME });

  return { xlsx, docx, dateStr, count: staff.length };
}

// ============= Range reports =============
export interface RangeReportOpts {
  from: string; // yyyy-mm-dd
  to: string;
  scope: 'attendance' | 'advances' | 'payroll' | 'all';
}

export async function buildRangeReports(opts: RangeReportOpts) {
  const { from, to, scope } = opts;
  const wb = XLSX.utils.book_new();
  const sections: { title: string; html: string }[] = [];

  if (scope === 'attendance' || scope === 'all') {
    const [att, mltAtt, staff, mltStaff] = await Promise.all([
      supabase.from('attendance').select('staff_id,date,status,shift_count,notes').gte('date', from).lte('date', to),
      supabase.from('mlt_attendance').select('staff_id,date,status,shift_count,notes').gte('date', from).lte('date', to),
      supabase.from('staff').select('id,name,category'),
      supabase.from('mlt_staff').select('id,name,category'),
    ]);
    const nameMap = new Map<string, { name: string; cat: string }>();
    (staff.data || []).forEach((s: any) => nameMap.set(s.id, { name: s.name, cat: s.category }));
    (mltStaff.data || []).forEach((s: any) => nameMap.set(s.id, { name: s.name, cat: `MLT · ${s.category}` }));
    const allRows = [
      ...(att.data || []).map((r: any) => ({ ...r, source: 'staff' })),
      ...(mltAtt.data || []).map((r: any) => ({ ...r, source: 'mlt' })),
    ].sort((a, b) => (a.date < b.date ? -1 : 1));

    const xRows: (string | number)[][] = [['Date', 'Staff', 'Category', 'Status', 'Shifts', 'Notes']];
    allRows.forEach((r) => {
      const m = nameMap.get(r.staff_id) || { name: '?', cat: '' };
      xRows.push([r.date, m.name, m.cat, r.status, r.shift_count || 1, r.notes || '']);
    });
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(xRows), 'Attendance');
    sections.push({
      title: 'Attendance',
      html: tableHtml(['Date', 'Staff', 'Category', 'Status', 'Shifts', 'Notes'],
        allRows.map((r) => {
          const m = nameMap.get(r.staff_id) || { name: '?', cat: '' };
          return [r.date, m.name, m.cat, r.status, String(r.shift_count || 1), r.notes || ''];
        })),
    });
  }

  if (scope === 'advances' || scope === 'all') {
    const [adv, mltAdv, staff, mltStaff] = await Promise.all([
      supabase.from('advances').select('staff_id,date,amount,is_deducted,notes').gte('date', from).lte('date', to),
      supabase.from('mlt_advances').select('staff_id,date,amount,is_deducted,notes').gte('date', from).lte('date', to),
      supabase.from('staff').select('id,name'),
      supabase.from('mlt_staff').select('id,name'),
    ]);
    const nameMap = new Map<string, string>();
    (staff.data || []).forEach((s: any) => nameMap.set(s.id, s.name));
    (mltStaff.data || []).forEach((s: any) => nameMap.set(s.id, `MLT · ${s.name}`));
    const all = [...(adv.data || []), ...(mltAdv.data || [])].sort((a: any, b: any) => (a.date < b.date ? -1 : 1));
    const xRows: (string | number)[][] = [['Date', 'Staff', 'Amount (Rs.)', 'Deducted?', 'Notes']];
    all.forEach((r: any) => xRows.push([
      r.date, nameMap.get(r.staff_id) || '?', Number(r.amount || 0), r.is_deducted ? 'Yes' : 'Pending', r.notes || '',
    ]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(xRows), 'Advances');
    sections.push({
      title: 'Advances',
      html: tableHtml(['Date', 'Staff', 'Amount (Rs.)', 'Deducted?', 'Notes'],
        all.map((r: any) => [r.date, nameMap.get(r.staff_id) || '?',
          Number(r.amount || 0).toFixed(2), r.is_deducted ? 'Yes' : 'Pending', r.notes || ''])),
    });
  }

  if (scope === 'payroll' || scope === 'all') {
    // Payroll spans by month — pick records whose 1st-of-month falls inside range.
    const fromD = new Date(from), toD = new Date(to);
    const months = monthsBetween(fromD, toD);
    const orFilter = months.map((m) => `and(year.eq.${m.y},month.eq.${m.m})`).join(',');
    const { data } = await supabase.from('salary_records').select('*').or(orFilter).order('year').order('month');
    const allStaff = await fetchAllActiveStaff();
    const nameMap = new Map(allStaff.map((s) => [s.id, s.name]));
    const xRows: (string | number)[][] = [['Year', 'Month', 'Staff', 'Shifts', 'Rate', 'Gross', 'Advances', 'Paid', 'Pending', 'Status']];
    (data || []).forEach((r: any) => xRows.push([
      r.year, r.month, nameMap.get(r.staff_id) || '?',
      Number(r.total_shifts || 0), Number(r.shift_rate || 0),
      Number(r.gross_salary || 0), Number(r.total_advances || 0),
      Number(r.total_paid || 0), Number(r.pending_amount || 0),
      r.is_paid ? 'Paid' : 'Unpaid',
    ]));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(xRows), 'Payroll');
    sections.push({
      title: 'Payroll',
      html: tableHtml(['Year', 'Month', 'Staff', 'Shifts', 'Rate', 'Gross', 'Advances', 'Paid', 'Pending', 'Status'],
        (data || []).map((r: any) => [
          String(r.year), String(r.month), nameMap.get(r.staff_id) || '?',
          Number(r.total_shifts || 0).toFixed(1), Number(r.shift_rate || 0).toFixed(2),
          Number(r.gross_salary || 0).toFixed(2), Number(r.total_advances || 0).toFixed(2),
          Number(r.total_paid || 0).toFixed(2), Number(r.pending_amount || 0).toFixed(2),
          r.is_paid ? 'Paid' : 'Unpaid',
        ])),
    });
  }

  if (wb.SheetNames.length === 0) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet([['No data']]), 'Empty');
  }

  const arr = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const xlsx = new Blob([arr], { type: XLSX_MIME });

  const docxHtml = `
    <h1>Tibrewal Group · ${capitalize(scope)} Report</h1>
    <p class="muted">Range: ${from} → ${to}</p>
    ${sections.map((s) => `<h2>${s.title}</h2>${s.html}`).join('')}
    <p class="muted">Note: If you have any queries regarding this document, please contact us.</p>
  `;
  const docxResult = await asBlob(wrapHtml(docxHtml));
  const docx = docxResult instanceof Blob ? docxResult : new Blob([docxResult as BlobPart], { type: DOCX_MIME });

  return { xlsx, docx };
}

// ----- helpers -----
function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string
  ));
}
function tableHtml(head: string[], rows: string[][]) {
  if (rows.length === 0) return '<p class="muted">No records.</p>';
  return `<table><thead><tr>${head.map((h) => `<th>${escapeHtml(h)}</th>`).join('')}</tr></thead>
    <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(String(c))}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function wrapHtml(body: string) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>
    body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;color:#111;}
    h1{font-size:18pt;margin:0 0 6pt;} h2{font-size:13pt;margin:12pt 0 6pt;}
    table{border-collapse:collapse;width:100%;margin:6pt 0;}
    th,td{border:1px solid #999;padding:4pt 6pt;text-align:left;font-size:10pt;}
    th{background:#f3f3f3;} .right{text-align:right;} .muted{color:#666;font-size:9pt;}
  </style></head><body>${body}</body></html>`;
}
function monthsBetween(a: Date, b: Date) {
  const out: { y: number; m: number }[] = [];
  const cur = new Date(a.getFullYear(), a.getMonth(), 1);
  const end = new Date(b.getFullYear(), b.getMonth(), 1);
  while (cur <= end) {
    out.push({ y: cur.getFullYear(), m: cur.getMonth() + 1 });
    cur.setMonth(cur.getMonth() + 1);
  }
  return out;
}
function capitalize(s: string) { return s.charAt(0).toUpperCase() + s.slice(1); }
