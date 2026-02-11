import { useState } from 'react';
import { Crown, Truck, Fuel, Mountain, User, Lock, Eye, EyeOff } from 'lucide-react';
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
  { id: 'petroleum', name: 'Santosh', role: 'Petroleum Admin', description: 'Petroleum Staff', icon: Fuel },
  { id: 'mlt', name: 'Rishab', role: 'MLT Admin', description: 'Driver & Khalasi', icon: Truck },
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
        {/* 75-80% dark blue overlay */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.93) 0%, rgba(30,58,138,0.90) 50%, rgba(15,23,42,0.95) 100%)' }} />

        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-16 text-center">
          {/* Logo & Title */}
          <img 
            src={companyLogo} 
            alt="Tibrewal & Tibrewal" 
            className="h-24 w-24 mx-auto mb-6 object-contain drop-shadow-2xl" 
            width={96} 
            height={96}
            fetchPriority="high"
          />
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-3" style={{ color: 'white' }}>
            Tibrewal & Tibrewal Pvt. Ltd.
          </h1>
          <p className="text-lg md:text-xl mb-2 font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Mining • Stone Crushing • Transportation • Petroleum • Tyres
          </p>
          <p className="text-sm mb-12" style={{ color: 'rgba(255,255,255,0.5)' }}>
            Established 2021 • Jharkhand, India
          </p>

          {/* Scroll indicator */}
          <div className="mt-8 animate-bounce">
            <div className="w-6 h-10 mx-auto rounded-full border-2 flex items-start justify-center pt-2" style={{ borderColor: 'rgba(255,255,255,0.3)' }}>
              <div className="w-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.5)' }} />
            </div>
          </div>
        </div>
      </section>

      {/* Profile Cards Section — separate from hero */}
      <section className="py-16 md:py-20" style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}>
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-10">
            <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: 'rgba(255,255,255,0.4)' }}>ADMINISTRATION</p>
            <h2 className="text-2xl md:text-3xl font-extrabold" style={{ color: 'white' }}>Select Profile to Login</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {profiles.map((profile) => {
              const Icon = profile.icon;
              return (
                <div
                  key={profile.id}
                  onClick={() => { setSelectedProfile(profile); setUsername(''); setPassword(''); }}
                  className="group cursor-pointer rounded-2xl p-5 md:p-6 text-center transition-all duration-300 hover:scale-105 active:scale-95 border border-white/10 hover:border-white/30"
                  style={{ background: 'rgba(255,255,255,0.06)', backdropFilter: 'blur(12px)' }}
                >
                  <div className="w-14 h-14 md:w-16 md:h-16 mx-auto rounded-full flex items-center justify-center mb-3 transition-colors duration-300"
                    style={{ background: 'rgba(255,255,255,0.1)' }}>
                    <Icon className="h-7 w-7 md:h-8 md:w-8" style={{ color: 'rgba(255,255,255,0.85)' }} />
                  </div>
                  <h3 className="font-bold text-sm md:text-base" style={{ color: 'white' }}>{profile.name}</h3>
                  <p className="text-xs mt-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{profile.role}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Login Dialog — Premium Industrial Style */}
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
          {/* Orange divider */}
          <div className="h-0.5 rounded-full my-2" style={{ background: 'linear-gradient(90deg, transparent, #f97316, transparent)' }} />
          <form onSubmit={handleLogin} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label htmlFor="username" style={{ color: 'rgba(255,255,255,0.7)' }}>Username</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                <Input 
                  id="username" type="text" placeholder="Enter username" 
                  value={username} onChange={(e) => setUsername(e.target.value)} 
                  className="pl-10 border-white/20 text-foreground" 
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}
                  autoComplete="username" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" style={{ color: 'rgba(255,255,255,0.7)' }}>Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(255,255,255,0.4)' }} />
                <Input 
                  id="password" type={showPassword ? 'text' : 'password'} placeholder="Enter password" 
                  value={password} onChange={(e) => setPassword(e.target.value)} 
                  className="pl-10 pr-10 border-white/20" 
                  style={{ background: 'rgba(255,255,255,0.08)', color: 'white' }}
                  autoComplete="current-password" 
                />
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
    </>
  );
};

export default HeroSection;
