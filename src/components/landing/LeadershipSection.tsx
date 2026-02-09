import { Phone, Mail, MapPin } from 'lucide-react';

const LeadershipSection = () => {
  return (
    <section className="py-16 md:py-20" style={{ background: 'linear-gradient(180deg, hsl(var(--background)) 0%, #0f172a 100%)' }}>
      <div className="max-w-4xl mx-auto px-4 text-center">
        <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Leadership</p>
        <h2 className="text-3xl md:text-4xl font-extrabold mb-8" style={{ color: 'white' }}>
          Trishav Kumar Tibrewal
        </h2>
        <p className="text-lg font-medium mb-2" style={{ color: 'rgba(255,255,255,0.7)' }}>Proprietor</p>
        <p className="max-w-xl mx-auto text-sm leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Leading Tibrewal & Tibrewal Pvt. Ltd. with a vision of excellence in mining, construction, 
          and industrial services across Jharkhand.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
          <a href="tel:6203229118" className="flex items-center gap-2 text-sm hover:underline" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <Phone className="h-4 w-4" /> 6203229118
          </a>
          <a href="mailto:abhayjalan2682@gmail.com" className="flex items-center gap-2 text-sm hover:underline" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <Mail className="h-4 w-4" /> abhayjalan2682@gmail.com
          </a>
          <span className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <MapPin className="h-4 w-4" /> Jharkhand, India
          </span>
        </div>

        <div className="mt-16 pt-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.1)' }}>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.3)' }}>
            © 2025 Tibrewal & Tibrewal Pvt. Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </section>
  );
};

export default LeadershipSection;
