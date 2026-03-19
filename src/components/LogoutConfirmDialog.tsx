import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { useAppAuth } from '@/contexts/AppAuthContext';
import { LogOut } from 'lucide-react';

const LogoutConfirmDialog = () => {
  const { logoutConfirm, confirmLogout, cancelLogout } = useAppAuth();

  return (
    <AlertDialog open={logoutConfirm} onOpenChange={(open) => { if (!open) cancelLogout(); }}>
      <AlertDialogContent className="max-w-sm">
        <AlertDialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-destructive/10">
              <LogOut className="h-5 w-5 text-destructive" />
            </div>
            <AlertDialogTitle className="text-base font-bold text-foreground">
              Confirm Logout
            </AlertDialogTitle>
          </div>
          <AlertDialogDescription className="text-sm text-muted-foreground">
            Are you sure you want to log out? You will need to enter your credentials again to access the system.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="flex gap-2">
          <AlertDialogCancel className="flex-1">Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirmLogout}
            className="flex-1 bg-destructive text-destructive-foreground hover:bg-destructive/90 font-semibold"
          >
            Log Out
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export default LogoutConfirmDialog;
