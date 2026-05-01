import { Shield, Truck, Users, Building2 } from 'lucide-react';

const stats = [
  { icon: Building2, label: 'Diversified Verticals', value: 'Multi-Sector' },
  { icon: Truck, label: 'Fleet Strength', value: 'Ample' },
  { icon: Users, label: 'Workforce', value: 'Large Team' },
  { icon: Shield, label: 'Operations', value: 'Since 2013' },
];

const StatsStrip = () => (
  <section className="py-16 bg-background border-y border-border">
    <div className="max-w-5xl mx-auto px-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="text-center">
              <div className="w-10 h-10 mx-auto mb-3 rounded-full flex items-center justify-center bg-muted">
                <Icon className="h-5 w-5 text-foreground" />
              </div>
              <p className="text-lg md:text-xl font-semibold tracking-[-0.018em] text-foreground">{stat.value}</p>
              <p className="text-[11px] mt-1 uppercase tracking-[0.14em] text-muted-foreground">{stat.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default StatsStrip;
