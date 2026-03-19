import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Shield, Truck, Mountain, Fuel, TrendingUp, Users } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const features = [
  { icon: Mountain, title: 'Mining Expertise', desc: 'Deep domain expertise in open-pit mining operations with modern excavation equipment and safety protocols.' },
  { icon: Shield, title: 'Quality Assurance', desc: 'Rigorous quality control across every vertical — from aggregate grading to fuel purity standards.' },
  { icon: Truck, title: 'Logistics Network', desc: '50+ heavy-duty trucks ensuring seamless material movement across Jharkhand\'s industrial corridors.' },
  { icon: Fuel, title: 'Fuel Security', desc: 'Own Bharat Petroleum station guaranteeing uninterrupted fuel supply for operations and the community.' },
  { icon: TrendingUp, title: 'Rapid Growth', desc: 'From a single crusher to a multi-vertical conglomerate in under 4 years — and still expanding.' },
  { icon: Users, title: '200+ Workforce', desc: 'A skilled team of operators, drivers, and managers powering round-the-clock operations.' },
];

const WhyChooseUs = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.wcu-card').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0,
          y: 50,
          scale: 0.95,
          duration: 0.5,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 88%',
            toggleActions: 'play none none none',
          },
          delay: i * 0.08,
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 md:py-28" style={{ background: '#10141c' }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold tracking-widest uppercase mb-2 text-orange-400">Why Choose Us</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white/95">
            Built on Strength, Driven by Purpose
          </h2>
          <div className="w-16 h-1 mx-auto mt-4 rounded-full bg-orange-500" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div
              key={i}
              className="wcu-card p-6 rounded-2xl border border-white/10 transition-all hover:shadow-xl hover:-translate-y-1 duration-300 h-full"
              style={{ background: '#161b26' }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-orange-500/10">
                <f.icon className="h-6 w-6 text-orange-400" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-white/90">{f.title}</h3>
              <p className="text-sm leading-relaxed text-white/55">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
