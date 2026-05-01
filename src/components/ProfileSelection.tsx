import { useEffect, useState } from 'react';
import { User, Lock, Eye, EyeOff, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAppAuth } from '@/contexts/AppAuthContext';
import { useToast } from '@/hooks/use-toast';
import { LandingThemeProvider, useLandingTheme } from '@/components/landing/LandingThemeContext';
import HeroSection from '@/components/landing/HeroSection';
import StickyNav from '@/components/landing/StickyNav';
import ImageGallery from '@/components/landing/ImageGallery';
import WhyChooseUs from '@/components/landing/WhyChooseUs';
import AnimatedStats from '@/components/landing/AnimatedStats';
import BeforeAfterSlider from '@/components/landing/BeforeAfterSlider';
import CompanySection from '@/components/landing/CompanySection';
import Timeline from '@/components/landing/Timeline';
import CompanyShowcase from '@/components/landing/CompanyShowcase';
import LeadershipShowcase from '@/components/landing/LeadershipShowcase';
import PoliciesSection from '@/components/landing/PoliciesSection';
import PhotoGallery from '@/components/landing/PhotoGallery';
import CTABanner from '@/components/landing/CTABanner';
import TrustedBySection from '@/components/landing/TrustedBySection';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import ContactSection from '@/components/landing/ContactSection';
import WhatsAppButton from '@/components/landing/WhatsAppButton';
import { lazy, Suspense } from 'react';
const AIChatBot = lazy(() => import('@/components/AIChatBot'));

const LandingContent = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAppAuth();
  const { toast } = useToast();
  const { colors } = useLandingTheme();

  useEffect(() => {
    document.body.style.removeProperty('pointer-events');

    if (!showLogin) {
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');
      document.body.removeAttribute('data-scroll-locked');
    }

    return () => {
      document.body.style.removeProperty('pointer-events');
      document.body.style.removeProperty('overflow');
      document.body.style.removeProperty('padding-right');
      document.body.removeAttribute('data-scroll-locked');
    };
  }, [showLogin]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      toast({ title: 'Error', description: 'Please enter username and password', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    try {
      const result = await login(username.trim(), password.trim());
      if (result.success) {
        toast({ title: 'Welcome!', description: 'Login successful' });
        setShowLogin(false);
      } else {
        toast({ title: 'Login Failed', description: result.error || 'Invalid credentials', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({ title: 'Error', description: 'An unexpected error occurred', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* Top-right 3-dot menu */}
      <div className="fixed top-4 right-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full bg-background/70 backdrop-blur border border-border text-foreground hover:bg-background">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[120px]">
            <DropdownMenuItem onClick={() => { setShowLogin(true); setUsername(''); setPassword(''); }}>
              <Lock className="h-4 w-4 mr-2" />
              Login
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <StickyNav />
      <HeroSection />
      <CompanySection />
      <AnimatedStats />
      <ImageGallery />
      <WhyChooseUs />
      <BeforeAfterSlider />
      <Timeline />
      <CompanyShowcase />
      <TrustedBySection />
      <TestimonialsSection />
      <LeadershipShowcase />
      <PhotoGallery />
      <PoliciesSection />
      <CTABanner />
      <ContactSection />

      {/* Footer */}
      <footer className="py-12 bg-muted/30 border-t border-border">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <p className="text-sm font-semibold tracking-[-0.012em] text-foreground mb-1">Tibrewal Group</p>
          <p className="text-[12px] text-muted-foreground mb-3">Mining · Petroleum · Tyres · Agro · Ventures · Tibrewal Mines & Minerals Pvt. Ltd.</p>
          <p className="text-[12px] text-muted-foreground">Jharkhand, India</p>
          <p className="text-[11px] mt-5 text-muted-foreground">© {currentYear} Tibrewal Group. All rights reserved.</p>
        </div>
      </footer>

      <WhatsAppButton />

      {/* Login Dialog */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold tracking-[-0.012em]">Management Login</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4 mt-4">
            <div className="space-y-1.5">
              <Label htmlFor="username" className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="username" type="text" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)}
                  className="pl-10" autoComplete="username" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[12px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading} size="lg">
              {isLoading ? 'Logging in…' : 'Login'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
      <Suspense fallback={null}><AIChatBot includeData={false} /></Suspense>
    </div>
  );
};

const ProfileSelection = () => (
  <LandingThemeProvider>
    <LandingContent />
  </LandingThemeProvider>
);

export default ProfileSelection;
