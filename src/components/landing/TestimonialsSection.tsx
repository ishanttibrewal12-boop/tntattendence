import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Quote, Star } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const testimonials = [
  {
    quote: 'Tibrewal Group has been a reliable partner for our infrastructure projects. Their consistent supply of quality materials has kept our timelines on track.',
    company: 'Afcons Infrastructure', rating: 5,
  },
  {
    quote: 'We trust Tibrewal for their professionalism and commitment to delivery. Their mining operations meet the highest industry standards.',
    company: 'UltraTech Cement', rating: 5,
  },
  {
    quote: 'Exceptional service and material quality. Tibrewal Group understands the demands of large-scale engineering projects.',
    company: 'Navayuga Engineering', rating: 5,
  },
  {
    quote: 'From petroleum supply to mineral resources, Tibrewal Group delivers with consistency that few can match in the region.',
    company: 'Megha Engineering (MEIL)', rating: 5,
  },
  {
    quote: "A dependable name in Jharkhand's industrial ecosystem. Their multi-vertical expertise makes them a one-stop partner for us.",
    company: 'Montecarlo', rating: 5,
  },
  {
    quote: "Tibrewal Group's commitment to quality and timely delivery has made them an indispensable partner in our construction projects across the region.",
    company: 'S.P. Singla Constructions', rating: 5,
  },
];

const TestimonialsSection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.from('.testi-head > *', {
        opacity: 0, y: 14, duration: 0.6, ease: 'power2.out', stagger: 0.08,
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });
      gsap.utils.toArray<HTMLElement>('.testi-card').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0, y: 14, duration: 0.5, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 92%' },
          delay: (i % 3) * 0.06,
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-muted/30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="testi-head text-center mb-14">
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground mb-4">Testimonials</p>
          <h2 className="font-display text-[clamp(1.9rem,4.4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.024em] text-foreground">
            What our clients say.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="testi-card rounded-2xl border border-border bg-card p-7 transition-colors hover:border-foreground/20 flex flex-col"
            >
              <Quote className="h-6 w-6 mb-4 text-muted-foreground" strokeWidth={1.5} />
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: t.rating }).map((_, s) => (
                  <Star key={s} className="h-3.5 w-3.5 fill-accent text-accent" />
                ))}
              </div>
              <p className="text-[15px] leading-relaxed text-foreground mb-6 flex-1">
                "{t.quote}"
              </p>
              <div className="pt-4 border-t border-border flex items-center gap-3">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-[13px] font-semibold bg-muted text-foreground border border-border">
                  {t.company.charAt(0)}
                </div>
                <p className="text-[13px] font-medium text-foreground">{t.company}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
