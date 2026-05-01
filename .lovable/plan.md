# Apple-Clean Redesign + New shadcn ERP Sidebar

You've asked for two things:
1. **Drop the heavy "Industrial Premium" look** — go Apple-clean: lots of whitespace, neutral palette, one accent, restrained motion, crisp typography.
2. **Rebuild the ERP sidebar** using shadcn's collapsible `Sidebar`, with an amber active rail and proper responsive behavior.

This supersedes the previous "cinematic / amber-everywhere" direction. I'll save the new aesthetic to project memory so it sticks.

---

## 1. Aesthetic pivot — Apple-clean

**Tokens (`src/index.css`)**
- Background: pure `#FFFFFF` (light) / near-black `#0B0B0F` (dark).
- Foreground: `#0A0A0A` / `#F5F5F7`.
- Borders: hairline `#E5E5EA` / `#1F1F22` (1px, never thicker).
- Single accent: amber `#F59E0B` — used **only** for active states, primary CTA, focus ring. Not for backgrounds, gradients, or section fills.
- Remove: `--gradient-hero`, `--gradient-amber`, `industrial-grid-bg`, `grain-overlay`, `glow-pulse-amber`, `shine-on-hover`, marquee.
- Radius: `0.625rem` (Apple-ish, slightly tighter).
- Shadow: very soft, single layer (`0 1px 2px rgba(0,0,0,.04), 0 8px 24px -12px rgba(0,0,0,.08)`). No glows.

**Typography (`index.html`)**
- Replace Fraunces with **Inter** (display + body) using tight tracking on headings (`-0.022em`).
- Drop JetBrains Mono → use `ui-monospace, SF Mono` system stack.
- Big-but-quiet headings: `text-5xl md:text-7xl font-semibold tracking-tight`.

**Motion (`gsapUtils.ts` + landing sections)**
- Strip cinematic effects: no parallax, no pinned horizontal scroll, no cursor spotlight, no magnetic buttons, no word-by-word reveals.
- Keep only: gentle 400ms fade-up on section enter, 150ms hover lift on cards, smooth scroll. Respect `prefers-reduced-motion`.

**Landing sections**
- `HeroSection`: flat white, centered headline + sub, two buttons (filled black + ghost), one product image below. No background gradient.
- All sections: white/`bg-muted/30` alternation, max-w-6xl, generous `py-24/32`, no decorative shapes.
- Remove `industrial-grid-bg` and `grain-overlay` from all components currently using them.

---

## 2. ERP sidebar rebuild (shadcn collapsible)

**Important context**: the live ERP runs from `src/pages/Home.tsx` and uses **internal section state**, not React Router routes. The existing `src/components/layout/Sidebar.tsx` + `DashboardLayout.tsx` appear unused by the actual `/dashboard` route. So the rebuild must happen inside `Home.tsx`.

### Approach
Create `src/components/layout/AppSidebar.tsx` using shadcn `Sidebar` primitives (already present at `src/components/ui/sidebar.tsx`), driven by the `activeSection` state from `Home.tsx` instead of `useLocation`.

```text
SidebarProvider
├── AppSidebar (collapsible="icon")
│   ├── SidebarHeader   → logo + brand (hides label when collapsed)
│   ├── SidebarContent
│   │   ├── Group: Overview        (Dashboard)
│   │   ├── Group: Departments     (Petroleum, Crusher, MLT, Tyres & Office)
│   │   ├── Group: Operations      (Attendance, Salary, Advances, Daily Report…)
│   │   └── Group: Tools           (Files, Calculator, Reminders, Backup, Settings)
│   └── SidebarFooter   → user chip + theme toggle + logout
└── SidebarInset
    ├── header: SidebarTrigger + breadcrumb + NotificationBell + GlobalSearch
    └── main: <section content>
```

### Behavior
- `collapsible="icon"` — collapses to a 56px icon rail (never disappears on desktop).
- Mobile (<768px): `Sheet`-based off-canvas (built into shadcn Sidebar) opened via `SidebarTrigger` in the top bar.
- Active item = `activeSection === item.id`. Use `SidebarMenuButton isActive={...}` so shadcn handles base styling, then add the **amber rail**:
  ```css
  [data-sidebar="menu-button"][data-active="true"]::before {
    content: ""; position: absolute; left: 0; top: 8px; bottom: 8px;
    width: 3px; border-radius: 0 3px 3px 0;
    background: hsl(var(--accent)); /* amber */
  }
  ```
- Section labels (`SidebarGroupLabel`) hide when collapsed; tooltips appear on icon hover (shadcn provides `tooltip` prop on `SidebarMenuButton`).
- Keyboard: `Cmd/Ctrl+B` toggles sidebar (built-in).
- Persist collapsed state in `localStorage` via `SidebarProvider`'s `defaultOpen`.

### Wiring in `Home.tsx`
- Replace the current custom drawer/menu rendering with `<SidebarProvider><AppSidebar onSelect={setActiveSection} active={activeSection} /><SidebarInset>…</SidebarInset></SidebarProvider>`.
- Keep all existing section logic, lazy imports, and data flow untouched.
- Remove the custom mobile menu code that's now handled by shadcn.

---

## Files touched

**Edit**
- `src/index.css` — token rewrite, remove industrial utilities
- `tailwind.config.ts` — drop custom keyframes (shimmer/text-reveal/marquee), keep simple fade-up
- `index.html` — swap fonts to Inter only
- `src/lib/motion/gsapUtils.ts` — strip to fade-up only
- `src/components/landing/HeroSection.tsx` — flat Apple-style hero
- `src/components/landing/*` (Stats, Showcase, Leadership, Testimonials, Policies, CTABanner, Contact, TrustedBy) — remove gradients/grids/grain, apply whitespace layout
- `src/components/ui/button.tsx` — replace `premium`/`hero` variants with `default` (filled black) + `ghost` only
- `src/pages/Home.tsx` — wire new sidebar
- `src/components/layout/DashboardLayout.tsx` — also adopt shadcn sidebar (for consistency, even if unused)

**Create**
- `src/components/layout/AppSidebar.tsx` — the new shadcn-based sidebar with amber rail

**Memory update**
- Save new core rule: *"Apple-clean aesthetic: white/near-black, hairline borders, Inter only, amber accent reserved for active/CTA, no gradients/grain/parallax."*
- Mark previous "Industrial Premium cinematic" direction as superseded.

---

## What stays the same
- All ERP data, sections, lazy loading, auth, RLS, realtime, notifications, AIChatBot, IdleWarning.
- All routing in `App.tsx`.
- Indian INR formatting, all business logic, all reports.
- Theme toggle (light/dark) — both modes get the new clean palette.

Approve to switch to build mode and execute.