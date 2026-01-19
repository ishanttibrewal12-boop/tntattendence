import { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, ChevronLeft, ChevronRight, Download, Share2, Check, X, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, addDays, subDays } from 'date-fns';
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
  status: 'present' | 'absent' | 'half_day' | 'holiday' | 'sunday' | 'leave';
}

interface AttendanceSectionProps {
  onBack: () => void;
}

const statusConfig = {
  present: { label: 'P', color: 'bg-green-500', icon: Check },
  absent: { label: 'A', color: 'bg-destructive', icon: X },
  half_day: { label: 'H', color: 'bg-yellow-500', icon: Clock },
  holiday: { label: 'HO', color: 'bg-primary', icon: Calendar },
  sunday: { label: 'S', color: 'bg-muted', icon: Calendar },
  leave: { label: 'L', color: 'bg-orange-500', icon: Calendar },
};

const AttendanceSection = ({ onBack }: AttendanceSectionProps) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'petroleum' | 'crusher'>('all');

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
    if (attendanceRes.data) setAttendance(attendanceRes.data);
    setIsLoading(false);
  };

  const updateAttendance = async (staffId: string, status: AttendanceRecord['status']) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existing = attendance.find((a) => a.staff_id === staffId);

    if (existing) {
      await supabase.from('attendance').update({ status }).eq('id', existing.id);
    } else {
      await supabase.from('attendance').insert({ staff_id: staffId, date: dateStr, status });
    }

    toast.success('Attendance updated');
    fetchData();
  };

  const markAllAs = async (status: AttendanceRecord['status']) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const filteredStaff = categoryFilter === 'all' 
      ? staffList 
      : staffList.filter(s => s.category === categoryFilter);

    await supabase.from('attendance').delete().eq('date', dateStr);
    
    const records = filteredStaff.map((staff) => ({
      staff_id: staff.id,
      date: dateStr,
      status,
    }));

    await supabase.from('attendance').insert(records);
    toast.success(`All marked as ${status.replace('_', ' ')}`);
    fetchData();
  };

  const getStaffAttendance = (staffId: string) => {
    return attendance.find((a) => a.staff_id === staffId)?.status || null;
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
      return [
        staff.name,
        staff.category,
        staff.phone || '-',
        status ? statusConfig[status].label : 'Not Marked',
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

    const present = filteredStaff.filter(s => getStaffAttendance(s.id) === 'present').length;
    const absent = filteredStaff.filter(s => getStaffAttendance(s.id) === 'absent').length;
    const halfDay = filteredStaff.filter(s => getStaffAttendance(s.id) === 'half_day').length;

    message += `✅ Present: ${present}\n`;
    message += `❌ Absent: ${absent}\n`;
    message += `⏰ Half Day: ${halfDay}\n\n`;

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
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(subDays(selectedDate, 1))}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="text-center">
              <p className="font-semibold text-foreground">{format(selectedDate, 'EEEE')}</p>
              <p className="text-sm text-muted-foreground">{format(selectedDate, 'dd MMM yyyy')}</p>
            </div>
            <Button variant="ghost" size="icon" onClick={() => setSelectedDate(addDays(selectedDate, 1))}>
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
        <Button variant="outline" size="sm" className="text-xs" onClick={() => markAllAs('present')}>
          All Present
        </Button>
        <Button variant="outline" size="sm" className="text-xs" onClick={() => markAllAs('absent')}>
          All Absent
        </Button>
        <Button variant="outline" size="sm" className="text-xs" onClick={() => markAllAs('holiday')}>
          Holiday
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
                        {statusConfig[currentStatus].label}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1">
                    {(['present', 'absent', 'half_day', 'sunday'] as const).map((status) => {
                      const config = statusConfig[status];
                      return (
                        <Button
                          key={status}
                          variant={currentStatus === status ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1 text-xs"
                          onClick={() => updateAttendance(staff.id, status)}
                        >
                          {config.label}
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
    </div>
  );
};

export default AttendanceSection;
