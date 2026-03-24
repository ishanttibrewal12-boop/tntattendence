import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { Phone, Mail, MapPin, Send, Clock } from 'lucide-react';

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

    const ctx = gsap.context(() => {
      gsap.from('.contact-sub', {
        opacity: 0, y: 20, duration: 0.6, ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });
      gsap.from('.contact-heading', {
        opacity: 0, y: 30, duration: 0.7, delay: 0.1, ease: 'power3.out',
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });
      gsap.from('.contact-line', {
        scaleX: 0, duration: 0.6, delay: 0.2, ease: 'power2.out',
        scrollTrigger: { trigger: section, start: 'top 80%' },
      });
      gsap.from('.contact-info-card', {
        opacity: 0, x: -40, duration: 0.7, delay: 0.2, ease: 'power3.out',
        scrollTrigger: { trigger: '.contact-info-card', start: 'top 88%' },
      });
      gsap.from('.contact-form-card', {
        opacity: 0, x: 40, duration: 0.7, delay: 0.3, ease: 'power3.out',
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
    {
      icon: Phone,
      label: 'Phone',
      value: '9006767633',
      sub: 'Director — Sunil Tibrewal',
      href: 'tel:9006767633',
    },
    {
      icon: Phone,
      label: 'Phone',
      value: '9386469006',
      sub: 'Proprietor — Trishav Tibrewal',
      href: 'tel:9386469006',
    },
    {
      icon: Mail,
      label: 'Email',
      value: 'trishavkumar992@gmail.com',
      sub: 'Business Enquiries',
      href: 'mailto:trishavkumar992@gmail.com',
    },
    {
      icon: MapPin,
      label: 'Address',
      value: 'Mahagama, Godda, Jharkhand',
      sub: 'Tibrewal Tyres — Registered Office',
      href: 'https://www.google.com/maps/search/Mahagama+Godda+Jharkhand',
    },
    {
      icon: Clock,
      label: 'Working Hours',
      value: 'Mon – Sat, 9 AM – 6 PM',
      sub: 'Indian Standard Time',
      href: undefined,
    },
  ];

  return (
    <section ref={sectionRef} id="contact" className="py-24 md:py-36" style={{ background: '#0d1117' }}>
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-16 md:mb-20">
          <p className="contact-sub text-xs font-bold tracking-[0.3em] uppercase mb-4 text-orange-400">
            Get in Touch
          </p>
          <h2 className="contact-heading text-4xl md:text-5xl lg:text-6xl font-extrabold text-white/95">
            Contact Us
          </h2>
          <div className="contact-line w-20 h-1.5 mx-auto mt-6 rounded-full origin-center" style={{ background: 'linear-gradient(90deg, #f97316, #fb923c)' }} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
          {/* Contact Info */}
          <div className="contact-info-card space-y-5">
            <h3 className="text-xl font-bold text-white/90 mb-6">Reach Out to Us</h3>
            {contactInfo.map((item, i) => {
              const Icon = item.icon;
              const content = (
                <div
                  key={i}
                  className="flex items-start gap-4 p-5 rounded-xl border transition-all duration-300 hover:border-orange-500/25"
                  style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.08)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateX(6px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateX(0)';
                  }}
                >
                  <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.08))', border: '1px solid rgba(249,115,22,0.15)' }}>
                    <Icon className="h-5 w-5 text-orange-400" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white/85">{item.value}</p>
                    <p className="text-xs text-white/40 mt-0.5">{item.sub}</p>
                  </div>
                </div>
              );
              return item.href ? (
                <a key={i} href={item.href} className="block">
                  {content}
                </a>
              ) : (
                <div key={i}>{content}</div>
              );
            })}

            {/* Map placeholder */}
            <div className="rounded-xl overflow-hidden border mt-6" style={{ borderColor: 'rgba(255,255,255,0.08)' }}>
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14500!2d87.3133!3d25.0217!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x39f0e4a1c5555555%3A0x1234567890abcdef!2sMahagama%2C%20Jharkhand!5e0!3m2!1sen!2sin!4v1700000000000!5m2!1sen!2sin"
                width="100%"
                height="180"
                style={{ border: 0, filter: 'invert(0.9) hue-rotate(180deg) brightness(0.8) contrast(1.2)' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Tibrewal Group Location"
              />
            </div>
          </div>

          {/* Contact Form */}
          <div className="contact-form-card rounded-2xl border p-8 md:p-10" style={{ background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)', borderColor: 'rgba(255,255,255,0.08)' }}>
            <h3 className="text-xl font-bold text-white/90 mb-2">Send Us a Message</h3>
            <p className="text-sm text-white/40 mb-8">We'll get back to you as soon as possible.</p>

            {submitted ? (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)' }}>
                  <Send className="h-7 w-7 text-green-400" />
                </div>
                <p className="text-lg font-bold text-white/90">Message Sent!</p>
                <p className="text-sm text-white/50 mt-1">Redirecting to WhatsApp...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2 block">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={100}
                    placeholder="Enter your full name"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-300 focus:ring-2 focus:ring-orange-500/30"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2 block">
                    Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    maxLength={255}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-300 focus:ring-2 focus:ring-orange-500/30"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-white/50 mb-2 block">
                    Message *
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                    maxLength={1000}
                    rows={5}
                    placeholder="Tell us about your requirements..."
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none transition-all duration-300 resize-none focus:ring-2 focus:ring-orange-500/30"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}
                  />
                </div>
                <button
                  type="submit"
                  className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-bold text-sm text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
                >
                  <Send className="h-4 w-4" />
                  Send via WhatsApp
                </button>
                <p className="text-[11px] text-white/25 text-center">
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
