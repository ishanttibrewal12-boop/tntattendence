import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useLandingTheme } from './LandingThemeContext';

gsap.registerPlugin(ScrollTrigger);

const CompanySection = () => {
  const { colors } = useLandingTheme();
  const stickyRef = useRef<HTMLElement>(null);
  const textRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!textRef.current) return;
    gsap.from(textRef.current, {
      opacity: 0,
      y: 60,
      duration: 0.8,
      ease: 'power3.out',
      scrollTrigger: {
        trigger: textRef.current,
        start: 'top 80%',
        toggleActions: 'play none none none',
      },
    });
    return () => ScrollTrigger.getAll().forEach(st => st.kill());
  }, []);

  return (
    <section ref={stickyRef} className="py-20 md:py-28" style={{ background: colors.sectionBgAlt }}>
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: colors.label }}>About Us</p>
          <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: colors.heading }}>Powering Growth Since 2021</h2>
          <div className="w-16 h-1 mx-auto mt-4 rounded-full" style={{ background: '#f97316' }} />
        </div>
        <div ref={textRef} className="max-w-3xl mx-auto text-center">
          <p className="leading-relaxed text-base md:text-lg mb-6" style={{ color: colors.text }}>
            Tibrewal Group is a prominent business group based in Jharkhand, operating across mining, stone crushing, transportation, petroleum distribution, and tyre trading. With a commitment to quality and reliability, we have established ourselves as a trusted name in the region's industrial landscape.
          </p>
          <p className="leading-relaxed text-base md:text-lg" style={{ color: colors.text }}>
            Our integrated operations span across multiple verticals, serving the growing infrastructure needs of Eastern India. From raw material extraction to processed aggregate delivery, we control the entire value chain — ensuring quality, efficiency, and dependability at every step.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CompanySection;
