import { useEffect, useState } from 'react';
import { AlertTriangle, Info, RotateCw, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBuildStatus } from '@/lib/file-manager/useBuildStatus';
import { formatBuildId, relativeTime } from '@/lib/build-info';
import { cn } from '@/lib/utils';

const LS_DISMISSED_KEY = 'lvbl_build_banner_dismissed_for';

const BuildStatusBanner = () => {
  const status = useBuildStatus();
  const [dismissedFor, setDismissedFor] = useState<string | null>(() => {
    try {
      return localStorage.getItem(LS_DISMISSED_KEY);
    } catch {
      return null;
    }
  });

  // Reset dismissal whenever a brand-new server id appears.
  useEffect(() => {
    if (
      status.serverBuildId &&
      dismissedFor &&
      dismissedFor !== status.serverBuildId
    ) {
      try {
        localStorage.removeItem(LS_DISMISSED_KEY);
      } catch {
        /* ignore */
      }
      setDismissedFor(null);
    }
  }, [status.serverBuildId, dismissedFor]);

  if (status.tone === 'live' || status.tone === 'unknown') return null;
  if (
    status.tone === 'update' &&
    status.serverBuildId &&
    dismissedFor === status.serverBuildId
  ) {
    return null;
  }

  const isUpdate = status.tone === 'update';
  const colorClasses = isUpdate
    ? 'border-sky-500/40 bg-sky-500/10 text-sky-900 dark:text-sky-100'
    : 'border-amber-500/40 bg-amber-500/10 text-amber-900 dark:text-amber-100';
  const Icon = isUpdate ? Info : AlertTriangle;

  const fromV =
    status.buildId === 'dev' ? 'dev' : `v${formatBuildId(status.buildId)}`;
  const toV = status.serverBuildId
    ? status.serverBuildId === 'dev'
      ? 'dev'
      : `v${formatBuildId(status.serverBuildId)}`
    : null;

  const detected = status.lastUpdateDetectedAt
    ? relativeTime(status.lastUpdateDetectedAt)
    : null;

  const handleDismiss = () => {
    if (!status.serverBuildId) return;
    try {
      localStorage.setItem(LS_DISMISSED_KEY, status.serverBuildId);
    } catch {
      /* ignore */
    }
    setDismissedFor(status.serverBuildId);
  };

  return (
    <div
      role="status"
      className={cn(
        'mb-3 rounded-lg border px-3 py-2.5 sm:px-4 sm:py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3',
        colorClasses,
      )}
    >
      <Icon className="h-4 w-4 shrink-0 mt-0.5 sm:mt-0" />
      <div className="flex-1 min-w-0 text-sm">
        <div className="font-semibold leading-tight">
          {isUpdate ? 'Update ready' : 'Cached bundle in use'}
          <span className="ml-2 font-mono text-xs opacity-80">
            {fromV}
            {toV && toV !== fromV && (
              <>
                <span className="mx-1 opacity-60">→</span>
                {toV}
              </>
            )}
          </span>
        </div>
        <div className="text-xs opacity-80 mt-0.5">
          {isUpdate
            ? `A newer build is available. Your UI may show stale data${
                detected ? ` (detected ${detected})` : ''
              }.`
            : 'This page is being served from the service worker cache. Refresh if changes look stale.'}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {isUpdate && status.sw.waiting && (
          <Button
            size="sm"
            className="h-9"
            onClick={() => status.applyWaiting()}
          >
            <RotateCw className="h-3.5 w-3.5 mr-1.5" />
            Apply
          </Button>
        )}
        {isUpdate && !status.sw.waiting && (
          <Button
            size="sm"
            className="h-9"
            onClick={() => status.hardReload()}
          >
            <RotateCw className="h-3.5 w-3.5 mr-1.5" />
            Reload
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="h-9 bg-background/50"
          onClick={() => status.clearCachesAndReload()}
        >
          <Trash2 className="h-3.5 w-3.5 mr-1.5" />
          Refresh &amp; Clear Cache
        </Button>
        <button
          type="button"
          aria-label="Dismiss"
          onClick={handleDismiss}
          className="p-1.5 rounded hover:bg-foreground/10 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

export default BuildStatusBanner;
