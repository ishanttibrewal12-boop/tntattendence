import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import heroImg from '@/assets/hero-mining-operations.jpg';

gsap.registerPlugin(ScrollTrigger);

const CompanySection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.from('.about-text', {
        opacity: 0, y: 60, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: '.about-text', start: 'top 80%', toggleActions: 'play none none none' },
      });
      gsap.from('.about-image', {
        opacity: 0, scale: 0.92, duration: 0.8, ease: 'power3.out',
        scrollTrigger: { trigger: '.about-image', start: 'top 85%', toggleActions: 'play none none none' },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 md:py-28" style={{ background: '#161b26' }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold tracking-widest uppercase mb-2 text-white/45">About Us</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white/95">Powering Growth Since 2014</h2>
          <div className="w-16 h-1 mx-auto mt-4 rounded-full bg-orange-500" />
        </div>

        <div className="grid md:grid-cols-2 gap-10 items-center">
          <div className="about-image rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <img src={heroImg} alt="Mining Operations" className="w-full aspect-video object-cover" loading="lazy" />
          </div>

          <div className="about-text">
            <p className="leading-relaxed text-base md:text-lg mb-6 text-white/70">
              Tibrewal Group is a prominent business group based in Jharkhand, operating across mining, stone crushing, petroleum distribution, and tyre trading. With a commitment to quality and reliability, we have established ourselves as a trusted name in the region's industrial landscape.
            </p>
            <p className="leading-relaxed text-base md:text-lg text-white/70">
              Our integrated operations span across multiple verticals, serving the growing infrastructure needs of Eastern India. From raw material extraction to processed aggregate delivery, we control the entire value chain — ensuring quality, efficiency, and dependability at every step.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompanySection;
