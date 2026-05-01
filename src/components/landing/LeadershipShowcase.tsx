import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Phone, MapPin, GraduationCap, Award, Mail } from 'lucide-react';
import proprietorPhoto from '@/assets/proprietor-photo.jpeg';
import founderPhoto from '@/assets/founder-sunil-tibrewal.jpg';

gsap.registerPlugin(ScrollTrigger);

const LeadershipShowcase = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.from('.lead-head > *', {
        opacity: 0, y: 14, duration: 0.6, ease: 'power2.out', stagger: 0.08,
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });
      gsap.utils.toArray<HTMLElement>('.leader-card').forEach((el) => {
        gsap.from(el, {
          opacity: 0, y: 16, duration: 0.6, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%' },
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} id="leadership" className="py-24 md:py-32 bg-muted/30">
      <div className="max-w-5xl mx-auto px-6">
        <div className="lead-head text-center mb-14">
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground mb-4">Leadership</p>
          <h2 className="font-display text-[clamp(1.9rem,4.4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.024em] text-foreground">
            The minds behind the group.
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-base md:text-lg text-muted-foreground">
            Strategic minds steering Tibrewal Group towards excellence and sustainable growth.
          </p>
        </div>

        {/* Founder */}
        <div className="leader-card rounded-2xl overflow-hidden border border-border bg-card mb-6">
          <div className="flex flex-col md:flex-row">
            <div className="md:w-2/5 relative bg-muted min-h-[20rem]">
              <img
                src={founderPhoto}
                alt="Sunil Tibrewal"
                className="w-full h-80 md:h-full object-cover"
                loading="lazy"
                style={{ objectPosition: '50% 20%' }}
              />
            </div>
            <div className="md:w-3/5 p-8 md:p-10 flex flex-col justify-center">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-[11px] font-medium tracking-[0.12em] uppercase text-muted-foreground w-fit mb-4">
                <Award className="h-3 w-3" />
                Founder & Director
              </div>
              <h3 className="text-2xl md:text-3xl font-semibold tracking-[-0.018em] text-foreground mb-4">Sunil Tibrewal</h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground mb-3">
                The visionary founder of Tibrewal Group who laid the foundation of the group's diversified industrial operations. Starting with a Bharat Petroleum fuel station in 2013, his strategic vision built the group from a single business into a multi-vertical industrial conglomerate.
              </p>
              <p className="text-[15px] leading-relaxed text-muted-foreground mb-5">
                With decades of experience in business management, his deep understanding of Jharkhand's industrial landscape has established Tibrewal Group as a trusted name in the region.
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
                <a href="tel:9006767633" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Phone className="h-4 w-4" /> 9006767633
                </a>
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Jharkhand, India
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Proprietor */}
        <div className="leader-card rounded-2xl overflow-hidden border border-border bg-card mb-6">
          <div className="flex flex-col md:flex-row-reverse">
            <div className="md:w-2/5 relative bg-muted min-h-[20rem]">
              <img
                src={proprietorPhoto}
                alt="Trishav Tibrewal"
                className="w-full h-80 md:h-full object-cover"
                loading="lazy"
                style={{ objectPosition: '50% 20%' }}
              />
            </div>
            <div className="md:w-3/5 p-8 md:p-10 flex flex-col justify-center">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border border-border text-[11px] font-medium tracking-[0.12em] uppercase text-muted-foreground w-fit mb-4">
                <GraduationCap className="h-3 w-3" />
                Proprietor & Managing Director
              </div>
              <h3 className="text-2xl md:text-3xl font-semibold tracking-[-0.018em] text-foreground mb-4">Trishav Tibrewal</h3>
              <p className="text-[15px] leading-relaxed text-muted-foreground mb-3">
                A graduate entrepreneur from <span className="text-foreground font-medium">Christ University, Ghaziabad</span>. A young, dynamic leader bringing modern management practices and entrepreneurial energy to the family's industrial legacy.
              </p>
              <p className="text-[15px] leading-relaxed text-muted-foreground mb-5">
                Under his leadership, the group has rapidly expanded into mining, tyre distribution, agro-food processing, and strategic investments — transforming a family business into professionally managed corporate entities.
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2 text-[13px] text-muted-foreground">
                <a href="tel:9386469006" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Phone className="h-4 w-4" /> 9386469006
                </a>
                <a href="mailto:trishavkumar992@gmail.com" className="flex items-center gap-2 hover:text-foreground transition-colors">
                  <Mail className="h-4 w-4" /> Email
                </a>
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Jharkhand, India
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Vision Quote */}
        <div className="leader-card rounded-2xl border border-border bg-card p-8 md:p-10">
          <div className="flex items-center gap-3 mb-5">
            <img
              src={proprietorPhoto}
              alt="Trishav Tibrewal"
              className="w-11 h-11 rounded-full object-cover border border-border"
              style={{ objectPosition: '50% 20%' }}
            />
            <div>
              <h4 className="text-[14px] font-semibold text-foreground">Trishav Tibrewal</h4>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-[0.14em]">Proprietor's Vision</p>
            </div>
          </div>
          <blockquote className="text-base md:text-lg text-foreground leading-relaxed border-l-2 border-accent pl-5">
            "Our goal is to build Tibrewal Group into Jharkhand's most trusted and diversified industrial conglomerate — one that creates employment, drives infrastructure growth, and sets new standards of operational excellence in every sector we enter."
          </blockquote>
        </div>
      </div>
    </section>
  );
};

export default LeadershipShowcase;
