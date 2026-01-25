import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Share2, ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays, subDays } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addReportNotes, REPORT_FOOTER } from '@/lib/exportUtils';

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
}

const DailyReportSection = ({ onBack }: DailyReportSectionProps) => {
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

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setIsLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const [staffRes, mltStaffRes, attendanceRes, mltAttendanceRes, advancesRes, mltAdvancesRes, salesRes] = await Promise.all([
      supabase.from('staff').select('id, name, category').eq('is_active', true).order('name'),
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

  const exportToPDF = () => {
    const doc = new jsPDF();
    const dateStr = format(selectedDate, 'dd MMM yyyy, EEEE');
    
    doc.setFontSize(18);
    doc.text(`Daily Report - ${dateStr}`, 14, 20);
    doc.setFontSize(10);
    doc.text(REPORT_FOOTER, 14, 28);
    
    doc.setFontSize(12);
    doc.text(`Summary: Shifts: ${stats.totalShifts + stats.mltShifts} | Advance: ₹${stats.totalAdvance.toLocaleString()} | Petroleum: ₹${(petroleumSales.upi + petroleumSales.cash).toLocaleString()}`, 14, 40);
    
    if (dailyNote) {
      doc.text(`Note: ${dailyNote}`, 14, 50);
    }

    // Main Staff Attendance
    const mainData = staffList.map(staff => {
      const status = getAttendanceStatus(staff.id);
      const adv = advances.find(a => a.staff_id === staff.id);
      return [staff.name, staff.category, status.text, adv ? `₹${Number(adv.amount).toLocaleString()}` : '-'];
    });

    autoTable(doc, {
      head: [['Name', 'Category', 'Status', 'Advance']],
      body: mainData,
      startY: dailyNote ? 56 : 46,
      styles: { fontSize: 8 },
    });

    // MLT Staff
    if (mltStaffList.length > 0) {
      const lastY = (doc as any).lastAutoTable.finalY + 10;
      doc.text('MLT Staff:', 14, lastY);
      const mltData = mltStaffList.map(staff => {
        const status = getAttendanceStatus(staff.id, true);
        const adv = mltAdvances.find(a => a.staff_id === staff.id);
        return [staff.name, staff.category, status.text, adv ? `₹${Number(adv.amount).toLocaleString()}` : '-'];
      });

      autoTable(doc, {
        head: [['Name', 'Category', 'Status', 'Advance']],
        body: mltData,
        startY: lastY + 4,
        styles: { fontSize: 8 },
      });
    }

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    addReportNotes(doc, finalY);
    doc.save(`daily-report-${format(selectedDate, 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF downloaded');
  };

  const shareToWhatsApp = () => {
    const dateStr = format(selectedDate, 'dd MMM yyyy, EEEE');
    
    let message = `📋 *Daily Report - ${dateStr}*\n\n`;
    message += `*Summary*\n`;
    message += `📊 Total Shifts: ${stats.totalShifts + stats.mltShifts}\n`;
    message += `💰 Advance Given: ₹${stats.totalAdvance.toLocaleString()}\n`;
    message += `⛽ Petroleum: ₹${(petroleumSales.upi + petroleumSales.cash).toLocaleString()} (UPI: ₹${petroleumSales.upi.toLocaleString()}, Cash: ₹${petroleumSales.cash.toLocaleString()})\n\n`;

    if (dailyNote) {
      message += `📝 *Note:* ${dailyNote}\n\n`;
    }

    message += `*Staff Attendance*\n`;
    staffList.forEach(staff => {
      const status = getAttendanceStatus(staff.id);
      message += `${staff.name}: ${status.text}\n`;
    });

    if (mltStaffList.length > 0) {
      message += `\n*MLT Staff*\n`;
      mltStaffList.forEach(staff => {
        const status = getAttendanceStatus(staff.id, true);
        message += `${staff.name}: ${status.text}\n`;
      });
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

      {/* Export Actions */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button variant="secondary" size="sm" onClick={exportToPDF}><Download className="h-4 w-4 mr-2" />PDF</Button>
        <Button variant="secondary" size="sm" onClick={shareToWhatsApp}><Share2 className="h-4 w-4 mr-2" />WhatsApp</Button>
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
            <Card className="bg-destructive/10"><CardContent className="p-2 text-center"><p className="text-lg font-bold text-destructive">₹{stats.totalAdvance >= 1000 ? `${(stats.totalAdvance/1000).toFixed(0)}k` : stats.totalAdvance}</p><p className="text-[10px] text-muted-foreground">Advance</p></CardContent></Card>
          </div>

          {/* Petroleum */}
          <Card className="mb-4 bg-chart-3/10">
            <CardContent className="p-3">
              <p className="text-xs text-muted-foreground mb-1">⛽ Petroleum Sales</p>
              <div className="flex justify-between">
                <span>UPI: ₹{petroleumSales.upi.toLocaleString()}</span>
                <span>Cash: ₹{petroleumSales.cash.toLocaleString()}</span>
                <span className="font-bold">Total: ₹{(petroleumSales.upi + petroleumSales.cash).toLocaleString()}</span>
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
                        return (
                          <div key={staff.id} className="flex justify-between text-sm py-0.5">
                            <span>{staff.name}</span>
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
                          return (
                            <div key={staff.id} className="flex justify-between text-sm py-0.5">
                              <span>{staff.name}</span>
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
