import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Folder, FileText, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, getDaysInMonth, startOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import { addReportNotes, REPORT_FOOTER } from '@/lib/exportUtils';

interface Staff {
  id: string;
  name: string;
  category: string;
  base_salary: number;
}

interface AttendanceRecord {
  staff_id: string;
  date: string;
  status: string;
  shift_count: number | null;
}

interface Advance {
  staff_id: string;
  date: string;
  amount: number;
  notes: string | null;
}

interface BackupSectionProps {
  onBack: () => void;
}

const BackupSection = ({ onBack }: BackupSectionProps) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    setIsLoading(true);
    const startDate = format(startOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
    const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth - 1));
    const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const [staffRes, attendanceRes, advancesRes] = await Promise.all([
      supabase.from('staff').select('id, name, category, base_salary').eq('is_active', true).order('name'),
      supabase.from('attendance').select('staff_id, date, status, shift_count').gte('date', startDate).lte('date', endDate),
      supabase.from('advances').select('staff_id, date, amount, notes').gte('date', startDate).lte('date', endDate),
    ]);

    if (staffRes.data) setStaffList(staffRes.data as Staff[]);
    if (attendanceRes.data) setAttendance(attendanceRes.data as AttendanceRecord[]);
    if (advancesRes.data) setAdvances(advancesRes.data as Advance[]);
    setIsLoading(false);
  };

  const generateStaffPDF = (staff: Staff): jsPDF => {
    const doc = new jsPDF();
    const monthDays = Array.from({ length: getDaysInMonth(new Date(selectedYear, selectedMonth - 1)) }, (_, i) => i + 1);
    
    // Header
    doc.setFontSize(16);
    doc.text(`Staff Report - ${staff.name}`, 14, 15);
    doc.setFontSize(10);
    doc.text(REPORT_FOOTER, 14, 22);
    doc.text(`${months[selectedMonth - 1]} ${selectedYear}`, 14, 28);
    doc.text(`Category: ${staff.category} | Base Salary: ₹${staff.base_salary.toLocaleString()}`, 14, 34);

    // Attendance data
    const staffAttendance = attendance.filter(a => a.staff_id === staff.id);
    const staffAdvances = advances.filter(a => a.staff_id === staff.id);

    // Attendance summary
    const totalShifts = staffAttendance.reduce((sum, a) => {
      if (a.status === 'present') return sum + (a.shift_count || 1);
      return sum;
    }, 0);
    const absentDays = staffAttendance.filter(a => a.status === 'absent').length;
    const totalAdvance = staffAdvances.reduce((sum, a) => sum + Number(a.amount), 0);

    doc.setFontSize(12);
    doc.text('Summary:', 14, 44);
    doc.setFontSize(10);
    doc.text(`Total Shifts: ${totalShifts} | Absent Days: ${absentDays} | Total Advance: ₹${totalAdvance.toLocaleString()}`, 14, 52);

    // Attendance table
    doc.setFontSize(12);
    doc.text('Daily Attendance:', 14, 64);
    
    const attendanceData = monthDays.map(day => {
      const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const record = staffAttendance.find(a => a.date === dateStr);
      let status = 'Not Marked';
      if (record) {
        if (record.status === 'absent') status = 'Absent';
        else if (record.status === 'present') status = `${record.shift_count || 1} Shift${(record.shift_count || 1) > 1 ? 's' : ''}`;
      }
      return [day.toString(), format(new Date(selectedYear, selectedMonth - 1, day), 'EEE'), status];
    });

    autoTable(doc, {
      head: [['Date', 'Day', 'Status']],
      body: attendanceData,
      startY: 68,
      styles: { fontSize: 8 },
    });

    // Advances table
    if (staffAdvances.length > 0) {
      const lastY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Advances Taken:', 14, lastY);
      
      const advanceData = staffAdvances.map(a => [
        format(new Date(a.date), 'dd/MM/yyyy'),
        `₹${Number(a.amount).toLocaleString()}`,
        a.notes || '-',
      ]);

      autoTable(doc, {
        head: [['Date', 'Amount', 'Notes']],
        body: advanceData,
        startY: lastY + 4,
        styles: { fontSize: 8 },
      });
    }

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    addReportNotes(doc, finalY);

    return doc;
  };

  const generateCommonAttendancePDF = (): jsPDF => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const monthDays = Array.from({ length: getDaysInMonth(new Date(selectedYear, selectedMonth - 1)) }, (_, i) => i + 1);
    
    doc.setFontSize(16);
    doc.text(`Monthly Attendance Report - ${months[selectedMonth - 1]} ${selectedYear}`, 14, 15);
    doc.setFontSize(10);
    doc.text(REPORT_FOOTER, 14, 22);

    const headers = ['Staff', 'Category', ...monthDays.map(d => d.toString()), 'Shifts', 'Absent'];
    const tableData = staffList.map(staff => {
      const staffAttendance = attendance.filter(a => a.staff_id === staff.id);
      let totalShifts = 0;
      let absentDays = 0;
      
      const days = monthDays.map(day => {
        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const record = staffAttendance.find(a => a.date === dateStr);
        if (!record) return '-';
        if (record.status === 'absent') { absentDays++; return 'A'; }
        const shifts = record.shift_count || 1;
        totalShifts += shifts;
        return shifts.toString();
      });
      
      return [staff.name, staff.category, ...days, totalShifts.toString(), absentDays.toString()];
    });

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 28,
      styles: { fontSize: 5, cellPadding: 1 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    addReportNotes(doc, finalY);

    return doc;
  };

  const generateCommonAdvancesPDF = (): jsPDF => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(`Monthly Advances Report - ${months[selectedMonth - 1]} ${selectedYear}`, 14, 15);
    doc.setFontSize(10);
    doc.text(REPORT_FOOTER, 14, 22);

    const totalAdvance = advances.reduce((sum, a) => sum + Number(a.amount), 0);
    doc.text(`Total Advances: ₹${totalAdvance.toLocaleString()}`, 14, 30);

    const advancesByStaff = staffList.map(staff => {
      const staffAdvances = advances.filter(a => a.staff_id === staff.id);
      const total = staffAdvances.reduce((sum, a) => sum + Number(a.amount), 0);
      return { name: staff.name, category: staff.category, total, count: staffAdvances.length };
    }).filter(s => s.total > 0);

    const tableData = advancesByStaff.map(s => [s.name, s.category, s.count.toString(), `₹${s.total.toLocaleString()}`]);

    autoTable(doc, {
      head: [['Name', 'Category', 'Times', 'Total Amount']],
      body: tableData,
      startY: 38,
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    addReportNotes(doc, finalY);

    return doc;
  };

  const downloadBackupFolder = async () => {
    setIsGenerating(true);
    try {
      const zip = new JSZip();
      const folderName = `Backup-${months[selectedMonth - 1]}-${selectedYear}`;
      const folder = zip.folder(folderName);

      if (!folder) {
        toast.error('Failed to create backup folder');
        return;
      }

      // Generate individual staff PDFs
      const staffFolder = folder.folder('Staff Reports');
      for (const staff of staffList) {
        const pdf = generateStaffPDF(staff);
        const pdfBlob = pdf.output('blob');
        staffFolder?.file(`${staff.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, pdfBlob);
      }

      // Generate common reports
      const commonFolder = folder.folder('Common Reports');
      const attendancePDF = generateCommonAttendancePDF();
      commonFolder?.file('Monthly_Attendance.pdf', attendancePDF.output('blob'));
      
      const advancesPDF = generateCommonAdvancesPDF();
      commonFolder?.file('Monthly_Advances.pdf', advancesPDF.output('blob'));

      // Generate and download ZIP
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Backup folder downloaded!');
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Failed to generate backup');
    }
    setIsGenerating(false);
  };

  const downloadIndividualReport = (staff: Staff) => {
    const pdf = generateStaffPDF(staff);
    pdf.save(`${staff.name.replace(/[^a-zA-Z0-9]/g, '_')}-${months[selectedMonth - 1]}-${selectedYear}.pdf`);
    toast.success(`${staff.name}'s report downloaded`);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Monthly Backup</h1>
      </div>

      {/* Month/Year Selection */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {months.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Download Full Backup */}
      <Card className="mb-4 bg-primary/10 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-primary">
              <Folder className="h-6 w-6 text-primary-foreground" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Complete Backup</h3>
              <p className="text-sm text-muted-foreground">Download all staff reports in a ZIP folder</p>
            </div>
          </div>
          <Button 
            className="w-full mt-4" 
            onClick={downloadBackupFolder}
            disabled={isGenerating || isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            {isGenerating ? 'Generating...' : 'Download Backup Folder'}
          </Button>
        </CardContent>
      </Card>

      {/* Common Reports */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Common Reports</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" size="sm" className="w-full" onClick={() => {
            const pdf = generateCommonAttendancePDF();
            pdf.save(`Monthly-Attendance-${selectedMonth}-${selectedYear}.pdf`);
            toast.success('Attendance report downloaded');
          }}>
            <FileText className="h-4 w-4 mr-2" />Monthly Attendance Report
          </Button>
          <Button variant="outline" size="sm" className="w-full" onClick={() => {
            const pdf = generateCommonAdvancesPDF();
            pdf.save(`Monthly-Advances-${selectedMonth}-${selectedYear}.pdf`);
            toast.success('Advances report downloaded');
          }}>
            <FileText className="h-4 w-4 mr-2" />Monthly Advances Report
          </Button>
        </CardContent>
      </Card>

      {/* Individual Staff Reports */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Individual Staff Reports ({staffList.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-center text-muted-foreground py-4">Loading...</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {staffList.map(staff => (
                <div key={staff.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                  <div>
                    <p className="font-medium text-sm">{staff.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{staff.category}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => downloadIndividualReport(staff)}>
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupSection;