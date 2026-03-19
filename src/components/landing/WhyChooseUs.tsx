import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLandingTheme } from './LandingThemeContext';
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
  const { colors } = useLandingTheme();
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    cardsRef.current.forEach((el, i) => {
      if (!el) return;
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
    return () => ScrollTrigger.getAll().forEach(st => st.kill());
  }, []);

  return (
    <section className="py-20 md:py-28" style={{ background: colors.sectionBg }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: '#f97316' }}>Why Choose Us</p>
          <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: colors.heading }}>
            Built on Strength, Driven by Purpose
          </h2>
          <div className="w-16 h-1 mx-auto mt-4 rounded-full" style={{ background: '#f97316' }} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div
              key={i}
              ref={el => { if (el) cardsRef.current[i] = el; }}
              className="p-6 rounded-2xl border transition-all hover:shadow-xl hover:-translate-y-1 duration-300 h-full"
              style={{ background: colors.cardBg, borderColor: colors.cardBorder }}
            >
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(249,115,22,0.1)' }}>
                <f.icon className="h-6 w-6" style={{ color: '#f97316' }} />
              </div>
              <h3 className="text-lg font-bold mb-2" style={{ color: colors.heading }}>{f.title}</h3>
              <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
