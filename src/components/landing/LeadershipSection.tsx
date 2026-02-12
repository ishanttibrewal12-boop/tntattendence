import { Phone, MapPin } from 'lucide-react';

const LeadershipSection = () => {
  return (
    <section className="py-16 md:py-20" style={{ background: '#0f172a' }}>
      <div className="max-w-4xl mx-auto px-4 text-center">
        <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>Proprietor</p>
        <h2 className="text-3xl md:text-4xl font-extrabold mb-4" style={{ color: 'white' }}>
          Trishav Tibrewal
        </h2>
        <div className="w-12 h-0.5 mx-auto mb-6 rounded-full" style={{ background: '#f97316' }} />

        <p className="max-w-2xl mx-auto text-sm md:text-base leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.55)' }}>
          Visionary entrepreneur and founder of Tibrewal & Tibrewal Pvt. Ltd., leading the company's diversified operations 
          across mining, stone crushing, transportation, petroleum distribution, and tyre trading in Jharkhand. 
          Under his leadership, the group has grown into a trusted name in Eastern India's industrial sector.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-12">
          <a href="tel:9386469006" className="flex items-center gap-2 text-sm hover:underline" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <Phone className="h-4 w-4" /> 9386469006
          </a>
          <span className="flex items-center gap-2 text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
            <MapPin className="h-4 w-4" /> Jharkhand, India
          </span>
        </div>

        {/* Footer */}
        <div className="pt-8 border-t" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
            © 2025 Tibrewal & Tibrewal Pvt. Ltd. All rights reserved.
          </p>
        </div>
      </div>
    </section>
  );
};

export default LeadershipSection;
