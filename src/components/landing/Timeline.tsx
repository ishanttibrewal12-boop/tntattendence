import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLandingTheme } from './LandingThemeContext';

gsap.registerPlugin(ScrollTrigger);

const milestones = [
  { year: '2021', title: 'Company Founded', desc: 'Tibrewal Group established in Jharkhand with mining and stone crushing operations.' },
  { year: '2022', title: 'Fleet Expansion', desc: 'Grew the transportation fleet to 30+ tipper trucks, expanding logistics across the region.' },
  { year: '2023', title: 'Petroleum & Tyres', desc: 'Launched own Bharat Petroleum station and Tibrewal Tyres — diversifying into fuel and tyre trading.' },
  { year: '2024', title: '50+ Trucks & 200+ Staff', desc: 'Crossed 50 heavy trucks, 200 employees, and became a leading industrial group in the region.' },
];

const Timeline = () => {
  const { colors } = useLandingTheme();
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    if (!sectionRef.current) return;

    // Animate the vertical line growing
    if (lineRef.current) {
      gsap.fromTo(lineRef.current, { scaleY: 0 }, {
        scaleY: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: sectionRef.current,
          start: 'top 80%',
          end: 'bottom 60%',
          scrub: true,
        },
      });
    }

    // Animate each milestone
    itemsRef.current.forEach((el, i) => {
      if (!el) return;
      gsap.from(el, {
        opacity: 0,
        x: i % 2 === 0 ? -40 : 40,
        y: 20,
        duration: 0.6,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: el,
          start: 'top 85%',
          toggleActions: 'play none none none',
        },
      });
    });

    return () => ScrollTrigger.getAll().forEach(st => st.kill());
  }, []);

  return (
    <section ref={sectionRef} className="py-20 md:py-28" style={{ background: colors.sectionBgAlt }}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: colors.label }}>Our Journey</p>
          <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: colors.heading }}>Milestones That Define Us</h2>
          <div className="w-16 h-1 mx-auto mt-4 rounded-full" style={{ background: '#f97316' }} />
        </div>
        <div className="relative">
          <div
            ref={lineRef}
            className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2 origin-top"
            style={{ background: colors.cardBorder }}
          />
          {milestones.map((m, i) => (
            <div
              key={i}
              ref={el => { if (el) itemsRef.current[i] = el; }}
              className={`relative flex flex-col md:flex-row items-start mb-12 last:mb-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}
            >
              <div className="absolute left-4 md:left-1/2 w-4 h-4 rounded-full border-4 -translate-x-1/2 z-10" style={{ background: '#f97316', borderColor: colors.sectionBgAlt }} />
              <div className={`ml-10 md:ml-0 md:w-[45%] ${i % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:ml-auto'}`}>
                <span className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316' }}>{m.year}</span>
                <h3 className="text-lg font-bold mb-1" style={{ color: colors.heading }}>{m.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Timeline;
