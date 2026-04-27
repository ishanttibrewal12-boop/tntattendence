import { useState } from 'react';
import { Loader2, FileSpreadsheet, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MobileFriendlyDialog } from '@/components/ui/MobileDialog';
import { DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { buildRangeReports, saveBlob } from '@/lib/profile/payrollDocs';

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

const today = () => new Date().toISOString().slice(0, 10);
const monthStart = () => {
  const d = new Date(); d.setDate(1);
  return d.toISOString().slice(0, 10);
};

const ReportRangeDialog = ({ open, onOpenChange }: Props) => {
  const [from, setFrom] = useState(monthStart());
  const [to, setTo] = useState(today());
  const [busy, setBusy] = useState(false);

  const handleGenerate = async () => {
    if (!from || !to) { toast.error('Pick both dates'); return; }
    if (from > to) { toast.error('"From" date must be before "To" date'); return; }
    setBusy(true);
    try {
      const { xlsx, docx, rangeLabel } = await buildRangeReports({ from, to });
      const stamp = `${from}_to_${to}`;
      saveBlob(xlsx, `report-${stamp}.xlsx`);
      saveBlob(docx, `report-${stamp}.docx`);
      toast.success(`Report generated · ${rangeLabel}`);
      onOpenChange(false);
    } catch (e) {
      console.error(e); toast.error('Could not generate report');
    } finally { setBusy(false); }
  };

  return (
    <MobileFriendlyDialog
      open={open}
      onOpenChange={(o) => !busy && onOpenChange(o)}
      header={<DialogTitle>Range Report — Word & Excel</DialogTitle>}
      footer={
        <Button className="w-full h-11" onClick={handleGenerate} disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          {busy ? 'Generating…' : 'Generate & Download'}
        </Button>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Pick a custom date range. Two files will be generated covering attendance,
          advances and payroll across all departments.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">From</Label>
            <Input type="date" className="h-11 mt-1" value={from} onChange={(e) => setFrom(e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" className="h-11 mt-1" value={to} onChange={(e) => setTo(e.target.value)} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5"><FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />.xlsx (4 sheets)</div>
          <div className="flex items-center gap-1.5"><FileText className="h-3.5 w-3.5 text-blue-600" />.docx (full report)</div>
        </div>
      </div>
    </MobileFriendlyDialog>
  );
};

export default ReportRangeDialog;
