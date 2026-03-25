import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Quote, Star } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    quote: 'Tibrewal Group has been a reliable partner for our infrastructure projects. Their consistent supply of quality materials has kept our timelines on track.',
    company: 'Afcons Infrastructure',
    rating: 5,
  },
  {
    quote: 'We trust Tibrewal for their professionalism and commitment to delivery. Their mining operations meet the highest industry standards.',
    company: 'UltraTech Cement',
    rating: 5,
  },
  {
    quote: 'Exceptional service and material quality. Tibrewal Group understands the demands of large-scale engineering projects.',
    company: 'Navayuga Engineering',
    rating: 5,
  },
  {
    quote: 'From petroleum supply to mineral resources, Tibrewal Group delivers with consistency that few can match in the region.',
    company: 'Megha Engineering (MEIL)',
    rating: 5,
  },
  {
    quote: "A dependable name in Jharkhand's industrial ecosystem. Their multi-vertical expertise makes them a one-stop partner for us.",
    company: 'Montecarlo',
    rating: 5,
  },
  {
    quote: "Tibrewal Group's commitment to quality and timely delivery has made them an indispensable partner in our construction projects across the region.",
    company: 'S.P. Singla Constructions',
    rating: 5,
  },
];

const TestimonialsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.from('.testi-sub', {
        opacity: 0, y: 20, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });
      gsap.from('.testi-heading', {
        opacity: 0, y: 30, duration: 0.7, delay: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });
      gsap.from('.testi-line', {
        scaleX: 0, duration: 0.6, delay: 0.25, ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });

      gsap.utils.toArray<HTMLElement>('.testi-card').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0,
          y: 60,
          rotateX: 8,
          scale: 0.92,
          duration: 0.7,
          ease: 'power3.out',
          delay: i * 0.12,
          scrollTrigger: { trigger: el, start: 'top 92%' },
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-36 relative overflow-hidden" style={{ background: '#0d1117' }}>
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-72 h-72 rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, #f97316, transparent 70%)', filter: 'blur(60px)' }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-[0.03]" style={{ background: 'radial-gradient(circle, #f97316, transparent 70%)', filter: 'blur(80px)' }} />

      <div className="max-w-6xl mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <p className="testi-sub text-xs font-bold tracking-[0.3em] uppercase mb-4 text-orange-400">
            Testimonials
          </p>
          <h2 className="testi-heading text-4xl md:text-5xl lg:text-6xl font-extrabold text-white/95">
            What Our Clients Say
          </h2>
          <div className="testi-line w-20 h-1.5 mx-auto mt-6 rounded-full origin-center" style={{ background: 'linear-gradient(90deg, #f97316, #fb923c)' }} />
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="testi-card group relative rounded-2xl p-8 border transition-all duration-500 cursor-default"
              style={{
                background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)',
                borderColor: 'rgba(255,255,255,0.08)',
                perspective: '600px',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 20px 60px -15px rgba(249,115,22,0.2), 0 0 0 1px rgba(249,115,22,0.15)';
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.borderColor = 'rgba(249,115,22,0.25)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            >
              {/* Top accent line */}
              <div className="absolute top-0 left-6 right-6 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500" style={{ background: 'linear-gradient(90deg, transparent, #f97316, transparent)' }} />

              {/* Quote icon */}
              <Quote className="h-9 w-9 mb-5 text-orange-500/20 group-hover:text-orange-500/50 transition-all duration-500 group-hover:scale-110" />

              {/* Star rating */}
              <div className="flex gap-1 mb-5">
                {Array.from({ length: t.rating }).map((_, s) => (
                  <Star key={s} className="h-4 w-4 fill-orange-400 text-orange-400 transition-transform duration-300" style={{ transitionDelay: `${s * 50}ms` }} />
                ))}
              </div>

              {/* Quote text */}
              <p className="text-sm md:text-base leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.6)' }}>
                "{t.quote}"
              </p>

              {/* Company */}
              <div className="mt-auto flex items-center gap-3 pt-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 group-hover:scale-110" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.08))', color: '#f97316', border: '1px solid rgba(249,115,22,0.15)' }}>
                  {t.company.charAt(0)}
                </div>
                <p className="text-sm font-semibold text-orange-400/80">{t.company}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
