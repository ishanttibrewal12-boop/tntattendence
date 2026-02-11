import { useState } from 'react';
import { Crown, Truck, Fuel, Mountain, User, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAppAuth } from '@/contexts/AppAuthContext';
import { useToast } from '@/hooks/use-toast';
import companyLogo from '@/assets/company-logo.png';
import heroImg from '@/assets/gallery-petroleum-1.jpeg';

interface Profile {
  id: string;
  name: string;
  role: string;
  description: string;
  icon: typeof User;
}

const profiles: Profile[] = [
  { id: 'manager', name: 'Abhay Jalan', role: 'Manager', description: 'Full Access', icon: Crown },
  { id: 'petroleum', name: 'Santosh', role: 'Petroleum Admin', description: 'Petroleum Staff', icon: Fuel },
  { id: 'mlt', name: 'Rishab', role: 'MLT Admin', description: 'Driver & Khalasi', icon: Truck },
  { id: 'crusher', name: 'Ambuj', role: 'Crusher Admin', description: 'Crusher Staff', icon: Mountain },
];

export { profiles };
export type { Profile };

const HeroSection = () => {
  return (
    <section className="relative min-h-[85vh] flex items-center justify-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${heroImg})` }}
      />
      <div className="absolute inset-0" style={{ background: 'linear-gradient(135deg, rgba(15,23,42,0.93) 0%, rgba(30,58,138,0.90) 50%, rgba(15,23,42,0.95) 100%)' }} />

      <div className="relative z-10 w-full max-w-5xl mx-auto px-4 py-16 text-center">
        <img 
          src={companyLogo} 
          alt="Tibrewal & Tibrewal" 
          className="h-24 w-24 mx-auto mb-6 object-contain drop-shadow-2xl" 
          width={96} height={96} fetchPriority="high"
        />
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight mb-3" style={{ color: 'white' }}>
          Tibrewal & Tibrewal Pvt. Ltd.
        </h1>
        <p className="text-lg md:text-xl mb-2 font-medium" style={{ color: 'rgba(255,255,255,0.8)' }}>
          Mining • Stone Crushing • Transportation • Petroleum • Tyres
        </p>
        <p className="text-sm mb-12" style={{ color: 'rgba(255,255,255,0.5)' }}>
          Established 2021 • Jharkhand, India
        </p>
        <div className="mt-8 animate-bounce">
          <div className="w-6 h-10 mx-auto rounded-full border-2 flex items-start justify-center pt-2" style={{ borderColor: 'rgba(255,255,255,0.3)' }}>
            <div className="w-1 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.5)' }} />
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
