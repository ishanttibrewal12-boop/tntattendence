import { useState, useEffect } from 'react';
import { FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MobileFriendlyDialog } from '@/components/ui/MobileDialog';
import { DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type {
  DocxTemplate,
  XlsxTemplate,
  NewFileSpec,
} from '@/lib/file-manager/createBlankFile';

interface NewFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (spec: NewFileSpec) => Promise<void> | void;
}

type Kind = 'docx' | 'xlsx';

const DOCX_TEMPLATES: { id: DocxTemplate; title: string; desc: string }[] = [
  { id: 'blank', title: 'Blank document', desc: 'Empty Word document' },
  { id: 'invoice', title: 'Invoice', desc: 'Bill-to + items table' },
  { id: 'salary-slip', title: 'Salary slip', desc: 'Earnings & deductions' },
];

const XLSX_TEMPLATES: { id: XlsxTemplate; title: string; desc: string }[] = [
  { id: 'blank', title: 'Blank sheet', desc: 'Empty spreadsheet' },
  { id: 'attendance-sheet', title: 'Attendance sheet', desc: '31 days · auto P/H/A counts' },
  { id: 'salary-sheet', title: 'Salary sheet', desc: 'Shifts × Rate − Advances' },
];

const NewFileDialog = ({ open, onOpenChange, onCreate }: NewFileDialogProps) => {
  const [kind, setKind] = useState<Kind>('docx');
  const [template, setTemplate] = useState<DocxTemplate | XlsxTemplate>('blank');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) {
      setKind('docx');
      setTemplate('blank');
      setName('');
      setBusy(false);
    }
  }, [open]);

  const templates = kind === 'docx' ? DOCX_TEMPLATES : XLSX_TEMPLATES;

  const handleKindChange = (next: Kind) => {
    setKind(next);
    setTemplate('blank');
  };

  const handleCreate = async () => {
    setBusy(true);
    try {
      await onCreate({
        kind,
        template,
        baseName: name.trim() || (kind === 'docx' ? 'Untitled Document' : 'Untitled Sheet'),
      });
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <MobileFriendlyDialog
      open={open}
      onOpenChange={(o) => !busy && onOpenChange(o)}
      header={<DialogTitle>Create new file</DialogTitle>}
      footer={
        <Button onClick={handleCreate} disabled={busy} className="w-full h-11">
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
          {busy ? 'Creating…' : `Create ${kind === 'docx' ? 'Document' : 'Sheet'}`}
        </Button>
      }
    >
      <div className="space-y-4">
        {/* Kind toggle */}
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleKindChange('docx')}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border-2 transition-all min-h-[64px] text-left',
              kind === 'docx'
                ? 'border-blue-500 bg-blue-500/10'
                : 'border-border hover:border-blue-500/50',
            )}
          >
            <FileText className="h-6 w-6 text-blue-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">Word</p>
              <p className="text-[11px] text-muted-foreground truncate">.docx</p>
            </div>
          </button>
          <button
            type="button"
            onClick={() => handleKindChange('xlsx')}
            className={cn(
              'flex items-center gap-3 p-3 rounded-lg border-2 transition-all min-h-[64px] text-left',
              kind === 'xlsx'
                ? 'border-emerald-500 bg-emerald-500/10'
                : 'border-border hover:border-emerald-500/50',
            )}
          >
            <FileSpreadsheet className="h-6 w-6 text-emerald-600 shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-semibold">Excel</p>
              <p className="text-[11px] text-muted-foreground truncate">.xlsx</p>
            </div>
          </button>
        </div>

        {/* Template picker */}
        <div>
          <Label className="text-xs text-muted-foreground">Template</Label>
          <div className="mt-1.5 space-y-1.5">
            {templates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplate(t.id)}
                className={cn(
                  'w-full text-left p-3 rounded-lg border transition-all min-h-[56px]',
                  template === t.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:bg-muted/50',
                )}
              >
                <p className="text-sm font-medium">{t.title}</p>
                <p className="text-[11px] text-muted-foreground">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div>
          <Label>File name</Label>
          <Input
            autoFocus
            className="h-11 mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={kind === 'docx' ? 'e.g. Invoice April 2026' : 'e.g. Attendance April 2026'}
            onKeyDown={(e) => e.key === 'Enter' && !busy && handleCreate()}
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            {kind === 'docx' ? '.docx' : '.xlsx'} extension is added automatically.
          </p>
        </div>
      </div>
    </MobileFriendlyDialog>
  );
};

export default NewFileDialog;
