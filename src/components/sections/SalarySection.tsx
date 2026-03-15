import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Download, Share2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatCurrencyForPDF, getShiftRateForMonth } from '@/lib/formatUtils';
import { format, startOfMonth, endOfMonth } from 'date-fns';
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
  shift_rate_28: number | null;
  shift_rate_30: number | null;
  shift_rate_31: number | null;
  type: 'staff' | 'mlt';
}

interface SalaryData {
  staff: StaffMember;
  totalShifts: number;
  shiftRate: number;
  shiftAmount: number;
  totalAdvances: number;
  payable: number;
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
      let staffQuery = supabase.from('staff').select('id, name, category, shift_rate, shift_rate_28, shift_rate_30, shift_rate_31').eq('is_active', true);
      if (category) staffQuery = staffQuery.eq('category', category);
      const { data: staffData } = await staffQuery;

      let allStaff: StaffMember[] = (staffData || []).map(s => ({ ...s, type: 'staff' as const, shift_rate: Number(s.shift_rate) || 0 }));

      if (!category) {
        const { data: mltData } = await supabase.from('mlt_staff').select('id, name, category, shift_rate, shift_rate_28, shift_rate_30, shift_rate_31').eq('is_active', true);
        allStaff = [...allStaff, ...(mltData || []).map(s => ({ ...s, type: 'mlt' as const, shift_rate: Number(s.shift_rate) || 0 }))];
      }

      const startDate = format(startOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');

      const [attRes, mltAttRes, advRes, mltAdvRes] = await Promise.all([
        supabase.from('attendance').select('staff_id, shift_count').gte('date', startDate).lte('date', endDate).in('status', ['present', 'half_day']),
        supabase.from('mlt_attendance').select('staff_id, shift_count').gte('date', startDate).lte('date', endDate).in('status', ['present', 'half_day']),
        supabase.from('advances').select('staff_id, amount').gte('date', startDate).lte('date', endDate),
        supabase.from('mlt_advances').select('staff_id, amount').gte('date', startDate).lte('date', endDate),
      ]);

      const calculatedData: SalaryData[] = allStaff.map(staff => {
        const attendance = staff.type === 'staff'
          ? (attRes.data || []).filter(a => a.staff_id === staff.id)
          : (mltAttRes.data || []).filter(a => a.staff_id === staff.id);
        const totalShifts = attendance.reduce((sum, a) => sum + (a.shift_count || 1), 0);
        const shiftRate = getShiftRateForMonth(staff, selectedMonth, selectedYear);
        const shiftAmount = totalShifts * shiftRate;

        const advances = staff.type === 'staff'
          ? (advRes.data || []).filter(a => a.staff_id === staff.id)
          : (mltAdvRes.data || []).filter(a => a.staff_id === staff.id);
        const totalAdvances = advances.reduce((sum, a) => sum + Number(a.amount), 0);

        const payable = shiftAmount - totalAdvances;

        return { staff, totalShifts, shiftRate, shiftAmount, totalAdvances, payable };
      });

      setSalaryData(calculatedData);
    } catch (error) {
      console.error('Error fetching salary data:', error);
      toast({ title: 'Error', description: 'Failed to load salary data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchSalaryData(); }, [selectedMonth, selectedYear]);

  const filteredData = useMemo(() => {
    return salaryData.filter(item => item.staff.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [salaryData, searchQuery]);

  const totals = useMemo(() => {
    return filteredData.reduce((acc, item) => ({
      shifts: acc.shifts + item.totalShifts,
      payable: acc.payable + item.payable,
      advances: acc.advances + item.totalAdvances,
    }), { shifts: 0, payable: 0, advances: 0 });
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
      `Rs. ${item.shiftRate}/shift`,
      item.totalShifts.toString(),
      `Rs. ${item.shiftAmount.toLocaleString('en-IN')}`,
      `Rs. ${item.totalAdvances.toLocaleString('en-IN')}`,
      `Rs. ${item.payable.toLocaleString('en-IN')}`,
    ]);

    autoTable(doc, {
      head: [['Name', 'Rate', 'Shifts', 'Shift Amt', 'Advances', 'Payable']],
      body: tableData,
      startY: 35,
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59, 130, 246] },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.text(`Total Payable: Rs. ${totals.payable.toLocaleString('en-IN')}`, 14, finalY);
    doc.text(`Total Advances: Rs. ${totals.advances.toLocaleString('en-IN')}`, 14, finalY + 7);
    doc.save(`Salary_Report_${monthName}_${selectedYear}.pdf`);
    toast({ title: 'PDF Downloaded' });
  };

  const shareOnWhatsApp = () => {
    const monthName = MONTHS[selectedMonth - 1];
    let message = `📊 *Salary Report - ${monthName} ${selectedYear}*\n\n`;
    filteredData.forEach(item => {
      message += `👤 *${item.staff.name}*\n`;
      message += `   ${item.totalShifts} shifts × ₹${item.shiftRate} = ₹${item.shiftAmount.toLocaleString('en-IN')}\n`;
      message += `   Advances: -₹${item.totalAdvances.toLocaleString('en-IN')}\n`;
      message += `   *Payable: ₹${item.payable.toLocaleString('en-IN')}*\n\n`;
    });
    message += `💰 *Total Payable: ₹${totals.payable.toLocaleString('en-IN')}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Salary Calculator</h1>
            <p className="text-xs text-muted-foreground">Shifts × Rate − Advances = Payable</p>
          </div>
          <Button variant="outline" size="icon" onClick={exportToPDF}><Download className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={shareOnWhatsApp}><Share2 className="h-4 w-4" /></Button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex gap-2">
          <Select value={String(selectedMonth)} onValueChange={(v) => setSelectedMonth(Number(v))}>
            <SelectTrigger className="flex-1"><SelectValue placeholder="Month" /></SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, idx) => (<SelectItem key={idx} value={String(idx + 1)}>{month}</SelectItem>))}
            </SelectContent>
          </Select>
          <Select value={String(selectedYear)} onValueChange={(v) => setSelectedYear(Number(v))}>
            <SelectTrigger className="w-24"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026].map(year => (<SelectItem key={year} value={String(year)}>{year}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search staff..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
        </div>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="bg-primary/10">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Total Payable</p>
              <p className="text-lg font-bold text-primary">{formatCurrency(totals.payable)}</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Advances</p>
              <p className="text-lg font-bold text-destructive">{formatCurrency(totals.advances)}</p>
            </CardContent>
          </Card>
          <Card className="bg-muted">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground">Shifts</p>
              <p className="text-lg font-bold">{totals.shifts}</p>
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
                <CardContent className="p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium">{item.staff.name}</h3>
                      <p className="text-xs text-muted-foreground">Rate: {formatCurrency(item.shiftRate)}/shift</p>
                    </div>
                    <p className="font-bold">{formatCurrency(item.payable)}</p>
                  </div>

                  {/* Simple Math */}
                  <div className="bg-muted/40 rounded p-2 text-xs space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span>{item.totalShifts} shifts × ₹{item.shiftRate.toLocaleString('en-IN')}</span>
                      <span>= ₹{item.shiftAmount.toLocaleString('en-IN')}</span>
                    </div>
                    {item.totalAdvances > 0 && (
                      <div className="flex justify-between text-destructive">
                        <span>− Advances</span>
                        <span>− ₹{item.totalAdvances.toLocaleString('en-IN')}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold border-t border-border pt-1">
                      <span>Payable</span>
                      <span>= ₹{item.payable.toLocaleString('en-IN')}</span>
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
