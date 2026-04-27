import { useState } from 'react';
import {
  Download, Upload, Loader2, CheckCircle2, AlertCircle, MinusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MobileFriendlyDialog } from '@/components/ui/MobileDialog';
import { DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  buildBulkSalaryTemplate,
  parseBulkSalaryFile,
  applyBulkSalaryUpdates,
  saveBlob,
  type BulkRowDiff,
} from '@/lib/profile/payrollDocs';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const BulkSalaryDialog = ({ open, onOpenChange }: Props) => {
  const [downloading, setDownloading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [diffs, setDiffs] = useState<BulkRowDiff[] | null>(null);

  const reset = () => setDiffs(null);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const blob = await buildBulkSalaryTemplate();
      saveBlob(blob, `bulk-salary-${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Template downloaded — edit and re-upload');
    } catch (e) {
      console.error(e); toast.error('Could not generate template');
    } finally { setDownloading(false); }
  };

  const handleFile = async (file: File) => {
    setParsing(true);
    try {
      const result = await parseBulkSalaryFile(file);
      setDiffs(result);
      const updated = result.filter((r) => r.status === 'updated').length;
      const errors = result.filter((r) => r.status === 'error').length;
      toast.success(`Preview ready · ${updated} change(s)${errors ? `, ${errors} error(s)` : ''}`);
    } catch (e) {
      console.error(e); toast.error('Could not read file');
    } finally { setParsing(false); }
  };

  const handleApply = async () => {
    if (!diffs) return;
    setSaving(true);
    try {
      const { ok, failed } = await applyBulkSalaryUpdates(diffs);
      setDiffs([...diffs]);
      if (failed) toast.warning(`Saved ${ok}, ${failed} failed`);
      else toast.success(`Saved ${ok} update(s)`);
    } finally { setSaving(false); }
  };

  const updatedCount = diffs?.filter((d) => d.status === 'updated').length || 0;
  const unchangedCount = diffs?.filter((d) => d.status === 'unchanged').length || 0;
  const errorCount = diffs?.filter((d) => d.status === 'error').length || 0;

  return (
    <MobileFriendlyDialog
      open={open}
      onOpenChange={(o) => { if (!saving) { onOpenChange(o); if (!o) reset(); } }}
      header={<DialogTitle>Bulk Salary Update</DialogTitle>}
      maxWidthClass="max-w-2xl"
      footer={
        diffs ? (
          <div className="flex gap-2 w-full">
            <Button variant="outline" className="flex-1 h-11" onClick={reset} disabled={saving}>
              Start over
            </Button>
            <Button
              className="flex-1 h-11"
              onClick={handleApply}
              disabled={saving || updatedCount === 0}
            >
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {saving ? 'Saving…' : `Save ${updatedCount} change(s)`}
            </Button>
          </div>
        ) : null
      }
    >
      {!diffs ? (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Edit wages for 200+ workers in one round-trip: download the current data,
            change the numbers in Excel, then re-upload to preview and save.
          </p>

          <div className="grid gap-2">
            <Button
              variant="outline"
              className="h-auto py-3 justify-start gap-3"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading
                ? <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                : <Download className="h-5 w-5 text-emerald-600" />}
              <div className="text-left">
                <p className="text-sm font-semibold">1. Download current wages</p>
                <p className="text-[11px] text-muted-foreground">All active staff (regular + MLT)</p>
              </div>
            </Button>

            <label className="cursor-pointer">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                className="hidden"
                disabled={parsing}
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  e.target.value = '';
                  if (f) handleFile(f);
                }}
              />
              <div className="h-auto py-3 px-3 rounded-md border border-input flex items-center gap-3 hover:bg-muted/50 transition-colors">
                {parsing
                  ? <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                  : <Upload className="h-5 w-5 text-blue-600" />}
                <div className="text-left">
                  <p className="text-sm font-semibold">2. Re-upload edited file</p>
                  <p className="text-[11px] text-muted-foreground">.xlsx, .xls or .csv</p>
                </div>
              </div>
            </label>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-600" />
              {updatedCount} updated
            </Badge>
            <Badge variant="secondary" className="gap-1">
              <MinusCircle className="h-3 w-3 text-muted-foreground" />
              {unchangedCount} unchanged
            </Badge>
            {errorCount > 0 && (
              <Badge variant="destructive" className="gap-1">
                <AlertCircle className="h-3 w-3" />
                {errorCount} error
              </Badge>
            )}
          </div>
          <ScrollArea className="h-[55vh] sm:h-[420px] border rounded-md">
            <ul className="divide-y">
              {diffs.map((d, i) => (
                <li key={`${d.staff_id}-${i}`} className="p-3 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {d.status === 'updated' && <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />}
                      {d.status === 'unchanged' && <MinusCircle className="h-4 w-4 text-muted-foreground shrink-0" />}
                      {d.status === 'error' && <AlertCircle className="h-4 w-4 text-destructive shrink-0" />}
                      <span className="font-semibold truncate">{d.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{d.source}</Badge>
                  </div>
                  {d.message && <p className="text-destructive mt-1">{d.message}</p>}
                  {d.changes.length > 0 && (
                    <ul className="mt-1 space-y-0.5 text-muted-foreground">
                      {d.changes.map((c) => (
                        <li key={c.field} className="font-mono">
                          <span className="text-foreground">{c.field}:</span>{' '}
                          {c.from} → <span className="text-emerald-600 font-semibold">{c.to}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          </ScrollArea>
        </div>
      )}
    </MobileFriendlyDialog>
  );
};

export default BulkSalaryDialog;
