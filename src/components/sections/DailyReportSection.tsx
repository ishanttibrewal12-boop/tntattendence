import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Share2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays, subDays } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addReportNotes, REPORT_FOOTER, exportToExcel } from '@/lib/exportUtils';
import { formatFullCurrency, formatCurrencyForPDF } from '@/lib/formatUtils';

interface Staff {
  id: string;
  name: string;
  category: 'petroleum' | 'crusher' | 'office';
}

interface MLTStaff {
  id: string;
  name: string;
  category: 'driver' | 'khalasi';
}

interface AttendanceRecord {
  staff_id: string;
  status: string;
  shift_count: number | null;
}

interface Advance {
  staff_id: string;
  amount: number;
  notes: string | null;
}

interface DailyReportSectionProps {
  onBack: () => void;
  category?: 'petroleum' | 'crusher' | 'office';
}

type ExportFilter = 'all' | 'petroleum' | 'crusher' | 'office' | 'mlt' | 'sales';

const DailyReportSection = ({ onBack, category }: DailyReportSectionProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [mltStaffList, setMltStaffList] = useState<MLTStaff[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [mltAttendance, setMltAttendance] = useState<AttendanceRecord[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [mltAdvances, setMltAdvances] = useState<Advance[]>([]);
  const [petroleumSales, setPetroleumSales] = useState<{upi: number, cash: number}>({ upi: 0, cash: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dailyNote, setDailyNote] = useState('');
  const [exportFilter, setExportFilter] = useState<ExportFilter>('all');

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setIsLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const [staffRes, mltStaffRes, attendanceRes, mltAttendanceRes, advancesRes, mltAdvancesRes, salesRes] = await Promise.all([
      category 
        ? supabase.from('staff').select('id, name, category').eq('is_active', true).eq('category', category).order('name')
        : supabase.from('staff').select('id, name, category').eq('is_active', true).order('name'),
      supabase.from('mlt_staff').select('id, name, category').eq('is_active', true).order('name'),
      supabase.from('attendance').select('staff_id, status, shift_count').eq('date', dateStr),
      supabase.from('mlt_attendance').select('staff_id, status, shift_count').eq('date', dateStr),
      supabase.from('advances').select('staff_id, amount, notes').eq('date', dateStr),
      supabase.from('mlt_advances').select('staff_id, amount, notes').eq('date', dateStr),
      supabase.from('petroleum_sales').select('amount, sale_type').eq('date', dateStr),
    ]);

    if (staffRes.data) setStaffList(staffRes.data as Staff[]);
    if (mltStaffRes.data) setMltStaffList(mltStaffRes.data as MLTStaff[]);
    if (attendanceRes.data) setAttendance(attendanceRes.data as AttendanceRecord[]);
    if (mltAttendanceRes.data) setMltAttendance(mltAttendanceRes.data as AttendanceRecord[]);
    if (advancesRes.data) setAdvances(advancesRes.data as Advance[]);
    if (mltAdvancesRes.data) setMltAdvances(mltAdvancesRes.data as Advance[]);
    if (salesRes.data) {
      const upi = salesRes.data.filter((s: any) => s.sale_type === 'upi').reduce((sum: number, s: any) => sum + Number(s.amount), 0);
      const cash = salesRes.data.filter((s: any) => s.sale_type === 'cash').reduce((sum: number, s: any) => sum + Number(s.amount), 0);
      setPetroleumSales({ upi, cash });
    }
    setIsLoading(false);
  };

  const getAttendanceStatus = (staffId: string, isMlt = false) => {
    const records = isMlt ? mltAttendance : attendance;
    const record = records.find(a => a.staff_id === staffId);
    if (!record) return { text: '-', color: 'text-muted-foreground' };
    if (record.status === 'absent') return { text: 'A', color: 'text-destructive' };
    if (record.status === 'present') {
      const shifts = record.shift_count || 1;
      return { text: `${shifts}S`, color: shifts === 2 ? 'text-primary' : 'text-green-600' };
    }
    return { text: '-', color: 'text-muted-foreground' };
  };

  const getAdvanceForStaff = (staffId: string, isMlt = false) => {
    const advList = isMlt ? mltAdvances : advances;
    return advList.find(a => a.staff_id === staffId);
  };

  const getStats = () => {
    const totalShifts = attendance.filter(a => a.status === 'present').reduce((sum, a) => sum + (a.shift_count || 1), 0);
    const mltShifts = mltAttendance.filter(a => a.status === 'present').reduce((sum, a) => sum + (a.shift_count || 1), 0);
    const totalAdvance = advances.reduce((sum, a) => sum + Number(a.amount), 0) + mltAdvances.reduce((sum, a) => sum + Number(a.amount), 0);
    return { totalShifts, mltShifts, totalAdvance };
  };

  const stats = getStats();

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(direction === 'prev' ? subDays(selectedDate, 1) : addDays(selectedDate, 1));
  };

  const getFilteredData = () => {
    switch (exportFilter) {
      case 'petroleum':
        return { staff: staffList.filter(s => s.category === 'petroleum'), mlt: [], includeSales: false };
      case 'crusher':
        return { staff: staffList.filter(s => s.category === 'crusher'), mlt: [], includeSales: false };
      case 'office':
        return { staff: staffList.filter(s => s.category === 'office'), mlt: [], includeSales: false };
      case 'mlt':
        return { staff: [], mlt: mltStaffList, includeSales: false };
      case 'sales':
        return { staff: [], mlt: [], includeSales: true };
      default:
        return { staff: staffList, mlt: mltStaffList, includeSales: true };
    }
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const dateStr = format(selectedDate, 'dd MMM yyyy, EEEE');
    const filterData = getFilteredData();
    const filterName = exportFilter === 'all' ? '' : ` (${exportFilter.charAt(0).toUpperCase() + exportFilter.slice(1)})`;
    
    doc.setFontSize(18);
    doc.text(`Daily Report${filterName} - ${dateStr}`, 14, 20);
    doc.setFontSize(10);
    doc.text(REPORT_FOOTER, 14, 28);
    
    let yPos = 36;

    if (exportFilter === 'all' || exportFilter === 'sales') {
      doc.setFontSize(12);
      doc.text(`Summary: Shifts: ${stats.totalShifts + stats.mltShifts} | Advance: ${formatCurrencyForPDF(stats.totalAdvance)} | Petroleum: ${formatCurrencyForPDF(petroleumSales.upi + petroleumSales.cash)}`, 14, yPos);
      yPos += 8;
    }
    
    if (dailyNote) {
      doc.text(`Note: ${dailyNote}`, 14, yPos);
      yPos += 8;
    }

    // Staff Attendance
    if (filterData.staff.length > 0) {
      const mainData = filterData.staff.map(staff => {
        const status = getAttendanceStatus(staff.id);
        const adv = getAdvanceForStaff(staff.id);
        return [staff.name, staff.category, status.text, adv ? formatCurrencyForPDF(Number(adv.amount)) : '-'];
      });

      autoTable(doc, {
        head: [['Name', 'Category', 'Status', 'Advance']],
        body: mainData,
        startY: yPos,
        styles: { fontSize: 8 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // MLT Staff
    if (filterData.mlt.length > 0) {
      doc.text('MLT Staff:', 14, yPos);
      const mltData = filterData.mlt.map(staff => {
        const status = getAttendanceStatus(staff.id, true);
        const adv = getAdvanceForStaff(staff.id, true);
        return [staff.name, staff.category, status.text, adv ? formatCurrencyForPDF(Number(adv.amount)) : '-'];
      });

      autoTable(doc, {
        head: [['Name', 'Category', 'Status', 'Advance']],
        body: mltData,
        startY: yPos + 4,
        styles: { fontSize: 8 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 10;
    }

    // Sales
    if (filterData.includeSales && (petroleumSales.upi > 0 || petroleumSales.cash > 0)) {
      doc.text('Petroleum Sales:', 14, yPos);
      autoTable(doc, {
        head: [['Type', 'Amount']],
        body: [
          ['UPI', formatCurrencyForPDF(petroleumSales.upi)],
          ['Cash', formatCurrencyForPDF(petroleumSales.cash)],
          ['Total', formatCurrencyForPDF(petroleumSales.upi + petroleumSales.cash)],
        ],
        startY: yPos + 4,
        styles: { fontSize: 8 },
      });
    }

    const finalY = (doc as any).lastAutoTable?.finalY + 15 || yPos + 15;
    addReportNotes(doc, finalY);
    doc.save(`daily-report-${exportFilter}-${format(selectedDate, 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF downloaded');
  };

  const exportToExcelFile = () => {
    const filterData = getFilteredData();
    const dateStr = format(selectedDate, 'dd MMM yyyy');
    
    const data: any[][] = [];
    
    filterData.staff.forEach(staff => {
      const status = getAttendanceStatus(staff.id);
      const adv = getAdvanceForStaff(staff.id);
      data.push([staff.name, staff.category, status.text, adv ? Number(adv.amount) : 0]);
    });

    filterData.mlt.forEach(staff => {
      const status = getAttendanceStatus(staff.id, true);
      const adv = getAdvanceForStaff(staff.id, true);
      data.push([staff.name, `MLT-${staff.category}`, status.text, adv ? Number(adv.amount) : 0]);
    });

    exportToExcel(data, ['Name', 'Category', 'Status', 'Advance'], `daily-report-${exportFilter}-${format(selectedDate, 'yyyy-MM-dd')}`, 'Report', `Daily Report - ${dateStr}`);
    toast.success('Excel downloaded');
  };

  const shareToWhatsApp = () => {
    const dateStr = format(selectedDate, 'dd MMM yyyy, EEEE');
    const filterData = getFilteredData();
    const filterName = exportFilter === 'all' ? '' : ` (${exportFilter.charAt(0).toUpperCase() + exportFilter.slice(1)})`;
    
    let message = `📋 *Daily Report${filterName} - ${dateStr}*\n\n`;
    
    if (exportFilter === 'all' || exportFilter === 'sales') {
      message += `*Summary*\n`;
      message += `📊 Total Shifts: ${stats.totalShifts + stats.mltShifts}\n`;
      message += `💰 Advance Given: ${formatFullCurrency(stats.totalAdvance)}\n`;
      message += `⛽ Petroleum: ${formatFullCurrency(petroleumSales.upi + petroleumSales.cash)} (UPI: ${formatFullCurrency(petroleumSales.upi)}, Cash: ${formatFullCurrency(petroleumSales.cash)})\n\n`;
    }

    if (dailyNote) {
      message += `📝 *Note:* ${dailyNote}\n\n`;
    }

    if (filterData.staff.length > 0) {
      message += `*Staff Attendance*\n`;
      filterData.staff.forEach(staff => {
        const status = getAttendanceStatus(staff.id);
        const adv = getAdvanceForStaff(staff.id);
        message += `${staff.name}: ${status.text}${adv ? ` (₹${Number(adv.amount).toLocaleString()})` : ''}\n`;
      });
    }

    if (filterData.mlt.length > 0) {
      message += `\n*MLT Staff*\n`;
      filterData.mlt.forEach(staff => {
        const status = getAttendanceStatus(staff.id, true);
        const adv = getAdvanceForStaff(staff.id, true);
        message += `${staff.name}: ${status.text}${adv ? ` (₹${Number(adv.amount).toLocaleString()})` : ''}\n`;
      });
    }

    if (filterData.includeSales && (petroleumSales.upi > 0 || petroleumSales.cash > 0)) {
      message += `\n*Petroleum Sales*\n`;
      message += `UPI: ${formatFullCurrency(petroleumSales.upi)}\n`;
      message += `Cash: ${formatFullCurrency(petroleumSales.cash)}\n`;
    }

    message += `\n_${REPORT_FOOTER}_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-bold text-foreground">Daily Report</h1>
      </div>

      {/* Date Navigation */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigateDate('prev')}><ChevronLeft className="h-5 w-5" /></Button>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="flex flex-col items-center">
                  <p className="font-semibold text-foreground">{format(selectedDate, 'EEEE')}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />{format(selectedDate, 'dd MMM yyyy')}
                  </p>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar mode="single" selected={selectedDate} onSelect={(date) => { if (date) setSelectedDate(date); setCalendarOpen(false); }} initialFocus />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" onClick={() => navigateDate('next')}><ChevronRight className="h-5 w-5" /></Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Filter */}
      <div className="mb-4">
        <Select value={exportFilter} onValueChange={(v) => setExportFilter(v as ExportFilter)}>
          <SelectTrigger>
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter exports" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            <SelectItem value="petroleum">Petroleum Staff Only</SelectItem>
            <SelectItem value="crusher">Crusher Staff Only</SelectItem>
            <SelectItem value="office">Office Staff Only</SelectItem>
            <SelectItem value="mlt">MLT Staff Only</SelectItem>
            <SelectItem value="sales">Petroleum Sales Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Export Actions */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Button variant="secondary" size="sm" onClick={exportToPDF}><Download className="h-4 w-4 mr-1" />PDF</Button>
        <Button variant="secondary" size="sm" onClick={exportToExcelFile}><Download className="h-4 w-4 mr-1" />Excel</Button>
        <Button variant="secondary" size="sm" onClick={shareToWhatsApp}><Share2 className="h-4 w-4 mr-1" />Share</Button>
      </div>

      {/* Daily Note */}
      <Card className="mb-4">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Daily Note</CardTitle></CardHeader>
        <CardContent>
          <Textarea placeholder="Add notes for today..." value={dailyNote} onChange={(e) => setDailyNote(e.target.value)} className="min-h-[60px]" />
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Card className="bg-primary/10"><CardContent className="p-2 text-center"><p className="text-lg font-bold text-primary">{stats.totalShifts}</p><p className="text-[10px] text-muted-foreground">Main Shifts</p></CardContent></Card>
            <Card className="bg-secondary/10"><CardContent className="p-2 text-center"><p className="text-lg font-bold text-secondary">{stats.mltShifts}</p><p className="text-[10px] text-muted-foreground">MLT Shifts</p></CardContent></Card>
            <Card className="bg-destructive/10"><CardContent className="p-2 text-center"><p className="text-lg font-bold text-destructive">{formatFullCurrency(stats.totalAdvance)}</p><p className="text-[10px] text-muted-foreground">Advance</p></CardContent></Card>
          </div>

          {/* Petroleum */}
          <Card className="mb-4 bg-chart-3/10">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground mb-1">⛽ Petroleum Sales</p>
              <div className="flex justify-between text-sm">
                <span>UPI: {formatFullCurrency(petroleumSales.upi)}</span>
                <span>Cash: {formatFullCurrency(petroleumSales.cash)}</span>
                <span className="font-bold">Total: {formatFullCurrency(petroleumSales.upi + petroleumSales.cash)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Main Staff */}
          <Card className="mb-4">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Staff ({staffList.length})</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-48 overflow-y-auto">
                {['petroleum', 'crusher', 'office'].map(cat => {
                  const catStaff = staffList.filter(s => s.category === cat);
                  if (catStaff.length === 0) return null;
                  return (
                    <div key={cat}>
                      <p className="text-xs font-medium text-muted-foreground capitalize mt-2 mb-1">{cat}</p>
                      {catStaff.map(staff => {
                        const status = getAttendanceStatus(staff.id);
                        const adv = getAdvanceForStaff(staff.id);
                        return (
                          <div key={staff.id} className="flex justify-between text-sm py-0.5">
                            <span className="truncate flex-1">{staff.name}</span>
                            {adv && <span className="text-destructive text-xs mr-2">₹{Number(adv.amount).toLocaleString()}</span>}
                            <span className={`font-medium ${status.color}`}>{status.text}</span>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* MLT Staff */}
          {mltStaffList.length > 0 && (
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm">MLT ({mltStaffList.length})</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {['driver', 'khalasi'].map(cat => {
                    const catStaff = mltStaffList.filter(s => s.category === cat);
                    if (catStaff.length === 0) return null;
                    return (
                      <div key={cat}>
                        <p className="text-xs font-medium text-muted-foreground capitalize mt-2 mb-1">{cat}</p>
                        {catStaff.map(staff => {
                          const status = getAttendanceStatus(staff.id, true);
                          const adv = getAdvanceForStaff(staff.id, true);
                          return (
                            <div key={staff.id} className="flex justify-between text-sm py-0.5">
                              <span className="truncate flex-1">{staff.name}</span>
                              {adv && <span className="text-destructive text-xs mr-2">₹{Number(adv.amount).toLocaleString()}</span>}
                              <span className={`font-medium ${status.color}`}>{status.text}</span>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default DailyReportSection;
