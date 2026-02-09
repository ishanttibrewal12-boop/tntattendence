import galleryTruck1 from '@/assets/gallery-truck-1.jpeg';
import galleryTruck2 from '@/assets/gallery-truck-2.jpeg';
import galleryPetroleum1 from '@/assets/gallery-petroleum-1.jpeg';
import galleryPetroleum2 from '@/assets/gallery-petroleum-2.jpeg';
import galleryCrusher1 from '@/assets/gallery-crusher-1.jpeg';
import galleryCrusher2 from '@/assets/gallery-crusher-2.jpeg';
import galleryCrusher3 from '@/assets/gallery-crusher-3.jpeg';
import galleryAggregate1 from '@/assets/gallery-aggregate-1.jpeg';
import galleryTyres1 from '@/assets/gallery-tyres-1.jpeg';
import galleryTyres2 from '@/assets/gallery-tyres-2.jpeg';

const images = [
  { src: galleryTruck1, label: 'Transportation Fleet', category: 'Logistics' },
  { src: galleryCrusher1, label: 'Stone Crushing Plant', category: 'Crushing' },
  { src: galleryPetroleum1, label: 'Bharat Petroleum Station', category: 'Petroleum' },
  { src: galleryTyres1, label: 'Tyre Operations', category: 'Tyres' },
  { src: galleryAggregate1, label: 'Aggregate Production', category: 'Mining' },
  { src: galleryTruck2, label: 'Heavy Tipper Trucks', category: 'Logistics' },
  { src: galleryCrusher2, label: 'Mining Operations', category: 'Mining' },
  { src: galleryPetroleum2, label: 'Fuel Distribution', category: 'Petroleum' },
  { src: galleryCrusher3, label: 'Crusher Operations', category: 'Crushing' },
  { src: galleryTyres2, label: 'Tyre Warehouse', category: 'Tyres' },
];

const ImageGallery = () => {
  return (
    <section className="py-16 md:py-24" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e3a8a 50%, #0f172a 100%)' }}>
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Our Operations</p>
          <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: 'white' }}>
            Building Jharkhand's Infrastructure
          </h2>
          <div className="w-20 h-1 mx-auto mt-4 rounded-full" style={{ background: 'rgba(255,255,255,0.3)' }} />
        </div>

        {/* Grid gallery */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 md:gap-4">
          {images.map((img, i) => (
            <div
              key={i}
              className={`group relative overflow-hidden rounded-xl transition-transform duration-300 hover:scale-[1.03] ${
                i === 0 || i === 2 ? 'md:col-span-2 md:row-span-2' : ''
              }`}
            >
              <img
                src={img.src}
                alt={img.label}
                className="w-full h-full object-cover min-h-[160px] md:min-h-[200px]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end p-3 md:p-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>{img.category}</p>
                  <p className="text-sm md:text-base font-bold" style={{ color: 'white' }}>{img.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ImageGallery;
