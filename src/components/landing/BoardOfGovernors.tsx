import { useLandingTheme } from './LandingThemeContext';
import ScrollReveal from './ScrollReveal';
import { Phone, MapPin, Briefcase, Mail } from 'lucide-react';

interface Governor {
  name: string;
  designation: string;
  description: string;
  phone?: string;
  email?: string;
  location?: string;
  photoUrl?: string;
}

const governors: Governor[] = [
  {
    name: 'Sunil Tibrewal',
    designation: 'Director',
    description: 'Seasoned business leader with extensive experience in mining operations, strategic planning, and corporate governance. Instrumental in driving the company\'s growth across multiple verticals.',
    phone: '9386469006',
    location: 'Jharkhand, India',
    photoUrl: '',
  },
  {
    name: 'Trishav Tibrewal',
    designation: 'Proprietor & Managing Director',
    description: 'Visionary entrepreneur and founder, leading the company\'s diversified operations across mining, stone crushing, transportation, petroleum distribution, and tyre trading.',
    phone: '9386469006',
    location: 'Jharkhand, India',
    photoUrl: '',
  },
];

const BoardOfGovernors = () => {
  const { colors } = useLandingTheme();

  return (
    <section className="py-16 md:py-24" style={{ background: colors.sectionBg, transition: 'background 0.6s cubic-bezier(0.4,0,0.2,1)' }}>
      <div className="max-w-5xl mx-auto px-4">
        <ScrollReveal>
          <div className="text-center mb-14">
            <p className="text-xs font-semibold tracking-[0.25em] uppercase mb-2" style={{ color: '#f97316' }}>Leadership</p>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-3" style={{ color: colors.heading }}>Board of Governors</h2>
            <div className="w-14 h-0.5 mx-auto rounded-full" style={{ background: '#f97316' }} />
            <p className="mt-4 max-w-xl mx-auto text-sm md:text-base" style={{ color: colors.textMuted }}>
              The strategic minds steering Tibrewal & Tibrewal Pvt. Ltd. towards excellence and sustainable growth.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {governors.map((gov, idx) => (
            <ScrollReveal key={idx}>
              <div
                className="rounded-2xl overflow-hidden border"
                style={{
                  background: colors.cardBg,
                  borderColor: colors.cardBorder,
                  transition: 'background 0.6s, border-color 0.6s',
                }}
              >
                {/* Photo area */}
                <div className="relative h-56 flex items-center justify-center overflow-hidden" style={{ background: colors.darkBg }}>
                  {gov.photoUrl ? (
                    <img src={gov.photoUrl} alt={gov.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold" style={{ background: 'rgba(249,115,22,0.15)', color: '#f97316' }}>
                        {gov.name.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.3)' }}>Photo coming soon</span>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-6">
                  <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: '#f97316' }}>{gov.designation}</p>
                  <h3 className="text-xl font-bold mb-2" style={{ color: colors.heading }}>{gov.name}</h3>
                  <p className="text-sm leading-relaxed mb-5" style={{ color: colors.textMuted }}>{gov.description}</p>

                  <div className="flex flex-wrap gap-4">
                    {gov.phone && (
                      <a href={`tel:${gov.phone}`} className="flex items-center gap-1.5 text-xs hover:underline" style={{ color: colors.text }}>
                        <Phone className="h-3.5 w-3.5" /> {gov.phone}
                      </a>
                    )}
                    {gov.email && (
                      <a href={`mailto:${gov.email}`} className="flex items-center gap-1.5 text-xs hover:underline" style={{ color: colors.text }}>
                        <Mail className="h-3.5 w-3.5" /> {gov.email}
                      </a>
                    )}
                    {gov.location && (
                      <span className="flex items-center gap-1.5 text-xs" style={{ color: colors.label }}>
                        <MapPin className="h-3.5 w-3.5" /> {gov.location}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BoardOfGovernors;
