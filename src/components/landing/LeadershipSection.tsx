import { Phone, MapPin } from 'lucide-react';

const LeadershipSection = () => {
  const currentYear = new Date().getFullYear();
  return (
    <>
      {/* Proprietor */}
      <section className="py-16 md:py-20" style={{ background: '#0F2A44' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Proprietor</p>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: 'white' }}>
            Trishav Tibrewal
          </h2>
          <div className="w-12 h-0.5 mx-auto mb-6 rounded-full" style={{ background: '#f97316' }} />
          <p className="max-w-2xl mx-auto text-sm md:text-base leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
            Visionary entrepreneur and founder of Tibrewal & Tibrewal Pvt. Ltd., leading the company's diversified operations 
            across mining, stone crushing, transportation, petroleum distribution, and tyre trading in Jharkhand.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <a href="tel:9386469006" className="flex items-center gap-2 text-sm hover:underline" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <Phone className="h-4 w-4" /> 9386469006
            </a>
            <span className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              <MapPin className="h-4 w-4" /> Jharkhand, India
            </span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8" style={{ background: '#091a2a' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>Tibrewal & Tibrewal Pvt. Ltd.</p>
          <p className="text-xs mb-3" style={{ color: 'rgba(255,255,255,0.3)' }}>
            Mining | Logistics | Petroleum | Tyres
          </p>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>Jharkhand, India</p>
          <p className="text-xs mt-4" style={{ color: 'rgba(255,255,255,0.2)' }}>
            © {currentYear} Tibrewal & Tibrewal Pvt. Ltd. All rights reserved.
          </p>
        </div>
      </footer>
    </>
  );
};

export default LeadershipSection;
