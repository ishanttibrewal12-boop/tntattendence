import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { IndianRupee, Calculator, Pencil, User, Check } from 'lucide-react';

interface Staff {
  id: string;
  name: string;
  designation: string | null;
  base_salary: number;
}

interface PayrollRecord {
  id: string;
  staff_id: string;
  month: number;
  year: number;
  working_days: number;
  present_days: number;
  half_days: number;
  absent_days: number;
  base_salary: number;
  deductions: number;
  bonus: number;
  net_salary: number;
  is_paid: boolean;
  paid_date: string | null;
  notes: string | null;
  staff?: Staff;
}

const months = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const Payroll = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollRecord | null>(null);
  const [formData, setFormData] = useState({
    working_days: '26',
    present_days: '0',
    half_days: '0',
    absent_days: '0',
    base_salary: '0',
    deductions: '0',
    bonus: '0',
    notes: '',
  });
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch active staff
      const { data: staffData, error: staffError } = await supabase
        .from('staff')
        .select('id, name, designation, base_salary')
        .eq('is_active', true)
        .order('name');

      if (staffError) throw staffError;
      setStaffList(staffData || []);

      // Fetch payroll for selected month
      const { data: payrollData, error: payrollError } = await supabase
        .from('payroll')
        .select('*')
        .eq('month', selectedMonth)
        .eq('year', selectedYear);

      if (payrollError) throw payrollError;

      // Merge staff info with payroll
      const mergedRecords = (payrollData || []).map((record) => ({
        ...record,
        staff: staffData?.find((s) => s.id === record.staff_id),
      }));

      setPayrollRecords(mergedRecords);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch payroll data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const generatePayroll = async () => {
    try {
      // Get attendance data for the month
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-31`;

      const { data: attendanceData, error: attendanceError } = await supabase
        .from('attendance')
        .select('*')
        .gte('date', startDate)
        .lte('date', endDate);

      if (attendanceError) throw attendanceError;

      // Calculate payroll for each staff
      const payrollInserts = staffList.map((staff) => {
        const staffAttendance = attendanceData?.filter((a) => a.staff_id === staff.id) || [];
        
        const presentDays = staffAttendance.filter((a) => a.status === 'present').length;
        const halfDays = staffAttendance.filter((a) => a.status === 'half_day').length;
        const absentDays = staffAttendance.filter((a) => a.status === 'absent').length;
        
        const workingDays = 26; // Default working days
        const effectiveDays = presentDays + (halfDays * 0.5);
        const dailyRate = staff.base_salary / workingDays;
        const grossSalary = effectiveDays * dailyRate;
        const netSalary = Math.round(grossSalary);

        return {
          staff_id: staff.id,
          month: selectedMonth,
          year: selectedYear,
          working_days: workingDays,
          present_days: presentDays,
          half_days: halfDays,
          absent_days: absentDays,
          base_salary: staff.base_salary,
          deductions: 0,
          bonus: 0,
          net_salary: netSalary,
          is_paid: false,
        };
      });

      // Delete existing payroll for this month
      await supabase
        .from('payroll')
        .delete()
        .eq('month', selectedMonth)
        .eq('year', selectedYear);

      // Insert new payroll records
      const { error: insertError } = await supabase.from('payroll').insert(payrollInserts);

      if (insertError) throw insertError;

      toast({ title: 'Success', description: 'Payroll generated successfully' });
      fetchData();
    } catch (error) {
      console.error('Error generating payroll:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate payroll',
        variant: 'destructive',
      });
    }
  };

  const openEditDialog = (record: PayrollRecord) => {
    setSelectedPayroll(record);
    setFormData({
      working_days: record.working_days.toString(),
      present_days: record.present_days.toString(),
      half_days: record.half_days.toString(),
      absent_days: record.absent_days.toString(),
      base_salary: record.base_salary.toString(),
      deductions: record.deductions.toString(),
      bonus: record.bonus.toString(),
      notes: record.notes || '',
    });
    setIsDialogOpen(true);
  };

  const calculateNetSalary = () => {
    const workingDays = parseFloat(formData.working_days) || 26;
    const presentDays = parseFloat(formData.present_days) || 0;
    const halfDays = parseFloat(formData.half_days) || 0;
    const baseSalary = parseFloat(formData.base_salary) || 0;
    const deductions = parseFloat(formData.deductions) || 0;
    const bonus = parseFloat(formData.bonus) || 0;

    const effectiveDays = presentDays + (halfDays * 0.5);
    const dailyRate = baseSalary / workingDays;
    const grossSalary = effectiveDays * dailyRate;
    const netSalary = grossSalary - deductions + bonus;

    return Math.round(netSalary);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayroll) return;

    try {
      const { error } = await supabase
        .from('payroll')
        .update({
          working_days: parseInt(formData.working_days),
          present_days: parseInt(formData.present_days),
          half_days: parseInt(formData.half_days),
          absent_days: parseInt(formData.absent_days),
          base_salary: parseFloat(formData.base_salary),
          deductions: parseFloat(formData.deductions),
          bonus: parseFloat(formData.bonus),
          net_salary: calculateNetSalary(),
          notes: formData.notes || null,
        })
        .eq('id', selectedPayroll.id);

      if (error) throw error;

      toast({ title: 'Success', description: 'Payroll updated successfully' });
      setIsDialogOpen(false);
      fetchData();
    } catch (error) {
      console.error('Error updating payroll:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payroll',
        variant: 'destructive',
      });
    }
  };

  const markAsPaid = async (recordId: string) => {
    try {
      const { error } = await supabase
        .from('payroll')
        .update({
          is_paid: true,
          paid_date: new Date().toISOString().split('T')[0],
        })
        .eq('id', recordId);

      if (error) throw error;

      toast({ title: 'Success', description: 'Marked as paid' });
      fetchData();
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast({
        title: 'Error',
        description: 'Failed to update payment status',
        variant: 'destructive',
      });
    }
  };

  const totalPayroll = payrollRecords.reduce((sum, r) => sum + Number(r.net_salary), 0);
  const paidAmount = payrollRecords
    .filter((r) => r.is_paid)
    .reduce((sum, r) => sum + Number(r.net_salary), 0);
  const pendingAmount = totalPayroll - paidAmount;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Payroll</h1>
          <p className="text-muted-foreground">Manage salary payments in Indian Rupees (₹)</p>
        </div>
        <Button onClick={generatePayroll}>
          <Calculator className="h-4 w-4 mr-2" />
          Generate Payroll
        </Button>
      </div>

      {/* Month/Year Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, index) => (
                  <SelectItem key={index} value={(index + 1).toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <IndianRupee className="h-8 w-8 text-primary" />
              <div>
                <div className="text-2xl font-bold text-foreground">
                  ₹{totalPayroll.toLocaleString('en-IN')}
                </div>
                <p className="text-sm text-muted-foreground">Total Payroll</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <Check className="h-8 w-8 text-chart-1" />
              <div>
                <div className="text-2xl font-bold text-chart-1">
                  ₹{paidAmount.toLocaleString('en-IN')}
                </div>
                <p className="text-sm text-muted-foreground">Paid</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <IndianRupee className="h-8 w-8 text-chart-4" />
              <div>
                <div className="text-2xl font-bold text-chart-4">
                  ₹{pendingAmount.toLocaleString('en-IN')}
                </div>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Payroll for {months[selectedMonth - 1]} {selectedYear}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : payrollRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No payroll records. Click "Generate Payroll" to create records based on attendance.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff</TableHead>
                    <TableHead>Present</TableHead>
                    <TableHead>Half Days</TableHead>
                    <TableHead>Absent</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payrollRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <span className="font-medium">{record.staff?.name || 'Unknown'}</span>
                            <p className="text-xs text-muted-foreground">
                              {record.staff?.designation || '-'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{record.present_days}</TableCell>
                      <TableCell>{record.half_days}</TableCell>
                      <TableCell>{record.absent_days}</TableCell>
                      <TableCell>₹{Number(record.base_salary).toLocaleString('en-IN')}</TableCell>
                      <TableCell>₹{Number(record.deductions).toLocaleString('en-IN')}</TableCell>
                      <TableCell>₹{Number(record.bonus).toLocaleString('en-IN')}</TableCell>
                      <TableCell className="font-bold">
                        ₹{Number(record.net_salary).toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={record.is_paid ? 'default' : 'secondary'}>
                          {record.is_paid ? 'Paid' : 'Pending'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(record)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          {!record.is_paid && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => markAsPaid(record.id)}
                            >
                              Mark Paid
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Payroll</DialogTitle>
            <DialogDescription>
              Update payroll details for {selectedPayroll?.staff?.name}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Working Days</Label>
                <Input
                  type="number"
                  value={formData.working_days}
                  onChange={(e) => setFormData({ ...formData, working_days: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Present Days</Label>
                <Input
                  type="number"
                  value={formData.present_days}
                  onChange={(e) => setFormData({ ...formData, present_days: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Half Days</Label>
                <Input
                  type="number"
                  value={formData.half_days}
                  onChange={(e) => setFormData({ ...formData, half_days: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Absent Days</Label>
                <Input
                  type="number"
                  value={formData.absent_days}
                  onChange={(e) => setFormData({ ...formData, absent_days: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Base Salary (₹)</Label>
                <Input
                  type="number"
                  value={formData.base_salary}
                  onChange={(e) => setFormData({ ...formData, base_salary: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Deductions (₹)</Label>
                <Input
                  type="number"
                  value={formData.deductions}
                  onChange={(e) => setFormData({ ...formData, deductions: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Bonus (₹)</Label>
                <Input
                  type="number"
                  value={formData.bonus}
                  onChange={(e) => setFormData({ ...formData, bonus: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Net Salary (₹)</Label>
                <div className="text-2xl font-bold text-primary">
                  ₹{calculateNetSalary().toLocaleString('en-IN')}
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Optional notes"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Changes</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Payroll;
