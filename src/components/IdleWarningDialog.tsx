import { useEffect, useState } from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction } from '@/components/ui/alert-dialog';
import { useAppAuth } from '@/contexts/AppAuthContext';
import { Clock } from 'lucide-react';

const IdleWarningDialog = () => {
  const { logoutWarning, dismissWarning, logout } = useAppAuth();
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (!logoutWarning) {
      setCountdown(60);
      return;
    }

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          logout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [logoutWarning, logout]);

  return (
    <AlertDialog open={logoutWarning}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-accent">
              <Clock className="h-5 w-5 text-accent-foreground" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Session Expiring
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            You will be logged out in{' '}
            <span className="font-bold text-destructive">{countdown}s</span>{' '}
            due to inactivity. Click below to stay logged in.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction
            onClick={dismissWarning}
            className="w-full bg-primary text-primary-foreground font-semibold"
          >
            Stay Logged In
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default IdleWarningDialog;