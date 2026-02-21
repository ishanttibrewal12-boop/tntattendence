import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Plus, Trash2, Search, Download, Share2, FileText, Calendar as CalendarIcon, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, getDaysInMonth } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { exportToExcel, addReportNotes, REPORT_FOOTER } from '@/lib/exportUtils';
import { formatCurrencyForPDF } from '@/lib/formatUtils';

interface MLTService {
  id: string;
  truck_number: string;
  driver_name: string | null;
  service_place: string;
  work_description: string;
  amount: number;
  date: string;
  notes: string | null;
  created_at: string;
}

interface Props {
  onBack: () => void;
}

type ViewType = 'list' | 'daily' | 'monthly';

const MLTServicesSection = ({ onBack }: Props) => {
  const [services, setServices] = useState<MLTService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState<ViewType>('list');
  const [showAdd, setShowAdd] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Form
  const [form, setForm] = useState({ truck_number: '', driver_name: '', service_place: '', work_description: '', amount: '', date: new Date(), notes: '' });
  const [formCalendarOpen, setFormCalendarOpen] = useState(false);

  // Filters
  const [truckFilter, setTruckFilter] = useState('');
  const [driverFilter, setDriverFilter] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);

  // Daily / Monthly
  const [dailyDate, setDailyDate] = useState(new Date());
  const [dailyCalOpen, setDailyCalOpen] = useState(false);
  const [monthlyMonth, setMonthlyMonth] = useState(new Date().getMonth() + 1);
  const [monthlyYear, setMonthlyYear] = useState(new Date().getFullYear());

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => { fetchServices(); }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('mlt_services').select('*').order('date', { ascending: false }).order('created_at', { ascending: false });
    if (data) setServices(data as MLTService[]);
    setIsLoading(false);
  };

  const addService = async () => {
    if (!form.truck_number.trim() || !form.service_place.trim() || !form.work_description.trim()) {
      toast.error('Truck number, service place, and work description are required');
      return;
    }
    if (!form.amount || parseFloat(form.amount) <= 0) {
      toast.error('Amount is required');
      return;
    }

    const { error } = await supabase.from('mlt_services').insert({
      truck_number: form.truck_number.trim().toUpperCase(),
      driver_name: form.driver_name.trim() || null,
      service_place: form.service_place.trim(),
      work_description: form.work_description.trim(),
      amount: parseFloat(form.amount),
      date: format(form.date, 'yyyy-MM-dd'),
      notes: form.notes.trim() || null,
    });

    if (error) { toast.error('Failed to add service'); return; }
    toast.success('Service record added');
    setShowAdd(false);
    setForm({ truck_number: '', driver_name: '', service_place: '', work_description: '', amount: '', date: new Date(), notes: '' });
    fetchServices();
  };

  const deleteSelected = async () => {
    if (selectedIds.length === 0) return;
    const { error } = await supabase.from('mlt_services').delete().in('id', selectedIds);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success(`${selectedIds.length} record(s) deleted`);
    setSelectedIds([]);
    setShowDeleteConfirm(false);
    fetchServices();
  };

  // Filtered data
  const filteredServices = useMemo(() => {
    return services.filter(s => {
      if (truckFilter && !s.truck_number.toLowerCase().includes(truckFilter.toLowerCase())) return false;
      if (driverFilter && !(s.driver_name || '').toLowerCase().includes(driverFilter.toLowerCase())) return false;
      if (dateFrom && new Date(s.date) < dateFrom) return false;
      if (dateTo && new Date(s.date) > dateTo) return false;
      return true;
    });
  }, [services, truckFilter, driverFilter, dateFrom, dateTo]);

  const dailyServices = useMemo(() => {
    const dateStr = format(dailyDate, 'yyyy-MM-dd');
    return services.filter(s => s.date === dateStr);
  }, [services, dailyDate]);

  const monthlyServices = useMemo(() => {
    const start = format(startOfMonth(new Date(monthlyYear, monthlyMonth - 1)), 'yyyy-MM-dd');
    const end = format(endOfMonth(new Date(monthlyYear, monthlyMonth - 1)), 'yyyy-MM-dd');
    return services.filter(s => s.date >= start && s.date <= end);
  }, [services, monthlyMonth, monthlyYear]);

  // Export helpers
  const getExportData = (data: MLTService[]) => ({
    headers: ['Date', 'Truck No.', 'Driver', 'Service Place', 'Work Done', 'Amount'],
    rows: data.map(s => [format(new Date(s.date), 'dd/MM/yyyy'), s.truck_number, s.driver_name || '-', s.service_place, s.work_description, Number(s.amount)]),
    total: data.reduce((sum, s) => sum + Number(s.amount), 0),
  });

  const exportPDF = (data: MLTService[], title: string, fileName: string) => {
    const { headers, rows, total } = getExportData(data);
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(REPORT_FOOTER, 14, 22);

    autoTable(doc, {
      head: [headers],
      body: [...rows, ['', '', '', '', 'Total', formatCurrencyForPDF(total)]],
      startY: 28,
      styles: { fontSize: 8 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;
    addReportNotes(doc, finalY);
    doc.save(`${fileName}.pdf`);
    toast.success('PDF downloaded');
  };

  const exportExcel = (data: MLTService[], title: string, fileName: string) => {
    const { headers, rows, total } = getExportData(data);
    exportToExcel([...rows, ['', '', '', '', 'Total', total]], headers, fileName, 'Services', title);
    toast.success('Excel downloaded');
  };

  const shareWhatsApp = (data: MLTService[], title: string) => {
    const { total } = getExportData(data);
    let msg = `*${title}*\n${REPORT_FOOTER}\n\n`;
    data.forEach(s => {
      msg += `📅 ${format(new Date(s.date), 'dd/MM/yyyy')}\n🚛 ${s.truck_number}${s.driver_name ? ` | ${s.driver_name}` : ''}\n📍 ${s.service_place}\n🔧 ${s.work_description}\n💰 ₹${Number(s.amount).toLocaleString('en-IN')}\n\n`;
    });
    msg += `*Total: ₹${total.toLocaleString('en-IN')}*`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const ExportButtons = ({ data, title, fileName }: { data: MLTService[]; title: string; fileName: string }) => (
    <div className="flex gap-2 flex-wrap">
      <Button size="sm" variant="outline" onClick={() => exportPDF(data, title, fileName)}><Download className="h-3 w-3 mr-1" />PDF</Button>
      <Button size="sm" variant="outline" onClick={() => exportExcel(data, title, fileName)}><FileText className="h-3 w-3 mr-1" />Excel</Button>
      <Button size="sm" variant="outline" onClick={() => shareWhatsApp(data, title)}><Share2 className="h-3 w-3 mr-1" />WhatsApp</Button>
    </div>
  );

  // Render card for a service
  const ServiceCard = ({ s, selectable }: { s: MLTService; selectable?: boolean }) => (
    <Card key={s.id} className="border-0 shadow-sm">
      <CardContent className="p-3">
        <div className="flex items-start gap-2">
          {selectable && (
            <Checkbox checked={selectedIds.includes(s.id)} onCheckedChange={(c) => setSelectedIds(prev => c ? [...prev, s.id] : prev.filter(id => id !== s.id))} className="mt-1" />
          )}
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <p className="font-bold text-sm text-foreground">🚛 {s.truck_number}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(s.date), 'dd/MM/yyyy')}</p>
            </div>
            {s.driver_name && <p className="text-xs text-muted-foreground">Driver: {s.driver_name}</p>}
            <p className="text-xs text-muted-foreground">📍 {s.service_place}</p>
            <p className="text-sm text-foreground mt-1">🔧 {s.work_description}</p>
            <p className="text-sm font-semibold text-foreground mt-1">💰 ₹{Number(s.amount).toLocaleString('en-IN')}</p>
            {s.notes && <p className="text-xs text-muted-foreground mt-1">Note: {s.notes}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="p-4 max-w-md mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-bold text-foreground">MLT Services</h1>
      </div>

      {/* View Tabs */}
      <div className="flex gap-2 mb-4">
        {(['list', 'daily', 'monthly'] as ViewType[]).map(v => (
          <Button key={v} size="sm" variant={view === v ? 'default' : 'outline'} onClick={() => setView(v)} className="flex-1 capitalize">{v === 'list' ? 'All Records' : v === 'daily' ? 'Daily' : 'Monthly'}</Button>
        ))}
      </div>

      {/* === ALL RECORDS VIEW === */}
      {view === 'list' && (
        <>
          {/* Filters */}
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

          {/* Actions */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-3 w-3 mr-1" />Add</Button>
            {selectedIds.length > 0 && (
              <Button size="sm" variant="destructive" onClick={() => setShowDeleteConfirm(true)}><Trash2 className="h-3 w-3 mr-1" />Delete ({selectedIds.length})</Button>
            )}
            <ExportButtons data={filteredServices} title="MLT Services Report" fileName="mlt-services" />
          </div>

          {/* List */}
          <div className="space-y-2">
            {isLoading ? <p className="text-sm text-muted-foreground text-center py-8">Loading...</p> :
              filteredServices.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No records found</p> :
              filteredServices.map(s => <ServiceCard key={s.id} s={s} selectable />)
            }
          </div>
          {filteredServices.length > 0 && (
            <Card className="border-0 shadow-sm mt-3">
              <CardContent className="p-3 text-center">
                <p className="text-sm font-bold text-foreground">Total: ₹{filteredServices.reduce((sum, s) => sum + Number(s.amount), 0).toLocaleString('en-IN')}</p>
                <p className="text-xs text-muted-foreground">{filteredServices.length} records</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* === DAILY VIEW === */}
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
          <ExportButtons data={dailyServices} title={`MLT Services - ${format(dailyDate, 'dd MMM yyyy')}`} fileName={`mlt-services-${format(dailyDate, 'yyyy-MM-dd')}`} />
          <div className="space-y-2 mt-3">
            {dailyServices.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No records for this day</p> :
              dailyServices.map(s => <ServiceCard key={s.id} s={s} />)
            }
          </div>
          {dailyServices.length > 0 && (
            <Card className="border-0 shadow-sm mt-3">
              <CardContent className="p-3 text-center">
                <p className="text-sm font-bold text-foreground">Day Total: ₹{dailyServices.reduce((sum, s) => sum + Number(s.amount), 0).toLocaleString('en-IN')}</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* === MONTHLY VIEW === */}
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
          <ExportButtons data={monthlyServices} title={`MLT Services - ${months[monthlyMonth - 1]} ${monthlyYear}`} fileName={`mlt-services-${monthlyMonth}-${monthlyYear}`} />
          <div className="space-y-2 mt-3">
            {monthlyServices.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No records for this month</p> :
              monthlyServices.map(s => <ServiceCard key={s.id} s={s} />)
            }
          </div>
          {monthlyServices.length > 0 && (
            <Card className="border-0 shadow-sm mt-3">
              <CardContent className="p-3 text-center">
                <p className="text-sm font-bold text-foreground">Month Total: ₹{monthlyServices.reduce((sum, s) => sum + Number(s.amount), 0).toLocaleString('en-IN')}</p>
                <p className="text-xs text-muted-foreground">{monthlyServices.length} records</p>
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Add Dialog */}
      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Service Record</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Truck Number *</Label><Input placeholder="e.g. JH 10 AB 1234" value={form.truck_number} onChange={e => setForm(f => ({ ...f, truck_number: e.target.value }))} /></div>
            <div><Label>Driver Name (optional)</Label><Input placeholder="Driver name" value={form.driver_name} onChange={e => setForm(f => ({ ...f, driver_name: e.target.value }))} /></div>
            <div><Label>Service Place *</Label><Input placeholder="Location" value={form.service_place} onChange={e => setForm(f => ({ ...f, service_place: e.target.value }))} /></div>
            <div><Label>Work / Service Done *</Label><Textarea placeholder="Describe the work done" value={form.work_description} onChange={e => setForm(f => ({ ...f, work_description: e.target.value }))} /></div>
            <div><Label>Amount (₹) *</Label><Input type="number" placeholder="0" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} /></div>
            <div>
              <Label>Date *</Label>
              <Popover open={formCalendarOpen} onOpenChange={setFormCalendarOpen}>
                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start">{format(form.date, 'dd MMM yyyy')}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={form.date} onSelect={d => { if (d) { setForm(f => ({ ...f, date: d })); setFormCalendarOpen(false); } }} /></PopoverContent>
              </Popover>
            </div>
            <div><Label>Notes (optional)</Label><Input placeholder="Any additional notes" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
          <DialogFooter><Button onClick={addService}>Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
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

export default MLTServicesSection;
