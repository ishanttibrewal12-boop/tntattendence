import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Check, X, CreditCard, Wallet, Filter, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
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

interface PayrollRecord {
  id: string;
  staff_id: string;
  month: number;
  year: number;
  is_paid: boolean;
  net_salary: number;
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
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'salary' | 'advance'>('salary');
  
  // Confirmation dialogs
  const [confirmAction, setConfirmAction] = useState<{
    type: 'pay' | 'unpay' | 'deduct' | 'undeduct';
    staffId?: string;
    staffName?: string;
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

    const [staffRes, payrollRes, advancesRes] = await Promise.all([
      staffQuery,
      supabase.from('payroll').select('id, staff_id, month, year, is_paid, net_salary').eq('month', selectedMonth).eq('year', selectedYear),
      supabase.from('advances').select('id, staff_id, amount, date, is_deducted, notes').gte('date', startDate).lte('date', endDate).order('date', { ascending: false }),
    ]);

    if (staffRes.data) setStaffList(staffRes.data as Staff[]);
    if (payrollRes.data) setPayrollRecords(payrollRes.data as PayrollRecord[]);
    if (advancesRes.data) setAdvances(advancesRes.data as Advance[]);

    setIsLoading(false);
  };

  const handleMarkPaid = async () => {
    if (!confirmAction || confirmAction.type !== 'pay' || !confirmAction.staffId) return;

    const { error } = await supabase
      .from('payroll')
      .upsert({
        staff_id: confirmAction.staffId,
        month: selectedMonth,
        year: selectedYear,
        is_paid: true,
        paid_date: format(new Date(), 'yyyy-MM-dd'),
      }, { onConflict: 'staff_id,month,year' });

    if (error) {
      toast.error('Failed to mark as paid');
    } else {
      toast.success(`${confirmAction.staffName} marked as paid`);
      fetchData();
    }
    setConfirmAction(null);
  };

  const handleMarkUnpaid = async () => {
    if (!confirmAction || confirmAction.type !== 'unpay' || !confirmAction.staffId) return;

    const { error } = await supabase
      .from('payroll')
      .update({ is_paid: false, paid_date: null })
      .eq('staff_id', confirmAction.staffId)
      .eq('month', selectedMonth)
      .eq('year', selectedYear);

    if (error) {
      toast.error('Failed to mark as unpaid');
    } else {
      toast.success(`${confirmAction.staffName} marked as unpaid`);
      fetchData();
    }
    setConfirmAction(null);
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

  // Filter staff by search
  const filteredStaff = staffList.filter(staff => {
    return staff.name.toLowerCase().includes(searchQuery.toLowerCase());
  });

  // Get payment status for staff
  const getPaymentStatus = (staffId: string) => {
    const record = payrollRecords.find(p => p.staff_id === staffId);
    return record?.is_paid ?? false;
  };

  // Get staff advances
  const getStaffAdvances = (staffId: string) => {
    return advances.filter(a => a.staff_id === staffId);
  };

  // Get staff name by ID
  const getStaffName = (staffId: string) => {
    return staffList.find(s => s.id === staffId)?.name || 'Unknown';
  };

  const getStaffCategory = (staffId: string) => {
    return staffList.find(s => s.id === staffId)?.category || 'office';
  };

  // Calculate summary stats
  const allSalaryStats = (() => {
    const paid = staffList.filter(s => getPaymentStatus(s.id)).length;
    const unpaid = staffList.length - paid;
    return { total: staffList.length, paid, unpaid };
  })();

  const allAdvanceStats = (() => {
    const deducted = advances.filter(a => a.is_deducted).length;
    const notDeducted = advances.filter(a => !a.is_deducted).length;
    const deductedAmount = advances.filter(a => a.is_deducted).reduce((sum, a) => sum + Number(a.amount), 0);
    const notDeductedAmount = advances.filter(a => !a.is_deducted).reduce((sum, a) => sum + Number(a.amount), 0);
    return { total: advances.length, deducted, notDeducted, deductedAmount, notDeductedAmount };
  })();

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Paid & Deducted</h1>
      </div>

      {/* Month/Year Selection */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((month, i) => (
              <SelectItem key={i} value={(i + 1).toString()}>{month}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026, 2027].map((year) => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'salary' | 'advance')} className="mb-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="salary" className="gap-2">
            <Wallet className="h-4 w-4" />
            Salary Status
          </TabsTrigger>
          <TabsTrigger value="advance" className="gap-2">
            <CreditCard className="h-4 w-4" />
            Advance Status
          </TabsTrigger>
        </TabsList>

        {/* Salary Tab */}
        <TabsContent value="salary">
          {/* Salary Summary Cards */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Card className="bg-primary text-primary-foreground">
              <CardContent className="p-3">
                <p className="text-xs opacity-90">Total Paid</p>
                <p className="text-lg font-bold">{allSalaryStats.paid} / {allSalaryStats.total}</p>
              </CardContent>
            </Card>
            <Card className="bg-destructive text-destructive-foreground">
              <CardContent className="p-3">
                <p className="text-xs opacity-90">Not Paid</p>
                <p className="text-lg font-bold">{allSalaryStats.unpaid}</p>
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

          {/* Staff Salary List */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredStaff.map((staff) => {
                const isPaid = getPaymentStatus(staff.id);
                return (
                  <Card key={staff.id} className={isPaid ? 'border-green-500/30 bg-green-500/5' : ''}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-foreground truncate">{staff.name}</p>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs capitalize">{staff.category}</Badge>
                            {isPaid && <Badge variant="default" className="text-xs bg-green-600">Paid ✓</Badge>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {isPaid ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setConfirmAction({ type: 'unpay', staffId: staff.id, staffName: staff.name })}
                            >
                              <X className="h-4 w-4 mr-1" />
                              Unpay
                            </Button>
                          ) : (
                            <Button
                              size="sm"
                              onClick={() => setConfirmAction({ type: 'pay', staffId: staff.id, staffName: staff.name })}
                            >
                              <Check className="h-4 w-4 mr-1" />
                              Pay
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
        </TabsContent>

        {/* Advance Tab */}
        <TabsContent value="advance">
          {/* Advance Summary Cards */}
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
                  const matchesSearch = staff.name.toLowerCase().includes(searchQuery.toLowerCase());
                  return matchesSearch;
                })
                .map((advance) => {
                  const staffName = getStaffName(advance.staff_id);
                  const category = getStaffCategory(advance.staff_id);
                  return (
                    <Card key={advance.id} className={advance.is_deducted ? 'border-green-500/30 bg-green-500/5' : ''}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">{staffName}</p>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="secondary" className="text-xs capitalize">{category}</Badge>
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
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmAction?.type === 'pay' && 'Mark as Paid'}
              {confirmAction?.type === 'unpay' && 'Mark as Unpaid'}
              {confirmAction?.type === 'deduct' && 'Mark as Deducted'}
              {confirmAction?.type === 'undeduct' && 'Mark as Not Deducted'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'pay' && `Mark ${confirmAction.staffName}'s salary as paid for ${months[selectedMonth - 1]} ${selectedYear}?`}
              {confirmAction?.type === 'unpay' && `Mark ${confirmAction.staffName}'s salary as unpaid for ${months[selectedMonth - 1]} ${selectedYear}?`}
              {confirmAction?.type === 'deduct' && `Mark this advance of ${formatFullCurrency(confirmAction.amount || 0)} as deducted from salary?`}
              {confirmAction?.type === 'undeduct' && `Mark this advance of ${formatFullCurrency(confirmAction.amount || 0)} as not deducted?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmAction?.type === 'pay') handleMarkPaid();
                else if (confirmAction?.type === 'unpay') handleMarkUnpaid();
                else if (confirmAction?.type === 'deduct') handleMarkDeducted();
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
