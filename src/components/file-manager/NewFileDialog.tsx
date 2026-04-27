import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Download, FileText, FileSpreadsheet, Loader2, RefreshCw, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { MobileFriendlyDialog } from '@/components/ui/MobileDialog';
import { DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import type {
  DocxTemplate,
  XlsxTemplate,
  NewFileSpec,
  AttendanceCategory,
} from '@/lib/file-manager/createBlankFile';

interface NewFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (spec: NewFileSpec) => Promise<boolean> | boolean;
  onCreateLocalFirst: (spec: NewFileSpec) => Promise<boolean> | boolean;
  onManualTemplateUpload: (file: File, kind: Kind, openInEditor: boolean) => Promise<boolean> | boolean;
  troubleshooting: NewFileTroubleshootingState | null;
}

type Kind = 'docx' | 'xlsx';

export interface NewFileTroubleshootingState {
  step: string;
  message: string;
  expectedKind: Kind;
  retryAttempted: boolean;
  retryFailed?: boolean;
  retryMessage?: string;
}

const DOCX_TEMPLATES: { id: DocxTemplate; title: string; desc: string }[] = [
  { id: 'blank', title: 'Blank document', desc: 'Empty Word document' },
  { id: 'invoice', title: 'Invoice', desc: 'Bill-to + items table' },
  { id: 'salary-slip', title: 'Salary slip', desc: 'Earnings & deductions' },
];

const XLSX_TEMPLATES: { id: XlsxTemplate; title: string; desc: string }[] = [
  { id: 'blank', title: 'Blank sheet', desc: 'Empty spreadsheet' },
  { id: 'attendance-sheet', title: 'Attendance sheet', desc: 'Pre-filled with active staff' },
  { id: 'salary-sheet', title: 'Salary sheet', desc: 'Shifts × Rate − Advances' },
];

const NewFileDialog = ({
  open,
  onOpenChange,
  onCreate,
  onCreateLocalFirst,
  onManualTemplateUpload,
  troubleshooting,
}: NewFileDialogProps) => {
  const [kind, setKind] = useState<Kind>('docx');
  const [template, setTemplate] = useState<DocxTemplate | XlsxTemplate>('blank');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [attDate, setAttDate] = useState<string>(() => new Date().toISOString().slice(0, 10));
  const [attCategory, setAttCategory] = useState<AttendanceCategory>('all');
  const [openInEditor, setOpenInEditor] = useState(true);
  const manualUploadRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setKind('docx');
      setTemplate('blank');
      setName('');
      setBusy(false);
      setAttDate(new Date().toISOString().slice(0, 10));
      setAttCategory('all');
      setOpenInEditor(true);
    }
  }, [open]);

  const templates = kind === 'docx' ? DOCX_TEMPLATES : XLSX_TEMPLATES;
  const showAttendanceOpts = kind === 'xlsx' && template === 'attendance-sheet';

  const handleKindChange = (next: Kind) => {
    setKind(next);
    setTemplate('blank');
  };

  const buildSpec = (): NewFileSpec => {
    const defaultName = showAttendanceOpts
      ? `Attendance ${attCategory.toUpperCase()} ${attDate}`
      : kind === 'docx' ? 'Untitled Document' : 'Untitled Sheet';

    return {
      kind,
      template,
      baseName: name.trim() || defaultName,
      attendanceDate: showAttendanceOpts ? attDate : undefined,
      attendanceCategory: showAttendanceOpts ? attCategory : undefined,
      openInEditor,
    };
  };

  const handleCreate = async () => {
    setBusy(true);
    try {
      const ok = await onCreate(buildSpec());
      if (ok) onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  const handleCreateLocalFirst = async () => {
    setBusy(true);
    try {
      const ok = await onCreateLocalFirst({
        ...buildSpec(),
        template: 'blank',
      });
      if (ok) onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  const handleManualFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const ok = await onManualTemplateUpload(file, kind, openInEditor);
      if (ok) onOpenChange(false);
    } finally {
      e.target.value = '';
      setBusy(false);
    }
  };

  return (
    <MobileFriendlyDialog
      open={open}
      onOpenChange={(o) => !busy && onOpenChange(o)}
      header={<DialogTitle>Create new file</DialogTitle>}
      footer={
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <Button type="button" variant="outline" onClick={handleCreateLocalFirst} disabled={busy} className="h-11 w-full">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Download blank first
          </Button>
          <Button onClick={handleCreate} disabled={busy} className="w-full h-11">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            {busy ? 'Creating…' : `Create ${kind === 'docx' ? 'Document' : 'Sheet'}`}
          </Button>
        </div>
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

        {/* Attendance template options */}
        {showAttendanceOpts && (
          <div className="grid grid-cols-2 gap-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
            <div>
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                className="h-10 mt-1"
                value={attDate}
                onChange={(e) => setAttDate(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Category</Label>
              <Select value={attCategory} onValueChange={(v) => setAttCategory(v as AttendanceCategory)}>
                <SelectTrigger className="h-10 mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All staff</SelectItem>
                  <SelectItem value="petroleum">Petroleum</SelectItem>
                  <SelectItem value="crusher">Crusher</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="mlt">MLT</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <p className="col-span-2 text-[11px] text-muted-foreground">
              Active staff for this category will be pre-filled in the sheet.
            </p>
          </div>
        )}

        {/* Name */}
        <div>
          <Label>File name</Label>
          <Input
            autoFocus
            className="h-11 mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={
              showAttendanceOpts
                ? `Attendance ${attCategory.toUpperCase()} ${attDate}`
                : kind === 'docx' ? 'e.g. Invoice April 2026' : 'e.g. Salary April 2026'
            }
            onKeyDown={(e) => e.key === 'Enter' && !busy && handleCreate()}
          />
          <p className="text-[11px] text-muted-foreground mt-1">
            {kind === 'docx' ? '.docx' : '.xlsx'} extension is added automatically.
          </p>
        </div>

        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/30 p-3">
          <Checkbox
            id="open-in-editor"
            checked={openInEditor}
            onCheckedChange={(checked) => setOpenInEditor(Boolean(checked))}
          />
          <div className="space-y-1">
            <Label htmlFor="open-in-editor" className="text-sm font-medium">
              Open in built-in editor after validation
            </Label>
            <p className="text-[11px] text-muted-foreground">
              The file is validated before upload and opened only if it can be read safely.
            </p>
          </div>
        </div>

        {troubleshooting && troubleshooting.expectedKind === kind && (
          <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
              <div>
                <p className="text-sm font-semibold">File creation troubleshooting</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Failed at <span className="font-medium text-foreground">{troubleshooting.step}</span>: {troubleshooting.message}
                </p>
              </div>
            </div>

            <ul className="list-disc pl-5 text-xs text-muted-foreground space-y-1">
              <li>Check the browser console for the detailed file creation log.</li>
              <li>Confirm you still have permission to upload and save files.</li>
              <li>The app already tried a simplified blank generator after the first failure.</li>
            </ul>

            {troubleshooting.retryAttempted && (
              <div className="rounded-md border border-border bg-background/70 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">Simplified retry</span>
                {troubleshooting.retryFailed
                  ? ` failed: ${troubleshooting.retryMessage || 'Unknown error'}`
                  : ' succeeded.'}
              </div>
            )}

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button type="button" variant="outline" onClick={handleCreate} disabled={busy} className="h-10">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry
              </Button>
              <Button type="button" variant="outline" onClick={() => manualUploadRef.current?.click()} disabled={busy} className="h-10">
                <Upload className="h-4 w-4 mr-2" />
                Upload template
              </Button>
              <Button type="button" variant="outline" onClick={handleCreateLocalFirst} disabled={busy} className="h-10">
                <Download className="h-4 w-4 mr-2" />
                Local first
              </Button>
            </div>
            <input
              ref={manualUploadRef}
              type="file"
              className="hidden"
              accept={kind === 'docx' ? '.docx' : '.xlsx,.xls'}
              onChange={handleManualFilePick}
            />
          </div>
        )}
      </div>
    </MobileFriendlyDialog>
  );
};

export default NewFileDialog;
