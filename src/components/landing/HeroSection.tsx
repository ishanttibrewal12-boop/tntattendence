import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import companyLogo from '@/assets/company-logo.png';
import heroVideo from '@/assets/hero-mining-video.mp4';
import heroImg from '@/assets/hero-mining-operations.jpg';

gsap.registerPlugin(ScrollTrigger);

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const content = contentRef.current;
    if (!section || !content) return;

    // GSAP entrance animation
    const tl = gsap.timeline();
    tl.from(content.querySelector('.hero-logo'), { opacity: 0, scale: 0.7, duration: 0.8, ease: 'back.out(1.7)' })
      .from(content.querySelector('.hero-title'), { opacity: 0, y: 40, duration: 0.7, ease: 'power3.out' }, '-=0.3')
      .from(content.querySelector('.hero-subtitle'), { opacity: 0, y: 30, duration: 0.6, ease: 'power3.out' }, '-=0.3')
      .from(content.querySelector('.hero-line'), { scaleX: 0, duration: 0.5, ease: 'power2.out' }, '-=0.2')
      .from(content.querySelector('.hero-desc'), { opacity: 0, y: 20, duration: 0.5, ease: 'power3.out' }, '-=0.2');

    // GSAP ScrollTrigger parallax
    const videoEl = section.querySelector('video') as HTMLVideoElement | null;
    const imgEl = section.querySelector('.hero-bg-img') as HTMLElement | null;

    gsap.to([videoEl, imgEl].filter(Boolean), {
      y: 200,
      scale: 1.15,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: 'bottom top',
        scrub: true,
      },
    });

    gsap.to(content, {
      y: 80,
      opacity: 0,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: '60% top',
        scrub: true,
      },
    });

    // Overlay darkens on scroll
    if (overlayRef.current) {
      gsap.to(overlayRef.current, {
        opacity: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: 'bottom top',
          scrub: true,
        },
      });
    }

    return () => ScrollTrigger.getAll().forEach(st => st.kill());
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-[100vh] flex items-center overflow-hidden">
      {/* Video background */}
      <video
        autoPlay muted loop playsInline
        poster={heroImg}
        className="absolute inset-0 w-full h-full object-cover will-change-transform"
        style={{ transform: 'scale(1.1)' }}
      >
        <source src={heroVideo} type="video/mp4" />
      </video>

      {/* Fallback image */}
      <div
        className="hero-bg-img absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
        style={{ backgroundImage: `url(${heroImg})`, transform: 'scale(1.1)' }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(11,31,51,0.75) 0%, rgba(11,31,51,0.85) 60%, rgba(11,31,51,0.95) 100%)' }} />
      
      {/* Scroll-darkening overlay */}
      <div ref={overlayRef} className="absolute inset-0 bg-[#0B1F33] opacity-0" />

      <div ref={contentRef} className="relative z-10 w-full max-w-5xl mx-auto px-6 md:px-12 py-20 will-change-transform">
        <img 
          src={companyLogo} 
          alt="Tibrewal Group" 
          className="hero-logo h-20 w-20 mb-8 object-contain drop-shadow-lg" 
          width={80} height={80} fetchPriority="high"
        />
        <h1 className="hero-title text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 leading-tight" style={{ color: 'white' }}>
          TIBREWAL GROUP
        </h1>
        <p className="hero-subtitle text-lg md:text-xl font-medium mb-8" style={{ color: 'rgba(255,255,255,0.7)' }}>
          A Prominent Industrial Business Group
        </p>
        <div className="hero-line w-16 h-1 rounded-full mb-10 origin-left" style={{ background: '#f97316' }} />
        <p className="hero-desc text-sm max-w-lg leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Mining • Stone Crushing • Transportation • Petroleum • Tyres<br />
          Established 2021 — Jharkhand, India
        </p>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs tracking-widest uppercase" style={{ color: 'rgba(255,255,255,0.4)' }}>Scroll</span>
          <div className="w-5 h-8 rounded-full border-2 flex justify-center pt-1" style={{ borderColor: 'rgba(255,255,255,0.3)' }}>
            <div className="w-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.5)' }} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
