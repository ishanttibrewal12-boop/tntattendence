import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Pickaxe, Wheat, TrendingUp } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const companies = [
  {
    title: 'Bharat Petroleum Fuel Station',
    year: '2014',
    desc: 'Petroleum Distribution',
    detail: 'The foundational business of Tibrewal Group. Operating a full-service Bharat Petroleum fuel station, this unit provides reliable fuel supply to transporters, fleet operators, and the local community.',
    icon: '⛽',
    highlights: ['24/7 fuel availability', 'BPCL partnership', 'Fleet fueling services', 'Community fuel supply'],
  },
  {
    title: 'Tibrewal Mines & Minerals Pvt. Ltd.',
    year: '2022',
    desc: 'Mining & Mineral Extraction',
    detail: 'Operates in the core mining sector with a focus on extraction and supply of high-quality natural minerals from the mineral-rich region of Jharkhand. Modern excavation equipment and sustainable mining practices.',
    icon: '⛏️',
    highlights: ['Open-pit mining operations', 'Stone crushing plants', 'High-quality aggregates', 'Sustainable practices'],
  },
  {
    title: 'Tibrewal Tyres',
    year: '2024',
    desc: 'Tyre Trading & Distribution',
    detail: 'Specializes in tyre trading and distribution for commercial and heavy-duty vehicles. Catering to transporters, fleet owners, and industrial clients with a comprehensive range from leading manufacturers.',
    icon: '🛞',
    highlights: ['Commercial vehicle tyres', 'Heavy-duty range', 'Competitive pricing', 'Pan-brand availability'],
  },
  {
    title: 'Tibrewal Agro Food Processing',
    year: '2025',
    desc: 'Agricultural Processing',
    detail: 'Focusing on processing and value addition of agricultural produce. Bridging the gap between raw agricultural resources and market-ready products, contributing to the region\'s agricultural economy.',
    icon: '🌾',
    highlights: ['Value-added processing', 'Farm-to-market chain', 'Quality food products', 'Regional agricultural support'],
  },
  {
    title: 'Tibrewal Ventures',
    year: '2025',
    desc: 'Strategic Investments',
    detail: 'The strategic investment and expansion arm of the group. Identifies new business opportunities across infrastructure, trading, and industrial services for continued growth and diversification.',
    icon: '📈',
    highlights: ['New sector identification', 'Strategic partnerships', 'Infrastructure investments', 'Growth acceleration'],
  },
];

const CompanyShowcase = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
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

  return (
    <section ref={sectionRef} className="py-20 md:py-28" style={{ background: '#0d1118' }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-[0.25em] uppercase mb-2 text-orange-400">Our Companies</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white/95">Business Verticals</h2>
          <div className="w-16 h-1 mx-auto mt-4 rounded-full bg-orange-500" />
          <p className="mt-4 max-w-xl mx-auto text-sm md:text-base text-white/50">
            A diversified portfolio of industrial businesses powering Jharkhand's growth.
          </p>
        </div>

        <div className="space-y-6">
          {companies.map((company, i) => (
            <div
              key={i}
              className="company-card rounded-2xl border border-white/8 overflow-hidden transition-all duration-300 hover:border-orange-500/20"
              style={{ background: '#161b26' }}
            >
              <div className="p-6 md:p-8">
                <div className="flex items-start gap-4 md:gap-6">
                  <div className="text-3xl md:text-4xl flex-shrink-0">{company.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-3 mb-2">
                      <h3 className="text-lg md:text-xl font-bold text-white/90">{company.title}</h3>
                      <span className="text-[10px] font-bold tracking-widest uppercase px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400">
                        Est. {company.year}
                      </span>
                    </div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3">{company.desc}</p>
                    <p className="text-sm leading-relaxed text-white/55 mb-5">{company.detail}</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {company.highlights.map((h, j) => (
                        <div key={j} className="flex items-center gap-2 text-xs text-white/50">
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
