import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Quote } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    quote: 'Tibrewal Group has been a reliable partner for our infrastructure projects. Their consistent supply of quality materials has kept our timelines on track.',
    author: 'Senior Project Manager',
    company: 'Afcons Infrastructure',
  },
  {
    quote: 'We trust Tibrewal for their professionalism and commitment to delivery. Their mining operations meet the highest industry standards.',
    author: 'Procurement Head',
    company: 'UltraTech Cement',
  },
  {
    quote: 'Exceptional service and material quality. Tibrewal Group understands the demands of large-scale engineering projects.',
    author: 'Operations Director',
    company: 'Navayuga Engineering',
  },
  {
    quote: 'From petroleum supply to mineral resources, Tibrewal Group delivers with consistency that few can match in the region.',
    author: 'Supply Chain Lead',
    company: 'Megha Engineering (MEIL)',
  },
  {
    quote: "A dependable name in Jharkhand's industrial ecosystem. Their multi-vertical expertise makes them a one-stop partner for us.",
    author: 'Regional Manager',
    company: 'Montecarlo',
  },
  {
    quote: 'Tibrewal Group's commitment to quality and timely delivery has made them an indispensable partner in our construction projects across the region.',
    author: 'Project Director',
    company: 'S.P. Singla Constructions',
  },
];

const TestimonialsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.from('.testi-heading', {
        opacity: 0, y: 30, duration: 0.7, ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });

      gsap.utils.toArray<HTMLElement>('.testi-card').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0, y: 40, duration: 0.6, ease: 'power3.out',
          delay: i * 0.1,
          scrollTrigger: { trigger: el, start: 'top 90%' },
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-36" style={{ background: '#0d1117' }}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <p className="testi-heading text-xs font-bold tracking-[0.3em] uppercase mb-4 text-orange-400">
            Testimonials
          </p>
          <h2 className="testi-heading text-4xl md:text-5xl font-extrabold text-white/95">
            What Our Clients Say
          </h2>
          <div className="w-20 h-1 mx-auto mt-5 rounded-full bg-orange-500" />
        </div>

        {/* Testimonials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="testi-card group relative rounded-2xl p-8 border transition-all duration-500 hover:border-orange-500/30"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                borderColor: 'rgba(255,255,255,0.08)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 8px 40px -8px rgba(249,115,22,0.15)';
                e.currentTarget.style.transform = 'translateY(-4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = 'none';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <Quote className="h-8 w-8 mb-5 text-orange-500/30 group-hover:text-orange-500/50 transition-colors duration-500" />
              <p className="text-sm md:text-base leading-relaxed mb-8" style={{ color: 'rgba(255,255,255,0.65)' }}>
                "{t.quote}"
              </p>
              <div className="mt-auto flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
                  {t.company.charAt(0)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white/80">{t.author}</p>
                  <p className="text-xs text-white/40">{t.company}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
