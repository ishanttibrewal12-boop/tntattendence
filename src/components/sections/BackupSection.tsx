import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Folder, FileText, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, getDaysInMonth, startOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import { addReportNotes, REPORT_FOOTER, exportToExcel } from '@/lib/exportUtils';
import { formatFullCurrency, formatCurrencyForPDF } from '@/lib/formatUtils';

interface Staff {
  id: string;
  name: string;
  category: string;
  base_salary: number;
}

interface MLTStaff {
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
  category?: 'petroleum' | 'crusher' | 'office';
}

const BackupSection = ({ onBack }: BackupSectionProps) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [mltStaffList, setMltStaffList] = useState<MLTStaff[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [mltAttendance, setMltAttendance] = useState<AttendanceRecord[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [mltAdvances, setMltAdvances] = useState<Advance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('main');
  
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

    const [staffRes, mltStaffRes, attendanceRes, mltAttendanceRes, advancesRes, mltAdvancesRes] = await Promise.all([
      supabase.from('staff').select('id, name, category, base_salary').eq('is_active', true).order('name'),
      supabase.from('mlt_staff').select('id, name, category, base_salary').eq('is_active', true).order('name'),
      supabase.from('attendance').select('staff_id, date, status, shift_count').gte('date', startDate).lte('date', endDate),
      supabase.from('mlt_attendance').select('staff_id, date, status, shift_count').gte('date', startDate).lte('date', endDate),
      supabase.from('advances').select('staff_id, date, amount, notes').gte('date', startDate).lte('date', endDate),
      supabase.from('mlt_advances').select('staff_id, date, amount, notes').gte('date', startDate).lte('date', endDate),
    ]);

    if (staffRes.data) setStaffList(staffRes.data as Staff[]);
    if (mltStaffRes.data) setMltStaffList(mltStaffRes.data as MLTStaff[]);
    if (attendanceRes.data) setAttendance(attendanceRes.data as AttendanceRecord[]);
    if (mltAttendanceRes.data) setMltAttendance(mltAttendanceRes.data as AttendanceRecord[]);
    if (advancesRes.data) setAdvances(advancesRes.data as Advance[]);
    if (mltAdvancesRes.data) setMltAdvances(mltAdvancesRes.data as Advance[]);
    setIsLoading(false);
  };

  const generateStaffPDF = (staff: Staff, isMlt = false): jsPDF => {
    const doc = new jsPDF();
    const monthDays = Array.from({ length: getDaysInMonth(new Date(selectedYear, selectedMonth - 1)) }, (_, i) => i + 1);
    const attendanceData = isMlt ? mltAttendance : attendance;
    const advancesData = isMlt ? mltAdvances : advances;
    
    doc.setFontSize(16);
    doc.text(`Staff Report - ${staff.name}`, 14, 15);
    doc.setFontSize(10);
    doc.text(REPORT_FOOTER, 14, 22);
    doc.text(`${months[selectedMonth - 1]} ${selectedYear}`, 14, 28);
    doc.text(`Category: ${staff.category} | Base Salary: ${formatCurrencyForPDF(staff.base_salary)}`, 14, 34);

    const staffAttendance = attendanceData.filter(a => a.staff_id === staff.id);
    const staffAdvances = advancesData.filter(a => a.staff_id === staff.id);

    const totalShifts = staffAttendance.reduce((sum, a) => {
      if (a.status === 'present') return sum + (a.shift_count || 1);
      return sum;
    }, 0);
    const absentDays = staffAttendance.filter(a => a.status === 'absent').length;
    const totalAdvance = staffAdvances.reduce((sum, a) => sum + Number(a.amount), 0);

    doc.setFontSize(12);
    doc.text('Summary:', 14, 44);
    doc.setFontSize(10);
    doc.text(`Total Shifts: ${totalShifts} | Absent Days: ${absentDays} | Total Advance: ${formatCurrencyForPDF(totalAdvance)}`, 14, 52);

    doc.setFontSize(12);
    doc.text('Daily Attendance:', 14, 64);
    
    const attData = monthDays.map(day => {
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
      body: attData,
      startY: 68,
      styles: { fontSize: 8 },
    });

    if (staffAdvances.length > 0) {
      const lastY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(12);
      doc.text('Advances Taken:', 14, lastY);
      
      const advData = staffAdvances.map(a => [
        format(new Date(a.date), 'dd/MM/yyyy'),
        formatCurrencyForPDF(Number(a.amount)),
        a.notes || '-',
      ]);

      autoTable(doc, {
        head: [['Date', 'Amount', 'Notes']],
        body: advData,
        startY: lastY + 4,
        styles: { fontSize: 8 },
      });
    }

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    addReportNotes(doc, finalY);

    return doc;
  };

  const generateCommonAttendancePDF = (isMlt = false): jsPDF => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const monthDays = Array.from({ length: getDaysInMonth(new Date(selectedYear, selectedMonth - 1)) }, (_, i) => i + 1);
    const staffData = isMlt ? mltStaffList : staffList;
    const attendanceData = isMlt ? mltAttendance : attendance;
    const title = isMlt ? 'MLT Monthly Attendance Report' : 'Monthly Attendance Report';
    
    doc.setFontSize(16);
    doc.text(`${title} - ${months[selectedMonth - 1]} ${selectedYear}`, 14, 15);
    doc.setFontSize(10);
    doc.text(REPORT_FOOTER, 14, 22);

    const headers = ['Staff', 'Category', ...monthDays.map(d => d.toString()), 'Shifts', 'Absent'];
    const tableData = staffData.map(staff => {
      const staffAtt = attendanceData.filter(a => a.staff_id === staff.id);
      let totalShifts = 0;
      let absentDays = 0;
      
      const days = monthDays.map(day => {
        const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const record = staffAtt.find(a => a.date === dateStr);
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

  const generateCommonAdvancesPDF = (isMlt = false): jsPDF => {
    const doc = new jsPDF();
    const staffData = isMlt ? mltStaffList : staffList;
    const advancesData = isMlt ? mltAdvances : advances;
    const title = isMlt ? 'MLT Monthly Advances Report' : 'Monthly Advances Report';
    
    doc.setFontSize(16);
    doc.text(`${title} - ${months[selectedMonth - 1]} ${selectedYear}`, 14, 15);
    doc.setFontSize(10);
    doc.text(REPORT_FOOTER, 14, 22);

    const totalAdvance = advancesData.reduce((sum, a) => sum + Number(a.amount), 0);
    doc.text(`Total Advances: ${formatCurrencyForPDF(totalAdvance)}`, 14, 30);

    const advancesByStaff = staffData.map(staff => {
      const staffAdv = advancesData.filter(a => a.staff_id === staff.id);
      const total = staffAdv.reduce((sum, a) => sum + Number(a.amount), 0);
      return { name: staff.name, category: staff.category, total, count: staffAdv.length };
    }).filter(s => s.total > 0);

    const tableData = advancesByStaff.map(s => [s.name, s.category, s.count.toString(), formatCurrencyForPDF(s.total)]);

    autoTable(doc, {
      head: [['Name', 'Category', 'Times', 'Total Amount']],
      body: tableData,
      startY: 38,
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    addReportNotes(doc, finalY);

    return doc;
  };

  const downloadBackupFolder = async (includeMLT = false) => {
    setIsGenerating(true);
    try {
      const zip = new JSZip();
      const folderName = includeMLT ? `MLT-Backup-${months[selectedMonth - 1]}-${selectedYear}` : `Backup-${months[selectedMonth - 1]}-${selectedYear}`;
      const folder = zip.folder(folderName);

      if (!folder) {
        toast.error('Failed to create backup folder');
        return;
      }

      const staffData = includeMLT ? mltStaffList : staffList;
      const categories = includeMLT ? ['driver', 'khalasi'] : ['petroleum', 'crusher', 'office'];
      
      for (const category of categories) {
        const categoryStaff = staffData.filter(s => s.category === category);
        if (categoryStaff.length === 0) continue;
        
        const categoryFolder = folder.folder(`Staff Reports - ${category.charAt(0).toUpperCase() + category.slice(1)}`);
        
        for (const staff of categoryStaff) {
          const pdf = generateStaffPDF(staff as Staff, includeMLT);
          const pdfBlob = pdf.output('blob');
          categoryFolder?.file(`${staff.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, pdfBlob);
        }
      }

      const commonFolder = folder.folder('Summary Reports');
      const attendancePDF = generateCommonAttendancePDF(includeMLT);
      commonFolder?.file('Monthly_Attendance.pdf', attendancePDF.output('blob'));
      
      const advancesPDF = generateCommonAdvancesPDF(includeMLT);
      commonFolder?.file('Monthly_Advances.pdf', advancesPDF.output('blob'));
      
      const XLSX = await import('xlsx');
      const attendanceData = includeMLT ? mltAttendance : attendance;
      const advancesData = includeMLT ? mltAdvances : advances;
      
      const attendanceHeaders = ['Staff', 'Category', 'Total Shifts', 'Absent Days'];
      const attExcelData = staffData.map(staff => {
        const staffAtt = attendanceData.filter(a => a.staff_id === staff.id);
        const totalShifts = staffAtt.reduce((sum, a) => a.status === 'present' ? sum + (a.shift_count || 1) : sum, 0);
        const absentDays = staffAtt.filter(a => a.status === 'absent').length;
        return [staff.name, staff.category, totalShifts, absentDays];
      });
      
      const attWb = XLSX.utils.book_new();
      const attWsData = [
        [`Monthly Attendance - ${months[selectedMonth - 1]} ${selectedYear}`],
        [REPORT_FOOTER],
        [],
        attendanceHeaders,
        ...attExcelData,
        [],
        ['Note: If you have any queries, contact 6203229118'],
        ['नोट: यदि आपके कोई प्रश्न हैं, तो 6203229118 पर संपर्क करें'],
      ];
      const attWs = XLSX.utils.aoa_to_sheet(attWsData);
      XLSX.utils.book_append_sheet(attWb, attWs, 'Attendance');
      const attExcelBuffer = XLSX.write(attWb, { type: 'array', bookType: 'xlsx' });
      commonFolder?.file('Monthly_Attendance.xlsx', new Blob([attExcelBuffer]));
      
      const advanceHeaders = ['Staff', 'Category', 'Times', 'Total Amount'];
      const advExcelData = staffData.map(staff => {
        const staffAdv = advancesData.filter(a => a.staff_id === staff.id);
        const total = staffAdv.reduce((sum, a) => sum + Number(a.amount), 0);
        return [staff.name, staff.category, staffAdv.length, total] as [string, string, number, number];
      }).filter(s => s[3] > 0);
      
      const advWb = XLSX.utils.book_new();
      const advWsData = [
        [`Monthly Advances - ${months[selectedMonth - 1]} ${selectedYear}`],
        [REPORT_FOOTER],
        [],
        advanceHeaders,
        ...advExcelData,
        [],
        ['Note: If you have any queries, contact 6203229118'],
        ['नोट: यदि आपके कोई प्रश्न हैं, तो 6203229118 पर संपर्क करें'],
      ];
      const advWs = XLSX.utils.aoa_to_sheet(advWsData);
      XLSX.utils.book_append_sheet(advWb, advWs, 'Advances');
      const advExcelBuffer = XLSX.write(advWb, { type: 'array', bookType: 'xlsx' });
      commonFolder?.file('Monthly_Advances.xlsx', new Blob([advExcelBuffer]));

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

  const downloadIndividualReport = (staff: Staff | MLTStaff, isMlt = false) => {
    const pdf = generateStaffPDF(staff as Staff, isMlt);
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

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="main">Main Staff</TabsTrigger>
          <TabsTrigger value="mlt">MLT Staff</TabsTrigger>
        </TabsList>

        <TabsContent value="main" className="space-y-4">
          {/* Download Full Backup */}
          <Card className="bg-primary/10 border-primary/20">
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
                onClick={() => downloadBackupFolder(false)}
                disabled={isGenerating || isLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Download Backup Folder'}
              </Button>
            </CardContent>
          </Card>

          {/* Common Reports */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Common Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full" onClick={() => {
                const pdf = generateCommonAttendancePDF(false);
                pdf.save(`Monthly-Attendance-${selectedMonth}-${selectedYear}.pdf`);
                toast.success('Attendance report downloaded');
              }}>
                <FileText className="h-4 w-4 mr-2" />Monthly Attendance Report
              </Button>
              <Button variant="outline" size="sm" className="w-full" onClick={() => {
                const pdf = generateCommonAdvancesPDF(false);
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
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {(['petroleum', 'crusher', 'office'] as const).map(category => {
                    const categoryStaff = staffList.filter(s => s.category === category);
                    if (categoryStaff.length === 0) return null;
                    return (
                      <div key={category}>
                        <p className="text-xs font-medium text-muted-foreground mb-2 capitalize">{category} ({categoryStaff.length})</p>
                        <div className="space-y-1">
                          {categoryStaff.map(staff => (
                            <div key={staff.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate">{staff.name}</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => downloadIndividualReport(staff)}>
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="mlt" className="space-y-4">
          {/* Download MLT Backup */}
          <Card className="bg-chart-1/10 border-chart-1/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-chart-1">
                  <Truck className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold">MLT Backup</h3>
                  <p className="text-sm text-muted-foreground">Download all MLT staff reports in a ZIP folder</p>
                </div>
              </div>
              <Button 
                className="w-full mt-4" 
                onClick={() => downloadBackupFolder(true)}
                disabled={isGenerating || isLoading}
              >
                <Download className="h-4 w-4 mr-2" />
                {isGenerating ? 'Generating...' : 'Download MLT Backup'}
              </Button>
            </CardContent>
          </Card>

          {/* MLT Common Reports */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">MLT Reports</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" size="sm" className="w-full" onClick={() => {
                const pdf = generateCommonAttendancePDF(true);
                pdf.save(`MLT-Attendance-${selectedMonth}-${selectedYear}.pdf`);
                toast.success('MLT Attendance report downloaded');
              }}>
                <FileText className="h-4 w-4 mr-2" />MLT Attendance Report
              </Button>
              <Button variant="outline" size="sm" className="w-full" onClick={() => {
                const pdf = generateCommonAdvancesPDF(true);
                pdf.save(`MLT-Advances-${selectedMonth}-${selectedYear}.pdf`);
                toast.success('MLT Advances report downloaded');
              }}>
                <FileText className="h-4 w-4 mr-2" />MLT Advances Report
              </Button>
            </CardContent>
          </Card>

          {/* Individual MLT Staff Reports */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Individual MLT Reports ({mltStaffList.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p className="text-center text-muted-foreground py-4">Loading...</p>
              ) : (
                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {(['driver', 'khalasi'] as const).map(category => {
                    const categoryStaff = mltStaffList.filter(s => s.category === category);
                    if (categoryStaff.length === 0) return null;
                    return (
                      <div key={category}>
                        <p className="text-xs font-medium text-muted-foreground mb-2 capitalize">{category} ({categoryStaff.length})</p>
                        <div className="space-y-1">
                          {categoryStaff.map(staff => (
                            <div key={staff.id} className="flex items-center justify-between p-2 rounded bg-muted/30">
                              <div className="min-w-0 flex-1">
                                <p className="font-medium text-sm truncate">{staff.name}</p>
                              </div>
                              <Button variant="ghost" size="sm" onClick={() => downloadIndividualReport(staff, true)}>
                                <Download className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BackupSection;
