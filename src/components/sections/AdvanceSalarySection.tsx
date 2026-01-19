import { useState } from 'react';
import { ArrowLeft, Wallet, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdvanceTab from './AdvanceTab';
import SalaryTab from './SalaryTab';

interface AdvanceSalarySectionProps {
  onBack: () => void;
}

const AdvanceSalarySection = ({ onBack }: AdvanceSalarySectionProps) => {
  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Advance & Salary</h1>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="advance" className="w-full">
        <TabsList className="grid w-full grid-cols-2 mb-4">
          <TabsTrigger value="advance" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Advance
          </TabsTrigger>
          <TabsTrigger value="salary" className="gap-2">
            <Wallet className="h-4 w-4" />
            Salary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="advance">
          <AdvanceTab />
        </TabsContent>

        <TabsContent value="salary">
          <SalaryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvanceSalarySection;
