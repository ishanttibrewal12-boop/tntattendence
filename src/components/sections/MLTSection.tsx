import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, User, Calendar, Wallet, FileText, Download, Share2, Search, Check } from 'lucide-react';
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
import { exportToExcel, addReportNotes, REPORT_FOOTER } from '@/lib/exportUtils';

interface MLTStaff {
  id: string;
  name: string;
  category: 'driver' | 'khalasi';
  phone: string | null;
  address: string | null;
  notes: string | null;
  base_salary: number;
  is_active: boolean;
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
}

interface MLTSectionProps {
  onBack: () => void;
}

type ViewType = 'home' | 'staff' | 'attendance' | 'advances' | 'reports' | 'profile';
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
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<MLTStaff | null>(null);
  
  // Staff form
  const [showAddStaff, setShowAddStaff] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', category: 'driver' as 'driver' | 'khalasi', phone: '', address: '', notes: '', base_salary: 0 });
  
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
  
  // Bulk delete
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteType, setDeleteType] = useState<'staff' | 'advances'>('staff');
  
  // Monthly report
  const [reportMonth, setReportMonth] = useState(new Date().getMonth() + 1);
  const [reportYear, setReportYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchData();
  }, [selectedDate, reportMonth, reportYear]);

  const fetchData = async () => {
    setIsLoading(true);
    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const startDate = format(startOfMonth(new Date(reportYear, reportMonth - 1)), 'yyyy-MM-dd');
    const daysInMonth = getDaysInMonth(new Date(reportYear, reportMonth - 1));
    const endDate = `${reportYear}-${String(reportMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const [staffRes, attendanceRes, advancesRes, monthlyAdvancesRes] = await Promise.all([
      supabase.from('mlt_staff').select('*').eq('is_active', true).order('name'),
      supabase.from('mlt_attendance').select('*').eq('date', dateStr),
      supabase.from('mlt_advances').select('*').gte('date', startDate).lte('date', endDate).order('date', { ascending: false }),
      supabase.from('mlt_advances').select('*').order('date', { ascending: false }),
    ]);

    if (staffRes.data) setStaffList(staffRes.data as MLTStaff[]);
    if (attendanceRes.data) setAttendance(attendanceRes.data as MLTAttendance[]);
    if (advancesRes.data || monthlyAdvancesRes.data) setAdvances((advancesRes.data || monthlyAdvancesRes.data) as MLTAdvance[]);
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
    });

    if (error) {
      toast.error('Failed to add staff');
      return;
    }

    toast.success('Staff added');
    setShowAddStaff(false);
    setNewStaff({ name: '', category: 'driver', phone: '', address: '', notes: '', base_salary: 0 });
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

  const filteredStaff = staffList.filter(s => {
    const matchesCategory = categoryFilter === 'all' || s.category === categoryFilter;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const navigateDate = (direction: 'prev' | 'next') => {
    setSelectedDate(direction === 'prev' ? subDays(selectedDate, 1) : addDays(selectedDate, 1));
  };

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const exportAttendancePDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    const monthDays = Array.from({ length: getDaysInMonth(new Date(reportYear, reportMonth - 1)) }, (_, i) => i + 1);
    
    doc.setFontSize(16);
    doc.text(`MLT Monthly Attendance - ${months[reportMonth - 1]} ${reportYear}`, 14, 15);
    doc.setFontSize(10);
    doc.text(REPORT_FOOTER, 14, 22);

    const headers = ['Staff', 'Category', ...monthDays.map(d => d.toString()), 'Shifts'];
    const tableData = staffList.map(staff => {
      let totalShifts = 0;
      const days = monthDays.map(day => {
        const dateStr = `${reportYear}-${String(reportMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        // This would need actual monthly attendance data
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
      return [staff?.name || 'Unknown', staff?.category || '-', format(new Date(adv.date), 'dd/MM/yyyy'), `₹${Number(adv.amount).toLocaleString()}`];
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

  const exportAdvancesExcel = () => {
    const staffAdvances = advances.map(adv => {
      const staff = staffList.find(s => s.id === adv.staff_id);
      return [staff?.name || 'Unknown', staff?.category || '-', format(new Date(adv.date), 'dd/MM/yyyy'), Number(adv.amount)];
    });

    exportToExcel(staffAdvances, ['Name', 'Category', 'Date', 'Amount'], `mlt-advances-${reportMonth}-${reportYear}`, 'Advances', `MLT Advances - ${months[reportMonth - 1]} ${reportYear}`);
    toast.success('Excel downloaded');
  };

  const renderHome = () => (
    <div className="space-y-3">
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
      <Card className="cursor-pointer hover:shadow-md" onClick={() => setView('reports')}>
        <CardContent className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-chart-1"><FileText className="h-6 w-6 text-primary-foreground" /></div>
          <div><h3 className="font-semibold">Monthly Reports</h3><p className="text-sm text-muted-foreground">Export & backup</p></div>
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
          <SelectItem value="all">All Staff</SelectItem>
          <SelectItem value="driver">Driver</SelectItem>
          <SelectItem value="khalasi">Khalasi</SelectItem>
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
              <div className="flex-1" onClick={() => { setSelectedStaff(staff); setView('profile'); }}>
                <p className="font-medium">{staff.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{staff.category}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const renderAttendance = () => (
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

      <Card>
        <CardHeader><CardTitle className="text-sm">Attendance Report</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Button variant="secondary" size="sm" className="w-full" onClick={exportAttendancePDF}>
            <Download className="h-4 w-4 mr-2" />Download PDF
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-sm">Advances Report</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          <Button variant="secondary" size="sm" className="w-full" onClick={exportAdvancesPDF}>
            <Download className="h-4 w-4 mr-2" />Download PDF
          </Button>
          <Button variant="secondary" size="sm" className="w-full" onClick={exportAdvancesExcel}>
            <Download className="h-4 w-4 mr-2" />Download Excel
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  const renderProfile = () => {
    if (!selectedStaff) return null;
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-20 h-20 rounded-full bg-muted mx-auto mb-3 flex items-center justify-center">
              <User className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold">{selectedStaff.name}</h2>
            <p className="text-muted-foreground capitalize">{selectedStaff.category}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-2">
            {selectedStaff.phone && <p className="text-sm"><span className="text-muted-foreground">Phone:</span> {selectedStaff.phone}</p>}
            {selectedStaff.address && <p className="text-sm"><span className="text-muted-foreground">Address:</span> {selectedStaff.address}</p>}
            <p className="text-sm"><span className="text-muted-foreground">Base Salary:</span> ₹{selectedStaff.base_salary.toLocaleString()}</p>
            {selectedStaff.notes && <p className="text-sm"><span className="text-muted-foreground">Notes:</span> {selectedStaff.notes}</p>}
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => view === 'home' ? onBack() : (view === 'profile' ? setView('staff') : setView('home'))}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">
          {view === 'home' && 'MLT Section'}
          {view === 'staff' && 'Staff Management'}
          {view === 'attendance' && 'Attendance'}
          {view === 'advances' && 'Advances'}
          {view === 'reports' && 'Monthly Reports'}
          {view === 'profile' && selectedStaff?.name}
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