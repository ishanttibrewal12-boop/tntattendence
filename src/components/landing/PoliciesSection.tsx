import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Shield, Scale, FileCheck, Globe, Heart, Award, Users, Building2 } from 'lucide-react';

gsap.registerPlugin(ScrollTrigger);

const policies = [
  { icon: Shield, title: 'Safety First', desc: 'All operations follow strict safety protocols. Zero-tolerance policy for unsafe practices across mining sites, transportation, and fuel stations.' },
  { icon: Scale, title: 'Fair Business Practices', desc: 'Transparent and ethical dealings with all partners, vendors, and stakeholders. All transactions are documented and GST compliant.' },
  { icon: FileCheck, title: 'Quality Assurance', desc: 'Every product and service undergoes rigorous quality checks — from aggregate grading to fuel purity. Quality is non-negotiable.' },
  { icon: Globe, title: 'Environmental Responsibility', desc: 'Committed to sustainable mining with minimal environmental impact. We follow all government-mandated environmental norms.' },
  { icon: Heart, title: 'Employee Welfare', desc: 'Competitive wages, timely salary payments, advance facilities, and safe working conditions for our entire workforce.' },
  { icon: Award, title: 'Compliance & Governance', desc: 'Full adherence to government regulations, mining licenses, GST compliance, and corporate governance norms.' },
  { icon: Users, title: 'Community Development', desc: 'Active participation in local community development through employment generation and infrastructure support.' },
  { icon: Building2, title: 'Operational Excellence', desc: 'Continuous improvement through modern equipment, technology adoption, and process optimization across all business units.' },
];

const PoliciesSection = () => {
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const ctx = gsap.context(() => {
      gsap.utils.toArray<HTMLElement>('.policy-card').forEach((el, i) => {
        gsap.from(el, {
          opacity: 0, y: 40, duration: 0.5, ease: 'power3.out',
          scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' },
          delay: i * 0.05,
        });
      });
    }, section);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 md:py-28" style={{ background: '#0d1118' }}>
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-14">
          <p className="text-xs font-bold tracking-[0.25em] uppercase mb-2 text-orange-400">Corporate Standards</p>
          <h2 className="text-3xl md:text-4xl font-extrabold text-white/95">Group Policies</h2>
          <div className="w-16 h-1 mx-auto mt-4 rounded-full bg-orange-500" />
          <p className="mt-4 max-w-xl mx-auto text-sm text-white/50">
            Our policies reflect our commitment to safety, quality, compliance, and the welfare of every stakeholder.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {policies.map((policy, i) => {
            const Icon = policy.icon;
            return (
              <div
                key={i}
                className="policy-card p-5 rounded-xl border border-white/8 transition-all duration-300 hover:border-orange-500/20 hover:-translate-y-1"
                style={{ background: '#161b26' }}
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3 bg-orange-500/10">
                  <Icon className="h-5 w-5 text-orange-400" />
                </div>
                <h3 className="text-sm font-bold text-white/90 mb-2">{policy.title}</h3>
                <p className="text-xs leading-relaxed text-white/45">{policy.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default PoliciesSection;
