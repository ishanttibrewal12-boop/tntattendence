import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Shield, Truck, Mountain, Fuel, TrendingUp, Users } from 'lucide-react';
import { useTiltCards, useCursorSpotlight, useSplitTextReveal } from '@/lib/motion/gsapUtils';

gsap.registerPlugin(ScrollTrigger);

const features = [
  { icon: Mountain, title: 'Mining Expertise', desc: 'Deep domain expertise in open-pit mining operations with modern excavation equipment and safety protocols.' },
  { icon: Shield, title: 'Quality Assurance', desc: 'Rigorous quality control across every vertical — from aggregate grading to fuel purity standards.' },
  { icon: Truck, title: 'Logistics Network', desc: "An extensive fleet of heavy-duty trucks ensuring seamless material movement across Jharkhand's industrial corridors." },
  { icon: Fuel, title: 'Fuel Security', desc: 'Own Bharat Petroleum station guaranteeing uninterrupted fuel supply for operations and the community.' },
  { icon: TrendingUp, title: 'Rapid Growth', desc: 'From a single crusher to a multi-vertical conglomerate — and still expanding.' },
  { icon: Users, title: 'Strong Workforce', desc: 'A large, skilled team of operators, drivers, and managers powering round-the-clock operations.' },
];

const WhyChooseUs = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useTiltCards(sectionRef, '.wcu-card', 10);
  useCursorSpotlight(sectionRef, 'hsla(36,100%,55%,0.14)');
  useSplitTextReveal(headingRef, { type: 'words', stagger: 0.05, skew: 6 });

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.wcu-card').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0, y: 14, duration: 0.5, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%' },
          delay: (i % 3) * 0.06,
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-background relative">
      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="text-center mb-14">
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground mb-4">Why Choose Us</p>
          <h2 ref={headingRef} className="font-display text-[clamp(1.9rem,4.4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.024em] text-foreground">
            Built on strength. Driven by purpose.
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" style={{ perspective: 1000 }}>
          {features.map((f, i) => (
            <div key={i} className="wcu-card p-6 rounded-2xl border border-border bg-card transition-colors hover:border-foreground/30 hover:shadow-lg">
              <div className="w-10 h-10 rounded-full flex items-center justify-center mb-5 bg-muted">
                <f.icon className="h-5 w-5 text-foreground" />
              </div>
              <h3 className="text-base font-semibold tracking-[-0.012em] text-foreground mb-2">{f.title}</h3>
              <p className="text-[14px] leading-relaxed text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
