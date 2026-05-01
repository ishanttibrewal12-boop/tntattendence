import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowDown, Sparkles } from 'lucide-react';
import companyLogo from '@/assets/tibrewal-logo.png';
import heroImg from '@/assets/hero-mining-operations.jpg';
import { Button } from '@/components/ui/button';
import { useCursorSpotlight, useElRef } from '@/lib/motion/gsapUtils';

gsap.registerPlugin(ScrollTrigger);

const NAV_LINKS = [
  { label: 'About', id: 'about' },
  { label: 'Companies', id: 'companies' },
  { label: 'Clients', id: 'clients' },
  { label: 'Leadership', id: 'leadership' },
  { label: 'Gallery', id: 'gallery' },
  { label: 'Contact', id: 'contact' },
];

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const spotlightRef = useElRef<HTMLDivElement>();
  useCursorSpotlight(spotlightRef);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches
      || window.innerWidth < 768;

    const ctx = gsap.context(() => {
      // Word-by-word headline reveal — keep title visible (no opacity:0 lock)
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.hero-eyebrow', { y: 14, opacity: 0, duration: 0.6 })
        .from('.hero-logo', { scale: 0.7, opacity: 0, duration: 0.7, ease: 'back.out(1.6)' }, '-=0.4')
        .from('.hero-word', { yPercent: 110, duration: 0.85, stagger: 0.08 }, '-=0.3')
        .from('.hero-rule', { scaleX: 0, transformOrigin: 'left center', duration: 0.55 }, '-=0.4')
        .from('.hero-sub', { y: 18, opacity: 0, duration: 0.55 }, '-=0.3')
        .from('.hero-meta', { y: 18, opacity: 0, duration: 0.55 }, '-=0.35')
        .from('.hero-cta > *', { y: 14, opacity: 0, duration: 0.45, stagger: 0.08 }, '-=0.25')
        .from('.hero-pill', { y: 10, opacity: 0, duration: 0.4, stagger: 0.05 }, '-=0.2');

      if (!reduced && !isTouch) {
        gsap.to('.hero-media', {
          y: 160, scale: 1.14, ease: 'none',
          scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true },
        });
        gsap.to(content, {
          y: 80, opacity: 0, ease: 'none',
          scrollTrigger: { trigger: section, start: 'top top', end: '60% top', scrub: true },
        });
        if (overlayRef.current) {
          gsap.to(overlayRef.current, {
            opacity: 0.85, ease: 'none',
            scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true },
          });
        }
      }
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100svh] flex items-center overflow-hidden bg-foreground text-background grain-overlay"
    >
      {/* Photo layer */}
      <div
        className="hero-media absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
        style={{ backgroundImage: `url(${heroImg})`, transform: 'scale(1.05)' }}
        aria-hidden
      />
      {/* Brand gradient mask */}
      <div className="absolute inset-0 z-[1] bg-gradient-hero opacity-90" aria-hidden />
      {/* Cursor spotlight */}
      <div
        ref={spotlightRef}
        className="absolute inset-0 z-[2] pointer-events-none hidden md:block"
        style={{
          background:
            'radial-gradient(420px circle at var(--spot-x, 50%) var(--spot-y, 50%), hsl(var(--accent) / 0.18), transparent 60%)',
        }}
        aria-hidden
      />
      {/* Scroll-darken overlay */}
      <div ref={overlayRef} className="absolute inset-0 z-[3] opacity-0 bg-foreground" aria-hidden />

      {/* Subtle blueprint grid */}
      <div className="absolute inset-0 z-[2] industrial-grid-bg opacity-[0.06] pointer-events-none" aria-hidden />

      <div
        ref={contentRef}
        className="relative z-10 w-full max-w-6xl mx-auto px-5 sm:px-8 md:px-12 py-20 sm:py-24 will-change-transform"
      >
        <div className="hero-eyebrow inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-background/15 bg-background/5 backdrop-blur text-[11px] font-semibold uppercase tracking-[0.18em] text-background/80 mb-6">
          <Sparkles className="h-3.5 w-3.5 text-[hsl(var(--accent))]" />
          Industrial Conglomerate · Est. 2013
        </div>

        <img
          src={companyLogo}
          alt="Tibrewal Group"
          className="hero-logo h-16 sm:h-20 w-auto mb-7 object-contain drop-shadow-2xl"
          fetchPriority="high"
          width={80}
          height={80}
        />

        <h1
          className="hero-title-mobile font-display text-[clamp(2.4rem,7vw,5.25rem)] font-extrabold leading-[1.02] tracking-tight mb-5"
          style={{ contentVisibility: 'auto' }}
        >
          <span className="block overflow-hidden">
            <span className="hero-word inline-block">TIBREWAL</span>
          </span>
          <span className="block overflow-hidden">
            <span className="hero-word inline-block gradient-text">GROUP</span>
          </span>
        </h1>

        <div className="hero-rule h-1 w-20 rounded-full bg-gradient-amber mb-7 origin-left" aria-hidden />

        <p className="hero-sub max-w-xl text-base sm:text-lg md:text-xl font-medium text-background/85 leading-relaxed mb-3">
          A prominent industrial business group powering Jharkhand's mining,
          stone crushing, petroleum, tyres and agro processing economy.
        </p>
        <p className="hero-meta text-xs sm:text-sm text-background/55 tracking-wide mb-9">
          13+ Years &nbsp;·&nbsp; Ample Fleet &nbsp;·&nbsp; Multi-vertical Operations
        </p>

        <div className="hero-cta flex flex-wrap items-center gap-3 mb-10">
          <Button
            variant="premium"
            size="lg"
            onClick={() => document.getElementById('companies')?.scrollIntoView({ behavior: 'smooth' })}
            className="h-12 px-7"
          >
            Explore the Group
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            className="h-12 px-7 border-background/25 bg-background/5 text-background hover:bg-background/10 hover:text-background hover:border-background/40"
          >
            Get in touch
          </Button>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-2.5">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' })}
              className="hero-pill group px-4 py-2 rounded-full text-[11px] sm:text-xs font-semibold uppercase tracking-wider border border-background/15 bg-background/5 text-background/65 transition-all duration-300 hover:border-[hsl(var(--accent))]/70 hover:text-[hsl(var(--accent))] hover:bg-[hsl(var(--accent))]/10 hover:-translate-y-0.5"
            >
              {link.label}
            </button>
          ))}
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 text-background/55">
          <span className="text-[10px] tracking-[0.25em] uppercase">Scroll</span>
          <ArrowDown className="h-4 w-4 animate-bounce" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
