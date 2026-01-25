import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Download, Share2, Calendar as CalendarIcon } from 'lucide-react';
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
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, getDaysInMonth, startOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToExcel, addReportNotes, REPORT_FOOTER } from '@/lib/exportUtils';

interface PetroleumPayment {
  id: string;
  amount: number;
  date: string;
  payment_type: string;
  notes: string | null;
}

interface PetroleumPaymentsSectionProps {
  onBack: () => void;
}

const PetroleumPaymentsSection = ({ onBack }: PetroleumPaymentsSectionProps) => {
  const [payments, setPayments] = useState<PetroleumPayment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [selectedPayments, setSelectedPayments] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  
  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState(new Date());
  const [newNotes, setNewNotes] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    fetchPayments();
  }, [selectedMonth, selectedYear]);

  const fetchPayments = async () => {
    setIsLoading(true);
    const startDate = format(startOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
    const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth - 1));
    const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('petroleum_payments')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (data) setPayments(data as PetroleumPayment[]);
    setIsLoading(false);
  };

  const addPayment = async () => {
    if (!newAmount) {
      toast.error('Amount is required');
      return;
    }

    const { error } = await supabase.from('petroleum_payments').insert({
      amount: parseFloat(newAmount),
      date: format(newDate, 'yyyy-MM-dd'),
      payment_type: 'upi',
      notes: newNotes || null,
    });

    if (error) {
      toast.error('Failed to add payment');
      return;
    }

    toast.success('Payment added');
    setShowAddPayment(false);
    setNewAmount('');
    setNewNotes('');
    setNewDate(new Date());
    fetchPayments();
  };

  const deleteSelectedPayments = async () => {
    if (selectedPayments.length === 0) return;

    const { error } = await supabase.from('petroleum_payments').delete().in('id', selectedPayments);
    
    if (error) {
      toast.error('Failed to delete payments');
      return;
    }

    toast.success(`${selectedPayments.length} payments deleted`);
    setSelectedPayments([]);
    setShowDeleteConfirm(false);
    fetchPayments();
  };

  const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

  const getAmountForDate = (day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return payments.filter(p => p.date === dateStr).reduce((sum, p) => sum + Number(p.amount), 0);
  };

  const monthDays = Array.from({ length: getDaysInMonth(new Date(selectedYear, selectedMonth - 1)) }, (_, i) => i + 1);

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(`Petroleum UPI Payments - ${months[selectedMonth - 1]} ${selectedYear}`, 14, 15);
    doc.setFontSize(10);
    doc.text(REPORT_FOOTER, 14, 22);
    doc.text(`Total: ₹${totalAmount.toLocaleString()}`, 14, 30);

    const tableData = payments.map(p => [
      format(new Date(p.date), 'dd/MM/yyyy'),
      `₹${Number(p.amount).toLocaleString()}`,
      p.notes || '-',
    ]);

    autoTable(doc, {
      head: [['Date', 'Amount', 'Notes']],
      body: tableData,
      startY: 36,
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    addReportNotes(doc, finalY);
    doc.save(`petroleum-payments-${selectedMonth}-${selectedYear}.pdf`);
    toast.success('PDF downloaded');
  };

  const exportToExcelFile = () => {
    const tableData = payments.map(p => [
      format(new Date(p.date), 'dd/MM/yyyy'),
      Number(p.amount),
      p.notes || '-',
    ]);

    exportToExcel(tableData, ['Date', 'Amount', 'Notes'], `petroleum-payments-${selectedMonth}-${selectedYear}`, 'Payments', `Petroleum UPI Payments - ${months[selectedMonth - 1]} ${selectedYear}`);
    toast.success('Excel downloaded');
  };

  const shareToWhatsApp = () => {
    const today = new Date();
    const todayStr = format(today, 'yyyy-MM-dd');
    const todayPayments = payments.filter(p => p.date === todayStr);
    const todayTotal = todayPayments.reduce((sum, p) => sum + Number(p.amount), 0);

    let message = `💳 *Petroleum UPI Payments - ${format(today, 'dd MMM yyyy')}*\n\n`;
    message += `Total Amount: ₹${todayTotal.toLocaleString()}\n\n`;
    
    if (todayPayments.length > 0) {
      todayPayments.forEach(p => {
        message += `• ₹${Number(p.amount).toLocaleString()}${p.notes ? ` (${p.notes})` : ''}\n`;
      });
    } else {
      message += `No payments recorded today.\n`;
    }
    
    message += `\n_${REPORT_FOOTER}_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Petroleum Payments (UPI)</h1>
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

      {/* View Toggle */}
      <div className="flex gap-2 mb-4">
        <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setViewMode('list')}>List</Button>
        <Button variant={viewMode === 'calendar' ? 'default' : 'outline'} size="sm" className="flex-1" onClick={() => setViewMode('calendar')}>Calendar</Button>
      </div>

      {/* Total Card */}
      <Card className="mb-4 bg-primary/10 border-primary/20">
        <CardContent className="p-4 text-center">
          <p className="text-sm text-muted-foreground">Total {months[selectedMonth - 1]} Payments</p>
          <p className="text-3xl font-bold text-primary">₹{totalAmount.toLocaleString()}</p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button onClick={() => setShowAddPayment(true)}><Plus className="h-4 w-4 mr-2" />Add Payment</Button>
        <Button variant="secondary" onClick={shareToWhatsApp}><Share2 className="h-4 w-4 mr-2" />Share Today</Button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={exportToPDF}><Download className="h-4 w-4 mr-2" />PDF</Button>
        <Button variant="outline" size="sm" onClick={exportToExcelFile}><Download className="h-4 w-4 mr-2" />Excel</Button>
      </div>

      {selectedPayments.length > 0 && (
        <Button variant="destructive" size="sm" className="w-full mb-4" onClick={() => setShowDeleteConfirm(true)}>
          <Trash2 className="h-4 w-4 mr-2" />Delete Selected ({selectedPayments.length})
        </Button>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : viewMode === 'list' ? (
        <div className="space-y-2">
          {payments.map(payment => (
            <Card key={payment.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <Checkbox 
                  checked={selectedPayments.includes(payment.id)}
                  onCheckedChange={(checked) => {
                    if (checked) setSelectedPayments([...selectedPayments, payment.id]);
                    else setSelectedPayments(selectedPayments.filter(id => id !== payment.id));
                  }}
                />
                <div className="flex-1">
                  <p className="font-medium">₹{Number(payment.amount).toLocaleString()}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(payment.date), 'dd MMM yyyy')}</p>
                </div>
                {payment.notes && <p className="text-xs text-muted-foreground max-w-[100px] truncate">{payment.notes}</p>}
              </CardContent>
            </Card>
          ))}
          {payments.length === 0 && (
            <p className="text-center text-muted-foreground py-8">No payments recorded</p>
          )}
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Calendar View - {months[selectedMonth - 1]} {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <div key={i} className="p-1 font-medium text-muted-foreground">{d}</div>
              ))}
              {Array.from({ length: new Date(selectedYear, selectedMonth - 1, 1).getDay() === 0 ? 6 : new Date(selectedYear, selectedMonth - 1, 1).getDay() - 1 }).map((_, i) => (
                <div key={`empty-${i}`} className="p-1"></div>
              ))}
              {monthDays.map(day => {
                const amount = getAmountForDate(day);
                const isToday = format(new Date(), 'yyyy-MM-dd') === `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                return (
                  <div 
                    key={day} 
                    className={`p-1 rounded text-center ${isToday ? 'ring-2 ring-primary' : ''} ${amount > 0 ? 'bg-primary/20' : 'bg-muted/30'}`}
                  >
                    <div className="text-xs font-medium">{day}</div>
                    {amount > 0 && <div className="text-[8px] text-primary font-bold">₹{amount >= 1000 ? `${(amount / 1000).toFixed(1)}k` : amount}</div>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Payment Dialog */}
      <Dialog open={showAddPayment} onOpenChange={setShowAddPayment}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add UPI Payment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount (₹) *</Label>
              <Input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="Enter amount" />
            </div>
            <div>
              <Label>Date</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(newDate, 'dd MMM yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={newDate} onSelect={(d) => { if (d) setNewDate(d); setCalendarOpen(false); }} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>
          <DialogFooter><Button onClick={addPayment}>Add Payment</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete {selectedPayments.length} payments?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSelectedPayments}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PetroleumPaymentsSection;