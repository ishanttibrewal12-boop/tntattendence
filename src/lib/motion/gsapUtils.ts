/**
 * Cinematic GSAP motion toolkit — full Club GSAP plugins enabled.
 * Hooks: split-text reveal, scroll scrub, parallax, pinned sections,
 * magnetic, cursor spotlight, marquee, tilt cards, count-up.
 *
 * All hooks wrap work in `gsap.context()` and revert on unmount.
 * Per project decision, prefers-reduced-motion is intentionally NOT respected.
 */
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Observer } from 'gsap/Observer';

// Club GSAP — bundled with package
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore  no types shipped
import { SplitText } from 'gsap/SplitText';

gsap.registerPlugin(ScrollTrigger, Observer, SplitText);

/* ---------- reveal on scroll (richer: skew + scale + stagger) ---------- */
export const useRevealOnScroll = (
  scopeRef: React.RefObject<HTMLElement>,
  selector = '[data-reveal]',
  opts: { stagger?: number; start?: string; y?: number; skew?: number } = {},
) => {
  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(selector);
      items.forEach((el, i) => {
        gsap.fromTo(
          el,
          { autoAlpha: 0, y: opts.y ?? 24, skewY: opts.skew ?? 2, scale: 0.985 },
          {
            autoAlpha: 1, y: 0, skewY: 0, scale: 1,
            duration: 0.85,
            delay: (opts.stagger ?? 0.07) * (i % 6),
            ease: 'power3.out',
            scrollTrigger: { trigger: el, start: opts.start ?? 'top 88%', once: true },
            onStart: () => el.classList.add('is-revealed'),
          },
        );
      });
    }, scope);
    return () => ctx.revert();
  }, [scopeRef, selector, opts.stagger, opts.start, opts.y, opts.skew]);
};

/* ---------- split-text headline reveal ---------- */
export const useSplitTextReveal = (
  ref: React.RefObject<HTMLElement>,
  opts: { type?: 'chars' | 'words' | 'lines'; stagger?: number; y?: number; skew?: number; start?: string; duration?: number } = {},
) => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const type = opts.type ?? 'chars';
    let split: any;
    const ctx = gsap.context(() => {
      try {
        split = new SplitText(el, { type, charsClass: 'st-char', wordsClass: 'st-word', linesClass: 'st-line' });
      } catch {
        return;
      }
      const targets = type === 'chars' ? split.chars : type === 'words' ? split.words : split.lines;
      gsap.set(el, { perspective: 600 });
      gsap.fromTo(
        targets,
        { yPercent: 110, opacity: 0, skewY: opts.skew ?? 6, rotateX: -25 },
        {
          yPercent: 0, opacity: 1, skewY: 0, rotateX: 0,
          duration: opts.duration ?? 1.0,
          ease: 'power4.out',
          stagger: opts.stagger ?? 0.025,
          scrollTrigger: { trigger: el, start: opts.start ?? 'top 85%', once: true },
        },
      );
    }, el);
    return () => {
      try { split?.revert(); } catch { /* noop */ }
      ctx.revert();
    };
  }, [ref, opts.type, opts.stagger, opts.y, opts.skew, opts.start, opts.duration]);
};

/* ---------- parallax (yPercent driven by scroll) ---------- */
export const useParallax = (
  scopeRef: React.RefObject<HTMLElement>,
  selector = '[data-parallax]',
  amount = 20,
) => {
  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;
    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>(selector).forEach((el) => {
        const a = parseFloat(el.dataset.parallax || String(amount));
        gsap.fromTo(
          el,
          { yPercent: a },
          {
            yPercent: -a,
            ease: 'none',
            scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
          },
        );
      });
    }, scope);
    return () => ctx.revert();
  }, [scopeRef, selector, amount]);
};

/* ---------- scroll-scrubbed timeline factory ---------- */
export const useScrollScrub = (
  scopeRef: React.RefObject<HTMLElement>,
  build: (tl: gsap.core.Timeline, scope: HTMLElement) => void,
  triggerSelector?: string,
  opts: { start?: string; end?: string; scrub?: number | boolean; pin?: boolean } = {},
) => {
  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;
    const trigger = triggerSelector ? scope.querySelector<HTMLElement>(triggerSelector) || scope : scope;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger,
          start: opts.start ?? 'top 80%',
          end: opts.end ?? 'bottom top',
          scrub: opts.scrub ?? 1,
          pin: opts.pin ?? false,
        },
      });
      build(tl, scope);
    }, scope);
    return () => ctx.revert();
  }, [scopeRef, triggerSelector, opts.start, opts.end, opts.scrub, opts.pin, build]);
};

/* ---------- magnetic pull on hover (real implementation) ---------- */
export const useMagnetic = (ref: React.RefObject<HTMLElement>, strength = 0.35) => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = (e.clientX - (rect.left + rect.width / 2)) * strength;
      const y = (e.clientY - (rect.top + rect.height / 2)) * strength;
      xTo(x); yTo(y);
    };
    const onLeave = () => { xTo(0); yTo(0); };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [ref, strength]);
};

/* ---------- magnetic for ANY descendant matching selector ---------- */
export const useMagneticGroup = (
  scopeRef: React.RefObject<HTMLElement>,
  selector = '[data-magnetic]',
  strength = 0.3,
) => {
  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;
    const cleanups: Array<() => void> = [];
    scope.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      const xTo = gsap.quickTo(el, 'x', { duration: 0.45, ease: 'power3.out' });
      const yTo = gsap.quickTo(el, 'y', { duration: 0.45, ease: 'power3.out' });
      const onMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        xTo((e.clientX - (rect.left + rect.width / 2)) * strength);
        yTo((e.clientY - (rect.top + rect.height / 2)) * strength);
      };
      const onLeave = () => { xTo(0); yTo(0); };
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        el.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseleave', onLeave);
      });
    });
    return () => cleanups.forEach((c) => c());
  }, [scopeRef, selector, strength]);
};

/* ---------- cursor spotlight (radial light following pointer) ---------- */
export const useCursorSpotlight = (ref: React.RefObject<HTMLElement>, color = 'hsla(36,100%,55%,0.18)') => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.position = el.style.position || 'relative';
    el.style.setProperty('--spot-x', '50%');
    el.style.setProperty('--spot-y', '50%');
    el.style.setProperty('--spot-color', color);
    el.classList.add('gsap-spotlight');

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      el.style.setProperty('--spot-x', `${x}%`);
      el.style.setProperty('--spot-y', `${y}%`);
    };
    el.addEventListener('mousemove', onMove);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.classList.remove('gsap-spotlight');
    };
  }, [ref, color]);
};

/* ---------- 3D tilt on hover for cards ---------- */
export const useTiltCards = (
  scopeRef: React.RefObject<HTMLElement>,
  selector = '[data-tilt]',
  max = 8,
) => {
  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;
    const cleanups: Array<() => void> = [];
    scope.querySelectorAll<HTMLElement>(selector).forEach((el) => {
      el.style.transformStyle = 'preserve-3d';
      el.style.willChange = 'transform';
      const rxTo = gsap.quickTo(el, 'rotateX', { duration: 0.4, ease: 'power3.out' });
      const ryTo = gsap.quickTo(el, 'rotateY', { duration: 0.4, ease: 'power3.out' });
      const sTo = gsap.quickTo(el, 'scale', { duration: 0.4, ease: 'power3.out' });
      const onMove = (e: MouseEvent) => {
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        ryTo(px * max);
        rxTo(-py * max);
        sTo(1.02);
      };
      const onLeave = () => { rxTo(0); ryTo(0); sTo(1); };
      el.addEventListener('mousemove', onMove);
      el.addEventListener('mouseleave', onLeave);
      cleanups.push(() => {
        el.removeEventListener('mousemove', onMove);
        el.removeEventListener('mouseleave', onLeave);
      });
    });
    return () => cleanups.forEach((c) => c());
  }, [scopeRef, selector, max]);
};

/* ---------- infinite marquee with hover slow-down ---------- */
export const useMarquee = (
  ref: React.RefObject<HTMLElement>,
  opts: { speed?: number; direction?: 1 | -1 } = {},
) => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const speed = opts.speed ?? 60; // px per second
    const dir = opts.direction ?? -1;
    const ctx = gsap.context(() => {
      const setX = gsap.quickSetter(el, 'x', 'px');
      let x = 0;
      let last = performance.now();
      let factor = 1;
      let raf = 0;
      const width = () => el.scrollWidth / 2;

      const tick = (now: number) => {
        const dt = (now - last) / 1000;
        last = now;
        x += dir * speed * factor * dt;
        const w = width();
        if (w > 0) {
          if (x <= -w) x += w;
          if (x >= 0) x -= w;
        }
        setX(x);
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);

      const slow = () => gsap.to({ v: factor }, { v: 0.25, duration: 0.4, onUpdate() { factor = (this as any).targets()[0].v; } });
      const fast = () => gsap.to({ v: factor }, { v: 1, duration: 0.4, onUpdate() { factor = (this as any).targets()[0].v; } });
      el.addEventListener('mouseenter', slow);
      el.addEventListener('mouseleave', fast);

      return () => {
        cancelAnimationFrame(raf);
        el.removeEventListener('mouseenter', slow);
        el.removeEventListener('mouseleave', fast);
      };
    }, el);
    return () => ctx.revert();
  }, [ref, opts.speed, opts.direction]);
};

/* ---------- count-up ---------- */
export const useCountUp = (
  ref: React.RefObject<HTMLElement>,
  to: number,
  opts: { duration?: number; format?: (n: number) => string } = {},
) => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obj = { val: 0 };
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        val: to,
        duration: opts.duration ?? 1.6,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onUpdate: () => {
          el.textContent = (opts.format ?? ((n: number) => String(Math.round(n))))(obj.val);
        },
      });
    }, el);
    return () => ctx.revert();
  }, [ref, to, opts.duration, opts.format]);
};

export const useElRef = <T extends HTMLElement = HTMLDivElement>() => useRef<T>(null);
