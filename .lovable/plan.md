# Plan: Smarter upload-error hints + visible UI/UX refresh

You raised two things:

1. The troubleshooting panel is generic — it should call out the **exact browser permission and storage settings** to check when the failure is a permission or quota error.
2. Despite all the recent backend work, the **interface still looks the same**. The new features (profile tools, file creation flow, troubleshooting) need a real visual refresh so they feel like a new experience, not the same screen.

Below is what I will change.

---

## 1. Classify the upload error and show specific guidance

In `src/components/sections/FileManagerSection.tsx` (`persistCreatedBlob` + `handleCreateNewFile`):

- Inspect the error object (`statusCode`, `error`, `message`) returned by Supabase Storage and the browser.
- Classify into one of:
  - `permission` — 401 / 403 / "row-level security" / "not authorized" / "Bucket not found"
  - `quota` — 413 / "Payload too large" / "exceeded" / `QuotaExceededError` / "storage is full"
  - `network` — `Failed to fetch`, offline, timeout
  - `validation` — blob built but failed `validateGeneratedFile`
  - `unknown` — fallback

- Pass this `category` into `NewFileTroubleshootingState` so the dialog can render a tailored hint block.

## 2. New troubleshooting hint block in `NewFileDialog.tsx`

When category is **permission**, show a checklist:
- Browser → Site settings for this site:
  - **Cookies**: Allow (third-party cookies must not be blocked for this origin)
  - **JavaScript**: Allowed
  - **Pop-ups and redirects**: Allowed (needed for local-first download)
  - **Insecure content**: Blocked is fine; site must stay on HTTPS
- App-level:
  - You are signed in as Manager (Abhay) — only Manager can create files
  - Re-login if your session expired (top-right → Logout → Login)
- Private/Incognito mode disables IndexedDB/localStorage in some browsers — open in a normal window

When category is **quota**, show:
- Browser storage quota:
  - Chrome/Edge: `chrome://settings/content/all` → find this site → check "Usage" → click **Clear data**
  - Firefox: Settings → Privacy & Security → Cookies and Site Data → **Manage Data** → remove this site
  - Safari: Settings → Privacy → Manage Website Data → remove this site
- App-side storage:
  - File Manager → Storage usage widget — if &gt; 90%, archive or delete older files
  - Try the **Local first** button to confirm your machine can at least save locally
- Hard cap: single file upload limit is ~50 MB; split large files

When category is **network**, show: check connection, disable VPN/ad-blocker for this origin, retry.

Each block uses a clean checklist style (icons + monospace for the exact setting paths) so it's visibly different from the old generic panel.

## 3. Visible UI/UX refresh — so the change is obvious

This is the part you said is missing. I will redesign the surfaces that host the new features so they actually look new:

### `ProfileSection.tsx` (Abhay's profile page)
- New **hero header card**: gradient (slate→indigo), large avatar circle with initials, role badge, "Last login" pill with relative time, and an inline **Sign out** button.
- New **stats strip**: 3 premium cards — Active Staff, Pending Advances, Today's Attendance — with `AnimatedNumber`, icon tiles, and subtle hover lift (matches Corporate Dashboard styling already in the project).
- New **Manager Tools** band (Manager-only): three large pill-buttons in a row —
  - **Today's Salary Slips** (Excel + Word)
  - **Bulk Salary Update**
  - **Custom Range Reports**
  Each with icon, one-line description, and loading state.
- Quick Links converted from a flat list to a **3-column responsive grid of icon tiles** with the existing `tone` colors as soft backgrounds, hover scale, and a right-arrow that slides on hover.
- Sticky section breadcrumb at top: Home / Profile.

### `FileManagerSection.tsx` (file creation surface)
- Replace the small "+ New" dropdown trigger with a **prominent split button**: "New" + caret, in primary color, top-right of the toolbar.
- New empty-state panel when a folder has no files: illustration block + two CTAs ("New Document", "New Sheet") + "Upload" — instead of the current bare list.
- Toolbar gets a refreshed pill layout (search, filter, view toggle, new) with consistent 40px height and rounded-xl.

### `NewFileDialog.tsx`
- Header gets a small gradient strip + icon matching the selected kind (blue for Word, emerald for Excel) so the dialog visibly responds to the toggle.
- Template cards become **2-column grid** with icon + title + description, selected state shows a check badge.
- Footer buttons re-grouped: primary **Create** on the right, secondary **Download blank first** on the left, and a tertiary **Upload my own template** link below — replacing the current single row that looks identical to the old dialog.
- Troubleshooting panel restyled: amber border, category badge ("Permission issue" / "Storage quota" / "Network"), checklist with copyable code snippets for the browser settings paths.

### Toast feedback (sonner)
- Failure toasts now render with a **title + description + action button**: title = `Couldn't create file (step: upload)`, description = short cause, action = "Open troubleshooting" which scrolls/focuses the panel inside the still-open dialog.

## 4. Technical details

Files to edit:
- `src/components/sections/FileManagerSection.tsx` — error classifier (`classifyCreateError`), pass `category` into troubleshooting state, refreshed toolbar + empty state, split "New" button.
- `src/components/file-manager/NewFileDialog.tsx` — new `category` prop in `NewFileTroubleshootingState`, category-specific hint blocks, redesigned header / template grid / footer.
- `src/components/sections/ProfileSection.tsx` — hero card, stats strip, Manager Tools band, quick-links grid redesign.
- (No DB migration, no new dependencies.)

New type shape (illustrative):

```text
NewFileTroubleshootingState {
  step: 'build blob' | 'upload' | 'metadata'
  category: 'permission' | 'quota' | 'network' | 'validation' | 'unknown'
  message: string
  expectedKind: 'docx' | 'xlsx'
  retryAttempted: boolean
  retryFailed?: boolean
  retryMessage?: string
}
```

Classifier logic outline:

```text
if status in (401, 403) or /not authorized|row-level|permission/i  -> permission
else if status == 413 or /quota|exceeded|payload too large|storage is full/i or name == 'QuotaExceededError' -> quota
else if /failed to fetch|networkerror|timeout|offline/i or !navigator.onLine -> network
else if step == 'build blob' and validation failed -> validation
else -> unknown
```

## 5. Out of scope

- No changes to Supabase schema, RLS, or buckets.
- No changes to `DocxEditor` / `XlsxEditor` internals.
- No changes to `payrollDocs.ts` generation logic.

Once you approve, I'll implement all of the above in one pass and you'll see the Profile page, File Manager toolbar, and New File dialog visibly change.
