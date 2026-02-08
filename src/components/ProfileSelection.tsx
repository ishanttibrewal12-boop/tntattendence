import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { User, Truck, Fuel, Mountain, Crown, Lock, Eye, EyeOff } from 'lucide-react';
import { useAppAuth } from '@/contexts/AppAuthContext';
import { useToast } from '@/hooks/use-toast';
import companyLogo from '@/assets/company-logo.png';

interface Profile {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: typeof User;
  color: string;
  bgColor: string;
}

const profiles: Profile[] = [
  {
    id: 'manager',
    name: 'Abhay Jalan',
    role: 'Manager',
    description: 'Full Access',
    icon: Crown,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
  },
  {
    id: 'mlt',
    name: 'Rishab',
    role: 'MLT Admin',
    description: 'Driver & Khalasi',
    icon: Truck,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
  },
  {
    id: 'petroleum',
    name: 'Santosh',
    role: 'Petroleum Admin',
    description: 'Petroleum Staff',
    icon: Fuel,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100',
  },
  {
    id: 'crusher',
    name: 'Ambuj',
    role: 'Crusher Admin',
    description: 'Crusher Staff',
    icon: Mountain,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
  },
];

const ProfileSelection = () => {
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAppAuth();
  const { toast } = useToast();

  const handleProfileClick = (profile: Profile) => {
    setSelectedProfile(profile);
    setUsername('');
    setPassword('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({
        title: 'Error',
        description: 'Please enter username and password',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    const result = await login(username, password);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Welcome!',
        description: `Logged in as ${selectedProfile?.name}`,
      });
      setSelectedProfile(null);
    } else {
      toast({
        title: 'Login Failed',
        description: result.error || 'Invalid credentials',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 p-4">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8 pt-8">
          <img 
            src={companyLogo} 
            alt="Tibrewal Staff Manager" 
            className="h-24 w-24 mx-auto mb-4 object-contain drop-shadow-lg" 
          />
          <h1 className="text-2xl font-bold text-foreground">Tibrewal Staff Manager</h1>
          <p className="text-muted-foreground text-sm mt-1">Select your profile to continue</p>
        </div>

        {/* Profile Cards */}
        <div className="grid grid-cols-2 gap-4">
          {profiles.map((profile) => {
            const Icon = profile.icon;
            return (
              <Card
                key={profile.id}
                className="cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] border-2 hover:border-primary/30"
                onClick={() => handleProfileClick(profile)}
              >
                <CardContent className="p-5 text-center">
                  <div className={`w-16 h-16 mx-auto rounded-full ${profile.bgColor} flex items-center justify-center mb-3`}>
                    <Icon className={`h-8 w-8 ${profile.color}`} />
                  </div>
                  <h3 className="font-semibold text-foreground text-base">{profile.name}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{profile.role}</p>
                  <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-xs ${profile.bgColor} ${profile.color}`}>
                    {profile.description}
                  </span>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-10 text-center text-xs text-muted-foreground">
          <p>Tibrewal & Tibrewal Pvt. Ltd.</p>
          <p>Mining & Construction • Jharkhand</p>
          <p className="mt-1">Contact: 6203229118</p>
        </div>
      </div>

      {/* Login Dialog */}
      <Dialog open={!!selectedProfile} onOpenChange={() => setSelectedProfile(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              {selectedProfile && (
                <>
                  <div className={`p-2 rounded-full ${selectedProfile.bgColor}`}>
                    <selectedProfile.icon className={`h-5 w-5 ${selectedProfile.color}`} />
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
                <Input
                  id="username"
                  type="text"
                  placeholder="Enter username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10"
                  autoComplete="username"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-10"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
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
    </div>
  );
};

export default ProfileSelection;
