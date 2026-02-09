import { Mountain, Truck, Fuel, CircleDot } from 'lucide-react';

const highlights = [
  { icon: Mountain, title: 'Stone Crushing & Aggregates', desc: 'Large-scale stone crushing plants producing high-quality aggregates for construction and infrastructure projects.' },
  { icon: Truck, title: 'Transportation Fleet', desc: 'A fleet of over 50 heavy tipper trucks serving mining, construction, and logistics needs across Jharkhand.' },
  { icon: Fuel, title: 'Petroleum Services', desc: 'Own Bharat Petroleum fuel station providing reliable fuel supply to the region\'s growing transportation network.' },
  { icon: CircleDot, title: 'Tibrewal Tyres', desc: 'Comprehensive tyre trading and distribution for commercial vehicles supporting the mining and transport sectors.' },
];

const CompanySection = () => {
  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="max-w-6xl mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-14">
          <p className="text-sm font-semibold tracking-widest uppercase text-muted-foreground mb-2">About Us</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-foreground">
            Powering Growth Since 2018
          </h2>
          <p className="mt-4 max-w-2xl mx-auto text-muted-foreground leading-relaxed">
            Tibrewal & Tibrewal Pvt. Ltd. is a prominent business group based in Jharkhand, 
            operating across mining, stone crushing, transportation, petroleum distribution, and tyre trading. 
            With a commitment to quality and reliability, we have established ourselves as a trusted name in 
            the region's industrial landscape.
          </p>
        </div>

        {/* Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {highlights.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex gap-4 p-6 rounded-2xl border border-border bg-card hover:shadow-lg transition-shadow duration-300">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-foreground mb-1">{item.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CompanySection;
