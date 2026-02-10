import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Download, Share2, Search, Filter, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { formatCurrency, formatCurrencyForPDF } from '@/lib/formatUtils';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface YearlyDataSectionProps {
  onBack: () => void;
  category?: 'petroleum' | 'crusher' | 'office';
}

interface StaffMember {
  id: string;
  name: string;
  category: string;
  type: 'staff' | 'mlt';
}

interface MonthlyData {
  month: number;
  shifts: number;
  advances: number;
}

interface YearlyReport {
  staff: StaffMember;
  monthlyData: MonthlyData[];
  totalShifts: number;
  totalAdvances: number;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

const FULL_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const YearlyDataSection = ({ onBack, category }: YearlyDataSectionProps) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<YearlyReport | null>(null);
  const [yearlyData, setYearlyData] = useState<YearlyReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchYearlyData = async () => {
    setIsLoading(true);
    try {
      // Fetch regular staff
      let staffQuery = supabase
        .from('staff')
        .select('id, name, category')
        .eq('is_active', true);
      if (category) staffQuery = staffQuery.eq('category', category);
      const { data: staffData } = await staffQuery;

      let allStaff: StaffMember[] = [
        ...(staffData || []).map(s => ({ ...s, type: 'staff' as const })),
      ];

      // Only include MLT staff when no category filter
      if (!category) {
        const { data: mltData } = await supabase
          .from('mlt_staff')
          .select('id, name, category')
          .eq('is_active', true);
        allStaff = [
          ...allStaff,
          ...(mltData || []).map(s => ({ ...s, type: 'mlt' as const })),
        ];
      }

      const startDate = `${selectedYear}-01-01`;
      const endDate = `${selectedYear}-12-31`;

      // Fetch attendance for regular staff
      const { data: attendance } = await supabase
        .from('attendance')
        .select('staff_id, date, shift_count')
        .gte('date', startDate)
        .lte('date', endDate)
        .in('status', ['present', 'half_day']);

      // Fetch attendance for MLT staff
      const { data: mltAttendance } = await supabase
        .from('mlt_attendance')
        .select('staff_id, date, shift_count')
        .gte('date', startDate)
        .lte('date', endDate)
        .in('status', ['present', 'half_day']);

      // Fetch advances for regular staff
      const { data: advances } = await supabase
        .from('advances')
        .select('staff_id, date, amount')
        .gte('date', startDate)
        .lte('date', endDate);

      // Fetch advances for MLT staff
      const { data: mltAdvances } = await supabase
        .from('mlt_advances')
        .select('staff_id, date, amount')
        .gte('date', startDate)
        .lte('date', endDate);

      // Calculate yearly data for each staff
      const reports: YearlyReport[] = allStaff.map(staff => {
        const monthlyData: MonthlyData[] = [];
        let totalShifts = 0;
        let totalAdvances = 0;

        for (let month = 1; month <= 12; month++) {
          const staffAttendance = staff.type === 'staff'
            ? (attendance || []).filter(a => 
                a.staff_id === staff.id && 
                new Date(a.date).getMonth() + 1 === month
              )
            : (mltAttendance || []).filter(a => 
                a.staff_id === staff.id && 
                new Date(a.date).getMonth() + 1 === month
              );
          
          const monthShifts = staffAttendance.reduce((sum, a) => sum + (a.shift_count || 1), 0);
          
          const staffAdvances = staff.type === 'staff'
            ? (advances || []).filter(a => 
                a.staff_id === staff.id && 
                new Date(a.date).getMonth() + 1 === month
              )
            : (mltAdvances || []).filter(a => 
                a.staff_id === staff.id && 
                new Date(a.date).getMonth() + 1 === month
              );
          
          const monthAdvances = staffAdvances.reduce((sum, a) => sum + Number(a.amount), 0);
          
          monthlyData.push({ month, shifts: monthShifts, advances: monthAdvances });
          totalShifts += monthShifts;
          totalAdvances += monthAdvances;
        }

        return { staff, monthlyData, totalShifts, totalAdvances };
      });

      setYearlyData(reports);
    } catch (error) {
      console.error('Error fetching yearly data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load yearly data',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchYearlyData();
  }, [selectedYear]);

  const filteredData = useMemo(() => {
    return yearlyData.filter(item => {
      return item.staff.name.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [yearlyData, searchQuery]);

  const exportStaffPDF = (report: YearlyReport) => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`Yearly Report - ${report.staff.name}`, 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Year: ${selectedYear}`, 14, 30);
    doc.text(`Category: ${report.staff.category.toUpperCase()}`, 14, 37);
    doc.text(`Generated: ${format(new Date(), 'dd/MM/yyyy HH:mm')}`, 14, 44);
    
    const tableData = report.monthlyData.map(m => [
      FULL_MONTHS[m.month - 1],
      m.shifts.toString(),
      formatCurrencyForPDF(m.advances),
    ]);

    // Add total row
    tableData.push([
      'TOTAL',
      report.totalShifts.toString(),
      formatCurrencyForPDF(report.totalAdvances),
    ]);

    autoTable(doc, {
      head: [['Month', 'Shifts Worked', 'Advances Taken']],
      body: tableData,
      startY: 52,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [59, 130, 246] },
      footStyles: { fillColor: [34, 197, 94], fontStyle: 'bold' },
    });

    doc.save(`Yearly_Report_${report.staff.name}_${selectedYear}.pdf`);
    toast({ title: 'PDF Downloaded', description: `${report.staff.name}'s yearly report exported` });
  };

  const shareStaffWhatsApp = (report: YearlyReport) => {
    let message = `📊 *Yearly Report - ${report.staff.name}*\n`;
    message += `📅 Year: ${selectedYear}\n`;
    message += `🏷️ Category: ${report.staff.category.toUpperCase()}\n\n`;
    message += `*Monthly Breakdown:*\n`;
    
    report.monthlyData.forEach(m => {
      if (m.shifts > 0 || m.advances > 0) {
        message += `${MONTHS[m.month - 1]}: ${m.shifts} shifts, ₹${m.advances.toLocaleString('en-IN')}\n`;
      }
    });
    
    message += `\n*Yearly Total:*\n`;
    message += `📈 Total Shifts: ${report.totalShifts}\n`;
    message += `💰 Total Advances: ₹${report.totalAdvances.toLocaleString('en-IN')}`;
    
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (selectedStaff) {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="flex items-center gap-3 p-4">
            <Button variant="ghost" size="icon" onClick={() => setSelectedStaff(null)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold">{selectedStaff.staff.name}</h1>
              <p className="text-xs text-muted-foreground capitalize">{selectedStaff.staff.category} • {selectedYear}</p>
            </div>
            <Button variant="outline" size="icon" onClick={() => exportStaffPDF(selectedStaff)}>
              <Download className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={() => shareStaffWhatsApp(selectedStaff)}>
              <Share2 className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-blue-50 dark:bg-blue-950">
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 mx-auto text-blue-600 mb-2" />
                <p className="text-2xl font-bold text-blue-600">{selectedStaff.totalShifts}</p>
                <p className="text-xs text-muted-foreground">Total Shifts</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-50 dark:bg-orange-950">
              <CardContent className="p-4 text-center">
                <Calendar className="h-8 w-8 mx-auto text-orange-600 mb-2" />
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(selectedStaff.totalAdvances)}</p>
                <p className="text-xs text-muted-foreground">Total Advances</p>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Breakdown */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-3">Monthly Breakdown</h3>
              <div className="space-y-2">
                {selectedStaff.monthlyData.map(m => (
                  <div key={m.month} className="flex justify-between items-center py-2 border-b last:border-0">
                    <span className="font-medium">{FULL_MONTHS[m.month - 1]}</span>
                    <div className="flex gap-4 text-sm">
                      <span className="text-blue-600">{m.shifts} shifts</span>
                      <span className="text-orange-600">{formatCurrency(m.advances)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b">
        <div className="flex items-center gap-3 p-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold">Yearly Data</h1>
            <p className="text-xs text-muted-foreground">View & export yearly reports</p>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
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
          
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>


        {/* Staff List */}
        <div className="space-y-2">
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No staff found</div>
          ) : (
            filteredData.map((item) => (
              <Card 
                key={`${item.staff.type}-${item.staff.id}`}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedStaff(item)}
              >
                <CardContent className="p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-medium">{item.staff.name}</h3>
                      <p className="text-xs text-muted-foreground capitalize">{item.staff.category}</p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="mb-1">{item.totalShifts} shifts</Badge>
                      <p className="text-sm font-medium text-orange-600">{formatCurrency(item.totalAdvances)}</p>
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

export default YearlyDataSection;
