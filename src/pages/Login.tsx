import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Lock, User, MapPin, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import companyLogo from '@/assets/company-logo.png';
import heroImg from '@/assets/hero-mining-operations.jpg';
import gsap from 'gsap';
import { useMagneticGroup, useSplitTextReveal } from '@/lib/motion/gsapUtils';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const rootRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  useMagneticGroup(rootRef, '[data-magnetic]', 0.4);
  useSplitTextReveal(headingRef, { type: 'chars', stagger: 0.025, skew: 8, duration: 1.0 });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      // Cinematic curtain reveal
      gsap.fromTo('.login-curtain',
        { yPercent: 0 },
        { yPercent: -100, duration: 1.2, ease: 'expo.inOut', delay: 0.05 });

      // Ken Burns slow zoom on bg
      gsap.fromTo(
        '.login-bg',
        { scale: 1.18, xPercent: -2 },
        { scale: 1.28, xPercent: 2, duration: 22, ease: 'sine.inOut', repeat: -1, yoyo: true },
      );

      // Floating ambient particles
      gsap.utils.toArray<HTMLElement>('.login-particle').forEach((p, i) => {
        gsap.to(p, {
          y: gsap.utils.random(-40, 40),
          x: gsap.utils.random(-30, 30),
          opacity: gsap.utils.random(0.15, 0.55),
          duration: gsap.utils.random(4, 8),
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
          delay: i * 0.2,
        });
      });

      // Mouse parallax on bg + card
      const xToBg = gsap.quickTo('.login-bg', 'x', { duration: 1.2, ease: 'power3.out' });
      const yToBg = gsap.quickTo('.login-bg', 'y', { duration: 1.2, ease: 'power3.out' });
      const xToCard = gsap.quickTo('.login-card', 'x', { duration: 0.8, ease: 'power3.out' });
      const yToCard = gsap.quickTo('.login-card', 'y', { duration: 0.8, ease: 'power3.out' });
      const onMove = (e: MouseEvent) => {
        const cx = (e.clientX / window.innerWidth - 0.5);
        const cy = (e.clientY / window.innerHeight - 0.5);
        xToBg(cx * -30); yToBg(cy * -30);
        xToCard(cx * 12); yToCard(cy * 12);
      };
      window.addEventListener('mousemove', onMove);
      (root as any)._loginCleanup = () => window.removeEventListener('mousemove', onMove);

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.6 });
      tl.from('.login-card', { opacity: 0, y: 32, scale: 0.94, filter: 'blur(8px)', duration: 0.9 })
        .from('.login-side > *', { opacity: 0, x: -24, duration: 0.7, stagger: 0.08 }, 0.1)
        .from('.login-field', { opacity: 0, y: 14, duration: 0.5, stagger: 0.08 }, 0.4)
        .from('.login-submit', { opacity: 0, y: 10, duration: 0.45 }, 0.7);
    }, root);

    return () => {
      try { (rootRef.current as any)?._loginCleanup?.(); } catch { /* noop */ }
      ctx.revert();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(username, password);

    if (success) {
      toast({ title: 'Welcome!', description: 'You have successfully logged in.' });
      navigate('/dashboard');
    } else {
      toast({ title: 'Login Failed', description: 'Invalid username or password.', variant: 'destructive' });
    }
    setIsLoading(false);
  };

  return (
    <div ref={rootRef} className="min-h-screen flex relative overflow-hidden">
      {/* Full-screen background with Ken Burns */}
      <div
        className="login-bg absolute inset-0 bg-cover bg-center bg-no-repeat will-change-transform"
        style={{ backgroundImage: `url(${heroImg})` }}
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(11,31,51,0.92) 0%, rgba(11,31,51,0.85) 50%, rgba(11,31,51,0.95) 100%)' }} />

      {/* Floating ambient particles */}
      <div aria-hidden className="absolute inset-0 z-[5] pointer-events-none">
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className="login-particle absolute rounded-full"
            style={{
              left: `${(i * 73) % 100}%`,
              top: `${(i * 41) % 100}%`,
              width: `${4 + (i % 4) * 2}px`,
              height: `${4 + (i % 4) * 2}px`,
              background: 'radial-gradient(circle, rgba(249,115,22,0.55), rgba(249,115,22,0) 70%)',
              opacity: 0.3,
            }}
          />
        ))}
      </div>

      {/* Cinematic curtain (slides up on mount) */}
      <div aria-hidden className="login-curtain absolute inset-0 z-[60] bg-[#0b1f33]" />

      {/* Left Side - Company Info (Desktop) */}
      <div className="login-side hidden lg:flex lg:w-1/2 relative z-10 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-4 mb-10">
            <img src={companyLogo} alt="T&T" className="h-14 w-14 object-contain rounded-xl" />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Tibrewal Group</h1>
              <p className="text-white/50 text-sm font-medium">Industrial Business Group</p>
            </div>
          </div>

          <div className="space-y-6 mt-12">
            <h2 ref={headingRef} className="text-4xl font-extrabold text-white leading-tight tracking-tight">
              Enterprise Resource Management System
            </h2>
            <div className="w-16 h-1 rounded-full" style={{ background: '#f97316' }} />
            <p className="text-white/50 text-lg font-medium">Mining · Logistics · Petroleum · Tyres</p>
          </div>
        </div>

        <div className="space-y-3 text-white/40">
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4" />
            <span className="text-sm">Gunia Mahagama, Jharkhand 814154</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4" />
            <span className="text-sm">+91 9386469006</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 relative z-10">
        <Card className="login-card w-full max-w-md border-border/30 bg-card/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <img src={companyLogo} alt="T&T" className="h-14 w-14 object-contain rounded-xl" />
            </div>
            <CardTitle className="text-xl font-bold">Admin Login</CardTitle>
            <CardDescription>Enter your credentials to access the dashboard</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="login-field space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="username" type="text" placeholder="Enter your username"
                    value={username} onChange={(e) => setUsername(e.target.value)}
                    className="pl-10" required />
                </div>
              </div>

              <div className="login-field space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="Enter your password"
                    value={password} onChange={(e) => setPassword(e.target.value)}
                    className="pl-10" required />
                </div>
              </div>

              <span data-magnetic className="login-submit block">
                <Button type="submit" className="w-full glow-pulse-amber shine-on-hover" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Login'}
                </Button>
              </span>
            </form>

            <p className="text-center text-[11px] text-muted-foreground/50 mt-6">Tibrewal Group · Jharkhand</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
