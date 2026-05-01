import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import crusherImg from '@/assets/gallery-crusher-new-7.jpeg';
import truckImg from '@/assets/gallery-truck-new-3.jpeg';
import petroleumImg from '@/assets/gallery-petroleum-5.jpeg';
import tyresImg from '@/assets/gallery-tyres-new-5.jpeg';

gsap.registerPlugin(ScrollTrigger);

const operations = [
  { img: crusherImg, title: 'Stone Crushing & Aggregates', desc: 'Large-scale stone crushing plants producing high-quality aggregates for construction and infrastructure projects.' },
  { img: truckImg, title: 'Transportation & Logistics', desc: 'An extensive fleet of heavy tipper trucks serving mining, construction, and logistics needs across the region.' },
  { img: petroleumImg, title: 'Petroleum Services', desc: 'Own Bharat Petroleum fuel station providing reliable fuel supply to the region\'s growing transportation network.' },
  { img: tyresImg, title: 'Tibrewal Tyres', desc: 'Comprehensive tyre trading and distribution for commercial vehicles supporting the mining and transport sectors.' },
];

const ImageGallery = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.op-card').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0, y: 14, duration: 0.5, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 90%' },
          delay: (i % 2) * 0.06,
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-28 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-12">
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground mb-4">What We Do</p>
          <h2 className="font-display text-[clamp(1.9rem,4.4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.024em] text-foreground">
            Operations.
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {operations.map((op, i) => (
            <div key={i} className="op-card rounded-2xl overflow-hidden border border-border bg-card group hover:border-foreground/20 transition-colors">
              <div className="relative overflow-hidden">
                <img src={op.img} alt={op.title} className="w-full h-52 md:h-60 object-cover transition-transform duration-700 group-hover:scale-[1.04]" loading="lazy" />
              </div>
              <div className="p-6">
                <h3 className="text-base font-semibold tracking-[-0.012em] text-foreground mb-2">{op.title}</h3>
                <p className="text-[14px] leading-relaxed text-muted-foreground">{op.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImageGallery;
