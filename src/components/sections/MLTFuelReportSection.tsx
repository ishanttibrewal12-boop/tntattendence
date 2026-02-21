import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Trash2, Download, Share2, FileText, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToExcel, addReportNotes, REPORT_FOOTER } from '@/lib/exportUtils';
import { formatCurrencyForPDF } from '@/lib/formatUtils';

interface MLTFuel {
  id: string;
  truck_number: string;
  fuel_litres: number;
  amount: number | null;
  date: string;
  driver_name: string | null;
  notes: string | null;
  created_at: string;
}

interface Props { onBack: () => void; }

type ViewType = 'list' | 'daily' | 'monthly';

const MLTFuelReportSection = ({ onBack }: Props) => {
  const [records, setRecords] = useState<MLTFuel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<ViewType>('list');
  const [showAdd, setShowAdd] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const [form, setForm] = useState({ truck_number: '', fuel_litres: '', amount: '', date: new Date(), driver_name: '', notes: '' });
  const [formCalendarOpen, setFormCalendarOpen] = useState(false);

  const [truckFilter, setTruckFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  const [dailyDate, setDailyDate] = useState(new Date());
  const [dailyCalOpen, setDailyCalOpen] = useState(false);
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => { fetchRecords(); }, []);

  const fetchRecords = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('mlt_fuel_reports').select('*').order('date', { ascending: false }).order('created_at', { ascending: false });
    if (data) setRecords(data as MLTFuel[]);
    setIsLoading(false);
  };

  const addRecord = async () => {
    if (!form.truck_number.trim() || !form.fuel_litres) {
      toast.error('Truck number and fuel litres are required');
      return;
    }

    const { error } = await supabase.from('mlt_fuel_reports').insert({
      truck_number: form.truck_number.trim().toUpperCase(),
      fuel_litres: parseFloat(form.fuel_litres),
      amount: form.amount ? parseFloat(form.amount) : null,
      date: format(form.date, 'yyyy-MM-dd'),
      driver_name: form.driver_name.trim() || null,
      notes: form.notes.trim() || null,
    });

    if (error) { toast.error('Failed to add record'); return; }
    toast.success('Fuel record added');
    setShowAdd(false);
    setForm({ truck_number: '', fuel_litres: '', amount: '', date: new Date(), driver_name: '', notes: '' });
    fetchRecords();
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const { error } = await supabase.from('mlt_fuel_reports').delete().in('id', selectedIds);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success(`${selectedIds.length} record(s) deleted`);
    setSelectedIds([]);
    setShowDeleteConfirm(false);
    fetchRecords();
  };

  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      if (truckFilter && !r.truck_number.toLowerCase().includes(truckFilter.toLowerCase())) return false;
      if (driverFilter && !(r.driver_name || '').toLowerCase().includes(driverFilter.toLowerCase())) return false;
      if (dateFrom && new Date(r.date) < dateFrom) return false;
      if (dateTo && new Date(r.date) > dateTo) return false;
      return true;
    });
  }, [records, truckFilter, driverFilter, dateFrom, dateTo]);

  const dailyRecords = useMemo(() => {
    const dateStr = format(dailyDate, 'yyyy-MM-dd');
    return records.filter(r => r.date === dateStr);
  }, [records, dailyDate]);

  const monthlyRecords = useMemo(() => {
    const start = format(startOfMonth(new Date(monthlyYear, monthlyMonth - 1)), 'yyyy-MM-dd');
    const end = format(endOfMonth(new Date(monthlyYear, monthlyMonth - 1)), 'yyyy-MM-dd');
    return records.filter(r => r.date >= start && r.date <= end);
  }, [records, monthlyMonth, monthlyYear]);

  const getExportData = (data: MLTFuel[]) => ({
    headers: ['Date', 'Truck No.', 'Fuel (L)', 'Amount', 'Driver', 'Notes'],
    rows: data.map(r => [format(new Date(r.date), 'dd/MM/yyyy'), r.truck_number, Number(r.fuel_litres), r.amount != null ? Number(r.amount) : '-', r.driver_name || '-', r.notes || '-']),
    totalLitres: data.reduce((sum, r) => sum + Number(r.fuel_litres), 0),
    totalAmount: data.reduce((sum, r) => sum + (Number(r.amount) || 0), 0),
  });

  const exportPDF = (data: MLTFuel[], title: string, fileName: string) => {
    const { headers, rows, totalLitres, totalAmount } = getExportData(data);
    const doc = new jsPDF();
    doc.setFontSize(14); doc.text(title, 14, 15);
    doc.setFontSize(10); doc.text(REPORT_FOOTER, 14, 22);

    autoTable(doc, {
      head: [headers],
      body: [...rows, ['', 'Total', totalLitres + ' L', totalAmount > 0 ? formatCurrencyForPDF(totalAmount) : '-', '', '']],
      startY: 28,
      styles: { fontSize: 8 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    addReportNotes(doc, finalY);
    doc.save(`${fileName}.pdf`);
    toast.success('PDF downloaded');
  };

  const exportExcel = (data: MLTFuel[], title: string, fileName: string) => {
    const { headers, rows, totalLitres, totalAmount } = getExportData(data);
    exportToExcel([...rows, ['', 'Total', totalLitres, totalAmount, '', '']], headers, fileName, 'Fuel', title);
    toast.success('Excel downloaded');
  };

  const shareWhatsApp = (data: MLTFuel[], title: string) => {
    const { totalLitres, totalAmount } = getExportData(data);
    let msg = `*${title}*\n${REPORT_FOOTER}\n\n`;
    data.forEach(r => {
      msg += `📅 ${format(new Date(r.date), 'dd/MM/yyyy')}\n🚛 ${r.truck_number}\n⛽ ${Number(r.fuel_litres)} L${r.amount != null ? ` | ₹${Number(r.amount).toLocaleString('en-IN')}` : ''}${r.driver_name ? `\n👤 ${r.driver_name}` : ''}${r.notes ? `\n📝 ${r.notes}` : ''}\n\n`;
    });
    msg += `*Total: ${totalLitres} L${totalAmount > 0 ? ` | ₹${totalAmount.toLocaleString('en-IN')}` : ''}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const ExportButtons = ({ data, title, fileName }: { data: MLTFuel[]; title: string; fileName: string }) => (
    <div className="flex gap-2 flex-wrap">
      <Button size="sm" variant="outline" onClick={() => exportPDF(data, title, fileName)}><Download className="h-3 w-3 mr-1" />PDF</Button>
      <Button size="sm" variant="outline" onClick={() => exportExcel(data, title, fileName)}><FileText className="h-3 w-3 mr-1" />Excel</Button>
      <Button size="sm" variant="outline" onClick={() => shareWhatsApp(data, title)}><Share2 className="h-3 w-3 mr-1" />WhatsApp</Button>
    </div>
  );

  const FuelCard = ({ r, selectable }: { r: MLTFuel; selectable?: boolean }) => (
    <Card key={r.id} className="border-0 shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          {selectable && <Checkbox checked={selectedIds.includes(r.id)} onCheckedChange={(c) => setSelectedIds(prev => c ? [...prev, r.id] : prev.filter(id => id !== r.id))} className="mt-1" />}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <p className="font-bold text-sm text-foreground">🚛 {r.truck_number}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(r.date), 'dd/MM/yyyy')}</p>
            </div>
            <p className="text-sm text-foreground">⛽ {Number(r.fuel_litres)} Litres</p>
            {r.amount != null && <p className="text-sm font-semibold text-foreground">💰 ₹{Number(r.amount).toLocaleString('en-IN')}</p>}
            {r.driver_name && <p className="text-xs text-muted-foreground">👤 {r.driver_name}</p>}
            {r.notes && <p className="text-xs text-muted-foreground">📝 {r.notes}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const SummaryCard = ({ data }: { data: MLTFuel[] }) => {
    const totalL = data.reduce((s, r) => s + Number(r.fuel_litres), 0);
    const totalA = data.reduce((s, r) => s + (Number(r.amount) || 0), 0);
    return (
      <Card className="border-0 shadow-sm mt-3">
        <CardContent className="p-3 text-center">
          <p className="text-sm font-bold text-foreground">Total: {totalL} L{totalA > 0 ? ` | ₹${totalA.toLocaleString('en-IN')}` : ''}</p>
          <p className="text-xs text-muted-foreground">{data.length} records</p>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="p-4 max-w-md mx-auto pb-20">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-bold text-foreground">MLT Fuel Report</h1>
      </div>

      <div className="flex gap-2 mb-4">
        {(['list', 'daily', 'monthly'] as ViewType[]).map(v => (
          <Button key={v} size="sm" variant={view === v ? 'default' : 'outline'} onClick={() => setView(v)} className="flex-1 capitalize">{v === 'list' ? 'All Records' : v === 'daily' ? 'Daily' : 'Monthly'}</Button>
        ))}
      </div>

      {view === 'list' && (
        <>
          <Card className="border-0 shadow-sm mb-4">
            <CardContent className="p-3 space-y-2">
              <div className="flex gap-2">
                <Input placeholder="Filter by truck no." value={truckFilter} onChange={e => setTruckFilter(e.target.value)} className="text-sm" />
                <Input placeholder="Filter by driver" value={driverFilter} onChange={e => setDriverFilter(e.target.value)} className="text-sm" />
              </div>
              <div className="flex gap-2">
                <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                  <PopoverTrigger asChild><Button variant="outline" size="sm" className="flex-1 text-xs">{dateFrom ? format(dateFrom, 'dd/MM/yy') : 'From date'}</Button></PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateFrom} onSelect={d => { setDateFrom(d); setDateFromOpen(false); }} /></PopoverContent>
                </Popover>
                <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                  <PopoverTrigger asChild><Button variant="outline" size="sm" className="flex-1 text-xs">{dateTo ? format(dateTo, 'dd/MM/yy') : 'To date'}</Button></PopoverTrigger>
                  <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dateTo} onSelect={d => { setDateTo(d); setDateToOpen(false); }} /></PopoverContent>
                </Popover>
                {(dateFrom || dateTo || truckFilter || driverFilter) && (
                  <Button variant="ghost" size="sm" onClick={() => { setTruckFilter(''); setDriverFilter(''); setDateFrom(undefined); setDateTo(undefined); }}>Clear</Button>
                )}
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-2 mb-3 flex-wrap">
            <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-3 w-3 mr-1" />Add</Button>
            {selectedIds.length > 0 && (
              <Button size="sm" variant="destructive" onClick={() => setShowDeleteConfirm(true)}><Trash2 className="h-3 w-3 mr-1" />Delete ({selectedIds.length})</Button>
            )}
            <ExportButtons data={filteredRecords} title="MLT Fuel Report" fileName="mlt-fuel-report" />
          </div>

          <div className="space-y-2">
            {isLoading ? <p className="text-sm text-muted-foreground text-center py-8">Loading...</p> :
              filteredRecords.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No records found</p> :
              filteredRecords.map(r => <FuelCard key={r.id} r={r} selectable />)
            }
          </div>
          {filteredRecords.length > 0 && <SummaryCard data={filteredRecords} />}
        </>
      )}

      {view === 'daily' && (
        <>
          <div className="flex items-center justify-between mb-4">
            <Button variant="ghost" size="icon" onClick={() => setDailyDate(d => new Date(d.getTime() - 86400000))}><ChevronLeft className="h-4 w-4" /></Button>
            <Popover open={dailyCalOpen} onOpenChange={setDailyCalOpen}>
              <PopoverTrigger asChild><Button variant="outline" size="sm">{format(dailyDate, 'dd MMM yyyy')}</Button></PopoverTrigger>
              <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={dailyDate} onSelect={d => { if (d) { setDailyDate(d); setDailyCalOpen(false); } }} /></PopoverContent>
            </Popover>
            <Button variant="ghost" size="icon" onClick={() => setDailyDate(d => new Date(d.getTime() + 86400000))}><ChevronRight className="h-4 w-4" /></Button>
          </div>
          <ExportButtons data={dailyRecords} title={`MLT Fuel - ${format(dailyDate, 'dd MMM yyyy')}`} fileName={`mlt-fuel-${format(dailyDate, 'yyyy-MM-dd')}`} />
          <div className="space-y-2 mt-3">
            {dailyRecords.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No records for this day</p> :
              dailyRecords.map(r => <FuelCard key={r.id} r={r} />)
            }
          </div>
          {dailyRecords.length > 0 && <SummaryCard data={dailyRecords} />}
        </>
      )}

      {view === 'monthly' && (
        <>
          <div className="flex gap-2 mb-4">
            <Select value={monthlyMonth.toString()} onValueChange={v => setMonthlyMonth(parseInt(v))}>
              <SelectTrigger className="flex-1"><SelectValue /></SelectTrigger>
              <SelectContent>{months.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={monthlyYear.toString()} onValueChange={v => setMonthlyYear(parseInt(v))}>
              <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
              <SelectContent>{[2024, 2025, 2026].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <ExportButtons data={monthlyRecords} title={`MLT Fuel - ${months[monthlyMonth - 1]} ${monthlyYear}`} fileName={`mlt-fuel-${monthlyMonth}-${monthlyYear}`} />
          <div className="space-y-2 mt-3">
            {monthlyRecords.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No records for this month</p> :
              monthlyRecords.map(r => <FuelCard key={r.id} r={r} />)
            }
          </div>
          {monthlyRecords.length > 0 && <SummaryCard data={monthlyRecords} />}
        </>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Fuel Record</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Truck Number *</Label><Input placeholder="e.g. JH 10 AB 1234" value={form.truck_number} onChange={e => setForm(f => ({ ...f, truck_number: e.target.value }))} /></div>
            <div><Label>Fuel (Litres) *</Label><Input type="number" placeholder="0" value={form.fuel_litres} onChange={e => setForm(f => ({ ...f, fuel_litres: e.target.value }))} /></div>
            <div><Label>Amount (₹) (optional)</Label><Input type="number" placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
            <div>
              <Label>Date *</Label>
              <Popover open={formCalendarOpen} onOpenChange={setFormCalendarOpen}>
                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start">{format(form.date, 'dd MMM yyyy')}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={form.date} onSelect={d => { if (d) { setForm(f => ({ ...f, date: d })); setFormCalendarOpen(false); } }} /></PopoverContent>
              </Popover>
            </div>
            <div><Label>Driver Name</Label><Input placeholder="Driver name" value={form.driver_name} onChange={e => setForm(f => ({ ...f, driver_name: e.target.value }))} /></div>
            <div><Label>Notes (optional)</Label><Input placeholder="Any notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={addRecord}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.length} record(s)?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteSelected}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default MLTFuelReportSection;
