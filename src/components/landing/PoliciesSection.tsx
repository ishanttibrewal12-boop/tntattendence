import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Shield, Scale, FileCheck, Globe, Heart, Award, Users, Building2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const policies = [
  { icon: Shield, title: 'Safety First', desc: 'Strict safety protocols across all operations. Zero-tolerance policy for unsafe practices on mining sites, transport, and fuel stations.' },
  { icon: Scale, title: 'Fair Business Practices', desc: 'Transparent and ethical dealings with all partners and stakeholders. Documented and GST compliant transactions.' },
  { icon: FileCheck, title: 'Quality Assurance', desc: 'Every product and service undergoes rigorous quality checks — from aggregate grading to fuel purity.' },
  { icon: Globe, title: 'Environmental Responsibility', desc: 'Committed to sustainable mining with minimal environmental impact, following all government-mandated norms.' },
  { icon: Heart, title: 'Employee Welfare', desc: 'Competitive wages, timely salary payments, advance facilities, and safe working conditions for our entire workforce.' },
  { icon: Award, title: 'Compliance & Governance', desc: 'Full adherence to government regulations, mining licenses, GST compliance, and corporate governance norms.' },
  { icon: Users, title: 'Community Development', desc: 'Active participation in local community development through employment generation and infrastructure support.' },
  { icon: Building2, title: 'Operational Excellence', desc: 'Continuous improvement through modern equipment, technology adoption, and process optimization.' },
];

const PoliciesSection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.policy-card').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0, y: 12, duration: 0.45, ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 92%' },
          delay: (i % 4) * 0.05,
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-24 md:py-32 bg-muted/30">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground mb-4">Corporate Standards</p>
          <h2 className="font-display text-[clamp(1.9rem,4.4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.024em] text-foreground">
            Group policies.
          </h2>
          <p className="mt-4 max-w-xl mx-auto text-base md:text-lg text-muted-foreground">
            Our commitment to safety, quality, compliance, and the welfare of every stakeholder.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {policies.map((policy, i) => {
            const Icon = policy.icon;
            return (
              <div key={i} className="policy-card p-6 rounded-2xl border border-border bg-card hover:border-foreground/20 transition-colors">
                <div className="w-9 h-9 rounded-full flex items-center justify-center mb-4 bg-muted">
                  <Icon className="h-[18px] w-[18px] text-foreground" />
                </div>
                <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-foreground mb-2">{policy.title}</h3>
                <p className="text-[13px] leading-relaxed text-muted-foreground">{policy.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PoliciesSection;
