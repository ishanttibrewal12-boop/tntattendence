import { useState, useEffect } from 'react';
import { ArrowLeft, Download, Share2, Calendar, User, Phone, Edit2, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, getDaysInMonth, startOfMonth, endOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Staff {
  id: string;
  name: string;
  category: 'petroleum' | 'crusher';
  phone: string | null;
  base_salary: number;
  notes: string | null;
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
}

const StaffProfileSection = ({ onBack }: StaffProfileSectionProps) => {
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
    const { data } = await supabase.from('staff').select('id, name, category, phone, base_salary, notes').eq('is_active', true).order('name');
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

    const [attendanceRes, advancesRes] = await Promise.all([
      supabase.from('attendance').select('date, status, shift_count').eq('staff_id', selectedStaffId).gte('date', startDate).lte('date', endDate).order('date'),
      supabase.from('advances').select('id, amount, date, notes, is_deducted').eq('staff_id', selectedStaffId).order('date', { ascending: false }),
    ]);

    if (attendanceRes.data) setAttendance(attendanceRes.data as AttendanceRecord[]);
    if (advancesRes.data) setAdvances(advancesRes.data as Advance[]);
    setIsLoading(false);
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
    const pendingAdvance = advances.filter(a => !a.is_deducted).reduce((sum, a) => sum + Number(a.amount), 0);

    return { totalShifts, oneShiftDays, twoShiftDays, absentDays, pendingAdvance };
  };

  const stats = selectedStaff ? getStats() : null;

  const generatePDFContent = () => {
    if (!selectedStaff || !stats) return null;

    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text(`Staff Profile - ${selectedStaff.name}`, 14, 20);
    
    doc.setFontSize(12);
    doc.text(`Category: ${selectedStaff.category}`, 14, 30);
    doc.text(`Phone: ${selectedStaff.phone || 'N/A'}`, 14, 38);
    doc.text(`Month: ${months[selectedMonth - 1]} ${selectedYear}`, 14, 46);
    
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
      ['Pending Advance', `₹${stats.pendingAdvance.toLocaleString()}`],
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

    return doc;
  };

  const exportToPDF = () => {
    const doc = generatePDFContent();
    if (!doc) return;

    doc.save(`staff-profile-${selectedStaff?.name}-${selectedMonth}-${selectedYear}.pdf`);
    toast.success('PDF downloaded');
    setConfirmShare(null);
  };

  const shareToWhatsApp = () => {
    if (!selectedStaff || !stats) return;

    let message = `👤 *Staff Profile*\n\n`;
    message += `*Name:* ${selectedStaff.name}\n`;
    message += `*Category:* ${selectedStaff.category}\n`;
    message += `*Phone:* ${selectedStaff.phone || 'N/A'}\n`;
    message += `*Month:* ${months[selectedMonth - 1]} ${selectedYear}\n\n`;
    
    if (selectedStaff.notes) {
      message += `📝 *Notes:* ${selectedStaff.notes}\n\n`;
    }

    message += `📊 *Attendance Summary*\n`;
    message += `• Total Shifts: ${stats.totalShifts}\n`;
    message += `• 1-Shift Days: ${stats.oneShiftDays}\n`;
    message += `• 2-Shift Days: ${stats.twoShiftDays}\n`;
    message += `• Absent Days: ${stats.absentDays}\n`;
    message += `• Pending Advance: ₹${stats.pendingAdvance.toLocaleString()}\n\n`;

    message += `📅 *Daily Record*\n`;
    attendance.forEach(a => {
      const statusText = a.status === 'present' ? `${a.shift_count || 1} Shift` : 'Absent';
      message += `${format(new Date(a.date), 'dd MMM')}: ${statusText}\n`;
    });

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

      {/* Staff Selection */}
      <div className="mb-4">
        <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
          <SelectTrigger>
            <SelectValue placeholder="Select a staff member" />
          </SelectTrigger>
          <SelectContent>
            {staffList.map((staff) => (
              <SelectItem key={staff.id} value={staff.id}>
                {staff.name} ({staff.category})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
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
                {[2024, 2025, 2026].map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Staff Info Card */}
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 rounded-full bg-primary/10">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">{selectedStaff.name}</h2>
                  <p className="text-sm text-muted-foreground capitalize">{selectedStaff.category}</p>
                </div>
              </div>
              {selectedStaff.phone && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  {selectedStaff.phone}
                </div>
              )}
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
                    <p className="text-2xl font-bold text-green-600">{stats.oneShiftDays}</p>
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

              {/* Pending Advance */}
              {stats.pendingAdvance > 0 && (
                <Card className="mb-4 bg-destructive/10">
                  <CardContent className="p-3">
                    <p className="text-sm text-muted-foreground">Pending Advance</p>
                    <p className="text-xl font-bold text-destructive">₹{stats.pendingAdvance.toLocaleString()}</p>
                  </CardContent>
                </Card>
              )}

              {/* Attendance List */}
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

              {/* Export Actions */}
              <div className="grid grid-cols-2 gap-2">
                <Button variant="secondary" onClick={() => setConfirmShare('pdf')}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                <Button variant="secondary" onClick={() => setConfirmShare('whatsapp')}>
                  <Share2 className="h-4 w-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
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
    </div>
  );
};

export default StaffProfileSection;
