import { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle, Download, FileText, FileSpreadsheet, Loader2, RefreshCw, Upload,
  ShieldAlert, HardDrive, WifiOff, FileWarning, Bug, CheckCircle2,
} from 'lucide-react';
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

type Kind = 'docx' | 'xlsx';
export type NewFileCategory = 'permission' | 'quota' | 'network' | 'validation' | 'unknown';

export interface NewFileTroubleshootingState {
  step: string;
  message: string;
  category?: NewFileCategory;
  expectedKind: Kind;
  retryAttempted: boolean;
  retryFailed?: boolean;
  retryMessage?: string;
}

interface NewFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (spec: NewFileSpec) => Promise<boolean> | boolean;
  onCreateLocalFirst: (spec: NewFileSpec) => Promise<boolean> | boolean;
  onManualTemplateUpload: (file: File, kind: Kind, openInEditor: boolean) => Promise<boolean> | boolean;
  troubleshooting: NewFileTroubleshootingState | null;
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

const CATEGORY_META: Record<NewFileCategory, { label: string; icon: typeof ShieldAlert; tone: string }> = {
  permission: { label: 'Permission issue', icon: ShieldAlert, tone: 'text-rose-600 bg-rose-500/10 border-rose-500/30' },
  quota:      { label: 'Storage quota',     icon: HardDrive,   tone: 'text-amber-700 bg-amber-500/10 border-amber-500/30' },
  network:    { label: 'Network problem',   icon: WifiOff,     tone: 'text-blue-600 bg-blue-500/10 border-blue-500/30' },
  validation: { label: 'File validation',   icon: FileWarning, tone: 'text-violet-600 bg-violet-500/10 border-violet-500/30' },
  unknown:    { label: 'Unexpected error',  icon: Bug,         tone: 'text-muted-foreground bg-muted border-border' },
};

const CategoryHints = ({ category }: { category: NewFileCategory }) => {
  if (category === 'permission') {
    return (
      <div className="space-y-2.5 text-xs">
        <p className="font-semibold text-foreground">Browser permissions to verify for this site</p>
        <ul className="space-y-1.5 text-muted-foreground">
          <li>• <span className="font-medium text-foreground">Cookies</span>: <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">Allow</span> — third-party cookies must not be blocked for this origin.</li>
          <li>• <span className="font-medium text-foreground">JavaScript</span>: <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">Allowed</span></li>
          <li>• <span className="font-medium text-foreground">Pop-ups & redirects</span>: <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">Allowed</span> — needed for "Download blank first".</li>
          <li>• <span className="font-medium text-foreground">Insecure content</span>: <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">Blocked</span> — keep the site on HTTPS.</li>
        </ul>
        <p className="font-semibold text-foreground pt-1">App permission</p>
        <ul className="space-y-1.5 text-muted-foreground">
          <li>• Only the <span className="font-medium text-foreground">Manager (Abhay)</span> can create files. Confirm you are signed in as Manager.</li>
          <li>• If your session expired, sign out and back in.</li>
          <li>• Private/Incognito mode disables IndexedDB in some browsers — try a normal window.</li>
        </ul>
      </div>
    );
  }
  if (category === 'quota') {
    return (
      <div className="space-y-2.5 text-xs">
        <p className="font-semibold text-foreground">Browser storage quota to clear</p>
        <ul className="space-y-1.5 text-muted-foreground">
          <li>• <span className="font-medium text-foreground">Chrome / Edge</span>: open <span className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">chrome://settings/content/all</span> → search this site → <span className="font-medium">Clear data</span>.</li>
          <li>• <span className="font-medium text-foreground">Firefox</span>: Settings → Privacy &amp; Security → <span className="font-medium">Cookies and Site Data</span> → Manage Data → remove this site.</li>
          <li>• <span className="font-medium text-foreground">Safari</span>: Settings → Privacy → <span className="font-medium">Manage Website Data</span> → remove this site.</li>
        </ul>
        <p className="font-semibold text-foreground pt-1">App-side storage</p>
        <ul className="space-y-1.5 text-muted-foreground">
          <li>• Open the Storage usage widget in File Manager — if it is over 90%, archive or delete older files.</li>
          <li>• Use <span className="font-medium text-foreground">Download blank first</span> to confirm your machine can save locally even if the server is full.</li>
          <li>• Single-file upload cap is around 50&nbsp;MB — split very large files.</li>
        </ul>
      </div>
    );
  }
  if (category === 'network') {
    return (
      <ul className="space-y-1.5 text-xs text-muted-foreground">
        <li>• Confirm you are online; reload the page after the network is restored.</li>
        <li>• Disable VPN, ad-blocker or content-blocker just for this site.</li>
        <li>• Try the <span className="font-medium text-foreground">Retry</span> button below — short outages usually clear within a few seconds.</li>
      </ul>
    );
  }
  if (category === 'validation') {
    return (
      <ul className="space-y-1.5 text-xs text-muted-foreground">
        <li>• The file was generated but failed an integrity check. The simplified retry below uses a guaranteed blank template.</li>
        <li>• If retry also fails, use <span className="font-medium text-foreground">Upload template</span> to bring in a known-good .docx / .xlsx instead.</li>
      </ul>
    );
  }
  return (
    <ul className="space-y-1.5 text-xs text-muted-foreground">
      <li>• Open the browser console (F12) and copy the <span className="font-mono">[NewFile]</span> log lines for support.</li>
      <li>• Try the simplified retry, then the local-first download to isolate the failing step.</li>
    </ul>
  );
};

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
  const accent = kind === 'docx'
    ? 'from-blue-500/15 via-blue-500/5 text-blue-600 border-blue-500/30'
    : 'from-emerald-500/15 via-emerald-500/5 text-emerald-600 border-emerald-500/30';
  const KindIcon = kind === 'docx' ? FileText : FileSpreadsheet;

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

  const tCategory: NewFileCategory = troubleshooting?.category ?? 'unknown';
  const meta = CATEGORY_META[tCategory];
  const MetaIcon = meta.icon;

  return (
    <MobileFriendlyDialog
      open={open}
      onOpenChange={(o) => !busy && onOpenChange(o)}
      header={
        <div className={cn('-mx-6 -mt-6 mb-2 px-6 pt-6 pb-4 bg-gradient-to-br to-transparent border-b', accent)}>
          <div className="flex items-center gap-3">
            <div className={cn('h-10 w-10 rounded-xl border bg-background/70 backdrop-blur flex items-center justify-center', accent)}>
              <KindIcon className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <DialogTitle className="text-base font-bold">Create new file</DialogTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Pick a kind and template — file is validated before saving.
              </p>
            </div>
          </div>
        </div>
      }
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
              'flex items-center gap-3 p-3 rounded-xl border-2 transition-all min-h-[64px] text-left',
              kind === 'docx'
                ? 'border-blue-500 bg-blue-500/10 shadow-sm'
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
              'flex items-center gap-3 p-3 rounded-xl border-2 transition-all min-h-[64px] text-left',
              kind === 'xlsx'
                ? 'border-emerald-500 bg-emerald-500/10 shadow-sm'
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

        {/* Template picker — grid with selected check badge */}
        <div>
          <Label className="text-xs text-muted-foreground">Template</Label>
          <div className="mt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-2">
            {templates.map((t) => {
              const selected = template === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTemplate(t.id)}
                  className={cn(
                    'relative w-full text-left p-3 rounded-xl border transition-all min-h-[68px]',
                    selected
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:bg-muted/50',
                  )}
                >
                  {selected && (
                    <CheckCircle2 className="absolute top-2 right-2 h-4 w-4 text-primary" />
                  )}
                  <p className="text-sm font-semibold">{t.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{t.desc}</p>
                </button>
              );
            })}
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

        {/* Tertiary upload-template link, always visible */}
        <button
          type="button"
          onClick={() => manualUploadRef.current?.click()}
          disabled={busy}
          className="text-[11px] text-muted-foreground hover:text-foreground underline underline-offset-2"
        >
          Or upload your own .{kind === 'docx' ? 'docx' : 'xlsx'} template instead
        </button>

        {troubleshooting && troubleshooting.expectedKind === kind && (
          <div className={cn('rounded-xl border p-4 space-y-3', meta.tone)}>
            <div className="flex items-start gap-3">
              <MetaIcon className="h-5 w-5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold text-foreground">File creation troubleshooting</p>
                  <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border', meta.tone)}>
                    {meta.label}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Failed at <span className="font-medium text-foreground">{troubleshooting.step}</span>: {troubleshooting.message}
                </p>
              </div>
            </div>

            <CategoryHints category={tCategory} />

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
          </div>
        )}

        <input
          ref={manualUploadRef}
          type="file"
          className="hidden"
          accept={kind === 'docx' ? '.docx' : '.xlsx,.xls'}
          onChange={handleManualFilePick}
        />
      </div>
    </MobileFriendlyDialog>
  );
};

export default NewFileDialog;
