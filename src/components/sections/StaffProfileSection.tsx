import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, Share2, Calendar, User, Edit2, Save, X, Wallet, Search, Camera, Trash2, FileSpreadsheet, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, getDaysInMonth, startOfYear, endOfYear } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addReportNotes, REPORT_FOOTER, exportToExcel } from '@/lib/exportUtils';
import { formatCurrencyForPDF, formatFullCurrency } from '@/lib/formatUtils';

interface Staff {
  id: string;
  name: string;
  category: 'petroleum' | 'crusher' | 'office';
  phone: string | null;
  base_salary: number;
  notes: string | null;
  address: string | null;
  photo_url: string | null;
}

interface AttendanceRecord {
  date: string;
  status: string;
  shift_count: number | null;
}

interface Advance {
  id: string;
  amount: number;
  date: string;
  notes: string | null;
  is_deducted: boolean;
}

interface StaffProfileSectionProps {
  onBack: () => void;
  category?: 'petroleum' | 'crusher' | 'office';
}

const StaffProfileSection = ({ onBack, category }: StaffProfileSectionProps) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isLoading, setIsLoading] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesValue, setNotesValue] = useState('');
  const [confirmShare, setConfirmShare] = useState<'whatsapp' | 'pdf' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteAdvance, setDeleteAdvance] = useState<Advance | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [payrollStatus, setPayrollStatus] = useState<{ is_paid: boolean; paid_date: string | null } | null>(null);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchStaffList();
  }, []);

  useEffect(() => {
    if (selectedStaffId) {
      fetchStaffDetails();
    }
  }, [selectedStaffId, selectedMonth, selectedYear]);

  const fetchStaffList = async () => {
    let query = supabase.from('staff').select('id, name, category, phone, base_salary, notes, address, photo_url').eq('is_active', true).order('name');
    if (category) query = query.eq('category', category);
    const { data } = await query;
    if (data) setStaffList(data as Staff[]);
    setIsLoading(false);
  };

  const fetchStaffDetails = async () => {
    setIsLoading(true);

    const staff = staffList.find(s => s.id === selectedStaffId);
    if (staff) {
      setSelectedStaff(staff);
      setNotesValue(staff.notes || '');
    }

    const startDate = format(startOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');

    const [attendanceRes, advancesRes, payrollRes] = await Promise.all([
      supabase.from('attendance').select('date, status, shift_count').eq('staff_id', selectedStaffId).gte('date', startDate).lte('date', endDate).order('date'),
      supabase.from('advances').select('id, amount, date, notes, is_deducted').eq('staff_id', selectedStaffId).gte('date', startDate).lte('date', endDate).order('date', { ascending: false }),
      supabase.from('payroll').select('is_paid, paid_date').eq('staff_id', selectedStaffId).eq('month', selectedMonth).eq('year', selectedYear).single(),
    ]);

    if (attendanceRes.data) setAttendance(attendanceRes.data as AttendanceRecord[]);
    if (advancesRes.data) setAdvances(advancesRes.data as Advance[]);
    if (payrollRes.data) {
      setPayrollStatus(payrollRes.data);
    } else {
      setPayrollStatus(null);
    }
    setIsLoading(false);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedStaff) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploadingPhoto(true);

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        
        const { error } = await supabase
          .from('staff')
          .update({ photo_url: base64Data })
          .eq('id', selectedStaff.id);

        if (error) {
          toast.error('Failed to upload photo');
        } else {
          toast.success('Photo uploaded');
          setSelectedStaff({ ...selectedStaff, photo_url: base64Data });
          fetchStaffList();
        }
        setIsUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload photo');
      setIsUploadingPhoto(false);
    }
  };

  const removePhoto = async () => {
    if (!selectedStaff) return;
    
    const { error } = await supabase
      .from('staff')
      .update({ photo_url: null })
      .eq('id', selectedStaff.id);

    if (error) {
      toast.error('Failed to remove photo');
    } else {
      toast.success('Photo removed');
      setSelectedStaff({ ...selectedStaff, photo_url: null });
      fetchStaffList();
    }
  };

  const saveNotes = async () => {
    if (!selectedStaffId) return;

    const { error } = await supabase.from('staff').update({ notes: notesValue }).eq('id', selectedStaffId);
    if (error) {
      toast.error('Failed to save notes');
      return;
    }

    toast.success('Notes saved');
    setEditingNotes(false);
    
    // Update local state
    setStaffList(prev => prev.map(s => s.id === selectedStaffId ? { ...s, notes: notesValue } : s));
    if (selectedStaff) {
      setSelectedStaff({ ...selectedStaff, notes: notesValue });
    }
  };

  const handleDeleteAdvance = async () => {
    if (!deleteAdvance) return;
    
    const { error } = await supabase.from('advances').delete().eq('id', deleteAdvance.id);
    if (error) {
      toast.error('Failed to delete advance');
      return;
    }
    
    toast.success('Advance deleted');
    setDeleteAdvance(null);
    fetchStaffDetails();
  };

  const getStats = () => {
    const totalShifts = attendance.reduce((sum, a) => {
      if (a.status === 'present') {
        return sum + (a.shift_count || 1);
      }
      return sum;
    }, 0);
    
    const oneShiftDays = attendance.filter(a => a.status === 'present' && (a.shift_count || 1) === 1).length;
    const twoShiftDays = attendance.filter(a => a.status === 'present' && a.shift_count === 2).length;
    const absentDays = attendance.filter(a => a.status === 'absent').length;
    const totalAdvance = advances.reduce((sum, a) => sum + Number(a.amount), 0);

    return { totalShifts, oneShiftDays, twoShiftDays, absentDays, totalAdvance };
  };

  const stats = selectedStaff ? getStats() : null;

  const filteredStaffList = staffList.filter(staff =>
    staff.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calendar view helpers
  const monthDays = Array.from({ length: getDaysInMonth(new Date(selectedYear, selectedMonth - 1)) }, (_, i) => i + 1);
  
  const getAttendanceForDay = (day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return attendance.find(a => a.date === dateStr);
  };

  const generatePDFContent = () => {
    if (!selectedStaff || !stats) return null;

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`Staff Profile - ${selectedStaff.name}`, 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Category: ${selectedStaff.category}`, 14, 30);
    doc.text(`Month: ${months[selectedMonth - 1]} ${selectedYear}`, 14, 38);
    doc.text(REPORT_FOOTER, 14, 46);
    
    if (selectedStaff.notes) {
      doc.text(`Notes: ${selectedStaff.notes}`, 14, 54);
    }

    doc.setFontSize(14);
    doc.text('Attendance Summary', 14, 66);
    
    const summaryData = [
      ['Total Shifts', stats.totalShifts.toString()],
      ['1-Shift Days', stats.oneShiftDays.toString()],
      ['2-Shift Days', stats.twoShiftDays.toString()],
      ['Absent Days', stats.absentDays.toString()],
      ['Total Advance Taken', formatCurrencyForPDF(stats.totalAdvance)],
    ];

    autoTable(doc, {
      body: summaryData,
      startY: 72,
      theme: 'grid',
    });

    // Attendance details
    const attendanceData = attendance.map(a => [
      format(new Date(a.date), 'dd MMM yyyy'),
      a.status === 'present' ? `${a.shift_count || 1} Shift` : 'Absent',
    ]);

    if (attendanceData.length > 0) {
      doc.setFontSize(14);
      doc.text('Daily Attendance', 14, (doc as any).lastAutoTable.finalY + 15);
      
      autoTable(doc, {
        head: [['Date', 'Status']],
        body: attendanceData,
        startY: (doc as any).lastAutoTable.finalY + 20,
      });
    }

    // Advances
    if (advances.length > 0) {
      doc.setFontSize(14);
      doc.text('Advance Payment History', 14, (doc as any).lastAutoTable.finalY + 15);
      
      const advanceData = advances.map(a => [
        format(new Date(a.date), 'dd MMM yyyy'),
        formatCurrencyForPDF(Number(a.amount)),
        a.is_deducted ? 'Deducted' : 'Active',
        a.notes || '-',
      ]);

      autoTable(doc, {
        head: [['Date', 'Amount', 'Status', 'Notes']],
        body: advanceData,
        startY: (doc as any).lastAutoTable.finalY + 20,
      });
    }

    const finalY = (doc as any).lastAutoTable?.finalY + 15 || 100;
    addReportNotes(doc, finalY);

    return doc;
  };

  const exportToPDF = () => {
    const doc = generatePDFContent();
    if (!doc) return;

    doc.save(`staff-profile-${selectedStaff?.name}-${selectedMonth}-${selectedYear}.pdf`);
    toast.success('PDF downloaded');
    setConfirmShare(null);
  };

  const exportToExcelFile = () => {
    if (!selectedStaff || !stats) return;
    
    const headers = ['Date', 'Status', 'Shifts'];
    const data = attendance.map((a) => [
      format(new Date(a.date), 'dd MMM yyyy'),
      a.status === 'present' ? 'Present' : 'Absent',
      a.status === 'present' ? (a.shift_count || 1).toString() : '0',
    ]);
    
    exportToExcel(data, headers, `${selectedStaff.name}-${months[selectedMonth - 1]}-${selectedYear}`, 'Attendance', `${selectedStaff.name} - ${months[selectedMonth - 1]} ${selectedYear}`);
    toast.success('Excel downloaded');
  };

  const exportYearlyReport = async () => {
    if (!selectedStaff) return;
    
    toast.info('Generating yearly report...');
    
    const yearStart = format(startOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd');
    const yearEnd = format(endOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd');
    
    const [yearlyAttendance, yearlyAdvances] = await Promise.all([
      supabase.from('attendance').select('date, status, shift_count').eq('staff_id', selectedStaff.id).gte('date', yearStart).lte('date', yearEnd).order('date'),
      supabase.from('advances').select('id, amount, date, notes').eq('staff_id', selectedStaff.id).gte('date', yearStart).lte('date', yearEnd).order('date'),
    ]);

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`Yearly Report - ${selectedStaff.name}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Year: ${selectedYear}`, 14, 28);
    doc.text(`Category: ${selectedStaff.category}`, 14, 35);
    doc.text(REPORT_FOOTER, 14, 42);

    // Monthly breakdown for attendance
    const monthlyData: { month: string; shifts: number; absent: number; advance: number }[] = [];
    
    for (let m = 0; m < 12; m++) {
      const monthStart = format(startOfMonth(new Date(selectedYear, m)), 'yyyy-MM-dd');
      const monthEnd = format(endOfMonth(new Date(selectedYear, m)), 'yyyy-MM-dd');
      
      const monthAtt = (yearlyAttendance.data || []).filter(a => a.date >= monthStart && a.date <= monthEnd);
      const monthAdv = (yearlyAdvances.data || []).filter(a => a.date >= monthStart && a.date <= monthEnd);
      
      const totalShifts = monthAtt.filter(a => a.status === 'present').reduce((sum, a) => sum + (a.shift_count || 1), 0);
      const absentDays = monthAtt.filter(a => a.status === 'absent').length;
      const totalAdvance = monthAdv.reduce((sum, a) => sum + Number(a.amount), 0);
      
      monthlyData.push({ month: months[m], shifts: totalShifts, absent: absentDays, advance: totalAdvance });
    }

    const yearlyTotalShifts = monthlyData.reduce((sum, m) => sum + m.shifts, 0);
    const yearlyTotalAdvance = monthlyData.reduce((sum, m) => sum + m.advance, 0);

    const tableData = monthlyData.map(m => [m.month, m.shifts.toString(), m.absent.toString(), formatCurrencyForPDF(m.advance)]);

    autoTable(doc, {
      head: [['Month', 'Total Shifts', 'Absent Days', 'Advance Taken']],
      body: tableData,
      startY: 50,
    });

    let currentY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont(undefined!, 'bold');
    doc.text(`Yearly Total Shifts: ${yearlyTotalShifts}`, 14, currentY);
    doc.text(`Yearly Total Advance: ${formatCurrencyForPDF(yearlyTotalAdvance)}`, 14, currentY + 7);
    doc.setFont(undefined!, 'normal');

    addReportNotes(doc, currentY + 20);

    doc.save(`${selectedStaff.name}-yearly-${selectedYear}.pdf`);
    toast.success('Yearly report downloaded');
  };

  const shareYearlyWhatsApp = async () => {
    if (!selectedStaff) return;
    
    const yearStart = format(startOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd');
    const yearEnd = format(endOfYear(new Date(selectedYear, 0, 1)), 'yyyy-MM-dd');
    
    const [yearlyAttendance, yearlyAdvances] = await Promise.all([
      supabase.from('attendance').select('date, status, shift_count').eq('staff_id', selectedStaff.id).gte('date', yearStart).lte('date', yearEnd),
      supabase.from('advances').select('amount, date').eq('staff_id', selectedStaff.id).gte('date', yearStart).lte('date', yearEnd),
    ]);

    const totalShifts = (yearlyAttendance.data || []).filter(a => a.status === 'present').reduce((sum, a) => sum + (a.shift_count || 1), 0);
    const totalAdvance = (yearlyAdvances.data || []).reduce((sum, a) => sum + Number(a.amount), 0);

    let message = `👤 *Yearly Report - ${selectedStaff.name}*\n`;
    message += `📅 Year: ${selectedYear}\n`;
    message += `🏢 Category: ${selectedStaff.category}\n\n`;
    message += `📊 *Summary*\n`;
    message += `• Total Shifts: ${totalShifts}\n`;
    message += `• Total Advance: ${formatFullCurrency(totalAdvance)}\n\n`;
    message += `_${REPORT_FOOTER}_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const shareToWhatsApp = () => {
    if (!selectedStaff || !stats) return;

    let message = `👤 *Staff Profile*\n\n`;
    message += `*Name:* ${selectedStaff.name}\n`;
    message += `*Category:* ${selectedStaff.category}\n`;
    message += `*Month:* ${months[selectedMonth - 1]} ${selectedYear}\n\n`;
    
    if (selectedStaff.notes) {
      message += `📝 *Notes:* ${selectedStaff.notes}\n\n`;
    }

    message += `📊 *Attendance Summary*\n`;
    message += `• Total Shifts: ${stats.totalShifts}\n`;
    message += `• 1-Shift Days: ${stats.oneShiftDays}\n`;
    message += `• 2-Shift Days: ${stats.twoShiftDays}\n`;
    message += `• Absent Days: ${stats.absentDays}\n\n`;
    
    message += `💰 *Advance Summary*\n`;
    message += `• Total Advance Taken: ${formatFullCurrency(stats.totalAdvance)}\n\n`;

    message += `📅 *Daily Record*\n`;
    attendance.forEach(a => {
      const statusText = a.status === 'present' ? `${a.shift_count || 1} Shift` : 'Absent';
      message += `${format(new Date(a.date), 'dd MMM')}: ${statusText}\n`;
    });

    message += `\n_Tibrewal Staff Manager_`;

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
    setConfirmShare(null);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Staff Profiles</h1>
      </div>

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

      {/* Staff Selection */}
      <div className="mb-4">
        <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a staff member" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {filteredStaffList.map((staff) => (
              <SelectItem key={staff.id} value={staff.id}>
                <span className="truncate">{staff.name}</span>
                <span className="text-muted-foreground ml-1">({staff.category})</span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">{filteredStaffList.length} staff found</p>
      </div>

      {selectedStaff && (
        <>
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
                {[2024, 2025, 2026, 2027].map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Staff Info Card with Photo Upload */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  {selectedStaff.photo_url ? (
                    <img src={selectedStaff.photo_url} alt={selectedStaff.name} className="h-16 w-16 rounded-full object-cover border-4 border-primary/20" />
                  ) : (
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-8 w-8 text-primary" />
                    </div>
                  )}
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-lg font-bold text-foreground truncate">{selectedStaff.name}</h2>
                  <p className="text-sm text-muted-foreground capitalize">{selectedStaff.category}</p>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingPhoto}
                      className="text-xs h-7"
                    >
                      <Camera className="h-3 w-3 mr-1" />
                      {isUploadingPhoto ? '...' : selectedStaff.photo_url ? 'Change' : 'Add Photo'}
                    </Button>
                    {selectedStaff.photo_url && (
                      <Button variant="outline" size="sm" onClick={removePhoto} className="h-7 px-2">
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                Notes
                {!editingNotes ? (
                  <Button variant="ghost" size="sm" onClick={() => setEditingNotes(true)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                ) : (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={saveNotes}>
                      <Save className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { setEditingNotes(false); setNotesValue(selectedStaff.notes || ''); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {editingNotes ? (
                <Textarea
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  placeholder="Add notes about this staff..."
                  className="min-h-[80px]"
                />
              ) : (
                <p className="text-sm text-muted-foreground">
                  {selectedStaff.notes || 'No notes added'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Stats Cards */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : stats && (
            <>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-primary">{stats.totalShifts}</p>
                    <p className="text-xs text-muted-foreground">Total Shifts</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-destructive">{stats.absentDays}</p>
                    <p className="text-xs text-muted-foreground">Absent Days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-secondary">{stats.oneShiftDays}</p>
                    <p className="text-xs text-muted-foreground">1-Shift Days</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-3 text-center">
                    <p className="text-2xl font-bold text-secondary">{stats.twoShiftDays}</p>
                    <p className="text-xs text-muted-foreground">2-Shift Days</p>
                  </CardContent>
                </Card>
              </div>

              {/* Payment Status Card */}
              <Card className={`mb-4 ${payrollStatus?.is_paid ? 'bg-green-500/10 border-green-500/30' : 'bg-destructive/10 border-destructive/30'}`}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">Salary Status - {months[selectedMonth - 1]}</p>
                      <p className="text-xs text-muted-foreground">
                        {payrollStatus?.is_paid 
                          ? `Paid on ${payrollStatus.paid_date ? format(new Date(payrollStatus.paid_date), 'dd MMM yyyy') : 'N/A'}`
                          : 'Not Paid Yet'
                        }
                      </p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${payrollStatus?.is_paid ? 'bg-green-500 text-primary-foreground' : 'bg-destructive text-destructive-foreground'}`}>
                      {payrollStatus?.is_paid ? '✓ Paid' : '✗ Unpaid'}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Advance Summary with Deduction Status */}
              <Card className="mb-4 bg-muted/30">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <Wallet className="h-4 w-4" />
                    Advance Payment Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Total Advance Taken</span>
                    <span className="font-bold text-foreground">{formatFullCurrency(stats.totalAdvance)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Deducted</span>
                    <span className="font-medium text-green-600">{formatFullCurrency(advances.filter(a => a.is_deducted).reduce((sum, a) => sum + Number(a.amount), 0))}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Not Deducted</span>
                    <span className="font-medium text-destructive">{formatFullCurrency(advances.filter(a => !a.is_deducted).reduce((sum, a) => sum + Number(a.amount), 0))}</span>
                  </div>
                </CardContent>
              </Card>

              {/* View Toggle */}
              <div className="flex gap-2 mb-4">
                <Button 
                  variant={viewMode === 'list' ? 'default' : 'outline'} 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setViewMode('list')}
                >
                  List View
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

              {/* Calendar View */}
              {viewMode === 'calendar' && (
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Attendance Calendar
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-7 gap-1 text-center text-xs">
                      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                        <div key={i} className="p-1 font-medium text-muted-foreground">{d}</div>
                      ))}
                      {/* Empty cells for alignment */}
                      {Array.from({ length: new Date(selectedYear, selectedMonth - 1, 1).getDay() === 0 ? 6 : new Date(selectedYear, selectedMonth - 1, 1).getDay() - 1 }).map((_, i) => (
                        <div key={`empty-${i}`} className="p-1"></div>
                      ))}
                      {monthDays.map(day => {
                        const record = getAttendanceForDay(day);
                        let bgColor = 'bg-muted/30';
                        let text = '-';
                        if (record) {
                          if (record.status === 'absent') {
                            bgColor = 'bg-destructive text-destructive-foreground';
                            text = 'A';
                          } else if (record.status === 'present') {
                            const shifts = record.shift_count || 1;
                            bgColor = shifts === 2 ? 'bg-primary text-primary-foreground' : 'bg-green-500 text-primary-foreground';
                            text = shifts.toString();
                          }
                        }
                        return (
                          <div key={day} className={`p-1 rounded text-center min-h-[32px] ${bgColor}`}>
                            <div className="text-[10px]">{day}</div>
                            <div className="text-xs font-bold">{text}</div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Attendance List */}
              {viewMode === 'list' && (
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Attendance Record
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {attendance.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No attendance records</p>
                    ) : (
                      <div className="space-y-1 max-h-48 overflow-y-auto">
                        {attendance.map((record, index) => (
                          <div key={index} className="flex justify-between items-center text-sm py-1 border-b border-border last:border-0">
                            <span>{format(new Date(record.date), 'dd MMM yyyy')}</span>
                            <span className={record.status === 'present' ? 'text-green-600 font-medium' : 'text-destructive'}>
                              {record.status === 'present' ? `${record.shift_count || 1} Shift` : 'Absent'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Advance History with Deduction Status */}
              {advances.length > 0 && (
                <Card className="mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium flex items-center gap-2">
                      <Wallet className="h-4 w-4" />
                      Advance History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {advances.map((advance) => (
                        <div key={advance.id} className={`flex justify-between items-center text-sm py-2 px-2 rounded-lg ${advance.is_deducted ? 'bg-green-500/10' : 'bg-muted/30'}`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{formatFullCurrency(Number(advance.amount))}</span>
                              <span className={`text-xs px-1.5 py-0.5 rounded ${advance.is_deducted ? 'bg-green-500 text-primary-foreground' : 'bg-destructive text-destructive-foreground'}`}>
                                {advance.is_deducted ? 'Deducted' : 'Pending'}
                              </span>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(advance.date), 'dd MMM yyyy')}
                              {advance.notes && <span className="ml-1">• {advance.notes}</span>}
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setDeleteAdvance(advance)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Monthly Export Actions */}
              <Card className="mb-4">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Monthly Export</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" onClick={exportToPDF}>
                      <Download className="h-3 w-3 mr-1" />PDF
                    </Button>
                    <Button variant="outline" size="sm" onClick={exportToExcelFile}>
                      <FileSpreadsheet className="h-3 w-3 mr-1" />Excel
                    </Button>
                    <Button variant="outline" size="sm" onClick={shareToWhatsApp}>
                      <Share2 className="h-3 w-3 mr-1" />Share
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Yearly Report Actions */}
              <Card className="bg-chart-1/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Yearly Report ({selectedYear})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-xs text-muted-foreground">Export complete year data for {selectedStaff.name}</p>
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="secondary" size="sm" onClick={exportYearlyReport}>
                      <Download className="h-3 w-3 mr-1" />PDF Report
                    </Button>
                    <Button variant="secondary" size="sm" onClick={shareYearlyWhatsApp}>
                      <Share2 className="h-3 w-3 mr-1" />Share
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </>
      )}

      {/* Confirmation Dialog */}
      <AlertDialog open={!!confirmShare} onOpenChange={() => setConfirmShare(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Share</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {confirmShare === 'pdf' ? 'download PDF' : 'share via WhatsApp'} for {selectedStaff?.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmShare === 'pdf' ? exportToPDF : shareToWhatsApp}>
              Confirm
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Advance Dialog */}
      <AlertDialog open={!!deleteAdvance} onOpenChange={() => setDeleteAdvance(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Advance?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this advance of ₹{deleteAdvance?.amount} from {deleteAdvance?.date ? format(new Date(deleteAdvance.date), 'dd MMM yyyy') : ''}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAdvance}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StaffProfileSection;