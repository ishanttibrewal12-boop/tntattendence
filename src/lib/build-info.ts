/**
 * Build metadata baked into the bundle at build time via Vite `define`.
 * Used by the File Manager Build Status indicator to detect stale caches.
 */
export const BUILD_ID: string =
  typeof __BUILD_ID__ !== 'undefined' ? __BUILD_ID__ : 'dev';

export const BUILD_LOADED_AT = new Date();

/**
 * Fetches the freshly-deployed build id by re-downloading index.html
 * (bypassing both browser cache and any active service worker) and
 * reading the <meta name="build-id"> tag.
 */
export async function fetchServerBuildId(): Promise<string | null> {
  try {
    const url = `/index.html?ts=${Date.now()}`;
    const res = await fetch(url, {
      cache: 'no-store',
      // bypass SW
      headers: { 'cache-control': 'no-cache' },
    });
    if (!res.ok) return null;
    const html = await res.text();
    const match = html.match(
      /<meta\s+name=["']build-id["']\s+content=["']([^"']+)["']/i,
    );
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

/** Human-friendly short version, e.g. "20260427-1542". */
export function formatBuildId(id: string): string {
  // Expecting an ISO timestamp; collapse to YYYYMMDD-HHMM
  const d = new Date(id);
  if (Number.isNaN(d.getTime())) return id.slice(0, 16);
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}` +
    `-${pad(d.getHours())}${pad(d.getMinutes())}`
  );
}

export function relativeTime(from: Date, to: Date = new Date()): string {
  const diff = Math.max(0, to.getTime() - from.getTime());
  const s = Math.floor(diff / 1000);
  if (s < 5) return 'just now';
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}
