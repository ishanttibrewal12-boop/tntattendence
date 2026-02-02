import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, User, Calendar, Wallet, FileText, Download, Share2, Search, Check, Camera, UserCog, DollarSign, Truck, FolderArchive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, getDaysInMonth, startOfMonth, subDays, addDays } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import { exportToExcel, addReportNotes, REPORT_FOOTER } from '@/lib/exportUtils';
import { formatFullCurrency } from '@/lib/formatUtils';

interface MLTStaff {
  id: string;
  name: string;
  category: 'driver' | 'khalasi';
  phone: string | null;
  address: string | null;
  notes: string | null;
  base_salary: number;
  is_active: boolean;
  photo_url: string | null;
  designation: string | null;
}

interface MLTAttendance {
  id: string;
  staff_id: string;
  date: string;
  status: string;
  shift_count: number | null;
}

interface MLTAdvance {
  id: string;
  staff_id: string;
  amount: number;
  date: string;
  notes: string | null;
  is_deducted: boolean;
}

interface MLTSectionProps {
  onBack: () => void;
}

type ViewType = 'home' | 'staff' | 'attendance' | 'advances' | 'reports' | 'profile' | 'staff-details' | 'salary' | 'backup' | 'daily-report';
type AttendanceStatus = '1shift' | '2shift' | 'absent' | 'not_marked';

const statusConfig = {
  '1shift': { label: '1', color: 'bg-green-500', fullLabel: '1 Shift' },
  '2shift': { label: '2', color: 'bg-primary', fullLabel: '2 Shifts' },
  'absent': { label: 'A', color: 'bg-destructive', fullLabel: 'Absent' },
  'not_marked': { label: '-', color: 'bg-muted', fullLabel: 'Not Marked' },
};

const MLTSection = ({ onBack }: MLTSectionProps) => {
  const [view, setView] = useState<ViewType>('home');
  const [staffList, setStaffList] = useState<MLTStaff[]>([]);
  const [attendance, setAttendance] = useState<MLTAttendance[]>([]);
  const [advances, setAdvances] = useState<MLTAdvance[]>([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState<MLTAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<MLTStaff | null>(null);
  
  // Staff form
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', category: 'driver' as 'driver' | 'khalasi', phone: '', address: '', notes: '', base_salary: 0, designation: '' });
  
  // Attendance
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'driver' | 'khalasi'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Advances
  const [showAddAdvance, setShowAddAdvance] = useState(false);
  const [advanceStaffId, setAdvanceStaffId] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceDate, setAdvanceDate] = useState(new Date());
  const [advanceNotes, setAdvanceNotes] = useState('');
  const [selectedAdvances, setSelectedAdvances] = useState<string[]>([]);
  const [advanceCalendarOpen, setAdvanceCalendarOpen] = useState(false);
  
  // Bulk delete
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'staff' | 'advances'>('staff');
  
  // Monthly report
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

  // Photo upload
  const [isUploading, setIsUploading] = useState(false);
  
  // Editing staff
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '', category: 'driver' as 'driver' | 'khalasi', base_salary: '', notes: '', designation: '' });

  // Salary
  const [salaryData, setSalaryData] = useState<{[staffId: string]: { totalShifts: number, totalAdvance: number, isPaid: boolean }}>();

  useEffect(() => {
    fetchData();
  }, [selectedDate, reportMonth, reportYear]);

  const fetchData = async () => {
    setIsLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const startDate = format(startOfMonth(new Date(reportYear, reportMonth - 1)), 'yyyy-MM-dd');
    const daysInMonth = getDaysInMonth(new Date(reportYear, reportMonth - 1));
    const endDate = `${reportYear}-${String(reportMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const [staffRes, attendanceRes, advancesRes, monthlyAttendanceRes] = await Promise.all([
      supabase.from('mlt_staff').select('*').eq('is_active', true).order('name'),
      supabase.from('mlt_attendance').select('*').eq('date', dateStr),
      supabase.from('mlt_advances').select('*').gte('date', startDate).lte('date', endDate).order('date', { ascending: false }),
      supabase.from('mlt_attendance').select('*').gte('date', startDate).lte('date', endDate),
    ]);

    if (staffRes.data) setStaffList(staffRes.data as MLTStaff[]);
    if (attendanceRes.data) setAttendance(attendanceRes.data as MLTAttendance[]);
    if (advancesRes.data) setAdvances(advancesRes.data as MLTAdvance[]);
    if (monthlyAttendanceRes.data) setMonthlyAttendance(monthlyAttendanceRes.data as MLTAttendance[]);
    
    // Calculate salary data
    if (staffRes.data && monthlyAttendanceRes.data && advancesRes.data) {
      const salaries: {[staffId: string]: { totalShifts: number, totalAdvance: number, isPaid: boolean }} = {};
      staffRes.data.forEach((staff: MLTStaff) => {
        const staffAttendance = monthlyAttendanceRes.data.filter((a: MLTAttendance) => a.staff_id === staff.id);
        const totalShifts = staffAttendance.reduce((sum: number, a: MLTAttendance) => sum + (a.shift_count || 1), 0);
        const staffAdvances = advancesRes.data.filter((a: MLTAdvance) => a.staff_id === staff.id);
        const totalAdvance = staffAdvances.reduce((sum: number, a: MLTAdvance) => sum + Number(a.amount), 0);
        salaries[staff.id] = { totalShifts, totalAdvance, isPaid: false };
      });
      setSalaryData(salaries);
    }
    
    setIsLoading(false);
  };

  const addStaff = async () => {
    if (!newStaff.name.trim()) {
      toast.error('Name is required');
      return;
    }

    const { error } = await supabase.from('mlt_staff').insert({
      name: newStaff.name,
      category: newStaff.category,
      phone: newStaff.phone || null,
      address: newStaff.address || null,
      notes: newStaff.notes || null,
      base_salary: newStaff.base_salary,
      designation: newStaff.designation || null,
    });

    if (error) {
      toast.error('Failed to add staff');
      return;
    }

    toast.success('Staff added');
    setShowAddStaff(false);
    setNewStaff({ name: '', category: 'driver', phone: '', address: '', notes: '', base_salary: 0, designation: '' });
    fetchData();
  };

  const deleteSelectedStaff = async () => {
    if (selectedStaffIds.length === 0) return;

    const { error } = await supabase.from('mlt_staff').update({ is_active: false }).in('id', selectedStaffIds);
    
    if (error) {
      toast.error('Failed to delete staff');
      return;
    }

    toast.success(`${selectedStaffIds.length} staff deleted`);
    setSelectedStaffIds([]);
    setShowDeleteConfirm(false);
    fetchData();
  };

  const updateAttendance = async (staffId: string, status: AttendanceStatus) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existing = attendance.find((a) => a.staff_id === staffId);

    const dbStatus = status === 'absent' ? 'absent' : status === 'not_marked' ? 'not_marked' : 'present';
    const shiftCount = status === '2shift' ? 2 : 1;

    if (existing) {
      if (status === 'not_marked') {
        await supabase.from('mlt_attendance').delete().eq('id', existing.id);
      } else {
        await supabase.from('mlt_attendance').update({ status: dbStatus, shift_count: shiftCount }).eq('id', existing.id);
      }
    } else if (status !== 'not_marked') {
      await supabase.from('mlt_attendance').insert({ staff_id: staffId, date: dateStr, status: dbStatus, shift_count: shiftCount });
    }

    toast.success(status === 'not_marked' ? 'Cleared' : 'Updated');
    fetchData();
  };

  const getStaffAttendance = (staffId: string): AttendanceStatus | null => {
    const record = attendance.find((a) => a.staff_id === staffId);
    if (!record) return null;
    if (record.status === 'absent') return 'absent';
    if (record.status === 'not_marked') return null;
    if (record.shift_count === 2) return '2shift';
    return '1shift';
  };

  const handleQuickTap = (staffId: string) => {
    const currentStatus = getStaffAttendance(staffId);
    if (!currentStatus) updateAttendance(staffId, '1shift');
    else if (currentStatus === '1shift') updateAttendance(staffId, '2shift');
    else if (currentStatus === '2shift') updateAttendance(staffId, 'absent');
    else updateAttendance(staffId, 'not_marked');
  };

  const addAdvance = async () => {
    if (!advanceStaffId || !advanceAmount) {
      toast.error('Staff and amount are required');
      return;
    }

    const { error } = await supabase.from('mlt_advances').insert({
      staff_id: advanceStaffId,
      amount: parseFloat(advanceAmount),
      date: format(advanceDate, 'yyyy-MM-dd'),
      notes: advanceNotes || null,
    });

    if (error) {
      toast.error('Failed to add advance');
      return;
    }

    toast.success('Advance added');
    setShowAddAdvance(false);
    setAdvanceStaffId('');
    setAdvanceAmount('');
    setAdvanceNotes('');
    fetchData();
  };

  const deleteSelectedAdvances = async () => {
    if (selectedAdvances.length === 0) return;

    const { error } = await supabase.from('mlt_advances').delete().in('id', selectedAdvances);
    
    if (error) {
      toast.error('Failed to delete advances');
      return;
    }

    toast.success(`${selectedAdvances.length} advances deleted`);
    setSelectedAdvances([]);
    setShowDeleteConfirm(false);
    fetchData();
  };

  const updateStaffDetails = async () => {
    if (!selectedStaff) return;

    const { error } = await supabase.from('mlt_staff').update({
      name: editForm.name,
      phone: editForm.phone || null,
      address: editForm.address || null,
      category: editForm.category,
      base_salary: parseFloat(editForm.base_salary) || 0,
      notes: editForm.notes || null,
      designation: editForm.designation || null,
    }).eq('id', selectedStaff.id);

    if (error) {
      toast.error('Failed to update');
      return;
    }

    toast.success('Updated successfully');
    setIsEditing(false);
    fetchData();
  };

  const handlePhotoUpload = async (file: File) => {
    if (!selectedStaff) return;
    
    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `mlt-${selectedStaff.id}-${Date.now()}.${fileExt}`;
      const filePath = `mlt-staff/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('photos').upload(filePath, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('photos').getPublicUrl(filePath);

      await supabase.from('mlt_staff').update({ photo_url: publicUrl }).eq('id', selectedStaff.id);

      toast.success('Photo uploaded');
      fetchData();
    } catch (error) {
      toast.error('Failed to upload photo');
    }
    setIsUploading(false);
  };

  const filteredStaff = staffList.filter(s => {
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(direction === 'prev' ? subDays(selectedDate, 1) : addDays(selectedDate, 1));
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const monthDays = Array.from({ length: getDaysInMonth(new Date(reportYear, reportMonth - 1)) }, (_, i) => i + 1);

  const getMonthlyAttendanceForStaff = (staffId: string) => {
    return monthlyAttendance.filter(a => a.staff_id === staffId);
  };

  const exportAttendancePDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    
    doc.setFontSize(16);
    doc.text(`MLT Monthly Attendance - ${months[reportMonth - 1]} ${reportYear}`, 14, 15);
    doc.setFontSize(10);
    doc.text(REPORT_FOOTER, 14, 22);

    const headers = ['Staff', 'Category', ...monthDays.map(d => d.toString()), 'Shifts'];
    const tableData = staffList.map(staff => {
      const staffAttendance = getMonthlyAttendanceForStaff(staff.id);
      let totalShifts = 0;
      const days = monthDays.map(day => {
        const dateStr = `${reportYear}-${String(reportMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayRecord = staffAttendance.find(a => a.date === dateStr);
        if (dayRecord && dayRecord.status === 'present') {
          const shifts = dayRecord.shift_count || 1;
          totalShifts += shifts;
          return shifts.toString();
        } else if (dayRecord && dayRecord.status === 'absent') {
          return 'A';
        }
        return '-';
      });
      return [staff.name, staff.category, ...days, totalShifts.toString()];
    });

    autoTable(doc, {
      head: [headers],
      body: tableData,
      startY: 28,
      styles: { fontSize: 6, cellPadding: 1 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    addReportNotes(doc, finalY);
    doc.save(`mlt-attendance-${reportMonth}-${reportYear}.pdf`);
    toast.success('PDF downloaded');
  };

  const exportAdvancesPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(`MLT Advances - ${months[reportMonth - 1]} ${reportYear}`, 14, 15);
    doc.setFontSize(10);
    doc.text(REPORT_FOOTER, 14, 22);

    const staffAdvances = advances.map(adv => {
      const staff = staffList.find(s => s.id === adv.staff_id);
      return [staff?.name || 'Unknown', staff?.category || '-', format(new Date(adv.date), 'dd/MM/yyyy'), formatFullCurrency(Number(adv.amount))];
    });

    autoTable(doc, {
      head: [['Name', 'Category', 'Date', 'Amount']],
      body: staffAdvances,
      startY: 28,
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    addReportNotes(doc, finalY);
    doc.save(`mlt-advances-${reportMonth}-${reportYear}.pdf`);
    toast.success('PDF downloaded');
  };

  const exportAttendanceExcel = () => {
    const headers = ['Staff', 'Category', 'Total Shifts', 'Absent Days'];
    const data = staffList.map(staff => {
      const staffAtt = getMonthlyAttendanceForStaff(staff.id);
      const totalShifts = staffAtt.reduce((sum, a) => sum + (a.shift_count || 1), 0);
      const absentDays = staffAtt.filter(a => a.status === 'absent').length;
      return [staff.name, staff.category, totalShifts, absentDays];
    });
    exportToExcel(data, headers, `mlt-attendance-${reportMonth}-${reportYear}`, 'Attendance', `MLT Attendance - ${months[reportMonth - 1]} ${reportYear}`);
    toast.success('Excel downloaded');
  };

  const shareAttendanceWhatsApp = () => {
    let message = `🚛 *MLT Attendance - ${months[reportMonth - 1]} ${reportYear}*\n\n`;
    staffList.forEach(staff => {
      const staffAtt = getMonthlyAttendanceForStaff(staff.id);
      const totalShifts = staffAtt.reduce((sum, a) => sum + (a.shift_count || 1), 0);
      message += `${staff.name}: ${totalShifts} shifts\n`;
    });
    message += `\n_${REPORT_FOOTER}_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareAdvancesWhatsApp = () => {
    let message = `🚛 *MLT Advances - ${months[reportMonth - 1]} ${reportYear}*\n\n`;
    const totalAdv = advances.reduce((sum, a) => sum + Number(a.amount), 0);
    message += `Total: ${formatFullCurrency(totalAdv)}\n\n`;
    staffList.forEach(staff => {
      const staffAdv = advances.filter(a => a.staff_id === staff.id);
      const total = staffAdv.reduce((sum, a) => sum + Number(a.amount), 0);
      if (total > 0) message += `${staff.name}: ${formatFullCurrency(total)}\n`;
    });
    message += `\n_${REPORT_FOOTER}_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const downloadMLTBackupZip = async () => {
    try {
      toast.loading('Generating backup...');
      const zip = new JSZip();
      const folderName = `MLT-Backup-${months[reportMonth - 1]}-${reportYear}`;
      const folder = zip.folder(folderName);
      if (!folder) return;

      for (const category of ['driver', 'khalasi']) {
        const catStaff = staffList.filter(s => s.category === category);
        if (catStaff.length === 0) continue;
        const catFolder = folder.folder(category.charAt(0).toUpperCase() + category.slice(1));
        
        for (const staff of catStaff) {
          const doc = new jsPDF();
          const staffAtt = getMonthlyAttendanceForStaff(staff.id);
          const totalShifts = staffAtt.reduce((sum, a) => sum + (a.shift_count || 1), 0);
          const staffAdv = advances.filter(a => a.staff_id === staff.id);
          const totalAdvance = staffAdv.reduce((sum, a) => sum + Number(a.amount), 0);

          doc.setFontSize(16);
          doc.text(`MLT Staff Report - ${staff.name}`, 14, 15);
          doc.setFontSize(10);
          doc.text(REPORT_FOOTER, 14, 22);
          doc.text(`${months[reportMonth - 1]} ${reportYear} | Category: ${staff.category}`, 14, 28);
          doc.text(`Total Shifts: ${totalShifts} | Total Advance: ${formatFullCurrency(totalAdvance)}`, 14, 36);

          const finalY = 50;
          addReportNotes(doc, finalY);
          catFolder?.file(`${staff.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, doc.output('blob'));
        }
      }

      const summaryFolder = folder.folder('Summary');
      const attPDF = new jsPDF({ orientation: 'landscape' });
      attPDF.setFontSize(16);
      attPDF.text(`MLT Attendance Summary - ${months[reportMonth - 1]} ${reportYear}`, 14, 15);
      attPDF.setFontSize(10);
      attPDF.text(REPORT_FOOTER, 14, 22);
      const attData = staffList.map(s => {
        const att = getMonthlyAttendanceForStaff(s.id);
        return [s.name, s.category, att.reduce((sum, a) => sum + (a.shift_count || 1), 0).toString()];
      });
      autoTable(attPDF, { head: [['Name', 'Category', 'Total Shifts']], body: attData, startY: 28 });
      addReportNotes(attPDF, (attPDF as any).lastAutoTable.finalY + 15);
      summaryFolder?.file('Attendance_Summary.pdf', attPDF.output('blob'));

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.dismiss();
      toast.success('MLT Backup downloaded!');
    } catch (error) {
      toast.dismiss();
      toast.error('Failed to generate backup');
    }
  };

  const exportAdvancesExcel = () => {
    const staffAdvances = advances.map(adv => {
      const staff = staffList.find(s => s.id === adv.staff_id);
      return [staff?.name || 'Unknown', staff?.category || '-', format(new Date(adv.date), 'dd/MM/yyyy'), Number(adv.amount)];
    });

    exportToExcel(staffAdvances, ['Name', 'Category', 'Date', 'Amount'], `mlt-advances-${reportMonth}-${reportYear}`, 'Advances', `MLT Advances - ${months[reportMonth - 1]} ${reportYear}`);
    toast.success('Excel downloaded');
  };

  const exportStaffProfilePDF = () => {
    if (!selectedStaff) return;
    const doc = new jsPDF();
    const staffAttendance = getMonthlyAttendanceForStaff(selectedStaff.id);
    const totalShifts = staffAttendance.reduce((sum, a) => sum + (a.shift_count || 1), 0);
    const staffAdvances = advances.filter(a => a.staff_id === selectedStaff.id);
    const totalAdvance = staffAdvances.reduce((sum, a) => sum + Number(a.amount), 0);

    doc.setFontSize(18);
    doc.text(`Staff Profile - ${selectedStaff.name}`, 14, 20);
    doc.setFontSize(10);
    doc.text(REPORT_FOOTER, 14, 28);
    doc.text(`Category: ${selectedStaff.category} | Month: ${months[reportMonth - 1]} ${reportYear}`, 14, 36);
    
    doc.setFontSize(12);
    doc.text('Summary:', 14, 48);
    doc.text(`Total Shifts: ${totalShifts}`, 14, 56);
    doc.text(`Total Advance: ${formatFullCurrency(totalAdvance)}`, 14, 64);
    doc.text(`Base Salary: ${formatFullCurrency(selectedStaff.base_salary)}`, 14, 72);

    if (selectedStaff.phone) doc.text(`Phone: ${selectedStaff.phone}`, 14, 82);
    if (selectedStaff.address) doc.text(`Address: ${selectedStaff.address}`, 14, 90);

    const finalY = 100;
    addReportNotes(doc, finalY);
    doc.save(`mlt-profile-${selectedStaff.name}-${reportMonth}-${reportYear}.pdf`);
    toast.success('PDF downloaded');
  };

  const renderHome = () => (
    <div className="space-y-3">
      {/* Header with Truck Icon */}
      <Card className="bg-chart-1/10 border-chart-1/20 mb-4">
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-chart-1"><Truck className="h-8 w-8 text-primary-foreground" /></div>
          <div>
            <h2 className="text-lg font-bold">MLT Department</h2>
            <p className="text-sm text-muted-foreground">Motor Lorry Transport</p>
          </div>
        </CardContent>
      </Card>

      <Card className="cursor-pointer hover:shadow-md" onClick={() => setView('staff')}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-primary"><User className="h-6 w-6 text-primary-foreground" /></div>
          <div><h3 className="font-semibold">Staff Management</h3><p className="text-sm text-muted-foreground">Add, view, delete staff</p></div>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:shadow-md" onClick={() => setView('attendance')}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-secondary"><Calendar className="h-6 w-6 text-primary-foreground" /></div>
          <div><h3 className="font-semibold">Attendance</h3><p className="text-sm text-muted-foreground">Mark daily attendance</p></div>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:shadow-md" onClick={() => setView('advances')}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-accent-foreground"><Wallet className="h-6 w-6 text-primary-foreground" /></div>
          <div><h3 className="font-semibold">Advances</h3><p className="text-sm text-muted-foreground">Track advance payments</p></div>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:shadow-md" onClick={() => setView('salary')}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-green-600"><DollarSign className="h-6 w-6 text-primary-foreground" /></div>
          <div><h3 className="font-semibold">Salary</h3><p className="text-sm text-muted-foreground">Calculate & mark paid</p></div>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:shadow-md" onClick={() => setView('staff-details')}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-chart-2"><UserCog className="h-6 w-6 text-primary-foreground" /></div>
          <div><h3 className="font-semibold">Staff Details</h3><p className="text-sm text-muted-foreground">View & edit with photos</p></div>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:shadow-md" onClick={() => setView('reports')}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-chart-1"><FileText className="h-6 w-6 text-primary-foreground" /></div>
          <div><h3 className="font-semibold">Monthly Reports</h3><p className="text-sm text-muted-foreground">Export & backup</p></div>
        </CardContent>
      </Card>
      <Card className="cursor-pointer hover:shadow-md" onClick={downloadMLTBackupZip}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-chart-4"><FolderArchive className="h-6 w-6 text-primary-foreground" /></div>
          <div><h3 className="font-semibold">Monthly Backup</h3><p className="text-sm text-muted-foreground">Download ZIP folder</p></div>
        </CardContent>
      </Card>
    </div>
  );

  const renderStaffManagement = () => (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input placeholder="Search staff..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="flex-1" />
        <Button onClick={() => setShowAddStaff(true)}><Plus className="h-4 w-4" /></Button>
      </div>

      <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Staff ({staffList.length})</SelectItem>
          <SelectItem value="driver">Driver ({staffList.filter(s => s.category === 'driver').length})</SelectItem>
          <SelectItem value="khalasi">Khalasi ({staffList.filter(s => s.category === 'khalasi').length})</SelectItem>
        </SelectContent>
      </Select>

      {selectedStaffIds.length > 0 && (
        <Button variant="destructive" size="sm" onClick={() => { setDeleteType('staff'); setShowDeleteConfirm(true); }}>
          <Trash2 className="h-4 w-4 mr-2" />Delete Selected ({selectedStaffIds.length})
        </Button>
      )}

      <div className="space-y-2">
        {filteredStaff.map(staff => (
          <Card key={staff.id} className="cursor-pointer">
            <CardContent className="p-3 flex items-center gap-3">
              <Checkbox 
                checked={selectedStaffIds.includes(staff.id)}
                onCheckedChange={(checked) => {
                  if (checked) setSelectedStaffIds([...selectedStaffIds, staff.id]);
                  else setSelectedStaffIds(selectedStaffIds.filter(id => id !== staff.id));
                }}
              />
              <div className="flex-1" onClick={() => { setSelectedStaff(staff); setEditForm({ name: staff.name, phone: staff.phone || '', address: staff.address || '', category: staff.category, base_salary: staff.base_salary.toString(), notes: staff.notes || '', designation: staff.designation || '' }); setView('profile'); }}>
                <p className="font-medium">{staff.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{staff.category}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAttendance = () => {
    const totalStaff = filteredStaff.length;
    const markedCount = attendance.filter(a => filteredStaff.some(s => s.id === a.staff_id)).length;
    const totalShifts = attendance.filter(a => a.status === 'present').reduce((sum, a) => sum + (a.shift_count || 1), 0);
    
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => navigateDate('prev')}>←</Button>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="ghost" className="flex flex-col items-center">
                    <p className="font-semibold">{format(selectedDate, 'EEEE')}</p>
                    <p className="text-sm text-muted-foreground">{format(selectedDate, 'dd MMM yyyy')}</p>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="center">
                  <CalendarComponent mode="single" selected={selectedDate} onSelect={(d) => { if (d) setSelectedDate(d); setCalendarOpen(false); }} initialFocus />
                </PopoverContent>
              </Popover>
              <Button variant="ghost" size="icon" onClick={() => navigateDate('next')}>→</Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="bg-primary/10">
            <CardContent className="p-2 text-center">
              <p className="text-lg font-bold">{markedCount}/{totalStaff}</p>
              <p className="text-xs text-muted-foreground">Marked</p>
            </CardContent>
          </Card>
          <Card className="bg-green-500/10">
            <CardContent className="p-2 text-center">
              <p className="text-lg font-bold">{totalShifts}</p>
              <p className="text-xs text-muted-foreground">Total Shifts</p>
            </CardContent>
          </Card>
          <Card className="bg-destructive/10">
            <CardContent className="p-2 text-center">
              <p className="text-lg font-bold">{attendance.filter(a => a.status === 'absent').length}</p>
              <p className="text-xs text-muted-foreground">Absent</p>
            </CardContent>
          </Card>
        </div>

        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff</SelectItem>
            <SelectItem value="driver">Driver</SelectItem>
            <SelectItem value="khalasi">Khalasi</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-green-500"></span> 1 Shift</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-primary"></span> 2 Shifts</span>
          <span className="flex items-center gap-1"><span className="w-4 h-4 rounded bg-destructive"></span> Absent</span>
        </div>

        <p className="text-xs text-muted-foreground">💡 Tap to cycle: 1 Shift → 2 Shifts → Absent → Clear</p>

        <div className="space-y-2">
          {filteredStaff.map(staff => {
            const status = getStaffAttendance(staff.id);
            return (
              <Card key={staff.id} className="cursor-pointer active:scale-[0.98]" onClick={() => handleQuickTap(staff.id)}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div>
                    <p className="font-medium">{staff.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{staff.category}</p>
                  </div>
                  {status ? (
                    <span className={`px-3 py-1.5 rounded text-sm font-medium text-primary-foreground ${statusConfig[status].color}`}>
                      {statusConfig[status].fullLabel}
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded text-sm border bg-muted text-muted-foreground">Not Marked</span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  const renderAdvances = () => (
    <div className="space-y-4">
      <Button onClick={() => setShowAddAdvance(true)} className="w-full"><Plus className="h-4 w-4 mr-2" />Add Advance</Button>

      <div className="grid grid-cols-2 gap-2">
        <Select value={reportMonth.toString()} onValueChange={(v) => setReportMonth(parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {months.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={reportYear.toString()} onValueChange={(v) => setReportYear(parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {selectedAdvances.length > 0 && (
        <Button variant="destructive" size="sm" onClick={() => { setDeleteType('advances'); setShowDeleteConfirm(true); }}>
          <Trash2 className="h-4 w-4 mr-2" />Delete Selected ({selectedAdvances.length})
        </Button>
      )}

      <div className="space-y-2">
        {advances.map(adv => {
          const staff = staffList.find(s => s.id === adv.staff_id);
          return (
            <Card key={adv.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <Checkbox 
                  checked={selectedAdvances.includes(adv.id)}
                  onCheckedChange={(checked) => {
                    if (checked) setSelectedAdvances([...selectedAdvances, adv.id]);
                    else setSelectedAdvances(selectedAdvances.filter(id => id !== adv.id));
                  }}
                />
                <div className="flex-1">
                  <p className="font-medium">{staff?.name || 'Unknown'}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(adv.date), 'dd MMM yyyy')}</p>
                </div>
                <p className="font-bold text-destructive">₹{Number(adv.amount).toLocaleString()}</p>
              </CardContent>
            </Card>
          );
        })}
        {advances.length === 0 && <p className="text-center text-muted-foreground py-4">No advances this month</p>}
      </div>
    </div>
  );

  const renderSalary = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Select value={reportMonth.toString()} onValueChange={(v) => setReportMonth(parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {months.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={reportYear.toString()} onValueChange={(v) => setReportYear(parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        {staffList.map(staff => {
          const data = salaryData?.[staff.id];
          const totalShifts = data?.totalShifts || 0;
          const totalAdvance = data?.totalAdvance || 0;
          const perShiftRate = staff.base_salary / 26;
          const earned = Math.round(totalShifts * perShiftRate);
          const netPayable = earned - totalAdvance;

          return (
            <Card key={staff.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold">{staff.name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{staff.category}</p>
                  </div>
                  <Button size="sm" variant={data?.isPaid ? 'default' : 'outline'} onClick={() => {
                    setSalaryData(prev => prev ? {...prev, [staff.id]: {...prev[staff.id], isPaid: !prev[staff.id]?.isPaid}} : prev);
                  }}>
                    {data?.isPaid ? <><Check className="h-3 w-3 mr-1" />Paid</> : 'Mark Paid'}
                  </Button>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-muted/50 p-2 rounded">
                    <p className="font-bold">{totalShifts}</p>
                    <p className="text-muted-foreground">Shifts</p>
                  </div>
                  <div className="bg-destructive/10 p-2 rounded">
                    <p className="font-bold text-destructive">{formatFullCurrency(totalAdvance)}</p>
                    <p className="text-muted-foreground">Advance</p>
                  </div>
                  <div className={`p-2 rounded ${netPayable >= 0 ? 'bg-green-500/10' : 'bg-destructive/10'}`}>
                    <p className={`font-bold ${netPayable >= 0 ? 'text-green-600' : 'text-destructive'}`}>{formatFullCurrency(netPayable)}</p>
                    <p className="text-muted-foreground">Net</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );

  const renderStaffDetails = () => (
    <div className="space-y-4">
      <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
      
      <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}>
        <SelectTrigger><SelectValue /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Staff</SelectItem>
          <SelectItem value="driver">Driver</SelectItem>
          <SelectItem value="khalasi">Khalasi</SelectItem>
        </SelectContent>
      </Select>

      <div className="space-y-2">
        {filteredStaff.map(staff => (
          <Card key={staff.id} className="cursor-pointer hover:shadow-md" onClick={() => { 
            setSelectedStaff(staff); 
            setEditForm({ name: staff.name, phone: staff.phone || '', address: staff.address || '', category: staff.category, base_salary: staff.base_salary.toString(), notes: staff.notes || '', designation: staff.designation || '' }); 
            setView('profile'); 
          }}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {staff.photo_url ? (
                  <img src={staff.photo_url} alt={staff.name} className="w-full h-full object-cover" />
                ) : (
                  <User className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="font-medium">{staff.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{staff.category} {staff.designation && `• ${staff.designation}`}</p>
              </div>
              <span className="text-muted-foreground">→</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Select value={reportMonth.toString()} onValueChange={(v) => setReportMonth(parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {months.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={reportYear.toString()} onValueChange={(v) => setReportYear(parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Attendance Reports */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Monthly Attendance Report</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground mb-2">All staff attendance for {months[reportMonth - 1]} {reportYear}</p>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="secondary" size="sm" onClick={exportAttendancePDF}>
              <Download className="h-3 w-3 mr-1" />PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={exportAttendanceExcel}>
              <Download className="h-3 w-3 mr-1" />Excel
            </Button>
            <Button variant="secondary" size="sm" onClick={shareAttendanceWhatsApp}>
              <Share2 className="h-3 w-3 mr-1" />Share
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Advances Reports */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Advances Report</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-3 gap-2">
            <Button variant="secondary" size="sm" onClick={exportAdvancesPDF}>
              <Download className="h-3 w-3 mr-1" />PDF
            </Button>
            <Button variant="secondary" size="sm" onClick={exportAdvancesExcel}>
              <Download className="h-3 w-3 mr-1" />Excel
            </Button>
            <Button variant="secondary" size="sm" onClick={shareAdvancesWhatsApp}>
              <Share2 className="h-3 w-3 mr-1" />Share
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Full Backup */}
      <Card className="bg-chart-1/10 border-chart-1/20">
        <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FolderArchive className="h-4 w-4" />Complete Backup</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">Download all MLT staff reports in a ZIP folder with PDF summaries</p>
          <Button className="w-full" onClick={downloadMLTBackupZip}>
            <Download className="h-4 w-4 mr-2" />Download MLT Backup ZIP
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderProfile = () => {
    if (!selectedStaff) return null;
    const staffAttendance = getMonthlyAttendanceForStaff(selectedStaff.id);
    const totalShifts = staffAttendance.reduce((sum, a) => sum + (a.shift_count || 1), 0);
    const staffAdvances = advances.filter(a => a.staff_id === selectedStaff.id);
    const totalAdvance = staffAdvances.reduce((sum, a) => sum + Number(a.amount), 0);

    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-24 h-24 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center overflow-hidden relative">
              {selectedStaff.photo_url ? (
                <img src={selectedStaff.photo_url} alt={selectedStaff.name} className="w-full h-full object-cover" />
              ) : (
                <User className="h-12 w-12 text-muted-foreground" />
              )}
              <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full cursor-pointer">
                <Camera className="h-4 w-4" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])} disabled={isUploading} />
              </label>
            </div>
            {isEditing ? (
              <Input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="text-center text-xl font-bold" />
            ) : (
              <h2 className="text-xl font-bold">{selectedStaff.name}</h2>
            )}
            <p className="text-muted-foreground capitalize">{selectedStaff.category}</p>
          </CardContent>
        </Card>

        <div className="flex gap-2">
          {!isEditing ? (
            <>
              <Button variant="outline" className="flex-1" onClick={() => setIsEditing(true)}>Edit</Button>
              <Button variant="secondary" className="flex-1" onClick={exportStaffProfilePDF}><Download className="h-4 w-4 mr-2" />Export</Button>
            </>
          ) : (
            <>
              <Button variant="outline" className="flex-1" onClick={() => setIsEditing(false)}>Cancel</Button>
              <Button className="flex-1" onClick={updateStaffDetails}>Save</Button>
            </>
          )}
        </div>

        {isEditing ? (
          <Card>
            <CardContent className="p-4 space-y-3">
              <div><Label>Phone</Label><Input value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} /></div>
              <div><Label>Address</Label><Textarea value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} /></div>
              <div><Label>Category</Label>
                <Select value={editForm.category} onValueChange={(v) => setEditForm({...editForm, category: v as 'driver' | 'khalasi'})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="driver">Driver</SelectItem>
                    <SelectItem value="khalasi">Khalasi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Designation</Label><Input value={editForm.designation} onChange={(e) => setEditForm({...editForm, designation: e.target.value})} /></div>
              <div><Label>Base Salary</Label><Input type="number" value={editForm.base_salary} onChange={(e) => setEditForm({...editForm, base_salary: e.target.value})} /></div>
              <div><Label>Notes</Label><Textarea value={editForm.notes} onChange={(e) => setEditForm({...editForm, notes: e.target.value})} /></div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-primary">{totalShifts}</p><p className="text-xs text-muted-foreground">Shifts This Month</p></CardContent></Card>
              <Card><CardContent className="p-3 text-center"><p className="text-2xl font-bold text-destructive">₹{totalAdvance.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Advance</p></CardContent></Card>
            </div>
            <Card>
              <CardContent className="p-4 space-y-2">
                {selectedStaff.phone && <p className="text-sm"><span className="text-muted-foreground">Phone:</span> {selectedStaff.phone}</p>}
                {selectedStaff.address && <p className="text-sm"><span className="text-muted-foreground">Address:</span> {selectedStaff.address}</p>}
                {selectedStaff.designation && <p className="text-sm"><span className="text-muted-foreground">Designation:</span> {selectedStaff.designation}</p>}
                <p className="text-sm"><span className="text-muted-foreground">Base Salary:</span> ₹{selectedStaff.base_salary.toLocaleString()}</p>
                {selectedStaff.notes && <p className="text-sm"><span className="text-muted-foreground">Notes:</span> {selectedStaff.notes}</p>}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => {
          if (view === 'home') onBack();
          else if (view === 'profile') setView('staff-details');
          else setView('home');
        }}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">
          {view === 'home' && 'MLT Section'}
          {view === 'staff' && 'Staff Management'}
          {view === 'attendance' && 'Attendance'}
          {view === 'advances' && 'Advances'}
          {view === 'reports' && 'Monthly Reports'}
          {view === 'profile' && selectedStaff?.name}
          {view === 'staff-details' && 'Staff Details'}
          {view === 'salary' && 'Salary'}
        </h1>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : (
        <>
          {view === 'home' && renderHome()}
          {view === 'staff' && renderStaffManagement()}
          {view === 'attendance' && renderAttendance()}
          {view === 'advances' && renderAdvances()}
          {view === 'reports' && renderReports()}
          {view === 'profile' && renderProfile()}
          {view === 'staff-details' && renderStaffDetails()}
          {view === 'salary' && renderSalary()}
        </>
      )}

      {/* Add Staff Dialog */}
      <Dialog open={showAddStaff} onOpenChange={setShowAddStaff}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Staff</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={newStaff.name} onChange={(e) => setNewStaff({ ...newStaff, name: e.target.value })} /></div>
            <div><Label>Category</Label>
              <Select value={newStaff.category} onValueChange={(v) => setNewStaff({ ...newStaff, category: v as 'driver' | 'khalasi' })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="driver">Driver</SelectItem>
                  <SelectItem value="khalasi">Khalasi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Phone</Label><Input value={newStaff.phone} onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })} /></div>
            <div><Label>Address</Label><Textarea value={newStaff.address} onChange={(e) => setNewStaff({ ...newStaff, address: e.target.value })} /></div>
            <div><Label>Designation</Label><Input value={newStaff.designation} onChange={(e) => setNewStaff({ ...newStaff, designation: e.target.value })} /></div>
            <div><Label>Base Salary</Label><Input type="number" value={newStaff.base_salary} onChange={(e) => setNewStaff({ ...newStaff, base_salary: parseFloat(e.target.value) || 0 })} /></div>
          </div>
          <DialogFooter><Button onClick={addStaff}>Add Staff</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Advance Dialog */}
      <Dialog open={showAddAdvance} onOpenChange={setShowAddAdvance}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Advance</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Staff *</Label>
              <Select value={advanceStaffId} onValueChange={setAdvanceStaffId}>
                <SelectTrigger><SelectValue placeholder="Select staff" /></SelectTrigger>
                <SelectContent>
                  {staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Amount (₹) *</Label><Input type="number" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} /></div>
            <div><Label>Date</Label>
              <Popover open={advanceCalendarOpen} onOpenChange={setAdvanceCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />
                    {format(advanceDate, 'dd MMM yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <CalendarComponent mode="single" selected={advanceDate} onSelect={(d) => { if (d) setAdvanceDate(d); setAdvanceCalendarOpen(false); }} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div><Label>Notes</Label><Textarea value={advanceNotes} onChange={(e) => setAdvanceNotes(e.target.value)} /></div>
          </div>
          <DialogFooter><Button onClick={addAdvance}>Add Advance</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deleteType === 'staff' ? `${selectedStaffIds.length} staff members` : `${selectedAdvances.length} advances`}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteType === 'staff' ? deleteSelectedStaff : deleteSelectedAdvances}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MLTSection;
