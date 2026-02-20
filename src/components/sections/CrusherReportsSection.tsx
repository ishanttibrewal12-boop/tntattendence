import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ArrowLeft, Plus, FileText, Calendar, Download, Share2, Trash2, Filter } from 'lucide-react';
import { exportToExcel, REPORT_NOTE_ENGLISH, REPORT_NOTE_HINDI, REPORT_FOOTER } from '@/lib/exportUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CrusherReportsSectionProps {
  onBack: () => void;
}

interface DispatchEntry {
  id: string;
  party_name: string;
  date: string;
  truck_number: string;
  amount: number;
  quantity: number;
  product_name: string;
  challan_number: string;
  notes: string | null;
  created_at: string;
}

interface BolderEntry {
  id: string;
  company_name: string;
  quality: string;
  challan_number: string;
  truck_number: string;
  date: string;
  notes: string | null;
  created_at: string;
}

type ReportTab = 'dispatch' | 'bolder';
type SubView = 'add' | 'daily' | 'monthly';

const CrusherReportsSection = ({ onBack }: CrusherReportsSectionProps) => {
  const { toast } = useToast();
  const [reportTab, setReportTab] = useState<ReportTab>('dispatch');
  const [subView, setSubView] = useState<SubView>('add');

  // Dispatch state
  const [dispatches, setDispatches] = useState<DispatchEntry[]>([]);
  const [dpParty, setDpParty] = useState('');
  const [dpDate, setDpDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [dpTruck, setDpTruck] = useState('');
  const [dpAmount, setDpAmount] = useState('');
  const [dpQuantity, setDpQuantity] = useState('');
  const [dpProduct, setDpProduct] = useState('');
  const [dpChallan, setDpChallan] = useState('');
  const [dpNotes, setDpNotes] = useState('');

  // Bolder state
  const [bolders, setBolders] = useState<BolderEntry[]>([]);
  const [blCompany, setBlCompany] = useState('');
  const [blQuality, setBlQuality] = useState('');
  const [blChallan, setBlChallan] = useState('');
  const [blTruck, setBlTruck] = useState('');
  const [blDate, setBlDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [blNotes, setBlNotes] = useState('');

  // Filters
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterCompany, setFilterCompany] = useState('');

  // Fetch dispatches
  const fetchDispatches = useCallback(async () => {
    const { data } = await supabase.from('dispatch_reports').select('*').order('date', { ascending: false }).order('created_at', { ascending: false });
    if (data) setDispatches(data as DispatchEntry[]);
  }, []);

  // Fetch bolders
  const fetchBolders = useCallback(async () => {
    const { data } = await supabase.from('bolder_reports').select('*').order('date', { ascending: false }).order('created_at', { ascending: false });
    if (data) setBolders(data as BolderEntry[]);
  }, []);

  useEffect(() => {
    fetchDispatches();
    fetchBolders();

    const dispatchChannel = supabase.channel('dispatch_reports_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_reports' }, () => fetchDispatches())
      .subscribe();
    const bolderChannel = supabase.channel('bolder_reports_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bolder_reports' }, () => fetchBolders())
      .subscribe();

    return () => { supabase.removeChannel(dispatchChannel); supabase.removeChannel(bolderChannel); };
  }, [fetchDispatches, fetchBolders]);

  // Add Dispatch
  const handleAddDispatch = async () => {
    if (!dpParty || !dpTruck || !dpAmount || !dpQuantity || !dpProduct || !dpChallan) {
      toast({ title: 'Error', description: 'All fields except Notes are required', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('dispatch_reports').insert({
      party_name: dpParty.trim(),
      date: dpDate,
      truck_number: dpTruck.trim(),
      amount: parseFloat(dpAmount),
      quantity: parseFloat(dpQuantity),
      product_name: dpProduct.trim(),
      challan_number: dpChallan.trim(),
      notes: dpNotes.trim() || null,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Dispatch entry added' });
      setDpParty(''); setDpTruck(''); setDpAmount(''); setDpQuantity(''); setDpProduct(''); setDpChallan(''); setDpNotes('');
    }
  };

  // Add Bolder
  const handleAddBolder = async () => {
    if (!blCompany || !blQuality || !blChallan || !blTruck) {
      toast({ title: 'Error', description: 'All fields except Notes are required', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('bolder_reports').insert({
      company_name: blCompany.trim(),
      quality: blQuality.trim(),
      challan_number: blChallan.trim(),
      truck_number: blTruck.trim(),
      date: blDate,
      notes: blNotes.trim() || null,
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Success', description: 'Bolder entry added' });
      setBlCompany(''); setBlQuality(''); setBlChallan(''); setBlTruck(''); setBlNotes('');
    }
  };

  // Delete handlers
  const handleDeleteDispatch = async (id: string) => {
    const { error } = await supabase.from('dispatch_reports').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: 'Deleted', description: 'Dispatch entry removed' });
  };

  const handleDeleteBolder = async (id: string) => {
    const { error } = await supabase.from('bolder_reports').delete().eq('id', id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else toast({ title: 'Deleted', description: 'Bolder entry removed' });
  };

  // Filtered data helpers
  const getFilteredDispatches = (mode: 'daily' | 'monthly') => {
    let filtered = dispatches;
    if (mode === 'daily') {
      filtered = filtered.filter(d => d.date === filterDate);
    } else {
      const start = startOfMonth(new Date(filterYear, filterMonth - 1));
      const end = endOfMonth(new Date(filterYear, filterMonth - 1));
      filtered = filtered.filter(d => {
        const dt = new Date(d.date);
        return dt >= start && dt <= end;
      });
    }
    if (filterCompany) {
      filtered = filtered.filter(d => d.party_name.toLowerCase().includes(filterCompany.toLowerCase()));
    }
    return filtered;
  };

  const getFilteredBolders = (mode: 'daily' | 'monthly') => {
    let filtered = bolders;
    if (mode === 'daily') {
      filtered = filtered.filter(b => b.date === filterDate);
    } else {
      const start = startOfMonth(new Date(filterYear, filterMonth - 1));
      const end = endOfMonth(new Date(filterYear, filterMonth - 1));
      filtered = filtered.filter(b => {
        const dt = new Date(b.date);
        return dt >= start && dt <= end;
      });
    }
    if (filterCompany) {
      filtered = filtered.filter(b => b.company_name.toLowerCase().includes(filterCompany.toLowerCase()));
    }
    return filtered;
  };

  // Export helpers
  const exportDispatchWhatsApp = (data: DispatchEntry[], title: string) => {
    const totalQty = data.reduce((s, d) => s + d.quantity, 0);
    const totalAmt = data.reduce((s, d) => s + d.amount, 0);
    let msg = `📊 *${title}*\n${REPORT_FOOTER}\n\n`;
    msg += `*Summary:*\n`;
    msg += `Total Entries: ${data.length}\n`;
    msg += `Total Quantity: ${totalQty}\n`;
    msg += `Total Amount: ₹${totalAmt.toLocaleString('en-IN')}\n\n`;
    msg += `*Details:*\n`;
    data.forEach((d, i) => {
      msg += `${i + 1}. ${format(new Date(d.date), 'dd/MM/yyyy')} | ${d.party_name} | ${d.product_name} | Qty: ${d.quantity} | ₹${d.amount.toLocaleString('en-IN')} | Truck: ${d.truck_number} | Ch: ${d.challan_number}\n`;
    });
    msg += `\n${REPORT_NOTE_ENGLISH}\n${REPORT_NOTE_HINDI}`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  const exportBolderWhatsApp = (data: BolderEntry[], title: string) => {
    let msg = `📊 *${title}*\n${REPORT_FOOTER}\n\n`;
    msg += `*Summary:*\nTotal Entries: ${data.length}\n\n*Details:*\n`;
    data.forEach((b, i) => {
      msg += `${i + 1}. ${format(new Date(b.date), 'dd/MM/yyyy')} | ${b.company_name} | Quality: ${b.quality} | Truck: ${b.truck_number} | Ch: ${b.challan_number}\n`;
    });
    msg += `\n${REPORT_NOTE_ENGLISH}\n${REPORT_NOTE_HINDI}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const exportDispatchPDF = (data: DispatchEntry[], title: string) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(REPORT_FOOTER, 14, 28);
    const totalQty = data.reduce((s, d) => s + d.quantity, 0);
    const totalAmt = data.reduce((s, d) => s + d.amount, 0);
    doc.text(`Total Entries: ${data.length} | Total Qty: ${totalQty} | Total Amount: Rs ${totalAmt.toLocaleString('en-IN')}`, 14, 36);
    autoTable(doc, {
      head: [['Date', 'Party', 'Product', 'Truck', 'Challan', 'Qty', 'Amount']],
      body: data.map(d => [format(new Date(d.date), 'dd/MM/yyyy'), d.party_name, d.product_name, d.truck_number, d.challan_number, d.quantity, `Rs ${d.amount.toLocaleString('en-IN')}`]),
      startY: 42,
      styles: { fontSize: 8 },
    });
    const fy = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text(REPORT_NOTE_ENGLISH, 14, fy);
    doc.text(REPORT_NOTE_HINDI, 14, fy + 5);
    doc.save(`${title.replace(/\s/g, '_')}.pdf`);
  };

  const exportBolderPDF = (data: BolderEntry[], title: string) => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(title, 14, 20);
    doc.setFontSize(10);
    doc.text(REPORT_FOOTER, 14, 28);
    doc.text(`Total Entries: ${data.length}`, 14, 36);
    autoTable(doc, {
      head: [['Date', 'Company', 'Quality', 'Truck', 'Challan']],
      body: data.map(b => [format(new Date(b.date), 'dd/MM/yyyy'), b.company_name, b.quality, b.truck_number, b.challan_number]),
      startY: 42,
      styles: { fontSize: 8 },
    });
    const fy = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8);
    doc.text(REPORT_NOTE_ENGLISH, 14, fy);
    doc.text(REPORT_NOTE_HINDI, 14, fy + 5);
    doc.save(`${title.replace(/\s/g, '_')}.pdf`);
  };

  const exportDispatchExcel = (data: DispatchEntry[], title: string) => {
    exportToExcel(
      data.map(d => [format(new Date(d.date), 'dd/MM/yyyy'), d.party_name, d.product_name, d.truck_number, d.challan_number, d.quantity, d.amount]),
      ['Date', 'Party', 'Product', 'Truck', 'Challan', 'Quantity', 'Amount'],
      title.replace(/\s/g, '_'),
      'Dispatch',
      title
    );
  };

  const exportBolderExcel = (data: BolderEntry[], title: string) => {
    exportToExcel(
      data.map(b => [format(new Date(b.date), 'dd/MM/yyyy'), b.company_name, b.quality, b.truck_number, b.challan_number]),
      ['Date', 'Company', 'Quality', 'Truck', 'Challan'],
      title.replace(/\s/g, '_'),
      'Bolder',
      title
    );
  };

  // Month/Year selectors
  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: format(new Date(2024, i), 'MMMM') }));
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // Render filter bar
  const renderFilters = (mode: 'daily' | 'monthly') => (
    <div className="flex flex-wrap gap-3 mb-4">
      {mode === 'daily' ? (
        <div className="flex-1 min-w-[140px]">
          <Label className="text-xs">Date</Label>
          <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
        </div>
      ) : (
        <>
          <div className="min-w-[120px]">
            <Label className="text-xs">Month</Label>
            <Select value={String(filterMonth)} onValueChange={v => setFilterMonth(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="min-w-[90px]">
            <Label className="text-xs">Year</Label>
            <Select value={String(filterYear)} onValueChange={v => setFilterYear(Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </>
      )}
      <div className="flex-1 min-w-[140px]">
        <Label className="text-xs"><Filter className="h-3 w-3 inline mr-1" />Company</Label>
        <Input placeholder="Filter by name..." value={filterCompany} onChange={e => setFilterCompany(e.target.value)} />
      </div>
    </div>
  );

  // Export buttons
  const renderExportButtons = (onWhatsApp: () => void, onPDF: () => void, onExcel: () => void) => (
    <div className="flex gap-2 flex-wrap mb-4">
      <Button size="sm" variant="outline" onClick={onWhatsApp}><Share2 className="h-3 w-3 mr-1" />WhatsApp</Button>
      <Button size="sm" variant="outline" onClick={onPDF}><Download className="h-3 w-3 mr-1" />PDF</Button>
      <Button size="sm" variant="outline" onClick={onExcel}><FileText className="h-3 w-3 mr-1" />Excel</Button>
    </div>
  );

  // Dispatch report table
  const renderDispatchTable = (data: DispatchEntry[], showDelete = false) => {
    const totalQty = data.reduce((s, d) => s + d.quantity, 0);
    const totalAmt = data.reduce((s, d) => s + d.amount, 0);
    return (
      <>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <Card className="border-0"><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Entries</p><p className="text-xl font-bold text-foreground">{data.length}</p></CardContent></Card>
          <Card className="border-0"><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Total Qty</p><p className="text-xl font-bold text-foreground">{totalQty}</p></CardContent></Card>
          <Card className="border-0"><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Total Amt</p><p className="text-xl font-bold text-foreground">₹{totalAmt.toLocaleString('en-IN')}</p></CardContent></Card>
        </div>
        <div className="overflow-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs">Date</TableHead>
                <TableHead className="text-xs">Party</TableHead>
                <TableHead className="text-xs">Product</TableHead>
                <TableHead className="text-xs">Truck</TableHead>
                <TableHead className="text-xs">Challan</TableHead>
                <TableHead className="text-xs text-right">Qty</TableHead>
                <TableHead className="text-xs text-right">Amount</TableHead>
                {showDelete && <TableHead className="text-xs"></TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow><TableCell colSpan={showDelete ? 8 : 7} className="text-center text-muted-foreground text-sm py-8">No entries found</TableCell></TableRow>
              ) : data.map(d => (
                <TableRow key={d.id}>
                  <TableCell className="text-xs">{format(new Date(d.date), 'dd/MM/yy')}</TableCell>
                  <TableCell className="text-xs font-medium">{d.party_name}</TableCell>
                  <TableCell className="text-xs"><Badge variant="secondary" className="text-xs">{d.product_name}</Badge></TableCell>
                  <TableCell className="text-xs">{d.truck_number}</TableCell>
                  <TableCell className="text-xs">{d.challan_number}</TableCell>
                  <TableCell className="text-xs text-right">{d.quantity}</TableCell>
                  <TableCell className="text-xs text-right font-medium">₹{d.amount.toLocaleString('en-IN')}</TableCell>
                  {showDelete && (
                    <TableCell><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteDispatch(d.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button></TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </>
    );
  };

  // Bolder report table
  const renderBolderTable = (data: BolderEntry[], showDelete = false) => (
    <>
      <div className="grid grid-cols-1 gap-3 mb-4">
        <Card className="border-0"><CardContent className="p-3 text-center"><p className="text-xs text-muted-foreground">Total Entries</p><p className="text-xl font-bold text-foreground">{data.length}</p></CardContent></Card>
      </div>
      <div className="overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="text-xs">Date</TableHead>
              <TableHead className="text-xs">Company</TableHead>
              <TableHead className="text-xs">Quality</TableHead>
              <TableHead className="text-xs">Truck</TableHead>
              <TableHead className="text-xs">Challan</TableHead>
              {showDelete && <TableHead className="text-xs"></TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow><TableCell colSpan={showDelete ? 6 : 5} className="text-center text-muted-foreground text-sm py-8">No entries found</TableCell></TableRow>
            ) : data.map(b => (
              <TableRow key={b.id}>
                <TableCell className="text-xs">{format(new Date(b.date), 'dd/MM/yy')}</TableCell>
                <TableCell className="text-xs font-medium">{b.company_name}</TableCell>
                <TableCell className="text-xs"><Badge variant="outline" className="text-xs">{b.quality}</Badge></TableCell>
                <TableCell className="text-xs">{b.truck_number}</TableCell>
                <TableCell className="text-xs">{b.challan_number}</TableCell>
                {showDelete && (
                  <TableCell><Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteBolder(b.id)}><Trash2 className="h-3 w-3 text-destructive" /></Button></TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );

  return (
    <div className="min-h-screen" style={{ background: '#F4F6F8' }}>
      <div className="p-4 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <Button variant="ghost" size="icon" onClick={onBack} className="hover:bg-muted">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">Crusher Reports</h1>
        </div>

        {/* Main tabs: Dispatch / Bolder */}
        <Tabs value={reportTab} onValueChange={v => { setReportTab(v as ReportTab); setSubView('add'); }}>
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="dispatch">Dispatch Report</TabsTrigger>
            <TabsTrigger value="bolder">Bolder Report</TabsTrigger>
          </TabsList>

          {/* Sub-navigation */}
          <div className="flex gap-2 mb-4">
            <Button size="sm" variant={subView === 'add' ? 'default' : 'outline'} onClick={() => setSubView('add')}><Plus className="h-3 w-3 mr-1" />Add</Button>
            <Button size="sm" variant={subView === 'daily' ? 'default' : 'outline'} onClick={() => setSubView('daily')}><Calendar className="h-3 w-3 mr-1" />Daily</Button>
            <Button size="sm" variant={subView === 'monthly' ? 'default' : 'outline'} onClick={() => setSubView('monthly')}><FileText className="h-3 w-3 mr-1" />Monthly</Button>
          </div>

          {/* DISPATCH TAB */}
          <TabsContent value="dispatch">
            {subView === 'add' && (
              <Card className="border-0">
                <CardHeader className="pb-3"><CardTitle className="text-base">Add Dispatch Entry</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Party Name *</Label><Input value={dpParty} onChange={e => setDpParty(e.target.value)} placeholder="Enter party name" /></div>
                    <div><Label className="text-xs">Date *</Label><Input type="date" value={dpDate} onChange={e => setDpDate(e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Truck Number *</Label><Input value={dpTruck} onChange={e => setDpTruck(e.target.value)} placeholder="e.g. JH05AB1234" /></div>
                    <div><Label className="text-xs">Challan Number *</Label><Input value={dpChallan} onChange={e => setDpChallan(e.target.value)} placeholder="Challan no." /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label className="text-xs">Product Name *</Label><Input value={dpProduct} onChange={e => setDpProduct(e.target.value)} placeholder="Product" /></div>
                    <div><Label className="text-xs">Quantity *</Label><Input type="number" value={dpQuantity} onChange={e => setDpQuantity(e.target.value)} placeholder="0" /></div>
                    <div><Label className="text-xs">Amount *</Label><Input type="number" value={dpAmount} onChange={e => setDpAmount(e.target.value)} placeholder="₹0" /></div>
                  </div>
                  <div><Label className="text-xs">Notes (Optional)</Label><Input value={dpNotes} onChange={e => setDpNotes(e.target.value)} placeholder="Any notes..." /></div>
                  <Button className="w-full" onClick={handleAddDispatch}><Plus className="h-4 w-4 mr-1" />Add Dispatch</Button>
                </CardContent>
              </Card>
            )}

            {subView === 'add' && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Recent Dispatches</p>
                {renderDispatchTable(dispatches.slice(0, 20), true)}
              </div>
            )}

            {subView === 'daily' && (
              <Card className="border-0">
                <CardHeader className="pb-3"><CardTitle className="text-base">Daily Dispatch Report</CardTitle></CardHeader>
                <CardContent>
                  {renderFilters('daily')}
                  {(() => {
                    const data = getFilteredDispatches('daily');
                    const title = `Dispatch Daily Report - ${format(new Date(filterDate), 'dd MMM yyyy')}`;
                    return (
                      <>
                        {renderExportButtons(() => exportDispatchWhatsApp(data, title), () => exportDispatchPDF(data, title), () => exportDispatchExcel(data, title))}
                        {renderDispatchTable(data)}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {subView === 'monthly' && (
              <Card className="border-0">
                <CardHeader className="pb-3"><CardTitle className="text-base">Monthly Dispatch Report</CardTitle></CardHeader>
                <CardContent>
                  {renderFilters('monthly')}
                  {(() => {
                    const data = getFilteredDispatches('monthly');
                    const title = `Dispatch Monthly Report - ${months[filterMonth - 1].label} ${filterYear}`;
                    return (
                      <>
                        {renderExportButtons(() => exportDispatchWhatsApp(data, title), () => exportDispatchPDF(data, title), () => exportDispatchExcel(data, title))}
                        {renderDispatchTable(data)}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* BOLDER TAB */}
          <TabsContent value="bolder">
            {subView === 'add' && (
              <Card className="border-0">
                <CardHeader className="pb-3"><CardTitle className="text-base">Add Bolder Entry</CardTitle></CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Company Name *</Label><Input value={blCompany} onChange={e => setBlCompany(e.target.value)} placeholder="Source company" /></div>
                    <div><Label className="text-xs">Date *</Label><Input type="date" value={blDate} onChange={e => setBlDate(e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label className="text-xs">Quality *</Label><Input value={blQuality} onChange={e => setBlQuality(e.target.value)} placeholder="Quality type" /></div>
                    <div><Label className="text-xs">Truck Number *</Label><Input value={blTruck} onChange={e => setBlTruck(e.target.value)} placeholder="e.g. JH05AB1234" /></div>
                    <div><Label className="text-xs">Challan Number *</Label><Input value={blChallan} onChange={e => setBlChallan(e.target.value)} placeholder="Challan no." /></div>
                  </div>
                  <div><Label className="text-xs">Notes (Optional)</Label><Input value={blNotes} onChange={e => setBlNotes(e.target.value)} placeholder="Any notes..." /></div>
                  <Button className="w-full" onClick={handleAddBolder}><Plus className="h-4 w-4 mr-1" />Add Bolder Entry</Button>
                </CardContent>
              </Card>
            )}

            {subView === 'add' && (
              <div className="mt-4">
                <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wider">Recent Bolder Entries</p>
                {renderBolderTable(bolders.slice(0, 20), true)}
              </div>
            )}

            {subView === 'daily' && (
              <Card className="border-0">
                <CardHeader className="pb-3"><CardTitle className="text-base">Daily Bolder Report</CardTitle></CardHeader>
                <CardContent>
                  {renderFilters('daily')}
                  {(() => {
                    const data = getFilteredBolders('daily');
                    const title = `Bolder Daily Report - ${format(new Date(filterDate), 'dd MMM yyyy')}`;
                    return (
                      <>
                        {renderExportButtons(() => exportBolderWhatsApp(data, title), () => exportBolderPDF(data, title), () => exportBolderExcel(data, title))}
                        {renderBolderTable(data)}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            )}

            {subView === 'monthly' && (
              <Card className="border-0">
                <CardHeader className="pb-3"><CardTitle className="text-base">Monthly Bolder Report</CardTitle></CardHeader>
                <CardContent>
                  {renderFilters('monthly')}
                  {(() => {
                    const data = getFilteredBolders('monthly');
                    const title = `Bolder Monthly Report - ${months[filterMonth - 1].label} ${filterYear}`;
                    return (
                      <>
                        {renderExportButtons(() => exportBolderWhatsApp(data, title), () => exportBolderPDF(data, title), () => exportBolderExcel(data, title))}
                        {renderBolderTable(data)}
                      </>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CrusherReportsSection;
