import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useState, lazy, Suspense } from "react";
import { AppAuthProvider, useAppAuth } from "@/contexts/AppAuthContext";

const LandingPage = lazy(() => import("./components/ProfileSelection"));
const Home = lazy(() => import("./pages/Home"));
const NotFound = lazy(() => import("./pages/NotFound"));

const LoadingScreen = () => (
  <div className="min-h-screen flex items-center justify-center" style={{ background: '#0f172a' }}>
    <div className="text-center">
      <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin mx-auto mb-3" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'transparent' }} />
      <p className="text-sm" style={{ color: 'rgba(255,255,255,0.5)' }}>Loading...</p>
    </div>
  </div>
);

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, isLoading } = useAppAuth();
  if (isLoading) return <LoadingScreen />;
  if (!isAuthenticated) return <Navigate to="/" replace />;
  return <>{children}</>;
};

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAppAuth();

  return (
    <Suspense fallback={<LoadingScreen />}>
      <Routes>
        <Route path="/" element={
          isLoading ? <LoadingScreen /> :
          isAuthenticated ? <Navigate to="/dashboard" replace /> :
          <LandingPage />
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><Home /></ProtectedRoute>
        } />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

const App = () => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AppAuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </AppAuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
