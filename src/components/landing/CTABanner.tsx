import { Phone, Mail, MessageCircle, ArrowRight } from 'lucide-react';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Button } from '@/components/ui/button';
import { useSplitTextReveal, useMagneticGroup, useCursorSpotlight } from '@/lib/motion/gsapUtils';

gsap.registerPlugin(ScrollTrigger);

const CTABanner = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useSplitTextReveal(headingRef, { type: 'chars', stagger: 0.018, skew: 8, duration: 1.0 });
  useMagneticGroup(sectionRef, '[data-magnetic]', 0.45);
  useCursorSpotlight(sectionRef, 'hsla(36,100%,55%,0.18)');

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.from('.cta-sub, .cta-actions', {
        opacity: 0, y: 20, duration: 0.8, ease: 'power3.out', stagger: 0.12,
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-background border-y border-border relative overflow-hidden">
      <div className="cta-content max-w-3xl mx-auto px-6 text-center relative z-10">
        <h2 ref={headingRef} className="font-display text-[clamp(1.9rem,4.6vw,3.2rem)] font-semibold leading-[1.06] tracking-[-0.024em] text-foreground mb-5">
          Ready to partner with us?
        </h2>
        <p className="cta-sub text-base md:text-lg text-muted-foreground max-w-xl mx-auto mb-10">
          Aggregates, transportation, fuel, or tyres — your one-stop industrial partner in Jharkhand.
        </p>
        <div className="cta-actions flex flex-col sm:flex-row items-center justify-center gap-3">
          <span data-magnetic className="inline-block">
            <Button size="lg" className="glow-pulse-amber shine-on-hover" asChild>
              <a href="tel:9006767633">
                <Phone className="h-4 w-4" />
                Call Director
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
          </span>
          <span data-magnetic className="inline-block">
            <Button size="lg" variant="outline" asChild>
              <a href="mailto:trishavkumar992@gmail.com">
                <Mail className="h-4 w-4" />
                Email
              </a>
            </Button>
          </span>
          <span data-magnetic className="inline-block">
            <Button size="lg" variant="ghost" asChild>
              <a href="https://wa.me/919386469006" target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </a>
            </Button>
          </span>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;
