import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays, subDays, getDay } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Staff {
  id: string;
  name: string;
  category: 'petroleum' | 'crusher';
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

type AttendanceStatus = '1shift' | '2shift' | 'absent';

const statusConfig = {
  '1shift': { label: '1', color: 'bg-green-500', fullLabel: '1 Shift' },
  '2shift': { label: '2', color: 'bg-primary', fullLabel: '2 Shifts' },
  'absent': { label: 'A', color: 'bg-destructive', fullLabel: 'Absent' },
};

const AttendanceSection = ({ onBack }: AttendanceSectionProps) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'petroleum' | 'crusher'>('all');
  const [confirmAction, setConfirmAction] = useState<{ type: 'markAll' | 'update'; status: AttendanceStatus; staffId?: string } | null>(null);

  // Skip Sundays
  const navigateDate = (direction: 'prev' | 'next') => {
    let newDate = direction === 'prev' ? subDays(selectedDate, 1) : addDays(selectedDate, 1);
    // Skip Sundays
    while (getDay(newDate) === 0) {
      newDate = direction === 'prev' ? subDays(newDate, 1) : addDays(newDate, 1);
    }
    setSelectedDate(newDate);
  };

  // Check if current date is Sunday
  const isSunday = getDay(selectedDate) === 0;

  useEffect(() => {
    // If current date is Sunday, move to Monday
    if (isSunday) {
      setSelectedDate(addDays(selectedDate, 1));
      return;
    }
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

  const updateAttendance = async (staffId: string, status: AttendanceStatus) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existing = attendance.find((a) => a.staff_id === staffId);

    const dbStatus = status === 'absent' ? 'absent' : 'present';
    const shiftCount = status === '2shift' ? 2 : 1;

    if (existing) {
      await supabase.from('attendance').update({ status: dbStatus, shift_count: shiftCount }).eq('id', existing.id);
    } else {
      await supabase.from('attendance').insert({ staff_id: staffId, date: dateStr, status: dbStatus, shift_count: shiftCount });
    }

    toast.success('Attendance updated');
    fetchData();
    setConfirmAction(null);
  };

  const markAllAs = async (status: AttendanceStatus) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const filteredStaff = categoryFilter === 'all' 
      ? staffList 
      : staffList.filter(s => s.category === categoryFilter);

    await supabase.from('attendance').delete().eq('date', dateStr);
    
    const dbStatus: 'absent' | 'present' = status === 'absent' ? 'absent' : 'present';
    const shiftCount = status === '2shift' ? 2 : 1;

    const records = filteredStaff.map((staff) => ({
      staff_id: staff.id,
      date: dateStr,
      status: dbStatus,
      shift_count: shiftCount,
    }));

    await supabase.from('attendance').insert(records);
    toast.success(`All marked as ${statusConfig[status].fullLabel}`);
    fetchData();
    setConfirmAction(null);
  };

  const getStaffAttendance = (staffId: string): AttendanceStatus | null => {
    const record = attendance.find((a) => a.staff_id === staffId);
    if (!record) return null;
    if (record.status === 'absent') return 'absent';
    if (record.shift_count === 2) return '2shift';
    return '1shift';
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const dateStr = format(selectedDate, 'dd MMM yyyy');
    
    doc.setFontSize(18);
    doc.text(`Attendance Report - ${dateStr}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Category: ${categoryFilter === 'all' ? 'All Staff' : categoryFilter.charAt(0).toUpperCase() + categoryFilter.slice(1)}`, 14, 30);

    const filteredStaff = categoryFilter === 'all' 
      ? staffList 
      : staffList.filter(s => s.category === categoryFilter);

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
    const filteredStaff = categoryFilter === 'all' 
      ? staffList 
      : staffList.filter(s => s.category === categoryFilter);

    let message = `📋 *Attendance Report - ${dateStr}*\n`;
    message += `Category: ${categoryFilter === 'all' ? 'All Staff' : categoryFilter}\n\n`;

    const oneShift = filteredStaff.filter(s => getStaffAttendance(s.id) === '1shift').length;
    const twoShift = filteredStaff.filter(s => getStaffAttendance(s.id) === '2shift').length;
    const absent = filteredStaff.filter(s => getStaffAttendance(s.id) === 'absent').length;

    message += `1️⃣ 1 Shift: ${oneShift}\n`;
    message += `2️⃣ 2 Shifts: ${twoShift}\n`;
    message += `❌ Absent: ${absent}\n\n`;

    filteredStaff.forEach((staff) => {
      const status = getStaffAttendance(staff.id);
      const statusText = status ? statusConfig[status].label : '?';
      message += `${staff.name}: ${statusText}\n`;
    });

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  const filteredStaff = categoryFilter === 'all' 
    ? staffList 
    : staffList.filter(s => s.category === categoryFilter);

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Attendance</h1>
      </div>

      {/* Date Navigation */}
      <Card className="mb-4">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="icon" onClick={() => navigateDate('prev')}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <p className="font-semibold text-foreground">{format(selectedDate, 'EEEE')}</p>
              <p className="text-sm text-muted-foreground">{format(selectedDate, 'dd MMM yyyy')}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => navigateDate('next')}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </CardContent>
      </Card>

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
          </SelectContent>
        </Select>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Button variant="outline" size="sm" className="text-xs" onClick={() => setConfirmAction({ type: 'markAll', status: '1shift' })}>
          All 1 Shift
        </Button>
        <Button variant="outline" size="sm" className="text-xs" onClick={() => setConfirmAction({ type: 'markAll', status: '2shift' })}>
          All 2 Shifts
        </Button>
        <Button variant="outline" size="sm" className="text-xs" onClick={() => setConfirmAction({ type: 'markAll', status: 'absent' })}>
          All Absent
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
      </div>

      {/* Staff List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="space-y-2">
          {filteredStaff.map((staff) => {
            const currentStatus = getStaffAttendance(staff.id);
            return (
              <Card key={staff.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-foreground">{staff.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{staff.category}</p>
                    </div>
                    {currentStatus && (
                      <span className={`px-2 py-1 rounded text-xs text-primary-foreground ${statusConfig[currentStatus].color}`}>
                        {statusConfig[currentStatus].fullLabel}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {(['1shift', '2shift', 'absent'] as const).map((status) => {
                      const config = statusConfig[status];
                      return (
                        <Button
                          key={status}
                          variant={currentStatus === status ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => setConfirmAction({ type: 'update', status, staffId: staff.id })}
                        >
                          {config.fullLabel}
                        </Button>
                      );
                    })}
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
              {confirmAction?.type === 'markAll' 
                ? `Are you sure you want to mark all ${categoryFilter === 'all' ? 'staff' : categoryFilter + ' staff'} as ${statusConfig[confirmAction.status].fullLabel}?`
                : `Mark attendance as ${confirmAction ? statusConfig[confirmAction.status].fullLabel : ''}?`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              if (confirmAction?.type === 'markAll') {
                markAllAs(confirmAction.status);
              } else if (confirmAction?.staffId) {
                updateAttendance(confirmAction.staffId, confirmAction.status);
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
