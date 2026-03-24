import { motion, useScroll, useTransform } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { useEffect, useRef, useCallback } from 'react';
import companyLogo from '@/assets/tibrewal-logo.png';
import proprietorPhoto from '@/assets/proprietor-photo.jpeg';
import founderPhoto from '@/assets/founder-sunil-tibrewal.png';
import { Shield, Award, Users, Truck, Scale, FileCheck, Globe, Heart, MapPin, Phone, GraduationCap, Building2, Pickaxe, Car, Wheat, TrendingUp, CircleDot, Sparkles, Star } from 'lucide-react';

// --- Data ---
const timelineData = [
  { year: '2014', title: 'Bharat Petroleum Fuel Station', desc: 'Foundation of the group with petroleum distribution' },
  { year: '2022', title: 'Tibrewal Mines & Minerals Pvt. Ltd.', desc: 'Mining & mineral extraction operations launched' },
  { year: '2024', title: 'Tibrewal Tyres', desc: 'Commercial tyre trading & distribution' },
  { year: '2025', title: 'Tibrewal Agro Food Processing', desc: 'Agricultural processing & value addition' },
  { year: '2025', title: 'Tibrewal Ventures', desc: 'Strategic investments & new business expansion' },
];

const companies = [
  { title: 'Bharat Petroleum Fuel Station', year: '2014', desc: 'Petroleum Distribution', detail: 'The foundational business of Tibrewal Group. Operating a full-service Bharat Petroleum fuel station, this unit provides reliable fuel supply to transporters, fleet operators, and the local community.', icon: '⛽', highlights: ['24/7 fuel availability', 'BPCL partnership', 'Fleet fueling services', 'Community fuel supply'], color: 'hsla(28,88%,52%,0.12)' },
  { title: 'Tibrewal Mines & Minerals Pvt. Ltd.', year: '2022', desc: 'Mining & Mineral Extraction', detail: 'Operates in the core mining sector with a focus on extraction and supply of high-quality natural minerals from the mineral-rich region of Jharkhand. Modern excavation equipment and sustainable mining practices.', icon: '⛏️', highlights: ['Open-pit mining operations', 'Stone crushing plants', 'High-quality aggregates', 'Sustainable practices'], color: 'hsla(210,60%,40%,0.12)' },
  { title: 'Tibrewal Tyres', year: '2024', desc: 'Tyre Trading & Distribution', detail: 'Specializes in tyre trading and distribution for commercial and heavy-duty vehicles. Catering to transporters, fleet owners, and industrial clients with a comprehensive range from leading manufacturers.', icon: '🛞', highlights: ['Commercial vehicle tyres', 'Heavy-duty range', 'Competitive pricing', 'Pan-brand availability'], color: 'hsla(0,60%,50%,0.08)' },
  { title: 'Tibrewal Agro Food Processing', year: '2025', desc: 'Agricultural Processing', detail: 'Focusing on processing and value addition of agricultural produce. Bridging the gap between raw agricultural resources and market-ready products for the region\'s agricultural economy.', icon: '🌾', highlights: ['Value-added processing', 'Farm-to-market chain', 'Quality food products', 'Regional agricultural support'], color: 'hsla(90,50%,40%,0.10)' },
  { title: 'Tibrewal Ventures', year: '2025', desc: 'Strategic Investments', detail: 'The strategic investment and expansion arm. Identifies new business opportunities across infrastructure, trading, and industrial services for continued growth and diversification.', icon: '📈', highlights: ['New sector identification', 'Strategic partnerships', 'Infrastructure investments', 'Growth acceleration'], color: 'hsla(45,80%,50%,0.08)' },
];

const groupStrength = [
  { label: 'Fleet Strength', value: 'Ample', isText: true, icon: Truck },
  { label: 'Business Sectors', value: 5, suffix: '', icon: Building2 },
  { label: 'Workforce', value: 'Large Team', isText: true, icon: Users },
  { label: 'Years of Operations', value: 10, suffix: '+', icon: Star },
];

const policies = [
  { icon: Shield, title: 'Safety First', desc: 'All operations follow strict safety protocols. Zero-tolerance policy for unsafe practices across mining sites, transportation, and fuel stations. Regular safety audits and mandatory PPE compliance for all workers.' },
  { icon: Scale, title: 'Fair Business Practices', desc: 'We maintain transparent and ethical dealings with all partners, vendors, and stakeholders. All transactions are documented, GST compliant, and follow industry-standard business ethics.' },
  { icon: FileCheck, title: 'Quality Assurance', desc: 'Every product and service undergoes rigorous quality checks before delivery. From aggregate grading to fuel purity — quality is non-negotiable across all verticals.' },
  { icon: Globe, title: 'Environmental Responsibility', desc: 'Committed to sustainable mining and operations with minimal environmental impact. We follow all government-mandated environmental norms and actively work on land rehabilitation post-mining.' },
  { icon: Heart, title: 'Employee Welfare', desc: 'Competitive wages, timely salary payments, advance facilities, and safe working conditions for our entire workforce. We invest in workforce development and provide comprehensive support systems.' },
  { icon: Award, title: 'Compliance & Governance', desc: 'Full adherence to government regulations, mining licenses, GST compliance, and corporate governance norms. Regular audits ensure complete legal and regulatory compliance across all operations.' },
  { icon: Users, title: 'Community Development', desc: 'Active participation in local community development through employment generation, infrastructure support, and contributing to the economic growth of Jharkhand\'s industrial landscape.' },
  { icon: Building2, title: 'Operational Excellence', desc: 'Continuous improvement in operational efficiency through modern equipment, technology adoption, and process optimization across all business units.' },
];

// --- Section wrapper with scroll reveal ---
const RevealSection = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 24, filter: 'blur(4px)' }}
    whileInView={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
    viewport={{ once: true, amount: 0.15 }}
    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

// --- Particle Canvas ---
const ParticleCanvas = ({ color = 'rgba(234,160,60,0.08)', particleColor = 'rgba(255,255,255,0.15)' }: { color?: string; particleColor?: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    if (!(canvas as any)._particles) {
      const pts: { x: number; y: number; vx: number; vy: number; r: number; phase: number }[] = [];
      const count = Math.min(50, Math.floor((w * h) / 10000));
      for (let i = 0; i < count; i++) {
        pts.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25, vy: (Math.random() - 0.5) * 0.25,
          r: Math.random() * 2 + 0.5, phase: Math.random() * Math.PI * 2,
        });
      }
      (canvas as any)._particles = pts;
    }

    const pts = (canvas as any)._particles as { x: number; y: number; vx: number; vy: number; r: number; phase: number }[];
    const time = performance.now() * 0.001;

    ctx.clearRect(0, 0, w, h);

    const maxDist = 130;
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          ctx.beginPath();
          ctx.moveTo(pts[i].x, pts[i].y);
          ctx.lineTo(pts[j].x, pts[j].y);
          ctx.strokeStyle = color.replace('0.08', String(0.06 * (1 - dist / maxDist)));
          ctx.lineWidth = 0.6;
          ctx.stroke();
        }
      }
    }

    for (const p of pts) {
      const pulse = 0.5 + 0.5 * Math.sin(time * 1.5 + p.phase);
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * (0.8 + pulse * 0.4), 0, Math.PI * 2);
      ctx.fillStyle = particleColor;
      ctx.fill();
      // Soft glow
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r * 3, 0, Math.PI * 2);
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
      grad.addColorStop(0, particleColor.replace('0.15', '0.06'));
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fill();

      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0 || p.x > w) p.vx *= -1;
      if (p.y < 0 || p.y > h) p.vy *= -1;
    }

    animRef.current = requestAnimationFrame(draw);
  }, [color, particleColor]);

  useEffect(() => {
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [draw]);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" style={{ pointerEvents: 'none' }} />;
};

// --- Floating Glow Orbs ---
const GlowOrbs = ({ accent = 'hsla(28,88%,52%,0.15)', secondary = 'hsla(210,60%,40%,0.10)' }) => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none">
    <motion.div
      className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full blur-[180px] -translate-y-1/2 translate-x-1/3"
      style={{ background: `radial-gradient(circle, ${accent} 0%, transparent 70%)` }}
      animate={{ scale: [1, 1.15, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
    />
    <motion.div
      className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full blur-[160px] translate-y-1/3 -translate-x-1/4"
      style={{ background: `radial-gradient(circle, ${secondary} 0%, transparent 70%)` }}
      animate={{ scale: [1, 1.1, 1], opacity: [0.6, 1, 0.6] }}
      transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
    />
    <motion.div
      className="absolute top-1/2 left-1/2 w-[250px] h-[250px] rounded-full blur-[100px] -translate-x-1/2 -translate-y-1/2"
      style={{ background: `radial-gradient(circle, ${accent.replace('0.15', '0.06')} 0%, transparent 60%)` }}
      animate={{ scale: [1, 1.3, 1] }}
      transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
    />
  </div>
);

// --- 1. HERO PAGE ---
const HeroPage = () => (
  <RevealSection>
    <div className="min-h-[85vh] flex flex-col justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
        className="relative overflow-hidden rounded-3xl bg-primary p-8 lg:p-16"
      >
        <ParticleCanvas />
        <GlowOrbs />

        {/* Subtle scan line effect */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <motion.div
            className="absolute left-0 right-0 h-[1px]"
            style={{ background: 'linear-gradient(90deg, transparent 0%, hsla(28,88%,52%,0.15) 50%, transparent 100%)' }}
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          />
        </div>

        <div className="relative z-10">
          <motion.div
            className="flex items-center gap-5 lg:gap-6 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <motion.img
              src={companyLogo}
              alt="Tibrewal Group"
              className="h-18 w-18 lg:h-24 lg:w-24 object-contain rounded-2xl border border-primary-foreground/10"
              animate={{ boxShadow: ['0 0 0px hsla(28,88%,52%,0)', '0 0 30px hsla(28,88%,52%,0.2)', '0 0 0px hsla(28,88%,52%,0)'] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 72, height: 72 }}
            />
            <div>
              <h1 className="text-3xl lg:text-5xl font-extrabold text-primary-foreground tracking-tight leading-none">
                Tibrewal Group
              </h1>
              <motion.p
                className="text-sm lg:text-lg text-primary-foreground/65 mt-2 font-medium"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.6 }}
              >
                A Diversified Industrial Business Group
              </motion.p>
            </div>
          </motion.div>

          <motion.p
            className="text-sm lg:text-base text-primary-foreground/50 max-w-2xl leading-relaxed mb-10"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            From mining and minerals to logistics, petroleum, tyres, and agro-food processing — powering Jharkhand's infrastructure growth since 2014.
          </motion.p>

          {/* Stats with icons */}
          <motion.div
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.6 }}
          >
            {groupStrength.map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.label}
                  className="relative p-4 rounded-xl border border-primary-foreground/8 overflow-hidden"
                  style={{ background: 'rgba(255,255,255,0.03)' }}
                  whileHover={{ scale: 1.03, borderColor: 'hsla(28,88%,52%,0.2)' }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon className="h-4 w-4 text-primary-foreground/25 mb-2" />
                  <div className="text-2xl lg:text-3xl font-extrabold text-primary-foreground tracking-tight tabular-nums">
                    {(stat as any).isText ? String(stat.value) : <><AnimatedNumber value={stat.value as number} />{stat.suffix}</>}
                  </div>
                  <p className="text-[10px] text-primary-foreground/40 font-semibold mt-1 uppercase tracking-[0.15em]">{stat.label}</p>
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      </motion.div>
    </div>
  </RevealSection>
);

// --- 2. TIMELINE ---
const TimelinePage = () => (
  <RevealSection>
    <div className="min-h-[85vh] flex flex-col justify-center rounded-3xl py-16 px-6 lg:px-16 relative overflow-hidden" style={{ background: '#060a12' }}>
      <ParticleCanvas color="rgba(234,136,37,0.04)" particleColor="rgba(234,136,37,0.08)" />
      <GlowOrbs accent="hsla(28,88%,52%,0.08)" secondary="hsla(210,60%,40%,0.06)" />

      <div className="relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full mb-4" style={{ background: 'rgba(234,136,37,0.1)', border: '1px solid rgba(234,136,37,0.15)' }}>
            <Sparkles className="h-3 w-3" style={{ color: 'hsl(28, 88%, 52%)' }} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'hsl(28, 88%, 55%)' }}>Since 2014</span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-extrabold tracking-tight" style={{ color: 'rgba(255,255,255,0.95)' }}>Our Journey</h2>
          <p className="text-sm mt-3 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.4)' }}>A decade of growth, diversification, and relentless pursuit of industrial excellence.</p>
          <div className="w-16 h-1 mx-auto mt-5 rounded-full" style={{ background: 'hsl(28, 88%, 52%)' }} />
        </motion.div>

        <div className="relative max-w-3xl mx-auto w-full">
          {/* Animated vertical line with gradient */}
          <motion.div
            className="absolute left-5 lg:left-1/2 top-0 bottom-0 w-[2px] -translate-x-1/2"
            style={{ background: 'linear-gradient(180deg, transparent 0%, hsla(28,88%,52%,0.3) 20%, hsla(28,88%,52%,0.3) 80%, transparent 100%)' }}
            initial={{ scaleY: 0 }}
            whileInView={{ scaleY: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          />

          {timelineData.map((item, i) => (
            <motion.div
              key={i}
              className={`relative flex items-start mb-12 last:mb-0 ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
              initial={{ opacity: 0, x: i % 2 === 0 ? -30 : 30, y: 10 }}
              whileInView={{ opacity: 1, x: 0, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ delay: i * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Animated dot with pulse ring */}
              <div className="absolute left-5 lg:left-1/2 w-10 h-10 rounded-full -translate-x-1/2 z-10 flex items-center justify-center border-4" style={{ background: '#060a12', borderColor: 'hsl(28, 88%, 52%)' }}>
                <motion.div
                  className="w-3 h-3 rounded-full"
                  style={{ background: 'hsl(28, 88%, 52%)' }}
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                />
                {/* Pulse ring */}
                <motion.div
                  className="absolute w-10 h-10 rounded-full border"
                  style={{ borderColor: 'hsla(28,88%,52%,0.3)' }}
                  animate={{ scale: [1, 1.8], opacity: [0.4, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: i * 0.3 }}
                />
              </div>

              <div className={`ml-14 lg:ml-0 lg:w-[43%] ${i % 2 === 0 ? 'lg:pr-14 lg:text-right' : 'lg:pl-14 lg:ml-auto'}`}>
                <motion.div
                  className="rounded-2xl p-5 border"
                  style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(255,255,255,0.06)' }}
                  whileHover={{ borderColor: 'hsla(28,88%,52%,0.2)', background: 'rgba(255,255,255,0.04)' }}
                  transition={{ duration: 0.25 }}
                >
                  <span className="inline-block text-[10px] font-bold tracking-[0.2em] uppercase px-3 py-1 rounded-full mb-3" style={{ background: 'rgba(234,136,37,0.12)', color: 'hsl(28, 88%, 55%)' }}>{item.year}</span>
                  <h3 className="text-base lg:text-lg font-bold mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>{item.title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.4)' }}>{item.desc}</p>
                </motion.div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  </RevealSection>
);

// --- 3. COMPANY PAGES ---
const CompanyPage = ({ company, index }: { company: typeof companies[0]; index: number }) => (
  <RevealSection>
    <div className="min-h-[85vh] flex flex-col justify-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold text-accent uppercase tracking-[0.2em] px-2.5 py-1 rounded-full bg-accent/10 border border-accent/10">
            <Building2 className="h-3 w-3" />
            Unit {index + 1}/{companies.length}
          </span>
          <span className="text-xs text-muted-foreground font-medium">Est. {company.year}</span>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="border border-border/50 overflow-hidden shadow-lg">
          <CardContent className="p-0">
            {/* Header band with particle effect */}
            <div className="relative bg-primary p-8 lg:p-12 overflow-hidden">
              <div className="absolute inset-0 pointer-events-none">
                <motion.div
                  className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"
                  style={{ background: `radial-gradient(circle, ${company.color} 0%, transparent 70%)` }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                />
              </div>
              <div className="relative z-10">
                <motion.span
                  className="text-5xl lg:text-6xl mb-4 block"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {company.icon}
                </motion.span>
                <h2 className="text-2xl lg:text-3xl font-extrabold text-primary-foreground tracking-tight mb-2">
                  {company.title}
                </h2>
                <p className="text-sm lg:text-base text-primary-foreground/55 font-medium">{company.desc}</p>
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
                    className="flex items-center gap-3 p-3.5 rounded-xl bg-muted/40 border border-border/30"
                    initial={{ opacity: 0, x: -10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.08, duration: 0.35 }}
                    whileHover={{ scale: 1.02, borderColor: 'hsl(var(--accent))' }}
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
  </RevealSection>
);

// --- 4. FOUNDER PAGE ---
const FounderPage = () => (
  <RevealSection>
    <div className="min-h-[85vh] flex flex-col justify-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Award className="h-4 w-4 text-accent" />
          <p className="text-xs font-bold text-accent uppercase tracking-[0.2em]">Founder & Director</p>
        </div>
        <h2 className="text-2xl lg:text-4xl font-extrabold text-foreground tracking-tight mb-8">Sunil Tibrewal</h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="border border-border/50 overflow-hidden shadow-lg">
          <CardContent className="p-0">
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-2/5 relative overflow-hidden bg-primary/5">
                <motion.img
                  src={founderPhoto}
                  alt="Sunil Tibrewal"
                  className="w-full h-64 lg:h-full object-cover object-top"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.4 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-background/10" />
              </div>

              <div className="lg:w-3/5 p-8 lg:p-12 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-bold tracking-wider uppercase w-fit mb-6 border border-accent/15">
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
  </RevealSection>
);

// --- 5. PROPRIETOR PAGE 1 ---
const ProprietorPage1 = () => (
  <RevealSection>
    <div className="min-h-[85vh] flex flex-col justify-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap className="h-4 w-4 text-accent" />
          <p className="text-xs font-bold text-accent uppercase tracking-[0.2em]">Proprietor & Managing Director</p>
        </div>
        <h2 className="text-2xl lg:text-4xl font-extrabold text-foreground tracking-tight mb-8">Trishav Tibrewal</h2>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <Card className="border border-border/50 overflow-hidden shadow-lg">
          <CardContent className="p-0">
            <div className="flex flex-col lg:flex-row">
              <div className="lg:w-2/5 relative overflow-hidden bg-primary/5">
                <motion.img
                  src={proprietorPhoto}
                  alt="Trishav Tibrewal"
                  className="w-full h-64 lg:h-full object-cover object-top"
                  whileHover={{ scale: 1.03 }}
                  transition={{ duration: 0.4 }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-background/10" />
              </div>

              <div className="lg:w-3/5 p-8 lg:p-12 flex flex-col justify-center">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent text-xs font-bold tracking-wider uppercase w-fit mb-6 border border-accent/15">
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
                  Under his leadership, the group has rapidly expanded from traditional mining and transportation into new verticals including automotive solutions, tyre distribution, agro-food processing, and strategic investments.
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
  </RevealSection>
);

// --- 6. PROPRIETOR PAGE 2 ---
const ProprietorPage2 = () => (
  <RevealSection>
    <div className="min-h-[85vh] flex flex-col justify-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-accent" />
          <p className="text-xs font-bold text-accent uppercase tracking-[0.2em]">Vision & Leadership</p>
        </div>
        <h2 className="text-2xl lg:text-4xl font-extrabold text-foreground tracking-tight mb-8">Driving the Future</h2>
      </motion.div>

      <div className="space-y-6">
        {/* Vision Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <Card className="border border-border/50 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: 'linear-gradient(90deg, transparent 0%, hsl(var(--accent)) 50%, transparent 100%)' }} />
            <CardContent className="p-8 lg:p-12">
              <div className="flex items-center gap-4 mb-6">
                <motion.img
                  src={proprietorPhoto}
                  alt="Trishav Tibrewal"
                  className="w-14 h-14 rounded-full object-cover border-2 border-accent"
                  animate={{ boxShadow: ['0 0 0px hsla(28,88%,52%,0)', '0 0 20px hsla(28,88%,52%,0.25)', '0 0 0px hsla(28,88%,52%,0)'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                />
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
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25, duration: 0.5 }}
        >
          <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">Key Achievements Under His Leadership</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: TrendingUp, title: 'Multiple Business Verticals', desc: 'Expanded the group into diverse business units across multiple sectors' },
              { icon: Truck, title: 'Ample Fleet', desc: 'Built a robust transportation fleet of heavy trucks for industrial logistics' },
              { icon: Users, title: 'Strong Workforce', desc: 'Created large-scale employment across all operational verticals' },
              { icon: Building2, title: 'Corporate Structure', desc: 'Transformed family business into professionally managed corporate entities' },
            ].map((item, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.02, y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border border-border/50 h-full shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="p-2.5 rounded-xl bg-primary/10 w-fit mb-3">
                      <item.icon className="h-5 w-5 text-primary" />
                    </div>
                    <h4 className="text-sm font-bold text-foreground mb-1">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  </RevealSection>
);

// --- 7. POLICIES ---
const PoliciesPage = () => (
  <RevealSection>
    <div className="min-h-[85vh] flex flex-col justify-center">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Shield className="h-4 w-4 text-accent" />
          <p className="text-xs font-bold text-accent uppercase tracking-[0.2em]">Corporate Standards</p>
        </div>
        <h2 className="text-2xl lg:text-4xl font-extrabold text-foreground tracking-tight mb-2">Group Policies</h2>
        <p className="text-sm text-muted-foreground mb-10 max-w-xl">
          Our policies reflect our commitment to safety, quality, compliance, and the welfare of every stakeholder.
        </p>
      </motion.div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {policies.map((policy, i) => {
          const Icon = policy.icon;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.45 }}
              whileHover={{ scale: 1.02, y: -2 }}
            >
              <Card className="border border-border/50 h-full shadow-sm hover:shadow-md transition-shadow">
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
  </RevealSection>
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
      <HeroPage />
      <TimelinePage />
      {companies.map((company, i) => (
        <CompanyPage key={i} company={company} index={i} />
      ))}
      <FounderPage />
      <ProprietorPage1 />
      <ProprietorPage2 />
      <PoliciesPage />

      {/* Footer */}
      <RevealSection>
        <div className="text-center pt-8 pb-4">
          <motion.img
            src={companyLogo}
            alt="Tibrewal Group"
            className="h-10 w-10 object-contain mx-auto mb-3 opacity-30"
          />
          <p className="text-xs text-muted-foreground/50 font-medium">Tibrewal Group</p>
          <p className="text-[11px] text-muted-foreground/30 mt-1">Mining & Minerals · Petroleum · Tyres · Agro · Ventures</p>
          <p className="text-[11px] text-muted-foreground/20 mt-1">Jharkhand, India</p>
        </div>
      </RevealSection>
    </div>
  );
};

export default CorporateDashboard;
