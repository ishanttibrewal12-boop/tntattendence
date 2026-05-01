# Plan: Industrial Premium v2 — full theme, refreshed ERP, cinematic landing

You picked **Industrial Premium**, **Cinematic animations**, **whole-web scope**, and **light + dark with toggle (default light)**. All existing data, routes, RBAC, and business logic stay identical — only the visual layer changes.

---

## 1. New design system (tokens, fonts, motion utilities)

Updated in `src/index.css` and `tailwind.config.ts`.

### Color tokens (HSL, semantic)

Light (default):

```text
--background: 36 25% 97%        /* warm ivory */
--foreground: 220 30% 8%        /* near-black slate */
--card / --popover: 0 0% 100%
--muted: 30 12% 92%
--border / --input: 30 10% 86%

--primary: 220 60% 12%          /* deep slate */
--primary-foreground: 36 25% 97%
--secondary: 220 20% 22%
--accent: 28 90% 52%            /* warm amber, the brand spark */
--accent-foreground: 220 30% 8%
--accent-glow: 28 95% 60%
--destructive: 0 72% 50%
--ring: 28 90% 52%

--gradient-hero: linear-gradient(135deg, hsl(220 60% 10%), hsl(220 50% 18%) 60%, hsl(28 90% 52%))
--gradient-amber: linear-gradient(135deg, hsl(28 95% 58%), hsl(18 85% 50%))
--gradient-steel: linear-gradient(180deg, hsl(220 25% 96%), hsl(220 18% 90%))

--shadow-elegant: 0 20px 50px -20px hsl(220 60% 12% / .25)
--shadow-glow: 0 0 40px hsl(28 90% 52% / .35)
--shadow-card: 0 4px 16px -8px hsl(220 30% 15% / .12)

--radius: 0.875rem               /* slightly rounder, premium feel */
```

Dark mode keeps the same accent and uses a slate-charcoal base (`220 30% 7%`), softer borders, and stronger amber glow.

### Typography

- **Display / headlines**: `Fraunces` (variable serif, modern industrial-luxury) loaded from Google Fonts.
- **Body / UI**: `Inter` (already loaded).
- **Mono / numerics**: `JetBrains Mono` for stats and tabular numbers.

Loaded once in `index.html`; existing `--font-sans` stays so nothing else breaks.

### Motion utility classes (added to `index.css`)

`.section-reveal`, `.text-reveal`, `.stagger-children > *`, `.hover-lift`, `.magnetic`, `.shine-on-hover`, `.glow-pulse-amber`, `.tilt-3d`, `.gradient-text`, `.industrial-grid-bg` (subtle SVG grid), `.grain-overlay` (very faint film grain on hero).

All wrapped behind `prefers-reduced-motion: reduce` to fall back to fades only.

---

## 2. Cinematic landing page

A new top-level `LandingV2` shell mounted at `/` (the existing landing components are kept as-is for fallback; we only swap what `Index`/`Home` route renders for unauthenticated users so nothing is deleted by mistake).

Section flow (data identical, presentation new):

```text
1. Sticky glass nav     — frosted backdrop, amber underline on hover, theme toggle, "Open ERP" CTA
2. Cinematic hero       — split layout: left = display headline with word-by-word GSAP reveal
                          + amber gradient on the spark word, right = looping subtle parallax
                          stack of 3 industrial photos with depth tilt
3. Stats strip          — 4 KPIs ("13+ Years", "Ample Fleet", clients, lines of business)
                          counting up on scroll, JetBrains Mono numerals
4. Group overview       — alternating left/right slabs with reveal-on-scroll, accent rule lines
5. Companies showcase   — horizontal pinned scroll on desktop, swipe carousel on mobile
6. Before/After slider  — kept (Raw Stone vs Crushed Aggregates), restyled with amber handle
7. Leadership           — refreshed cards with grayscale-to-color hover, accent border
8. Trusted by / clients — premium logo marquee, hover pause + slow-down (kept from memory)
9. Photo gallery        — masonry kept, new lightbox chrome, category pill filters restyled
10. Policies            — 8 standards as numbered amber-rule storytelling steps
11. Testimonials        — 3D tilt cards on hover, attributed only to company names
12. CTA banner          — full-bleed amber gradient with magnetic button
13. Contact + footer    — restyled, WhatsApp & phone CTAs, smooth-scroll nav
```

Cinematic effects (all wrapped in `gsap.context()` with `ctx.revert()` cleanup, throttled on mobile, disabled under reduced-motion):

- Scroll-pinned hero with parallax depth.
- Word-by-word headline reveal.
- Section reveals on `ScrollTrigger`.
- Counter animations for stats.
- Pinned horizontal scroll for companies.
- Magnetic accent buttons (mouse-following).
- Cursor "spotlight" glow on hero (desktop only).
- Logo marquee with hover slow-down (existing pattern preserved).

Persisted constraints respected: no background videos, no opacity:0 on critical hero text, no infinite CSS animations, `13+ Years` / `Ample` (no quantitative counts), Tibrewal branding + logo, contact = WhatsApp/phone/email links.

---

## 3. ERP refresh (data and routes unchanged)

Light, surgical visual updates — no screen restructured, no feature touched.

- **Sidebar**: rebuilt with shadcn `Sidebar` (`collapsible="icon"`), deep slate background, amber active rail, persistent `SidebarTrigger` in the topbar. Mobile keeps existing drawer pattern.
- **Topbar**: glass blur, breadcrumbs (existing component) + `NotificationBell` + `GlobalSearch` (Ctrl+K) + theme toggle + profile avatar.
- **Cards**: new `.premium-card` style — soft shadow, subtle border, hover-lift; applied automatically because all sections already use `<Card>` from shadcn.
- **Buttons**: a new `premium` variant on `buttonVariants` (gradient amber → deep amber, shine on hover) for primary CTAs; default/outline/ghost stay backwards-compatible so nothing else changes.
- **Dashboard (`CorporateDashboard`)**: new `GreetingBanner` with gradient, KPI cards get JetBrains Mono numerals + count-up, Quick Access Grid restyled into a 4-col tile grid with icon chips.
- **Tables (`.premium-table`)**: refreshed header band, zebra rows, sticky header — class is already used in ERP, so update is in CSS only.
- **Page transitions**: existing `PageTransition` + `LogoWipeTransition` kept, just retimed for snappier feel (180ms in, 220ms out).

No changes to: routes, RBAC, RLS, queries, edge functions, file manager logic, payroll math, attendance flow, exports/PDFs.

---

## 4. Light/Dark toggle

- Tokens already split into `:root` and `.dark`.
- Replace the existing landing `ThemeToggle` with a unified one in the topbar/nav that sets `class="dark"` on `<html>`, persists in `localStorage`, and respects `prefers-color-scheme` on first visit.
- Default = light.

---

## 5. Files I will edit / add

Edits (visual only, no API changes):

- `src/index.css` — full token rewrite (light + dark), motion utilities, `.premium-card`, `.premium-table`, grain/grid backgrounds.
- `tailwind.config.ts` — extend keyframes (`fade-up`, `scale-in`, `slide-in-right`, `marquee`, `shine`, `text-reveal`), `boxShadow.elegant/glow/card`, `backgroundImage.hero/amber/steel`, `fontFamily.display`.
- `index.html` — add Fraunces + JetBrains Mono Google Font links.
- `src/components/landing/HeroSection.tsx`, `StickyNav.tsx`, `StatsStrip.tsx`, `CompanyShowcase.tsx`, `LeadershipShowcase.tsx`, `TrustedBySection.tsx`, `TestimonialsSection.tsx`, `CTABanner.tsx`, `ContactSection.tsx`, `PoliciesSection.tsx`, `BeforeAfterSlider.tsx`, `ImageGallery.tsx` — restyle + new motion.
- `src/components/landing/ThemeToggle.tsx` — promote to global toggle.
- `src/components/ui/button.tsx` — add `premium` variant.
- `src/components/layout/Sidebar.tsx`, `DashboardLayout.tsx` — switch to shadcn `Sidebar`, amber active state, glass topbar.
- `src/components/dashboard/CorporateDashboard.tsx`, `GreetingBanner.tsx`, `LiveKPICards.tsx` — restyle, count-up numerics.
- `src/pages/Login.tsx` — refreshed glass card on industrial backdrop (already premium; just retoned to new tokens).

New files:

- `src/components/landing/LandingV2.tsx` — orchestrator that composes the redesigned sections in the new order.
- `src/lib/motion/gsapUtils.ts` — small helpers for `useGsapReveal`, `useMagnetic`, `useCursorSpotlight`, all with proper cleanup.

Removed: nothing. Old landing files stay on disk in case we need to revert.

---

## 6. Out of scope (explicitly unchanged)

- All Supabase tables, RLS, edge functions, daily backups.
- Auth flow, session policy, lockouts, RBAC.
- Payroll math, attendance model, MLT/Crusher/Petroleum logic.
- PDF/Excel/Word generation and "Rs." formatting.
- Currency rules (INR + Indian numbering), branding ("Tibrewal Group"), client list, qualitative counts ("Ample"/"13+ Years").
- File Manager creation flow we just rebuilt.

---

Once you approve, I'll implement in this order so the preview stays usable throughout: tokens → button/card primitives → sidebar+topbar → dashboard → landing sections → theme toggle wiring. You'll see the change immediately on every screen.
