import { useLandingTheme } from './LandingThemeContext';
import ScrollReveal from './ScrollReveal';
import { Shield, Truck, Mountain, Fuel, TrendingUp, Users } from 'lucide-react';

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
  return (
    <section className="py-20 md:py-28" style={{ background: colors.sectionBg }}>
      <div className="max-w-6xl mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-14">
            <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: '#f97316' }}>Why Choose Us</p>
            <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: colors.heading }}>
              Built on Strength, Driven by Purpose
            </h2>
            <div className="w-16 h-1 mx-auto mt-4 rounded-full" style={{ background: '#f97316' }} />
          </div>
        </ScrollReveal>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <ScrollReveal key={i}>
              <div className="p-6 rounded-2xl border transition-shadow hover:shadow-lg h-full" style={{ background: colors.cardBg, borderColor: colors.cardBorder }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'rgba(249,115,22,0.1)' }}>
                  <f.icon className="h-6 w-6" style={{ color: '#f97316' }} />
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: colors.heading }}>{f.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>{f.desc}</p>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;
