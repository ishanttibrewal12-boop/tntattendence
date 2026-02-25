import ScrollReveal from './ScrollReveal';

const milestones = [
  { year: '2021', title: 'Company Founded', desc: 'Tibrewal & Tibrewal Pvt. Ltd. established in Jharkhand with mining and stone crushing operations.' },
  { year: '2022', title: 'Fleet Expansion', desc: 'Grew the transportation fleet to 30+ tipper trucks, expanding logistics across the region.' },
  { year: '2023', title: 'Petroleum & Tyres', desc: 'Launched own Bharat Petroleum station and Tibrewal Tyres — diversifying into fuel and tyre trading.' },
  { year: '2024', title: '50+ Trucks & 200+ Staff', desc: 'Crossed 50 heavy trucks, 200 employees, and became a leading industrial group in the region.' },
];

const Timeline = () => (
  <section className="py-20 md:py-28" style={{ background: 'white' }}>
    <div className="max-w-4xl mx-auto px-4">
      <ScrollReveal>
        <div className="text-center mb-14">
          <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: '#94a3b8' }}>Our Journey</p>
          <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: '#0f172a' }}>
            Milestones That Define Us
          </h2>
          <div className="w-16 h-1 mx-auto mt-4 rounded-full" style={{ background: '#f97316' }} />
        </div>
      </ScrollReveal>

      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2" style={{ background: '#e2e8f0' }} />

        {milestones.map((m, i) => (
          <ScrollReveal key={i}>
            <div className={`relative flex flex-col md:flex-row items-start mb-12 last:mb-0 ${i % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'}`}>
              {/* Dot */}
              <div className="absolute left-4 md:left-1/2 w-4 h-4 rounded-full border-4 -translate-x-1/2 z-10" style={{ background: '#f97316', borderColor: 'white' }} />
              
              {/* Content */}
              <div className={`ml-10 md:ml-0 md:w-[45%] ${i % 2 === 0 ? 'md:pr-12 md:text-right' : 'md:pl-12 md:ml-auto'}`}>
                <span className="inline-block text-xs font-bold tracking-widest uppercase px-3 py-1 rounded-full mb-3" style={{ background: 'rgba(249,115,22,0.1)', color: '#f97316' }}>
                  {m.year}
                </span>
                <h3 className="text-lg font-bold mb-1" style={{ color: '#0f172a' }}>{m.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#64748b' }}>{m.desc}</p>
              </div>
            </div>
          </ScrollReveal>
        ))}
      </div>
    </div>
  </section>
);

export default Timeline;
