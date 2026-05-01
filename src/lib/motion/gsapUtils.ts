/**
 * Industrial Premium v2 — GSAP motion helpers.
 * Every effect respects prefers-reduced-motion and disables itself on touch
 * devices when scroll-driven. Always wrap GSAP work in gsap.context() and
 * call ctx.revert() in the cleanup (project rule).
 */
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const isReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const isTouch = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia('(hover: none) and (pointer: coarse)').matches ||
    window.innerWidth < 768);

/**
 * Reveal direct children of `selector` on scroll.
 * Children should have one of: .reveal-up | .reveal-fade | .reveal-scale
 */
export const useRevealOnScroll = (
  scopeRef: React.RefObject<HTMLElement>,
  selector = '[data-reveal]',
  opts: { stagger?: number; start?: string } = {},
) => {
  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope || isReduced()) {
      // Make sure content stays visible if motion is reduced
      scope?.querySelectorAll<HTMLElement>(selector).forEach((el) => el.classList.add('is-revealed'));
      return;
    }
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(selector);
      items.forEach((el, i) => {
        gsap.to(el, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.85,
          delay: (opts.stagger ?? 0.08) * (i % 6),
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: opts.start ?? 'top 85%',
            once: true,
          },
          onStart: () => el.classList.add('is-revealed'),
        });
      });
    }, scope);
    return () => ctx.revert();
  }, [scopeRef, selector, opts.stagger, opts.start]);
};

/**
 * Animated counter that runs once when scrolled into view.
 */
export const useCountUp = (
  ref: React.RefObject<HTMLElement>,
  to: number,
  opts: { duration?: number; format?: (n: number) => string } = {},
) => {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (isReduced()) {
      el.textContent = (opts.format ?? String)(to);
      return;
    }
    const obj = { val: 0 };
    const ctx = gsap.context(() => {
      gsap.to(obj, {
        val: to,
        duration: opts.duration ?? 1.6,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        onUpdate: () => {
          el.textContent = (opts.format ?? ((n: number) => String(Math.round(n))))(obj.val);
        },
      });
    }, el);
    return () => ctx.revert();
  }, [ref, to, opts.duration, opts.format]);
};

/**
 * Magnetic pointer effect — subtle pull toward cursor on hover.
 * Disabled on touch and reduced-motion.
 */
export const useMagnetic = (ref: React.RefObject<HTMLElement>, strength = 0.25) => {
  useEffect(() => {
    const el = ref.current;
    if (!el || isTouch() || isReduced()) return;

    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      const x = (e.clientX - cx) * strength;
      const y = (e.clientY - cy) * strength;
      el.style.setProperty('--mx', `${x}px`);
      el.style.setProperty('--my', `${y}px`);
    };
    const onLeave = () => {
      el.style.setProperty('--mx', '0px');
      el.style.setProperty('--my', '0px');
    };
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerleave', onLeave);
    return () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
    };
  }, [ref, strength]);
};

/**
 * Hook to attach a soft cursor "spotlight" glow to a section.
 * Pure DOM, no React state churn.
 */
export const useCursorSpotlight = (ref: React.RefObject<HTMLElement>) => {
  useEffect(() => {
    const el = ref.current;
    if (!el || isTouch() || isReduced()) return;
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--spot-x', `${e.clientX - r.left}px`);
      el.style.setProperty('--spot-y', `${e.clientY - r.top}px`);
    };
    el.addEventListener('pointermove', onMove);
    return () => el.removeEventListener('pointermove', onMove);
  }, [ref]);
};

/**
 * Helper to declare a ref with the right HTML element type
 * inline at the call site without the `useRef<X>(null)` ceremony.
 */
export const useElRef = <T extends HTMLElement = HTMLDivElement>() => useRef<T>(null);
