import { useLandingTheme } from './LandingThemeContext';
import ScrollReveal from './ScrollReveal';
import crusherImg from '@/assets/gallery-crusher-new-7.jpeg';
import truckImg from '@/assets/gallery-truck-new-3.jpeg';
import petroleumImg from '@/assets/gallery-petroleum-5.jpeg';
import tyresImg from '@/assets/gallery-tyres-new-5.jpeg';

const operations = [
  { img: crusherImg, title: 'Stone Crushing & Aggregates', desc: 'Large-scale stone crushing plants producing high-quality aggregates for construction and infrastructure projects across Jharkhand.', animation: 'crusher' as const },
  { img: truckImg, title: 'Transportation (50+ Trucks)', desc: 'A fleet of over 50 heavy tipper trucks serving mining, construction, and logistics needs across the region.', animation: 'truck' as const },
  { img: petroleumImg, title: 'Petroleum Services', desc: 'Own Bharat Petroleum fuel station providing reliable fuel supply to the region\'s growing transportation network.', animation: 'none' as const },
  { img: tyresImg, title: 'Tibrewal Tyres', desc: 'Comprehensive tyre trading and distribution for commercial vehicles supporting the mining and transport sectors.', animation: 'none' as const },
];

const ImageGallery = () => {
  const { colors } = useLandingTheme();
  return (
    <section className="py-16 md:py-24" style={{ background: colors.sectionBg }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: colors.label }}>What We Do</p>
          <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: colors.heading }}>Operations</h2>
          <div className="w-16 h-1 mx-auto mt-4 rounded-full" style={{ background: '#f97316' }} />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {operations.map((op, i) => (
            <ScrollReveal key={i}>
              <div className="rounded-xl overflow-hidden shadow-sm border group" style={{ borderColor: colors.cardBorder, background: colors.cardBg }}>
                <div className="relative overflow-hidden">
                  <img
                    src={op.img}
                    alt={op.title}
                    className={`w-full h-48 md:h-56 object-cover transition-transform duration-700 group-hover:scale-110 ${
                      op.animation === 'crusher' ? 'animate-crusher-shake' : ''
                    } ${
                      op.animation === 'truck' ? 'animate-truck-roll' : ''
                    }`}
                    loading="lazy"
                  />
                  {/* Animated overlay effects */}
                  {op.animation === 'crusher' && (
                    <>
                      <div className="absolute bottom-0 left-0 right-0 h-12 pointer-events-none animate-dust-rise" style={{ background: 'linear-gradient(0deg, rgba(180,140,80,0.35) 0%, transparent 100%)' }} />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <span className="w-2 h-2 rounded-full animate-pulse-fast" style={{ background: '#22c55e' }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#22c55e', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>ACTIVE</span>
                      </div>
                      {/* Falling rock particles */}
                      <div className="absolute inset-0 pointer-events-none overflow-hidden">
                        <div className="animate-rock-fall-1 absolute w-1.5 h-1.5 rounded-full" style={{ background: 'rgba(160,120,60,0.7)', left: '30%', top: '-5%' }} />
                        <div className="animate-rock-fall-2 absolute w-1 h-1 rounded-full" style={{ background: 'rgba(140,100,50,0.6)', left: '55%', top: '-5%' }} />
                        <div className="animate-rock-fall-3 absolute w-2 h-2 rounded-sm" style={{ background: 'rgba(120,90,45,0.5)', left: '70%', top: '-5%' }} />
                      </div>
                    </>
                  )}
                  {op.animation === 'truck' && (
                    <>
                      <div className="absolute bottom-0 left-0 right-0 h-8 pointer-events-none animate-road-dust" style={{ background: 'linear-gradient(0deg, rgba(120,100,80,0.3) 0%, transparent 100%)' }} />
                      <div className="absolute top-2 right-2 flex gap-1">
                        <span className="w-2 h-2 rounded-full animate-pulse-fast" style={{ background: '#3b82f6' }} />
                        <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#3b82f6', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>EN ROUTE</span>
                      </div>
                      {/* Moving wheel indicators */}
                      <div className="absolute bottom-3 left-[20%] w-3 h-3 rounded-full border-2 animate-wheel-spin" style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: 'transparent' }} />
                      <div className="absolute bottom-3 left-[65%] w-3 h-3 rounded-full border-2 animate-wheel-spin" style={{ borderColor: 'rgba(255,255,255,0.4)', borderTopColor: 'transparent' }} />
                    </>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold mb-1" style={{ color: colors.heading }}>{op.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: colors.textMuted }}>{op.desc}</p>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes crusher-shake {
          0%, 100% { transform: translate(0, 0); }
          10% { transform: translate(-1px, 1px); }
          20% { transform: translate(1px, -1px); }
          30% { transform: translate(-1px, 0); }
          40% { transform: translate(1px, 1px); }
          50% { transform: translate(0, -1px); }
          60% { transform: translate(-1px, 1px); }
          70% { transform: translate(1px, 0); }
          80% { transform: translate(0, 1px); }
          90% { transform: translate(-1px, -1px); }
        }
        .animate-crusher-shake {
          animation: crusher-shake 0.8s infinite;
        }
        @keyframes truck-roll {
          0%, 100% { transform: translateY(0); }
          25% { transform: translateY(-1px); }
          50% { transform: translateY(1px); }
          75% { transform: translateY(-0.5px); }
        }
        .animate-truck-roll {
          animation: truck-roll 1.2s ease-in-out infinite;
        }
        @keyframes dust-rise {
          0%, 100% { opacity: 0.3; transform: translateY(0); }
          50% { opacity: 0.6; transform: translateY(-4px); }
        }
        .animate-dust-rise {
          animation: dust-rise 2s ease-in-out infinite;
        }
        @keyframes road-dust {
          0%, 100% { opacity: 0.25; transform: translateX(0); }
          50% { opacity: 0.45; transform: translateX(6px); }
        }
        .animate-road-dust {
          animation: road-dust 1.8s ease-in-out infinite;
        }
        @keyframes pulse-fast {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .animate-pulse-fast {
          animation: pulse-fast 1s ease-in-out infinite;
        }
        @keyframes wheel-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        .animate-wheel-spin {
          animation: wheel-spin 0.6s linear infinite;
        }
        @keyframes rock-fall-1 {
          0% { top: -5%; opacity: 0.8; }
          100% { top: 95%; opacity: 0; }
        }
        .animate-rock-fall-1 {
          animation: rock-fall-1 2.2s ease-in infinite;
        }
        @keyframes rock-fall-2 {
          0% { top: -5%; opacity: 0.7; }
          100% { top: 90%; opacity: 0; }
        }
        .animate-rock-fall-2 {
          animation: rock-fall-2 1.8s ease-in 0.5s infinite;
        }
        @keyframes rock-fall-3 {
          0% { top: -5%; opacity: 0.6; }
          100% { top: 85%; opacity: 0; }
        }
        .animate-rock-fall-3 {
          animation: rock-fall-3 2.5s ease-in 1s infinite;
        }
      `}</style>
    </section>
  );
};

export default ImageGallery;
