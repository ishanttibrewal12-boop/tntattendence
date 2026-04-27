import { useCallback, useEffect, useRef, useState } from 'react';
import {
  BUILD_ID,
  BUILD_LOADED_AT,
  fetchServerBuildId,
} from '@/lib/build-info';

export type BuildTone = 'live' | 'cached' | 'update' | 'unknown';

export type SwLifecycle =
  | 'none'
  | 'installing'
  | 'installed-waiting'
  | 'activating'
  | 'active'
  | 'redundant'
  | 'unsupported';

export interface BuildStatus {
  // Build / version
  buildId: string;
  serverBuildId: string | null;
  isDev: boolean;
  mode: 'development' | 'production';
  assetSource: 'service-worker' | 'cache-storage' | 'network' | 'unknown';

  // Tab
  loadedAt: Date;
  lastChecked: Date | null;
  lastUpdateDetectedAt: Date | null;
  lastUpdateAppliedAt: Date | null;
  checking: boolean;

  // Service Worker
  sw: {
    lifecycle: SwLifecycle;
    hasController: boolean;
    waiting: boolean;
    scope: string | null;
    registration: ServiceWorkerRegistration | null;
  };

  tone: BuildTone;

  // Actions
  probeServer: () => Promise<void>;
  refreshSw: () => Promise<void>;
  hardReload: () => void;
  applyWaiting: () => Promise<void>;
  clearCachesAndReload: () => Promise<void>;
}

const POLL_INTERVAL = 60_000;
const LS_LAST_DETECTED = 'lvbl_build_last_detected';
const LS_LAST_APPLIED = 'lvbl_build_last_applied';

function readDate(key: string): Date | null {
  try {
    const v = localStorage.getItem(key);
    if (!v) return null;
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

function writeDate(key: string, d: Date) {
  try {
    localStorage.setItem(key, d.toISOString());
  } catch {
    /* ignore */
  }
}

function deriveLifecycle(reg: ServiceWorkerRegistration | null): SwLifecycle {
  if (!reg) return 'none';
  if (reg.installing) return 'installing';
  if (reg.waiting) return 'installed-waiting';
  if (reg.active?.state === 'activating') return 'activating';
  if (reg.active?.state === 'activated') return 'active';
  if (reg.active?.state === 'redundant') return 'redundant';
  return 'none';
}

function deriveAssetSource(
  hasController: boolean,
  lifecycle: SwLifecycle,
): BuildStatus['assetSource'] {
  if (lifecycle === 'unsupported') return 'network';
  if (hasController) return 'service-worker';
  if (lifecycle === 'active' || lifecycle === 'installed-waiting') {
    return 'cache-storage';
  }
  return 'network';
}

export function useBuildStatus(): BuildStatus {
  const [serverBuildId, setServerBuildId] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [checking, setChecking] = useState(false);
  const [lastDetected, setLastDetected] = useState<Date | null>(() =>
    readDate(LS_LAST_DETECTED),
  );
  const [lastApplied, setLastApplied] = useState<Date | null>(() =>
    readDate(LS_LAST_APPLIED),
  );
  const [reg, setReg] = useState<ServiceWorkerRegistration | null>(null);
  const [, force] = useState(0);
  const mounted = useRef(true);
  const lastSeenServerId = useRef<string | null>(null);

  // Tick every 30s so relative-time strings stay current.
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

      // Detect transition: server id changed AND differs from our bundle.
      if (id && id !== BUILD_ID && lastSeenServerId.current !== id) {
        const now = new Date();
        setLastDetected(now);
        writeDate(LS_LAST_DETECTED, now);
      }
      lastSeenServerId.current = id;
    } finally {
      if (mounted.current) setChecking(false);
    }
  }, []);

  const refreshSw = useCallback(async () => {
    if (!('serviceWorker' in navigator)) {
      setReg(null);
      return;
    }
    try {
      const r = await navigator.serviceWorker.getRegistration();
      setReg(r ?? null);
    } catch {
      setReg(null);
    }
  }, []);

  // Subscribe to SW lifecycle events for live updates.
  useEffect(() => {
    if (!reg) return;
    const tickReg = () => force((n) => n + 1);

    const onUpdateFound = () => {
      const sw = reg.installing;
      if (sw) sw.addEventListener('statechange', tickReg);
      tickReg();
    };
    reg.addEventListener('updatefound', onUpdateFound);
    reg.installing?.addEventListener('statechange', tickReg);
    reg.waiting?.addEventListener('statechange', tickReg);
    reg.active?.addEventListener('statechange', tickReg);

    return () => {
      reg.removeEventListener('updatefound', onUpdateFound);
    };
  }, [reg]);

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
    const onOnline = () => {
      probeServer();
      refreshSw();
    };
    const onControllerChange = () => {
      const now = new Date();
      setLastApplied(now);
      writeDate(LS_LAST_APPLIED, now);
      refreshSw();
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener(
        'controllerchange',
        onControllerChange,
      );
    }

    return () => {
      mounted.current = false;
      clearInterval(t);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener(
          'controllerchange',
          onControllerChange,
        );
      }
    };
  }, [probeServer, refreshSw]);

  const lifecycle: SwLifecycle = !('serviceWorker' in navigator)
    ? 'unsupported'
    : deriveLifecycle(reg);

  const hasController = !!navigator.serviceWorker?.controller;
  const assetSource = deriveAssetSource(hasController, lifecycle);
  const isDev = BUILD_ID === 'dev' || import.meta.env.DEV;
  const mode: 'development' | 'production' = isDev ? 'development' : 'production';

  let tone: BuildTone = 'unknown';
  if (lifecycle === 'installed-waiting') {
    tone = 'update';
  } else if (serverBuildId == null) {
    tone = 'unknown';
  } else if (serverBuildId !== BUILD_ID && BUILD_ID !== 'dev') {
    tone = 'update';
  } else if (lifecycle === 'active' && hasController) {
    tone = 'cached';
  } else {
    tone = 'live';
  }

  const hardReload = useCallback(() => {
    const url = new URL(window.location.href);
    url.searchParams.set('__r', String(Date.now()));
    window.location.replace(url.toString());
  }, []);

  const applyWaiting = useCallback(async () => {
    if (reg?.waiting) {
      reg.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
    const now = new Date();
    setLastApplied(now);
    writeDate(LS_LAST_APPLIED, now);
    setTimeout(hardReload, 200);
  }, [reg, hardReload]);

  const clearCachesAndReload = useCallback(async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        await Promise.all(regs.map((r) => r.unregister()));
      }
      const now = new Date();
      setLastApplied(now);
      writeDate(LS_LAST_APPLIED, now);
    } finally {
      setTimeout(hardReload, 250);
    }
  }, [hardReload]);

  return {
    buildId: BUILD_ID,
    serverBuildId,
    isDev,
    mode,
    assetSource,
    loadedAt: BUILD_LOADED_AT,
    lastChecked,
    lastUpdateDetectedAt: lastDetected,
    lastUpdateAppliedAt: lastApplied,
    checking,
    sw: {
      lifecycle,
      hasController,
      waiting: lifecycle === 'installed-waiting',
      scope: reg?.scope ?? null,
      registration: reg,
    },
    tone,
    probeServer,
    refreshSw,
    hardReload,
    applyWaiting,
    clearCachesAndReload,
  };
}
