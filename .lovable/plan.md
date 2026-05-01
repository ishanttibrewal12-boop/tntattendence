# Apple-clean — extend across the rest of the app

Phase 1 took care of tokens, fonts, the landing hero, and a new shadcn sidebar. The ERP shell and core UI primitives still look heavier than the landing. This plan finishes the job.

What stays untouched: all data, business logic, routing, the Login page (intentionally "Premium Industrial" per memory), and every section's internal feature behavior.

---

## 1. UI primitives (used everywhere)

**`src/components/ui/card.tsx`** — Switch from `rounded-xl shadow-sm` to flat `rounded-2xl border border-border` with no default shadow. Tighten `CardTitle` to `text-xl tracking-[-0.022em]` (Apple-style). Soften `CardDescription` line-height.

**`src/components/ui/input.tsx`** — Hairline `border-border`, `rounded-lg`, soft placeholder color, focus ring narrows to 1px offset + amber, no jarring blue ring.

**`src/components/ui/badge.tsx`** — Default = solid black on white (Apple chip), `secondary` = light gray, `destructive` = soft red tint, `outline` = hairline border. Lower font weight to `medium`, smaller `text-[11px]`.

These three are imported by ~80% of the ERP and immediately quiet down every screen.

---

## 2. ERP shell — `src/pages/Home.tsx`

Touch only the chrome (header, mobile bottom nav, department cards). All section content stays as-is.

**Header** (`renderHeader`)
- Drop the green pulsing "Live" pill.
- Title → `text-base font-semibold tracking-tight`.
- Date → `text-xs text-muted-foreground`.
- Border becomes `border-border` (hairline), keep `glass-header`.

**Department cards** (`renderDepartmentContent`)
- Replace `bg-primary glow-accent` icon tile with `bg-muted` + `text-foreground` icon.
- Replace `bg-primary/10` secondary icon tile with `bg-muted` + `text-foreground/70`.
- Cards: keep `border border-border`, drop `glow-accent`, lighten radius to `rounded-2xl`.
- Section labels → `text-[10px] font-medium uppercase tracking-[0.14em] text-muted-foreground` (drop `font-bold`).
- Reduce framer-motion stagger durations (snappier 0.2s vs 0.3s).

**Mobile bottom nav** (`MobileBottomNav`)
- Use `glass-header` with hairline top border.
- Active tab → `text-foreground` with a small amber dot indicator above the label, instead of full amber text fill.
- Drop the heavy `backdrop-blur-sm bg-foreground/30` overlay → use `bg-foreground/10`.

**Sidebar nav items** (existing `SidebarNavItem`)
- Already amber via `.sidebar-glow` (updated last turn). Drop `whileHover x:3` micro-shift to be more restrained.

---

## 3. Memory

Append a small note to `mem://design/apple-clean-aesthetic` clarifying it applies to ALL surfaces except Login (which keeps its dedicated "Premium Industrial" treatment per `mem://style/login-ui`).

---

## Files touched

- `src/components/ui/card.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/badge.tsx`
- `src/pages/Home.tsx` (only `renderHeader`, `renderDepartmentContent`, `MobileBottomNav`, `SidebarNavItem`)
- `mem://design/apple-clean-aesthetic` (clarification)

No data, route, auth, or section-level logic is modified. Approve to apply.