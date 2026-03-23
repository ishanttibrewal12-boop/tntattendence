import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import crusherImg from '@/assets/gallery-crusher-new-7.jpeg';
import truckImg from '@/assets/gallery-truck-new-3.jpeg';
import petroleumImg from '@/assets/gallery-petroleum-5.jpeg';
import tyresImg from '@/assets/gallery-tyres-new-5.jpeg';

gsap.registerPlugin(ScrollTrigger);

const operations = [
  { img: crusherImg, title: 'Stone Crushing & Aggregates', desc: 'Large-scale stone crushing plants producing high-quality aggregates for construction and infrastructure projects across Jharkhand.' },
  { img: truckImg, title: 'Transportation & Logistics', desc: 'An extensive fleet of heavy tipper trucks serving mining, construction, and logistics needs across the region.' },
  { img: petroleumImg, title: 'Petroleum Services', desc: 'Own Bharat Petroleum fuel station providing reliable fuel supply to the region\'s growing transportation network.' },
  { img: tyresImg, title: 'Tibrewal Tyres', desc: 'Comprehensive tyre trading and distribution for commercial vehicles supporting the mining and transport sectors.' },
];

const ImageGallery = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.op-card').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0, y: 60, duration: 0.6, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 88%', toggleActions: 'play none none none' },
          delay: i * 0.1,
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 md:py-24" style={{ background: '#10141c' }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold tracking-widest uppercase mb-2 text-white/45">What We Do</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white/95">Operations</h2>
          <div className="w-16 h-1 mx-auto mt-4 rounded-full bg-orange-500" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {operations.map((op, i) => (
            <div key={i} className="op-card rounded-xl overflow-hidden border border-white/10 group" style={{ background: '#161b26' }}>
              <div className="relative overflow-hidden">
                <img src={op.img} alt={op.title} className="w-full h-48 md:h-56 object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold mb-1 text-white/90">{op.title}</h3>
                <p className="text-sm leading-relaxed text-white/55">{op.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImageGallery;
