import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Share2, ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays, subDays } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Staff {
  id: string;
  name: string;
  category: 'petroleum' | 'crusher' | 'office';
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
  staff?: Staff;
}

interface DailyReportSectionProps {
  onBack: () => void;
}

const DailyReportSection = ({ onBack }: DailyReportSectionProps) => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setIsLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    const [staffRes, attendanceRes, advancesRes] = await Promise.all([
      supabase.from('staff').select('id, name, category').eq('is_active', true).order('name'),
      supabase.from('attendance').select('staff_id, status, shift_count').eq('date', dateStr),
      supabase.from('advances').select('staff_id, amount, notes').eq('date', dateStr),
    ]);

    if (staffRes.data) setStaffList(staffRes.data as Staff[]);
    if (attendanceRes.data) setAttendance(attendanceRes.data as AttendanceRecord[]);
    if (advancesRes.data) {
      const advancesWithStaff = advancesRes.data.map(adv => ({
        ...adv,
        staff: staffRes.data?.find(s => s.id === adv.staff_id),
      }));
      setAdvances(advancesWithStaff as Advance[]);
    }
    setIsLoading(false);
  };

  const getAttendanceStatus = (staffId: string) => {
    const record = attendance.find(a => a.staff_id === staffId);
    if (!record) return { text: 'Not Marked', color: 'text-muted-foreground' };
    if (record.status === 'absent') return { text: 'Absent', color: 'text-destructive' };
    if (record.status === 'present') {
      const shifts = record.shift_count || 1;
      return { text: `${shifts} Shift${shifts > 1 ? 's' : ''}`, color: shifts === 2 ? 'text-primary' : 'text-green-600' };
    }
    return { text: 'Not Marked', color: 'text-muted-foreground' };
  };

  const getStats = () => {
    const oneShift = attendance.filter(a => a.status === 'present' && (a.shift_count || 1) === 1).length;
    const twoShift = attendance.filter(a => a.status === 'present' && a.shift_count === 2).length;
    const absent = attendance.filter(a => a.status === 'absent').length;
    const notMarked = staffList.length - attendance.length;
    const totalAdvance = advances.reduce((sum, a) => sum + Number(a.amount), 0);

    return { oneShift, twoShift, absent, notMarked, totalAdvance };
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
    doc.text('Tibrewal Staff Manager | Manager: Abhay Jalan', 14, 28);
    
    doc.setFontSize(12);
    doc.text('Summary:', 14, 40);
    doc.text(`1-Shift: ${stats.oneShift} | 2-Shift: ${stats.twoShift} | Absent: ${stats.absent} | Not Marked: ${stats.notMarked}`, 14, 48);
    doc.text(`Total Advance Given: ₹${stats.totalAdvance.toLocaleString()}`, 14, 56);

    // Attendance Table
    doc.text('Attendance:', 14, 70);
    const attendanceData = staffList.map(staff => {
      const status = getAttendanceStatus(staff.id);
      return [staff.name, staff.category, status.text];
    });

    autoTable(doc, {
      head: [['Name', 'Category', 'Status']],
      body: attendanceData,
      startY: 74,
      styles: { fontSize: 9 },
    });

    // Advances Table
    if (advances.length > 0) {
      const lastY = (doc as any).lastAutoTable.finalY + 10;
      doc.text('Advances Given:', 14, lastY);
      
      const advanceData = advances.map(adv => [
        adv.staff?.name || 'Unknown',
        `₹${Number(adv.amount).toLocaleString()}`,
        adv.notes || '-',
      ]);

      autoTable(doc, {
        head: [['Name', 'Amount', 'Notes']],
        body: advanceData,
        startY: lastY + 4,
        styles: { fontSize: 9 },
      });
    }

    doc.save(`daily-report-${format(selectedDate, 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF downloaded');
  };

  const shareToWhatsApp = () => {
    const dateStr = format(selectedDate, 'dd MMM yyyy, EEEE');
    
    let message = `📋 *Daily Report - ${dateStr}*\n\n`;
    message += `*Attendance Summary*\n`;
    message += `1️⃣ 1-Shift: ${stats.oneShift}\n`;
    message += `2️⃣ 2-Shift: ${stats.twoShift}\n`;
    message += `❌ Absent: ${stats.absent}\n`;
    message += `➖ Not Marked: ${stats.notMarked}\n\n`;

    if (advances.length > 0) {
      message += `*Advances Given*\n`;
      message += `Total: ₹${stats.totalAdvance.toLocaleString()}\n`;
      advances.forEach(adv => {
        message += `• ${adv.staff?.name}: ₹${Number(adv.amount).toLocaleString()}\n`;
      });
      message += '\n';
    }

    message += `_Tibrewal Staff Manager_`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Daily Report</h1>
      </div>

      {/* Date Navigation */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="flex flex-col items-center">
                  <p className="font-semibold text-foreground">{format(selectedDate, 'EEEE')}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <CalendarIcon className="h-3 w-3" />
                    {format(selectedDate, 'dd MMM yyyy')}
                  </p>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => {
                    if (date) setSelectedDate(date);
                    setCalendarOpen(false);
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Export Actions */}
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

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <>
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{stats.oneShift}</p>
                <p className="text-xs text-muted-foreground">1-Shift</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-primary">{stats.twoShift}</p>
                <p className="text-xs text-muted-foreground">2-Shift</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-destructive">{stats.absent}</p>
                <p className="text-xs text-muted-foreground">Absent</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-muted-foreground">{stats.notMarked}</p>
                <p className="text-xs text-muted-foreground">Not Marked</p>
              </CardContent>
            </Card>
          </div>

          {/* Advances Summary */}
          {advances.length > 0 && (
            <Card className="mb-4 bg-destructive/5 border-destructive/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Advances Given Today</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-destructive mb-2">₹{stats.totalAdvance.toLocaleString()}</p>
                <div className="space-y-1">
                  {advances.map((adv, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{adv.staff?.name}</span>
                      <span className="font-medium">₹{Number(adv.amount).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Attendance List */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Attendance ({attendance.length}/{staffList.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {staffList.map(staff => {
                  const status = getAttendanceStatus(staff.id);
                  return (
                    <div key={staff.id} className="flex justify-between items-center text-sm py-1 border-b border-border last:border-0">
                      <div>
                        <span className="font-medium">{staff.name}</span>
                        <span className="text-xs text-muted-foreground ml-2 capitalize">{staff.category}</span>
                      </div>
                      <span className={`font-medium ${status.color}`}>{status.text}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default DailyReportSection;