import { useState } from 'react';
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

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const success = await login(username, password);
    
    if (success) {
      toast({
        title: 'Welcome!',
        description: 'You have successfully logged in.',
      });
      navigate('/dashboard');
    } else {
      toast({
        title: 'Login Failed',
        description: 'Invalid username or password.',
        variant: 'destructive',
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex relative">
      {/* Full-screen background */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImg})` }}
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(11,31,51,0.92) 0%, rgba(11,31,51,0.85) 50%, rgba(11,31,51,0.95) 100%)' }} />

      {/* Left Side - Company Info (Desktop) */}
      <div className="hidden lg:flex lg:w-1/2 relative z-10 p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-4 mb-10">
            <img src={companyLogo} alt="T&T" className="h-14 w-14 object-contain rounded-xl" />
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Tibrewal & Tibrewal</h1>
              <p className="text-white/50 text-sm font-medium">Private Limited</p>
            </div>
          </div>
          
          <div className="space-y-6 mt-12">
            <h2 className="text-4xl font-extrabold text-white leading-tight tracking-tight">
              Enterprise Resource<br />Management System
            </h2>
            <div className="w-16 h-1 rounded-full" style={{ background: '#f97316' }} />
            <p className="text-white/50 text-lg font-medium">
              Mining · Logistics · Petroleum · Tyres
            </p>
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
        <Card className="w-full max-w-md border-border/30 bg-card/80 backdrop-blur-xl shadow-2xl">
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-4">
              <img src={companyLogo} alt="T&T" className="h-14 w-14 object-contain rounded-xl" />
            </div>
            <CardTitle className="text-xl font-bold">Admin Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="username"
                    type="text"
                    placeholder="Enter your username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>

            <p className="text-center text-[11px] text-muted-foreground/50 mt-6">
              Tibrewal & Tibrewal Pvt. Ltd. · Jharkhand
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
