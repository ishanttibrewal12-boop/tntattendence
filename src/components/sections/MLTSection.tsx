import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, User, Calendar, Wallet, FileText, Download, Share2, Search, Check, Camera, UserCog, DollarSign, Truck, FolderArchive, TrendingUp, Users, ChevronRight } from 'lucide-react';
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
import { Skeleton } from '@/components/ui/skeleton';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, getDaysInMonth, startOfMonth, subDays, addDays } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import JSZip from 'jszip';
import { exportToExcel, addReportNotes, REPORT_FOOTER } from '@/lib/exportUtils';
import { formatFullCurrency, formatCurrencyForPDF, getShiftRateForMonth } from '@/lib/formatUtils';

interface MLTStaff {
  id: string;
  name: string;
  category: 'driver' | 'khalasi';
  phone: string | null;
  address: string | null;
  notes: string | null;
  base_salary: number;
  shift_rate: number | null;
  shift_rate_28: number | null;
  shift_rate_30: number | null;
  shift_rate_31: number | null;
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
  '1shift': { label: '1', color: 'bg-emerald-500', fullLabel: '1 Shift', textColor: 'text-emerald-600' },
  '2shift': { label: '2', color: 'bg-primary', fullLabel: '2 Shifts', textColor: 'text-primary' },
  'absent': { label: 'A', color: 'bg-destructive', fullLabel: 'Absent', textColor: 'text-destructive' },
  'not_marked': { label: '-', color: 'bg-muted', fullLabel: 'Not Marked', textColor: 'text-muted-foreground' },
};

const MLTSection = ({ onBack }: MLTSectionProps) => {
  const [view, setView] = useState<ViewType>('home');
  const [staffList, setStaffList] = useState<MLTStaff[]>([]);
  const [attendance, setAttendance] = useState<MLTAttendance[]>([]);
  const [advances, setAdvances] = useState<MLTAdvance[]>([]);
  const [monthlyAttendance, setMonthlyAttendance] = useState<MLTAttendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<MLTStaff | null>(null);
  const handledPopState = useRef(false);

  // Browser back button support for view navigation
  const navigateToView = useCallback((newView: ViewType) => {
    window.history.pushState({ mltView: newView }, '');
    setView(newView);
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (handledPopState.current) { handledPopState.current = false; return; }
      if (view === 'profile') {
        handledPopState.current = true;
        setView('staff-details');
        window.history.pushState({}, '', '');
      } else if (view !== 'home') {
        handledPopState.current = true;
        setView('home');
        window.history.pushState({}, '', '');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [view]);
  
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', category: 'driver' as 'driver' | 'khalasi', phone: '', address: '', notes: '', base_salary: 0, designation: '' });
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'driver' | 'khalasi'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showAddAdvance, setShowAddAdvance] = useState(false);
  const [advanceStaffId, setAdvanceStaffId] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState('');
  const [advanceDate, setAdvanceDate] = useState(new Date());
  const [advanceNotes, setAdvanceNotes] = useState('');
  const [selectedAdvances, setSelectedAdvances] = useState<string[]>([]);
  const [advanceCalendarOpen, setAdvanceCalendarOpen] = useState(false);
  
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'staff' | 'advances'>('staff');
  
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());
  const [isUploading, setIsUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '', category: 'driver' as 'driver' | 'khalasi', base_salary: '', shift_rate_28: '', shift_rate_30: '', shift_rate_31: '', notes: '', designation: '' });
  const [salaryData, setSalaryData] = useState<{[staffId: string]: { totalShifts: number, totalAdvance: number }}>();
  const [salaryRecords, setSalaryRecords] = useState<any[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedForBulk, setSelectedForBulk] = useState<Set<string>>(new Set());

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

    const { data: currentSalaryRecords } = await supabase.from('salary_records')
      .select('*').eq('staff_type', 'mlt').eq('month', reportMonth).eq('year', reportYear);

    if (currentSalaryRecords) setSalaryRecords(currentSalaryRecords);
    if (staffRes.data) setStaffList(staffRes.data as MLTStaff[]);
    if (attendanceRes.data) setAttendance(attendanceRes.data as MLTAttendance[]);
    if (advancesRes.data) setAdvances(advancesRes.data as MLTAdvance[]);
    if (monthlyAttendanceRes.data) setMonthlyAttendance(monthlyAttendanceRes.data as MLTAttendance[]);
    
    if (staffRes.data && monthlyAttendanceRes.data && advancesRes.data) {
      const salaries: {[staffId: string]: { totalShifts: number, totalAdvance: number }} = {};
      staffRes.data.forEach((staff: MLTStaff) => {
        const staffAttendance = monthlyAttendanceRes.data.filter((a: MLTAttendance) => a.staff_id === staff.id);
        const totalShifts = staffAttendance.reduce((sum: number, a: MLTAttendance) => sum + (a.shift_count || 1), 0);
        const staffAdvances = advancesRes.data.filter((a: MLTAdvance) => a.staff_id === staff.id);
        const totalAdvance = staffAdvances.reduce((sum: number, a: MLTAdvance) => sum + Number(a.amount), 0);
        salaries[staff.id] = { totalShifts, totalAdvance };
      });
      setSalaryData(salaries);
    }
    setIsLoading(false);
  };

  // === CRUD Operations (unchanged logic) ===
  const addStaff = async () => {
    if (!newStaff.name.trim()) { toast.error('Name is required'); return; }
    const { error } = await supabase.from('mlt_staff').insert({
      name: newStaff.name, category: newStaff.category, phone: newStaff.phone || null,
      address: newStaff.address || null, notes: newStaff.notes || null, base_salary: newStaff.base_salary,
      designation: newStaff.designation || null,
    });
    if (error) { toast.error('Failed to add staff'); return; }
    toast.success('Staff added');
    setShowAddStaff(false);
    setNewStaff({ name: '', category: 'driver', phone: '', address: '', notes: '', base_salary: 0, designation: '' });
    fetchData();
  };

  const deleteSelectedStaff = async () => {
    if (selectedStaffIds.length === 0) return;
    const { error } = await supabase.from('mlt_staff').update({ is_active: false }).in('id', selectedStaffIds);
    if (error) { toast.error('Failed to delete staff'); return; }
    toast.success(`${selectedStaffIds.length} staff deleted`);
    setSelectedStaffIds([]); setShowDeleteConfirm(false); fetchData();
  };

  const updateAttendance = async (staffId: string, status: AttendanceStatus) => {
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const existing = attendance.find((a) => a.staff_id === staffId);
    const dbStatus = status === 'absent' ? 'absent' : status === 'not_marked' ? 'not_marked' : 'present';
    const shiftCount = status === '2shift' ? 2 : 1;

    if (existing) {
      if (status === 'not_marked') await supabase.from('mlt_attendance').delete().eq('id', existing.id);
      else await supabase.from('mlt_attendance').update({ status: dbStatus, shift_count: shiftCount }).eq('id', existing.id);
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
    if (!advanceStaffId || !advanceAmount) { toast.error('Staff and amount are required'); return; }
    const { error } = await supabase.from('mlt_advances').insert({
      staff_id: advanceStaffId, amount: parseFloat(advanceAmount),
      date: format(advanceDate, 'yyyy-MM-dd'), notes: advanceNotes || null,
    });
    if (error) { toast.error('Failed to add advance'); return; }
    toast.success('Advance added');
    setShowAddAdvance(false); setAdvanceStaffId(''); setAdvanceAmount(''); setAdvanceNotes(''); fetchData();
  };

  const deleteSelectedAdvances = async () => {
    if (selectedAdvances.length === 0) return;
    const { error } = await supabase.from('mlt_advances').delete().in('id', selectedAdvances);
    if (error) { toast.error('Failed to delete advances'); return; }
    toast.success(`${selectedAdvances.length} advances deleted`);
    setSelectedAdvances([]); setShowDeleteConfirm(false); fetchData();
  };

  const updateStaffDetails = async () => {
    if (!selectedStaff) return;
    const { error } = await supabase.from('mlt_staff').update({
      name: editForm.name, phone: editForm.phone || null, address: editForm.address || null,
      category: editForm.category, base_salary: parseFloat(editForm.base_salary) || 0,
      shift_rate_28: parseFloat(editForm.shift_rate_28) || 0, shift_rate_30: parseFloat(editForm.shift_rate_30) || 0,
      shift_rate_31: parseFloat(editForm.shift_rate_31) || 0, notes: editForm.notes || null,
      designation: editForm.designation || null,
    }).eq('id', selectedStaff.id);
    if (error) { toast.error('Failed to update'); return; }
    toast.success('Updated successfully'); setIsEditing(false); fetchData();
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
      toast.success('Photo uploaded'); fetchData();
    } catch (error) { toast.error('Failed to upload photo'); }
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

  const getMonthlyAttendanceForStaff = (staffId: string) => monthlyAttendance.filter(a => a.staff_id === staffId);

  // === Export Functions ===
  const exportAttendancePDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(16); doc.text(`MLT Monthly Attendance - ${months[reportMonth - 1]} ${reportYear}`, 14, 15);
    doc.setFontSize(10); doc.text(REPORT_FOOTER, 14, 22);
    const headers = ['Staff', 'Category', ...monthDays.map(d => d.toString()), 'Shifts'];
    const tableData = staffList.map(staff => {
      const staffAttendance = getMonthlyAttendanceForStaff(staff.id);
      let totalShifts = 0;
      const days = monthDays.map(day => {
        const dateStr = `${reportYear}-${String(reportMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const dayRecord = staffAttendance.find(a => a.date === dateStr);
        if (dayRecord && dayRecord.status === 'present') { const shifts = dayRecord.shift_count || 1; totalShifts += shifts; return shifts.toString(); }
        else if (dayRecord && dayRecord.status === 'absent') return 'A';
        return '-';
      });
      return [staff.name, staff.category, ...days, totalShifts.toString()];
    });
    autoTable(doc, { head: [headers], body: tableData, startY: 28, styles: { fontSize: 6, cellPadding: 1 } });
    addReportNotes(doc, (doc as any).lastAutoTable.finalY + 15);
    doc.save(`mlt-attendance-${reportMonth}-${reportYear}.pdf`); toast.success('PDF downloaded');
  };

  const exportAdvancesPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text(`MLT Advances - ${months[reportMonth - 1]} ${reportYear}`, 14, 15);
    doc.setFontSize(10); doc.text(REPORT_FOOTER, 14, 22);
    const staffAdvances = advances.map(adv => {
      const staff = staffList.find(s => s.id === adv.staff_id);
      return [staff?.name || 'Unknown', staff?.category || '-', format(new Date(adv.date), 'dd/MM/yyyy'), formatCurrencyForPDF(Number(adv.amount))];
    });
    autoTable(doc, { head: [['Name', 'Category', 'Date', 'Amount']], body: staffAdvances, startY: 28 });
    addReportNotes(doc, (doc as any).lastAutoTable.finalY + 15);
    doc.save(`mlt-advances-${reportMonth}-${reportYear}.pdf`); toast.success('PDF downloaded');
  };

  const exportAttendanceExcel = () => {
    const headers = ['Staff', 'Category', 'Total Shifts', 'Absent Days'];
    const data = staffList.map(staff => {
      const staffAtt = getMonthlyAttendanceForStaff(staff.id);
      return [staff.name, staff.category, staffAtt.reduce((sum, a) => sum + (a.shift_count || 1), 0), staffAtt.filter(a => a.status === 'absent').length];
    });
    exportToExcel(data, headers, `mlt-attendance-${reportMonth}-${reportYear}`, 'Attendance', `MLT Attendance - ${months[reportMonth - 1]} ${reportYear}`);
    toast.success('Excel downloaded');
  };

  const shareAttendanceWhatsApp = () => {
    let message = `🚛 *MLT Attendance - ${months[reportMonth - 1]} ${reportYear}*\n\n`;
    staffList.forEach(staff => {
      const totalShifts = getMonthlyAttendanceForStaff(staff.id).reduce((sum, a) => sum + (a.shift_count || 1), 0);
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
      const total = advances.filter(a => a.staff_id === staff.id).reduce((sum, a) => sum + Number(a.amount), 0);
      if (total > 0) message += `${staff.name}: ${formatFullCurrency(total)}\n`;
    });
    message += `\n_${REPORT_FOOTER}_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const exportDailyAttendancePDF = () => {
    const doc = new jsPDF();
    const dateStr = format(selectedDate, 'dd MMM yyyy, EEEE');
    doc.setFontSize(16); doc.text(`MLT Daily Attendance - ${dateStr}`, 14, 15);
    doc.setFontSize(10); doc.text(REPORT_FOOTER, 14, 22);
    const tableData = filteredStaff.map(staff => {
      const status = getStaffAttendance(staff.id);
      return [staff.name, staff.category, status ? statusConfig[status].fullLabel : 'Not Marked'];
    });
    autoTable(doc, { head: [['Name', 'Category', 'Status']], body: tableData, startY: 28 });
    addReportNotes(doc, (doc as any).lastAutoTable.finalY + 15);
    doc.save(`mlt-daily-attendance-${format(selectedDate, 'yyyy-MM-dd')}.pdf`); toast.success('PDF downloaded');
  };

  const shareDailyAttendanceWhatsApp = () => {
    const dateStr = format(selectedDate, 'dd MMM yyyy, EEEE');
    let message = `🚛 *MLT Attendance - ${dateStr}*\n\n`;
    const totalShifts = attendance.filter(a => a.status === 'present').reduce((sum, a) => sum + (a.shift_count || 1), 0);
    const absentCount = attendance.filter(a => a.status === 'absent').length;
    message += `*Summary:* ${totalShifts} shifts | ${absentCount} absent\n\n`;
    filteredStaff.forEach(staff => {
      const status = getStaffAttendance(staff.id);
      message += `${staff.name}: ${status ? statusConfig[status].fullLabel : '-'}\n`;
    });
    message += `\n_${REPORT_FOOTER}_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const getStaffSalaryCalc = (staff: MLTStaff) => {
    const data = salaryData?.[staff.id];
    const totalShifts = data?.totalShifts || 0;
    const totalAdvance = data?.totalAdvance || 0;
    const shiftRate = getShiftRateForMonth(staff, reportMonth, reportYear);
    const shiftAmount = totalShifts * shiftRate;
    const payable = shiftAmount - totalAdvance;
    return { totalShifts, totalAdvance, shiftRate, shiftAmount, payable };
  };

  const exportSingleStaffSalaryPDF = (staff: MLTStaff) => {
    const calc = getStaffSalaryCalc(staff);
    const staffAdvancesList = advances.filter(a => a.staff_id === staff.id);
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text(`Salary Report - ${staff.name}`, 14, 15);
    doc.setFontSize(10); doc.text(`${months[reportMonth - 1]} ${reportYear} | ${staff.category}`, 14, 22);
    doc.text(REPORT_FOOTER, 14, 28);
    doc.setFontSize(12);
    doc.text(`Shift Rate: Rs. ${calc.shiftRate}/shift`, 14, 40);
    doc.text(`Total Shifts: ${calc.totalShifts}`, 14, 48);
    doc.text(`Shift Amount: Rs. ${calc.shiftAmount.toLocaleString('en-IN')}`, 14, 56);
    doc.text(`Total Advances: Rs. ${calc.totalAdvance.toLocaleString('en-IN')}`, 14, 64);
    doc.text(`Payable: Rs. ${calc.payable.toLocaleString('en-IN')}`, 14, 72);
    if (staffAdvancesList.length > 0) {
      doc.text('Date-wise Advances:', 14, 86);
      autoTable(doc, { head: [['Date', 'Amount', 'Notes']], body: staffAdvancesList.map(a => [format(new Date(a.date), 'dd/MM/yyyy'), formatCurrencyForPDF(Number(a.amount)), a.notes || '-']), startY: 90, styles: { fontSize: 8 } });
    }
    addReportNotes(doc, staffAdvancesList.length > 0 ? (doc as any).lastAutoTable.finalY + 15 : 86);
    doc.save(`salary-${staff.name}-${reportMonth}-${reportYear}.pdf`); toast.success('PDF downloaded');
  };

  const shareSingleStaffSalaryWhatsApp = (staff: MLTStaff) => {
    const calc = getStaffSalaryCalc(staff);
    const staffAdvancesList = advances.filter(a => a.staff_id === staff.id);
    let message = `💰 *Salary - ${staff.name}*\n📅 ${months[reportMonth - 1]} ${reportYear}\n\n`;
    message += `Rate: ₹${calc.shiftRate}/shift\n${calc.totalShifts} shifts × ₹${calc.shiftRate} = ₹${calc.shiftAmount.toLocaleString()}\n`;
    if (staffAdvancesList.length > 0) {
      message += `\n📋 *Advances:*\n`;
      staffAdvancesList.forEach(a => { message += `  ${format(new Date(a.date), 'dd MMM')}: -₹${Number(a.amount).toLocaleString()}${a.notes ? ` (${a.notes})` : ''}\n`; });
      message += `Total Advances: -₹${calc.totalAdvance.toLocaleString()}\n`;
    }
    message += `\n*Payable: ₹${calc.payable.toLocaleString()}*\n\n_${REPORT_FOOTER}_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  const exportSalaryPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text(`MLT Salary Report - ${months[reportMonth - 1]} ${reportYear}`, 14, 15);
    doc.setFontSize(10); doc.text(REPORT_FOOTER, 14, 22);
    const tableData = staffList.map(staff => {
      const calc = getStaffSalaryCalc(staff);
      return [staff.name, staff.category, `Rs. ${calc.shiftRate}/shift`, calc.totalShifts.toString(), formatCurrencyForPDF(calc.shiftAmount), formatCurrencyForPDF(calc.totalAdvance), formatCurrencyForPDF(calc.payable)];
    });
    autoTable(doc, { head: [['Name', 'Category', 'Rate', 'Shifts', 'Shift Amt', 'Advance', 'Payable']], body: tableData, startY: 28, styles: { fontSize: 7 } });
    addReportNotes(doc, (doc as any).lastAutoTable.finalY + 15);
    doc.save(`mlt-salary-${reportMonth}-${reportYear}.pdf`); toast.success('PDF downloaded');
  };

  const exportSalaryExcel = () => {
    const headers = ['Name', 'Category', 'Shift Rate', 'Shifts', 'Shift Amount', 'Advance', 'Payable'];
    const data = staffList.map(staff => {
      const calc = getStaffSalaryCalc(staff);
      return [staff.name, staff.category, calc.shiftRate, calc.totalShifts, calc.shiftAmount, calc.totalAdvance, calc.payable];
    });
    exportToExcel(data, headers, `mlt-salary-${reportMonth}-${reportYear}`, 'Salary', `MLT Salary - ${months[reportMonth - 1]} ${reportYear}`);
    toast.success('Excel downloaded');
  };

  const shareSalaryWhatsApp = () => {
    let message = `🚛 *MLT Salary - ${months[reportMonth - 1]} ${reportYear}*\n\n`;
    staffList.forEach(staff => {
      const calc = getStaffSalaryCalc(staff);
      message += `*${staff.name}*\n   ${calc.totalShifts} shifts × ₹${calc.shiftRate} = ₹${calc.shiftAmount.toLocaleString()}\n   Advances: -₹${calc.totalAdvance.toLocaleString()}\n   *Payable: ₹${calc.payable.toLocaleString()}*\n\n`;
    });
    message += `_${REPORT_FOOTER}_`;
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
          doc.setFontSize(16); doc.text(`MLT Staff Report - ${staff.name}`, 14, 15);
          doc.setFontSize(10); doc.text(REPORT_FOOTER, 14, 22);
          doc.text(`${months[reportMonth - 1]} ${reportYear} | Category: ${staff.category}`, 14, 28);
          doc.text(`Total Shifts: ${totalShifts} | Total Advance: ${formatCurrencyForPDF(totalAdvance)}`, 14, 36);
          addReportNotes(doc, 50);
          catFolder?.file(`${staff.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`, doc.output('blob'));
        }
      }
      const summaryFolder = folder.folder('Summary');
      const attPDF = new jsPDF({ orientation: 'landscape' });
      attPDF.setFontSize(16); attPDF.text(`MLT Attendance Summary - ${months[reportMonth - 1]} ${reportYear}`, 14, 15);
      attPDF.setFontSize(10); attPDF.text(REPORT_FOOTER, 14, 22);
      autoTable(attPDF, { head: [['Name', 'Category', 'Total Shifts']], body: staffList.map(s => [s.name, s.category, getMonthlyAttendanceForStaff(s.id).reduce((sum, a) => sum + (a.shift_count || 1), 0).toString()]), startY: 28 });
      addReportNotes(attPDF, (attPDF as any).lastAutoTable.finalY + 15);
      summaryFolder?.file('Attendance_Summary.pdf', attPDF.output('blob'));
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a'); a.href = url; a.download = `${folderName}.zip`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.dismiss(); toast.success('MLT Backup downloaded!');
    } catch (error) { toast.dismiss(); toast.error('Failed to generate backup'); }
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
    const staffAttendanceList = getMonthlyAttendanceForStaff(selectedStaff.id);
    const totalShifts = staffAttendanceList.reduce((sum, a) => sum + (a.shift_count || 1), 0);
    const staffAdvancesList = advances.filter(a => a.staff_id === selectedStaff.id);
    const totalAdvance = staffAdvancesList.reduce((sum, a) => sum + Number(a.amount), 0);
    doc.setFontSize(18); doc.text(`Staff Profile - ${selectedStaff.name}`, 14, 20);
    doc.setFontSize(10); doc.text(REPORT_FOOTER, 14, 28);
    doc.text(`Category: ${selectedStaff.category} | Month: ${months[reportMonth - 1]} ${reportYear}`, 14, 36);
    doc.setFontSize(12);
    doc.text(`Total Shifts: ${totalShifts}`, 14, 48);
    doc.text(`Total Advance: ${formatCurrencyForPDF(totalAdvance)}`, 14, 56);
    doc.text(`Base Salary: ${formatCurrencyForPDF(selectedStaff.base_salary)}`, 14, 64);
    if (selectedStaff.phone) doc.text(`Phone: ${selectedStaff.phone}`, 14, 74);
    if (selectedStaff.address) doc.text(`Address: ${selectedStaff.address}`, 14, 82);
    addReportNotes(doc, 92);
    doc.save(`mlt-profile-${selectedStaff.name}-${reportMonth}-${reportYear}.pdf`); toast.success('PDF downloaded');
  };

  // === Loading Skeleton ===
  const LoadingSkeleton = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        {[1,2,3].map(i => <Skeleton key={i} className="h-20 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {[1,2,3,4].map(i => <Skeleton key={i} className="h-24 rounded-xl" />)}
      </div>
      <div className="space-y-2">
        {[1,2,3].map(i => <Skeleton key={i} className="h-16 rounded-xl" />)}
      </div>
    </div>
  );

  // === Enhanced Home Dashboard ===
  const renderHome = () => {
    const driverCount = staffList.filter(s => s.category === 'driver').length;
    const khalCount = staffList.filter(s => s.category === 'khalasi').length;

    return (
      <div className="space-y-5 section-enter">
        {/* Hero Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-5">
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/5 rounded-full -translate-y-8 translate-x-8" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/5 rounded-full translate-y-6 -translate-x-6" />
          <div className="relative z-10 flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary-foreground/15 backdrop-blur-sm">
              <Truck className="h-9 w-9 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-primary-foreground">MLT Department</h2>
              <p className="text-sm text-primary-foreground/80">{driverCount} Drivers · {khalCount} Khalasi</p>
            </div>
          </div>
        </div>

        {/* Shift Rate Configuration */}
        <div>
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">Staff Shift Rates</p>
          <div className="space-y-2 max-h-[40vh] overflow-y-auto smooth-scroll">
            {staffList.map(staff => {
              const rate28 = staff.shift_rate_28 || 0;
              const rate30 = staff.shift_rate_30 || 0;
              const rate31 = staff.shift_rate_31 || 0;
              return (
                <Card key={staff.id} className="border-0 shadow-sm">
                  <CardContent className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                        {staff.photo_url ? <img src={staff.photo_url} alt="" className="w-full h-full object-cover" /> : <User className="h-4 w-4 text-muted-foreground" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate text-foreground">{staff.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{staff.category}</p>
                      </div>
                      <div className="text-right text-xs space-y-0.5">
                        <p className="text-muted-foreground">28d: <span className="font-semibold text-foreground">₹{rate28.toLocaleString()}</span></p>
                        <p className="text-muted-foreground">30d: <span className="font-semibold text-foreground">₹{rate30.toLocaleString()}</span></p>
                        <p className="text-muted-foreground">31d: <span className="font-semibold text-foreground">₹{rate31.toLocaleString()}</span></p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {staffList.length === 0 && <p className="text-center text-sm text-muted-foreground py-6">No staff added yet</p>}
          </div>
        </div>

        {/* Primary Actions */}
        <div className="grid grid-cols-3 gap-2.5">
          {[
            { view: 'attendance' as ViewType, title: 'Attendance', icon: Calendar, gradient: 'from-emerald-500 to-emerald-600' },
            { view: 'advances' as ViewType, title: 'Advances', icon: Wallet, gradient: 'from-orange-500 to-orange-600' },
            { view: 'salary' as ViewType, title: 'Salary', icon: DollarSign, gradient: 'from-blue-500 to-blue-600' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <Card key={item.view} className="cursor-pointer card-hover border-0 shadow-sm" onClick={() => navigateToView(item.view)}>
                <CardContent className="p-4 flex flex-col items-center text-center gap-2.5">
                  <div className={`p-3 rounded-xl bg-gradient-to-br ${item.gradient} shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Secondary Actions */}
        <div className="space-y-2">
          {[
            { view: 'staff' as ViewType, title: 'Staff Management', icon: User, desc: 'Add, view, delete staff' },
            { view: 'staff-details' as ViewType, title: 'Staff Profiles', icon: UserCog, desc: 'View & edit with photos' },
            { view: 'reports' as ViewType, title: 'Monthly Reports', icon: FileText, desc: 'Export & share reports' },
          ].map(item => {
            const Icon = item.icon;
            return (
              <Card key={item.view} className="cursor-pointer card-hover border-0 shadow-sm" onClick={() => navigateToView(item.view)}>
                <CardContent className="p-3.5">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-muted">
                      <Icon className="h-5 w-5 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
          <Card className="cursor-pointer card-hover border-0 shadow-sm bg-accent/30" onClick={downloadMLTBackupZip}>
            <CardContent className="p-3.5">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-accent">
                  <FolderArchive className="h-5 w-5 text-accent-foreground" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Monthly Backup</p>
                  <p className="text-xs text-muted-foreground">Download ZIP folder</p>
                </div>
                <Download className="h-4 w-4 text-muted-foreground" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // === Enhanced Staff Management ===
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
          <Card key={staff.id} className="cursor-pointer border-0 shadow-sm">
            <CardContent className="p-3 flex items-center gap-3">
              <Checkbox checked={selectedStaffIds.includes(staff.id)}
                onCheckedChange={(checked) => { if (checked) setSelectedStaffIds([...selectedStaffIds, staff.id]); else setSelectedStaffIds(selectedStaffIds.filter(id => id !== staff.id)); }} />
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                {staff.photo_url ? <img src={staff.photo_url} alt={staff.name} className="w-full h-full object-cover" /> : <User className="h-5 w-5 text-muted-foreground" />}
              </div>
              <div className="flex-1" onClick={() => { setSelectedStaff(staff); setEditForm({ name: staff.name, phone: staff.phone || '', address: staff.address || '', category: staff.category, base_salary: staff.base_salary.toString(), shift_rate_28: (staff.shift_rate_28 || 0).toString(), shift_rate_30: (staff.shift_rate_30 || 0).toString(), shift_rate_31: (staff.shift_rate_31 || 0).toString(), notes: staff.notes || '', designation: staff.designation || '' }); navigateToView('profile'); }}>
                <p className="font-medium text-foreground">{staff.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{staff.category}{staff.designation ? ` • ${staff.designation}` : ''}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // === Enhanced Attendance ===
  const renderAttendance = () => {
    const presentCount = attendance.filter(a => a.status === 'present').length;
    const absentCount = attendance.filter(a => a.status === 'absent').length;
    const totalShiftsToday = attendance.filter(a => a.status === 'present').reduce((sum, a) => sum + (a.shift_count || 1), 0);

    return (
      <div className="space-y-4">
        {/* Date Navigation */}
        <div className="flex items-center justify-between gap-2">
          <Button variant="ghost" size="icon" onClick={() => navigateDate('prev')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="text-sm font-medium">
                <Calendar className="h-4 w-4 mr-2" />
                {format(selectedDate, 'dd MMM yyyy, EEE')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <CalendarComponent mode="single" selected={selectedDate} onSelect={(d) => { if (d) setSelectedDate(d); setCalendarOpen(false); }} />
            </PopoverContent>
          </Popover>
          <Button variant="ghost" size="icon" onClick={() => navigateDate('next')}>
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Button>
        </div>

        {/* Summary Strip */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="border-0 shadow-sm bg-emerald-500/10">
            <CardContent className="p-2.5 text-center">
              <p className="text-xl font-bold text-emerald-600">{totalShiftsToday}</p>
              <p className="text-[10px] text-muted-foreground font-medium">SHIFTS</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-blue-500/10">
            <CardContent className="p-2.5 text-center">
              <p className="text-xl font-bold text-blue-600">{presentCount}</p>
              <p className="text-[10px] text-muted-foreground font-medium">PRESENT</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-destructive/10">
            <CardContent className="p-2.5 text-center">
              <p className="text-xl font-bold text-destructive">{absentCount}</p>
              <p className="text-[10px] text-muted-foreground font-medium">ABSENT</p>
            </CardContent>
          </Card>
        </div>

        {/* Category Filter + Export */}
        <div className="flex gap-2">
          <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}>
            <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="driver">Driver</SelectItem>
              <SelectItem value="khalasi">Khalasi</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={exportDailyAttendancePDF}><Download className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={shareDailyAttendanceWhatsApp}><Share2 className="h-4 w-4" /></Button>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-md bg-emerald-500" /> 1 Shift</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-md bg-primary" /> 2 Shifts</span>
          <span className="flex items-center gap-1.5"><span className="w-3.5 h-3.5 rounded-md bg-destructive" /> Absent</span>
        </div>
        <p className="text-xs text-muted-foreground">💡 Tap to cycle: 1 Shift → 2 Shifts → Absent → Clear</p>

        {/* Staff Attendance List */}
        <div className="space-y-1.5 max-h-[55vh] overflow-y-auto smooth-scroll">
          {filteredStaff.map(staff => {
            const status = getStaffAttendance(staff.id);
            return (
              <Card key={staff.id} className={`cursor-pointer active:scale-[0.98] transition-all border-0 shadow-sm ${status === '1shift' ? 'border-l-4 border-l-emerald-500' : status === '2shift' ? 'border-l-4 border-l-primary' : status === 'absent' ? 'border-l-4 border-l-destructive' : 'border-l-4 border-l-transparent'}`} onClick={() => handleQuickTap(staff.id)}>
                <CardContent className="p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {staff.photo_url ? <img src={staff.photo_url} alt="" className="w-full h-full object-cover" /> : <User className="h-4 w-4 text-muted-foreground" />}
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-sm truncate text-foreground">{staff.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{staff.category}</p>
                    </div>
                  </div>
                  {status ? (
                    <span className={`px-3 py-1.5 rounded-lg text-xs font-semibold text-white ${statusConfig[status].color}`}>
                      {statusConfig[status].fullLabel}
                    </span>
                  ) : (
                    <span className="px-3 py-1.5 rounded-lg text-xs border bg-muted text-muted-foreground">Not Marked</span>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  // === Enhanced Advances ===
  const renderAdvances = () => {
    const totalAdv = advances.reduce((sum, a) => sum + Number(a.amount), 0);
    const driverAdv = advances.filter(a => { const s = staffList.find(st => st.id === a.staff_id); return s?.category === 'driver'; }).reduce((sum, a) => sum + Number(a.amount), 0);
    const khalAdv = totalAdv - driverAdv;

    return (
      <div className="space-y-4">
        <Button onClick={() => setShowAddAdvance(true)} className="w-full">
          <Plus className="h-4 w-4 mr-2" />Add Advance
        </Button>

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="border-0 shadow-sm bg-destructive/10">
            <CardContent className="p-2.5 text-center">
              <p className="text-sm font-bold text-destructive"><AnimatedNumber value={totalAdv} prefix="₹" /></p>
              <p className="text-[10px] text-muted-foreground font-medium">TOTAL</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2.5 text-center">
              <p className="text-sm font-bold text-foreground">₹{driverAdv.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-muted-foreground font-medium">DRIVERS</p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-2.5 text-center">
              <p className="text-sm font-bold text-foreground">₹{khalAdv.toLocaleString('en-IN')}</p>
              <p className="text-[10px] text-muted-foreground font-medium">KHALASI</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Select value={reportMonth.toString()} onValueChange={(v) => setReportMonth(parseInt(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{months.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={reportYear.toString()} onValueChange={(v) => setReportYear(parseInt(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={exportAdvancesPDF}><Download className="h-3 w-3 mr-1" />PDF</Button>
          <Button variant="outline" size="sm" onClick={exportAdvancesExcel}><Download className="h-3 w-3 mr-1" />Excel</Button>
          <Button variant="outline" size="sm" onClick={shareAdvancesWhatsApp}><Share2 className="h-3 w-3 mr-1" />Share</Button>
        </div>

        {selectedAdvances.length > 0 && (
          <Button variant="destructive" size="sm" onClick={() => { setDeleteType('advances'); setShowDeleteConfirm(true); }}>
            <Trash2 className="h-4 w-4 mr-2" />Delete Selected ({selectedAdvances.length})
          </Button>
        )}

        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto smooth-scroll">
          {advances.map(adv => {
            const staff = staffList.find(s => s.id === adv.staff_id);
            return (
              <Card key={adv.id} className="border-0 shadow-sm border-l-4 border-l-destructive/50">
                <CardContent className="p-3 flex items-center gap-3">
                  <Checkbox checked={selectedAdvances.includes(adv.id)}
                    onCheckedChange={(checked) => { if (checked) setSelectedAdvances([...selectedAdvances, adv.id]); else setSelectedAdvances(selectedAdvances.filter(id => id !== adv.id)); }} />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate text-foreground">{staff?.name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(adv.date), 'dd MMM yyyy')} • <span className="capitalize">{staff?.category}</span></p>
                    {adv.notes && <p className="text-xs text-muted-foreground italic mt-0.5">{adv.notes}</p>}
                  </div>
                  <p className="font-bold text-destructive text-sm">-{formatFullCurrency(Number(adv.amount))}</p>
                </CardContent>
              </Card>
            );
          })}
          {advances.length === 0 && <p className="text-center text-muted-foreground py-8">No advances this month</p>}
        </div>
      </div>
    );
  };

  // === Enhanced Salary ===
  const renderSalary = () => {
    const totalPayable = staffList.reduce((sum, s) => sum + getStaffSalaryCalc(s).payable, 0);
    const totalAdv = staffList.reduce((sum, s) => sum + getStaffSalaryCalc(s).totalAdvance, 0);
    const totalGross = staffList.reduce((sum, s) => sum + getStaffSalaryCalc(s).shiftAmount, 0);

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          <Select value={reportMonth.toString()} onValueChange={(v) => setReportMonth(parseInt(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{months.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}</SelectContent>
          </Select>
          <Select value={reportYear.toString()} onValueChange={(v) => setReportYear(parseInt(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>{[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-3 gap-2">
          <Card className="border-0 shadow-sm bg-emerald-500/10">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground font-medium">Gross</p>
              <p className="text-sm font-bold text-emerald-600"><AnimatedNumber value={totalGross} prefix="₹" /></p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-destructive/10">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground font-medium">Advances</p>
              <p className="text-sm font-bold text-destructive"><AnimatedNumber value={totalAdv} prefix="₹" /></p>
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm bg-primary/10">
            <CardContent className="p-3 text-center">
              <p className="text-xs text-muted-foreground font-medium">Net Pay</p>
              <p className="text-sm font-bold text-primary"><AnimatedNumber value={totalPayable} prefix="₹" /></p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button variant="outline" size="sm" onClick={exportSalaryPDF}><Download className="h-3 w-3 mr-1" />PDF</Button>
          <Button variant="outline" size="sm" onClick={exportSalaryExcel}><Download className="h-3 w-3 mr-1" />Excel</Button>
          <Button variant="outline" size="sm" onClick={shareSalaryWhatsApp}><Share2 className="h-3 w-3 mr-1" />Share</Button>
        </div>

        <div className="space-y-2 max-h-[55vh] overflow-y-auto smooth-scroll">
          {staffList.map(staff => {
            const calc = getStaffSalaryCalc(staff);
            const staffAdvancesList = advances.filter(a => a.staff_id === staff.id);
            return (
              <Card key={staff.id} className={`border-0 shadow-sm ${calc.payable < 0 ? 'border-l-4 border-l-destructive' : 'border-l-4 border-l-emerald-500/50'}`}>
                <CardContent className="p-3.5">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-foreground">{staff.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{staff.category} • {formatFullCurrency(calc.shiftRate)}/shift</p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold text-lg ${calc.payable < 0 ? 'text-destructive' : 'text-foreground'}`}>{formatFullCurrency(calc.payable)}</p>
                    </div>
                  </div>

                  <div className="bg-muted/40 rounded-lg p-2.5 text-xs space-y-1 font-mono mb-2">
                    <div className="flex justify-between"><span>{calc.totalShifts} shifts × ₹{calc.shiftRate.toLocaleString()}</span><span>= ₹{calc.shiftAmount.toLocaleString()}</span></div>
                    {calc.totalAdvance > 0 && <div className="flex justify-between text-destructive"><span>− Advances</span><span>− ₹{calc.totalAdvance.toLocaleString()}</span></div>}
                    <div className="flex justify-between font-bold border-t border-border pt-1"><span>Payable</span><span>= ₹{calc.payable.toLocaleString()}</span></div>
                  </div>

                  {staffAdvancesList.length > 0 && (
                    <div className="text-xs space-y-0.5 mb-2">
                      <p className="text-muted-foreground font-medium">Advances:</p>
                      {staffAdvancesList.map(a => (
                        <div key={a.id} className="flex justify-between pl-2">
                          <span className="text-muted-foreground">{format(new Date(a.date), 'dd MMM')}{a.notes ? ` · ${a.notes}` : ''}</span>
                          <span className="text-destructive">-₹{Number(a.amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-1">
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => exportSingleStaffSalaryPDF(staff)}><Download className="h-3 w-3 mr-1" />PDF</Button>
                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => shareSingleStaffSalaryWhatsApp(staff)}><Share2 className="h-3 w-3 mr-1" />WhatsApp</Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  };

  // === Staff Details ===
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
          <Card key={staff.id} className="cursor-pointer card-hover border-0 shadow-sm" onClick={() => {
            setSelectedStaff(staff);
            setEditForm({ name: staff.name, phone: staff.phone || '', address: staff.address || '', category: staff.category, base_salary: staff.base_salary.toString(), shift_rate_28: (staff.shift_rate_28 || 0).toString(), shift_rate_30: (staff.shift_rate_30 || 0).toString(), shift_rate_31: (staff.shift_rate_31 || 0).toString(), notes: staff.notes || '', designation: staff.designation || '' });
            navigateToView('profile');
          }}>
            <CardContent className="p-3 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden ring-2 ring-border">
                {staff.photo_url ? <img src={staff.photo_url} alt={staff.name} className="w-full h-full object-cover" /> : <User className="h-6 w-6 text-muted-foreground" />}
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground">{staff.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{staff.category}{staff.designation ? ` • ${staff.designation}` : ''}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  // === Reports ===
  const renderReports = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        <Select value={reportMonth.toString()} onValueChange={(v) => setReportMonth(parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{months.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={reportYear.toString()} onValueChange={(v) => setReportYear(parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Monthly Attendance Report</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <p className="text-xs text-muted-foreground">All staff attendance for {months[reportMonth - 1]} {reportYear}</p>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="secondary" size="sm" onClick={exportAttendancePDF}><Download className="h-3 w-3 mr-1" />PDF</Button>
            <Button variant="secondary" size="sm" onClick={exportAttendanceExcel}><Download className="h-3 w-3 mr-1" />Excel</Button>
            <Button variant="secondary" size="sm" onClick={shareAttendanceWhatsApp}><Share2 className="h-3 w-3 mr-1" />Share</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-2"><CardTitle className="text-sm">Advances Report</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-2">
            <Button variant="secondary" size="sm" onClick={exportAdvancesPDF}><Download className="h-3 w-3 mr-1" />PDF</Button>
            <Button variant="secondary" size="sm" onClick={exportAdvancesExcel}><Download className="h-3 w-3 mr-1" />Excel</Button>
            <Button variant="secondary" size="sm" onClick={shareAdvancesWhatsApp}><Share2 className="h-3 w-3 mr-1" />Share</Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-accent/30">
        <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><FolderArchive className="h-4 w-4" />Complete Backup</CardTitle></CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">Download all MLT staff reports as ZIP</p>
          <Button className="w-full" onClick={downloadMLTBackupZip}><Download className="h-4 w-4 mr-2" />Download Backup ZIP</Button>
        </CardContent>
      </Card>
    </div>
  );

  // === Enhanced Profile ===
  const renderProfile = () => {
    if (!selectedStaff) return null;
    const staffAttendanceList = getMonthlyAttendanceForStaff(selectedStaff.id);
    const totalShifts = staffAttendanceList.reduce((sum, a) => sum + (a.shift_count || 1), 0);
    const staffAdvancesList = advances.filter(a => a.staff_id === selectedStaff.id);
    const totalAdvance = staffAdvancesList.reduce((sum, a) => sum + Number(a.amount), 0);

    return (
      <div className="space-y-4">
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="h-16 bg-gradient-to-r from-primary to-primary/70" />
          <CardContent className="p-4 text-center -mt-10">
            <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center overflow-hidden ring-4 ring-background relative">
              {selectedStaff.photo_url ? <img src={selectedStaff.photo_url} alt={selectedStaff.name} className="w-full h-full object-cover" /> : <User className="h-10 w-10 text-muted-foreground" />}
              <label className="absolute bottom-0 right-0 bg-primary text-primary-foreground p-1.5 rounded-full cursor-pointer">
                <Camera className="h-3.5 w-3.5" />
                <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handlePhotoUpload(e.target.files[0])} disabled={isUploading} />
              </label>
            </div>
            {isEditing ? (
              <Input value={editForm.name} onChange={(e) => setEditForm({...editForm, name: e.target.value})} className="text-center text-xl font-bold" />
            ) : (
              <h2 className="text-xl font-bold text-foreground">{selectedStaff.name}</h2>
            )}
            <p className="text-muted-foreground capitalize text-sm">{selectedStaff.category}{selectedStaff.designation ? ` • ${selectedStaff.designation}` : ''}</p>
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
          <Card className="border-0 shadow-sm">
            <CardContent className="p-4 space-y-3">
              <div><Label>Phone</Label><Input value={editForm.phone} onChange={(e) => setEditForm({...editForm, phone: e.target.value})} /></div>
              <div><Label>Address</Label><Textarea value={editForm.address} onChange={(e) => setEditForm({...editForm, address: e.target.value})} /></div>
              <div><Label>Category</Label>
                <Select value={editForm.category} onValueChange={(v) => setEditForm({...editForm, category: v as 'driver' | 'khalasi'})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="driver">Driver</SelectItem><SelectItem value="khalasi">Khalasi</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label>Designation</Label><Input value={editForm.designation} onChange={(e) => setEditForm({...editForm, designation: e.target.value})} /></div>
              <div><Label>Base Salary</Label><Input type="number" value={editForm.base_salary} onChange={(e) => setEditForm({...editForm, base_salary: e.target.value})} /></div>
              <div><Label>Rate - 28 days (₹)</Label><Input type="number" value={editForm.shift_rate_28} onChange={(e) => setEditForm({...editForm, shift_rate_28: e.target.value})} /></div>
              <div><Label>Rate - 30 days (₹)</Label><Input type="number" value={editForm.shift_rate_30} onChange={(e) => setEditForm({...editForm, shift_rate_30: e.target.value})} /></div>
              <div><Label>Rate - 31 days (₹)</Label><Input type="number" value={editForm.shift_rate_31} onChange={(e) => setEditForm({...editForm, shift_rate_31: e.target.value})} /></div>
              <div><Label>Notes</Label><Textarea value={editForm.notes} onChange={(e) => setEditForm({...editForm, notes: e.target.value})} /></div>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Card className="border-0 shadow-sm bg-primary/10">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-primary">{totalShifts}</p>
                  <p className="text-xs text-muted-foreground">Shifts This Month</p>
                </CardContent>
              </Card>
              <Card className="border-0 shadow-sm bg-destructive/10">
                <CardContent className="p-3 text-center">
                  <p className="text-2xl font-bold text-destructive">₹{totalAdvance.toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">Total Advance</p>
                </CardContent>
              </Card>
            </div>
            <Card className="border-0 shadow-sm">
              <CardContent className="p-4 space-y-2.5">
                {selectedStaff.phone && <p className="text-sm"><span className="text-muted-foreground">Phone:</span> {selectedStaff.phone}</p>}
                {selectedStaff.address && <p className="text-sm"><span className="text-muted-foreground">Address:</span> {selectedStaff.address}</p>}
                <p className="text-sm"><span className="text-muted-foreground">Base Salary:</span> ₹{selectedStaff.base_salary.toLocaleString()}</p>
                <div className="text-sm">
                  <span className="text-muted-foreground">Shift Rates:</span>
                  <div className="pl-4 text-xs space-y-0.5 mt-1">
                    <p>28-day: <span className="font-medium">₹{(selectedStaff.shift_rate_28 || 0).toLocaleString()}/shift</span></p>
                    <p>30-day: <span className="font-medium">₹{(selectedStaff.shift_rate_30 || 0).toLocaleString()}/shift</span></p>
                    <p>31-day: <span className="font-medium">₹{(selectedStaff.shift_rate_31 || 0).toLocaleString()}/shift</span></p>
                  </div>
                </div>
                {selectedStaff.notes && <p className="text-sm"><span className="text-muted-foreground">Notes:</span> {selectedStaff.notes}</p>}
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto pb-20">
      <div className="flex items-center gap-3 mb-5">
        <Button variant="ghost" size="icon" onClick={() => {
          if (view === 'home') onBack();
          else window.history.back();
        }}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">
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

      {isLoading ? <LoadingSkeleton /> : (
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
                <SelectContent><SelectItem value="driver">Driver</SelectItem><SelectItem value="khalasi">Khalasi</SelectItem></SelectContent>
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
                <SelectContent>{staffList.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Amount (₹) *</Label><Input type="number" value={advanceAmount} onChange={(e) => setAdvanceAmount(e.target.value)} /></div>
            <div><Label>Date</Label>
              <Popover open={advanceCalendarOpen} onOpenChange={setAdvanceCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="h-4 w-4 mr-2" />{format(advanceDate, 'dd MMM yyyy')}
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
