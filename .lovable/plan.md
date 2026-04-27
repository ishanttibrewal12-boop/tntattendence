## Goal

Expand the existing File Manager build/version pill into a **full status panel + visible banner** that tells you, at a glance:

- Service Worker lifecycle state (installing / installed-waiting / activating / active / redundant / none)
- Whether the preview is in **dev** or **production** mode
- Which **asset source** is serving the page right now (Service Worker, Cache Storage, or Network)
- The **last time an update was detected** vs. the **last time an update was applied** (persisted across refreshes)
- A one-click **"Refresh & Clear Cache"** button that nukes caches + unregisters SWs + hard-reloads
- A **dismissible banner** above the file list that appears whenever the bundle is stale or a new version is waiting

## What you'll see

### 1. Banner (only when needed)
A full-width strip at the top of the File Manager content area, color-coded:

```text
┌────────────────────────────────────────────────────────────────────────┐
│ ⓘ  Update ready · v20260427-1542 → v20260427-1610                      │
│    A newer build is available. Your UI may show stale data.            │
│    [ Apply update ]  [ Refresh & Clear Cache ]   [ × dismiss ]         │
└────────────────────────────────────────────────────────────────────────┘
```

- **Blue** when a newer build is detected on the server OR a SW is `waiting`
- **Amber** when SW is serving cache and we cannot confirm freshness
- **Hidden** when on a live, fresh build (or user dismissed for this version)

### 2. Status panel (popover from the existing pill)
Reorganized into three labeled sections, all visible at once:

```text
┌─────────────────────── Build ────────────────────────┐
│ This tab          v20260427-1542                     │
│ Latest on server  v20260427-1610  (newer)            │
│ Mode              production · prod assets           │
│ Asset source      Service Worker (cached)            │
├─────────────────── Service Worker ───────────────────┤
│ State             ● Installed — waiting to activate  │
│ Controller        Yes (this page is under SW)        │
│ Scope             /                                   │
├──────────────────── Timeline ────────────────────────┤
│ Tab loaded        4m ago                             │
│ Last server check 12s ago                            │
│ Update detected   2m ago                             │
│ Update applied    yesterday 18:42                    │
└──────────────────────────────────────────────────────┘
[ Apply update & reload ]  [ Check now ]  [ Hard reload ]
[ 🗑 Refresh & Clear Cache ]
```

## Detection logic

Centralized into a new shared hook `useBuildStatus()` so the pill, banner, and any future surface read from one source of truth.

- **Build identity** — `BUILD_ID` baked at build time (already done in last task) compared against the server's `<meta name="build-id">` polled every 60s, on `focus`, and on `online`.
- **SW lifecycle** — derived from `registration.installing | waiting | active.state`. Subscribes to `updatefound` and `statechange` events for live updates.
- **Asset source** — inferred:
  - `navigator.serviceWorker.controller != null` → **Service Worker**
  - SW exists but page predates it → **Cache Storage** (will be SW-controlled on next nav)
  - No SW → **Network**
- **Mode label** — `import.meta.env.DEV` + `BUILD_ID === 'dev'` → "development"; otherwise "production".
- **Last detected / applied** — persisted to `localStorage` so timestamps survive refreshes.
  - "Detected" set when the polled server id first differs from our bundle id.
  - "Applied" set on `controllerchange` (a new SW just took control) or after a manual `Apply update` / `Clear Cache` action.

## Files to add / change

**New**
- `src/lib/file-manager/useBuildStatus.ts` — the shared hook (lifecycle, polling, SW listeners, persistence, actions: `probeServer`, `applyWaiting`, `hardReload`, `clearCachesAndReload`).
- `src/components/file-manager/BuildStatusBanner.tsx` — the dismissible top banner. Dismissal is keyed by `serverBuildId` so a newer build re-shows the banner.

**Edited**
- `src/components/file-manager/BuildStatusIndicator.tsx` — refactor to consume `useBuildStatus()`; expand popover into the three-section layout above; add **Refresh & Clear Cache** as a primary destructive action.
- `src/components/sections/FileManagerSection.tsx` — render `<BuildStatusBanner />` directly above the file list (below the sticky toolbar).

## Mobile considerations

- Banner stacks vertically on screens < 640px, with full-width 44px buttons.
- Popover already uses Radix Popover which positions safely on mobile; max-width capped at `92vw`.
- "Refresh & Clear Cache" gets a confirmation toast on mobile (single tap = action; toast offers Undo for 4s).

## Out of scope

- No changes to the actual SW caching strategy in `vite.config.ts` (last task left it intentionally untouched).
- No global header banner — scoped to File Manager as previously requested. Easy to lift later.

## Acceptance

- Visiting File Manager shows the pill in green when fresh, amber when SW-cached, blue with banner when an update is detected.
- The popover always shows: SW lifecycle word, dev/prod label, asset-source label, "detected" and "applied" timestamps.
- Clicking **Refresh & Clear Cache** wipes all caches, unregisters SWs, and reloads — pill returns green within ~2s.
- After a new deploy lands while the tab is open, the banner appears within 60s, "Update detected" timestamp updates, and applying the update sets "Update applied" to "just now".