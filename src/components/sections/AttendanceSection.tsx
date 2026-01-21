import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Share2, Calendar as CalendarIcon, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
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
  phone: string | null;
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
}

type AttendanceStatus = '1shift' | '2shift' | 'absent' | 'not_marked';

const statusConfig = {
  '1shift': { label: '1', color: 'bg-green-500', fullLabel: '1 Shift' },
  '2shift': { label: '2', color: 'bg-primary', fullLabel: '2 Shifts' },
  'absent': { label: 'A', color: 'bg-destructive', fullLabel: 'Absent' },
  'not_marked': { label: '-', color: 'bg-muted', fullLabel: 'Not Marked' },
};

const AttendanceSection = ({ onBack }: AttendanceSectionProps) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'petroleum' | 'crusher' | 'office'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ type: 'markAll' | 'update' | 'clear'; status?: AttendanceStatus; staffId?: string } | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Navigate to prev/next day (Sundays are now working days)
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

    const [staffRes, attendanceRes] = await Promise.all([
      supabase.from('staff').select('id, name, category, phone').eq('is_active', true).order('name'),
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
        // Delete the record
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
    const staff = staffList.find(s => s.id === staffId);
    
    // Cycle through statuses based on category
    if (staff?.category === 'petroleum') {
      // For petroleum: not_marked -> 1shift -> 2shift -> absent -> not_marked
      if (!currentStatus) {
        updateAttendance(staffId, '1shift');
      } else if (currentStatus === '1shift') {
        updateAttendance(staffId, '2shift');
      } else if (currentStatus === '2shift') {
        updateAttendance(staffId, 'absent');
      } else {
        updateAttendance(staffId, 'not_marked');
      }
    } else {
      // For crusher/office: not_marked -> 1shift -> absent -> not_marked
      if (!currentStatus) {
        updateAttendance(staffId, '1shift');
      } else if (currentStatus === '1shift') {
        updateAttendance(staffId, 'absent');
      } else {
        updateAttendance(staffId, 'not_marked');
      }
    }
  };

  const markAllAs = async (status: AttendanceStatus) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const filteredStaff = getFilteredStaff();

    // Delete all existing attendance for this date
    await supabase.from('attendance').delete().eq('date', dateStr);
    
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
      const matchesCategory = categoryFilter === 'all' || staff.category === categoryFilter;
      const matchesSearch = staff.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const dateStr = format(selectedDate, 'dd MMM yyyy');
    
    doc.setFontSize(18);
    doc.text(`Attendance Report - ${dateStr}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Category: ${categoryFilter === 'all' ? 'All Staff' : categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)}`, 14, 30);

    const filteredStaff = getFilteredStaff();

    const tableData = filteredStaff.map((staff) => {
      const status = getStaffAttendance(staff.id);
      let statusText = 'Not Marked';
      if (status) {
        statusText = statusConfig[status].fullLabel;
      }
      return [
        staff.name,
        staff.category,
        staff.phone || '-',
        statusText,
      ];
    });

    autoTable(doc, {
      head: [['Name', 'Category', 'Phone', 'Status']],
      body: tableData,
      startY: 40,
    });

    doc.save(`attendance-${format(selectedDate, 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF downloaded');
  };

  const shareToWhatsApp = () => {
    const dateStr = format(selectedDate, 'dd MMM yyyy');
    const filteredStaff = getFilteredStaff();

    let message = `📋 *Attendance Report - ${dateStr}*\n`;
    message += `Category: ${categoryFilter === 'all' ? 'All Staff' : categoryFilter}\n\n`;

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

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const filteredStaff = getFilteredStaff();

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Attendance</h1>
      </div>

      {/* Date Navigation with Calendar Picker */}
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

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          className="pl-10"
          placeholder="Search staff..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
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

      {/* Quick Actions */}
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

      {/* Export Actions */}
      <div className="grid grid-cols-2 gap-2 mb-6">
        <Button variant="secondary" size="sm" onClick={exportToPDF}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
        <Button variant="secondary" size="sm" onClick={shareToWhatsApp}>
          <Share2 className="h-4 w-4 mr-2" />
          WhatsApp
        </Button>
      </div>

      {/* Legend */}
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

      <p className="text-xs text-muted-foreground mb-2">💡 Tap once to mark, tap again to cycle through statuses</p>

      {/* Staff List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-2">
          {filteredStaff.map((staff) => {
            const currentStatus = getStaffAttendance(staff.id);
            const isPetroleum = staff.category === 'petroleum';
            return (
              <Card 
                key={staff.id} 
                className="cursor-pointer active:scale-[0.98] transition-transform"
                onClick={() => handleQuickTap(staff.id)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{staff.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{staff.category}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {currentStatus ? (
                        <span className={`px-3 py-1.5 rounded text-sm font-medium text-primary-foreground ${statusConfig[currentStatus].color}`}>
                          {statusConfig[currentStatus].fullLabel}
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 rounded text-sm font-medium border bg-muted text-muted-foreground">
                          Not Marked
                        </span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Action</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmAction?.status === 'not_marked'
                ? `Are you sure you want to clear all attendance for ${categoryFilter === 'all' ? 'all staff' : categoryFilter + ' staff'}?`
                : `Are you sure you want to mark all ${categoryFilter === 'all' ? 'staff' : categoryFilter + ' staff'} as ${confirmAction?.status ? statusConfig[confirmAction.status].fullLabel : ''}?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (confirmAction?.status) {
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
