import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { X, ZoomIn } from 'lucide-react';
import { cn } from '@/lib/utils';
import crusher1 from '@/assets/gallery-crusher-new-1.jpeg';
import crusher2 from '@/assets/gallery-crusher-new-2.jpeg';
import crusher3 from '@/assets/gallery-crusher-new-3.jpeg';
import crusher4 from '@/assets/gallery-crusher-new-4.jpeg';
import crusher5 from '@/assets/gallery-crusher-new-5.jpeg';
import crusher6 from '@/assets/gallery-crusher-new-6.jpeg';
import crusher7 from '@/assets/gallery-crusher-new-7.jpeg';
import tyres1 from '@/assets/gallery-tyres-new-1.jpeg';
import tyres2 from '@/assets/gallery-tyres-new-2.jpeg';
import tyres3 from '@/assets/gallery-tyres-new-3.jpeg';
import tyres4 from '@/assets/gallery-tyres-new-4.jpeg';
import tyres5 from '@/assets/gallery-tyres-new-5.jpeg';
import tyres6 from '@/assets/gallery-tyres-new-6.jpeg';
import truck1 from '@/assets/gallery-truck-new-1.jpeg';
import truck2 from '@/assets/gallery-truck-new-2.jpeg';
import truck3 from '@/assets/gallery-truck-new-3.jpeg';
import petroleum1 from '@/assets/gallery-petroleum-1.jpeg';
import petroleum2 from '@/assets/gallery-petroleum-2.jpeg';
import petroleum3 from '@/assets/gallery-petroleum-3.jpeg';
import petroleum4 from '@/assets/gallery-petroleum-4.jpeg';
import petroleum5 from '@/assets/gallery-petroleum-5.jpeg';
import petroleum6 from '@/assets/gallery-petroleum-6.jpeg';
import aggregate1 from '@/assets/gallery-aggregate-1.jpeg';

gsap.registerPlugin(ScrollTrigger);

const categories = ['All', 'Crusher', 'Petroleum', 'Tyres', 'Transport'] as const;

const photos = [
  { src: crusher7, alt: 'Crusher plant in action', cat: 'Crusher' },
  { src: tyres5, alt: 'Tyre closeup', cat: 'Tyres' },
  { src: truck3, alt: 'Tipper truck night', cat: 'Transport' },
  { src: petroleum5, alt: 'Bharat Petroleum station', cat: 'Petroleum' },
  { src: crusher1, alt: 'Stone crushing operations', cat: 'Crusher' },
  { src: tyres6, alt: 'Tyre warehouse aisle', cat: 'Tyres' },
  { src: truck2, alt: 'Heavy tipper truck', cat: 'Transport' },
  { src: crusher6, alt: 'Crushing plant wide', cat: 'Crusher' },
  { src: petroleum6, alt: 'Fuel station', cat: 'Petroleum' },
  { src: tyres1, alt: 'Tyre storage', cat: 'Tyres' },
  { src: crusher2, alt: 'Crusher machinery', cat: 'Crusher' },
  { src: petroleum4, alt: 'BP signboard', cat: 'Petroleum' },
  { src: truck1, alt: 'Transportation fleet', cat: 'Transport' },
  { src: tyres2, alt: 'Commercial tyres', cat: 'Tyres' },
  { src: crusher3, alt: 'Aggregate production', cat: 'Crusher' },
  { src: petroleum1, alt: 'Petroleum services', cat: 'Petroleum' },
  { src: tyres3, alt: 'Tyre display', cat: 'Tyres' },
  { src: crusher4, alt: 'Crushing facility', cat: 'Crusher' },
  { src: petroleum2, alt: 'Fuel pump', cat: 'Petroleum' },
  { src: crusher5, alt: 'Stone aggregate', cat: 'Crusher' },
  { src: tyres4, alt: 'Tyre collection', cat: 'Tyres' },
  { src: petroleum3, alt: 'Petrol station', cat: 'Petroleum' },
  { src: aggregate1, alt: 'Aggregates stockpile', cat: 'Crusher' },
];

const PhotoGallery = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [lightbox, setLightbox] = useState<string | null>(null);

  const filtered = activeFilter === 'All' ? photos : photos.filter(p => p.cat === activeFilter);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.from('.gallery-head > *', {
        opacity: 0, y: 14, duration: 0.6, ease: 'power2.out', stagger: 0.08,
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;
    const imgs = document.querySelectorAll('.gallery-img');
    gsap.fromTo(imgs, { opacity: 0, y: 10 }, {
      opacity: 1, y: 0, duration: 0.4, ease: 'power2.out', stagger: 0.03,
    });
  }, [activeFilter]);

  return (
    <>
      <section ref={sectionRef} id="gallery" className="py-24 md:py-32 bg-background">
        <div className="max-w-6xl mx-auto px-6">
          <div className="gallery-head text-center mb-12">
            <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground mb-4">Gallery</p>
            <h2 className="font-display text-[clamp(1.9rem,4.4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.024em] text-foreground">
              Our work in action.
            </h2>
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {categories.map((cat) => {
              const isActive = activeFilter === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveFilter(cat)}
                  className={cn(
                    'px-4 py-1.5 rounded-full text-[12px] font-medium border transition-colors',
                    isActive
                      ? 'bg-foreground text-background border-foreground'
                      : 'bg-transparent text-muted-foreground border-border hover:text-foreground hover:border-foreground/30',
                  )}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Gallery grid */}
          <div className="columns-2 md:columns-3 gap-4 space-y-4">
            {filtered.map((photo, i) => (
              <div
                key={`${activeFilter}-${i}`}
                className="gallery-img group relative break-inside-avoid rounded-xl overflow-hidden cursor-pointer border border-border"
                onClick={() => setLightbox(photo.src)}
              >
                <img src={photo.src} alt={photo.alt} className="w-full block transition-transform duration-700 group-hover:scale-[1.04]" loading="lazy" />
                <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/10 transition-colors flex items-center justify-center">
                  <div className="w-9 h-9 rounded-full bg-background/90 border border-border flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <ZoomIn className="h-4 w-4 text-foreground" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-foreground/95 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-5 right-5 text-background/90 hover:text-background transition-colors"
            aria-label="Close"
          >
            <X className="h-7 w-7" />
          </button>
          <img src={lightbox} alt="Fullscreen" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
        </div>
      )}
    </>
  );
};

export default PhotoGallery;
