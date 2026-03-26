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

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => isDragging && handleMove(e.clientX);
    const handleTouchMove = (e: TouchEvent) => isDragging && handleMove(e.touches[0].clientX);

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove);
    window.addEventListener('touchend', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [isDragging]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.from('.ba-heading', {
        opacity: 0, y: 40, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });
      gsap.from('.ba-slider-wrap', {
        opacity: 0, scale: 0.95, duration: 0.8, ease: 'power3.out', delay: 0.2,
        scrollTrigger: { trigger: section, start: 'top 75%' },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 relative overflow-hidden" style={{ background: '#0a0d14' }}>
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <p className="ba-heading text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: '#f97316' }}>
            Our Impact
          </p>
          <h2 className="ba-heading text-3xl md:text-5xl font-extrabold leading-tight" style={{ color: '#f2f4f7' }}>
            Transforming Landscapes
          </h2>
          <p className="ba-heading mt-4 text-sm md:text-base max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Drag the slider to see how our operations transform raw terrain into productive infrastructure
          </p>
        </div>

        <div
          ref={containerRef}
          className="ba-slider-wrap relative w-full aspect-[16/9] rounded-2xl overflow-hidden cursor-col-resize select-none border"
          style={{ borderColor: 'rgba(255,255,255,0.1)' }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          {/* After image (full) */}
          <img
            src={truckImg}
            alt="After - Developed operations"
            className="absolute inset-0 w-full h-full object-cover"
          />

          {/* Before image (clipped) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - position}% 0 0)` }}
          >
            <img
              src={crusherImg}
              alt="Before - Raw terrain"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>

          {/* Slider line */}
          <div
            className="absolute top-0 bottom-0 w-0.5 z-10"
            style={{ left: `${position}%`, background: '#f97316', boxShadow: '0 0 12px rgba(249,115,22,0.5)' }}
          />

          {/* Drag handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 z-20 w-10 h-10 rounded-full flex items-center justify-center shadow-xl transition-transform"
            style={{
              left: `${position}%`,
              background: '#f97316',
              boxShadow: '0 0 20px rgba(249,115,22,0.4)',
              transform: `translate(-50%, -50%) scale(${isDragging ? 1.15 : 1})`,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M8 4l-6 8 6 8" />
              <path d="M16 4l6 8-6 8" />
            </svg>
          </div>

          {/* Labels */}
          <div className="absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)' }}>
            Raw Material
          </div>
          <div className="absolute top-4 right-4 z-10 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: 'rgba(0,0,0,0.6)', color: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(8px)' }}>
            Operations
          </div>
        </div>
      </div>
    </section>
  );
};

export default BeforeAfterSlider;
