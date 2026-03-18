import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import Sidebar from './Sidebar';
import AIChatBot from '@/components/AIChatBot';
import IdleWarningDialog from '@/components/IdleWarningDialog';

interface DashboardLayoutProps {
  children: ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="min-h-screen bg-background flex">
      <Sidebar />
      <main className="flex-1 lg:ml-0 mt-14 lg:mt-0 overflow-auto smooth-scroll">
        <div className="p-6 lg:p-8">{children}</div>
      </main>
      <AIChatBot />
      <IdleWarningDialog />
    </div>
  );
};

export default DashboardLayout;