import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Phone, MapPin, GraduationCap, Award, Mail } from 'lucide-react';
import proprietorPhoto from '@/assets/proprietor-photo.jpeg';
import founderPhoto from '@/assets/founder-sunil-tibrewal.png';

gsap.registerPlugin(ScrollTrigger);

const LeadershipShowcase = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.leader-card').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0, y: 50, duration: 0.7, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none none' },
          delay: i * 0.15,
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-36" style={{ background: '#10141c' }}>
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-xs font-bold tracking-[0.3em] uppercase mb-3 text-orange-400">Leadership</p>
          <h2 className="text-4xl md:text-5xl font-extrabold text-white/95">The Minds Behind the Group</h2>
          <div className="w-20 h-1 mx-auto mt-5 rounded-full bg-orange-500" />
          <p className="mt-5 max-w-xl mx-auto text-sm md:text-base text-white/50">
            The strategic minds steering Tibrewal Group towards excellence and sustainable growth.
          </p>
        </div>

        {/* Founder */}
        <div className="leader-card rounded-2xl overflow-hidden border border-white/10 mb-8" style={{ background: '#161b26' }}>
          <div className="flex flex-col md:flex-row">
            <div className="md:w-2/5 relative overflow-hidden" style={{ background: '#0F2A44' }}>
              <img src={founderPhoto} alt="Sunil Tibrewal" className="w-full h-80 md:h-full object-cover object-center" loading="lazy" style={{ objectPosition: '50% 20%' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#161b26]/80 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#161b26]/20" />
            </div>
            <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold tracking-wider uppercase w-fit mb-4 border border-orange-500/15">
                <Award className="h-3.5 w-3.5" />
                Founder & Director
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-white/90 mb-4">Sunil Tibrewal</h3>
              <p className="text-sm md:text-base leading-relaxed text-white/55 mb-3">
                The visionary founder of Tibrewal Group who laid the foundation of the group's diversified industrial operations. Starting with a Bharat Petroleum fuel station in 2013, his strategic vision has been instrumental in building the group from a single business into a multi-vertical industrial conglomerate.
              </p>
              <p className="text-sm md:text-base leading-relaxed text-white/55 mb-5">
                With decades of experience in business management, his leadership has guided the group through its formative years. His deep understanding of Jharkhand's industrial landscape has established Tibrewal Group as a trusted name in the region.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-white/45">
                <a href="tel:9006767633" className="flex items-center gap-2 hover:text-white/70 transition-colors">
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
        <div className="leader-card rounded-2xl overflow-hidden border border-white/10" style={{ background: '#161b26' }}>
          <div className="flex flex-col md:flex-row-reverse">
            <div className="md:w-2/5 relative overflow-hidden" style={{ background: '#0F2A44' }}>
              <img src={proprietorPhoto} alt="Trishav Tibrewal" className="w-full h-80 md:h-full object-cover object-center" loading="lazy" style={{ objectPosition: '50% 20%' }} />
              <div className="absolute inset-0 bg-gradient-to-t from-[#161b26]/80 via-transparent to-transparent md:bg-gradient-to-l md:from-transparent md:to-[#161b26]/20" />
            </div>
            <div className="md:w-3/5 p-8 md:p-12 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 text-orange-400 text-xs font-bold tracking-wider uppercase w-fit mb-4 border border-orange-500/15">
                <GraduationCap className="h-3.5 w-3.5" />
                Proprietor & Managing Director
              </div>
              <h3 className="text-2xl md:text-3xl font-extrabold text-white/90 mb-4">Trishav Tibrewal</h3>
              <p className="text-sm md:text-base leading-relaxed text-white/55 mb-3">
                A graduate entrepreneur from <span className="text-white/80 font-semibold">Christ University, Ghaziabad</span>. A young, dynamic leader who has brought modern management practices and entrepreneurial energy to the family's industrial legacy.
              </p>
              <p className="text-sm md:text-base leading-relaxed text-white/55 mb-5">
                Under his leadership, the group has rapidly expanded into multiple verticals including mining, tyre distribution, agro-food processing, and strategic investments — transforming a family business into professionally managed corporate entities.
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-white/45">
                <a href="tel:9386469006" className="flex items-center gap-2 hover:text-white/70 transition-colors">
                  <Phone className="h-4 w-4" /> 9386469006
                </a>
                <a href="mailto:trishavkumar992@gmail.com" className="flex items-center gap-2 hover:text-white/70 transition-colors">
                  <Mail className="h-4 w-4" /> trishavkumar992@gmail.com
                </a>
                <span className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Jharkhand, India
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Vision Quote */}
        <div className="leader-card mt-8 rounded-2xl border border-white/10 p-8 md:p-12 relative overflow-hidden" style={{ background: '#161b26' }}>
          <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: 'linear-gradient(90deg, transparent 0%, #f97316 50%, transparent 100%)' }} />
          <div className="flex items-center gap-4 mb-6">
            <img src={proprietorPhoto} alt="Trishav Tibrewal" className="w-14 h-14 rounded-full object-cover border-2 border-orange-500" style={{ objectPosition: '50% 20%' }} />
            <div>
              <h4 className="text-base font-bold text-white/90">Trishav Tibrewal</h4>
              <p className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">Proprietor's Vision</p>
            </div>
          </div>
          <blockquote className="text-base md:text-lg text-white/60 leading-relaxed italic border-l-4 border-orange-500/30 pl-6">
            "Our goal is to build Tibrewal Group into Jharkhand's most trusted and diversified industrial conglomerate — one that creates employment, drives infrastructure growth, and sets new standards of operational excellence in every sector we enter."
          </blockquote>
        </div>
      </div>
    </section>
  );
};

export default LeadershipShowcase;
