import { useEffect, useRef, ReactNode } from 'react';
import gsap from 'gsap';

/**
 * Cinematic GSAP page transition. Used between dashboard sections.
 * Mounts with a clip-path sweep + scale + blur reveal.
 */
const PageTransition = ({ children, className = '' }: { children: ReactNode; className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ctx = gsap.context(() => {
      gsap.set(el, {
        opacity: 0,
        y: 24,
        scale: 0.985,
        filter: 'blur(8px)',
        clipPath: 'inset(8% 0% 8% 0% round 16px)',
      });
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
      tl.to(el, {
        opacity: 1,
        y: 0,
        scale: 1,
        filter: 'blur(0px)',
        clipPath: 'inset(0% 0% 0% 0% round 0px)',
        duration: 0.85,
      });
      // Stagger reveal for direct children for richer entrance
      const kids = Array.from(el.children) as HTMLElement[];
      if (kids.length) {
        gsap.from(kids, {
          opacity: 0,
          y: 18,
          duration: 0.55,
          ease: 'power3.out',
          stagger: 0.06,
          delay: 0.15,
        });
      }
    }, el);
    return () => ctx.revert();
  }, []);

  return (
    <div ref={ref} className={className} style={{ willChange: 'transform, opacity, filter' }}>
      {children}
    </div>
  );
};

export default PageTransition;
