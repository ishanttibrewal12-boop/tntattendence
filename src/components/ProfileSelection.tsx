import { useState } from 'react';
import { User, Lock, Eye, EyeOff, MoreVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAppAuth } from '@/contexts/AppAuthContext';
import { useToast } from '@/hooks/use-toast';
import { LandingThemeProvider, useLandingTheme } from '@/components/landing/LandingThemeContext';
import ThemeToggle from '@/components/landing/ThemeToggle';
import HeroSection from '@/components/landing/HeroSection';
import ImageGallery from '@/components/landing/ImageGallery';
import WhyChooseUs from '@/components/landing/WhyChooseUs';
import StatsStrip from '@/components/landing/StatsStrip';
import CompanySection from '@/components/landing/CompanySection';
import Timeline from '@/components/landing/Timeline';
import PhotoGallery from '@/components/landing/PhotoGallery';
import CTABanner from '@/components/landing/CTABanner';
import BoardOfGovernors from '@/components/landing/BoardOfGovernors';
import LeadershipSection from '@/components/landing/LeadershipSection';
import WhatsAppButton from '@/components/landing/WhatsAppButton';

const LandingContent = () => {
  const [showLogin, setShowLogin] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAppAuth();
  const { toast } = useToast();
  const { colors } = useLandingTheme();

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

  return (
    <div className="min-h-screen" style={{ background: colors.pageBg, transition: 'background 0.6s cubic-bezier(0.4,0,0.2,1), color 0.6s cubic-bezier(0.4,0,0.2,1)' }}>
      <ThemeToggle />

      {/* Top-right 3-dot menu */}
      <div className="fixed top-4 right-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full" style={{ background: 'rgba(0,0,0,0.3)', color: 'white' }}>
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

      <HeroSection />
      <ImageGallery />
      <WhyChooseUs />
      <StatsStrip />
      <CompanySection />
      <Timeline />
      <PhotoGallery />
      <CTABanner />
      <BoardOfGovernors />
      <LeadershipSection />
      <WhatsAppButton />

      {/* Login Dialog */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent className="sm:max-w-md border-0" style={{ background: '#0F2A44' }}>
          <DialogHeader>
            <DialogTitle style={{ color: 'white' }} className="text-lg">Management Login</DialogTitle>
          </DialogHeader>
          <div className="h-0.5 rounded-full my-2" style={{ background: 'linear-gradient(90deg, transparent, #f97316, transparent)' }} />
          <form onSubmit={handleLogin} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="username" style={{ color: 'rgba(255,255,255,0.7)' }}>Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                <Input id="username" type="text" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 border-white/20" style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }} autoComplete="username" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" style={{ color: 'rgba(255,255,255,0.7)' }}>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 border-white/20" style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }} autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full font-semibold" disabled={isLoading} style={{ background: '#f97316', color: 'white' }}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const ProfileSelection = () => (
  <LandingThemeProvider>
    <LandingContent />
  </LandingThemeProvider>
);

export default ProfileSelection;
