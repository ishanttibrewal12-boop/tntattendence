import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const companies = [
  {
    title: 'Tibrewal Ventures',
    year: '2025',
    desc: 'Strategic Investments & Expansion',
    detail: 'The flagship strategic investment and expansion arm of Tibrewal Group. Tibrewal Ventures identifies and capitalizes on high-potential business opportunities across infrastructure, technology, trading, and industrial services. As the most dynamic entity of the group, it drives the vision for future growth, strategic partnerships, and new market entries.',
    icon: '📈',
    highlights: ['New sector identification', 'Strategic partnerships & JVs', 'Infrastructure investments', 'Growth acceleration', 'Market expansion', 'Future-forward approach'],
    featured: true,
  },
  {
    title: 'Tibrewal Mines & Minerals Pvt. Ltd.',
    year: '2022',
    desc: 'Mining & Mineral Extraction',
    detail: 'Operates in the core mining sector with a focus on extraction and supply of high-quality natural minerals from the mineral-rich region of Jharkhand. Modern excavation equipment and sustainable mining practices ensure top-quality aggregates for the construction industry.',
    icon: '⛏️',
    highlights: ['Open-pit mining operations', 'Stone crushing plants', 'High-quality aggregates', 'Sustainable practices'],
    featured: false,
  },
  {
    title: 'Bharat Petroleum Fuel Station',
    year: '2013',
    desc: 'Petroleum Distribution',
    detail: 'The foundational business of Tibrewal Group. Operating a full-service Bharat Petroleum fuel station since 2013, this unit provides reliable fuel supply to transporters, fleet operators, and the local community across Jharkhand.',
    icon: '⛽',
    highlights: ['24/7 fuel availability', 'BPCL partnership', 'Fleet fueling services', 'Community fuel supply'],
    featured: false,
  },
  {
    title: 'Tibrewal Tyres',
    year: '2014',
    desc: 'Tyre Trading & Distribution',
    detail: 'Specializes in tyre trading and distribution for commercial and heavy-duty vehicles. Catering to transporters, fleet owners, and industrial clients with a comprehensive range from leading manufacturers across India.',
    icon: '🛞',
    highlights: ['Commercial vehicle tyres', 'Heavy-duty range', 'Competitive pricing', 'Pan-brand availability'],
    featured: false,
  },
  {
    title: 'Tibrewal Agro Food Processing',
    year: '2022',
    desc: 'Agricultural Processing',
    detail: 'Focusing on processing and value addition of agricultural produce. Bridging the gap between raw agricultural resources and market-ready products, contributing to the region\'s agricultural economy and food security.',
    icon: '🌾',
    highlights: ['Value-added processing', 'Farm-to-market chain', 'Quality food products', 'Regional agricultural support'],
    featured: false,
  },
];

const CompanyShowcase = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Featured card
      gsap.from('.featured-card', {
        opacity: 0, y: 80, scale: 0.95, duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: '.featured-card', start: 'top 88%', toggleActions: 'play none none none' },
      });

      gsap.utils.toArray<HTMLElement>('.company-card').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0, y: 60, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
          delay: i * 0.08,
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  const featured = companies.find(c => c.featured)!;
  const others = companies.filter(c => !c.featured);

  return (
    <section ref={sectionRef} className="py-24 md:py-36" style={{ background: '#0d1118' }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3 text-orange-400">Our Companies</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white/95">Business Verticals</h2>
          <div className="w-20 h-1 mx-auto mt-5 rounded-full bg-orange-500" />
          <p className="mt-5 max-w-xl mx-auto text-sm md:text-base text-white/50">
            A diversified portfolio of industrial businesses powering Jharkhand's growth and infrastructure development.
          </p>
        </div>

        {/* Featured — Tibrewal Ventures */}
        <div className="featured-card mb-10 rounded-3xl overflow-hidden border-2 border-orange-500/30 relative" style={{ background: 'linear-gradient(135deg, #1a1f2e 0%, #1e2538 50%, #1a1f2e 100%)' }}>
          <div className="absolute top-0 left-0 w-full h-[3px]" style={{ background: 'linear-gradient(90deg, transparent, #f97316, transparent)' }} />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" style={{ background: 'radial-gradient(circle, rgba(249,115,22,0.15) 0%, transparent 70%)' }} />
          
          <div className="p-8 md:p-12 lg:p-16 relative z-10">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-16 items-start">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-4">
                  <span className="text-5xl md:text-6xl">{featured.icon}</span>
                  <span className="text-[10px] font-extrabold tracking-[0.25em] uppercase px-4 py-2 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/25">
                    ★ Flagship Company
                  </span>
                </div>
                <h3 className="text-3xl md:text-4xl font-extrabold text-white mb-3">{featured.title}</h3>
                <p className="text-sm font-bold uppercase tracking-wider text-orange-400/70 mb-5">{featured.desc} · Est. {featured.year}</p>
                <p className="text-base md:text-lg leading-relaxed text-white/60 mb-8">{featured.detail}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {featured.highlights.map((h, j) => (
                    <div key={j} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 border border-white/8 text-sm text-white/60">
                      <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                      {h}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Other companies */}
        <div className="space-y-6">
          {others.map((company, i) => (
            <div
              key={i}
              className="company-card rounded-2xl border border-white/8 overflow-hidden transition-all duration-300 hover:border-orange-500/20 hover:shadow-[0_4px_30px_-10px_rgba(249,115,22,0.1)]"
              style={{ background: '#161b26' }}
            >
              <div className="p-8 md:p-10">
                <div className="flex items-start gap-5 md:gap-8">
                  <div className="text-4xl md:text-5xl flex-shrink-0">{company.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-3">
                      <h3 className="text-xl md:text-2xl font-bold text-white/90">{company.title}</h3>
                      <span className="text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/15">
                        Est. {company.year}
                      </span>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-4">{company.desc}</p>
                    <p className="text-sm md:text-base leading-relaxed text-white/55 mb-6">{company.detail}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {company.highlights.map((h, j) => (
                        <div key={j} className="flex items-center gap-2 text-sm text-white/50">
                          <div className="w-1.5 h-1.5 rounded-full bg-orange-500/60 flex-shrink-0" />
                          {h}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CompanyShowcase;
