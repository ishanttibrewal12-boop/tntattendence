import crusher2 from '@/assets/gallery-crusher-new-2.jpeg';
import crusher3 from '@/assets/gallery-crusher-new-3.jpeg';
import crusher4 from '@/assets/gallery-crusher-new-4.jpeg';
import crusher5 from '@/assets/gallery-crusher-new-5.jpeg';
import tyres2 from '@/assets/gallery-tyres-new-2.jpeg';
import tyres3 from '@/assets/gallery-tyres-new-3.jpeg';
import tyres4 from '@/assets/gallery-tyres-new-4.jpeg';
import truck1 from '@/assets/gallery-truck-1.jpeg';
import truck2 from '@/assets/gallery-truck-2.jpeg';
import petroleum1 from '@/assets/gallery-petroleum-1.jpeg';
import petroleum3 from '@/assets/gallery-petroleum-3.jpeg';
import aggregate1 from '@/assets/gallery-aggregate-1.jpeg';

const photos = [
  { src: crusher2, alt: 'Stone crushing plant' },
  { src: tyres2, alt: 'Tyre on highway' },
  { src: crusher3, alt: 'Crusher operations' },
  { src: truck1, alt: 'Transportation fleet' },
  { src: tyres3, alt: 'Tyre warehouse' },
  { src: crusher4, alt: 'Crushing facility' },
  { src: petroleum1, alt: 'Petroleum station' },
  { src: tyres4, alt: 'Tyre storage' },
  { src: crusher5, alt: 'Aggregate production' },
  { src: truck2, alt: 'Heavy truck' },
  { src: petroleum3, alt: 'Fuel services' },
  { src: aggregate1, alt: 'Aggregates' },
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
            <img
              key={i}
              src={photo.src}
              alt={photo.alt}
              className="w-full rounded-lg break-inside-avoid"
              loading="lazy"
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default PhotoGallery;
