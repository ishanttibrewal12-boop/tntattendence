import { useEffect, useRef } from 'react';
import companyLogo from '@/assets/company-logo.png';
import heroVideo from '@/assets/hero-mining-video.mp4';
import heroImg from '@/assets/hero-mining-operations.jpg';

const HeroSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!sectionRef.current || !contentRef.current) return;
      const scrollY = window.scrollY;
      const sectionHeight = sectionRef.current.offsetHeight;
      if (scrollY > sectionHeight) return;

      // Parallax: video moves slower, content fades out
      const videoEl = sectionRef.current.querySelector('video') as HTMLVideoElement | null;
      const imgEl = sectionRef.current.querySelector('.hero-bg-img') as HTMLElement | null;
      const speed = 0.4;
      if (videoEl) videoEl.style.transform = `translateY(${scrollY * speed}px) scale(1.1)`;
      if (imgEl) imgEl.style.transform = `translateY(${scrollY * speed}px) scale(1.1)`;
      contentRef.current.style.transform = `translateY(${scrollY * 0.15}px)`;
      contentRef.current.style.opacity = `${1 - scrollY / sectionHeight}`;
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
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

      {/* Fallback image for when video doesn't load */}
      <div
        className="hero-bg-img absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
        style={{ backgroundImage: `url(${heroImg})`, transform: 'scale(1.1)' }}
      />

      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: 'linear-gradient(180deg, rgba(15,42,68,0.75) 0%, rgba(15,42,68,0.85) 60%, rgba(15,42,68,0.95) 100%)' }} />

      <div ref={contentRef} className="relative z-10 w-full max-w-5xl mx-auto px-6 md:px-12 py-20 will-change-transform">
        <img 
          src={companyLogo} 
          alt="Tibrewal & Tibrewal" 
          className="h-20 w-20 mb-8 object-contain drop-shadow-lg" 
          width={80} height={80} fetchPriority="high"
        />
        <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-4 leading-tight" style={{ color: 'white' }}>
          TIBREWAL AND TIBREWAL<br />PVT. LTD.
        </h1>
        <p className="text-lg md:text-xl font-medium mb-8" style={{ color: 'rgba(255,255,255,0.7)' }}>
          A Prominent Industrial Business Group
        </p>
        <div className="w-16 h-1 rounded-full mb-10" style={{ background: '#f97316' }} />
        <p className="text-sm max-w-lg leading-relaxed mb-10" style={{ color: 'rgba(255,255,255,0.5)' }}>
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
