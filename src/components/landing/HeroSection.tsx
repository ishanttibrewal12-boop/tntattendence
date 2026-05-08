import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowRight } from 'lucide-react';
import companyLogo from '@/assets/tibrewal-logo.png';
import { Button } from '@/components/ui/button';
import { useSplitTextReveal, useMagneticGroup, useCursorSpotlight } from '@/lib/motion/gsapUtils';

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
  const titleRef = useRef<HTMLHeadingElement>(null);

  useSplitTextReveal(titleRef, { type: 'chars', stagger: 0.022, skew: 8, duration: 1.1 });
  useMagneticGroup(sectionRef, '[data-magnetic]', 0.4);
  useCursorSpotlight(sectionRef, 'hsla(36,100%,55%,0.22)');

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.from('.hero-eyebrow', { y: 12, opacity: 0, duration: 0.6 })
        .from('.hero-logo',    { y: 16, opacity: 0, scale: 0.85, duration: 0.7 }, '-=0.4')
        .from('.hero-sub',     { y: 14, opacity: 0, duration: 0.7 }, '-=0.2')
        .from('.hero-cta > *', { y: 14, opacity: 0, duration: 0.55, stagger: 0.08 }, '-=0.3')
        .from('.hero-pill',    { y: 8, opacity: 0, duration: 0.4, stagger: 0.04 }, '-=0.25');

      // Parallax glow blobs
      gsap.to('.hero-blob-a', {
        yPercent: -40, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true },
      });
      gsap.to('.hero-blob-b', {
        yPercent: -25, xPercent: 10, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: true },
      });

      // Hero fade out as it scrolls
      gsap.to('.hero-inner', {
        opacity: 0.2, scale: 0.96, y: -40, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top top', end: 'bottom 30%', scrub: true },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100svh] flex items-center justify-center bg-background text-foreground overflow-hidden"
    >
      {/* Parallax glow blobs */}
      <div aria-hidden className="hero-blob-a absolute -top-32 -left-32 w-[480px] h-[480px] rounded-full opacity-60 blur-3xl"
           style={{ background: 'radial-gradient(circle, hsl(36 100% 55% / 0.18), transparent 70%)' }} />
      <div aria-hidden className="hero-blob-b absolute -bottom-32 -right-32 w-[520px] h-[520px] rounded-full opacity-50 blur-3xl"
           style={{ background: 'radial-gradient(circle, hsl(36 100% 50% / 0.12), transparent 70%)' }} />

      <div className="hero-inner relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-8 py-24 sm:py-32 text-center">
        <div className="hero-eyebrow inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-[11px] font-medium uppercase tracking-[0.14em] text-muted-foreground mb-8">
          Industrial Conglomerate · Est. 2013
        </div>

        <img
          src={companyLogo}
          alt="Tibrewal Group"
          className="hero-logo h-14 sm:h-16 w-auto mx-auto mb-8 object-contain"
          fetchPriority="high"
          width={64}
          height={64}
        />

        <h1
          ref={titleRef}
          className="hero-title hero-title-mobile font-display text-[clamp(2.4rem,7.5vw,5.5rem)] font-semibold leading-[1.04] tracking-[-0.028em] mb-6"
        >
          Tibrewal Group. Built to last.
        </h1>

        <p className="hero-sub max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed mb-10">
          A diversified industrial business group powering Jharkhand&rsquo;s mining,
          stone crushing, petroleum, tyres and agro processing economy.
        </p>

        <div className="hero-cta flex flex-wrap items-center justify-center gap-3 mb-12">
          <span data-magnetic className="inline-block">
            <Button
              size="lg"
              className="glow-pulse-amber shine-on-hover"
              onClick={() => document.getElementById('companies')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Explore the Group
              <ArrowRight className="h-4 w-4" />
            </Button>
          </span>
          <span data-magnetic className="inline-block">
            <Button
              variant="ghost"
              size="lg"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            >
              Get in touch
            </Button>
          </span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              data-magnetic
              onClick={() => document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' })}
              className="hero-pill px-3.5 py-1.5 rounded-full text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
