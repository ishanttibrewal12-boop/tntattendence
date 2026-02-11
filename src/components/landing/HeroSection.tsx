import { useState } from 'react';
import { Crown, Truck, Fuel, Mountain, User, Lock, Eye, EyeOff } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAppAuth } from '@/contexts/AppAuthContext';
import { useToast } from '@/hooks/use-toast';
import companyLogo from '@/assets/company-logo.png';
import heroImg from '@/assets/gallery-petroleum-1.jpeg';

interface Profile {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: typeof User;
}

const profiles: Profile[] = [
  { id: 'manager', name: 'Abhay Jalan', role: 'Manager', description: 'Full Access', icon: Crown },
  { id: 'mlt', name: 'Rishab', role: 'MLT Admin', description: 'Driver & Khalasi', icon: Truck },
  { id: 'petroleum', name: 'Santosh', role: 'Petroleum Admin', description: 'Petroleum Staff', icon: Fuel },
  { id: 'crusher', name: 'Ambuj', role: 'Crusher Admin', description: 'Crusher Staff', icon: Mountain },
];

const HeroSection = () => {
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
    <>
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImg})` }}
        />
        {/* Dark blue gradient overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.92) 0%, rgba(30,58,138,0.88) 50%, rgba(15,23,42,0.95) 100%)' }} />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-16 text-center">
          {/* Logo & Title */}
          <img src={companyLogo} alt="Tibrewal & Tibrewal" className="h-24 w-24 mx-auto mb-6 object-contain drop-shadow-2xl" />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-3" style={{ color: 'white' }}>
            Tibrewal & Tibrewal Pvt. Ltd.
          </h1>
          <p className="text-lg md:text-xl mb-2 font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Mining • Stone Crushing • Transportation • Petroleum • Tyres
          </p>
          <p className="text-sm mb-12" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Established 2021 • Jharkhand, India
          </p>

          {/* Profile Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 max-w-3xl mx-auto">
            {profiles.map((profile) => {
              const Icon = profile.icon;
              return (
                <div
                  key={profile.id}
                  onClick={() => { setSelectedProfile(profile); setUsername(''); setPassword(''); }}
                  className="group cursor-pointer rounded-2xl p-5 md:p-6 text-center transition-all duration-300 hover:scale-105 active:scale-95 border border-white/10 hover:border-white/30"
                  style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)' }}
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 mx-auto rounded-full flex items-center justify-center mb-3 transition-colors duration-300"
                    style={{ background: 'rgba(255,255,255,0.12)' }}>
                    <Icon className="h-7 w-7 md:h-8 md:w-8" style={{ color: 'rgba(255,255,255,0.9)' }} />
                  </div>
                  <h3 className="font-bold text-sm md:text-base" style={{ color: 'white' }}>{profile.name}</h3>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>{profile.role}</p>
                  <span className="inline-block mt-2 px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.7)' }}>
                    {profile.description}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Scroll indicator */}
          <div className="mt-16 animate-bounce">
            <div className="w-6 h-10 mx-auto rounded-full border-2 flex items-start justify-center pt-2" style={{ borderColor: 'rgba(255,255,255,0.3)' }}>
              <div className="w-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.5)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Login Dialog */}
      <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedProfile && (
                <>
                  <div className="p-2 rounded-full bg-primary/10">
                    <selectedProfile.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <span className="block">{selectedProfile.name}</span>
                    <span className="text-xs font-normal text-muted-foreground">{selectedProfile.role}</span>
                  </div>
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="username" type="text" placeholder="Enter username" value={username} onChange={(e) => setUsername(e.target.value)} className="pl-10" autoComplete="username" />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter password" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 pr-10" autoComplete="current-password" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default HeroSection;
