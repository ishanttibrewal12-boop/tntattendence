import { ArrowLeft, Wallet, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdvanceTab from './AdvanceTab';
import SalaryTab from './SalaryTab';

interface AdvanceSalarySectionProps {
  onBack: () => void;
  category?: 'petroleum' | 'crusher' | 'office';
}

const AdvanceSalarySection = ({ onBack, category }: AdvanceSalarySectionProps) => {
  const categoryTitle = category ? category.charAt(0).toUpperCase() + category.slice(1) + ' ' : '';

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <h1 className="text-lg lg:text-xl font-bold text-foreground mb-4">{categoryTitle}Advance & Salary</h1>

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
          <AdvanceTab category={category} />
        </TabsContent>

        <TabsContent value="salary">
          <SalaryTab category={category} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvanceSalarySection;
