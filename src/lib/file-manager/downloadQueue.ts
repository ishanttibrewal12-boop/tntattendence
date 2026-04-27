/**
 * Resilient download/share queue with offline support.
 * - Persists queue in localStorage so jobs survive refresh
 * - Auto-retries on connection drop with exponential backoff
 * - Resumes when 'online' event fires
 * - Manual pause / resume / retry-all
 * - Per-job breakdown: currentStep, filesProcessed, totalFiles, bytesDownloaded
 */
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';
import { format } from 'date-fns';

export type QueueJobType = 'backup-zip' | 'share-link' | 'share-folder' | 'download';
export type QueueJobStatus = 'queued' | 'running' | 'failed' | 'done';

export interface QueueJobDetails {
  currentStep?: string;          // e.g. "Downloading file 12/34"
  filesProcessed?: number;
  totalFiles?: number;
  bytesDownloaded?: number;      // bytes pulled from storage so far
  bytesTotal?: number;           // optional: best-effort total bytes
}

export interface QueueJob {
  id: string;
  type: QueueJobType;
  label: string;
  status: QueueJobStatus;
  progress: number;
  attempts: number;
  error?: string;
  result?: string;
  createdAt: number;
  updatedAt: number;
  payload: Record<string, any>;
  details?: QueueJobDetails;
}

const STORAGE_KEY = 'fm_offline_queue_v1';
const PAUSED_KEY = 'fm_offline_queue_paused_v1';
const MAX_ATTEMPTS = 5;
type Listener = (jobs: QueueJob[]) => void;
type StateListener = (state: { paused: boolean; online: boolean }) => void;

class DownloadQueue {
  private jobs: QueueJob[] = [];
  private listeners = new Set<Listener>();
  private stateListeners = new Set<StateListener>();
  private running = false;
  private paused = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: QueueJob[] = JSON.parse(raw);
        this.jobs = parsed.map((j) =>
          j.status === 'running' ? { ...j, status: 'queued' } : j
        );
      }
      this.paused = localStorage.getItem(PAUSED_KEY) === '1';
    } catch {
      this.jobs = [];
    }
    window.addEventListener('online', () => {
      if (!this.paused) {
        toast.success('Back online — resuming queued exports');
      }
      this.notifyState();
      this.tick();
    });
    window.addEventListener('offline', () => this.notifyState());
    setTimeout(() => this.tick(), 800);
  }

  // ===== Subscriptions =====
  subscribe(fn: Listener) {
    this.listeners.add(fn);
    fn([...this.jobs]);
    return () => this.listeners.delete(fn);
  }
  subscribeState(fn: StateListener) {
    this.stateListeners.add(fn);
    fn(this.getState());
    return () => this.stateListeners.delete(fn);
  }

  getJobs() { return [...this.jobs]; }
  getState() {
    return {
      paused: this.paused,
      online: typeof navigator === 'undefined' ? true : navigator.onLine,
    };
  }

  private notify() {
    this.persist();
    const snap = [...this.jobs];
    this.listeners.forEach((l) => l(snap));
  }
  private notifyState() {
    const s = this.getState();
    this.stateListeners.forEach((l) => l(s));
  }

  private persist() {
    try {
      const safe = this.jobs.map((j) => ({
        ...j,
        result: j.result && j.result.length > 50_000 ? undefined : j.result,
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(safe.slice(-30)));
    } catch {/* quota: ignore */}
  }

  private updateJob(id: string, patch: Partial<QueueJob>) {
    const idx = this.jobs.findIndex((j) => j.id === id);
    if (idx === -1) return;
    const prev = this.jobs[idx];
    this.jobs[idx] = {
      ...prev,
      ...patch,
      details: patch.details ? { ...prev.details, ...patch.details } : prev.details,
      updatedAt: Date.now(),
    };
    this.notify();
  }

  enqueue(job: Omit<QueueJob, 'id' | 'status' | 'progress' | 'attempts' | 'createdAt' | 'updatedAt'>) {
    const newJob: QueueJob = {
      ...job,
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      status: 'queued',
      progress: 0,
      attempts: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      details: { currentStep: 'Waiting…' },
    };
    this.jobs.push(newJob);
    this.notify();
    this.tick();
    return newJob.id;
  }

  retry(id: string) {
    this.updateJob(id, {
      status: 'queued', error: undefined, attempts: 0, progress: 0,
      details: { currentStep: 'Waiting…' },
    });
    this.tick();
  }

  retryAllFailed() {
    let count = 0;
    this.jobs = this.jobs.map((j) => {
      if (j.status === 'failed') {
        count++;
        return {
          ...j, status: 'queued', error: undefined, attempts: 0, progress: 0,
          details: { ...(j.details || {}), currentStep: 'Waiting…' },
          updatedAt: Date.now(),
        };
      }
      return j;
    });
    this.notify();
    if (count > 0) toast.success(`Retrying ${count} failed job${count > 1 ? 's' : ''}`);
    this.tick();
    return count;
  }

  remove(id: string) {
    this.jobs = this.jobs.filter((j) => j.id !== id);
    this.notify();
  }

  clearCompleted() {
    this.jobs = this.jobs.filter((j) => j.status !== 'done');
    this.notify();
  }

  pause() {
    this.paused = true;
    try { localStorage.setItem(PAUSED_KEY, '1'); } catch {/* */}
    if (this.retryTimer) { clearTimeout(this.retryTimer); this.retryTimer = null; }
    this.notifyState();
    toast.info('Export queue paused');
  }
  resume() {
    this.paused = false;
    try { localStorage.removeItem(PAUSED_KEY); } catch {/* */}
    this.notifyState();
    toast.success('Export queue resumed');
    this.tick();
  }
  isPaused() { return this.paused; }

  private async tick() {
    if (this.running || this.paused) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    const next = this.jobs.find((j) => j.status === 'queued');
    if (!next) return;
    this.running = true;
    this.updateJob(next.id, {
      status: 'running', attempts: next.attempts + 1, progress: 0,
      details: { currentStep: 'Starting…' },
    });

    try {
      switch (next.type) {
        case 'backup-zip': await this.runBackupZip(next); break;
        case 'share-link': await this.runShareLink(next); break;
        case 'share-folder': await this.runShareFolder(next); break;
        case 'download': await this.runDownload(next); break;
      }
    } catch (err: any) {
      console.error('[queue] job failed', next.id, err);
      const msg = err?.message || String(err);
      const job = this.jobs.find((j) => j.id === next.id);
      if (job && job.attempts < MAX_ATTEMPTS && !this.paused) {
        this.updateJob(next.id, {
          status: 'queued',
          error: `Retrying… (${msg})`,
          details: { currentStep: `Retry scheduled (attempt ${job.attempts}/${MAX_ATTEMPTS})` },
        });
        const delay = Math.min(30_000, 1500 * Math.pow(2, job.attempts - 1));
        this.retryTimer = setTimeout(() => {
          this.running = false;
          this.tick();
        }, delay);
        return;
      }
      this.updateJob(next.id, {
        status: 'failed', error: msg,
        details: { currentStep: `Failed: ${msg.slice(0, 80)}` },
      });
    }
    this.running = false;
    setTimeout(() => this.tick(), 50);
  }

  // ===== Job runners =====
  private async runBackupZip(job: QueueJob) {
    this.updateJob(job.id, { details: { currentStep: 'Reading file index…' } });
    const { data: meta, error } = await supabase.from('file_metadata').select('*');
    if (error) throw error;
    const all = meta || [];
    const byId = new Map(all.map((m: any) => [m.id, m]));
    const pathOf = (id: string): string => {
      const parts: string[] = [];
      let cur: any = byId.get(id);
      while (cur) { parts.unshift(cur.name); cur = cur.parent_id ? byId.get(cur.parent_id) : undefined; }
      return parts.join('/');
    };
    const zip = new JSZip();
    const filesRoot = zip.folder('files')!;
    zip.file('metadata.json', JSON.stringify(all, null, 2));
    zip.file('README.txt',
      `File Manager Backup\nGenerated: ${new Date().toISOString()}\n\n` +
      `Restore via File Manager → "Restore ZIP".\n`);

    const fileItems = all.filter((m: any) => m.type === 'file' && m.storage_path);
    const totalFiles = fileItems.length;
    const bytesTotal = fileItems.reduce((s: number, f: any) => s + (f.size_bytes || 0), 0);
    this.updateJob(job.id, {
      details: {
        currentStep: `Preparing ${totalFiles} file${totalFiles !== 1 ? 's' : ''}…`,
        filesProcessed: 0, totalFiles, bytesDownloaded: 0, bytesTotal,
      },
    });

    let done = 0;
    let bytesDownloaded = 0;
    for (const f of fileItems) {
      // Honor pause: bail and re-queue
      if (this.paused) {
        this.updateJob(job.id, {
          status: 'queued',
          details: { currentStep: `Paused at ${done}/${totalFiles}` },
        });
        throw new Error('PAUSED');
      }
      try {
        this.updateJob(job.id, {
          details: { currentStep: `Downloading ${done + 1}/${totalFiles} · ${f.name}` },
        });
        const { data: blob, error: dErr } = await supabase.storage.from('files').download(f.storage_path);
        if (dErr || !blob) continue;
        filesRoot.file(pathOf(f.id), blob);
        bytesDownloaded += (blob as Blob).size || 0;
      } catch {/* continue */}
      done++;
      this.updateJob(job.id, {
        progress: Math.round((done / totalFiles) * 90),
        details: {
          currentStep: `Zipped ${done}/${totalFiles}`,
          filesProcessed: done, bytesDownloaded,
        },
      });
    }

    this.updateJob(job.id, {
      progress: 95,
      details: { currentStep: 'Compressing ZIP…', filesProcessed: done, bytesDownloaded },
    });
    const blob = await zip.generateAsync({
      type: 'blob', compression: 'DEFLATE', compressionOptions: { level: 6 },
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `file-manager-backup-${format(new Date(), 'yyyyMMdd-HHmm')}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
    this.updateJob(job.id, {
      status: 'done', progress: 100,
      result: `${done} files packaged`,
      details: {
        currentStep: `Completed · ${formatBytes(blob.size)} ZIP`,
        filesProcessed: done, totalFiles, bytesDownloaded, bytesTotal,
      },
    });
  }

  private async runShareLink(job: QueueJob) {
    const { storage_path, name } = job.payload;
    this.updateJob(job.id, { details: { currentStep: 'Generating signed URL…' } });
    const { data, error } = await supabase.storage.from('files')
      .createSignedUrl(storage_path, 60 * 60 * 24 * 7);
    if (error || !data) throw error || new Error('No URL');
    try { await navigator.clipboard.writeText(data.signedUrl); } catch {/* */}
    this.updateJob(job.id, {
      status: 'done', progress: 100,
      result: `${name}\n${data.signedUrl}`,
      details: { currentStep: 'Link copied to clipboard' },
    });
  }

  private async runShareFolder(job: QueueJob) {
    const { folder_id } = job.payload;
    this.updateJob(job.id, { details: { currentStep: 'Scanning folder…' } });
    const out: { name: string; storage_path: string; relative: string }[] = [];
    const visit = async (id: string, prefix: string) => {
      const { data } = await supabase.from('file_metadata')
        .select('id,name,type,storage_path').eq('parent_id', id);
      for (const child of (data || []) as any[]) {
        if (child.type === 'file' && child.storage_path) {
          out.push({ name: child.name, storage_path: child.storage_path, relative: `${prefix}${child.name}` });
        } else if (child.type === 'folder') {
          await visit(child.id, `${prefix}${child.name}/`);
        }
      }
    };
    await visit(folder_id, '');
    if (out.length === 0) throw new Error('Folder is empty');
    const totalFiles = out.length;
    this.updateJob(job.id, {
      details: {
        currentStep: `Generating ${totalFiles} share link${totalFiles > 1 ? 's' : ''}…`,
        filesProcessed: 0, totalFiles,
      },
    });
    const links: string[] = [];
    let done = 0;
    for (const f of out) {
      if (this.paused) {
        this.updateJob(job.id, {
          status: 'queued',
          details: { currentStep: `Paused at ${done}/${totalFiles}` },
        });
        throw new Error('PAUSED');
      }
      const { data } = await supabase.storage.from('files').createSignedUrl(f.storage_path, 60 * 60 * 24 * 7);
      if (data?.signedUrl) links.push(`${f.relative}\n${data.signedUrl}`);
      done++;
      this.updateJob(job.id, {
        progress: Math.round((done / totalFiles) * 100),
        details: {
          currentStep: `Signed ${done}/${totalFiles}`,
          filesProcessed: done, totalFiles,
        },
      });
    }
    const text = links.join('\n\n');
    try { await navigator.clipboard.writeText(text); } catch {/* */}
    this.updateJob(job.id, {
      status: 'done', progress: 100, result: text,
      details: { currentStep: `${done} links copied to clipboard`, filesProcessed: done, totalFiles },
    });
  }

  private async runDownload(job: QueueJob) {
    const { storage_path, name } = job.payload;
    this.updateJob(job.id, { details: { currentStep: 'Generating download URL…' } });
    const { data, error } = await supabase.storage.from('files').createSignedUrl(storage_path, 60);
    if (error || !data) throw error || new Error('No URL');
    const a = document.createElement('a');
    a.href = data.signedUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.updateJob(job.id, {
      status: 'done', progress: 100, result: 'Downloaded',
      details: { currentStep: 'Download started in browser' },
    });
  }
}

const formatBytes = (bytes: number): string => {
  if (!bytes || bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
};

export const downloadQueue = new DownloadQueue();
export { formatBytes as formatQueueBytes };
