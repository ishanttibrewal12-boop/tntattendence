import { Phone, Mail } from 'lucide-react';
import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const CTABanner = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.from('.cta-content', {
        opacity: 0, y: 50, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 80%', toggleActions: 'play none none none' },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 md:py-28 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20 animate-[spin_25s_linear_infinite] bg-white" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full opacity-10 animate-[spin_30s_linear_infinite_reverse] bg-white" />

      <div className="cta-content relative z-10 max-w-4xl mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-4 text-white">
          Ready to Partner With Us?
        </h2>
        <p className="text-base md:text-lg mb-10 max-w-2xl mx-auto text-white/85">
          Whether you need aggregate supply, transportation services, fuel, or tyres — we are
          your one-stop industrial partner in Jharkhand.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <a
            href="tel:9006767633"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm transition-transform hover:scale-105 bg-white text-orange-600"
          >
            <Phone className="h-4 w-4" />
            Call Director — 9006767633
          </a>
          <a
            href="mailto:trishavkumar992@gmail.com"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm border-2 border-white/50 text-white transition-transform hover:scale-105"
          >
            <Mail className="h-4 w-4" />
            Email Proprietor
          </a>
          <a
            href="https://wa.me/919386469006"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full font-bold text-sm border-2 border-white/50 text-white transition-transform hover:scale-105"
          >
            WhatsApp Us
          </a>
        </div>
      </div>
    </section>
  );
};

export default CTABanner;
