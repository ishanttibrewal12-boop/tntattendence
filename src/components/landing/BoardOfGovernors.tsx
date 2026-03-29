import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Phone, MapPin } from 'lucide-react';
import proprietorPhoto from '@/assets/proprietor-photo.jpeg';
import founderPhoto from '@/assets/founder-sunil-tibrewal.jpg';

gsap.registerPlugin(ScrollTrigger);

interface Governor {
  name: string;
  designation: string;
  description: string;
  phone?: string;
  location?: string;
  photoUrl?: string;
}

const governors: Governor[] = [
  {
    name: 'Sunil Tibrewal',
    designation: 'Founder & Director',
    description: 'The visionary founder of Tibrewal Group who laid the foundation of the group\'s diversified industrial operations. His decades of experience and leadership have been instrumental in building the group from the ground up into a prominent business conglomerate in Jharkhand.',
    location: 'Jharkhand, India',
    photoUrl: founderPhoto,
  },
  {
    name: 'Trishav Tibrewal',
    designation: 'Proprietor & Managing Director',
    description: 'A graduate entrepreneur from Christ University, Ghaziabad. Under his dynamic leadership, Tibrewal Group has expanded across mining, stone crushing, transportation, petroleum distribution, and tyre trading, driving the group towards new heights of excellence.',
    phone: '9386469006',
    location: 'Jharkhand, India',
    photoUrl: proprietorPhoto,
  },
];

const BoardOfGovernors = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.gov-card').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0,
          y: 50,
          duration: 0.7,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
          delay: i * 0.15,
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 md:py-24" style={{ background: '#10141c' }}>
      <div className="max-w-5xl mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-2 text-orange-400">Leadership</p>
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3 text-white/95">Board of Governors</h2>
          <div className="w-14 h-0.5 mx-auto rounded-full bg-orange-500" />
          <p className="mt-4 max-w-xl mx-auto text-sm md:text-base text-white/55">
            The strategic minds steering Tibrewal Group towards excellence and sustainable growth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {governors.map((gov, idx) => (
            <div
              key={idx}
              className="gov-card rounded-2xl overflow-hidden border border-white/10"
              style={{ background: '#161b26' }}
            >
              <div className="relative h-64 flex items-center justify-center overflow-hidden" style={{ background: '#0F2A44' }}>
                {gov.photoUrl ? (
                  <img src={gov.photoUrl} alt={gov.name} className="w-full h-full object-cover object-top" loading="lazy" />
                ) : (
                  <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold bg-orange-500/15 text-orange-400">
                    {gov.name.split(' ').map(n => n[0]).join('')}
                  </div>
                )}
              </div>
              <div className="p-6">
                <p className="text-xs font-semibold tracking-widest uppercase mb-1 text-orange-400">{gov.designation}</p>
                <h3 className="text-xl font-bold mb-2 text-white/90">{gov.name}</h3>
                <p className="text-sm leading-relaxed mb-5 text-white/55">{gov.description}</p>
                <div className="flex flex-wrap gap-4">
                  {gov.phone && (
                    <a href={`tel:${gov.phone}`} className="flex items-center gap-1.5 text-xs text-white/70 hover:underline">
                      <Phone className="h-3.5 w-3.5" /> {gov.phone}
                    </a>
                  )}
                  {gov.location && (
                    <span className="flex items-center gap-1.5 text-xs text-white/45">
                      <MapPin className="h-3.5 w-3.5" /> {gov.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BoardOfGovernors;
