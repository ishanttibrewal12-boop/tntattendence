import { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { HyperFormula } from 'hyperformula';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MobileFriendlyDialog } from '@/components/ui/MobileDialog';
import { DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { snapshotCurrentVersion } from '@/lib/file-manager/versionSnapshot';
import {
  Save, Loader2, Plus, Bold, Italic, AlignLeft, AlignCenter, AlignRight,
  Trash2, FileSpreadsheet,
} from 'lucide-react';

interface XlsxEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storagePath: string;
  fileName: string;
  onSaved?: () => void;
}

interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  align?: 'left' | 'center' | 'right';
  bg?: string;
  color?: string;
}

const colLetter = (n: number) => {
  let s = '';
  n = n + 1;
  while (n > 0) {
    const m = (n - 1) % 26;
    s = String.fromCharCode(65 + m) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
};

const DEFAULT_ROWS = 30;
const DEFAULT_COLS = 12;

interface SheetData {
  name: string;
  cells: Record<string, string>; // raw input (formula or value)
  styles: Record<string, CellStyle>;
  rows: number;
  cols: number;
}

export function XlsxEditor({ open, onOpenChange, storagePath, fileName, onSaved }: XlsxEditorProps) {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [sheets, setSheets] = useState<SheetData[]>([]);
  const [activeSheet, setActiveSheet] = useState(0);
  const [selected, setSelected] = useState<{ r: number; c: number } | null>(null);
  const [formulaInput, setFormulaInput] = useState('');
  const hfRef = useRef<HyperFormula | null>(null);

  const sheet = sheets[activeSheet];

  // Build HyperFormula instance for evaluation
  const rebuildHF = useCallback((sheetsData: SheetData[]) => {
    if (hfRef.current) {
      hfRef.current.destroy();
      hfRef.current = null;
    }
    const sheetsObj: Record<string, (string | number | null)[][]> = {};
    sheetsData.forEach((s) => {
      const grid: (string | number | null)[][] = [];
      for (let r = 0; r < s.rows; r++) {
        const row: (string | number | null)[] = [];
        for (let c = 0; c < s.cols; c++) {
          const key = `${r},${c}`;
          const raw = s.cells[key];
          if (raw === undefined || raw === '') {
            row.push(null);
          } else if (raw.startsWith('=')) {
            row.push(raw);
          } else if (!isNaN(Number(raw)) && raw.trim() !== '') {
            row.push(Number(raw));
          } else {
            row.push(raw);
          }
        }
        grid.push(row);
      }
      sheetsObj[s.name] = grid;
    });
    try {
      hfRef.current = HyperFormula.buildFromSheets(sheetsObj, { licenseKey: 'gpl-v3' });
    } catch (err) {
      console.error('HF build error', err);
    }
  }, []);

  const loadDocument = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.storage.from('files').download(storagePath);
      if (error) throw error;
      const arrayBuffer = await data.arrayBuffer();
      const wb = XLSX.read(arrayBuffer, { type: 'array', cellFormula: true, cellStyles: true });

      const newSheets: SheetData[] = wb.SheetNames.map((name) => {
        const ws = wb.Sheets[name];
        const ref = ws['!ref'] || 'A1';
        const range = XLSX.utils.decode_range(ref);
        const rows = Math.max(range.e.r + 1, DEFAULT_ROWS);
        const cols = Math.max(range.e.c + 1, DEFAULT_COLS);
        const cells: Record<string, string> = {};
        const styles: Record<string, CellStyle> = {};
        for (let r = 0; r <= range.e.r; r++) {
          for (let c = 0; c <= range.e.c; c++) {
            const addr = XLSX.utils.encode_cell({ r, c });
            const cell = ws[addr];
            if (!cell) continue;
            const key = `${r},${c}`;
            if (cell.f) cells[key] = '=' + cell.f;
            else if (cell.v !== undefined && cell.v !== null) cells[key] = String(cell.v);
            // styles (best-effort)
            const s = cell.s;
            if (s) {
              const st: CellStyle = {};
              if (s.font?.bold) st.bold = true;
              if (s.font?.italic) st.italic = true;
              if (s.alignment?.horizontal) st.align = s.alignment.horizontal as any;
              if (s.fill?.fgColor?.rgb) st.bg = '#' + s.fill.fgColor.rgb.slice(-6);
              if (Object.keys(st).length) styles[key] = st;
            }
          }
        }
        return { name, cells, styles, rows, cols };
      });
      const finalSheets = newSheets.length ? newSheets : [{
        name: 'Sheet1', cells: {}, styles: {}, rows: DEFAULT_ROWS, cols: DEFAULT_COLS,
      }];
      setSheets(finalSheets);
      setActiveSheet(0);
      rebuildHF(finalSheets);
    } catch (err) {
      console.error('XLSX load error', err);
      toast.error('Failed to load spreadsheet');
      const empty = [{ name: 'Sheet1', cells: {}, styles: {}, rows: DEFAULT_ROWS, cols: DEFAULT_COLS }];
      setSheets(empty);
      rebuildHF(empty);
    } finally {
      setLoading(false);
    }
  }, [storagePath, rebuildHF]);

  useEffect(() => {
    if (open) loadDocument();
    return () => {
      if (hfRef.current) {
        hfRef.current.destroy();
        hfRef.current = null;
      }
    };
  }, [open, loadDocument]);

  const updateCell = (r: number, c: number, value: string) => {
    setSheets((prev) => {
      const next = [...prev];
      const sh = { ...next[activeSheet], cells: { ...next[activeSheet].cells } };
      const key = `${r},${c}`;
      if (value === '') delete sh.cells[key];
      else sh.cells[key] = value;
      next[activeSheet] = sh;
      // Update HF
      if (hfRef.current) {
        const sheetId = hfRef.current.getSheetId(sh.name);
        if (sheetId !== undefined) {
          let cellValue: any = null;
          if (value === '') cellValue = null;
          else if (value.startsWith('=')) cellValue = value;
          else if (!isNaN(Number(value)) && value.trim() !== '') cellValue = Number(value);
          else cellValue = value;
          try {
            hfRef.current.setCellContents({ sheet: sheetId, row: r, col: c }, cellValue);
          } catch (err) {
            console.error('HF set error', err);
          }
        }
      }
      return next;
    });
  };

  const updateStyle = (patch: Partial<CellStyle>) => {
    if (!selected) return;
    const key = `${selected.r},${selected.c}`;
    setSheets((prev) => {
      const next = [...prev];
      const sh = { ...next[activeSheet], styles: { ...next[activeSheet].styles } };
      sh.styles[key] = { ...(sh.styles[key] || {}), ...patch };
      next[activeSheet] = sh;
      return next;
    });
  };

  const getDisplayValue = (r: number, c: number): string => {
    if (!sheet) return '';
    const key = `${r},${c}`;
    const raw = sheet.cells[key];
    if (raw === undefined || raw === '') return '';
    if (raw.startsWith('=') && hfRef.current) {
      const sheetId = hfRef.current.getSheetId(sheet.name);
      if (sheetId !== undefined) {
        try {
          const v = hfRef.current.getCellValue({ sheet: sheetId, row: r, col: c });
          if (v === null || v === undefined) return '';
          if (typeof v === 'object' && 'type' in (v as any)) return '#ERR';
          return String(v);
        } catch {
          return '#ERR';
        }
      }
    }
    return raw;
  };

  const handleSelect = (r: number, c: number) => {
    setSelected({ r, c });
    setFormulaInput(sheet?.cells[`${r},${c}`] || '');
  };

  const commitFormula = () => {
    if (!selected) return;
    updateCell(selected.r, selected.c, formulaInput);
  };

  const addSheet = () => {
    setSheets((prev) => {
      const name = `Sheet${prev.length + 1}`;
      const next = [...prev, { name, cells: {}, styles: {}, rows: DEFAULT_ROWS, cols: DEFAULT_COLS }];
      rebuildHF(next);
      return next;
    });
    setActiveSheet(sheets.length);
  };

  const deleteSheet = (idx: number) => {
    if (sheets.length <= 1) {
      toast.error('Workbook needs at least one sheet');
      return;
    }
    setSheets((prev) => {
      const next = prev.filter((_, i) => i !== idx);
      rebuildHF(next);
      return next;
    });
    setActiveSheet(0);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Snapshot current contents before overwrite
      await snapshotCurrentVersion(storagePath, fileName);
      const wb = XLSX.utils.book_new();
      sheets.forEach((s) => {
        const ws: XLSX.WorkSheet = {};
        const range = { s: { r: 0, c: 0 }, e: { r: 0, c: 0 } };
        Object.entries(s.cells).forEach(([k, raw]) => {
          const [r, c] = k.split(',').map(Number);
          range.e.r = Math.max(range.e.r, r);
          range.e.c = Math.max(range.e.c, c);
          const addr = XLSX.utils.encode_cell({ r, c });
          let cell: any;
          if (raw.startsWith('=')) {
            // Use computed value if available
            let computed: any = raw;
            if (hfRef.current) {
              const sid = hfRef.current.getSheetId(s.name);
              if (sid !== undefined) {
                try {
                  const v = hfRef.current.getCellValue({ sheet: sid, row: r, col: c });
                  if (v !== null && v !== undefined && !(typeof v === 'object' && 'type' in v)) {
                    computed = v;
                  } else {
                    computed = '';
                  }
                } catch { computed = ''; }
              }
            }
            cell = {
              t: typeof computed === 'number' ? 'n' : 's',
              v: computed,
              f: raw.slice(1),
            };
          } else if (!isNaN(Number(raw)) && raw.trim() !== '') {
            cell = { t: 'n', v: Number(raw) };
          } else {
            cell = { t: 's', v: raw };
          }
          // Style
          const st = s.styles[k];
          if (st) {
            cell.s = {
              font: { bold: !!st.bold, italic: !!st.italic },
              alignment: { horizontal: st.align || 'left' },
              ...(st.bg ? { fill: { fgColor: { rgb: st.bg.replace('#', '') } } } : {}),
            };
          }
          ws[addr] = cell;
        });
        ws['!ref'] = XLSX.utils.encode_range(range);
        XLSX.utils.book_append_sheet(wb, ws, s.name);
      });
      const out = XLSX.write(wb, { bookType: 'xlsx', type: 'array', cellStyles: true });
      const blob = new Blob([out], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const { error } = await supabase.storage.from('files').upload(storagePath, blob, {
        upsert: true,
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      if (error) throw error;
      await supabase.from('file_metadata').update({
        size_bytes: blob.size,
        updated_at: new Date().toISOString(),
      }).eq('storage_path', storagePath);
      toast.success('Spreadsheet saved');
      onSaved?.();
    } catch (err) {
      console.error(err);
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const selectedStyle = useMemo(() => {
    if (!selected || !sheet) return undefined;
    return sheet.styles[`${selected.r},${selected.c}`];
  }, [selected, sheet]);

  const ToolbarBtn = ({ active, onClick, children, title }: any) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`h-9 w-9 inline-flex items-center justify-center rounded-md transition-colors shrink-0
        ${active ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'}`}
    >
      {children}
    </button>
  );

  return (
    <MobileFriendlyDialog
      open={open}
      onOpenChange={onOpenChange}
      header={
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-2 min-w-0">
            <FileSpreadsheet className="h-4 w-4 shrink-0 text-green-600" />
            <DialogTitle className="truncate">{fileName}</DialogTitle>
          </div>
          <Button onClick={handleSave} size="sm" disabled={saving || loading} className="shrink-0">
            {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
            Save
          </Button>
        </div>
      }
    >
      <div className="space-y-2">
        {loading || !sheet ? (
          <div className="h-[60vh] flex items-center justify-center text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading spreadsheet…
          </div>
        ) : (
          <>
            {/* Formatting toolbar */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1">
              <ToolbarBtn active={selectedStyle?.bold} onClick={() => updateStyle({ bold: !selectedStyle?.bold })} title="Bold">
                <Bold className="h-4 w-4" />
              </ToolbarBtn>
              <ToolbarBtn active={selectedStyle?.italic} onClick={() => updateStyle({ italic: !selectedStyle?.italic })} title="Italic">
                <Italic className="h-4 w-4" />
              </ToolbarBtn>
              <span className="w-px h-5 bg-border mx-1" />
              <ToolbarBtn active={selectedStyle?.align === 'left'} onClick={() => updateStyle({ align: 'left' })} title="Left">
                <AlignLeft className="h-4 w-4" />
              </ToolbarBtn>
              <ToolbarBtn active={selectedStyle?.align === 'center'} onClick={() => updateStyle({ align: 'center' })} title="Center">
                <AlignCenter className="h-4 w-4" />
              </ToolbarBtn>
              <ToolbarBtn active={selectedStyle?.align === 'right'} onClick={() => updateStyle({ align: 'right' })} title="Right">
                <AlignRight className="h-4 w-4" />
              </ToolbarBtn>
              <span className="w-px h-5 bg-border mx-1" />
              <input
                type="color"
                value={selectedStyle?.bg || '#ffffff'}
                onChange={(e) => updateStyle({ bg: e.target.value })}
                title="Cell background"
                className="h-9 w-9 rounded cursor-pointer border"
              />
            </div>

            {/* Formula bar */}
            <div className="flex items-center gap-2">
              <div className="px-2 py-1.5 bg-muted rounded text-xs font-mono shrink-0 min-w-[44px] text-center">
                {selected ? `${colLetter(selected.c)}${selected.r + 1}` : '—'}
              </div>
              <Input
                value={formulaInput}
                onChange={(e) => setFormulaInput(e.target.value)}
                onBlur={commitFormula}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    commitFormula();
                    if (selected && selected.r < sheet.rows - 1) handleSelect(selected.r + 1, selected.c);
                  }
                }}
                placeholder="Type value or =SUM(A1:A10)"
                className="h-9 font-mono text-sm"
              />
            </div>

            {/* Grid */}
            <div className="border rounded-lg overflow-auto max-h-[55vh] bg-background" style={{ overscrollBehavior: 'contain' }}>
              <table className="text-xs border-collapse">
                <thead className="sticky top-0 bg-muted z-10">
                  <tr>
                    <th className="border border-border w-10 h-7 bg-muted" />
                    {Array.from({ length: sheet.cols }).map((_, c) => (
                      <th key={c} className="border border-border min-w-[80px] h-7 px-2 text-muted-foreground font-medium">
                        {colLetter(c)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: sheet.rows }).map((_, r) => (
                    <tr key={r}>
                      <td className="border border-border bg-muted text-center text-muted-foreground sticky left-0 w-10 h-7">
                        {r + 1}
                      </td>
                      {Array.from({ length: sheet.cols }).map((_, c) => {
                        const key = `${r},${c}`;
                        const st = sheet.styles[key];
                        const isSel = selected?.r === r && selected?.c === c;
                        return (
                          <td
                            key={c}
                            onClick={() => handleSelect(r, c)}
                            className={`border border-border h-7 px-2 cursor-cell whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px]
                              ${isSel ? 'ring-2 ring-primary ring-inset' : ''}`}
                            style={{
                              fontWeight: st?.bold ? 'bold' : undefined,
                              fontStyle: st?.italic ? 'italic' : undefined,
                              textAlign: st?.align || (sheet.cells[key] && !isNaN(Number(sheet.cells[key])) ? 'right' : 'left'),
                              backgroundColor: st?.bg,
                              color: st?.color,
                            }}
                          >
                            {getDisplayValue(r, c)}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Sheet tabs */}
            <div className="flex items-center gap-1 overflow-x-auto pt-1">
              {sheets.map((s, i) => (
                <div key={i} className="flex items-center shrink-0">
                  <button
                    onClick={() => setActiveSheet(i)}
                    className={`px-3 h-8 rounded-l-md text-xs font-medium transition-colors
                      ${i === activeSheet ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                  >
                    {s.name}
                  </button>
                  {sheets.length > 1 && (
                    <button
                      onClick={() => deleteSheet(i)}
                      className={`h-8 w-7 flex items-center justify-center rounded-r-md
                        ${i === activeSheet ? 'bg-primary text-primary-foreground' : 'bg-muted hover:bg-muted/80'}`}
                      title="Delete sheet"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>
              ))}
              <Button onClick={addSheet} size="sm" variant="outline" className="h-8 shrink-0">
                <Plus className="h-3 w-3 mr-1" /> Sheet
              </Button>
            </div>
          </>
        )}
      </div>
    </MobileFriendlyDialog>
  );
}

export default XlsxEditor;
