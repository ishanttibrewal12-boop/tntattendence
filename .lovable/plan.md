## Goal

Add a small, always-visible **Build Status indicator** at the top of the File Manager that instantly tells you whether you are running the freshest build or a stale PWA-cached version — so you never have to guess after a hard refresh.

## What you'll see

A compact pill-badge in the File Manager header (next to the breadcrumbs / search bar), with three possible states:

```text
[ ● Live build · v20260427-1542 · just now ]      green   = fresh
[ ● Cached build · v20260427-1140 · 4h old ]      amber   = stale SW cache
[ ● Update ready · click to reload ]              blue    = new SW waiting
```

Tapping the pill opens a small popover with:
- **Build version** (timestamp baked in at build time)
- **Loaded at** (when this tab booted)
- **Service Worker status** (active / waiting / none / unregistered-in-preview)
- **Last server check** (relative time)
- Buttons: **Check for updates**, **Hard reload**, **Clear cache & reload**

## How "fresh vs cached" is detected

1. **Build stamp** — Vite injects `__BUILD_ID__` (a timestamp) at build time via `define` in `vite.config.ts`. This value is frozen into the JS bundle.
2. **Server probe** — On mount and every 60s, the indicator fetches `/index.html?ts=<now>` with `cache: 'no-store'` and parses a `<meta name="build-id">` tag.
   - If the server's build ID **matches** `__BUILD_ID__` → green "Live build".
   - If they **differ** → blue "Update ready" (a newer deploy exists; user is on older JS).
3. **Service Worker check** — `navigator.serviceWorker.getRegistration()`:
   - If a SW is **active and controlling** the page → amber "Cached build" tag added.
   - If `registration.waiting` exists → blue "Update ready, click to reload" (calls `skipWaiting` + `location.reload()` on click).
   - In Lovable preview / iframe (already unregistered in `main.tsx`) → shows "No SW (preview)".

This combination removes the ambiguity: green = definitely fresh JS, amber = served by SW cache, blue = newer build available.

## Actions in the popover

- **Check for updates** — re-runs the server probe immediately.
- **Hard reload** — `location.reload()` with a cache-busting query param.
- **Clear cache & reload** — calls `caches.keys()` → `caches.delete()` for all caches, unregisters any SW, then reloads. This is the nuclear option for stuck PWA cache.

## Files to add / change

**New**
- `src/components/file-manager/BuildStatusIndicator.tsx` — the pill + popover UI, polling logic, SW inspection, and reload actions.
- `src/lib/build-info.ts` — exports `BUILD_ID` (from `__BUILD_ID__`) and a helper `fetchServerBuildId()`.

**Edited**
- `vite.config.ts` — add `define: { __BUILD_ID__: JSON.stringify(new Date().toISOString()) }` and a TypeScript declaration.
- `index.html` — add `<meta name="build-id" content="%BUILD_ID%">`; Vite's `transformIndexHtml` hook fills `%BUILD_ID%` with the same value.
- `src/vite-env.d.ts` — declare `const __BUILD_ID__: string;`.
- `src/components/sections/FileManagerSection.tsx` — render `<BuildStatusIndicator />` in the header row, right of the search input on desktop and as a full-width strip on mobile.

## Mobile considerations

- Pill collapses to just the colored dot + status word on screens < 480px.
- Popover uses the existing `MobileFriendlyDialog` pattern so it slides up as a sheet on phones.
- All buttons are 44px tall to stay touch-friendly.

## Out of scope

- No changes to the actual service worker behavior or caching strategy — only **observation and one-click recovery**.
- Indicator is scoped to the File Manager view as you requested; can later be promoted to global header if useful.

## Acceptance

- After a fresh deploy, opening File Manager shows green "Live build" within ~2s.
- If you keep the tab open and a new deploy happens, within 60s the pill turns blue "Update ready"; one click reloads cleanly.
- If the SW is serving stale assets, the pill shows amber and "Clear cache & reload" guarantees a clean reboot.