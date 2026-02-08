import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { useState } from "react";
import { AppAuthProvider, useAppAuth } from "@/contexts/AppAuthContext";
import ProfileSelection from "@/components/ProfileSelection";
import Home from "./pages/Home";
import NotFound from "./pages/NotFound";

const AppContent = () => {
  const { isAuthenticated, isLoading } = useAppAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <ProfileSelection />;
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
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
