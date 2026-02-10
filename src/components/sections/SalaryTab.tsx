import { useState, useEffect } from 'react';
import { Download, Share2, Check, Undo2, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToExcel, addReportNotes, REPORT_FOOTER } from '@/lib/exportUtils';
import { formatCurrencyForPDF, formatFullCurrency } from '@/lib/formatUtils';

interface Staff {
  id: string;
  name: string;
  category: string;
  shift_rate: number;
}

interface SalaryCalculation {
  staffId: string;
  name: string;
  category: string;
  shiftRate: number;
  totalShifts: number;
  shiftAmount: number;
  totalAdvances: number;
  payable: number;
  isPaid: boolean;
  carryForward: number;
}

interface SalaryTabProps {
  category?: 'petroleum' | 'crusher' | 'office';
}

const SalaryTab = ({ category }: SalaryTabProps) => {
  const [salaryData, setSalaryData] = useState<SalaryCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [confirmPay, setConfirmPay] = useState<SalaryCalculation | null>(null);
  const [confirmUnpay, setConfirmUnpay] = useState<SalaryCalculation | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear, category]);

  const fetchData = async () => {
    setIsLoading(true);

    let staffQuery = supabase.from('staff').select('id, name, category, shift_rate').eq('is_active', true).order('name');
    if (category) staffQuery = staffQuery.eq('category', category);

    const { data: staffData } = await staffQuery;
    if (!staffData) { setIsLoading(false); return; }

    const startDate = format(startOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');

    const [attendanceRes, advancesRes, payrollRes, prevPayrollRes] = await Promise.all([
      supabase.from('attendance').select('staff_id, shift_count, status').gte('date', startDate).lte('date', endDate),
      supabase.from('advances').select('staff_id, amount').gte('date', startDate).lte('date', endDate),
      supabase.from('payroll').select('staff_id, is_paid').eq('month', selectedMonth).eq('year', selectedYear),
      // Check previous month for carry-forward
      supabase.from('salary_records').select('staff_id, pending_amount, is_paid').eq('month', selectedMonth === 1 ? 12 : selectedMonth - 1).eq('year', selectedMonth === 1 ? selectedYear - 1 : selectedYear),
    ]);

    const calculations: SalaryCalculation[] = staffData.map((staff) => {
      const shiftRate = Number(staff.shift_rate) || 0;
      const staffAtt = (attendanceRes.data || []).filter(a => a.staff_id === staff.id && (a.status === 'present' || a.status === 'half_day'));
      const totalShifts = staffAtt.reduce((sum, a) => sum + (a.shift_count || 1), 0);
      const shiftAmount = totalShifts * shiftRate;

      const staffAdv = (advancesRes.data || []).filter(a => a.staff_id === staff.id);
      const totalAdvances = staffAdv.reduce((sum, a) => sum + Number(a.amount), 0);

      const isPaid = (payrollRes.data || []).some(p => p.staff_id === staff.id && p.is_paid);

      // Carry forward from previous month
      const prevRecord = (prevPayrollRes.data || []).find(p => p.staff_id === staff.id);
      const carryForward = (prevRecord && !prevRecord.is_paid) ? Number(prevRecord.pending_amount || 0) : 0;

      const payable = shiftAmount - totalAdvances + carryForward;

      return {
        staffId: staff.id,
        name: staff.name,
        category: staff.category,
        shiftRate,
        totalShifts,
        shiftAmount,
        totalAdvances,
        payable,
        isPaid,
        carryForward,
      };
    });

    setSalaryData(calculations);
    setIsLoading(false);
  };

  const markAsPaid = async () => {
    if (!confirmPay) return;
    const calc = confirmPay;

    await supabase.from('advances').update({ is_deducted: true }).eq('staff_id', calc.staffId).eq('is_deducted', false);

    const { error } = await supabase.from('payroll').upsert({
      staff_id: calc.staffId,
      month: selectedMonth,
      year: selectedYear,
      base_salary: calc.shiftRate,
      working_days: 0,
      present_days: calc.totalShifts,
      half_days: 0,
      absent_days: 0,
      deductions: calc.totalAdvances,
      net_salary: calc.payable,
      is_paid: true,
      paid_date: format(new Date(), 'yyyy-MM-dd'),
    }, { onConflict: 'staff_id,month,year' });

    // Also save to salary_records for carry-forward tracking
    await supabase.from('salary_records').upsert({
      staff_id: calc.staffId,
      staff_type: 'staff',
      month: selectedMonth,
      year: selectedYear,
      shift_rate: calc.shiftRate,
      total_shifts: calc.totalShifts,
      gross_salary: calc.shiftAmount,
      total_advances: calc.totalAdvances,
      pending_amount: calc.payable,
      is_paid: true,
      paid_date: new Date().toISOString(),
    }, { onConflict: 'staff_id,month,year' });

    if (error) { toast.error('Failed to mark as paid'); return; }
    toast.success('Marked as paid');
    setConfirmPay(null);
    fetchData();
  };

  const markAsUnpaid = async () => {
    if (!confirmUnpay) return;
    await supabase.from('payroll').update({ is_paid: false, paid_date: null }).eq('staff_id', confirmUnpay.staffId).eq('month', selectedMonth).eq('year', selectedYear);
    await supabase.from('salary_records').update({ is_paid: false, paid_date: null }).eq('staff_id', confirmUnpay.staffId).eq('month', selectedMonth).eq('year', selectedYear);
    toast.success('Marked as unpaid');
    setConfirmUnpay(null);
    fetchData();
  };

  const totalPayable = salaryData.reduce((sum, s) => sum + Math.max(0, s.payable), 0);
  const totalAdvances = salaryData.reduce((sum, s) => sum + s.totalAdvances, 0);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text(`Salary Report - ${months[selectedMonth - 1]} ${selectedYear}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Total Payable: ${formatCurrencyForPDF(totalPayable)}`, 14, 30);
    doc.text(REPORT_FOOTER, 14, 38);

    const tableData = salaryData.map((s) => [
      s.name,
      formatCurrencyForPDF(s.shiftRate) + '/shift',
      s.totalShifts.toString(),
      formatCurrencyForPDF(s.shiftAmount),
      formatCurrencyForPDF(s.totalAdvances),
      s.carryForward > 0 ? formatCurrencyForPDF(s.carryForward) : '-',
      formatCurrencyForPDF(s.payable),
      s.isPaid ? 'Paid' : 'Pending',
    ]);

    autoTable(doc, {
      head: [['Name', 'Rate', 'Shifts', 'Shift Amt', 'Advances', 'Carry Fwd', 'Payable', 'Status']],
      body: tableData,
      startY: 44,
      styles: { fontSize: 7 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    addReportNotes(doc, finalY);
    doc.save(`salary-${selectedMonth}-${selectedYear}.pdf`);
    toast.success('PDF downloaded');
  };

  const exportToExcelFile = () => {
    const headers = ['Name', 'Shift Rate', 'Shifts', 'Shift Amount', 'Advances', 'Carry Forward', 'Payable', 'Status'];
    const data = salaryData.map((s) => [
      s.name, `₹${s.shiftRate}`, s.totalShifts, `₹${s.shiftAmount.toLocaleString()}`,
      `₹${s.totalAdvances.toLocaleString()}`, s.carryForward > 0 ? `₹${s.carryForward.toLocaleString()}` : '-',
      `₹${s.payable.toLocaleString()}`, s.isPaid ? 'Paid' : 'Pending',
    ]);
    exportToExcel(data, headers, `salary-${selectedMonth}-${selectedYear}`, 'Salary Report', `Salary - ${months[selectedMonth - 1]} ${selectedYear}`);
    toast.success('Excel downloaded');
  };

  const shareToWhatsApp = () => {
    let message = `💰 *Salary - ${months[selectedMonth - 1]} ${selectedYear}*\n\n`;
    salaryData.forEach((s) => {
      const status = s.isPaid ? '✅' : '⏳';
      message += `${status} *${s.name}*\n`;
      message += `   ${s.totalShifts} shifts × ₹${s.shiftRate} = ₹${s.shiftAmount.toLocaleString()}\n`;
      message += `   Advances: -₹${s.totalAdvances.toLocaleString()}\n`;
      if (s.carryForward > 0) message += `   Carry Fwd: +₹${s.carryForward.toLocaleString()}\n`;
      message += `   *Payable: ₹${s.payable.toLocaleString()}*\n\n`;
    });
    message += `💰 *Total Payable: ₹${totalPayable.toLocaleString()}*\n_Tibrewal Staff Manager_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div>
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

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Card className="bg-primary text-primary-foreground">
          <CardContent className="p-3">
            <p className="text-xs opacity-90">Total Payable</p>
            <p className="text-lg font-bold">{formatFullCurrency(totalPayable)}</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary text-secondary-foreground">
          <CardContent className="p-3">
            <p className="text-xs opacity-90">Total Advances</p>
            <p className="text-lg font-bold">{formatFullCurrency(totalAdvances)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Button variant="secondary" size="sm" onClick={exportToPDF}><Download className="h-4 w-4 mr-1" />PDF</Button>
        <Button variant="secondary" size="sm" onClick={exportToExcelFile}><FileSpreadsheet className="h-4 w-4 mr-1" />Excel</Button>
        <Button variant="secondary" size="sm" onClick={shareToWhatsApp}><Share2 className="h-4 w-4 mr-1" />Share</Button>
      </div>

      {/* Salary List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-2">
          {salaryData.map((calc) => (
            <Card key={calc.staffId} className={calc.isPaid ? 'opacity-60' : ''}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="font-medium text-foreground">{calc.name}</p>
                    <p className="text-xs text-muted-foreground">Rate: {formatFullCurrency(calc.shiftRate)}/shift</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-foreground">{formatFullCurrency(calc.payable)}</p>
                    {calc.isPaid && <span className="text-xs text-green-600">Paid ✓</span>}
                  </div>
                </div>

                {/* Simple Math Display */}
                <div className="bg-muted/40 rounded p-2 text-xs space-y-1 mb-2 font-mono">
                  <div className="flex justify-between">
                    <span>{calc.totalShifts} shifts × ₹{calc.shiftRate.toLocaleString()}</span>
                    <span>= ₹{calc.shiftAmount.toLocaleString()}</span>
                  </div>
                  {calc.totalAdvances > 0 && (
                    <div className="flex justify-between text-destructive">
                      <span>− Advances</span>
                      <span>− ₹{calc.totalAdvances.toLocaleString()}</span>
                    </div>
                  )}
                  {calc.carryForward > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span>+ Unpaid Carry Forward</span>
                      <span>+ ₹{calc.carryForward.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold border-t border-border pt-1">
                    <span>Payable</span>
                    <span>= ₹{calc.payable.toLocaleString()}</span>
                  </div>
                </div>

                {!calc.isPaid && calc.payable > 0 && (
                  <p className="text-xs text-orange-600 mb-2">⚠ Unpaid – Will carry forward if not paid</p>
                )}

                {calc.isPaid ? (
                  <Button size="sm" variant="outline" className="w-full" onClick={() => setConfirmUnpay(calc)}>
                    <Undo2 className="h-4 w-4 mr-2" />Mark as Unpaid
                  </Button>
                ) : (
                  <Button size="sm" className="w-full" onClick={() => setConfirmPay(calc)}>
                    <Check className="h-4 w-4 mr-2" />Mark as Paid
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Confirm Pay Dialog */}
      <AlertDialog open={!!confirmPay} onOpenChange={() => setConfirmPay(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Mark {confirmPay?.name}'s salary ({formatFullCurrency(confirmPay?.payable || 0)}) as paid?
              Advances of {formatFullCurrency(confirmPay?.totalAdvances || 0)} will be deducted.
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
            <AlertDialogTitle>Revert Payment</AlertDialogTitle>
            <AlertDialogDescription>Mark {confirmUnpay?.name}'s salary as unpaid?</AlertDialogDescription>
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
