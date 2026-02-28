import { useLandingTheme } from './LandingThemeContext';
import ScrollReveal from './ScrollReveal';
import crusherImg from '@/assets/gallery-crusher-new-7.jpeg';
import truckImg from '@/assets/gallery-truck-new-3.jpeg';
import petroleumImg from '@/assets/gallery-petroleum-5.jpeg';
import tyresImg from '@/assets/gallery-tyres-new-5.jpeg';

const operations = [
  { img: crusherImg, title: 'Stone Crushing & Aggregates', desc: 'Large-scale stone crushing plants producing high-quality aggregates for construction and infrastructure projects across Jharkhand.' },
  { img: truckImg, title: 'Transportation (50+ Trucks)', desc: 'A fleet of over 50 heavy tipper trucks serving mining, construction, and logistics needs across the region.' },
  { img: petroleumImg, title: 'Petroleum Services', desc: 'Own Bharat Petroleum fuel station providing reliable fuel supply to the region\'s growing transportation network.' },
  { img: tyresImg, title: 'Tibrewal Tyres', desc: 'Comprehensive tyre trading and distribution for commercial vehicles supporting the mining and transport sectors.' },
];

const ImageGallery = () => {
  const { colors } = useLandingTheme();
  return (
    <section className="py-16 md:py-24" style={{ background: colors.sectionBg, transition: 'background 0.6s ease, color 0.6s ease' }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: colors.label, transition: 'color 0.6s ease' }}>What We Do</p>
          <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: colors.heading, transition: 'color 0.6s ease' }}>Operations</h2>
          <div className="w-16 h-1 mx-auto mt-4 rounded-full" style={{ background: '#f97316' }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {operations.map((op, i) => (
            <ScrollReveal key={i}>
              <div className="rounded-xl overflow-hidden shadow-sm border group" style={{ borderColor: colors.cardBorder, background: colors.cardBg, transition: 'background 0.6s ease, border-color 0.6s ease' }}>
                <div className="relative overflow-hidden">
                  <img
                    src={op.img}
                    alt={op.title}
                    className="w-full h-48 md:h-56 object-cover transition-transform duration-700 group-hover:scale-110"
                    loading="lazy"
                  />
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold mb-1" style={{ color: colors.heading, transition: 'color 0.6s ease' }}>{op.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: colors.textMuted, transition: 'color 0.6s ease' }}>{op.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>

    </section>
  );
};

export default ImageGallery;
