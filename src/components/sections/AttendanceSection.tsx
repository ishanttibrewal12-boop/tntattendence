import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Share2, Calendar as CalendarIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays, subDays, getDaysInMonth } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addReportNotes, REPORT_FOOTER } from '@/lib/exportUtils';

interface Staff {
  id: string;
  name: string;
  category: 'petroleum' | 'crusher' | 'office';
}

interface AttendanceRecord {
  id: string;
  staff_id: string;
  date: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  status: string;
  shift_count: number | null;
}

interface AttendanceSectionProps {
  onBack: () => void;
  category?: 'petroleum' | 'crusher' | 'office';
}

type AttendanceStatus = '1shift' | '2shift' | 'absent' | 'not_marked';

const statusConfig = {
  '1shift': { label: '1', color: 'bg-green-500', fullLabel: '1 Shift' },
  '2shift': { label: '2', color: 'bg-primary', fullLabel: '2 Shifts' },
  'absent': { label: 'A', color: 'bg-destructive', fullLabel: 'Absent' },
  'not_marked': { label: '-', color: 'bg-muted', fullLabel: 'Not Marked' },
};

const AttendanceSection = ({ onBack, category }: AttendanceSectionProps) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ type: 'markAll' | 'update' | 'clear'; status?: AttendanceStatus; staffId?: string } | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

  const navigateDate = (direction: 'prev' | 'next') => {
    let newDate = direction === 'prev' ? subDays(selectedDate, 1) : addDays(selectedDate, 1);
    setSelectedDate(newDate);
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  const fetchData = async () => {
    setIsLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');

    let staffQuery = supabase.from('staff').select('id, name, category').eq('is_active', true).order('name');
    if (category) {
      staffQuery = staffQuery.eq('category', category);
    }

    const [staffRes, attendanceRes] = await Promise.all([
      staffQuery,
      supabase.from('attendance').select('*').eq('date', dateStr),
    ]);

    if (staffRes.data) setStaffList(staffRes.data as Staff[]);
    if (attendanceRes.data) setAttendance(attendanceRes.data as AttendanceRecord[]);
    setIsLoading(false);
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      setCalendarOpen(false);
    }
  };

  const updateAttendance = async (staffId: string, status: AttendanceStatus) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existing = attendance.find((a) => a.staff_id === staffId);

    const dbStatus = status === 'absent' ? 'absent' : status === 'not_marked' ? 'not_marked' : 'present';
    const shiftCount = status === '2shift' ? 2 : 1;

    if (existing) {
      if (status === 'not_marked') {
        await supabase.from('attendance').delete().eq('id', existing.id);
      } else {
        await supabase.from('attendance').update({ status: dbStatus, shift_count: shiftCount }).eq('id', existing.id);
      }
    } else if (status !== 'not_marked') {
      await supabase.from('attendance').insert({ staff_id: staffId, date: dateStr, status: dbStatus, shift_count: shiftCount });
    }

    toast.success(status === 'not_marked' ? 'Attendance cleared' : 'Attendance updated');
    fetchData();
    setConfirmAction(null);
  };

  const handleQuickTap = (staffId: string) => {
    const currentStatus = getStaffAttendance(staffId);
    if (!currentStatus) {
      updateAttendance(staffId, '1shift');
    } else if (currentStatus === '1shift') {
      updateAttendance(staffId, '2shift');
    } else if (currentStatus === '2shift') {
      updateAttendance(staffId, 'absent');
    } else {
      updateAttendance(staffId, 'not_marked');
    }
  };

  const markAllAs = async (status: AttendanceStatus) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const filteredStaff = getFilteredStaff();

    const staffIds = filteredStaff.map(s => s.id);
    await supabase.from('attendance').delete().eq('date', dateStr).in('staff_id', staffIds);
    
    if (status !== 'not_marked') {
      const dbStatus: 'absent' | 'present' = status === 'absent' ? 'absent' : 'present';
      const shiftCount = status === '2shift' ? 2 : 1;

      const records = filteredStaff.map((staff) => ({
        staff_id: staff.id,
        date: dateStr,
        status: dbStatus,
        shift_count: shiftCount,
      }));

      await supabase.from('attendance').insert(records);
    }
    
    toast.success(status === 'not_marked' ? 'All attendance cleared' : `All marked as ${statusConfig[status].fullLabel}`);
    fetchData();
    setConfirmAction(null);
  };

  const getStaffAttendance = (staffId: string): AttendanceStatus | null => {
    const record = attendance.find((a) => a.staff_id === staffId);
    if (!record) return null;
    if (record.status === 'absent') return 'absent';
    if (record.status === 'not_marked') return null;
    if (record.shift_count === 2) return '2shift';
    return '1shift';
  };

  const getFilteredStaff = () => {
    return staffList.filter((staff) => {
      const matchesSearch = staff.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const dateStr = format(selectedDate, 'dd MMM yyyy');
    const categoryLabel = category ? category.charAt(0).toUpperCase() + category.slice(1) : 'All Staff';
    
    doc.setFontSize(18);
    doc.text(`Attendance Report - ${dateStr}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Department: ${categoryLabel}`, 14, 30);
    doc.text(REPORT_FOOTER, 14, 38);

    const filteredStaff = getFilteredStaff();

    const tableData = filteredStaff.map((staff) => {
      const status = getStaffAttendance(staff.id);
      let statusText = 'Not Marked';
      if (status) {
        statusText = statusConfig[status].fullLabel;
      }
      return [staff.name, statusText];
    });

    autoTable(doc, {
      head: [['Name', 'Status']],
      body: tableData,
      startY: 46,
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    addReportNotes(doc, finalY);

    doc.save(`attendance-${category || 'all'}-${format(selectedDate, 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF downloaded');
  };

  const shareToWhatsApp = () => {
    const dateStr = format(selectedDate, 'dd MMM yyyy');
    const filteredStaff = getFilteredStaff();
    const categoryLabel = category ? category.charAt(0).toUpperCase() + category.slice(1) : 'All';

    let message = `📋 *${categoryLabel} Attendance - ${dateStr}*\n\n`;

    const oneShift = filteredStaff.filter(s => getStaffAttendance(s.id) === '1shift').length;
    const twoShift = filteredStaff.filter(s => getStaffAttendance(s.id) === '2shift').length;
    const absent = filteredStaff.filter(s => getStaffAttendance(s.id) === 'absent').length;
    const notMarked = filteredStaff.filter(s => !getStaffAttendance(s.id)).length;

    message += `1️⃣ 1 Shift: ${oneShift}\n`;
    message += `2️⃣ 2 Shifts: ${twoShift}\n`;
    message += `❌ Absent: ${absent}\n`;
    message += `➖ Not Marked: ${notMarked}\n\n`;

    filteredStaff.forEach((staff) => {
      const status = getStaffAttendance(staff.id);
      const statusText = status ? statusConfig[status].label : '-';
      message += `${staff.name}: ${statusText}\n`;
    });

    message += `\n_Tibrewal Staff Manager_`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const filteredStaff = getFilteredStaff();

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthDays = Array.from({ length: getDaysInMonth(new Date(calendarYear, calendarMonth - 1)) }, (_, i) => i + 1);

  const categoryTitle = category ? category.charAt(0).toUpperCase() + category.slice(1) + ' ' : '';

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">{categoryTitle}Attendance</h1>
      </div>

      <div className="flex gap-2 mb-4">
        <Button 
          variant={viewMode === 'list' ? 'default' : 'outline'} 
          size="sm" 
          className="flex-1"
          onClick={() => setViewMode('list')}
        >
          Daily View
        </Button>
        <Button 
          variant={viewMode === 'calendar' ? 'default' : 'outline'} 
          size="sm" 
          className="flex-1"
          onClick={() => setViewMode('calendar')}
        >
          Calendar View
        </Button>
      </div>

      {viewMode === 'list' && (
        <>
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
                      onSelect={handleDateSelect}
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

          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-4 gap-1 mb-4">
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setConfirmAction({ type: 'markAll', status: '1shift' })}>
              All 1S
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setConfirmAction({ type: 'markAll', status: '2shift' })}>
              All 2S
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setConfirmAction({ type: 'markAll', status: 'absent' })}>
              All Abs
            </Button>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setConfirmAction({ type: 'markAll', status: 'not_marked' })}>
              Clear
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-6">
            <Button variant="secondary" size="sm" onClick={exportToPDF}>
              <Download className="h-4 w-4 mr-1" />
              PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={shareToWhatsApp}>
              <Share2 className="h-4 w-4 mr-1" />
              Share
            </Button>
          </div>

          <div className="flex items-center justify-between mb-4 p-3 bg-muted/30 rounded-lg">
            <div className="text-sm">
              <span className="font-medium text-foreground">
                {filteredStaff.filter(s => getStaffAttendance(s.id) !== null).length}/{filteredStaff.length}
              </span>
              <span className="text-muted-foreground ml-1">staff marked</span>
            </div>
            <div className="flex gap-3 text-xs text-muted-foreground">
              <span className="text-green-600">{filteredStaff.filter(s => getStaffAttendance(s.id) === '1shift').length}×1S</span>
              <span className="text-primary">{filteredStaff.filter(s => getStaffAttendance(s.id) === '2shift').length}×2S</span>
              <span className="text-destructive">{filteredStaff.filter(s => getStaffAttendance(s.id) === 'absent').length}×A</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mb-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-green-500"></span> 1 Shift
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-primary"></span> 2 Shifts
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-destructive"></span> Absent
            </span>
            <span className="flex items-center gap-1">
              <span className="w-4 h-4 rounded bg-muted border"></span> Not Marked
            </span>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : filteredStaff.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No staff found</div>
          ) : (
            <div className="space-y-1">
              {filteredStaff.map((staff) => {
                const currentStatus = getStaffAttendance(staff.id);
                return (
                  <div
                    key={staff.id}
                    className="flex items-center justify-between p-3 rounded-lg border border-border bg-card cursor-pointer active:scale-[0.98] transition-transform"
                    onClick={() => handleQuickTap(staff.id)}
                  >
                    <span className="text-sm font-medium text-foreground truncate flex-1">{staff.name}</span>
                    <div className="flex gap-1">
                      {(['1shift', '2shift', 'absent'] as AttendanceStatus[]).map((status) => (
                        <button
                          key={status}
                          onClick={(e) => { e.stopPropagation(); updateAttendance(staff.id, currentStatus === status ? 'not_marked' : status); }}
                          className={`w-8 h-8 rounded-md text-xs font-bold flex items-center justify-center transition-colors ${
                            currentStatus === status
                              ? `${statusConfig[status].color} text-primary-foreground`
                              : 'bg-muted/40 text-muted-foreground hover:bg-muted'
                          }`}
                        >
                          {statusConfig[status].label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {viewMode === 'calendar' && (
        <>
          <div className="grid grid-cols-2 gap-2 mb-4">
            <select className="border border-border rounded-lg p-2 bg-card text-foreground text-sm" value={calendarMonth} onChange={(e) => setCalendarMonth(parseInt(e.target.value))}>
              {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
            </select>
            <select className="border border-border rounded-lg p-2 bg-card text-foreground text-sm" value={calendarYear} onChange={(e) => setCalendarYear(parseInt(e.target.value))}>
              {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
          <div className="text-center py-8 text-muted-foreground text-sm">
            Use Monthly Report for calendar view
          </div>
        </>
      )}

      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.type === 'markAll' && confirmAction.status
                ? `Mark all ${filteredStaff.length} staff as ${statusConfig[confirmAction.status].fullLabel}?`
                : 'Are you sure?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (confirmAction?.type === 'markAll' && confirmAction.status) {
                markAllAs(confirmAction.status);
              }
            }}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AttendanceSection;
