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
  const marqueeRef = useRef<HTMLDivElement>(null);
  const marqueeReverseRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.from('.trusted-heading', {
        opacity: 0, y: 40, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });
      gsap.from('.trusted-sub', {
        opacity: 0, y: 20, duration: 0.6, delay: 0.2, ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });
      gsap.from('.trusted-line', {
        scaleX: 0, duration: 0.8, delay: 0.3, ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });
      gsap.utils.toArray<HTMLElement>('.client-name-pill').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0, x: i % 2 === 0 ? -30 : 30, duration: 0.5,
          ease: 'power2.out', delay: i * 0.06,
          scrollTrigger: { trigger: '.client-names-grid', start: 'top 88%' },
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    // Row 1: scroll left
    const el = marqueeRef.current;
    if (el) {
      const inner = el.querySelector('.marquee-track') as HTMLElement;
      if (inner) {
        inner.innerHTML += inner.innerHTML;
        const totalWidth = inner.scrollWidth / 2;
        const tween = gsap.to(inner, {
          x: -totalWidth, duration: 30, ease: 'none', repeat: -1,
          modifiers: { x: gsap.utils.unitize((x: number) => x % totalWidth) },
        });
        el.addEventListener('mouseenter', () => tween.timeScale(0.3));
        el.addEventListener('mouseleave', () => tween.timeScale(1));
      }
    }

    // Row 2: scroll right (reverse)
    const el2 = marqueeReverseRef.current;
    if (el2) {
      const inner2 = el2.querySelector('.marquee-track-reverse') as HTMLElement;
      if (inner2) {
        inner2.innerHTML += inner2.innerHTML;
        const totalWidth2 = inner2.scrollWidth / 2;
        gsap.set(inner2, { x: -totalWidth2 });
        const tween2 = gsap.to(inner2, {
          x: 0, duration: 35, ease: 'none', repeat: -1,
          modifiers: { x: gsap.utils.unitize((x: number) => {
            const mod = x % totalWidth2;
            return mod > 0 ? mod - totalWidth2 : mod;
          }) },
        });
        el2.addEventListener('mouseenter', () => tween2.timeScale(0.3));
        el2.addEventListener('mouseleave', () => tween2.timeScale(1));
      }
    }
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden" style={{ background: '#ffffff' }}>
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #f97316, #fb923c, #f97316)' }} />

      <div className="py-24 md:py-36">
        <div className="max-w-6xl mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-16 md:mb-20">
            <p className="trusted-sub text-xs font-bold tracking-[0.3em] uppercase mb-4" style={{ color: '#f97316' }}>
              Our Esteemed Clients
            </p>
            <h2 className="trusted-heading text-4xl md:text-5xl lg:text-6xl font-extrabold leading-tight" style={{ color: '#0B1F33' }}>
              Trusted by Industry Leaders
            </h2>
            <div className="trusted-line w-24 h-1.5 mx-auto mt-6 rounded-full origin-left" style={{ background: 'linear-gradient(90deg, #f97316, #fb923c)' }} />
            <p className="trusted-sub mt-6 text-base md:text-lg max-w-2xl mx-auto" style={{ color: '#4b5563' }}>
              We are proud to have served and supplied premium materials &amp; services to some of India's most respected infrastructure and engineering companies.
            </p>
          </div>
        </div>

        {/* Infinite Marquee Row 1 */}
        <div ref={marqueeRef} className="relative w-full overflow-hidden py-6 cursor-grab" style={{ maskImage: 'linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)' }}>
          <div className="marquee-track flex items-center gap-12 w-max">
            {clients.map((client, i) => (
              <div
                key={i}
                className="group flex-shrink-0 flex items-center justify-center rounded-2xl border transition-all duration-500"
                style={{ background: '#fafafa', borderColor: '#e5e7eb', width: '220px', height: '120px' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#f97316';
                  e.currentTarget.style.boxShadow = '0 8px 40px -8px rgba(249,115,22,0.18)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <img src={client.logo} alt={client.name} className="max-h-14 w-auto object-contain transition-all duration-500" loading="lazy" />
              </div>
            ))}
          </div>
        </div>

        {/* Infinite Marquee Row 2 (Reverse) */}
        <div ref={marqueeReverseRef} className="relative w-full overflow-hidden py-6 mb-20 md:mb-28 cursor-grab" style={{ maskImage: 'linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)', WebkitMaskImage: 'linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%)' }}>
          <div className="marquee-track-reverse flex items-center gap-12 w-max">
            {[...clients].reverse().map((client, i) => (
              <div
                key={i}
                className="group flex-shrink-0 flex items-center justify-center rounded-2xl border transition-all duration-500"
                style={{ background: '#fafafa', borderColor: '#e5e7eb', width: '220px', height: '120px' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#f97316';
                  e.currentTarget.style.boxShadow = '0 8px 40px -8px rgba(249,115,22,0.18)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <img src={client.logo} alt={client.name} className="max-h-14 w-auto object-contain transition-all duration-500" loading="lazy" />
              </div>
            ))}
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4">
          {/* Divider */}
          <div className="flex items-center gap-4 mb-16 md:mb-20 max-w-3xl mx-auto">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, #d1d5db)' }} />
            <span className="text-xs font-bold tracking-[0.25em] uppercase" style={{ color: '#9ca3af' }}>Companies We've Served</span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #d1d5db, transparent)' }} />
          </div>

          {/* Company Name Pills */}
          <div className="client-names-grid flex flex-wrap justify-center gap-4 md:gap-5 max-w-4xl mx-auto">
            {clients.map((c, i) => (
              <span
                key={i}
                className="client-name-pill inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm md:text-base font-semibold transition-all duration-300 cursor-default border"
                style={{ background: '#f8fafc', color: '#1e293b', borderColor: '#e2e8f0' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#0B1F33'; e.currentTarget.style.color = '#ffffff'; e.currentTarget.style.borderColor = '#0B1F33'; e.currentTarget.style.transform = 'scale(1.05)'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.color = '#1e293b'; e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: '#f97316' }} />
                {c.name}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #f97316, #fb923c, #f97316)' }} />
    </section>
  );
};

export default TrustedBySection;
