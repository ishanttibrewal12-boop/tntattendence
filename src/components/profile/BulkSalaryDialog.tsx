import { useEffect, useRef, useState } from 'react';
import { Download, Upload, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileFriendlyDialog } from '@/components/ui/MobileDialog';
import { DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import {
  fetchAllActiveStaff, buildBulkWageTemplate, parseBulkWageFile,
  diffWageRows, applyWageDiffs, saveBlob,
  type BulkWageDiff, type ParsedWageRow, type StaffWageRow,
} from '@/lib/profile/payrollDocs';

interface BulkSalaryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const fieldLabel: Record<string, string> = {
  base_salary: 'Base Salary',
  shift_rate: 'Shift Rate',
  shift_rate_28: 'Rate (28d)',
  shift_rate_30: 'Rate (30d)',
  shift_rate_31: 'Rate (31d)',
};

const BulkSalaryDialog = ({ open, onOpenChange }: BulkSalaryDialogProps) => {
  const [busy, setBusy] = useState<'idle' | 'download' | 'parse' | 'save'>('idle');
  const [staff, setStaff] = useState<StaffWageRow[]>([]);
  const [parsed, setParsed] = useState<ParsedWageRow[]>([]);
  const [diffs, setDiffs] = useState<BulkWageDiff[]>([]);
  const [missing, setMissing] = useState<ParsedWageRow[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setParsed([]); setDiffs([]); setMissing([]); setBusy('idle');
    }
  }, [open]);

  const handleDownload = async () => {
    setBusy('download');
    try {
      const list = await fetchAllActiveStaff();
      setStaff(list);
      const blob = buildBulkWageTemplate(list);
      const date = new Date().toISOString().slice(0, 10);
      saveBlob(blob, `bulk-wages-${date}.xlsx`);
      toast.success(`Template downloaded`, { description: `${list.length} active staff included.` });
    } catch (e) {
      console.error(e); toast.error('Could not generate template');
    } finally { setBusy('idle'); }
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy('parse');
    try {
      const list = staff.length ? staff : await fetchAllActiveStaff();
      if (!staff.length) setStaff(list);
      const p = await parseBulkWageFile(file);
      const { diffs: d, missing: m } = diffWageRows(p, list);
      setParsed(p); setDiffs(d); setMissing(m);
      if (d.length === 0) toast.info('No changes detected.');
      else toast.success(`${d.length} rows ready to save`);
    } catch (e) {
      console.error(e); toast.error('Could not read the file');
    } finally { setBusy('idle'); }
  };

  const handleSave = async () => {
    if (diffs.length === 0) return;
    setBusy('save');
    try {
      const { updated, failed } = await applyWageDiffs(diffs);
      if (failed === 0) toast.success(`Updated ${updated} staff wages`);
      else toast.warning(`Updated ${updated}, ${failed} failed`);
      setDiffs([]); setParsed([]); setMissing([]);
      onOpenChange(false);
    } catch (e) {
      console.error(e); toast.error('Save failed');
    } finally { setBusy('idle'); }
  };

  return (
    <MobileFriendlyDialog
      open={open}
      onOpenChange={(o) => busy === 'idle' && onOpenChange(o)}
      header={<DialogTitle>Bulk Salary Update</DialogTitle>}
      footer={
        <div className="flex gap-2 w-full">
          <Button variant="outline" className="flex-1 h-11" onClick={() => onOpenChange(false)} disabled={busy !== 'idle'}>
            Cancel
          </Button>
          <Button
            className="flex-1 h-11"
            onClick={handleSave}
            disabled={busy !== 'idle' || diffs.length === 0}
          >
            {busy === 'save' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
            Save {diffs.length > 0 ? `(${diffs.length})` : ''}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="h-12" onClick={handleDownload} disabled={busy !== 'idle'}>
            {busy === 'download' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download template
          </Button>
          <Button variant="outline" className="h-12" onClick={() => fileRef.current?.click()} disabled={busy !== 'idle'}>
            {busy === 'parse' ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
            Upload edited file
          </Button>
          <input ref={fileRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFile} />
        </div>

        <div className="text-[12px] text-muted-foreground p-3 rounded-lg bg-muted/40 border border-border leading-relaxed">
          1. Download the template (all active staff). 2. Edit wage columns in Excel. 3. Re-upload to preview changes. 4. Save.
        </div>

        {parsed.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold">Preview</span>
              <span className="text-muted-foreground">
                {diffs.length} updated · {parsed.length - diffs.length - missing.length} unchanged
                {missing.length > 0 ? ` · ${missing.length} not found` : ''}
              </span>
            </div>
            <div className="max-h-72 overflow-auto rounded-lg border border-border divide-y divide-border">
              {diffs.map((d) => (
                <div key={`${d.source}:${d.id}`} className="p-2.5 text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    <span className="font-semibold truncate">{d.name}</span>
                    <span className="text-[10px] uppercase text-muted-foreground">{d.source === 'mlt_staff' ? 'MLT' : 'Staff'}</span>
                  </div>
                  <div className="mt-1.5 ml-5 grid grid-cols-1 gap-0.5">
                    {d.changes.map((c) => (
                      <div key={c.field} className="flex items-center gap-1.5 text-[11px]">
                        <span className="text-muted-foreground w-20">{fieldLabel[c.field] || c.field}</span>
                        <span className="line-through text-muted-foreground">{c.from.toFixed(2)}</span>
                        <span>→</span>
                        <span className="font-semibold text-emerald-700">{c.to.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              {missing.map((m) => (
                <div key={`${m.source}:${m.id}`} className="p-2.5 text-xs flex items-center gap-2">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                  <span className="truncate">{m.name || m.id}</span>
                  <span className="text-[10px] text-muted-foreground">Row id not found · skipped</span>
                </div>
              ))}
              {diffs.length === 0 && missing.length === 0 && (
                <div className="p-4 text-center text-xs text-muted-foreground">No changes detected.</div>
              )}
            </div>
          </div>
        )}
      </div>
    </MobileFriendlyDialog>
  );
};

export default BulkSalaryDialog;
