import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import beforeImg from '@/assets/before-raw-stone.jpeg';
import afterImg from '@/assets/after-crushed-stone.jpeg';

gsap.registerPlugin(ScrollTrigger);

const BeforeAfterSlider = () => {
  const [position, setPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLElement>(null);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setPosition((x / rect.width) * 100);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => isDragging && handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => isDragging && handleMove(e.touches[0].clientX);
    const stop = () => setIsDragging(false);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stop);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', stop);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stop);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', stop);
    };
  }, [isDragging]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.from('.ba-head > *', {
        opacity: 0, y: 14, duration: 0.6, ease: 'power2.out', stagger: 0.08,
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });
      gsap.from('.ba-slider-wrap', {
        opacity: 0, y: 16, duration: 0.7, ease: 'power2.out', delay: 0.15,
        scrollTrigger: { trigger: section, start: 'top 75%' },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-background">
      <div className="max-w-5xl mx-auto px-6">
        <div className="ba-head text-center mb-12">
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground mb-4">Our Impact</p>
          <h2 className="font-display text-[clamp(1.9rem,4.4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.024em] text-foreground">
            Transforming landscapes.
          </h2>
          <p className="mt-4 text-base md:text-lg max-w-xl mx-auto text-muted-foreground">
            Drag the slider to see how our operations transform raw terrain into productive infrastructure.
          </p>
        </div>

        <div
          ref={containerRef}
          className="ba-slider-wrap relative w-full aspect-[16/9] rounded-2xl overflow-hidden cursor-col-resize select-none border border-border"
          onMouseDown={() => setIsDragging(true)}
          onTouchStart={() => setIsDragging(true)}
        >
          <img src={afterImg} alt="After - Developed operations" className="absolute inset-0 w-full h-full object-cover" />
          <div className="absolute inset-0 overflow-hidden" style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}>
            <img src={beforeImg} alt="Before - Raw terrain" className="absolute inset-0 w-full h-full object-cover" />
          </div>

          <div
            className="absolute top-0 bottom-0 w-px z-10 bg-accent"
            style={{ left: `${position}%` }}
          />

          <div
            className="absolute top-1/2 z-20 w-9 h-9 rounded-full flex items-center justify-center bg-accent text-accent-foreground border-2 border-background shadow-md"
            style={{
              left: `${position}%`,
              transform: `translate(-50%, -50%) scale(${isDragging ? 1.08 : 1})`,
              transition: 'transform 150ms ease',
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M8 4l-6 8 6 8" />
              <path d="M16 4l6 8-6 8" />
            </svg>
          </div>

          <div className="absolute top-3 left-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-medium tracking-[0.12em] uppercase bg-background/85 text-foreground border border-border backdrop-blur">
            Raw Stone
          </div>
          <div className="absolute top-3 right-3 z-10 px-2.5 py-1 rounded-full text-[10px] font-medium tracking-[0.12em] uppercase bg-background/85 text-foreground border border-border backdrop-blur">
            Crushed Aggregates
          </div>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterSlider;
