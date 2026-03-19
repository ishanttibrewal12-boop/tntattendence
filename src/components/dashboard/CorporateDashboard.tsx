import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { useEffect, useRef } from 'react';
import companyLogo from '@/assets/company-logo.png';
import proprietorPhoto from '@/assets/proprietor-photo.jpeg';
import founderPhoto from '@/assets/founder-sunil-tibrewal.png';
import { Shield, Award, Users, Truck, Scale, FileCheck, Globe, Heart, MapPin, Phone, GraduationCap, Building2, Pickaxe, Car, Wheat, TrendingUp, CircleDot } from 'lucide-react';

// --- Data ---
const timelineData = [
  { year: '2014', title: 'Bharat Petroleum Fuel Station', desc: 'Foundation of the group with petroleum distribution' },
  { year: '2022', title: 'Tibrewal Mines & Minerals Pvt. Ltd.', desc: 'Mining & mineral extraction operations launched' },
  { year: '2023', title: 'Tibrewal & Tibrewal Pvt. Ltd.', desc: 'Logistics & transportation arm established' },
  { year: '2024', title: 'Tibrewal Motors Pvt. Ltd.', desc: 'Automotive solutions & fleet management' },
  { year: '2024', title: 'Tibrewal Tyres', desc: 'Commercial tyre trading & distribution' },
  { year: '2025', title: 'Tibrewal Agro Food Processing', desc: 'Agricultural processing & value addition' },
  { year: '2025', title: 'Tibrewal Ventures', desc: 'Strategic investments & new business expansion' },
];

const companies = [
  { title: 'Bharat Petroleum Fuel Station', year: '2014', desc: 'Petroleum Distribution', detail: 'The foundational business of Tibrewal Group. Operating a full-service Bharat Petroleum fuel station, this unit provides reliable fuel supply to transporters, fleet operators, and the local community. It represents the group\'s entry into the industrial sector and remains a cornerstone of its operations.', icon: '⛽', highlights: ['24/7 fuel availability', 'BPCL partnership', 'Fleet fueling services', 'Community fuel supply'] },
  { title: 'Tibrewal Mines & Minerals Pvt. Ltd.', year: '2022', desc: 'Mining & Mineral Extraction', detail: 'Established in 2022, this company operates in the core mining sector with a focus on extraction and supply of high-quality natural minerals from the mineral-rich region of Jharkhand. With modern excavation equipment and a dedicated workforce, the company ensures sustainable mining practices while meeting growing infrastructure demands.', icon: '⛏️', highlights: ['Open-pit mining operations', 'Stone crushing plants', 'High-quality aggregates', 'Sustainable practices'] },
  { title: 'Tibrewal & Tibrewal Pvt. Ltd.', year: '2023', desc: 'Logistics & Transportation', detail: 'A key logistics and transportation company with a fleet of 50+ heavy tipper trucks. The company ensures timely and cost-effective delivery solutions across mining, construction, and infrastructure sectors. Operating round-the-clock, it is the backbone of the group\'s supply chain operations.', icon: '🚚', highlights: ['50+ heavy tipper trucks', 'Round-the-clock operations', 'Mining & construction logistics', 'Pan-Jharkhand coverage'] },
  { title: 'Tibrewal Motors Pvt. Ltd.', year: '2024', desc: 'Automotive Solutions', detail: 'Operates in the automotive segment, focusing on vehicle-related services, fleet management, and mobility solutions. The company supports the group\'s logistics requirements while also serving external clients with comprehensive automotive services and solutions.', icon: '🚗', highlights: ['Fleet management services', 'Vehicle maintenance', 'Mobility solutions', 'Automotive trading'] },
  { title: 'Tibrewal Tyres', year: '2024', desc: 'Tyre Trading & Distribution', detail: 'Specializes in tyre trading and distribution for commercial and heavy-duty vehicles. Catering to transporters, fleet owners, and industrial clients, the company provides a comprehensive range of tyres from leading manufacturers at competitive prices.', icon: '🛞', highlights: ['Commercial vehicle tyres', 'Heavy-duty range', 'Competitive pricing', 'Pan-brand availability'] },
  { title: 'Tibrewal Agro Food Processing', year: '2025', desc: 'Agricultural Processing', detail: 'The group\'s newest venture focusing on processing and value addition of agricultural produce. This unit bridges the gap between raw agricultural resources and market-ready products, contributing to the region\'s agricultural economy and food supply chain.', icon: '🌾', highlights: ['Value-added processing', 'Farm-to-market chain', 'Quality food products', 'Regional agricultural support'] },
  { title: 'Tibrewal Ventures', year: '2025', desc: 'Strategic Investments', detail: 'The strategic investment and expansion arm of the group. Tibrewal Ventures identifies new business opportunities across infrastructure, trading, and industrial services, ensuring the group continues to grow and diversify into high-potential sectors.', icon: '📈', highlights: ['New sector identification', 'Strategic partnerships', 'Infrastructure investments', 'Growth acceleration'] },
];

const groupStrength = [
  { label: 'Trucks', value: 50, suffix: '+' },
  { label: 'Business Sectors', value: 7, suffix: '' },
  { label: 'Employees', value: 200, suffix: '+' },
  { label: 'Years of Operations', value: 10, suffix: '+' },
];

const policies = [
  { icon: Shield, title: 'Safety First', desc: 'All operations follow strict safety protocols. Zero-tolerance policy for unsafe practices across mining sites, transportation, and fuel stations. Regular safety audits and mandatory PPE compliance for all workers.' },
  { icon: Scale, title: 'Fair Business Practices', desc: 'We maintain transparent and ethical dealings with all partners, vendors, and stakeholders. All transactions are documented, GST compliant, and follow industry-standard business ethics.' },
  { icon: FileCheck, title: 'Quality Assurance', desc: 'Every product and service undergoes rigorous quality checks before delivery. From aggregate grading to fuel purity — quality is non-negotiable across all verticals.' },
  { icon: Globe, title: 'Environmental Responsibility', desc: 'Committed to sustainable mining and operations with minimal environmental impact. We follow all government-mandated environmental norms and actively work on land rehabilitation post-mining.' },
  { icon: Heart, title: 'Employee Welfare', desc: 'Competitive wages, timely salary payments, advance facilities, and safe working conditions for all 200+ employees. We invest in workforce development and provide comprehensive support systems.' },
  { icon: Award, title: 'Compliance & Governance', desc: 'Full adherence to government regulations, mining licenses, GST compliance, and corporate governance norms. Regular audits ensure complete legal and regulatory compliance across all operations.' },
  { icon: Users, title: 'Community Development', desc: 'Active participation in local community development through employment generation, infrastructure support, and contributing to the economic growth of Jharkhand\'s industrial landscape.' },
  { icon: Building2, title: 'Operational Excellence', desc: 'Continuous improvement in operational efficiency through modern equipment, technology adoption, and process optimization across all business units.' },
];

// --- Animation variants ---
const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.33, 1, 0.68, 1] as [number, number, number, number] },
};

const staggerChildren = {
  animate: { transition: { staggerChildren: 0.1 } },
};

// ============================================================
// FULL-PAGE SECTIONS
// ============================================================

// --- 1. HERO PAGE ---
const HeroPage = () => (
  <div className="min-h-[85vh] flex flex-col justify-center">
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="relative overflow-hidden rounded-3xl bg-primary p-10 lg:p-16"
    >
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent rounded-full blur-[150px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-chart-1 rounded-full blur-[120px] translate-y-1/3 -translate-x-1/4" />
      </div>
      <div className="relative z-10">
        <motion.div
          className="flex items-center gap-6 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.6 }}
        >
          <img
            src={companyLogo}
            alt="Tibrewal Group"
            className="h-20 w-20 lg:h-24 lg:w-24 object-contain rounded-2xl border border-primary-foreground/10"
          />
          <div>
            <h1 className="text-3xl lg:text-5xl font-extrabold text-primary-foreground tracking-tight">
              Tibrewal Group
            </h1>
            <p className="text-base lg:text-lg text-primary-foreground/70 mt-2 font-medium">
              A Diversified Industrial Business Group
            </p>
          </div>
        </motion.div>

        <motion.p
          className="text-sm lg:text-base text-primary-foreground/60 max-w-2xl leading-relaxed mb-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
        >
          From mining and minerals to logistics, petroleum, tyres, and agro-food processing — Tibrewal Group is a prominent industrial conglomerate powering Jharkhand's infrastructure growth since 2014.
        </motion.p>

        {/* Strength Stats */}
        <motion.div
          className="grid grid-cols-2 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7, duration: 0.5 }}
        >
          {groupStrength.map((stat, i) => (
            <div key={stat.label} className="text-center lg:text-left">
              <div className="text-3xl lg:text-4xl font-extrabold text-primary-foreground tracking-tight">
                <AnimatedNumber value={stat.value} />{stat.suffix}
              </div>
              <p className="text-xs text-primary-foreground/50 font-medium mt-1 uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  </div>
);

// --- 2. TIMELINE PAGE (Vertical Animated) ---
const TimelinePage = () => (
  <div className="min-h-[85vh] flex flex-col justify-center rounded-3xl py-16 px-6 lg:px-16" style={{ background: '#080c14' }}>
    <motion.div {...fadeUp} className="text-center mb-14">
      <p className="text-xs font-bold uppercase tracking-[0.25em] mb-3" style={{ color: 'hsl(28, 88%, 52%)' }}>Since 2014</p>
      <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight" style={{ color: 'rgba(255,255,255,0.95)' }}>Our Journey</h2>
      <p className="text-sm mt-3 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.45)' }}>A decade of growth, diversification, and relentless pursuit of industrial excellence across Jharkhand.</p>
      <div className="w-16 h-1 mx-auto mt-5 rounded-full" style={{ background: 'hsl(28, 88%, 52%)' }} />
    </motion.div>

    <div className="relative max-w-3xl mx-auto w-full">
      {/* Animated vertical line */}
      <motion.div
        className="absolute left-5 lg:left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2"
        style={{ background: 'rgba(255,255,255,0.08)' }}
        initial={{ scaleY: 0 }}
        whileInView={{ scaleY: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.2, ease: [0.33, 1, 0.68, 1] }}
      />

      {timelineData.map((item, i) => (
        <motion.div
          key={i}
          className={`relative flex items-start mb-12 last:mb-0 ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
          initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40, y: 15 }}
          whileInView={{ opacity: 1, x: 0, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ delay: i * 0.1, duration: 0.5, ease: [0.33, 1, 0.68, 1] }}
        >
          {/* Dot */}
          <div className="absolute left-5 lg:left-1/2 w-10 h-10 rounded-full -translate-x-1/2 z-10 flex items-center justify-center border-4" style={{ background: '#080c14', borderColor: 'hsl(28, 88%, 52%)' }}>
            <div className="w-3 h-3 rounded-full" style={{ background: 'hsl(28, 88%, 52%)' }} />
          </div>

          {/* Content card */}
          <div className={`ml-14 lg:ml-0 lg:w-[43%] ${i % 2 === 0 ? 'lg:pr-14 lg:text-right' : 'lg:pl-14 lg:ml-auto'}`}>
            <div className="rounded-2xl p-5 border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)' }}>
              <span className="inline-block text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full mb-3" style={{ background: 'rgba(234,136,37,0.12)', color: 'hsl(28, 88%, 55%)' }}>{item.year}</span>
              <h3 className="text-base lg:text-lg font-bold mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>{item.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.45)' }}>{item.desc}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  </div>
);

// --- 3. INDIVIDUAL COMPANY PAGES ---
const CompanyPage = ({ company, index }: { company: typeof companies[0]; index: number }) => (
  <div className="min-h-[85vh] flex flex-col justify-center">
    <motion.div {...fadeUp}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-xs font-bold text-accent uppercase tracking-[0.2em]">Business Unit {index + 1}/{companies.length}</span>
        <span className="text-xs text-muted-foreground/50">•</span>
        <span className="text-xs text-muted-foreground font-medium">Est. {company.year}</span>
      </div>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15, duration: 0.6 }}
    >
      <Card className="border border-border/50 overflow-hidden">
        <CardContent className="p-0">
          {/* Header band */}
          <div className="bg-primary p-8 lg:p-12 relative overflow-hidden">
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 right-0 w-72 h-72 bg-accent rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3" />
            </div>
            <div className="relative z-10">
              <span className="text-5xl lg:text-6xl mb-4 block">{company.icon}</span>
              <h2 className="text-2xl lg:text-3xl font-extrabold text-primary-foreground tracking-tight mb-2">
                {company.title}
              </h2>
              <p className="text-sm lg:text-base text-primary-foreground/60 font-medium">{company.desc}</p>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 lg:p-12">
            <p className="text-sm lg:text-base text-muted-foreground leading-relaxed mb-8">
              {company.detail}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {company.highlights.map((h, i) => (
                <motion.div
                  key={i}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/30"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.4 + i * 0.08, duration: 0.3 }}
                >
                  <CircleDot className="h-4 w-4 text-accent flex-shrink-0" />
                  <span className="text-sm text-foreground font-medium">{h}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  </div>
);

// --- 4. FOUNDER FULL PAGE ---
const FounderPage = () => (
  <div className="min-h-[85vh] flex flex-col justify-center">
    <motion.div {...fadeUp}>
      <p className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-2">Founder & Director</p>
      <h2 className="text-2xl lg:text-4xl font-extrabold text-foreground tracking-tight mb-8">Sunil Tibrewal</h2>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
    >
      <Card className="border border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            {/* Photo */}
            <div className="lg:w-2/5 relative overflow-hidden bg-primary/5">
              <img
                src={founderPhoto}
                alt="Sunil Tibrewal"
                className="w-full h-64 lg:h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-background/10" />
            </div>

            {/* Content */}
            <div className="lg:w-3/5 p-8 lg:p-12 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-bold tracking-wider uppercase w-fit mb-6">
                <Award className="h-3.5 w-3.5" />
                Founder & Director
              </div>

              <h3 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight mb-4">
                Sunil Tibrewal
              </h3>

              <p className="text-sm lg:text-base text-muted-foreground leading-relaxed mb-4">
                The visionary founder of Tibrewal Group who laid the foundation of the group's diversified industrial operations. Starting with a Bharat Petroleum fuel station in 2014, his strategic vision has been instrumental in building the group from a single business into a multi-vertical industrial conglomerate.
              </p>

              <p className="text-sm lg:text-base text-muted-foreground leading-relaxed mb-6">
                With decades of experience in business management and industrial operations, Sunil Tibrewal's leadership has guided the group through its formative years. His deep understanding of Jharkhand's industrial landscape and commitment to quality have established Tibrewal Group as a trusted name in the region's mining, logistics, and energy sectors.
              </p>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4 text-accent" />
                <span>Jharkhand, India</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  </div>
);

// --- 5. PROPRIETOR FULL PAGE (page 1) ---
const ProprietorPage1 = () => (
  <div className="min-h-[85vh] flex flex-col justify-center">
    <motion.div {...fadeUp}>
      <p className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-2">Proprietor & Managing Director</p>
      <h2 className="text-2xl lg:text-4xl font-extrabold text-foreground tracking-tight mb-8">Trishav Tibrewal</h2>
    </motion.div>

    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2, duration: 0.6 }}
    >
      <Card className="border border-border/50 overflow-hidden">
        <CardContent className="p-0">
          <div className="flex flex-col lg:flex-row">
            {/* Photo */}
            <div className="lg:w-2/5 relative overflow-hidden bg-primary/5">
              <img
                src={proprietorPhoto}
                alt="Trishav Tibrewal"
                className="w-full h-64 lg:h-full object-cover object-top"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-background/10" />
            </div>

            {/* Content */}
            <div className="lg:w-3/5 p-8 lg:p-12 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-bold tracking-wider uppercase w-fit mb-6">
                <GraduationCap className="h-3.5 w-3.5" />
                Proprietor & Managing Director
              </div>

              <h3 className="text-2xl lg:text-3xl font-extrabold text-foreground tracking-tight mb-4">
                Trishav Tibrewal
              </h3>

              <p className="text-sm lg:text-base text-muted-foreground leading-relaxed mb-4">
                A graduate entrepreneur from <span className="text-foreground font-semibold">Christ University, Ghaziabad</span>. Trishav Tibrewal is a young, dynamic leader who has brought modern management practices and entrepreneurial energy to the family's industrial legacy.
              </p>

              <p className="text-sm lg:text-base text-muted-foreground leading-relaxed mb-6">
                Under his leadership, the group has rapidly expanded from traditional mining and transportation into new verticals including automotive solutions, tyre distribution, agro-food processing, and strategic investments. His vision combines the group's industrial strength with modern technology and business innovation.
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-accent" />
                  <a href="tel:9386469006" className="hover:text-foreground transition-colors">9386469006</a>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-accent" />
                  <span>Jharkhand, India</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  </div>
);

// --- 6. PROPRIETOR FULL PAGE (page 2 — Vision & Achievements) ---
const ProprietorPage2 = () => (
  <div className="min-h-[85vh] flex flex-col justify-center">
    <motion.div {...fadeUp}>
      <p className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-2">Vision & Leadership</p>
      <h2 className="text-2xl lg:text-4xl font-extrabold text-foreground tracking-tight mb-8">Driving the Future</h2>
    </motion.div>

    <div className="space-y-6">
      {/* Vision Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <Card className="border border-border/50">
          <CardContent className="p-8 lg:p-12">
            <div className="flex items-center gap-4 mb-6">
              <img src={proprietorPhoto} alt="Trishav Tibrewal" className="w-14 h-14 rounded-full object-cover border-2 border-accent" />
              <div>
                <h3 className="text-lg font-bold text-foreground">Trishav Tibrewal</h3>
                <p className="text-xs text-accent font-semibold">Proprietor's Vision</p>
              </div>
            </div>
            <blockquote className="text-base lg:text-lg text-muted-foreground leading-relaxed italic border-l-4 border-accent/30 pl-6">
              "Our goal is to build Tibrewal Group into Jharkhand's most trusted and diversified industrial conglomerate — one that creates employment, drives infrastructure growth, and sets new standards of operational excellence in every sector we enter."
            </blockquote>
          </CardContent>
        </Card>
      </motion.div>

      {/* Achievements Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
      >
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">Key Achievements Under His Leadership</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            { icon: TrendingUp, title: '7 Business Verticals', desc: 'Expanded the group from 1 to 7 diverse business units in under 4 years' },
            { icon: Truck, title: '50+ Fleet Size', desc: 'Grew the transportation fleet from a handful of vehicles to over 50 heavy trucks' },
            { icon: Users, title: '200+ Employees', desc: 'Created employment for over 200 people across all operations' },
            { icon: Building2, title: 'Corporate Structure', desc: 'Transformed family business into professionally managed corporate entities' },
          ].map((item, i) => (
            <Card key={i} className="border border-border/50">
              <CardContent className="p-6">
                <div className="p-2.5 rounded-xl bg-primary/10 w-fit mb-3">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <h4 className="text-sm font-bold text-foreground mb-1">{item.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </motion.div>
    </div>
  </div>
);

// --- 7. POLICIES FULL PAGE ---
const PoliciesPage = () => (
  <div className="min-h-[85vh] flex flex-col justify-center">
    <motion.div {...fadeUp}>
      <p className="text-xs font-bold text-accent uppercase tracking-[0.2em] mb-2">Corporate Standards</p>
      <h2 className="text-2xl lg:text-4xl font-extrabold text-foreground tracking-tight mb-2">Group Policies</h2>
      <p className="text-sm text-muted-foreground mb-10 max-w-xl">
        Our policies reflect our commitment to safety, quality, compliance, and the welfare of every stakeholder associated with Tibrewal Group.
      </p>
    </motion.div>

    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {policies.map((policy, i) => {
        const Icon = policy.icon;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 + i * 0.06, duration: 0.4 }}
          >
            <Card className="border border-border/50 h-full">
              <CardContent className="p-6">
                <div className="p-2.5 rounded-xl bg-primary/10 w-fit mb-3">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="text-sm font-bold text-foreground tracking-tight mb-2">{policy.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{policy.desc}</p>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  </div>
);

// ============================================================
// MAIN EXPORT
// ============================================================
interface CorporateDashboardProps {
  isManager: boolean;
  onNavigateDepartment: (dept: string) => void;
  onNavigateSection: (section: string) => void;
}

const CorporateDashboard = ({ isManager, onNavigateDepartment, onNavigateSection }: CorporateDashboardProps) => {
  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto pb-24 lg:pb-8 space-y-16 lg:space-y-24">
      {/* Page 1: Hero */}
      <HeroPage />

      {/* Page 2: Timeline */}
      <TimelinePage />

      {/* Pages 3-9: One page per company */}
      {companies.map((company, i) => (
        <CompanyPage key={i} company={company} index={i} />
      ))}

      {/* Page 10: Founder */}
      <FounderPage />

      {/* Page 11-12: Proprietor (2 pages) */}
      <ProprietorPage1 />
      <ProprietorPage2 />

      {/* Page 13: Policies */}
      <PoliciesPage />

      {/* Footer */}
      <div className="text-center pt-8 pb-4">
        <p className="text-xs text-muted-foreground/60 font-medium">Tibrewal Group</p>
        <p className="text-[11px] text-muted-foreground/40 mt-1">Mining & Minerals · Logistics · Petroleum · Tyres · Agro · Ventures</p>
        <p className="text-[11px] text-muted-foreground/30 mt-1">Jharkhand, India</p>
      </div>
    </div>
  );
};

export default CorporateDashboard;
