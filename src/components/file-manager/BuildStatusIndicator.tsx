import {
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  RotateCw,
  Loader2,
  Server,
  Cloud,
  HardDrive,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatBuildId, relativeTime } from '@/lib/build-info';
import {
  useBuildStatus,
  type BuildTone,
  type SwLifecycle,
} from '@/lib/file-manager/useBuildStatus';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const TONE_CLASSES: Record<BuildTone, { dot: string; pill: string; label: string }> = {
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

const SW_LABELS: Record<SwLifecycle, { label: string; tone: BuildTone }> = {
  none: { label: 'No service worker', tone: 'live' },
  installing: { label: 'Installing new version…', tone: 'update' },
  'installed-waiting': { label: 'Installed — waiting to activate', tone: 'update' },
  activating: { label: 'Activating…', tone: 'update' },
  active: { label: 'Active', tone: 'cached' },
  redundant: { label: 'Redundant (will refresh)', tone: 'update' },
  unsupported: { label: 'Not supported in this browser', tone: 'live' },
};

const ASSET_LABELS = {
  'service-worker': { label: 'Service Worker', icon: Server },
  'cache-storage': { label: 'Cache Storage', icon: HardDrive },
  network: { label: 'Network (live)', icon: Cloud },
  unknown: { label: 'Unknown', icon: Globe },
} as const;

const formatExact = (d: Date | null) =>
  d ? `${format(d, 'MMM d, HH:mm')} · ${relativeTime(d)}` : '—';

const BuildStatusIndicator = () => {
  const status = useBuildStatus();
  const styles = TONE_CLASSES[status.tone];

  const versionText =
    status.buildId === 'dev' ? 'dev' : `v${formatBuildId(status.buildId)}`;
  const serverVersionText = status.serverBuildId
    ? status.serverBuildId === 'dev'
      ? 'dev'
      : `v${formatBuildId(status.serverBuildId)}`
    : '—';
  const serverIsNewer =
    !!status.serverBuildId &&
    status.serverBuildId !== status.buildId &&
    status.buildId !== 'dev';

  const swInfo = SW_LABELS[status.sw.lifecycle];
  const AssetIcon = ASSET_LABELS[status.assetSource].icon;

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
          <span className="hidden md:inline font-mono">{versionText}</span>
          <span className="sm:hidden">{styles.label.split(' ')[0]}</span>
          {status.checking && (
            <Loader2 className="h-3 w-3 animate-spin opacity-70" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        className="w-[min(92vw,360px)] p-0 overflow-hidden"
      >
        {/* Header */}
        <div
          className={cn(
            'px-4 py-3 border-b flex items-start gap-2.5',
            status.tone === 'update' && 'bg-sky-500/5',
            status.tone === 'cached' && 'bg-amber-500/5',
            status.tone === 'live' && 'bg-emerald-500/5',
          )}
        >
          {status.tone === 'update' || status.tone === 'cached' ? (
            <AlertTriangle
              className={cn(
                'h-4 w-4 mt-0.5 shrink-0',
                status.tone === 'update' ? 'text-sky-500' : 'text-amber-500',
              )}
            />
          ) : (
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-emerald-500" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-foreground">
              {styles.label}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
              {status.tone === 'update' &&
                'A newer build is available. Apply or hard reload to get the latest UI.'}
              {status.tone === 'cached' &&
                'You are running an SW-cached build. Latest deploy still matches; reload if anything looks stale.'}
              {status.tone === 'live' &&
                'You are on the latest build. Changes are live.'}
              {status.tone === 'unknown' && 'Checking server for the latest build…'}
            </p>
          </div>
        </div>

        {/* Sections */}
        <div className="px-4 py-3 space-y-4 text-xs">
          {/* Build */}
          <Section title="Build">
            <Row label="This tab" value={versionText} mono />
            <Row
              label="Latest on server"
              value={
                <span className="font-mono">
                  {serverVersionText}
                  {serverIsNewer && (
                    <span className="ml-1.5 text-sky-600 dark:text-sky-400 font-sans not-italic">
                      (newer)
                    </span>
                  )}
                </span>
              }
            />
            <Row
              label="Mode"
              value={
                <span
                  className={cn(
                    'inline-flex items-center gap-1.5 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide',
                    status.isDev
                      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
                  )}
                >
                  {status.mode}
                </span>
              }
            />
            <Row
              label="Asset source"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <AssetIcon className="h-3 w-3" />
                  {ASSET_LABELS[status.assetSource].label}
                </span>
              }
            />
          </Section>

          {/* Service Worker */}
          <Section title="Service Worker">
            <Row
              label="State"
              value={
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className={cn(
                      'h-1.5 w-1.5 rounded-full',
                      TONE_CLASSES[swInfo.tone].dot,
                    )}
                  />
                  {swInfo.label}
                </span>
              }
            />
            <Row
              label="Controller"
              value={status.sw.hasController ? 'Yes (page is under SW)' : 'No'}
            />
            {status.sw.scope && (
              <Row label="Scope" value={status.sw.scope} mono />
            )}
          </Section>

          {/* Timeline */}
          <Section title="Timeline">
            <Row label="Tab loaded" value={relativeTime(status.loadedAt)} />
            <Row
              label="Last server check"
              value={status.lastChecked ? relativeTime(status.lastChecked) : 'never'}
            />
            <Row
              label="Update detected"
              value={formatExact(status.lastUpdateDetectedAt)}
              muted={!status.lastUpdateDetectedAt}
            />
            <Row
              label="Update applied"
              value={formatExact(status.lastUpdateAppliedAt)}
              muted={!status.lastUpdateAppliedAt}
            />
          </Section>
        </div>

        {/* Actions */}
        <div className="px-4 pb-4 pt-1 space-y-2">
          {status.sw.waiting && (
            <Button
              size="sm"
              className="w-full h-10"
              onClick={() => status.applyWaiting()}
            >
              <RotateCw className="h-4 w-4 mr-2" />
              Apply update &amp; reload
            </Button>
          )}
          <div className="grid grid-cols-2 gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-10"
              disabled={status.checking}
              onClick={() => {
                status.probeServer();
                status.refreshSw();
              }}
            >
              <RefreshCw
                className={cn(
                  'h-3.5 w-3.5 mr-1.5',
                  status.checking && 'animate-spin',
                )}
              />
              Check now
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-10"
              onClick={() => status.hardReload()}
            >
              <RotateCw className="h-3.5 w-3.5 mr-1.5" />
              Hard reload
            </Button>
          </div>
          <Button
            size="sm"
            variant="destructive"
            className="w-full h-10"
            onClick={() => status.clearCachesAndReload()}
          >
            <Trash2 className="h-3.5 w-3.5 mr-1.5" />
            Refresh &amp; Clear Cache
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div>
    <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70 mb-1.5">
      {title}
    </p>
    <div className="space-y-1.5 rounded-md border bg-muted/30 px-2.5 py-2">
      {children}
    </div>
  </div>
);

const Row = ({
  label,
  value,
  mono,
  muted,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  muted?: boolean;
}) => (
  <div className="flex items-center justify-between gap-2 leading-snug">
    <span className="text-muted-foreground shrink-0">{label}</span>
    <span
      className={cn(
        'truncate max-w-[65%] text-right',
        mono && 'font-mono',
        muted ? 'text-muted-foreground/60' : 'text-foreground',
      )}
    >
      {value}
    </span>
  </div>
);

export default BuildStatusIndicator;
