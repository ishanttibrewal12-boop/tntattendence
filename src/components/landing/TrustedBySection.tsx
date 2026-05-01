import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import montecarloLogo from '@/assets/clients/montecarlo.png';
import ultratechLogo from '@/assets/clients/ultratech.jpeg';
import navayugaLogo from '@/assets/clients/navayuga.jpeg';
import meilLogo from '@/assets/clients/meil.jpeg';
import afconsLogo from '@/assets/clients/afcons.jpeg';
import raheeLogo from '@/assets/clients/rahee.png';
import apcoLogo from '@/assets/clients/apco.jpeg';
import spsinglaLogo from '@/assets/clients/spsingla.jpeg';
import skylarkLogo from '@/assets/clients/skylark.jpeg';

gsap.registerPlugin(ScrollTrigger);

const clients = [
  { name: 'Montecarlo', logo: montecarloLogo },
  { name: 'UltraTech Cement', logo: ultratechLogo },
  { name: 'Navayuga Engineering', logo: navayugaLogo },
  { name: 'Megha Engineering (MEIL)', logo: meilLogo },
  { name: 'Afcons Infrastructure', logo: afconsLogo },
  { name: 'Rahee Infratech', logo: raheeLogo },
  { name: 'APCO Infratech Pvt. Ltd.', logo: apcoLogo },
  { name: 'S.P. Singla Constructions Pvt. Ltd.', logo: spsinglaLogo },
  { name: 'Skylark Infra Engineering', logo: skylarkLogo },
];

const TrustedBySection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.from('.trusted-head > *', {
        opacity: 0, y: 14, duration: 0.6, ease: 'power2.out', stagger: 0.08,
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });
      gsap.utils.toArray<HTMLElement>('.client-tile').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0, y: 10, duration: 0.4, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 92%' },
          delay: (i % 4) * 0.04,
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="clients" className="py-24 md:py-32 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="trusted-head text-center mb-14">
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground mb-4">Our Clients</p>
          <h2 className="font-display text-[clamp(1.9rem,4.4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.024em] text-foreground">
            Trusted by industry leaders.
          </h2>
          <p className="mt-4 text-base md:text-lg max-w-2xl mx-auto text-muted-foreground">
            Premium materials and services for India's most respected infrastructure and engineering companies.
          </p>
        </div>

        {/* Client logos grid (no marquee — clean static grid like Apple) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-3 md:gap-4 mb-14">
          {clients.map((client, i) => (
            <div
              key={i}
              className="client-tile flex items-center justify-center rounded-2xl border border-border bg-card aspect-[2/1] p-6 hover:border-foreground/20 transition-colors"
            >
              <img
                src={client.logo}
                alt={client.name}
                className="max-h-12 md:max-h-14 w-auto object-contain"
                loading="lazy"
              />
            </div>
          ))}
        </div>

        {/* Company name pills */}
        <div className="flex flex-wrap justify-center gap-2 max-w-4xl mx-auto">
          {clients.map((c, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-medium border border-border text-muted-foreground"
            >
              <span className="w-1 h-1 rounded-full bg-accent" />
              {c.name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrustedBySection;
