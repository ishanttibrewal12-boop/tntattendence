import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ArrowRight } from 'lucide-react';
import companyLogo from '@/assets/tibrewal-logo.png';
import { Button } from '@/components/ui/button';

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

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });
      tl.from('.hero-eyebrow', { y: 8, opacity: 0, duration: 0.5 })
        .from('.hero-logo',    { y: 8, opacity: 0, duration: 0.5 }, '-=0.35')
        .from('.hero-title',   { y: 14, opacity: 0, duration: 0.7 }, '-=0.3')
        .from('.hero-sub',     { y: 10, opacity: 0, duration: 0.5 }, '-=0.4')
        .from('.hero-cta > *', { y: 10, opacity: 0, duration: 0.45, stagger: 0.06 }, '-=0.3')
        .from('.hero-pill',    { y: 6, opacity: 0, duration: 0.35, stagger: 0.04 }, '-=0.25');
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative min-h-[100svh] flex items-center justify-center bg-background text-foreground overflow-hidden"
    >
      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 sm:px-8 py-24 sm:py-32 text-center">
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
          className="hero-title hero-title-mobile font-display text-[clamp(2.4rem,7.5vw,5.5rem)] font-semibold leading-[1.04] tracking-[-0.028em] mb-6"
        >
          Tibrewal Group.
          <br />
          <span className="text-muted-foreground">Built to last.</span>
        </h1>

        <p className="hero-sub max-w-2xl mx-auto text-base sm:text-lg md:text-xl text-muted-foreground leading-relaxed mb-10">
          A diversified industrial business group powering Jharkhand&rsquo;s mining,
          stone crushing, petroleum, tyres and agro processing economy.
        </p>

        <div className="hero-cta flex flex-wrap items-center justify-center gap-3 mb-12">
          <Button
            size="lg"
            onClick={() => document.getElementById('companies')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Explore the Group
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
          >
            Get in touch
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          {NAV_LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' })}
              className="hero-pill px-3.5 py-1.5 rounded-full text-xs font-medium border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
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
