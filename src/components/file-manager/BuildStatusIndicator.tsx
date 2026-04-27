import { useEffect, useRef, useState, useCallback } from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  RotateCw,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  BUILD_ID,
  BUILD_LOADED_AT,
  fetchServerBuildId,
  formatBuildId,
  relativeTime,
} from '@/lib/build-info';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

type Tone = 'live' | 'cached' | 'update' | 'unknown';

interface SwInfo {
  state: 'none' | 'active' | 'waiting' | 'unsupported';
  registration: ServiceWorkerRegistration | null;
}

const TONE_CLASSES: Record<Tone, { dot: string; pill: string; label: string }> = {
  live: {
    dot: 'bg-emerald-500',
    pill: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300',
    label: 'Live build',
  },
  cached: {
    dot: 'bg-amber-500',
    pill: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300',
    label: 'Cached build',
  },
  update: {
    dot: 'bg-sky-500 animate-pulse',
    pill: 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300',
    label: 'Update ready',
  },
  unknown: {
    dot: 'bg-muted-foreground',
    pill: 'border-border bg-muted text-muted-foreground',
    label: 'Checking…',
  },
};

const POLL_INTERVAL = 60_000;

const BuildStatusIndicator = () => {
  const [serverBuildId, setServerBuildId] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);
  const [sw, setSw] = useState<SwInfo>({ state: 'none', registration: null });
  const [, force] = useState(0);
  const mounted = useRef(true);

  // Re-render once a minute so "X min ago" stays accurate.
  useEffect(() => {
    const t = setInterval(() => force((n) => n + 1), 30_000);
    return () => clearInterval(t);
  }, []);

  const probeServer = useCallback(async () => {
    setChecking(true);
    try {
      const id = await fetchServerBuildId();
      if (!mounted.current) return;
      setServerBuildId(id);
      setLastChecked(new Date());
    } finally {
      if (mounted.current) setChecking(false);
    }
  }, []);

  const refreshSw = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      setSw({ state: 'unsupported', registration: null });
      return;
    }
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      if (!reg) {
        setSw({ state: 'none', registration: null });
        return;
      }
      if (reg.waiting) {
        setSw({ state: 'waiting', registration: reg });
      } else if (reg.active) {
        setSw({ state: 'active', registration: reg });
      } else {
        setSw({ state: 'none', registration: reg });
      }
    } catch {
      setSw({ state: 'none', registration: null });
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    probeServer();
    refreshSw();
    const t = setInterval(() => {
      probeServer();
      refreshSw();
    }, POLL_INTERVAL);

    const onFocus = () => {
      probeServer();
      refreshSw();
    };
    window.addEventListener('focus', onFocus);

    return () => {
      mounted.current = false;
      clearInterval(t);
      window.removeEventListener('focus', onFocus);
    };
  }, [probeServer, refreshSw]);

  // Determine tone
  const isDev = BUILD_ID === 'dev';
  let tone: Tone = 'unknown';
  if (sw.state === 'waiting') {
    tone = 'update';
  } else if (serverBuildId == null) {
    tone = 'unknown';
  } else if (serverBuildId !== BUILD_ID && !isDev) {
    tone = 'update';
  } else if (sw.state === 'active') {
    tone = 'cached';
  } else {
    tone = 'live';
  }

  const styles = TONE_CLASSES[tone];

  const handleHardReload = () => {
    const url = new URL(window.location.href);
    url.searchParams.set('__r', String(Date.now()));
    window.location.replace(url.toString());
  };

  const handleApplyWaiting = () => {
    if (sw.registration?.waiting) {
      sw.registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    handleHardReload();
  };

  const handleClearCache = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      toast.success('Cache cleared. Reloading…');
    } catch {
      toast.error('Failed to clear some caches; reloading anyway');
    } finally {
      setTimeout(handleHardReload, 400);
    }
  };

  const versionText = isDev ? 'dev' : `v${formatBuildId(BUILD_ID)}`;
  const loadedAgo = relativeTime(BUILD_LOADED_AT);
  const checkedAgo = lastChecked ? relativeTime(lastChecked) : 'never';

  const swLabel = (() => {
    switch (sw.state) {
      case 'waiting':
        return 'New version waiting';
      case 'active':
        return 'Active (serving cache)';
      case 'none':
        return 'No service worker';
      case 'unsupported':
        return 'Not supported';
    }
  })();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={`Build status: ${styles.label}`}
          className={cn(
            'inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors hover:opacity-90 active:opacity-80',
            'min-h-[36px]',
            styles.pill,
          )}
        >
          <span className={cn('h-2 w-2 rounded-full', styles.dot)} />
          <span className="hidden sm:inline">{styles.label}</span>
          <span className="hidden sm:inline opacity-70">·</span>
          <span className="hidden md:inline">{versionText}</span>
          <span className="sm:hidden">{styles.label.split(' ')[0]}</span>
          {checking && <Loader2 className="h-3 w-3 animate-spin opacity-70" />}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-4">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            {tone === 'update' ? (
              <AlertTriangle className="h-4 w-4 text-sky-500 mt-0.5" />
            ) : tone === 'cached' ? (
              <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5" />
            ) : (
              <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {styles.label}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {tone === 'update' &&
                  'A newer deploy is available. Reload to apply it.'}
                {tone === 'cached' &&
                  'You are running a service-worker cached build. Latest deploy matches, but reload if changes look stale.'}
                {tone === 'live' &&
                  'You are on the latest build. Changes are live.'}
                {tone === 'unknown' && 'Checking server for the latest build…'}
              </p>
            </div>
          </div>

          <div className="rounded-md border bg-muted/30 p-2.5 text-xs space-y-1.5">
            <Row label="This tab" value={versionText} />
            <Row
              label="Latest on server"
              value={
                serverBuildId
                  ? serverBuildId === 'dev'
                    ? 'dev'
                    : `v${formatBuildId(serverBuildId)}`
                  : '—'
              }
            />
            <Row label="Loaded" value={loadedAgo} />
            <Row label="Last check" value={checkedAgo} />
            <Row label="Service worker" value={swLabel} />
          </div>

          <div className="flex flex-col gap-2">
            {tone === 'update' && sw.state === 'waiting' && (
              <Button
                size="sm"
                className="w-full h-10"
                onClick={handleApplyWaiting}
              >
                <RotateCw className="h-4 w-4 mr-2" />
                Apply update & reload
              </Button>
            )}
            <div className="grid grid-cols-2 gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-10"
                disabled={checking}
                onClick={() => {
                  probeServer();
                  refreshSw();
                }}
              >
                <RefreshCw
                  className={cn(
                    'h-3.5 w-3.5 mr-1.5',
                    checking && 'animate-spin',
                  )}
                />
                Check
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-10"
                onClick={handleHardReload}
              >
                <RotateCw className="h-3.5 w-3.5 mr-1.5" />
                Hard reload
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              className="h-10 text-destructive hover:text-destructive"
              onClick={handleClearCache}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
              Clear cache & reload
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const Row = ({ label, value }: { label: string; value: string }) => (
  <div className="flex items-center justify-between gap-2">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-mono text-foreground truncate max-w-[60%] text-right">
      {value}
    </span>
  </div>
);

export default BuildStatusIndicator;
