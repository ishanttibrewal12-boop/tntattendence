import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Star } from 'lucide-react';
import { useTiltCards } from '@/lib/motion/gsapUtils';

gsap.registerPlugin(ScrollTrigger);

const companies = [
  {
    title: 'Tibrewal Ventures',
    year: '2025',
    desc: 'Strategic Investments & Expansion',
    detail: 'The flagship strategic investment and expansion arm of Tibrewal Group. Identifies and capitalizes on high-potential business opportunities across infrastructure, technology, trading, and industrial services.',
    highlights: ['New sector identification', 'Strategic partnerships & JVs', 'Infrastructure investments', 'Growth acceleration', 'Market expansion', 'Future-forward approach'],
    featured: true,
  },
  {
    title: 'Tibrewal & Tibrewal Pvt. Ltd.',
    year: '2021',
    desc: 'Transport & Logistics',
    detail: 'A Private Limited Company specializing in freight transport by road. Directed by Trishav Tibrewal, handling the group\'s transport and logistics operations across Jharkhand and beyond.',
    highlights: ['Freight transport by road', 'Fleet management', 'Material logistics', 'Pan-regional operations'],
    featured: false,
  },
  {
    title: 'Tibrewal Mines & Minerals Pvt. Ltd.',
    year: '2022',
    desc: 'Mining & Mineral Extraction',
    detail: 'Operates in the core mining sector with a focus on extraction and supply of high-quality natural minerals from the mineral-rich region of Jharkhand.',
    highlights: ['Open-pit mining operations', 'Stone crushing plants', 'High-quality aggregates', 'Sustainable practices'],
    featured: false,
  },
  {
    title: 'Bharat Petroleum Fuel Station',
    year: '2013',
    desc: 'Petroleum Distribution',
    detail: 'The foundational business of Tibrewal Group. Operating a full-service Bharat Petroleum fuel station since 2013, providing reliable fuel supply to transporters, fleet operators, and the local community.',
    highlights: ['24/7 fuel availability', 'BPCL partnership', 'Fleet fueling services', 'Community fuel supply'],
    featured: false,
  },
  {
    title: 'Tibrewal Tyres',
    year: '2014',
    desc: 'Tyre Trading & Distribution',
    detail: 'Specializes in tyre trading and distribution for commercial and heavy-duty vehicles, catering to transporters, fleet owners, and industrial clients across India.',
    highlights: ['Commercial vehicle tyres', 'Heavy-duty range', 'Competitive pricing', 'Pan-brand availability'],
    featured: false,
  },
  {
    title: 'Tibrewal Agro Food Processing',
    year: '2022',
    desc: 'Agricultural Processing',
    detail: 'Focusing on processing and value addition of agricultural produce. Bridging the gap between raw agricultural resources and market-ready products.',
    highlights: ['Value-added processing', 'Farm-to-market chain', 'Quality food products', 'Regional agricultural support'],
    featured: false,
  },
];

const CompanyShowcase = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useTiltCards(sectionRef, '.company-card', 6);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.company-card').forEach((el) => {
        gsap.from(el, {
          opacity: 0, y: 30, scale: 0.95, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  const featured = companies.find(c => c.featured)!;
  const others = companies.filter(c => !c.featured);

  return (
    <section ref={sectionRef} id="companies" className="py-24 md:py-32 bg-background">
      <div className="max-w-5xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground mb-4">Our Companies</p>
          <h2 className="font-display text-[clamp(1.9rem,4.4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.024em] text-foreground">
            Business verticals.
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-base md:text-lg text-muted-foreground">
            A diversified portfolio of industrial businesses powering Jharkhand's growth.
          </p>
        </div>

        {/* Featured */}
        <div className="company-card mb-6 rounded-2xl border border-border bg-card p-8 md:p-10">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] font-medium tracking-[0.14em] uppercase px-2.5 py-1 rounded-full bg-accent/10 text-accent border border-accent/20">
              <Star className="h-3 w-3 fill-current" /> Flagship
            </span>
            <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground">Est. {featured.year}</span>
          </div>
          <h3 className="text-2xl md:text-3xl font-semibold tracking-[-0.018em] text-foreground mb-2">{featured.title}</h3>
          <p className="text-sm font-medium uppercase tracking-[0.14em] text-muted-foreground mb-5">{featured.desc}</p>
          <p className="text-base md:text-lg leading-relaxed text-muted-foreground mb-6">{featured.detail}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {featured.highlights.map((h, j) => (
              <div key={j} className="flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-[13px] text-muted-foreground">
                <span className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                {h}
              </div>
            ))}
          </div>
        </div>

        {/* Other companies */}
        <div className="grid md:grid-cols-2 gap-4">
          {others.map((company, i) => (
            <div key={i} className="company-card rounded-2xl border border-border bg-card p-7 hover:border-foreground/20 transition-colors">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground">Est. {company.year}</span>
              </div>
              <h3 className="text-lg md:text-xl font-semibold tracking-[-0.012em] text-foreground mb-1">{company.title}</h3>
              <p className="text-xs font-medium uppercase tracking-[0.14em] text-muted-foreground mb-3">{company.desc}</p>
              <p className="text-[14px] leading-relaxed text-muted-foreground mb-4">{company.detail}</p>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5">
                {company.highlights.map((h, j) => (
                  <div key={j} className="flex items-center gap-1.5 text-[13px] text-muted-foreground">
                    <span className="w-1 h-1 rounded-full bg-accent flex-shrink-0" />
                    {h}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CompanyShowcase;
