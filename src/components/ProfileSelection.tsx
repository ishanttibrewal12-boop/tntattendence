import { useState } from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAppAuth } from '@/contexts/AppAuthContext';
import { useToast } from '@/hooks/use-toast';
import HeroSection from '@/components/landing/HeroSection';
import ImageGallery from '@/components/landing/ImageGallery';
import CompanySection from '@/components/landing/CompanySection';
import LeadershipSection from '@/components/landing/LeadershipSection';
import { profiles, type Profile } from '@/components/landing/HeroSection';

const ProfileSelection = () => {
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAppAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: 'Error', description: 'Please enter username and password', variant: 'destructive' });
      return;
    }
    setIsLoading(true);
    const result = await login(username, password);
    setIsLoading(false);
    if (result.success) {
      toast({ title: 'Welcome!', description: `Logged in as ${selectedProfile?.name}` });
      setSelectedProfile(null);
    } else {
      toast({ title: 'Login Failed', description: result.error || 'Invalid credentials', variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen">
      {/* 1. Hero */}
      <HeroSection />
      {/* 2. Operations with images */}
      <ImageGallery />
      {/* 3. About Us */}
      <CompanySection />
      {/* 4. Profile Cards */}
      <section className="py-16 md:py-20" style={{ background: '#f4f6f8' }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: '#94a3b8' }}>Administration</p>
            <h2 className="text-2xl md:text-3xl font-extrabold" style={{ color: '#0f172a' }}>Select Profile to Login</h2>
            <div className="w-16 h-1 mx-auto mt-4 rounded-full" style={{ background: '#f97316' }} />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {profiles.map((profile) => {
              const Icon = profile.icon;
              return (
                <div
                  key={profile.id}
                  onClick={() => { setSelectedProfile(profile); setUsername(''); setPassword(''); }}
                  className="group cursor-pointer rounded-2xl p-5 md:p-6 text-center transition-all duration-200 hover:shadow-lg active:scale-95 border"
                  style={{ background: 'white', borderColor: '#e2e8f0' }}
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 mx-auto rounded-full flex items-center justify-center mb-3"
                    style={{ background: '#f1f5f9' }}>
                    <Icon className="h-7 w-7 md:h-8 md:w-8" style={{ color: '#0f172a' }} />
                  </div>
                  <h3 className="font-bold text-sm md:text-base" style={{ color: '#0f172a' }}>{profile.name}</h3>
                  <p className="text-xs mt-1" style={{ color: '#94a3b8' }}>{profile.role}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      {/* 5. Proprietor + Footer */}
      <LeadershipSection />

      {/* Login Dialog */}
      <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <DialogContent className="sm:max-w-md border-0" style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%)' }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3" style={{ color: 'white' }}>
              {selectedProfile && (
                <>
                  <div className="p-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <selectedProfile.icon className="h-5 w-5" style={{ color: 'rgba(255,255,255,0.9)' }} />
                  </div>
                  <div>
                    <span className="block">{selectedProfile.name}</span>
                    <span className="text-xs font-normal" style={{ color: 'rgba(255,255,255,0.5)' }}>{selectedProfile.role}</span>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <div className="h-0.5 rounded-full my-2" style={{ background: 'linear-gradient(90deg, transparent, #f97316, transparent)' }} />
          <form onSubmit={handleLogin} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="username" style={{ color: 'rgba(255,255,255,0.7)' }}>Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                <Input id="username" type="text" placeholder="Enter username"
                  value={username} onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 border-white/20" style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}
                  autoComplete="username" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" style={{ color: 'rgba(255,255,255,0.7)' }}>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter password"
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10 border-white/20" style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}
                  autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full font-semibold" disabled={isLoading}
              style={{ background: '#f97316', color: 'white' }}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProfileSelection;
