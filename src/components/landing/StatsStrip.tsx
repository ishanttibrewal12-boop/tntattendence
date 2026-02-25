import { useEffect, useRef, useState } from 'react';
import { useLandingTheme } from './LandingThemeContext';

const AnimatedCounter = ({ end, suffix = '', label }: { end: number; suffix?: string; label: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !started) { setStarted(true); observer.unobserve(el); }
    }, { threshold: 0.5 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const duration = 2000;
    const steps = 60;
    const increment = end / steps;
    let current = 0;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) { setCount(end); clearInterval(timer); }
      else setCount(Math.floor(current));
    }, duration / steps);
    return () => clearInterval(timer);
  }, [started, end]);

  return (
    <div ref={ref} className="text-center">
      <p className="text-4xl md:text-5xl font-extrabold" style={{ color: 'white' }}>
        {typeof end === 'number' && end > 0 ? count : ''}{suffix}
      </p>
      <p className="text-xs mt-2 uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.5)' }}>{label}</p>
    </div>
  );
};

const StatsStrip = () => {
  const { colors } = useLandingTheme();
  return (
    <section className="py-14" style={{ background: colors.darkBgGradient }}>
      <div className="max-w-5xl mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          <AnimatedCounter end={2021} suffix="" label="Established" />
          <AnimatedCounter end={50} suffix="+" label="Heavy Trucks" />
          <AnimatedCounter end={200} suffix="+" label="Employees" />
          <AnimatedCounter end={4} suffix="" label="Business Verticals" />
        </div>
      </div>
    </section>
  );
};

export default StatsStrip;
