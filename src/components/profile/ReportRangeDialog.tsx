import { useEffect, useState } from 'react';
import { FileSpreadsheet, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { MobileFriendlyDialog } from '@/components/ui/MobileDialog';
import { DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { buildRangeReports, saveBlob } from '@/lib/profile/payrollDocs';

interface ReportRangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type Scope = 'attendance' | 'advances' | 'payroll' | 'all';

const ReportRangeDialog = ({ open, onOpenChange }: ReportRangeDialogProps) => {
  const today = new Date().toISOString().slice(0, 10);
  const monthAgo = (() => { const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().slice(0, 10); })();
  const [from, setFrom] = useState(monthAgo);
  const [to, setTo] = useState(today);
  const [scope, setScope] = useState<Scope>('all');
  const [busy, setBusy] = useState<null | 'xlsx' | 'docx' | 'both'>(null);

  useEffect(() => {
    if (open) { setFrom(monthAgo); setTo(today); setScope('all'); setBusy(null); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const generate = async (which: 'xlsx' | 'docx' | 'both') => {
    if (from > to) { toast.error('"From" must be before "To"'); return; }
    setBusy(which);
    try {
      const { xlsx, docx } = await buildRangeReports({ from, to, scope });
      const stamp = `${scope}-${from}_to_${to}`;
      if (which === 'xlsx' || which === 'both') saveBlob(xlsx, `${stamp}.xlsx`);
      if (which === 'docx' || which === 'both') saveBlob(docx, `${stamp}.docx`);
      toast.success('Report ready');
    } catch (e) {
      console.error(e); toast.error('Could not generate report');
    } finally { setBusy(null); }
  };

  return (
    <MobileFriendlyDialog
      open={open}
      onOpenChange={(o) => !busy && onOpenChange(o)}
      header={<DialogTitle>Generate Report</DialogTitle>}
      footer={
        <div className="grid grid-cols-3 gap-2 w-full">
          <Button variant="outline" className="h-11" disabled={!!busy} onClick={() => generate('xlsx')}>
            {busy === 'xlsx' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><FileSpreadsheet className="h-4 w-4 mr-1.5" />Excel</>}
          </Button>
          <Button variant="outline" className="h-11" disabled={!!busy} onClick={() => generate('docx')}>
            {busy === 'docx' ? <Loader2 className="h-4 w-4 animate-spin" /> : <><FileText className="h-4 w-4 mr-1.5" />Word</>}
          </Button>
          <Button className="h-11" disabled={!!busy} onClick={() => generate('both')}>
            {busy === 'both' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Both'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">From</Label>
            <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-11 mt-1" />
          </div>
          <div>
            <Label className="text-xs">To</Label>
            <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-11 mt-1" />
          </div>
        </div>
        <div>
          <Label className="text-xs">Include</Label>
          <Select value={scope} onValueChange={(v) => setScope(v as Scope)}>
            <SelectTrigger className="h-11 mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Everything (attendance + advances + payroll)</SelectItem>
              <SelectItem value="attendance">Attendance only</SelectItem>
              <SelectItem value="advances">Advances only</SelectItem>
              <SelectItem value="payroll">Payroll only (monthly records in range)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Excel: one sheet per section. Word: a single document with all sections.
          Payroll uses monthly salary records that fall within the chosen range.
        </p>
      </div>
    </MobileFriendlyDialog>
  );
};

export default ReportRangeDialog;
