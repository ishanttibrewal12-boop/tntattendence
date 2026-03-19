import { Phone, MapPin } from 'lucide-react';
import proprietorPhoto from '@/assets/proprietor-photo.jpeg';

const LeadershipSection = () => {
  const currentYear = new Date().getFullYear();
  return (
    <>
      <section className="py-16 md:py-20" style={{ background: '#0F2A44' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold tracking-widest uppercase mb-2 text-white/40">Proprietor</p>
          <img src={proprietorPhoto} alt="Trishav Tibrewal" className="w-28 h-28 md:w-32 md:h-32 rounded-full object-cover mx-auto mb-4 border-4 border-orange-500" />
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4 text-white">Trishav Tibrewal</h2>
          <div className="w-12 h-0.5 mx-auto mb-6 rounded-full bg-orange-500" />
          <p className="max-w-2xl mx-auto text-sm md:text-base leading-relaxed mb-8 text-white/65">
            Graduate entrepreneur from Christ University, Ghaziabad. A visionary leader driving Tibrewal Group's expansion across mining, logistics, petroleum distribution, and tyre trading in Jharkhand.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
            <a href="tel:9386469006" className="flex items-center gap-2 text-sm text-white/50 hover:underline">
              <Phone className="h-4 w-4" /> 9386469006
            </a>
            <span className="flex items-center gap-2 text-sm text-white/50">
              <MapPin className="h-4 w-4" /> Jharkhand, India
            </span>
          </div>
        </div>
      </section>
      <footer className="py-8" style={{ background: '#060810' }}>
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-sm font-semibold mb-1 text-white/50">Tibrewal Group</p>
          <p className="text-xs mb-3 text-white/30">Mining | Logistics | Petroleum | Tyres</p>
          <p className="text-xs text-white/20">Jharkhand, India</p>
          <p className="text-xs mt-4 text-white/20">© {currentYear} Tibrewal Group. All rights reserved.</p>
        </div>
      </footer>
    </>
  );
};

export default LeadershipSection;
