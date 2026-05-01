/**
 * Apple-Clean motion helpers.
 * Restrained motion only: gentle fade-up on scroll, count-up.
 * Magnetic/cursor-spotlight kept as no-ops so existing callers don't break.
 * Always wrap GSAP work in gsap.context() and call ctx.revert() in cleanup.
 */
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const isReduced = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/**
 * Reveal items on scroll with a soft fade-up. Touch + reduced-motion safe.
 */
export const useRevealOnScroll = (
  scopeRef: React.RefObject<HTMLElement>,
  selector = '[data-reveal]',
  opts: { stagger?: number; start?: string } = {},
) => {
  useEffect(() => {
    const scope = scopeRef.current;
    if (!scope) return;
    if (isReduced()) {
      scope.querySelectorAll<HTMLElement>(selector).forEach((el) => el.classList.add('is-revealed'));
      return;
    }
    const ctx = gsap.context(() => {
      const items = gsap.utils.toArray<HTMLElement>(selector);
      items.forEach((el, i) => {
        gsap.to(el, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 0.55,
          delay: (opts.stagger ?? 0.06) * (i % 6),
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: opts.start ?? 'top 88%', once: true },
          onStart: () => el.classList.add('is-revealed'),
        });
      });
    }, scope);
    return () => ctx.revert();
  }, [scopeRef, selector, opts.stagger, opts.start]);
};

/** Animated counter that runs once when scrolled into view. */
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
        duration: opts.duration ?? 1.4,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onUpdate: () => {
          el.textContent = (opts.format ?? ((n: number) => String(Math.round(n))))(obj.val);
        },
      });
    }, el);
    return () => ctx.revert();
  }, [ref, to, opts.duration, opts.format]);
};

/** No-op (Apple-clean removes magnetic effect). */
export const useMagnetic = (_ref: React.RefObject<HTMLElement>, _strength = 0.25) => {};

/** No-op (Apple-clean removes cursor spotlight). */
export const useCursorSpotlight = (_ref: React.RefObject<HTMLElement>) => {};

export const useElRef = <T extends HTMLElement = HTMLDivElement>() => useRef<T>(null);
