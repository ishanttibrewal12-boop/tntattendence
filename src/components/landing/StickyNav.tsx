import { useEffect, useState } from 'react';
import companyLogo from '@/assets/tibrewal-logo.png';

const navLinks = [
  { label: 'About', id: 'about' },
  { label: 'Companies', id: 'companies' },
  { label: 'Clients', id: 'clients' },
  { label: 'Leadership', id: 'leadership' },
  { label: 'Gallery', id: 'gallery' },
  { label: 'Contact', id: 'contact' },
];

const StickyNav = () => {
  const [visible, setVisible] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > window.innerHeight * 0.8);
    };

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.3, rootMargin: '-80px 0px 0px 0px' }
    );

    navLinks.forEach((link) => {
      const el = document.getElementById(link.id);
      if (el) observer.observe(el);
    });

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-[100] transition-all duration-500"
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: visible ? 1 : 0,
        background: 'rgba(10, 13, 20, 0.75)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.3)',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex items-center justify-between h-14 md:h-16">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 group"
        >
          <img src={companyLogo} alt="Tibrewal Group" className="h-8 w-auto object-contain" />
          <span className="text-sm font-bold tracking-wide text-white/80 group-hover:text-white transition-colors hidden sm:inline">
            TIBREWAL GROUP
          </span>
        </button>

        <div className="flex items-center gap-1 md:gap-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' })}
              className="px-2.5 md:px-4 py-1.5 rounded-full text-[10px] md:text-xs font-semibold uppercase tracking-wider transition-all duration-300"
              style={{
                color: activeSection === link.id ? '#f97316' : 'rgba(255,255,255,0.55)',
                background: activeSection === link.id ? 'rgba(249,115,22,0.12)' : 'transparent',
              }}
              onMouseEnter={(e) => {
                if (activeSection !== link.id) {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.9)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                }
              }}
              onMouseLeave={(e) => {
                if (activeSection !== link.id) {
                  e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
                  e.currentTarget.style.background = 'transparent';
                }
              }}
            >
              {link.label}
            </button>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default StickyNav;
