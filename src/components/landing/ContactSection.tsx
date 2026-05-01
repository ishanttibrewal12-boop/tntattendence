import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Phone, Mail, MapPin, Send, Clock } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

gsap.registerPlugin(ScrollTrigger);

const ContactSection = () => {
  const sectionRef = useRef<HTMLElement>(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return;

    const ctx = gsap.context(() => {
      gsap.from('.contact-head > *', {
        opacity: 0, y: 14, duration: 0.6, ease: 'power2.out', stagger: 0.08,
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });
      gsap.from('.contact-info-card', {
        opacity: 0, y: 14, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: '.contact-info-card', start: 'top 88%' },
      });
      gsap.from('.contact-form-card', {
        opacity: 0, y: 14, duration: 0.6, ease: 'power2.out', delay: 0.08,
        scrollTrigger: { trigger: '.contact-form-card', start: 'top 88%' },
      });
    }, section);

    return () => ctx.revert();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    const trimmedMessage = message.trim();
    if (!trimmedName || !trimmedMessage) return;

    const whatsappText = encodeURIComponent(
      `Hello, I'm ${trimmedName}${email.trim() ? ` (${email.trim()})` : ''}.\n\n${trimmedMessage}`
    );
    window.open(`https://wa.me/919386469006?text=${whatsappText}`, '_blank');
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setName('');
      setEmail('');
      setMessage('');
    }, 3000);
  };

  const contactInfo = [
    { icon: Phone, value: '9006767633', sub: 'Director — Sunil Tibrewal', href: 'tel:9006767633' },
    { icon: Phone, value: '9386469006', sub: 'Proprietor — Trishav Tibrewal', href: 'tel:9386469006' },
    { icon: Mail, value: 'trishavkumar992@gmail.com', sub: 'Business Enquiries', href: 'mailto:trishavkumar992@gmail.com' },
    { icon: MapPin, value: 'Mahagama, Godda, Jharkhand', sub: 'Tibrewal Tyres — Registered Office', href: 'https://www.google.com/maps/search/Mahagama+Godda+Jharkhand' },
    { icon: Clock, value: 'Mon – Sat, 9 AM – 6 PM', sub: 'Indian Standard Time', href: undefined },
  ];

  return (
    <section ref={sectionRef} id="contact" className="py-24 md:py-32 bg-background">
      <div className="max-w-6xl mx-auto px-6">
        <div className="contact-head text-center mb-14">
          <p className="text-[11px] font-medium tracking-[0.14em] uppercase text-muted-foreground mb-4">Get in Touch</p>
          <h2 className="font-display text-[clamp(1.9rem,4.4vw,3rem)] font-semibold leading-[1.08] tracking-[-0.024em] text-foreground">
            Contact us.
          </h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
          {/* Contact Info */}
          <div className="contact-info-card space-y-3">
            <h3 className="text-lg font-semibold tracking-[-0.012em] text-foreground mb-4">Reach out to us</h3>
            {contactInfo.map((item, i) => {
              const Icon = item.icon;
              const content = (
                <div className="flex items-start gap-4 p-4 rounded-xl border border-border bg-card hover:border-foreground/20 transition-colors">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 bg-muted">
                    <Icon className="h-4 w-4 text-foreground" />
                  </div>
                  <div>
                    <p className="text-[14px] font-medium text-foreground">{item.value}</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">{item.sub}</p>
                  </div>
                </div>
              );
              return item.href ? (
                <a key={i} href={item.href} className="block">{content}</a>
              ) : (
                <div key={i}>{content}</div>
              );
            })}

            <div className="rounded-xl overflow-hidden border border-border mt-4">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14500!2d87.3133!3d25.0217!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f0e4a1c5555555%3A0x1234567890abcdef!2sMahagama%2C%20Jharkhand!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%"
                height="200"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Tibrewal Group Location"
              />
            </div>
          </div>

          {/* Contact Form */}
          <div className="contact-form-card rounded-2xl border border-border bg-card p-7 md:p-8">
            <h3 className="text-lg font-semibold tracking-[-0.012em] text-foreground mb-1">Send us a message</h3>
            <p className="text-[13px] text-muted-foreground mb-6">We'll get back to you as soon as possible.</p>

            {submitted ? (
              <div className="text-center py-12">
                <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center bg-muted border border-border">
                  <Send className="h-5 w-5 text-foreground" />
                </div>
                <p className="text-base font-semibold text-foreground">Message sent</p>
                <p className="text-[13px] text-muted-foreground mt-1">Redirecting to WhatsApp…</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-1.5 block">
                    Your Name *
                  </label>
                  <Input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={100}
                    placeholder="Enter your full name"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-1.5 block">
                    Email (optional)
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={255}
                    placeholder="your@email.com"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-1.5 block">
                    Message *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    maxLength={1000}
                    rows={5}
                    placeholder="Tell us about your requirements…"
                    className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background transition-colors resize-none"
                  />
                </div>
                <Button type="submit" className="w-full" size="lg">
                  <Send className="h-4 w-4" />
                  Send via WhatsApp
                </Button>
                <p className="text-[11px] text-muted-foreground text-center">
                  Your message will be sent via WhatsApp for faster response.
                </p>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
