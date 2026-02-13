import companyLogo from '@/assets/company-logo.png';
import heroImg from '@/assets/gallery-crusher-new-7.jpeg';

const HeroSection = () => {
  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImg})` }}
      />
      <div className="absolute inset-0" style={{ background: 'rgba(15,42,68,0.82)' }} />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-6 md:px-12 py-20">
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
      </div>
    </section>
  );
};

export default HeroSection;
