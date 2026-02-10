import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Calculator, Download, Share2, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatCurrencyForPDF } from '@/lib/formatUtils';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SalarySectionProps {
  onBack: () => void;
  category?: 'petroleum' | 'crusher' | 'office';
}

interface StaffMember {
  id: string;
  name: string;
  category: string;
  shift_rate: number;
  type: 'staff' | 'mlt';
}

interface SalaryData {
  staff: StaffMember;
  totalShifts: number;
  grossSalary: number;
  totalAdvances: number;
  pendingAmount: number;
  isPaid: boolean;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const SalarySection = ({ onBack, category }: SalarySectionProps) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [salaryData, setSalaryData] = useState<SalaryData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchSalaryData = async () => {
    setIsLoading(true);
    try {
      // Fetch regular staff
      let staffQuery = supabase
        .from('staff')
        .select('id, name, category, shift_rate')
        .eq('is_active', true);
      if (category) staffQuery = staffQuery.eq('category', category);
      const { data: staffData } = await staffQuery;

      // Only include MLT staff when no category filter (manager global view)
      let allStaff: StaffMember[] = [
        ...(staffData || []).map(s => ({ ...s, type: 'staff' as const, shift_rate: Number(s.shift_rate) || 0 })),
      ];

      if (!category) {
        const { data: mltData } = await supabase
          .from('mlt_staff')
          .select('id, name, category, shift_rate')
          .eq('is_active', true);
        allStaff = [
          ...allStaff,
          ...(mltData || []).map(s => ({ ...s, type: 'mlt' as const, shift_rate: Number(s.shift_rate) || 0 })),
        ];
      }

      // Get date range for the month
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-31`;

      // Fetch attendance for regular staff
      const { data: attendance } = await supabase
        .from('attendance')
        .select('staff_id, shift_count')
        .gte('date', startDate)
        .lte('date', endDate)
        .in('status', ['present', 'half_day']);

      // Fetch attendance for MLT staff
      const { data: mltAttendance } = await supabase
        .from('mlt_attendance')
        .select('staff_id, shift_count')
        .gte('date', startDate)
        .lte('date', endDate)
        .in('status', ['present', 'half_day']);

      // Fetch advances for regular staff
      const { data: advances } = await supabase
        .from('advances')
        .select('staff_id, amount, is_deducted')
        .gte('date', startDate)
        .lte('date', endDate);

      // Fetch advances for MLT staff
      const { data: mltAdvances } = await supabase
        .from('mlt_advances')
        .select('staff_id, amount, is_deducted')
        .gte('date', startDate)
        .lte('date', endDate);

      // Fetch payroll records
      const { data: payroll } = await supabase
        .from('payroll')
        .select('staff_id, is_paid')
        .eq('month', selectedMonth)
        .eq('year', selectedYear);

      // Calculate salary data for each staff
      const calculatedData: SalaryData[] = allStaff.map(staff => {
        const staffAttendance = staff.type === 'staff' 
          ? (attendance || []).filter(a => a.staff_id === staff.id)
          : (mltAttendance || []).filter(a => a.staff_id === staff.id);
        
        const totalShifts = staffAttendance.reduce((sum, a) => sum + (a.shift_count || 1), 0);
        
        const staffAdvances = staff.type === 'staff'
          ? (advances || []).filter(a => a.staff_id === staff.id)
          : (mltAdvances || []).filter(a => a.staff_id === staff.id);
        
        const totalAdvances = staffAdvances.reduce((sum, a) => sum + Number(a.amount), 0);
        
        const grossSalary = totalShifts * staff.shift_rate;
        const pendingAmount = grossSalary - totalAdvances;
        
        const isPaid = (payroll || []).some(p => p.staff_id === staff.id && p.is_paid);

        return {
          staff,
          totalShifts,
          grossSalary,
          totalAdvances,
          pendingAmount,
          isPaid,
        };
      });

      setSalaryData(calculatedData);
    } catch (error) {
      console.error('Error fetching salary data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load salary data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSalaryData();
  }, [selectedMonth, selectedYear]);

  const filteredData = useMemo(() => {
    return salaryData.filter(item => {
      return item.staff.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [salaryData, searchQuery]);

  const totals = useMemo(() => {
    return filteredData.reduce((acc, item) => ({
      shifts: acc.shifts + item.totalShifts,
      gross: acc.gross + item.grossSalary,
      advances: acc.advances + item.totalAdvances,
      pending: acc.pending + item.pendingAmount,
    }), { shifts: 0, gross: 0, advances: 0, pending: 0 });
  }, [filteredData]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    const monthName = MONTHS[selectedMonth - 1];
    
    doc.setFontSize(18);
    doc.text(`Salary Report - ${monthName} ${selectedYear}`, 14, 20);
    
    doc.setFontSize(10);
    doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 28);
    
    const tableData = filteredData.map(item => [
      item.staff.name,
      item.staff.category.toUpperCase(),
      item.totalShifts.toString(),
      `Rs. ${item.grossSalary.toLocaleString('en-IN')}`,
      `Rs. ${item.totalAdvances.toLocaleString('en-IN')}`,
      `Rs. ${item.pendingAmount.toLocaleString('en-IN')}`,
      item.isPaid ? 'PAID' : 'PENDING',
    ]);

    autoTable(doc, {
      head: [['Name', 'Category', 'Shifts', 'Gross Salary', 'Advances', 'Pending', 'Status']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total Gross: Rs. ${totals.gross.toLocaleString('en-IN')}`, 14, finalY);
    doc.text(`Total Advances: Rs. ${totals.advances.toLocaleString('en-IN')}`, 14, finalY + 7);
    doc.text(`Total Pending: Rs. ${totals.pending.toLocaleString('en-IN')}`, 14, finalY + 14);

    doc.save(`Salary_Report_${monthName}_${selectedYear}.pdf`);
    toast({ title: 'PDF Downloaded', description: 'Salary report exported successfully' });
  };

  const shareOnWhatsApp = () => {
    const monthName = MONTHS[selectedMonth - 1];
    let message = `📊 *Salary Report - ${monthName} ${selectedYear}*\n\n`;
    
    filteredData.forEach(item => {
      message += `👤 ${item.staff.name} (${item.staff.category})\n`;
      message += `   Shifts: ${item.totalShifts} | Gross: ₹${item.grossSalary.toLocaleString('en-IN')}\n`;
      message += `   Advances: ₹${item.totalAdvances.toLocaleString('en-IN')} | Pending: ₹${item.pendingAmount.toLocaleString('en-IN')}\n\n`;
    });
    
    message += `\n💰 *Summary*\n`;
    message += `Total Gross: ₹${totals.gross.toLocaleString('en-IN')}\n`;
    message += `Total Advances: ₹${totals.advances.toLocaleString('en-IN')}\n`;
    message += `Total Pending: ₹${totals.pending.toLocaleString('en-IN')}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Salary Calculator</h1>
            <p className="text-xs text-muted-foreground">Calculate & manage salaries</p>
          </div>
          <Button variant="outline" size="icon" onClick={exportToPDF}>
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={shareOnWhatsApp}>
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Month" />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, idx) => (
                <SelectItem key={idx} value={String(idx + 1)}>{month}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-24">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="bg-blue-50 dark:bg-blue-950">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Total Gross</p>
              <p className="text-lg font-bold text-blue-600">{formatCurrency(totals.gross)}</p>
            </CardContent>
          </Card>
          <Card className="bg-orange-50 dark:bg-orange-950">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Total Advances</p>
              <p className="text-lg font-bold text-orange-600">{formatCurrency(totals.advances)}</p>
            </CardContent>
          </Card>
          <Card className="bg-green-50 dark:bg-green-950">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Total Pending</p>
              <p className="text-lg font-bold text-green-600">{formatCurrency(totals.pending)}</p>
            </CardContent>
          </Card>
          <Card className="bg-purple-50 dark:bg-purple-950">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Total Shifts</p>
              <p className="text-lg font-bold text-purple-600">{totals.shifts}</p>
            </CardContent>
          </Card>
        </div>

        {/* Staff List */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No staff found</div>
          ) : (
            filteredData.map((item) => (
              <Card key={`${item.staff.type}-${item.staff.id}`}>
                <CardContent className="p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{item.staff.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">
                        {item.staff.category} • Rate: {formatCurrency(item.staff.shift_rate)}/shift
                      </p>
                    </div>
                    <Badge variant={item.isPaid ? 'default' : 'secondary'}>
                      {item.isPaid ? 'Paid' : 'Pending'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2 text-center text-xs mt-3">
                    <div className="bg-muted/50 rounded p-2">
                      <p className="text-muted-foreground">Shifts</p>
                      <p className="font-semibold">{item.totalShifts}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-950 rounded p-2">
                      <p className="text-muted-foreground">Gross</p>
                      <p className="font-semibold text-blue-600">{formatCurrency(item.grossSalary)}</p>
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-950 rounded p-2">
                      <p className="text-muted-foreground">Advances</p>
                      <p className="font-semibold text-orange-600">{formatCurrency(item.totalAdvances)}</p>
                    </div>
                    <div className="bg-green-50 dark:bg-green-950 rounded p-2">
                      <p className="text-muted-foreground">Pending</p>
                      <p className="font-semibold text-green-600">{formatCurrency(item.pendingAmount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default SalarySection;
