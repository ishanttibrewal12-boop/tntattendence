import { useState, useEffect } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, getDaysInMonth, startOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addReportNotes, REPORT_FOOTER } from '@/lib/exportUtils';

interface Staff {
  id: string;
  name: string;
  category: 'petroleum' | 'crusher' | 'office';
}

interface AttendanceRecord {
  staff_id: string;
  date: string;
  status: string;
  shift_count: number | null;
}

interface MonthlyCalendarSectionProps {
  onBack: () => void;
  category?: 'petroleum' | 'crusher' | 'office';
}

const MonthlyCalendarSection = ({ onBack }: MonthlyCalendarSectionProps) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'petroleum' | 'crusher' | 'office'>('all');

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    setIsLoading(true);

    const startDate = format(startOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
    const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth - 1));
    const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const [staffRes, attendanceRes] = await Promise.all([
      supabase.from('staff').select('id, name, category').eq('is_active', true).order('name'),
      supabase.from('attendance').select('staff_id, date, status, shift_count').gte('date', startDate).lte('date', endDate),
    ]);

    if (staffRes.data) setStaffList(staffRes.data as Staff[]);
    if (attendanceRes.data) setAttendance(attendanceRes.data as AttendanceRecord[]);
    setIsLoading(false);
  };

  const getAttendanceForDay = (staffId: string, day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendance.find(a => a.staff_id === staffId && a.date === dateStr);
  };

  const getStatusDisplay = (staffId: string, day: number, staff: Staff) => {
    const record = getAttendanceForDay(staffId, day);
    if (!record) return { text: '-', color: 'bg-muted/30 text-muted-foreground' };
    
    if (record.status === 'absent') {
      return { text: 'A', color: 'bg-destructive text-destructive-foreground' };
    }
    
    // For present status, show shift count
    if (record.status === 'present') {
      const shifts = record.shift_count || 1;
      return { 
        text: shifts === 2 ? '2' : '1', 
        color: shifts === 2 ? 'bg-primary text-primary-foreground' : 'bg-green-500 text-primary-foreground' 
      };
    }
    
    return { text: '-', color: 'bg-muted/30 text-muted-foreground' };
  };

  // Get all days in month (including Sundays - no exclusion)
  const getMonthDays = () => {
    const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth - 1));
    const monthDays: number[] = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      monthDays.push(day);
    }
    
    return monthDays;
  };

  const monthDays = getMonthDays();

  const filteredStaff = categoryFilter === 'all' 
    ? staffList 
    : staffList.filter(s => s.category === categoryFilter);

  const getStaffSummary = (staffId: string, staff: Staff) => {
    const staffAttendance = attendance.filter(a => a.staff_id === staffId);
    const totalShifts = staffAttendance.reduce((sum, a) => {
      if (a.status === 'present') {
        return sum + (a.shift_count || 1);
      }
      return sum;
    }, 0);
    const absentDays = staffAttendance.filter(a => a.status === 'absent').length;
    
    return { totalShifts, absentDays };
  };

  const exportToPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    
    doc.setFontSize(16);
    doc.text(`Monthly Attendance - ${months[selectedMonth - 1]} ${selectedYear}`, 14, 15);
    doc.setFontSize(10);
    doc.text(REPORT_FOOTER, 14, 22);

    const headers = ['Staff', ...monthDays.map(d => d.toString()), 'Shifts', 'Absent'];
    const tableData = filteredStaff.map((staff) => {
      const summary = getStaffSummary(staff.id, staff);
      return [
        staff.name,
        ...monthDays.map(day => {
          const display = getStatusDisplay(staff.id, day, staff);
          return display.text;
        }),
        summary.totalShifts.toString(),
        summary.absentDays.toString(),
      ];
    });

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 28,
      styles: { fontSize: 6, cellPadding: 1 },
      headStyles: { fillColor: [0, 120, 212] },
    });
    
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    addReportNotes(doc, finalY);

    doc.save(`monthly-attendance-${selectedMonth}-${selectedYear}.pdf`);
    toast.success('PDF downloaded');
  };

  const exportToExcel = () => {
    const XLSX = require('xlsx');
    
    const headers = ['Staff', 'Category', ...monthDays.map(d => d.toString()), 'Total Shifts', 'Absent'];
    const data = filteredStaff.map((staff) => {
      const summary = getStaffSummary(staff.id, staff);
      return [
        staff.name,
        staff.category,
        ...monthDays.map(day => {
          const display = getStatusDisplay(staff.id, day, staff);
          return display.text;
        }),
        summary.totalShifts,
        summary.absentDays,
      ];
    });
    
    const wb = XLSX.utils.book_new();
    const wsData = [
      [`Monthly Attendance - ${months[selectedMonth - 1]} ${selectedYear}`],
      ['Tibrewal Staff Manager'],
      [],
      headers,
      ...data,
      [],
      ['Note: If you have any queries, contact 6203229118'],
      ['नोट: यदि आपके कोई प्रश्न हैं, तो 6203229118 पर संपर्क करें'],
    ];
    
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    XLSX.utils.book_append_sheet(wb, ws, 'Monthly Attendance');
    XLSX.writeFile(wb, `monthly-attendance-${selectedMonth}-${selectedYear}.xlsx`);
    toast.success('Excel downloaded');
  };

  const shareToWhatsApp = () => {
    let message = `📅 *Monthly Attendance - ${months[selectedMonth - 1]} ${selectedYear}*\n\n`;
    
    filteredStaff.forEach((staff) => {
      const summary = getStaffSummary(staff.id, staff);
      message += `${staff.name} (${staff.category})\n`;
      message += `  Shifts: ${summary.totalShifts} | Absent: ${summary.absentDays}\n\n`;
    });

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div className="p-4 max-w-full mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Monthly Calendar</h1>
      </div>

      {/* Month/Year Selection */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((month, i) => (
              <SelectItem key={i} value={(i + 1).toString()}>{month}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026].map((year) => (
              <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
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

      {/* Export Actions */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Button variant="secondary" size="sm" onClick={exportToPDF}>
          <Download className="h-4 w-4 mr-1" />
          PDF
        </Button>
        <Button variant="secondary" size="sm" onClick={exportToExcel}>
          <Download className="h-4 w-4 mr-1" />
          Excel
        </Button>
        <Button variant="secondary" size="sm" onClick={shareToWhatsApp}>
          <Share2 className="h-4 w-4 mr-1" />
          Share
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

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-muted">
                <th className="p-1 text-left sticky left-0 bg-muted z-10 min-w-[80px]">Staff</th>
                {monthDays.map(day => (
                  <th key={day} className="p-1 text-center min-w-[24px]">{day}</th>
                ))}
                <th className="p-1 text-center min-w-[40px]">Total</th>
              </tr>
            </thead>
            <tbody>
              {filteredStaff.map((staff) => {
                const summary = getStaffSummary(staff.id, staff);
                return (
                  <tr key={staff.id} className="border-b border-border">
                    <td className="p-1 sticky left-0 bg-background z-10">
                      <div className="font-medium truncate max-w-[80px]">{staff.name}</div>
                      <div className="text-muted-foreground text-[10px] capitalize">{staff.category}</div>
                    </td>
                    {monthDays.map(day => {
                      const display = getStatusDisplay(staff.id, day, staff);
                      return (
                        <td key={day} className="p-0.5 text-center">
                          <span className={`inline-block w-5 h-5 rounded text-[10px] leading-5 ${display.color}`}>
                            {display.text}
                          </span>
                        </td>
                      );
                    })}
                    <td className="p-1 text-center font-bold">{summary.totalShifts}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default MonthlyCalendarSection;
