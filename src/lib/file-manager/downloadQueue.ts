/**
 * Resilient download/share queue with offline support.
 * - Persists queue in localStorage so jobs survive refresh
 * - Auto-retries on connection drop with exponential backoff
 * - Resumes when 'online' event fires
 */
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import JSZip from 'jszip';
import { format } from 'date-fns';

export type QueueJobType = 'backup-zip' | 'share-link' | 'share-folder' | 'download';
export type QueueJobStatus = 'queued' | 'running' | 'failed' | 'done';

export interface QueueJob {
  id: string;
  type: QueueJobType;
  label: string;
  status: QueueJobStatus;
  progress: number;
  attempts: number;
  error?: string;
  result?: string; // signed URL list or success summary
  createdAt: number;
  updatedAt: number;
  // type-specific payload
  payload: Record<string, any>;
}

const STORAGE_KEY = 'fm_offline_queue_v1';
const MAX_ATTEMPTS = 5;
type Listener = (jobs: QueueJob[]) => void;

class DownloadQueue {
  private jobs: QueueJob[] = [];
  private listeners = new Set<Listener>();
  private running = false;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: QueueJob[] = JSON.parse(raw);
        // Reset any 'running' to 'queued' on reload
        this.jobs = parsed.map((j) =>
          j.status === 'running' ? { ...j, status: 'queued' } : j
        );
      }
    } catch {
      this.jobs = [];
    }
    window.addEventListener('online', () => {
      toast.success('Back online — resuming queued exports');
      this.tick();
    });
    // Auto-start on boot if there are queued/failed jobs
    setTimeout(() => this.tick(), 800);
  }

  subscribe(fn: Listener) {
    this.listeners.add(fn);
    fn([...this.jobs]);
    return () => this.listeners.delete(fn);
  }

  getJobs() { return [...this.jobs]; }

  private notify() {
    this.persist();
    const snap = [...this.jobs];
    this.listeners.forEach((l) => l(snap));
  }

  private persist() {
    try {
      // Don't persist huge result text (e.g. blob URLs)
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
    this.jobs[idx] = { ...this.jobs[idx], ...patch, updatedAt: Date.now() };
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
    };
    this.jobs.push(newJob);
    this.notify();
    this.tick();
    return newJob.id;
  }

  retry(id: string) {
    this.updateJob(id, { status: 'queued', error: undefined, attempts: 0 });
    this.tick();
  }

  remove(id: string) {
    this.jobs = this.jobs.filter((j) => j.id !== id);
    this.notify();
  }

  clearCompleted() {
    this.jobs = this.jobs.filter((j) => j.status !== 'done');
    this.notify();
  }

  private async tick() {
    if (this.running) return;
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      // Wait for 'online' event
      return;
    }
    const next = this.jobs.find((j) => j.status === 'queued');
    if (!next) return;
    this.running = true;
    this.updateJob(next.id, { status: 'running', attempts: next.attempts + 1, progress: 0 });

    try {
      switch (next.type) {
        case 'backup-zip':
          await this.runBackupZip(next);
          break;
        case 'share-link':
          await this.runShareLink(next);
          break;
        case 'share-folder':
          await this.runShareFolder(next);
          break;
        case 'download':
          await this.runDownload(next);
          break;
      }
    } catch (err: any) {
      console.error('[queue] job failed', next.id, err);
      const msg = err?.message || String(err);
      const job = this.jobs.find((j) => j.id === next.id);
      if (job && job.attempts < MAX_ATTEMPTS) {
        this.updateJob(next.id, { status: 'queued', error: `Retrying… (${msg})` });
        const delay = Math.min(30_000, 1500 * Math.pow(2, job.attempts - 1));
        this.retryTimer = setTimeout(() => {
          this.running = false;
          this.tick();
        }, delay);
        return;
      }
      this.updateJob(next.id, { status: 'failed', error: msg });
    }
    this.running = false;
    // Continue with next
    setTimeout(() => this.tick(), 50);
  }

  // ===== Job runners =====
  private async runBackupZip(job: QueueJob) {
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
    let done = 0;
    for (const f of fileItems) {
      try {
        const { data: blob, error: dErr } = await supabase.storage.from('files').download(f.storage_path);
        if (dErr || !blob) continue;
        filesRoot.file(pathOf(f.id), blob);
      } catch {/* continue */}
      done++;
      this.updateJob(job.id, { progress: Math.round((done / fileItems.length) * 90) });
    }

    this.updateJob(job.id, { progress: 95 });
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
    this.updateJob(job.id, { status: 'done', progress: 100, result: `${done} files packaged` });
  }

  private async runShareLink(job: QueueJob) {
    const { storage_path, name } = job.payload;
    const { data, error } = await supabase.storage.from('files')
      .createSignedUrl(storage_path, 60 * 60 * 24 * 7);
    if (error || !data) throw error || new Error('No URL');
    try { await navigator.clipboard.writeText(data.signedUrl); } catch {/* */}
    this.updateJob(job.id, {
      status: 'done', progress: 100,
      result: `${name}\n${data.signedUrl}`,
    });
  }

  private async runShareFolder(job: QueueJob) {
    const { folder_id } = job.payload;
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
    const links: string[] = [];
    let done = 0;
    for (const f of out) {
      const { data } = await supabase.storage.from('files').createSignedUrl(f.storage_path, 60 * 60 * 24 * 7);
      if (data?.signedUrl) links.push(`${f.relative}\n${data.signedUrl}`);
      done++;
      this.updateJob(job.id, { progress: Math.round((done / out.length) * 100) });
    }
    const text = links.join('\n\n');
    try { await navigator.clipboard.writeText(text); } catch {/* */}
    this.updateJob(job.id, { status: 'done', progress: 100, result: text });
  }

  private async runDownload(job: QueueJob) {
    const { storage_path, name } = job.payload;
    const { data, error } = await supabase.storage.from('files').createSignedUrl(storage_path, 60);
    if (error || !data) throw error || new Error('No URL');
    const a = document.createElement('a');
    a.href = data.signedUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    this.updateJob(job.id, { status: 'done', progress: 100, result: 'Downloaded' });
  }
}

export const downloadQueue = new DownloadQueue();
