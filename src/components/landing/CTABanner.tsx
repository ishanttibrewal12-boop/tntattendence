import ScrollReveal from './ScrollReveal';
import { Phone } from 'lucide-react';

const CTABanner = () => (
  <section className="py-20 md:py-28 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
    {/* Decorative shapes */}
    <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20" style={{ background: 'white' }} />
    <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-10" style={{ background: 'white' }} />

    <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
      <ScrollReveal>
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4" style={{ color: 'white' }}>
          Ready to Partner With Us?
        </h2>
        <p className="text-base md:text-lg mb-10 max-w-2xl mx-auto" style={{ color: 'rgba(255,255,255,0.85)' }}>
          Whether you need aggregate supply, transportation services, fuel, or tyres — we are 
          your one-stop industrial partner in Jharkhand.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="tel:9386469006"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm transition-transform hover:scale-105"
            style={{ background: 'white', color: '#ea580c' }}
          >
            <Phone className="h-4 w-4" />
            Call Now — 9386469006
          </a>
          <a
            href="https://wa.me/916203229118"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm border-2 transition-transform hover:scale-105"
            style={{ borderColor: 'rgba(255,255,255,0.5)', color: 'white' }}
          >
            WhatsApp Us
          </a>
        </div>
      </ScrollReveal>
    </div>
  </section>
);

export default CTABanner;
