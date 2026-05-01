import { useEffect, useState } from 'react';
import companyLogo from '@/assets/tibrewal-logo.png';
import { cn } from '@/lib/utils';

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
    const handleScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveSection(entry.target.id);
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
      className={cn(
        'fixed top-0 left-0 right-0 z-[100] transition-all duration-300',
        'bg-background/80 backdrop-blur-xl border-b border-border',
      )}
      style={{
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="max-w-6xl mx-auto px-4 md:px-8 flex items-center justify-between h-14">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="flex items-center gap-2 group"
        >
          <img src={companyLogo} alt="Tibrewal Group" className="h-7 w-auto object-contain" width={28} height={28} />
          <span className="text-[13px] font-semibold tracking-tight text-foreground hidden sm:inline">
            Tibrewal Group
          </span>
        </button>

        <div className="flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = activeSection === link.id;
            return (
              <button
                key={link.id}
                onClick={() => document.getElementById(link.id)?.scrollIntoView({ behavior: 'smooth' })}
                className={cn(
                  'relative px-3 py-1.5 rounded-full text-[12px] font-medium transition-colors',
                  isActive ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {link.label}
                {isActive && (
                  <span aria-hidden className="absolute left-1/2 -translate-x-1/2 -bottom-0.5 h-1 w-1 rounded-full bg-accent" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default StickyNav;
