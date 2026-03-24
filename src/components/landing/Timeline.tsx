import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const milestones = [
  { year: '2013', title: 'Tibrewal & Tibrewal Pvt. Ltd.', desc: 'The inception of the group\'s parent entity — laying the corporate foundation for all future business expansions and industrial operations.' },
  { year: '2013', title: 'Bharat Petroleum Fuel Station', desc: 'Foundation of the group with petroleum distribution — the first step into industrial operations.' },
  { year: '2014', title: 'Tibrewal Tyres', desc: 'Commercial tyre trading and distribution launched, serving transporters and fleet operators across Jharkhand.' },
  { year: '2022', title: 'Tibrewal Mines & Minerals Pvt. Ltd.', desc: 'Mining & mineral extraction operations launched, marking entry into large-scale industrial operations.' },
  { year: '2022', title: 'Tibrewal Agro Food Processing', desc: 'Agricultural processing and value addition venture launched to bridge farm-to-market supply chain.' },
  { year: '2025', title: 'Tibrewal Ventures', desc: 'Strategic investments and new business expansion arm, driving growth into high-potential sectors.' },
];

const Timeline = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      // Animated line
      gsap.fromTo('.tl-line', { scaleY: 0 }, {
        scaleY: 1, ease: 'none',
        scrollTrigger: { trigger: section, start: 'top 80%', end: 'bottom 60%', scrub: true },
      });

      // Each milestone
      gsap.utils.toArray<HTMLElement>('.tl-item').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0, x: i % 2 === 0 ? -50 : 50, y: 30, duration: 0.8, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
        });
      });

      // Year badges bounce in
      gsap.utils.toArray<HTMLElement>('.tl-year').forEach((el, i) => {
        gsap.from(el, {
          scale: 0, duration: 0.5, ease: 'back.out(1.7)',
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
          delay: 0.1,
        });
      });

      // Dot pulse
      gsap.utils.toArray<HTMLElement>('.tl-dot').forEach((el) => {
        gsap.to(el, {
          boxShadow: '0 0 20px 6px rgba(249,115,22,0.4)',
          repeat: -1, yoyo: true, duration: 1.5, ease: 'sine.inOut',
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-36" style={{ background: '#161b26' }}>
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-20">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3 text-orange-400">Our Journey</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white/95">Milestones That Define Us</h2>
          <div className="w-20 h-1 mx-auto mt-5 rounded-full bg-orange-500" />
          <p className="mt-5 text-sm md:text-base max-w-lg mx-auto text-white/45">
            From a single fuel station to a multi-vertical industrial conglomerate — a journey of relentless growth.
          </p>
        </div>
        <div className="relative">
          <div className="tl-line absolute left-5 md:left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 origin-top" style={{ background: 'linear-gradient(180deg, transparent 0%, rgba(249,115,22,0.4) 10%, rgba(249,115,22,0.4) 90%, transparent 100%)' }} />
          {milestones.map((m, i) => (
            <div key={i} className={`tl-item relative flex flex-col md:flex-row items-start mb-16 last:mb-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
              {/* Animated dot */}
              <div className="tl-dot absolute left-5 md:left-1/2 w-5 h-5 rounded-full -translate-x-1/2 z-10 bg-orange-500 border-4" style={{ borderColor: '#161b26', boxShadow: '0 0 10px 3px rgba(249,115,22,0.2)' }} />
              
              {/* Connector line from dot to card */}
              <div className={`hidden md:block absolute top-2.5 h-[2px] w-[calc(5%-8px)] bg-orange-500/20 ${i % 2 === 0 ? 'right-1/2 mr-2.5' : 'left-1/2 ml-2.5'}`} style={{ top: '8px' }} />

              <div className={`ml-12 md:ml-0 md:w-[43%] ${i % 2 === 0 ? 'md:pr-14 md:text-right' : 'md:pl-14 md:ml-auto'}`}>
                <div className="rounded-2xl p-6 md:p-8 border border-white/8 transition-all duration-500 hover:border-orange-500/25 hover:shadow-[0_0_30px_-10px_rgba(249,115,22,0.15)]" style={{ background: '#1a2030' }}>
                  <span className="tl-year inline-block text-xs font-extrabold tracking-[0.2em] uppercase px-4 py-1.5 rounded-full mb-4 bg-orange-500/15 text-orange-400 border border-orange-500/20">{m.year}</span>
                  <h3 className="text-xl md:text-2xl font-bold mb-2 text-white/90">{m.title}</h3>
                  <p className="text-sm md:text-base leading-relaxed text-white/55">{m.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Timeline;
