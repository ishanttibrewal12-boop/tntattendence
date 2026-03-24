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

    const ctx = gsap.context(() => {
      // Header reveal
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

      // Logo cards stagger
      gsap.utils.toArray<HTMLElement>('.client-card').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0, y: 50, scale: 0.85, duration: 0.6,
          ease: 'back.out(1.4)',
          delay: i * 0.08,
          scrollTrigger: { trigger: el, start: 'top 90%' },
        });
      });

      // Company names stagger
      gsap.utils.toArray<HTMLElement>('.client-name-pill').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0, x: i % 2 === 0 ? -30 : 30, duration: 0.5,
          ease: 'power2.out',
          delay: i * 0.06,
          scrollTrigger: { trigger: '.client-names-grid', start: 'top 88%' },
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden" style={{ background: '#ffffff' }}>
      {/* Top decorative gradient edge */}
      <div className="absolute top-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #f97316, #fb923c, #f97316)' }} />

      <div className="py-24 md:py-36">
        <div className="max-w-6xl mx-auto px-4">
          {/* Section Header */}
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

          {/* Logo Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-6 md:gap-8 mb-20 md:mb-28">
            {clients.map((client, i) => (
              <div
                key={i}
                className="client-card group relative flex items-center justify-center p-6 md:p-10 rounded-2xl border transition-all duration-500 cursor-default"
                style={{
                  background: '#fafafa',
                  borderColor: '#e5e7eb',
                  minHeight: '140px',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = '#f97316';
                  el.style.boxShadow = '0 8px 40px -8px rgba(249,115,22,0.18)';
                  el.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.borderColor = '#e5e7eb';
                  el.style.boxShadow = 'none';
                  el.style.transform = 'translateY(0)';
                }}
              >
                <img
                  src={client.logo}
                  alt={client.name}
                  className="max-h-16 md:max-h-20 w-auto object-contain transition-all duration-500 grayscale group-hover:grayscale-0"
                  loading="lazy"
                />
                {/* Hover tooltip */}
                <div
                  className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-xs font-bold tracking-wide opacity-0 group-hover:opacity-100 transition-all duration-300 whitespace-nowrap pointer-events-none"
                  style={{ background: '#0B1F33', color: '#ffffff', transform: 'translateX(-50%) translateY(4px)' }}
                >
                  {client.name}
                </div>
              </div>
            ))}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-4 mb-16 md:mb-20 max-w-3xl mx-auto">
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, #d1d5db)' }} />
            <span className="text-xs font-bold tracking-[0.25em] uppercase" style={{ color: '#9ca3af' }}>Companies We've Served</span>
            <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, #d1d5db, transparent)' }} />
          </div>

          {/* Company Names as Premium Pills */}
          <div className="client-names-grid flex flex-wrap justify-center gap-4 md:gap-5 max-w-4xl mx-auto">
            {[
              'Montecarlo',
              'UltraTech Cement',
              'Navayuga Engineering',
              'Megha Engineering (MEIL)',
              'Afcons Infrastructure',
              'Rahee Infratech',
              'APCO Infratech Pvt. Ltd.',
              'S.P. Singla Constructions Pvt. Ltd.',
              'Skylark Infra Engineering',
            ].map((name, i) => (
              <span
                key={i}
                className="client-name-pill inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm md:text-base font-semibold transition-all duration-300 cursor-default border"
                style={{ background: '#f8fafc', color: '#1e293b', borderColor: '#e2e8f0' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#0B1F33';
                  e.currentTarget.style.color = '#ffffff';
                  e.currentTarget.style.borderColor = '#0B1F33';
                  e.currentTarget.style.transform = 'scale(1.05)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.color = '#1e293b';
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.transform = 'scale(1)';
                }}
              >
                <span className="w-2 h-2 rounded-full" style={{ background: '#f97316' }} />
                {name}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom decorative gradient edge */}
      <div className="absolute bottom-0 left-0 right-0 h-1" style={{ background: 'linear-gradient(90deg, #f97316, #fb923c, #f97316)' }} />
    </section>
  );
};

export default TrustedBySection;
