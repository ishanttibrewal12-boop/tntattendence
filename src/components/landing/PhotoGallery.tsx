import ScrollReveal from './ScrollReveal';
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

// Arranged for visual balance: alternating categories, mixing vertical/horizontal
const photos = [
  { src: crusher7, alt: 'Crusher plant in action' },
  { src: tyres5, alt: 'Tyre closeup' },
  { src: truck3, alt: 'Tipper truck night' },
  { src: petroleum5, alt: 'Bharat Petroleum station' },
  { src: crusher1, alt: 'Stone crushing operations' },
  { src: tyres6, alt: 'Tyre warehouse aisle' },
  { src: truck2, alt: 'Heavy tipper truck' },
  { src: crusher6, alt: 'Crushing plant wide' },
  { src: petroleum6, alt: 'Fuel station' },
  { src: tyres1, alt: 'Tyre storage' },
  { src: crusher2, alt: 'Crusher machinery' },
  { src: petroleum4, alt: 'BP signboard' },
  { src: truck1, alt: 'Transportation fleet' },
  { src: tyres2, alt: 'Commercial tyres' },
  { src: crusher3, alt: 'Aggregate production' },
  { src: petroleum1, alt: 'Petroleum services' },
  { src: tyres3, alt: 'Tyre display' },
  { src: crusher4, alt: 'Crushing facility' },
  { src: petroleum2, alt: 'Fuel pump' },
  { src: crusher5, alt: 'Stone aggregate' },
  { src: tyres4, alt: 'Tyre collection' },
  { src: petroleum3, alt: 'Petrol station' },
  { src: aggregate1, alt: 'Aggregates stockpile' },
];

const PhotoGallery = () => {
  return (
    <section className="py-16 md:py-24" style={{ background: 'white' }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: '#94a3b8' }}>Gallery</p>
          <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: '#0f172a' }}>
            Our Work in Action
          </h2>
          <div className="w-16 h-1 mx-auto mt-4 rounded-full" style={{ background: '#f97316' }} />
        </div>

        <div className="columns-2 md:columns-3 gap-4 space-y-4">
          {photos.map((photo, i) => (
            <ScrollReveal key={i}>
              <img
                src={photo.src}
                alt={photo.alt}
                className="w-full rounded-lg break-inside-avoid"
                loading="lazy"
              />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PhotoGallery;
