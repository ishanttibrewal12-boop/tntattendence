import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { useEffect, useRef } from 'react';
import companyLogo from '@/assets/company-logo.png';
import proprietorPhoto from '@/assets/proprietor-photo.jpeg';
import founderPhoto from '@/assets/founder-sunil-tibrewal.png';
import { Shield, Award, Users, Truck, Scale, FileCheck, Globe, Heart } from 'lucide-react';

// --- Timeline Data ---
const timelineData = [
  { year: '2014', title: 'Bharat Petroleum Fuel Station', desc: 'Foundation of the group' },
  { year: '2022', title: 'Tibrewal Mines & Minerals Pvt. Ltd.', desc: 'Mining & mineral extraction' },
  { year: '2023', title: 'Tibrewal & Tibrewal Pvt. Ltd.', desc: 'Logistics & transport' },
  { year: '2024', title: 'Tibrewal Motors Pvt. Ltd.', desc: 'Automotive solutions' },
  { year: '2024', title: 'Tibrewal Tyres', desc: 'Tyre trading' },
  { year: '2025', title: 'Tibrewal Agro Food Processing', desc: 'Agro processing' },
  { year: '2025', title: 'Tibrewal Ventures', desc: 'Investments & expansion' },
];

const companies = [
  { title: 'Tibrewal Mines & Minerals Pvt. Ltd.', desc: 'Mining & mineral extraction', detail: 'Established in 2022, operates in the core mining sector with a focus on extraction and supply of high-quality natural minerals from the mineral-rich region of Jharkhand.', icon: '⛏️' },
  { title: 'Tibrewal & Tibrewal Pvt. Ltd.', desc: 'Logistics & transport', detail: 'A key logistics and transportation company with a fleet of 50+ trucks, ensuring timely and cost-effective delivery solutions across mining and construction sectors.', icon: '🚚' },
  { title: 'Tibrewal Motors Pvt. Ltd.', desc: 'Automotive solutions', detail: 'Operates in the automotive segment, focusing on vehicle-related services, fleet management, and mobility solutions supporting the group\'s logistics requirements.', icon: '🚗' },
  { title: 'Tibrewal Tyres', desc: 'Tyre trading', detail: 'Specializes in tyre trading and distribution for commercial and heavy-duty vehicles, catering to transporters, fleet owners, and industrial clients.', icon: '🛞' },
  { title: 'Tibrewal Agro Food Processing', desc: 'Agro processing', detail: 'Focuses on processing and value addition of agricultural produce, bridging the gap between raw agricultural resources and market-ready products.', icon: '🌾' },
  { title: 'Tibrewal Ventures', desc: 'Investments & expansion', detail: 'The strategic investment and expansion arm of the group, identifying new business opportunities across infrastructure, trading, and industrial services.', icon: '📈' },
];

const groupStrength = [
  { label: 'Trucks', value: 50, suffix: '+' },
  { label: 'Business Sectors', value: 6, suffix: '' },
  { label: 'Employees', value: 200, suffix: '+' },
  { label: 'Years of Operations', value: 10, suffix: '+' },
];

const policies = [
  { icon: Shield, title: 'Safety First', desc: 'All operations follow strict safety protocols. Zero-tolerance policy for unsafe practices across all sites.' },
  { icon: Scale, title: 'Fair Business Practices', desc: 'We maintain transparent and ethical dealings with all partners, vendors, and stakeholders.' },
  { icon: FileCheck, title: 'Quality Assurance', desc: 'Every product and service undergoes rigorous quality checks before delivery.' },
  { icon: Globe, title: 'Environmental Responsibility', desc: 'Committed to sustainable mining and operations with minimal environmental impact.' },
  { icon: Heart, title: 'Employee Welfare', desc: 'Competitive wages, timely payments, and safe working conditions for all 200+ employees.' },
  { icon: Award, title: 'Compliance & Governance', desc: 'Full adherence to government regulations, GST compliance, and corporate governance norms.' },
];

// --- Hero Section ---
const HeroSection = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.6 }}
    className="relative overflow-hidden rounded-2xl bg-primary p-8 lg:p-12"
  >
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-0 right-0 w-96 h-96 bg-accent rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-chart-1 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/4" />
    </div>
    <div className="relative z-10 flex items-center gap-6">
      <motion.img
        src={companyLogo}
        alt="Tibrewal Group"
        className="h-16 w-16 lg:h-20 lg:w-20 object-contain rounded-xl border border-primary-foreground/10"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
      />
      <div>
        <motion.h1
          className="text-2xl lg:text-4xl font-bold text-primary-foreground tracking-tight"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
        >
          Tibrewal Group
        </motion.h1>
        <motion.p
          className="text-sm lg:text-base text-primary-foreground/80 mt-1 font-medium"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          A Diversified Industrial Business Group
        </motion.p>
      </div>
    </div>
  </motion.div>
);

// --- Timeline with auto-scroll ---
const TimelineSection = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Auto scroll to end after animation
    const timer = setTimeout(() => {
      el.scrollTo({ left: el.scrollWidth, behavior: 'smooth' });
    }, 1200);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div>
      <motion.p
        className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        Our Journey
      </motion.p>

      {/* Desktop: horizontal with auto-scroll */}
      <div className="hidden lg:block overflow-x-auto pb-4 scrollbar-thin" ref={scrollRef}>
        <div className="flex items-start gap-0 min-w-max relative">
          <motion.div
            className="absolute top-[18px] left-[18px] right-[18px] h-[2px] bg-border"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.4, duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
            style={{ transformOrigin: 'left' }}
          />
          {timelineData.map((item, i) => (
            <motion.div
              key={i}
              className="flex flex-col items-center text-center px-6 relative"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 + i * 0.15, duration: 0.4, ease: [0.33, 1, 0.68, 1] }}
            >
              <div className="relative z-10 w-9 h-9 rounded-full bg-primary border-4 border-background flex items-center justify-center shadow-md">
                <div className="w-2.5 h-2.5 rounded-full bg-accent" />
              </div>
              <p className="mt-3 text-sm font-bold text-foreground">{item.year}</p>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-[140px] font-semibold">{item.title}</p>
              <p className="text-[11px] text-muted-foreground/70 mt-0.5 max-w-[120px]">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Mobile: vertical */}
      <div className="lg:hidden relative pl-6">
        <motion.div
          className="absolute left-[13px] top-0 bottom-0 w-[2px] bg-border"
          initial={{ scaleY: 0 }}
          animate={{ scaleY: 1 }}
          transition={{ delay: 0.4, duration: 1, ease: [0.33, 1, 0.68, 1] }}
          style={{ transformOrigin: 'top' }}
        />
        {timelineData.map((item, i) => (
          <motion.div
            key={i}
            className="relative flex items-start gap-4 mb-6 last:mb-0"
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 + i * 0.12, duration: 0.35 }}
          >
            <div className="relative z-10 w-7 h-7 rounded-full bg-primary border-3 border-background flex items-center justify-center shadow-sm flex-shrink-0 -ml-6">
              <div className="w-2 h-2 rounded-full bg-accent" />
            </div>
            <div className="-mt-0.5">
              <p className="text-sm font-bold text-foreground">{item.year}</p>
              <p className="text-xs text-muted-foreground font-semibold">{item.title}</p>
              <p className="text-[11px] text-muted-foreground/70">{item.desc}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

// --- Founder Section ---
const FounderSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3, duration: 0.5 }}
  >
    <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">Founder</p>
    <Card className="border border-border/50 overflow-hidden">
      <CardContent className="p-6 lg:p-8 flex flex-col lg:flex-row items-center gap-6">
        <motion.img
          src={founderPhoto}
          alt="Sunil Tibrewal"
          className="w-24 h-24 lg:w-28 lg:h-28 rounded-2xl object-cover object-top shadow-lg"
          whileHover={{ scale: 1.05, boxShadow: '0 0 30px hsl(28 88% 52% / 0.2)' }}
          transition={{ duration: 0.2 }}
        />
        <div className="text-center lg:text-left">
          <h3 className="text-lg lg:text-xl font-bold text-foreground tracking-tight">Sunil Tibrewal</h3>
          <p className="text-sm text-accent font-semibold mt-0.5">Founder & Director</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-md leading-relaxed">
            The visionary founder of Tibrewal Group who built the group from the ground up into a prominent industrial conglomerate. His decades of experience and strategic leadership have been instrumental in establishing the group's diverse operations across Jharkhand.
          </p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

// --- Proprietor Section ---
const ProprietorSection = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.35, duration: 0.5 }}
  >
    <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">Proprietor</p>
    <Card className="border border-border/50 overflow-hidden">
      <CardContent className="p-6 lg:p-8 flex flex-col lg:flex-row items-center gap-6">
        <motion.img
          src={proprietorPhoto}
          alt="Trishav Tibrewal"
          className="w-20 h-20 lg:w-24 lg:h-24 rounded-2xl object-cover shadow-lg"
          whileHover={{ scale: 1.05, boxShadow: '0 0 30px hsl(28 88% 52% / 0.2)' }}
          transition={{ duration: 0.2 }}
        />
        <div className="text-center lg:text-left">
          <h3 className="text-lg lg:text-xl font-bold text-foreground tracking-tight">Trishav Tibrewal</h3>
          <p className="text-sm text-accent font-semibold mt-0.5">Proprietor & Managing Director</p>
          <p className="text-xs text-muted-foreground mt-2 max-w-md leading-relaxed">
            A graduate entrepreneur from Christ University, Ghaziabad. Under his dynamic leadership, the group has expanded across mining, logistics, petroleum, and tyre trading sectors. He drives innovation, operational efficiency, and strategic growth for the entire organization.
          </p>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

// --- Policy Section ---
const PolicySection = () => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3, duration: 0.5 }}
  >
    <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">Group Policies</p>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {policies.map((policy, i) => {
        const Icon = policy.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + i * 0.08, duration: 0.35 }}
          >
            <Card className="border border-border/50 h-full">
              <CardContent className="p-5">
                <div className="p-2.5 rounded-xl bg-primary/10 w-fit mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground tracking-tight mb-1">{policy.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{policy.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  </motion.div>
);

// --- Business Units Grid ---
const BusinessUnitsSection = () => (
  <div>
    <motion.p
      className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.2 }}
    >
      Business Units
    </motion.p>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {companies.map((company, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 + i * 0.08, duration: 0.35 }}
        >
          <Card className="border border-border/50 h-full card-hover group">
            <CardContent className="p-5">
              <div className="text-2xl mb-3">{company.icon}</div>
              <h3 className="text-sm font-bold text-foreground tracking-tight mb-1">{company.title}</h3>
              <p className="text-xs text-accent font-semibold mb-2">{company.desc}</p>
              <p className="text-xs text-muted-foreground leading-relaxed">{company.detail}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  </div>
);

// --- Group Strength Strip ---
const GroupStrengthSection = () => (
  <motion.div
    className="rounded-2xl bg-primary p-6 lg:p-8"
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: 0.3, duration: 0.4 }}
  >
    <p className="text-xs font-bold text-primary-foreground/60 uppercase tracking-[0.15em] mb-5">Group Strength</p>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
      {groupStrength.map((stat, i) => (
        <motion.div
          key={stat.label}
          className="text-center"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.4 + i * 0.1, duration: 0.3 }}
        >
          <div className="text-2xl lg:text-3xl font-bold text-primary-foreground tracking-tight">
            <AnimatedNumber value={stat.value} />{stat.suffix}
          </div>
          <p className="text-xs text-primary-foreground/70 font-medium mt-1">{stat.label}</p>
        </motion.div>
      ))}
    </div>
  </motion.div>
);

// --- Main Export ---
interface CorporateDashboardProps {
  isManager: boolean;
  onNavigateDepartment: (dept: string) => void;
  onNavigateSection: (section: string) => void;
}

const CorporateDashboard = ({ isManager, onNavigateDepartment, onNavigateSection }: CorporateDashboardProps) => {
  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto pb-24 lg:pb-8 space-y-8">
      <HeroSection />
      <TimelineSection />
      <FounderSection />
      <ProprietorSection />
      <BusinessUnitsSection />
      <GroupStrengthSection />
      <PolicySection />

      <div className="text-center pt-4">
        <p className="text-xs text-muted-foreground/60 font-medium">Tibrewal Group</p>
        <p className="text-[11px] text-muted-foreground/50">Mining & Construction · Jharkhand</p>
      </div>
    </div>
  );
};

export default CorporateDashboard;
