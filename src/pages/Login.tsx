import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Lock, User, MapPin, Phone, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Company Info */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 mb-8">
            <Building2 className="h-10 w-10 text-primary-foreground" />
            <div>
              <h1 className="text-2xl font-bold text-primary-foreground">Tibrewal & Tibrewal</h1>
              <p className="text-primary-foreground/80 text-sm">Private Limited</p>
            </div>
          </div>
          
          <div className="space-y-6 mt-12">
            <h2 className="text-3xl font-bold text-primary-foreground leading-tight">
              Staff Management<br />& Payroll System
            </h2>
            <p className="text-primary-foreground/80 text-lg">
              Mining & Construction Excellence in Jharkhand
            </p>
          </div>
        </div>

        <div className="space-y-4 text-primary-foreground/90">
          <div className="flex items-center gap-3">
            <MapPin className="h-5 w-5" />
            <span className="text-sm">Tibrewal Tyres, Gunia Mahagama, Jharkhand 814154</span>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-5 w-5" />
            <span className="text-sm">+91 9386469006</span>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-5 w-5" />
            <span className="text-sm">IshantTibrewal12@gmail.com</span>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4 lg:hidden">
              <Building2 className="h-12 w-12 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Admin Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the dashboard
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
