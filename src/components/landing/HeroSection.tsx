import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import companyLogo from '@/assets/tibrewal-logo.png';
import heroImg from '@/assets/hero-mining-operations.jpg';

gsap.registerPlugin(ScrollTrigger);

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) return;

    // Disable scroll-driven parallax on touch devices to keep scrolling smooth
    const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches
      || window.innerWidth < 768;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline();
      tl.from('.hero-logo', { opacity: 0, scale: 0.7, duration: 0.8, ease: 'back.out(1.7)' })
        .from('.hero-title', { y: 30, duration: 0.5, ease: 'power3.out' }, '-=0.3')
        .from('.hero-subtitle', { opacity: 0, y: 30, duration: 0.6, ease: 'power3.out' }, '-=0.3')
        .from('.hero-line', { scaleX: 0, duration: 0.5, ease: 'power2.out' }, '-=0.2')
        .from('.hero-desc', { opacity: 0, y: 20, duration: 0.5, ease: 'power3.out' }, '-=0.2');

      if (!isTouch) {
        gsap.to('.hero-media', {
          y: 150, scale: 1.12, ease: 'none',
          scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true },
        });

        gsap.to(content, {
          y: 80, opacity: 0, ease: 'none',
          scrollTrigger: { trigger: section, start: 'top top', end: '60% top', scrub: true },
        });

        if (overlayRef.current) {
          gsap.to(overlayRef.current, {
            opacity: 1, ease: 'none',
            scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true },
          });
        }
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-[100svh] flex items-center overflow-hidden">
      <div className="hero-media absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform" style={{ backgroundImage: `url(${heroImg})`, transform: 'scale(1.05)' }} />
      <div className="absolute inset-0 z-[1]" style={{ background: 'linear-gradient(180deg, rgba(11,31,51,0.70) 0%, rgba(11,31,51,0.80) 50%, rgba(11,31,51,0.92) 100%)' }} />
      <div ref={overlayRef} className="absolute inset-0 z-[2] opacity-0" style={{ background: '#0a0d14' }} />

      <div ref={contentRef} className="relative z-10 w-full max-w-5xl mx-auto px-5 sm:px-8 md:px-12 py-16 sm:py-20 will-change-transform">
        <img src={companyLogo} alt="Tibrewal Group" className="hero-logo h-16 sm:h-20 w-auto mb-6 sm:mb-8 object-contain drop-shadow-lg" fetchPriority="high" width={80} height={80} />
        <h1 className="hero-title hero-title-mobile text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 leading-[1.1] sm:leading-tight text-white" style={{ contentVisibility: 'auto' }}>TIBREWAL GROUP</h1>
        <p className="hero-subtitle hero-subtitle-mobile text-base sm:text-lg md:text-xl font-medium mb-6 sm:mb-8 text-white/70 leading-relaxed">A Prominent Industrial Business Group</p>
        <div className="hero-line w-16 h-1 rounded-full mb-8 sm:mb-10 origin-left bg-orange-500" />
        <p className="hero-desc text-sm sm:text-base max-w-lg leading-relaxed mb-8 text-white/55 section-body-mobile">
          Mining • Stone Crushing • Petroleum • Tyres • Agro Processing<br />
          Established 2013 — Jharkhand, India
        </p>

        {/* Navigation Links */}
        <div className="hero-desc flex flex-wrap gap-2 sm:gap-3 mb-10">
          {[
            { label: 'About', id: 'about' },
            { label: 'Companies', id: 'companies' },
            { label: 'Clients', id: 'clients' },
            { label: 'Leadership', id: 'leadership' },
            { label: 'Gallery', id: 'gallery' },
            { label: 'Contact', id: 'contact' },
          ].map((link) => (
            <button
              key={link.id}
              onClick={() => document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' })}
              className="px-4 sm:px-5 py-2 rounded-full text-[11px] sm:text-xs font-semibold uppercase tracking-wider border transition-all duration-300 hover:scale-105"
              style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.05)' }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#f97316'; e.currentTarget.style.color = '#f97316'; e.currentTarget.style.background = 'rgba(249,115,22,0.1)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs tracking-widest uppercase text-white/40">Scroll</span>
          <div className="w-5 h-8 rounded-full border-2 border-white/30 flex justify-center pt-1">
            <div className="w-1 h-2 rounded-full bg-white/50" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
