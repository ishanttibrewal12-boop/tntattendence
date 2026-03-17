import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Check, X, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { formatFullCurrency } from '@/lib/formatUtils';

interface Staff {
  id: string;
  name: string;
  category: 'petroleum' | 'crusher' | 'office';
}

interface Advance {
  id: string;
  staff_id: string;
  amount: number;
  date: string;
  is_deducted: boolean;
  notes: string | null;
}

interface PaymentDeductionSectionProps {
  onBack: () => void;
  category?: 'petroleum' | 'crusher' | 'office';
}

const PaymentDeductionSection = ({ onBack, category }: PaymentDeductionSectionProps) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  
  const [confirmAction, setConfirmAction] = useState<{
    type: 'deduct' | 'undeduct';
    advanceId?: string;
    amount?: number;
  } | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    setIsLoading(true);

    const startDate = format(startOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');

    let staffQuery = supabase.from('staff').select('id, name, category').eq('is_active', true).order('name');
    if (category) staffQuery = staffQuery.eq('category', category);

    const [staffRes, advancesRes] = await Promise.all([
      staffQuery,
      supabase.from('advances').select('id, staff_id, amount, date, is_deducted, notes').gte('date', startDate).lte('date', endDate).order('date', { ascending: false }),
    ]);

    if (staffRes.data) setStaffList(staffRes.data as Staff[]);
    if (advancesRes.data) setAdvances(advancesRes.data as Advance[]);

    setIsLoading(false);
  };

  const handleMarkDeducted = async () => {
    if (!confirmAction || confirmAction.type !== 'deduct' || !confirmAction.advanceId) return;

    const { error } = await supabase
      .from('advances')
      .update({ is_deducted: true })
      .eq('id', confirmAction.advanceId);

    if (error) {
      toast.error('Failed to mark as deducted');
    } else {
      toast.success('Advance marked as deducted');
      fetchData();
    }
    setConfirmAction(null);
  };

  const handleMarkNotDeducted = async () => {
    if (!confirmAction || confirmAction.type !== 'undeduct' || !confirmAction.advanceId) return;

    const { error } = await supabase
      .from('advances')
      .update({ is_deducted: false })
      .eq('id', confirmAction.advanceId);

    if (error) {
      toast.error('Failed to mark as not deducted');
    } else {
      toast.success('Advance marked as not deducted');
      fetchData();
    }
    setConfirmAction(null);
  };

  const getStaffName = (staffId: string) => {
    return staffList.find(s => s.id === staffId)?.name || 'Unknown';
  };

  const getStaffCategory = (staffId: string) => {
    return staffList.find(s => s.id === staffId)?.category || 'office';
  };

  const allAdvanceStats = (() => {
    const deducted = advances.filter(a => a.is_deducted).length;
    const notDeducted = advances.filter(a => !a.is_deducted).length;
    const deductedAmount = advances.filter(a => a.is_deducted).reduce((sum, a) => sum + Number(a.amount), 0);
    const notDeductedAmount = advances.filter(a => !a.is_deducted).reduce((sum, a) => sum + Number(a.amount), 0);
    return { total: advances.length, deducted, notDeducted, deductedAmount, notDeductedAmount };
  })();

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <div className="mb-4">
        <h1 className="text-lg lg:text-xl font-bold text-foreground">Advance Deductions</h1>
        <p className="text-xs text-muted-foreground">Mark advances as deducted</p>
      </div>

      {/* Month/Year Selection */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {months.map((month, i) => (
              <SelectItem key={i} value={(i + 1).toString()}>{month}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026, 2027].map((year) => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-3">
            <p className="text-xs opacity-90">Deducted</p>
            <p className="text-lg font-bold">{allAdvanceStats.deducted}</p>
            <p className="text-xs opacity-90">{formatFullCurrency(allAdvanceStats.deductedAmount)}</p>
          </CardContent>
        </Card>
        <Card className="bg-destructive text-destructive-foreground">
          <CardContent className="p-3">
            <p className="text-xs opacity-90">Not Deducted</p>
            <p className="text-lg font-bold">{allAdvanceStats.notDeducted}</p>
            <p className="text-xs opacity-90">{formatFullCurrency(allAdvanceStats.notDeductedAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Advances List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : advances.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No advances this month</div>
      ) : (
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {advances
            .filter(adv => {
              const staff = staffList.find(s => s.id === adv.staff_id);
              if (!staff) return false;
              return staff.name.toLowerCase().includes(searchQuery.toLowerCase());
            })
            .map((advance) => {
              const staffName = getStaffName(advance.staff_id);
              const cat = getStaffCategory(advance.staff_id);
              return (
                <Card key={advance.id} className={advance.is_deducted ? 'border-green-500/30 bg-green-500/5' : ''}>
                  <CardContent className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">{staffName}</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="secondary" className="text-xs capitalize">{cat}</Badge>
                          <span className="text-sm font-medium">{formatFullCurrency(Number(advance.amount))}</span>
                          <span className="text-xs text-muted-foreground">{format(new Date(advance.date), 'dd MMM')}</span>
                        </div>
                        {advance.is_deducted && <Badge variant="default" className="text-xs bg-green-600 mt-1">Deducted ✓</Badge>}
                      </div>
                      <div className="flex items-center gap-2">
                        {advance.is_deducted ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setConfirmAction({ type: 'undeduct', advanceId: advance.id, amount: Number(advance.amount) })}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setConfirmAction({ type: 'deduct', advanceId: advance.id, amount: Number(advance.amount) })}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'deduct' && 'Mark as Deducted'}
              {confirmAction?.type === 'undeduct' && 'Mark as Not Deducted'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'deduct' && `Mark this advance of ${formatFullCurrency(confirmAction.amount || 0)} as deducted from salary?`}
              {confirmAction?.type === 'undeduct' && `Mark this advance of ${formatFullCurrency(confirmAction.amount || 0)} as not deducted?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction?.type === 'deduct') handleMarkDeducted();
                else if (confirmAction?.type === 'undeduct') handleMarkNotDeducted();
              }}
            >
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PaymentDeductionSection;
