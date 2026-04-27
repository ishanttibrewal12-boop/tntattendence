import { useEffect, useState } from 'react';
import { downloadQueue, QueueJob, formatQueueBytes } from '@/lib/file-manager/downloadQueue';
import { Button } from '@/components/ui/button';
import { MobileFriendlyDialog } from '@/components/ui/MobileDialog';
import { DialogTitle } from '@/components/ui/dialog';
import {
  Loader2, RefreshCw, X, CheckCircle2, AlertTriangle, Clock,
  ListChecks, WifiOff, Pause, Play, RotateCw, FileArchive,
} from 'lucide-react';
import { format } from 'date-fns';

interface OfflineQueuePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OfflineQueuePanel = ({ open, onOpenChange }: OfflineQueuePanelProps) => {
  const [jobs, setJobs] = useState<QueueJob[]>(downloadQueue.getJobs());
  const [state, setState] = useState(downloadQueue.getState());

  useEffect(() => {
    const unsub = downloadQueue.subscribe(setJobs);
    const unsubState = downloadQueue.subscribeState(setState);
    return () => { unsub(); unsubState(); };
  }, []);

  const reversed = [...jobs].reverse();
  const active = jobs.filter((j) => j.status === 'queued' || j.status === 'running').length;
  const failedCount = jobs.filter((j) => j.status === 'failed').length;
  const doneCount = jobs.filter((j) => j.status === 'done').length;

  return (
    <MobileFriendlyDialog
      open={open}
      onOpenChange={onOpenChange}
      header={
        <div className="flex items-center justify-between gap-2 w-full">
          <DialogTitle className="flex items-center gap-2">
            <ListChecks className="h-4 w-4" />
            Export Queue
            {active > 0 && (
              <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">{active}</span>
            )}
          </DialogTitle>
        </div>
      }
    >
      <div className="space-y-3">
        {/* Status banner */}
        {!state.online ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>You're offline. Jobs will resume automatically when connection returns.</span>
          </div>
        ) : state.paused ? (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
            <Pause className="h-4 w-4 shrink-0" />
            <span>Queue is paused. Tap Resume to continue.</span>
          </div>
        ) : null}

        {/* Global controls */}
        <div className="flex flex-wrap gap-2">
          {state.paused ? (
            <Button size="sm" className="h-10 flex-1 sm:flex-initial"
              onClick={() => downloadQueue.resume()}>
              <Play className="h-4 w-4 mr-2" /> Resume
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="h-10 flex-1 sm:flex-initial"
              onClick={() => downloadQueue.pause()} disabled={active === 0}>
              <Pause className="h-4 w-4 mr-2" /> Pause
            </Button>
          )}
          <Button size="sm" variant="outline" className="h-10 flex-1 sm:flex-initial"
            onClick={() => downloadQueue.retryAllFailed()} disabled={failedCount === 0}>
            <RotateCw className="h-4 w-4 mr-2" /> Retry all{failedCount > 0 ? ` (${failedCount})` : ''}
          </Button>
          {doneCount > 0 && (
            <Button size="sm" variant="ghost" className="h-10"
              onClick={() => downloadQueue.clearCompleted()}>
              Clear done
            </Button>
          )}
        </div>

        {/* Jobs list */}
        <div className="space-y-2">
          {reversed.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              No exports yet. Backups, share links and downloads will queue here.
            </div>
          ) : (
            reversed.map((job) => <QueueRow key={job.id} job={job} />)
          )}
        </div>
      </div>
    </MobileFriendlyDialog>
  );
};

const QueueRow = ({ job }: { job: QueueJob }) => {
  const Icon = {
    queued: Clock, running: Loader2, done: CheckCircle2, failed: AlertTriangle,
  }[job.status];
  const color = {
    queued: 'text-muted-foreground', running: 'text-primary',
    done: 'text-green-600', failed: 'text-destructive',
  }[job.status];

  const d = job.details;
  const showProgressBar = job.status === 'running' || (job.status === 'done' && job.progress < 100);

  return (
    <div className="border rounded-lg p-3 bg-card">
      <div className="flex items-start gap-2">
        <Icon className={`h-4 w-4 shrink-0 mt-0.5 ${color} ${job.status === 'running' ? 'animate-spin' : ''}`} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate text-foreground">{job.label}</p>
          <p className="text-[11px] text-muted-foreground">
            {format(new Date(job.createdAt), 'dd MMM HH:mm')}
            {job.attempts > 1 && ` · attempt ${job.attempts}`}
          </p>

          {/* Per-job step + progress */}
          {showProgressBar && (
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${job.progress}%` }} />
            </div>
          )}

          {d?.currentStep && job.status !== 'failed' && (
            <p className="text-[11px] text-foreground/80 mt-1.5 break-words">
              <span className="text-muted-foreground">Step:</span> {d.currentStep}
            </p>
          )}

          {/* Breakdown chips */}
          {(d?.totalFiles || d?.bytesDownloaded) && (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {d.totalFiles !== undefined && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                  <FileArchive className="h-3 w-3" />
                  {d.filesProcessed ?? 0}/{d.totalFiles} files
                </span>
              )}
              {d.bytesDownloaded !== undefined && d.bytesDownloaded > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">
                  ⬇ {formatQueueBytes(d.bytesDownloaded)}
                  {d.bytesTotal ? ` / ${formatQueueBytes(d.bytesTotal)}` : ''}
                </span>
              )}
              {job.progress > 0 && job.status === 'running' && (
                <span className="inline-flex items-center text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  {job.progress}%
                </span>
              )}
            </div>
          )}

          {job.error && job.status === 'failed' && (
            <p className="text-[11px] text-destructive mt-1.5 break-all">{job.error}</p>
          )}
          {job.result && job.status === 'done' && job.result.length < 200 && (
            <p className="text-[11px] text-muted-foreground mt-1.5 truncate">{job.result}</p>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          {job.status === 'failed' && (
            <button
              onClick={() => downloadQueue.retry(job.id)}
              className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-muted text-foreground"
              title="Retry"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>
          )}
          {job.status !== 'running' && (
            <button
              onClick={() => downloadQueue.remove(job.id)}
              className="h-8 w-8 inline-flex items-center justify-center rounded hover:bg-muted text-muted-foreground"
              title="Remove"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineQueuePanel;
