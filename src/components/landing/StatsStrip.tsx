import { Shield, Truck, Users, Building2 } from 'lucide-react';

const stats = [
  { icon: Building2, label: 'Diversified Verticals', value: 'Multi-Sector' },
  { icon: Truck, label: 'Fleet Strength', value: 'Ample Fleet' },
  { icon: Users, label: 'Workforce', value: 'Large Team' },
  { icon: Shield, label: 'Operations', value: 'Since 2013' },
];

const StatsStrip = () => (
  <section className="py-14" style={{ background: 'linear-gradient(135deg, #080b12 0%, #121828 100%)' }}>
    <div className="max-w-5xl mx-auto px-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="text-center">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center bg-orange-500/10">
                <Icon className="h-6 w-6 text-orange-400" />
              </div>
              <p className="text-xl md:text-2xl font-extrabold text-white">{stat.value}</p>
              <p className="text-xs mt-1 uppercase tracking-wider text-white/50">{stat.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

export default StatsStrip;
