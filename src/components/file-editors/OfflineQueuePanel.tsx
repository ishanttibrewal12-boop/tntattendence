import { useEffect, useState } from 'react';
import { downloadQueue, QueueJob } from '@/lib/file-manager/downloadQueue';
import { Button } from '@/components/ui/button';
import { MobileFriendlyDialog } from '@/components/ui/MobileDialog';
import { DialogTitle } from '@/components/ui/dialog';
import { Loader2, RefreshCw, X, CheckCircle2, AlertTriangle, Clock, ListChecks, WifiOff } from 'lucide-react';
import { format } from 'date-fns';

interface OfflineQueuePanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const OfflineQueuePanel = ({ open, onOpenChange }: OfflineQueuePanelProps) => {
  const [jobs, setJobs] = useState<QueueJob[]>(downloadQueue.getJobs());
  const [online, setOnline] = useState(typeof navigator === 'undefined' ? true : navigator.onLine);

  useEffect(() => {
    const unsub = downloadQueue.subscribe(setJobs);
    const setOn = () => setOnline(true);
    const setOff = () => setOnline(false);
    window.addEventListener('online', setOn);
    window.addEventListener('offline', setOff);
    return () => {
      unsub();
      window.removeEventListener('online', setOn);
      window.removeEventListener('offline', setOff);
    };
  }, []);

  const reversed = [...jobs].reverse();
  const active = jobs.filter((j) => j.status === 'queued' || j.status === 'running').length;

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
          {jobs.some((j) => j.status === 'done') && (
            <Button size="sm" variant="ghost" onClick={() => downloadQueue.clearCompleted()} className="text-xs">
              Clear done
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-2">
        {!online && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
            <WifiOff className="h-4 w-4 shrink-0" />
            <span>You're offline. Jobs will resume automatically when connection returns.</span>
          </div>
        )}
        {reversed.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No exports yet. Backups, share links and downloads will queue here.
          </div>
        ) : (
          reversed.map((job) => <QueueRow key={job.id} job={job} />)
        )}
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
          {job.status === 'running' && (
            <div className="mt-2 h-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-primary transition-all" style={{ width: `${job.progress}%` }} />
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
