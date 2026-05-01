import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAppAuth } from '@/contexts/AppAuthContext';
import { SidebarProvider, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import AppSidebar from './AppSidebar';
import AIChatBot from '@/components/AIChatBot';
import IdleWarningDialog from '@/components/IdleWarningDialog';
import NotificationBell from '@/components/dashboard/NotificationBell';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { isAuthenticated, isLoading } = useAppAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-sm text-muted-foreground">Loading…</div>
      </div>
    );
  }

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  // Restore collapsed state from localStorage (shadcn also persists via cookie)
  const defaultOpen =
    typeof window !== 'undefined'
      ? localStorage.getItem('sidebar:open') !== 'false'
      : true;

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      onOpenChange={(open) => {
        try { localStorage.setItem('sidebar:open', String(open)); } catch {}
      }}
    >
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-col">
          <header className="glass-header sticky top-0 z-30 h-14 flex items-center gap-3 px-4">
            <SidebarTrigger className="h-8 w-8 rounded-lg" />
            <div className="flex-1" />
            <NotificationBell />
          </header>
          <main className="flex-1 overflow-auto smooth-scroll">
            <div className="p-6 lg:p-8 max-w-6xl mx-auto w-full">{children}</div>
          </main>
        </SidebarInset>
        <AIChatBot />
        <IdleWarningDialog />
      </div>
    </SidebarProvider>
  );
};

export default DashboardLayout;
