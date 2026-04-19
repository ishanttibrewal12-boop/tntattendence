import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Shield, Truck, Users, Building2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { icon: Building2, label: 'Diversified Verticals', value: 6, suffix: '+', prefix: '', useCounter: true },
  { icon: Truck, label: 'Fleet Strength', value: 0, suffix: '', prefix: '', useCounter: false, text: 'Ample' },
  { icon: Users, label: 'Team Strength', value: 0, suffix: '', prefix: '', useCounter: false, text: 'Ample' },
  { icon: Shield, label: 'Years of Operations', value: 13, suffix: '+', prefix: '', useCounter: true },
];

const CountUp = ({ target, suffix, prefix }: { target: number; suffix: string; prefix: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 90%',
      onEnter: () => {
        if (hasAnimated.current) return;
        hasAnimated.current = true;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 2,
          ease: 'power2.out',
          onUpdate: () => setCount(Math.round(obj.val)),
        });
      },
    });

    return () => trigger.kill();
  }, [target]);

  return (
    <span ref={ref} className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white tabular-nums leading-none block">
      {prefix}{count}{suffix}
    </span>
  );
};

const AnimatedStats = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.stat-card').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0, y: 40, duration: 0.6, ease: 'power3.out', delay: i * 0.1,
          scrollTrigger: { trigger: el, start: 'top 90%' },
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 md:py-28 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #080b12 0%, #121828 100%)' }}>
      {/* Decorative glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full opacity-[0.04] pointer-events-none" style={{ background: 'radial-gradient(circle, #f97316, transparent 70%)' }} />

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 md:gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="stat-card text-center p-4 sm:p-6 rounded-2xl border transition-all duration-500 group flex flex-col items-center justify-start min-h-[170px] sm:min-h-[200px]"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  borderColor: 'rgba(255,255,255,0.06)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(249,115,22,0.3)';
                  e.currentTarget.style.background = 'rgba(249,115,22,0.05)';
                  e.currentTarget.style.transform = 'translateY(-4px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <div className="w-11 h-11 sm:w-14 sm:h-14 mx-auto mb-3 sm:mb-4 rounded-xl flex items-center justify-center transition-colors duration-300 shrink-0" style={{ background: 'rgba(249,115,22,0.1)' }}>
                  <Icon className="h-5 w-5 sm:h-7 sm:w-7" style={{ color: '#f97316' }} />
                </div>
                <div className="flex items-center justify-center min-h-[2rem] sm:min-h-[2.5rem]">
                  {stat.useCounter ? (
                    <CountUp target={stat.value} suffix={stat.suffix} prefix={stat.prefix} />
                  ) : (
                    <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-none">{stat.text}</span>
                  )}
                </div>
                <p className="text-[10px] sm:text-xs mt-2 uppercase tracking-wider sm:tracking-widest font-semibold leading-tight break-words" style={{ color: 'rgba(255,255,255,0.45)' }}>{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AnimatedStats;
