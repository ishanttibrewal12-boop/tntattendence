import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const milestones = [
  { year: '2013', title: 'Bharat Petroleum Fuel Station', desc: 'Foundation of the group with petroleum distribution — the first step into industrial operations.' },
  { year: '2014', title: 'Tibrewal Tyres', desc: 'Commercial tyre trading and distribution launched, serving transporters and fleet operators across Jharkhand.' },
  { year: '2021', title: 'Tibrewal & Tibrewal Pvt. Ltd.', desc: 'A Private Limited Company established for transport & logistics under the directorship of Trishav Tibrewal.' },
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
      // Pin the timeline section while line draws
      ScrollTrigger.create({
        trigger: section,
        start: 'top top',
        end: '+=120%',
        pin: '.tl-pin-wrap',
        pinSpacing: true,
        scrub: false,
      });

      // Scrubbed line draw
      gsap.fromTo(
        '.tl-line',
        { scaleY: 0, transformOrigin: 'top' },
        {
          scaleY: 1,
          ease: 'none',
          scrollTrigger: {
            trigger: section,
            start: 'top top',
            end: '+=120%',
            scrub: 0.6,
          },
        },
      );

      gsap.utils.toArray<HTMLElement>('.tl-item').forEach((el) => {
        gsap.from(el, {
          opacity: 0, x: -30, y: 14, scale: 0.96, duration: 0.85, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        });
        const dot = el.querySelector('.tl-dot');
        if (dot) {
          gsap.from(dot, {
            scale: 0, duration: 0.6, ease: 'back.out(2.5)',
            scrollTrigger: { trigger: el, start: 'top 88%' },
          });
        }
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-muted/30">
      <div className="max-w-3xl mx-auto px-6">
        <div className="text-center mb-16">
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground mb-4">Our Journey</p>
          <h2 className="font-display text-[clamp(1.9rem,4.4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.024em] text-foreground">
            Milestones that define us.
          </h2>
          <p className="mt-4 text-base md:text-lg max-w-xl mx-auto text-muted-foreground">
            From a single fuel station to a multi-vertical industrial conglomerate.
          </p>
        </div>

        <div className="tl-track relative">
          <div className="absolute left-4 top-2 bottom-2 w-px bg-border/40" />
          <div className="tl-line absolute left-4 top-2 bottom-2 w-px bg-accent" />
          <div className="space-y-10">
            {milestones.map((m, i) => (
              <div key={i} className="tl-item relative pl-12">
                <span className="tl-dot absolute left-[13px] top-2 w-2 h-2 rounded-full bg-accent ring-4 ring-background" />
                <div className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground mb-1.5">{m.year}</div>
                <h3 className="text-lg md:text-xl font-semibold tracking-[-0.012em] text-foreground mb-2">{m.title}</h3>
                <p className="text-[15px] leading-relaxed text-muted-foreground">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Timeline;
