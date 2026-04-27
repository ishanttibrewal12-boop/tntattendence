import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { MobileFriendlyDialog } from '@/components/ui/MobileDialog';
import { DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { History, Download, RotateCcw, Loader2, Trash2 } from 'lucide-react';

interface VersionHistoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string;
  fileName: string;
  currentStoragePath: string;
  onRestored?: () => void;
}

interface VersionRow {
  id: string;
  version_number: number;
  storage_path: string;
  size_bytes: number;
  saved_by: string | null;
  note: string | null;
  created_at: string;
}

const fmtBytes = (b: number) => {
  if (!b) return '—';
  const u = ['B', 'KB', 'MB']; let i = 0; let v = b;
  while (v > 1024 && i < u.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(i ? 1 : 0)} ${u[i]}`;
};

export function VersionHistoryDialog({
  open, onOpenChange, fileId, fileName, currentStoragePath, onRestored,
}: VersionHistoryDialogProps) {
  const [versions, setVersions] = useState<VersionRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('file_versions')
      .select('*').eq('file_id', fileId).order('version_number', { ascending: false });
    if (error) toast.error('Failed to load history');
    else setVersions((data || []) as VersionRow[]);
    setLoading(false);
  };

  useEffect(() => { if (open) load(); /* eslint-disable-next-line */ }, [open, fileId]);

  const handleDownload = async (v: VersionRow) => {
    const { data, error } = await supabase.storage.from('files').createSignedUrl(v.storage_path, 60);
    if (error || !data) { toast.error('Download failed'); return; }
    const a = document.createElement('a');
    a.href = data.signedUrl;
    a.download = `v${v.version_number}_${fileName}`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  const handleRestore = async (v: VersionRow) => {
    setRestoring(v.id);
    try {
      // Step 1: snapshot the CURRENT version before overwriting (so we don't lose it)
      const { data: curBlob } = await supabase.storage.from('files').download(currentStoragePath);
      if (curBlob) {
        const ext = fileName.split('.').pop() || 'bin';
        const snapshotPath = `versions/${fileId}/v_pre_restore_${Date.now()}.${ext}`;
        const { error: upErr } = await supabase.storage.from('files').upload(snapshotPath, curBlob, {
          upsert: false, contentType: curBlob.type,
        });
        if (!upErr) {
          const nextNum = (versions[0]?.version_number || 0) + 1;
          await supabase.from('file_versions').insert({
            file_id: fileId, version_number: nextNum, storage_path: snapshotPath,
            size_bytes: curBlob.size, mime_type: curBlob.type,
            saved_by: 'system', note: `Auto-snapshot before restoring v${v.version_number}`,
          });
        }
      }

      // Step 2: copy the chosen version into the current path
      const { data: oldBlob, error: dErr } = await supabase.storage.from('files').download(v.storage_path);
      if (dErr || !oldBlob) throw dErr || new Error('Cannot read old version');
      const { error: writeErr } = await supabase.storage.from('files').upload(currentStoragePath, oldBlob, {
        upsert: true, contentType: oldBlob.type,
      });
      if (writeErr) throw writeErr;

      await supabase.from('file_metadata').update({
        size_bytes: oldBlob.size, updated_at: new Date().toISOString(),
      }).eq('id', fileId);

      toast.success(`Restored to version ${v.version_number}`);
      onRestored?.();
      load();
    } catch (err: any) {
      console.error(err);
      toast.error('Restore failed: ' + (err?.message || 'unknown'));
    } finally {
      setRestoring(null);
    }
  };

  const handleDelete = async (v: VersionRow) => {
    try {
      await supabase.storage.from('files').remove([v.storage_path]);
      await supabase.from('file_versions').delete().eq('id', v.id);
      toast.success('Version deleted');
      load();
    } catch (err: any) {
      toast.error('Delete failed');
    }
  };

  return (
    <MobileFriendlyDialog
      open={open}
      onOpenChange={onOpenChange}
      header={
        <DialogTitle className="flex items-center gap-2">
          <History className="h-4 w-4" />
          <span className="truncate">History · {fileName}</span>
        </DialogTitle>
      }
    >
      {loading ? (
        <div className="py-10 flex items-center justify-center text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin mr-2" /> Loading versions…
        </div>
      ) : versions.length === 0 ? (
        <div className="py-10 text-center text-sm text-muted-foreground">
          No previous versions yet. Each save in the editor creates a new version.
        </div>
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto" style={{ overscrollBehavior: 'contain' }}>
          {versions.map((v, idx) => (
            <div key={v.id} className="border rounded-lg p-3 bg-card">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    Version {v.version_number}
                    {idx === 0 && <span className="ml-2 text-[10px] uppercase font-semibold bg-primary/10 text-primary px-1.5 py-0.5 rounded">Latest</span>}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {format(new Date(v.created_at), 'dd MMM yyyy · HH:mm')}
                    {v.saved_by && ` · ${v.saved_by}`} · {fmtBytes(v.size_bytes)}
                  </p>
                  {v.note && <p className="text-[11px] text-muted-foreground italic mt-0.5">{v.note}</p>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => handleDownload(v)}>
                  <Download className="h-3 w-3 mr-1" /> Download
                </Button>
                <Button
                  size="sm" variant="default" className="h-8 text-xs"
                  disabled={restoring === v.id}
                  onClick={() => handleRestore(v)}
                >
                  {restoring === v.id
                    ? <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                    : <RotateCcw className="h-3 w-3 mr-1" />}
                  Restore
                </Button>
                <Button
                  size="sm" variant="ghost"
                  className="h-8 text-xs text-destructive hover:text-destructive ml-auto"
                  onClick={() => handleDelete(v)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </MobileFriendlyDialog>
  );
}

export default VersionHistoryDialog;
