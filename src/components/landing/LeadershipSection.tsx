import { Phone, MapPin } from 'lucide-react';
import proprietorPhoto from '@/assets/proprietor-photo.jpeg';

const LeadershipSection = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="py-8" style={{ background: '#060810' }}>
      <div className="max-w-4xl mx-auto px-4 text-center">
        <p className="text-sm font-semibold mb-1 text-white/50">Tibrewal Group</p>
        <p className="text-xs mb-3 text-white/30">Mining | Petroleum | Tyres | Agro | Ventures</p>
        <p className="text-xs text-white/20">Jharkhand, India</p>
        <p className="text-xs mt-4 text-white/20">© {currentYear} Tibrewal Group. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default LeadershipSection;
