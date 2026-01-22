import { useState, useEffect } from 'react';
import { Calculator, Download, Share2, Check, Undo2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, getDaysInMonth, startOfMonth, endOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Staff {
  id: string;
  name: string;
  category: 'petroleum' | 'crusher' | 'office';
  base_salary: number;
  notes: string | null;
}

interface Advance {
  id: string;
  staff_id: string;
  amount: number;
}

interface SalaryCalculation {
  staffId: string;
  name: string;
  category: string;
  baseSalary: number;
  workingDays: number;
  totalShifts: number;
  oneShiftDays: number;
  twoShiftDays: number;
  absentDays: number;
  perShiftSalary: number;
  earnedSalary: number;
  totalAdvance: number;
  netSalary: number;
  notes: string | null;
}

const SalaryTab = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [salaryData, setSalaryData] = useState<SalaryCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'petroleum' | 'crusher' | 'office'>('all');
  const [paidStaff, setPaidStaff] = useState<Set<string>>(new Set());
  const [confirmPay, setConfirmPay] = useState<{ staffId: string; calc: SalaryCalculation } | null>(null);
  const [confirmUnpay, setConfirmUnpay] = useState<{ staffId: string; name: string } | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const getWorkingDaysInMonth = (year: number, month: number) => {
    // All days including Sundays are working days
    return getDaysInMonth(new Date(year, month - 1));
  };

  const fetchData = async () => {
    setIsLoading(true);
    
    const [staffRes, advancesRes] = await Promise.all([
      supabase.from('staff').select('id, name, category, base_salary, notes').eq('is_active', true).order('name'),
      supabase.from('advances').select('id, staff_id, amount').eq('is_deducted', false),
    ]);

    if (staffRes.data) setStaffList(staffRes.data as Staff[]);
    if (advancesRes.data) setAdvances(advancesRes.data);

    // Fetch attendance for the month
    const startDate = format(startOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');

    const { data: attendanceData } = await supabase
      .from('attendance')
      .select('staff_id, status, shift_count')
      .gte('date', startDate)
      .lte('date', endDate);

    // Check paid status from payroll
    const { data: payrollData } = await supabase
      .from('payroll')
      .select('staff_id, is_paid')
      .eq('month', selectedMonth)
      .eq('year', selectedYear);

    if (payrollData) {
      setPaidStaff(new Set(payrollData.filter(p => p.is_paid).map(p => p.staff_id)));
    }

    const workingDays = getWorkingDaysInMonth(selectedYear, selectedMonth);

    // Calculate salary for each staff based on shifts
    if (staffRes.data) {
      const calculations = staffRes.data.map((staff) => {
        const staffAttendance = attendanceData?.filter(a => a.staff_id === staff.id) || [];
        
        const oneShiftDays = staffAttendance.filter(a => a.status === 'present' && (a.shift_count || 1) === 1).length;
        const twoShiftDays = staffAttendance.filter(a => a.status === 'present' && a.shift_count === 2).length;
        const absentDays = staffAttendance.filter(a => a.status === 'absent').length;
        const totalShifts = oneShiftDays + (twoShiftDays * 2);

        // Per shift salary = base salary / (working days * 2 possible shifts per day)
        // Or simpler: per shift = base / working days (assuming 1 shift per day baseline)
        const perShiftSalary = workingDays > 0 ? Number(staff.base_salary) / workingDays : 0;
        const earnedSalary = perShiftSalary * totalShifts;

        const staffAdvances = advancesRes.data?.filter(a => a.staff_id === staff.id) || [];
        const totalAdvance = staffAdvances.reduce((sum, a) => sum + Number(a.amount), 0);

        const netSalary = earnedSalary - totalAdvance;

        return {
          staffId: staff.id,
          name: staff.name,
          category: staff.category,
          baseSalary: Number(staff.base_salary),
          workingDays,
          totalShifts,
          oneShiftDays,
          twoShiftDays,
          absentDays,
          perShiftSalary: Math.round(perShiftSalary),
          earnedSalary: Math.round(earnedSalary),
          totalAdvance,
          netSalary: Math.round(netSalary),
          notes: staff.notes,
        };
      });

      setSalaryData(calculations as SalaryCalculation[]);
    }

    setIsLoading(false);
  };

  const markAsPaid = async () => {
    if (!confirmPay) return;
    const { staffId, calc } = confirmPay;

    // First deduct advances
    await supabase
      .from('advances')
      .update({ is_deducted: true })
      .eq('staff_id', staffId)
      .eq('is_deducted', false);

    // Upsert payroll record
    const { error } = await supabase
      .from('payroll')
      .upsert({
        staff_id: staffId,
        month: selectedMonth,
        year: selectedYear,
        base_salary: calc.baseSalary,
        working_days: calc.workingDays,
        present_days: calc.totalShifts,
        half_days: 0,
        absent_days: calc.absentDays,
        deductions: calc.totalAdvance,
        net_salary: calc.netSalary,
        is_paid: true,
        paid_date: format(new Date(), 'yyyy-MM-dd'),
      }, {
        onConflict: 'staff_id,month,year'
      });

    if (error) {
      toast.error('Failed to mark as paid');
      return;
    }

    toast.success('Marked as paid');
    setConfirmPay(null);
    fetchData();
  };

  const markAsUnpaid = async () => {
    if (!confirmUnpay) return;
    const { staffId } = confirmUnpay;

    // Update payroll record to unpaid
    const { error } = await supabase
      .from('payroll')
      .update({ is_paid: false, paid_date: null })
      .eq('staff_id', staffId)
      .eq('month', selectedMonth)
      .eq('year', selectedYear);

    if (error) {
      toast.error('Failed to mark as unpaid');
      return;
    }

    // Revert advances to not deducted (optional - uncomment if needed)
    // await supabase.from('advances').update({ is_deducted: false }).eq('staff_id', staffId);

    toast.success('Marked as unpaid');
    setConfirmUnpay(null);
    fetchData();
  };

  const filteredSalaryData = categoryFilter === 'all' 
    ? salaryData 
    : salaryData.filter(s => s.category === categoryFilter);

  const totalNetSalary = filteredSalaryData.reduce((sum, s) => sum + Math.max(0, s.netSalary), 0);
  const totalAdvances = filteredSalaryData.reduce((sum, s) => sum + s.totalAdvance, 0);

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`Salary Report - ${months[selectedMonth - 1]} ${selectedYear}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Total Payable: ₹${totalNetSalary.toLocaleString()}`, 14, 30);
    doc.text(`Total Advances Deducted: ₹${totalAdvances.toLocaleString()}`, 14, 38);
    doc.text('Tibrewal Staff Manager | Manager: Abhay Jalan', 14, 46);

    const tableData = filteredSalaryData.map((s) => [
      s.name,
      s.category,
      `₹${s.baseSalary.toLocaleString()}`,
      `${s.totalShifts} shifts`,
      `₹${s.earnedSalary.toLocaleString()}`,
      `₹${s.totalAdvance.toLocaleString()}`,
      `₹${s.netSalary.toLocaleString()}`,
      paidStaff.has(s.staffId) ? 'Paid' : 'Pending',
    ]);

    autoTable(doc, {
      head: [['Name', 'Category', 'Base', 'Shifts', 'Earned', 'Advance', 'Net', 'Status']],
      body: tableData,
      startY: 54,
      styles: { fontSize: 8 },
    });

    doc.save(`salary-${selectedMonth}-${selectedYear}.pdf`);
    toast.success('PDF downloaded');
  };

  const shareToWhatsApp = () => {
    let message = `💰 *Salary Report - ${months[selectedMonth - 1]} ${selectedYear}*\n\n`;
    message += `Total Payable: ₹${totalNetSalary.toLocaleString()}\n`;
    message += `Total Advances: ₹${totalAdvances.toLocaleString()}\n\n`;

    filteredSalaryData.forEach((s) => {
      const status = paidStaff.has(s.staffId) ? '✅' : '⏳';
      message += `${status} ${s.name}: ₹${s.netSalary.toLocaleString()} (${s.totalShifts} shifts)\n`;
    });

    message += `\n_Tibrewal Staff Manager_`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div>
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

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-3">
            <p className="text-xs opacity-90">Total Payable</p>
            <p className="text-lg font-bold">₹{totalNetSalary.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary text-secondary-foreground">
          <CardContent className="p-3">
            <p className="text-xs opacity-90">Advances Deducted</p>
            <p className="text-lg font-bold">₹{totalAdvances.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button variant="secondary" size="sm" onClick={exportToPDF}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        <Button variant="secondary" size="sm" onClick={shareToWhatsApp}>
          <Share2 className="h-4 w-4 mr-2" />
          WhatsApp
        </Button>
      </div>

      {/* Category Filter */}
      <div className="mb-4">
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff</SelectItem>
            <SelectItem value="petroleum">Petroleum</SelectItem>
            <SelectItem value="crusher">Crusher</SelectItem>
            <SelectItem value="office">Office</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Salary List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-2">
          {filteredSalaryData.map((calc) => {
            const isPaid = paidStaff.has(calc.staffId);
            return (
              <Card key={calc.staffId} className={isPaid ? 'opacity-60' : ''}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-foreground">{calc.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{calc.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-foreground">₹{calc.netSalary.toLocaleString()}</p>
                      {isPaid && <span className="text-xs text-green-600">Paid ✓</span>}
                    </div>
                  </div>

                  {calc.notes && (
                    <p className="text-xs text-muted-foreground mb-2 bg-muted/30 p-1 rounded">
                      📝 {calc.notes}
                    </p>
                  )}

                  <div className="text-xs text-muted-foreground space-y-1 mb-2">
                    <div className="flex justify-between">
                      <span>Base: ₹{calc.baseSalary.toLocaleString()}</span>
                      <span>Shifts: {calc.totalShifts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>1-Shift: {calc.oneShiftDays} | 2-Shift: {calc.twoShiftDays}</span>
                      <span>Absent: {calc.absentDays}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Earned: ₹{calc.earnedSalary.toLocaleString()}</span>
                      <span>Advance: -₹{calc.totalAdvance.toLocaleString()}</span>
                    </div>
                  </div>

                  {isPaid ? (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full"
                      onClick={() => setConfirmUnpay({ staffId: calc.staffId, name: calc.name })}
                    >
                      <Undo2 className="h-4 w-4 mr-2" />
                      Mark as Unpaid
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      className="w-full"
                      onClick={() => setConfirmPay({ staffId: calc.staffId, calc })}
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Mark as Paid
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirm Pay Dialog */}
      <AlertDialog open={!!confirmPay} onOpenChange={() => setConfirmPay(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Mark {confirmPay?.calc.name}'s salary (₹{confirmPay?.calc.netSalary.toLocaleString()}) as paid? 
              This will also deduct the advance of ₹{confirmPay?.calc.totalAdvance.toLocaleString()}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={markAsPaid}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirm Unpay Dialog */}
      <AlertDialog open={!!confirmUnpay} onOpenChange={() => setConfirmUnpay(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revert Payment Status</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to mark {confirmUnpay?.name}'s salary as unpaid? 
              This will reverse the payment status.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={markAsUnpaid}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SalaryTab;