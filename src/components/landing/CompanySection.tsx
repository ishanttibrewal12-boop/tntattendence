import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import heroImg from '@/assets/hero-mining-operations.jpg';

gsap.registerPlugin(ScrollTrigger);

const CompanySection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.from('.about-text > *', {
        opacity: 0, y: 14, duration: 0.6, ease: 'power2.out', stagger: 0.08,
        scrollTrigger: { trigger: '.about-text', start: 'top 85%' },
      });
      gsap.from('.about-image', {
        opacity: 0, y: 14, duration: 0.7, ease: 'power2.out',
        scrollTrigger: { trigger: '.about-image', start: 'top 85%' },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="about" className="py-24 md:py-32 bg-muted/30">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground mb-4">About Us</p>
          <h2 className="font-display text-[clamp(1.9rem,4.4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.024em] text-foreground">
            Powering growth since 2013.
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="about-image rounded-2xl overflow-hidden border border-border">
            <img src={heroImg} alt="Mining Operations" className="w-full aspect-video object-cover" loading="lazy" />
          </div>

          <div className="about-text space-y-5">
            <p className="leading-relaxed text-base md:text-lg text-muted-foreground">
              Tibrewal Group is a prominent business group based in Jharkhand, operating across mining, stone crushing, petroleum distribution, tyre trading, agro-food processing, and strategic investments. With a commitment to quality and reliability, we have established ourselves as a trusted name in the region's industrial landscape.
            </p>
            <p className="leading-relaxed text-base md:text-lg text-muted-foreground">
              Our integrated operations span multiple verticals, serving the growing infrastructure needs of Eastern India. From raw material extraction to processed aggregate delivery, we control the entire value chain — ensuring quality, efficiency, and dependability at every step.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompanySection;
