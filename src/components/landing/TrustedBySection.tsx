import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useMarquee, useTiltCards } from '@/lib/motion/gsapUtils';

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
  const marqueeRef = useRef<HTMLDivElement>(null);
  const reverseRef = useRef<HTMLDivElement>(null);

  useMarquee(marqueeRef, { speed: 40, direction: -1 });
  useMarquee(reverseRef, { speed: 30, direction: 1 });
  useTiltCards(sectionRef, '.client-tile', 8);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.from('.trusted-head > *', {
        opacity: 0, y: 24, duration: 0.9, ease: 'power3.out', stagger: 0.1,
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  // duplicate for marquee loop
  const marqueeClients = [...clients, ...clients];

  return (
    <section ref={sectionRef} id="clients" className="py-24 md:py-32 bg-background overflow-hidden">
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
      </div>

      {/* Infinite marquee — row 1 */}
      <div className="relative w-full overflow-hidden mb-4 mask-fade-x">
        <div ref={marqueeRef} className="flex items-center gap-4 will-change-transform" style={{ width: 'max-content' }}>
          {marqueeClients.map((client, i) => (
            <div
              key={`r1-${i}`}
              className="client-tile flex items-center justify-center rounded-2xl border border-border bg-card w-[220px] h-[110px] p-6 shrink-0 hover:border-foreground/30 transition-colors"
            >
              <img src={client.logo} alt={client.name} className="max-h-12 w-auto object-contain" loading="lazy" />
            </div>
          ))}
        </div>
      </div>

      {/* Infinite marquee — row 2 reverse */}
      <div className="relative w-full overflow-hidden mb-12 mask-fade-x">
        <div ref={reverseRef} className="flex items-center gap-4 will-change-transform" style={{ width: 'max-content' }}>
          {marqueeClients.slice().reverse().map((client, i) => (
            <div
              key={`r2-${i}`}
              className="client-tile flex items-center justify-center rounded-2xl border border-border bg-card w-[200px] h-[100px] p-5 shrink-0 hover:border-foreground/30 transition-colors"
            >
              <img src={client.logo} alt={client.name} className="max-h-10 w-auto object-contain" loading="lazy" />
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-6">
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

      <style>{`
        .mask-fade-x {
          -webkit-mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
                  mask-image: linear-gradient(to right, transparent, black 8%, black 92%, transparent);
        }
      `}</style>
    </section>
  );
};

export default TrustedBySection;
