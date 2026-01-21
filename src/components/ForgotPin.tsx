import { useState } from 'react';
import { ArrowLeft, Phone, KeyRound, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';

interface ForgotPinProps {
  onBack: () => void;
  onSuccess: () => void;
}

const ForgotPin = ({ onBack, onSuccess }: ForgotPinProps) => {
  const [step, setStep] = useState<'phone' | 'otp' | 'success'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  const CORRECT_PHONE = '9386469006';
  const CORRECT_OTP = '8465';

  const handleSendOtp = async () => {
    if (phone !== CORRECT_PHONE) {
      toast.error('Phone number not registered');
      return;
    }

    setIsVerifying(true);
    // Simulate sending OTP
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    toast.success(`OTP sent to ${phone.slice(0, 4)}****${phone.slice(-2)}`);
    setStep('otp');
    setIsVerifying(false);
  };

  const handleVerifyOtp = async () => {
    if (otp !== CORRECT_OTP) {
      toast.error('Incorrect OTP');
      setOtp('');
      return;
    }

    setIsVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Store unlock in session
    sessionStorage.setItem('app_unlocked', 'true');
    toast.success('Verification successful!');
    setStep('success');
    
    setTimeout(() => {
      onSuccess();
    }, 1500);
    
    setIsVerifying(false);
  };

  const handlePhoneChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 10) {
      setPhone(numericValue);
    }
  };

  const handleOtpChange = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    if (numericValue.length <= 4) {
      setOtp(numericValue);
    }
  };

  if (step === 'success') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-sm text-center">
          <CardContent className="pt-8 pb-6">
            <div className="mx-auto p-4 rounded-full bg-green-500/10 w-fit mb-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Access Granted</h2>
            <p className="text-muted-foreground">Redirecting...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute left-4 top-4"
            onClick={onBack}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          
          <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit mb-2">
            {step === 'phone' ? (
              <Phone className="h-8 w-8 text-primary" />
            ) : (
              <KeyRound className="h-8 w-8 text-primary" />
            )}
          </div>
          
          <CardTitle className="text-xl">
            {step === 'phone' ? 'Forgot PIN?' : 'Enter OTP'}
          </CardTitle>
          <CardDescription>
            {step === 'phone' 
              ? 'Enter your registered phone number' 
              : 'Enter the 4-digit OTP sent to your phone'}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {step === 'phone' && (
            <>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">+91</span>
                <Input
                  type="tel"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="Phone number"
                  className="pl-12 text-lg"
                  autoFocus
                />
              </div>
              <Button
                className="w-full"
                onClick={handleSendOtp}
                disabled={isVerifying || phone.length !== 10}
              >
                {isVerifying ? 'Sending...' : 'Send OTP'}
              </Button>
            </>
          )}

          {step === 'otp' && (
            <>
              <Input
                type="text"
                value={otp}
                onChange={(e) => handleOtpChange(e.target.value)}
                placeholder="Enter 4-digit OTP"
                className="text-center text-2xl tracking-widest"
                maxLength={4}
                autoFocus
              />
              <Button
                className="w-full"
                onClick={handleVerifyOtp}
                disabled={isVerifying || otp.length !== 4}
              >
                {isVerifying ? 'Verifying...' : 'Verify OTP'}
              </Button>
              <Button
                variant="link"
                className="w-full"
                onClick={() => {
                  setStep('phone');
                  setOtp('');
                }}
              >
                Change phone number
              </Button>
            </>
          )}

          <p className="text-xs text-center text-muted-foreground">
            Tibrewal & Tibrewal Pvt. Ltd.
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default ForgotPin;
