import { Mountain, Truck, Fuel, CircleDot } from 'lucide-react';

const operations = [
  { icon: Mountain, title: 'Stone Crushing & Aggregates', desc: 'Large-scale stone crushing plants producing high-quality aggregates for construction and infrastructure projects across Jharkhand.' },
  { icon: Truck, title: 'Transportation (50+ Trucks)', desc: 'A fleet of over 50 heavy tipper trucks serving mining, construction, and logistics needs across the region.' },
  { icon: Fuel, title: 'Petroleum Services', desc: 'Own Bharat Petroleum fuel station providing reliable fuel supply to the region\'s growing transportation network.' },
  { icon: CircleDot, title: 'Tibrewal Tyres', desc: 'Comprehensive tyre trading and distribution for commercial vehicles supporting the mining and transport sectors.' },
];

const ImageGallery = () => {
  return (
    <section className="py-16 md:py-24" style={{ background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)' }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>What We Do</p>
          <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: 'white' }}>
            Operations
          </h2>
          <div className="w-16 h-1 mx-auto mt-4 rounded-full" style={{ background: '#f97316' }} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {operations.map((op, i) => {
            const Icon = op.icon;
            return (
              <div key={i} className="flex gap-4 p-6 rounded-xl border transition-all duration-300" 
                style={{ borderColor: 'rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)' }}>
                <div className="shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: 'rgba(249,115,22,0.15)' }}>
                  <Icon className="h-6 w-6" style={{ color: '#f97316' }} />
                </div>
                <div>
                  <h3 className="text-lg font-bold mb-1" style={{ color: 'white' }}>{op.title}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.5)' }}>{op.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default ImageGallery;
