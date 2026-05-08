import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Shield, Truck, Users, Building2 } from 'lucide-react';
import { useTiltCards } from '@/lib/motion/gsapUtils';

gsap.registerPlugin(ScrollTrigger);

const stats = [
  { icon: Building2, label: 'Diversified Verticals', value: 6, suffix: '+', useCounter: true },
  { icon: Truck, label: 'Fleet Strength', value: 0, useCounter: false, text: 'Ample' },
  { icon: Users, label: 'Team Strength', value: 0, useCounter: false, text: 'Ample' },
  { icon: Shield, label: 'Years of Operations', value: 13, suffix: '+', useCounter: true },
];

const CountUp = ({ target, suffix = '' }: { target: number; suffix?: string }) => {
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
          val: target, duration: 1.6, ease: 'power2.out',
          onUpdate: () => setCount(Math.round(obj.val)),
        });
      },
    });
    return () => trigger.kill();
  }, [target]);

  return (
    <span ref={ref} className="text-3xl md:text-4xl font-semibold tabular-nums tracking-[-0.022em] text-foreground">
      {count}{suffix}
    </span>
  );
};

const AnimatedStats = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useTiltCards(sectionRef, '.stat-card', 12);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.stat-card').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0, y: 30, scale: 0.92, duration: 0.8, ease: 'power3.out', delay: i * 0.08,
          scrollTrigger: { trigger: el, start: 'top 92%' },
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 md:py-28 bg-muted/30">
      <div className="max-w-5xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4" style={{ perspective: 1200 }}>
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="stat-card text-center p-6 rounded-2xl border border-border bg-card flex flex-col items-center"
              >
                <div className="w-10 h-10 mb-4 rounded-full flex items-center justify-center bg-muted">
                  <Icon className="h-5 w-5 text-foreground" />
                </div>
                <div className="min-h-[2.25rem] flex items-center justify-center">
                  {stat.useCounter ? (
                    <CountUp target={stat.value} suffix={stat.suffix} />
                  ) : (
                    <span className="text-3xl md:text-4xl font-semibold tracking-[-0.022em] text-foreground">{stat.text}</span>
                  )}
                </div>
                <p className="text-[11px] mt-2 uppercase tracking-[0.14em] text-muted-foreground">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default AnimatedStats;
