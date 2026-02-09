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
import { formatFullCurrency, formatCurrencyForPDF } from '@/lib/formatUtils';

interface TyreSale {
  id: string;
  amount: number;
  date: string;
  notes: string | null;
}

interface TyreSalesSectionProps {
  onBack: () => void;
}

const TyreSalesSection = ({ onBack }: TyreSalesSectionProps) => {
  const [sales, setSales] = useState<TyreSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddSale, setShowAddSale] = useState(false);
  const [selectedSales, setSelectedSales] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  const [newAmount, setNewAmount] = useState('');
  const [newDate, setNewDate] = useState(new Date());
  const [newNotes, setNewNotes] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => { fetchSales(); }, [selectedMonth, selectedYear]);

  const fetchSales = async () => {
    setIsLoading(true);
    const startDate = format(startOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
    const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth - 1));
    const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const { data } = await supabase
      .from('tyre_sales')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (data) setSales(data as TyreSale[]);
    setIsLoading(false);
  };

  const addSale = async () => {
    if (!newAmount) { toast.error('Amount is required'); return; }
    const { error } = await supabase.from('tyre_sales').insert({
      amount: parseFloat(newAmount),
      date: format(newDate, 'yyyy-MM-dd'),
      notes: newNotes || null,
    });
    if (error) { toast.error('Failed to add sale'); return; }
    toast.success('Sale added');
    setShowAddSale(false);
    setNewAmount(''); setNewNotes(''); setNewDate(new Date());
    fetchSales();
  };

  const deleteSelectedSales = async () => {
    if (selectedSales.length === 0) return;
    const { error } = await supabase.from('tyre_sales').delete().in('id', selectedSales);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success(`${selectedSales.length} sales deleted`);
    setSelectedSales([]); setShowDeleteConfirm(false); fetchSales();
  };

  const totalAmount = sales.reduce((sum, s) => sum + Number(s.amount), 0);

  const getAmountForDate = (day: number) => {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return sales.filter(s => s.date === dateStr).reduce((sum, s) => sum + Number(s.amount), 0);
  };

  const monthDays = Array.from({ length: getDaysInMonth(new Date(selectedYear, selectedMonth - 1)) }, (_, i) => i + 1);
  const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1).getDay();
  const emptyDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Tyre Sales - ${months[selectedMonth - 1]} ${selectedYear}`, 14, 15);
    doc.setFontSize(10);
    doc.text(REPORT_FOOTER, 14, 22);
    doc.text(`Total: ${formatCurrencyForPDF(totalAmount)}`, 14, 30);

    autoTable(doc, {
      head: [['Date', 'Amount', 'Notes']],
      body: sales.map(s => [format(new Date(s.date), 'dd/MM/yyyy'), formatCurrencyForPDF(Number(s.amount)), s.notes || '-']),
      startY: 36,
    });
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    addReportNotes(doc, finalY);
    doc.save(`tyre-sales-${selectedMonth}-${selectedYear}.pdf`);
    toast.success('PDF downloaded');
  };

  const shareToWhatsApp = () => {
    let msg = `🛞 *Tyre Sales - ${months[selectedMonth - 1]} ${selectedYear}*\n\n`;
    msg += `📊 Total: ${formatFullCurrency(totalAmount)}\n\n`;
    sales.forEach(s => { msg += `${format(new Date(s.date), 'dd MMM')}: ${formatFullCurrency(Number(s.amount))}${s.notes ? ` (${s.notes})` : ''}\n`; });
    msg += `\n_${REPORT_FOOTER}_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-bold text-foreground">Tyre Sales</h1>
      </div>

      {/* Month/Year */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{months.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{[2024, 2025, 2026].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Monthly Total */}
      <Card className="mb-4" style={{ background: '#1e3a8a' }}>
        <CardContent className="p-4 text-center">
          <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Monthly Total</p>
          <p className="text-2xl font-extrabold" style={{ color: 'white' }}>{formatFullCurrency(totalAmount)}</p>
        </CardContent>
      </Card>

      {/* View Toggle + Actions */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>List View</Button>
        <Button variant={viewMode === 'calendar' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('calendar')}>Calendar</Button>
      </div>
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button onClick={() => setShowAddSale(true)}><Plus className="h-4 w-4 mr-2" />Add Sale</Button>
        <Button variant="secondary" onClick={shareToWhatsApp}><Share2 className="h-4 w-4 mr-2" />Share</Button>
      </div>
      <Button variant="outline" size="sm" className="w-full mb-4" onClick={exportToPDF}><Download className="h-4 w-4 mr-2" />Download PDF</Button>

      {selectedSales.length > 0 && (
        <Button variant="destructive" size="sm" className="w-full mb-4" onClick={() => setShowDeleteConfirm(true)}>
          <Trash2 className="h-4 w-4 mr-2" />Delete Selected ({selectedSales.length})
        </Button>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : viewMode === 'list' ? (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {sales.map(sale => (
            <Card key={sale.id}>
              <CardContent className="p-3 flex items-center gap-3">
                <Checkbox checked={selectedSales.includes(sale.id)} onCheckedChange={(c) => c ? setSelectedSales([...selectedSales, sale.id]) : setSelectedSales(selectedSales.filter(id => id !== sale.id))} />
                <div className="flex-1">
                  <p className="font-medium text-foreground">{formatFullCurrency(Number(sale.amount))}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(sale.date), 'dd MMM yyyy')}</p>
                </div>
                {sale.notes && <p className="text-xs text-muted-foreground max-w-[100px] truncate">{sale.notes}</p>}
              </CardContent>
            </Card>
          ))}
          {sales.length === 0 && <p className="text-center text-muted-foreground py-8">No tyre sales recorded</p>}
        </div>
      ) : (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">{months[selectedMonth - 1]} {selectedYear}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => <div key={i} className="p-1 font-medium text-muted-foreground">{d}</div>)}
              {Array.from({ length: emptyDays }).map((_, i) => <div key={`e-${i}`} className="p-1" />)}
              {monthDays.map(day => {
                const amount = getAmountForDate(day);
                return (
                  <div key={day} className={`p-1 rounded text-center ${amount > 0 ? 'bg-primary/20' : 'bg-muted/30'}`}>
                    <div className="text-xs font-medium text-foreground">{day}</div>
                    {amount > 0 && <div className="text-[8px] font-bold text-foreground">{formatFullCurrency(amount)}</div>}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add Sale Dialog */}
      <Dialog open={showAddSale} onOpenChange={setShowAddSale}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Tyre Sale</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Amount (₹) *</Label><Input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="Enter amount" /></div>
            <div>
              <Label>Date</Label>
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start"><CalendarIcon className="h-4 w-4 mr-2" />{format(newDate, 'dd MMM yyyy')}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={newDate} onSelect={(d) => { if (d) setNewDate(d); setCalendarOpen(false); }} initialFocus /></PopoverContent>
              </Popover>
            </div>
            <div><Label>Notes</Label><Textarea value={newNotes} onChange={(e) => setNewNotes(e.target.value)} placeholder="Optional (e.g. tyre name/type)" /></div>
          </div>
          <DialogFooter><Button onClick={addSale}>Add Sale</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Confirm Delete</AlertDialogTitle><AlertDialogDescription>Delete {selectedSales.length} sales?</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={deleteSelectedSales}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default TyreSalesSection;
