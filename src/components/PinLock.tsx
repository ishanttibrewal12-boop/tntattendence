import { useState, useEffect } from 'react';
import { Lock, Eye, EyeOff, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ForgotPin from './ForgotPin';

interface PinLockProps {
  onUnlock: () => void;
}

const MAX_PIN_ATTEMPTS = 5;
const PIN_LOCKOUT_DURATION = 5 * 60 * 1000; // 5 minutes

const PinLock = ({ onUnlock }: PinLockProps) => {
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [correctPin, setCorrectPin] = useState('8465');
  const [showForgotPin, setShowForgotPin] = useState(false);

  useEffect(() => {
    const unlocked = sessionStorage.getItem('app_unlocked');
    if (unlocked === 'true') {
      onUnlock();
      return;
    }
    fetchPin();
  }, []);

  const fetchPin = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'app_pin')
      .single();
    
    if (data?.setting_value) {
      setCorrectPin(data.setting_value);
    }
  };

  const handlePinChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 6) {
      setPin(numericValue);
    }
  };

  const handleSubmit = async () => {
    if (pin.length < 4) {
      toast.error('Please enter at least 4 digits');
      return;
    }

    // Rate limiting check
    const attemptKey = 'pin_attempts';
    const lockoutKey = 'pin_lockout';

    const lockoutUntil = sessionStorage.getItem(lockoutKey);
    if (lockoutUntil && Date.now() < parseInt(lockoutUntil)) {
      const remaining = Math.ceil((parseInt(lockoutUntil) - Date.now()) / 60000);
      toast.error(`Too many attempts. Try again in ${remaining} minutes.`);
      return;
    }

    const attempts = parseInt(sessionStorage.getItem(attemptKey) || '0');
    if (attempts >= MAX_PIN_ATTEMPTS) {
      sessionStorage.setItem(lockoutKey, (Date.now() + PIN_LOCKOUT_DURATION).toString());
      sessionStorage.removeItem(attemptKey);
      toast.error('Too many failed attempts. Locked for 5 minutes.');
      return;
    }

    setIsVerifying(true);
    
    // Delay to slow down brute force
    await new Promise(resolve => setTimeout(resolve, 1000));

    if (pin === correctPin) {
      sessionStorage.removeItem(attemptKey);
      sessionStorage.removeItem(lockoutKey);
      sessionStorage.setItem('app_unlocked', 'true');
      toast.success('Access granted');
      onUnlock();
    } else {
      sessionStorage.setItem(attemptKey, (attempts + 1).toString());
      const remaining = MAX_PIN_ATTEMPTS - attempts - 1;
      toast.error(`Incorrect PIN. ${remaining} attempts remaining.`);
      setPin('');
    }

    setIsVerifying(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };

  if (showForgotPin) {
    return (
      <ForgotPin 
        onBack={() => setShowForgotPin(false)} 
        onSuccess={onUnlock}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit mb-2">
            <Lock className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-xl">TNT Staff Manager</CardTitle>
          <p className="text-sm text-muted-foreground">Enter PIN to access</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Input
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={(e) => handlePinChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Enter PIN"
              className="text-center text-2xl tracking-widest pr-12"
              autoFocus
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2"
              onClick={() => setShowPin(!showPin)}
            >
              {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isVerifying || pin.length < 4}
          >
            {isVerifying ? 'Verifying...' : 'Unlock'}
          </Button>
          
          <Button
            variant="link"
            className="w-full text-muted-foreground"
            onClick={() => setShowForgotPin(true)}
          >
            <HelpCircle className="h-4 w-4 mr-1" />
            Forgot PIN?
          </Button>
          
          <p className="text-xs text-center text-muted-foreground">
            Tibrewal & Tibrewal Pvt. Ltd.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PinLock;