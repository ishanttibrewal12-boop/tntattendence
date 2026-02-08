import { useState, useEffect } from 'react';
import { Plus, Trash2, Download, Share2, Calendar as CalendarIcon, ChevronLeft, ChevronRight, FileSpreadsheet, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, getDaysInMonth } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { cn } from '@/lib/utils';
import { exportToExcel, addReportNotes, REPORT_FOOTER } from '@/lib/exportUtils';
import { formatCurrencyForPDF, formatFullCurrency } from '@/lib/formatUtils';

interface Staff {
  id: string;
  name: string;
  category: 'petroleum' | 'crusher' | 'office';
}

interface Advance {
  id: string;
  staff_id: string;
  amount: number;
  date: string;
  notes: string | null;
  is_deducted: boolean;
  staff?: Staff;
}

const AdvanceTab = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'petroleum' | 'crusher' | 'office'>('all');
  const [confirmAdd, setConfirmAdd] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Advance | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  // Monthly calendar view
  const [viewMonth, setViewMonth] = useState(new Date().getMonth() + 1);
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  // Bulk selection
  const [selectedAdvances, setSelectedAdvances] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchData();
  }, [viewMonth, viewYear]);

  const fetchData = async () => {
    setIsLoading(true);
    
    const startDate = format(startOfMonth(new Date(viewYear, viewMonth - 1)), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(new Date(viewYear, viewMonth - 1)), 'yyyy-MM-dd');

    const [staffRes, advancesRes] = await Promise.all([
      supabase.from('staff').select('id, name, category').eq('is_active', true).order('name'),
      supabase.from('advances').select('*').gte('date', startDate).lte('date', endDate).order('date', { ascending: false }),
    ]);

    if (staffRes.data) setStaffList(staffRes.data as Staff[]);
    if (advancesRes.data) {
      const advancesWithStaff = advancesRes.data.map((adv) => ({
        ...adv,
        staff: staffRes.data?.find((s) => s.id === adv.staff_id),
      }));
      setAdvances(advancesWithStaff as Advance[]);
    }
    setIsLoading(false);
  };

  const handleAddAdvance = async () => {
    if (!selectedStaffId || !amount) {
      toast.error('Please select staff and enter amount');
      return;
    }

    const { error } = await supabase.from('advances').insert({
      staff_id: selectedStaffId,
      amount: parseFloat(amount),
      notes: notes || null,
      date: format(selectedDate, 'yyyy-MM-dd'),
    });

    if (error) {
      toast.error('Failed to add advance');
      return;
    }

    toast.success('Advance added');
    setDialogOpen(false);
    setConfirmAdd(false);
    setSelectedStaffId('');
    setAmount('');
    setNotes('');
    setSelectedDate(new Date());
    fetchData();
  };

  const handleDeleteAdvance = async () => {
    if (!deleteConfirm) return;

    const { error } = await supabase.from('advances').delete().eq('id', deleteConfirm.id);
    if (error) {
      toast.error('Failed to delete advance');
      return;
    }
    toast.success('Advance deleted');
    setDeleteConfirm(null);
    fetchData();
  };

  const handleBulkDelete = async () => {
    if (selectedAdvances.size === 0) return;

    const { error } = await supabase
      .from('advances')
      .delete()
      .in('id', Array.from(selectedAdvances));

    if (error) {
      toast.error('Failed to delete advances');
      return;
    }

    toast.success(`${selectedAdvances.size} advances deleted`);
    setSelectedAdvances(new Set());
    setBulkDeleteConfirm(false);
    fetchData();
  };

  const toggleAdvanceSelection = (id: string) => {
    const newSelected = new Set(selectedAdvances);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAdvances(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedAdvances.size === advances.length) {
      setSelectedAdvances(new Set());
    } else {
      setSelectedAdvances(new Set(advances.map(a => a.id)));
    }
  };

  const getStaffAdvances = (staffId: string) => {
    return advances.filter((a) => a.staff_id === staffId);
  };

  const getStaffTotalAdvance = (staffId: string) => {
    return advances.filter((a) => a.staff_id === staffId).reduce((sum, a) => sum + Number(a.amount), 0);
  };

  const filteredStaff = categoryFilter === 'all' 
    ? staffList 
    : staffList.filter(s => s.category === categoryFilter);

  const staffWithAdvances = filteredStaff.filter((s) => getStaffTotalAdvance(s.id) > 0);

  const totalAdvances = advances.reduce((sum, a) => sum + Number(a.amount), 0);

  // Category-wise totals
  const petroleumTotal = advances.filter(a => {
    const staff = staffList.find(s => s.id === a.staff_id);
    return staff?.category === 'petroleum';
  }).reduce((sum, a) => sum + Number(a.amount), 0);

  const crusherTotal = advances.filter(a => {
    const staff = staffList.find(s => s.id === a.staff_id);
    return staff?.category === 'crusher';
  }).reduce((sum, a) => sum + Number(a.amount), 0);

  const officeTotal = advances.filter(a => {
    const staff = staffList.find(s => s.id === a.staff_id);
    return staff?.category === 'office';
  }).reduce((sum, a) => sum + Number(a.amount), 0);

  // Get advances for a specific day
  const getAdvancesForDay = (day: number) => {
    const dateStr = `${viewYear}-${String(viewMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return advances.filter(a => a.date === dateStr);
  };

  const monthDays = Array.from({ length: getDaysInMonth(new Date(viewYear, viewMonth - 1)) }, (_, i) => i + 1);

  // Export PDF with individual staff pages
  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Cover page with summary
    doc.setFontSize(18);
    doc.text(`Advance Report - ${months[viewMonth - 1]} ${viewYear}`, 14, 20);
    doc.setFontSize(12);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy')}`, 14, 30);
    doc.text(`Total: ${formatCurrencyForPDF(totalAdvances)}`, 14, 38);
    doc.text(REPORT_FOOTER, 14, 46);

    // Summary table on first page
    const summaryData = staffWithAdvances.map((staff) => [
      staff.name,
      staff.category,
      formatCurrencyForPDF(getStaffTotalAdvance(staff.id)),
    ]);

    autoTable(doc, {
      head: [['Staff Name', 'Category', 'Total Advance']],
      body: summaryData,
      startY: 54,
    });

    // Grand total row
    let currentY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont(undefined!, 'bold');
    doc.text(`Grand Total: ${formatCurrencyForPDF(totalAdvances)}`, 14, currentY);
    doc.setFont(undefined!, 'normal');

    // Individual pages for each staff
    staffWithAdvances.forEach((staff) => {
      doc.addPage();
      const staffAdvances = getStaffAdvances(staff.id);
      const staffTotal = getStaffTotalAdvance(staff.id);
      
      doc.setFontSize(16);
      doc.text(`${staff.name}`, 14, 20);
      doc.setFontSize(11);
      doc.text(`Category: ${staff.category}`, 14, 28);
      doc.text(`Month: ${months[viewMonth - 1]} ${viewYear}`, 14, 35);
      doc.text(`Total Advance: ${formatCurrencyForPDF(staffTotal)}`, 14, 42);
      doc.text(REPORT_FOOTER, 14, 50);

      const advanceData = staffAdvances.map((adv) => [
        format(new Date(adv.date), 'dd MMM yyyy'),
        formatCurrencyForPDF(Number(adv.amount)),
        adv.notes || '-',
      ]);

      autoTable(doc, {
        head: [['Date', 'Amount', 'Notes']],
        body: advanceData,
        startY: 58,
      });

      // Staff total at bottom
      const finalY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFontSize(11);
      doc.setFont(undefined!, 'bold');
      doc.text(`Total: ${formatCurrencyForPDF(staffTotal)}`, 14, finalY);
      doc.setFont(undefined!, 'normal');
      
      addReportNotes(doc, finalY + 15);
    });

    // Final summary page
    doc.addPage();
    doc.setFontSize(16);
    doc.text(`Summary - All Staff Advances`, 14, 20);
    doc.setFontSize(11);
    doc.text(`${months[viewMonth - 1]} ${viewYear}`, 14, 28);
    doc.text(REPORT_FOOTER, 14, 35);

    const allSummary = staffWithAdvances.map((staff) => [
      staff.name,
      staff.category,
      formatCurrencyForPDF(getStaffTotalAdvance(staff.id)),
    ]);

    autoTable(doc, {
      head: [['Staff Name', 'Category', 'Total Advance']],
      body: allSummary,
      startY: 43,
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont(undefined!, 'bold');
    doc.text(`Grand Total: ${formatCurrencyForPDF(totalAdvances)}`, 14, currentY);
    doc.setFont(undefined!, 'normal');
    
    addReportNotes(doc, currentY + 15);

    doc.save(`advances-${viewMonth}-${viewYear}.pdf`);
    toast.success('PDF downloaded with individual staff pages');
  };

  const exportToExcelFile = () => {
    const headers = ['Name', 'Category', 'Date', 'Amount', 'Notes'];
    const data = advances.map((adv) => [
      adv.staff?.name || 'Unknown',
      adv.staff?.category || '-',
      format(new Date(adv.date), 'dd MMM yyyy'),
      `₹${Number(adv.amount).toLocaleString()}`,
      adv.notes || '-',
    ]);
    
    exportToExcel(data, headers, `advances-${viewMonth}-${viewYear}`, 'Advances', `Advance Report - ${months[viewMonth - 1]} ${viewYear}`);
    toast.success('Excel downloaded');
  };

  const shareToWhatsApp = () => {
    let message = `💰 *Advance Report - ${months[viewMonth - 1]} ${viewYear}*\n`;
    message += `Total: ₹${totalAdvances.toLocaleString()}\n\n`;

    staffWithAdvances.forEach((staff) => {
      const total = getStaffTotalAdvance(staff.id);
      const staffAdvances = getStaffAdvances(staff.id);
      message += `*${staff.name}* (${staff.category}): ₹${total.toLocaleString()}\n`;
      staffAdvances.forEach(adv => {
        message += `  • ${format(new Date(adv.date), 'dd MMM')}: ₹${Number(adv.amount).toLocaleString()}\n`;
      });
      message += '\n';
    });

    message += '_Tibrewal Staff Manager_';

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div>
      {/* Month/Year Selection */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Select value={viewMonth.toString()} onValueChange={(v) => setViewMonth(parseInt(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {months.map((month, i) => (
              <SelectItem key={i} value={(i + 1).toString()}>{month}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={viewYear.toString()} onValueChange={(v) => setViewYear(parseInt(v))}>
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

      {/* Category-wise Summary Cards */}
      <div className="grid grid-cols-3 gap-2 mb-3">
        <Card className="bg-blue-800 border-blue-700">
          <CardContent className="p-2 text-center">
            <p className="text-xs text-blue-200">Petroleum</p>
            <p className="text-sm font-bold text-white">₹{petroleumTotal.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-800 border-blue-700">
          <CardContent className="p-2 text-center">
            <p className="text-xs text-blue-200">Crusher</p>
            <p className="text-sm font-bold text-white">₹{crusherTotal.toLocaleString()}</p>
          </CardContent>
        </Card>
        <Card className="bg-blue-800 border-blue-700">
          <CardContent className="p-2 text-center">
            <p className="text-xs text-blue-200">Office</p>
            <p className="text-sm font-bold text-white">₹{officeTotal.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Total Summary Card */}
      <Card className="mb-4 bg-primary text-primary-foreground">
        <CardContent className="p-4">
          <p className="text-sm opacity-90">Total Advances - {months[viewMonth - 1]}</p>
          <p className="text-2xl font-bold">₹{totalAdvances.toLocaleString()}</p>
        </CardContent>
      </Card>

      {/* View Toggle & Actions */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="text-xs">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Advance Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Staff</Label>
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff" />
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
              <div>
                <Label>Date</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !selectedDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'dd MMM yyyy') : 'Select date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={selectedDate}
                      onSelect={(date) => {
                        if (date) setSelectedDate(date);
                        setCalendarOpen(false);
                      }}
                      initialFocus
                      className="pointer-events-auto"
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label>Notes (Optional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes"
                />
              </div>
              <Button onClick={() => setConfirmAdd(true)} className="w-full">
                Add Advance
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button 
          variant={viewMode === 'list' ? 'default' : 'outline'} 
          size="sm" 
          className="text-xs"
          onClick={() => setViewMode('list')}
        >
          List
        </Button>
        <Button 
          variant={viewMode === 'calendar' ? 'default' : 'outline'} 
          size="sm" 
          className="text-xs"
          onClick={() => setViewMode('calendar')}
        >
          Calendar
        </Button>
        <Button variant="secondary" size="sm" className="text-xs" onClick={exportToPDF}>
          <Download className="h-4 w-4" />
        </Button>
        <Button variant="secondary" size="sm" className="text-xs" onClick={exportToExcelFile}>
          <FileSpreadsheet className="h-4 w-4" />
        </Button>
      </div>

      {/* Bulk Actions */}
      {selectedAdvances.size > 0 && (
        <div className="flex items-center gap-2 mb-4 p-2 bg-destructive/10 rounded-lg">
          <span className="text-sm flex-1">{selectedAdvances.size} selected</span>
          <Button variant="destructive" size="sm" onClick={() => setBulkDeleteConfirm(true)}>
            <Trash2 className="h-4 w-4 mr-1" />
            Delete Selected
          </Button>
        </div>
      )}

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

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <Card className="mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Monthly Calendar View</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={i} className="p-1 font-medium text-muted-foreground">{d}</div>
              ))}
              {/* Empty cells for alignment */}
              {Array.from({ length: new Date(viewYear, viewMonth - 1, 1).getDay() === 0 ? 6 : new Date(viewYear, viewMonth - 1, 1).getDay() - 1 }).map((_, i) => (
                <div key={`empty-${i}`} className="p-1"></div>
              ))}
              {monthDays.map(day => {
                const dayAdvances = getAdvancesForDay(day);
                const dayTotal = dayAdvances.reduce((sum, a) => sum + Number(a.amount), 0);
                return (
                  <div 
                    key={day} 
                    className={cn(
                      "p-1 rounded text-center min-h-[40px]",
                      dayTotal > 0 ? "bg-destructive/10 border border-destructive/30" : "bg-muted/30"
                    )}
                  >
                    <div className="text-xs font-medium">{day}</div>
                    {dayTotal > 0 && (
                      <div className="text-[10px] text-destructive font-bold">₹{dayTotal.toLocaleString()}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* List View */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : staffWithAdvances.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No advances in {months[viewMonth - 1]}</div>
      ) : (
        <div className="space-y-3">
          {/* Select All */}
          <div className="flex items-center gap-2 mb-2">
            <Checkbox
              checked={selectedAdvances.size === advances.length && advances.length > 0}
              onCheckedChange={toggleSelectAll}
            />
            <span className="text-sm text-muted-foreground">Select All</span>
          </div>
          
          {staffWithAdvances.map((staff) => {
            const staffAdvances = getStaffAdvances(staff.id);
            const total = getStaffTotalAdvance(staff.id);
            return (
              <Card key={staff.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-foreground">{staff.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{staff.category}</p>
                    </div>
                    <p className="font-bold text-foreground">₹{total.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    {staffAdvances.map((adv) => (
                      <div key={adv.id} className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded">
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={selectedAdvances.has(adv.id)}
                            onCheckedChange={() => toggleAdvanceSelection(adv.id)}
                          />
                          <div>
                            <span className="text-muted-foreground font-medium">{format(new Date(adv.date), 'dd MMM yyyy')}</span>
                            <span className="ml-2 font-semibold">₹{Number(adv.amount).toLocaleString()}</span>
                            {adv.notes && <span className="text-xs text-muted-foreground ml-2">({adv.notes})</span>}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setDeleteConfirm(adv)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirm Add Dialog */}
      <AlertDialog open={confirmAdd} onOpenChange={setConfirmAdd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Advance</AlertDialogTitle>
            <AlertDialogDescription>
              Add advance of ₹{amount} for {staffList.find(s => s.id === selectedStaffId)?.name} on {format(selectedDate, 'dd MMM yyyy')}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddAdvance}>Confirm</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Advance?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this advance of ₹{deleteConfirm?.amount} from {deleteConfirm?.date ? format(new Date(deleteConfirm.date), 'dd MMM yyyy') : ''}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAdvance}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedAdvances.size} Advances?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedAdvances.size} selected advances? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete}>Delete All</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdvanceTab;