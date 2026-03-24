import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { X, ZoomIn } from 'lucide-react';
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

    const ctx = gsap.context(() => {
      gsap.from('.gallery-sub', {
        opacity: 0, y: 20, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });
      gsap.from('.gallery-heading', {
        opacity: 0, y: 30, duration: 0.7, delay: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });
      gsap.from('.gallery-line', {
        scaleX: 0, duration: 0.6, delay: 0.2, ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  // Re-animate on filter change
  useEffect(() => {
    const imgs = document.querySelectorAll('.gallery-img');
    gsap.fromTo(imgs, { opacity: 0, y: 30, scale: 0.95 }, {
      opacity: 1, y: 0, scale: 1, duration: 0.4, ease: 'power3.out',
      stagger: 0.04,
    });
  }, [activeFilter]);

  return (
    <>
      <section ref={sectionRef} className="py-20 md:py-32" style={{ background: '#10141c' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <p className="gallery-sub text-xs font-bold tracking-[0.3em] uppercase mb-3 text-orange-400">Gallery</p>
            <h2 className="gallery-heading text-3xl md:text-5xl font-extrabold text-white/95">Our Work in Action</h2>
            <div className="gallery-line w-20 h-1.5 mx-auto mt-5 rounded-full origin-center" style={{ background: 'linear-gradient(90deg, #f97316, #fb923c)' }} />
          </div>

          {/* Filter tabs */}
          <div className="flex flex-wrap justify-center gap-3 mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-300 border"
                style={{
                  background: activeFilter === cat ? '#f97316' : 'rgba(255,255,255,0.04)',
                  color: activeFilter === cat ? '#fff' : 'rgba(255,255,255,0.5)',
                  borderColor: activeFilter === cat ? '#f97316' : 'rgba(255,255,255,0.1)',
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Gallery grid */}
          <div className="columns-2 md:columns-3 gap-4 space-y-4">
            {filtered.map((photo, i) => (
              <div
                key={`${activeFilter}-${i}`}
                className="gallery-img group relative break-inside-avoid rounded-xl overflow-hidden cursor-pointer"
                onClick={() => setLightbox(photo.src)}
              >
                <img src={photo.src} alt={photo.alt} className="w-full block transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-500 flex items-center justify-center">
                  <ZoomIn className="h-8 w-8 text-white opacity-0 group-hover:opacity-100 transition-all duration-300 scale-75 group-hover:scale-100" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.7))' }}>
                  <p className="text-xs text-white/80 font-medium">{photo.alt}</p>
                  <p className="text-[10px] text-orange-400">{photo.cat}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Lightbox */}
      {lightbox && (
        <div
          className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-pointer"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
          >
            <X className="h-8 w-8" />
          </button>
          <img src={lightbox} alt="Fullscreen" className="max-w-full max-h-[90vh] object-contain rounded-lg" />
        </div>
      )}
    </>
  );
};

export default PhotoGallery;
