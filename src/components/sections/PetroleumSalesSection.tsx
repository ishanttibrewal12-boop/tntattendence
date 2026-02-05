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

interface PetroleumSale {
  id: string;
  amount: number;
  date: string;
  sale_type: string;
  notes: string | null;
}

interface PetroleumSalesSectionProps {
  onBack: () => void;
}

const PetroleumSalesSection = ({ onBack }: PetroleumSalesSectionProps) => {
  const [sales, setSales] = useState<PetroleumSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddSale, setShowAddSale] = useState(false);
  const [selectedSales, setSelectedSales] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'calendar-upi' | 'calendar-cash' | 'calendar-all'>('list');
  const [saleTypeFilter, setSaleTypeFilter] = useState<'all' | 'upi' | 'cash'>('all');
  
  const [newAmount, setNewAmount] = useState('');
  const [newSaleType, setNewSaleType] = useState<'upi' | 'cash'>('upi');
  const [newDate, setNewDate] = useState(new Date());
  const [newNotes, setNewNotes] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => {
    fetchSales();
  }, [selectedMonth, selectedYear]);

  const fetchSales = async () => {
    setIsLoading(true);
    const startDate = format(startOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
    const daysInMonth = getDaysInMonth(new Date(selectedYear, selectedMonth - 1));
    const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;

    const { data } = await supabase
      .from('petroleum_sales')
      .select('*')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });

    if (data) setSales(data as PetroleumSale[]);
    setIsLoading(false);
  };

  const addSale = async () => {
    if (!newAmount) {
      toast.error('Amount is required');
      return;
    }

    const { error } = await supabase.from('petroleum_sales').insert({
      amount: parseFloat(newAmount),
      date: format(newDate, 'yyyy-MM-dd'),
      sale_type: newSaleType,
      notes: newNotes || null,
    });

    if (error) {
      toast.error('Failed to add sale');
      return;
    }

    toast.success('Sale added');
    setShowAddSale(false);
    setNewAmount('');
    setNewNotes('');
    setNewDate(new Date());
    fetchSales();
  };

  const deleteSelectedSales = async () => {
    if (selectedSales.length === 0) return;

    const { error } = await supabase.from('petroleum_sales').delete().in('id', selectedSales);
    
    if (error) {
      toast.error('Failed to delete sales');
      return;
    }

    toast.success(`${selectedSales.length} sales deleted`);
    setSelectedSales([]);
    setShowDeleteConfirm(false);
    fetchSales();
  };

  const filteredSales = saleTypeFilter === 'all' ? sales : sales.filter(s => s.sale_type === saleTypeFilter);
  const totalUPI = sales.filter(s => s.sale_type === 'upi').reduce((sum, s) => sum + Number(s.amount), 0);
  const totalCash = sales.filter(s => s.sale_type === 'cash').reduce((sum, s) => sum + Number(s.amount), 0);
  const totalAmount = totalUPI + totalCash;

  const getAmountForDate = (day: number, type?: 'upi' | 'cash') => {
    const dateStr = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const daySales = sales.filter(s => s.date === dateStr && (!type || s.sale_type === type));
    return daySales.reduce((sum, s) => sum + Number(s.amount), 0);
  };

  const monthDays = Array.from({ length: getDaysInMonth(new Date(selectedYear, selectedMonth - 1)) }, (_, i) => i + 1);
  const firstDayOfMonth = new Date(selectedYear, selectedMonth - 1, 1).getDay();
  const emptyDays = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const renderCalendarView = (type?: 'upi' | 'cash') => {
    const title = type === 'upi' ? 'UPI Sales' : type === 'cash' ? 'Cash Sales' : 'All Sales';
    const totalForType = type === 'upi' ? totalUPI : type === 'cash' ? totalCash : totalAmount;
    
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex justify-between items-center">
            <span>{title} - {months[selectedMonth - 1]} {selectedYear}</span>
            <span className="text-primary font-bold">{formatFullCurrency(totalForType)}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
              <div key={i} className="p-1 font-medium text-muted-foreground">{d}</div>
            ))}
            {Array.from({ length: emptyDays }).map((_, i) => (
              <div key={`empty-${i}`} className="p-1"></div>
            ))}
            {monthDays.map(day => {
              const amount = getAmountForDate(day, type);
              const isToday = format(new Date(), 'yyyy-MM-dd') === `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              return (
                <div 
                  key={day} 
                  className={`p-1 rounded text-center ${isToday ? 'ring-2 ring-primary' : ''} ${amount > 0 ? type === 'upi' ? 'bg-primary/20' : type === 'cash' ? 'bg-secondary/20' : 'bg-accent/30' : 'bg-muted/30'}`}
                >
                  <div className="text-xs font-medium">{day}</div>
                  {amount > 0 && <div className="text-[8px] font-bold text-foreground">{formatFullCurrency(amount)}</div>}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(16);
    doc.text(`Petroleum Sales - ${months[selectedMonth - 1]} ${selectedYear}`, 14, 15);
    doc.setFontSize(10);
    doc.text(REPORT_FOOTER, 14, 22);
    doc.text(`Total: ${formatCurrencyForPDF(totalAmount)} (UPI: ${formatCurrencyForPDF(totalUPI)}, Cash: ${formatCurrencyForPDF(totalCash)})`, 14, 30);

    const tableData = filteredSales.map(s => [
      format(new Date(s.date), 'dd/MM/yyyy'),
      s.sale_type.toUpperCase(),
      formatCurrencyForPDF(Number(s.amount)),
      s.notes || '-',
    ]);

    autoTable(doc, {
      head: [['Date', 'Type', 'Amount', 'Notes']],
      body: tableData,
      startY: 36,
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    addReportNotes(doc, finalY);
    doc.save(`petroleum-sales-${selectedMonth}-${selectedYear}.pdf`);
    toast.success('PDF downloaded');
  };

  const exportToExcelFile = () => {
    const tableData = filteredSales.map(s => [
      format(new Date(s.date), 'dd/MM/yyyy'),
      s.sale_type.toUpperCase(),
      Number(s.amount),
      s.notes || '-',
    ]);

    exportToExcel(tableData, ['Date', 'Type', 'Amount', 'Notes'], `petroleum-sales-${selectedMonth}-${selectedYear}`, 'Sales', `Petroleum Sales - ${months[selectedMonth - 1]} ${selectedYear}`);
    toast.success('Excel downloaded');
  };

  const shareToWhatsApp = () => {
    let message = `⛽ *Petroleum Sales - ${months[selectedMonth - 1]} ${selectedYear}*\n\n`;
    message += `*Summary*\n`;
    message += `💳 UPI: ${formatFullCurrency(totalUPI)}\n`;
    message += `💵 Cash: ${formatFullCurrency(totalCash)}\n`;
    message += `📊 Total: ${formatFullCurrency(totalAmount)}\n\n`;
    message += `_${REPORT_FOOTER}_`;

    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank');
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold">Petroleum Sales</h1>
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
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button variant={viewMode === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('list')}>List</Button>
        <Button variant={viewMode === 'calendar-all' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('calendar-all')}>All Calendar</Button>
        <Button variant={viewMode === 'calendar-upi' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('calendar-upi')}>UPI Calendar</Button>
        <Button variant={viewMode === 'calendar-cash' ? 'default' : 'outline'} size="sm" onClick={() => setViewMode('calendar-cash')}>Cash Calendar</Button>
      </div>

      {/* Summary Cards - Full amounts */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Card className="bg-primary/10 border-primary/20">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">UPI</p>
            <p className="text-sm font-bold text-primary">{formatFullCurrency(totalUPI)}</p>
          </CardContent>
        </Card>
        <Card className="bg-secondary/20 border-secondary/20">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Cash</p>
            <p className="text-sm font-bold text-secondary-foreground">{formatFullCurrency(totalCash)}</p>
          </CardContent>
        </Card>
        <Card className="bg-accent/20">
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Total</p>
            <p className="text-sm font-bold text-foreground">{formatFullCurrency(totalAmount)}</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button onClick={() => setShowAddSale(true)}><Plus className="h-4 w-4 mr-2" />Add Sale</Button>
        <Button variant="secondary" onClick={shareToWhatsApp}><Share2 className="h-4 w-4 mr-2" />Share</Button>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={exportToPDF}><Download className="h-4 w-4 mr-2" />PDF</Button>
        <Button variant="outline" size="sm" onClick={exportToExcelFile}><Download className="h-4 w-4 mr-2" />Excel</Button>
      </div>

      {selectedSales.length > 0 && (
        <Button variant="destructive" size="sm" className="w-full mb-4" onClick={() => setShowDeleteConfirm(true)}>
          <Trash2 className="h-4 w-4 mr-2" />Delete Selected ({selectedSales.length})
        </Button>
      )}

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : viewMode === 'list' ? (
        <>
          {/* Type Filter for List View */}
          <div className="mb-4">
            <Select value={saleTypeFilter} onValueChange={(v) => setSaleTypeFilter(v as typeof saleTypeFilter)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Sales</SelectItem>
                <SelectItem value="upi">UPI Only</SelectItem>
                <SelectItem value="cash">Cash Only</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredSales.map(sale => (
              <Card key={sale.id}>
                <CardContent className="p-3 flex items-center gap-3">
                  <Checkbox 
                    checked={selectedSales.includes(sale.id)}
                    onCheckedChange={(checked) => {
                      if (checked) setSelectedSales([...selectedSales, sale.id]);
                      else setSelectedSales(selectedSales.filter(id => id !== sale.id));
                    }}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{formatFullCurrency(Number(sale.amount))}</p>
                      <span className={`text-xs px-2 py-0.5 rounded ${sale.sale_type === 'upi' ? 'bg-primary/20 text-primary' : 'bg-green-500/20 text-green-600'}`}>
                        {sale.sale_type.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{format(new Date(sale.date), 'dd MMM yyyy')}</p>
                  </div>
                  {sale.notes && <p className="text-xs text-muted-foreground max-w-[100px] truncate">{sale.notes}</p>}
                </CardContent>
              </Card>
            ))}
            {filteredSales.length === 0 && (
              <p className="text-center text-muted-foreground py-8">No sales recorded</p>
            )}
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {viewMode === 'calendar-upi' && renderCalendarView('upi')}
          {viewMode === 'calendar-cash' && renderCalendarView('cash')}
          {viewMode === 'calendar-all' && renderCalendarView()}
        </div>
      )}

      {/* Add Sale Dialog */}
      <Dialog open={showAddSale} onOpenChange={setShowAddSale}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Sale</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Amount (₹) *</Label>
              <Input type="number" value={newAmount} onChange={(e) => setNewAmount(e.target.value)} placeholder="Enter amount" />
            </div>
            <div>
              <Label>Type</Label>
              <Select value={newSaleType} onValueChange={(v) => setNewSaleType(v as 'upi' | 'cash')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                </SelectContent>
              </Select>
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
          <DialogFooter><Button onClick={addSale}>Add Sale</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Delete</AlertDialogTitle>
            <AlertDialogDescription>Are you sure you want to delete {selectedSales.length} sales?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSelectedSales}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PetroleumSalesSection;
