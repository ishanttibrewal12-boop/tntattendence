import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const milestones = [
  { year: '2014', title: 'Bharat Petroleum Fuel Station', desc: 'Foundation of the group with petroleum distribution — the first step into industrial operations.' },
  { year: '2022', title: 'Tibrewal Mines & Minerals Pvt. Ltd.', desc: 'Mining & mineral extraction operations launched, marking entry into large-scale industrial operations.' },
  { year: '2024', title: 'Tibrewal Tyres', desc: 'Commercial tyre trading and distribution launched, serving transporters and fleet operators.' },
  { year: '2025', title: 'Tibrewal Agro Food Processing', desc: 'Agricultural processing and value addition venture to bridge farm-to-market supply chain.' },
  { year: '2025', title: 'Tibrewal Ventures', desc: 'Strategic investments and new business expansion arm, driving growth into high-potential sectors.' },
];

const Timeline = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.fromTo('.tl-line', { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top 80%', end: 'bottom 60%', scrub: true },
      });

      gsap.utils.toArray<HTMLElement>('.tl-item').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0, x: i % 2 === 0 ? -40 : 40, y: 20, duration: 0.6, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 md:py-28" style={{ background: '#161b26' }}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold tracking-widest uppercase mb-2 text-white/45">Our Journey</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white/95">Milestones That Define Us</h2>
          <div className="w-16 h-1 mx-auto mt-4 rounded-full bg-orange-500" />
        </div>
        <div className="relative">
          <div className="tl-line absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 origin-top" style={{ background: '#252b38' }} />
          {milestones.map((m, i) => (
            <div key={i} className={`tl-item relative flex flex-col md:flex-row items-start mb-12 last:mb-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
              <div className="absolute left-4 md:left-1/2 w-4 h-4 rounded-full border-4 -translate-x-1/2 z-10 bg-orange-500" style={{ borderColor: '#161b26' }} />
              <div className={`ml-10 md:ml-0 md:w-[45%] ${i % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:ml-auto'}`}>
                <span className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3 bg-orange-500/10 text-orange-400">{m.year}</span>
                <h3 className="text-lg font-bold mb-1 text-white/90">{m.title}</h3>
                <p className="text-sm leading-relaxed text-white/55">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Timeline;
