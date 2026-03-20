import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ArrowLeft, Plus, FileText, Calendar, Download, Share2, Trash2, Filter, ChevronRight, Pencil, Truck, Mountain, Package, IndianRupee, Hash, TrendingUp } from 'lucide-react';
import { exportToExcel, REPORT_NOTE_ENGLISH, REPORT_NOTE_HINDI, REPORT_FOOTER } from '@/lib/exportUtils';
import { motion } from 'framer-motion';
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
  rst_number: string;
  notes: string | null;
  created_at: string;
}

interface BolderEntry {
  id: string;
  company_name: string;
  quality: string;
  challan_number: string;
  rst_number: string;
  truck_number: string;
  date: string;
  notes: string | null;
  created_at: string;
}

type ActivePage = 'landing' | 'dispatch' | 'bolder';
type SubView = 'add' | 'daily' | 'monthly';

const fadeUp = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.33, 1, 0.68, 1] as [number, number, number, number] },
};

const CrusherReportsSection = ({ onBack }: CrusherReportsSectionProps) => {
  const { toast } = useToast();
  const [whatsappNumbers, setWhatsappNumbers] = useState<string[]>(['+916203229118']);
  const [activePage, setActivePage] = useState<ActivePage>('landing');
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
  const [dpRst, setDpRst] = useState('');
  const [dpNotes, setDpNotes] = useState('');

  // Bolder state
  const [bolders, setBolders] = useState<BolderEntry[]>([]);
  const [blCompany, setBlCompany] = useState('');
  const [blQuality, setBlQuality] = useState('');
  const [blChallan, setBlChallan] = useState('');
  const [blRst, setBlRst] = useState('');
  const [blTruck, setBlTruck] = useState('');
  const [blDate, setBlDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [blNotes, setBlNotes] = useState('');

  // Filters
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterCompany, setFilterCompany] = useState('');

  // Edit state
  const [editingDispatch, setEditingDispatch] = useState<DispatchEntry | null>(null);
  const [editingBolder, setEditingBolder] = useState<BolderEntry | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  const fetchDispatches = useCallback(async () => {
    const { data } = await supabase.from('dispatch_reports').select('*').order('date', { ascending: false }).order('created_at', { ascending: false });
    if (data) setDispatches(data as DispatchEntry[]);
  }, []);

  const fetchBolders = useCallback(async () => {
    const { data } = await supabase.from('bolder_reports').select('*').order('date', { ascending: false }).order('created_at', { ascending: false });
    if (data) setBolders(data as BolderEntry[]);
  }, []);

  useEffect(() => {
    fetchDispatches();
    fetchBolders();
    const fetchWANumbers = async () => {
      try {
        const { data } = await supabase.from('app_settings').select('setting_value').eq('setting_key', 'whatsapp_numbers').single();
        if (data?.setting_value) {
          const parsed = JSON.parse(data.setting_value);
          if (Array.isArray(parsed) && parsed.length > 0) setWhatsappNumbers(parsed);
        }
      } catch {}
    };
    fetchWANumbers();
    const ch1 = supabase.channel('dispatch_rt').on('postgres_changes', { event: '*', schema: 'public', table: 'dispatch_reports' }, () => fetchDispatches()).subscribe();
    const ch2 = supabase.channel('bolder_rt').on('postgres_changes', { event: '*', schema: 'public', table: 'bolder_reports' }, () => fetchBolders()).subscribe();
    return () => { supabase.removeChannel(ch1); supabase.removeChannel(ch2); };
  }, [fetchDispatches, fetchBolders]);

  const sendWhatsAppNotification = (type: 'dispatch' | 'bolder', entry: Record<string, string>) => {
    let msg = '';
    if (type === 'dispatch') {
      msg = `🚛 *New Dispatch Entry*\n\n📅 Date: ${entry.date}\n👤 Party: ${entry.party}\n🚚 Truck: ${entry.truck}\n📦 Product: ${entry.product}\n⚖️ Qty: ${entry.qty}\n💰 Amount: ₹${parseFloat(entry.amount).toLocaleString('en-IN')}\n${entry.challan ? `📄 Challan: ${entry.challan}\n` : ''}${entry.rst ? `🔢 RST: ${entry.rst}\n` : ''}\n_Sent from Tibrewal ERP_`;
    } else {
      msg = `🪨 *New Bolder Entry*\n\n📅 Date: ${entry.date}\n🏢 Company: ${entry.company}\n⭐ Quality: ${entry.quality}\n🚚 Truck: ${entry.truck}\n${entry.challan ? `📄 Challan: ${entry.challan}\n` : ''}${entry.rst ? `🔢 RST: ${entry.rst}\n` : ''}\n_Sent from Tibrewal ERP_`;
    }
    const encoded = encodeURIComponent(msg);
    const primaryNumber = whatsappNumbers[0]?.replace(/[^0-9]/g, '') || '916203229118';
    window.open(`https://wa.me/${primaryNumber}?text=${encoded}`, '_blank');
    sendTwilioWhatsApp(msg);
  };

  const sendTwilioWhatsApp = async (message: string) => {
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const res = await fetch(`https://${projectId}.supabase.co/functions/v1/send-whatsapp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${anonKey}` },
        body: JSON.stringify({ message }),
      });
      if (res.ok) console.log('Twilio WhatsApp sent');
      else console.log('Twilio not configured or failed');
    } catch { console.log('Twilio edge function not available'); }
  };

  const handleAddDispatch = async () => {
    if (!dpParty || !dpTruck || !dpAmount || !dpQuantity || !dpProduct) {
      toast({ title: 'Error', description: 'Party, Truck, Amount, Quantity & Product are required', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('dispatch_reports').insert({
      party_name: dpParty.trim(), date: dpDate, truck_number: dpTruck.trim(),
      amount: parseFloat(dpAmount), quantity: parseFloat(dpQuantity), product_name: dpProduct.trim(),
      challan_number: dpChallan.trim() || '', rst_number: dpRst.trim() || '', notes: dpNotes.trim() || null,
    });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Success', description: 'Dispatch entry added! Opening WhatsApp...' });
      sendWhatsAppNotification('dispatch', {
        party: dpParty.trim(), truck: dpTruck.trim(), product: dpProduct.trim(),
        qty: dpQuantity, amount: dpAmount, date: dpDate, challan: dpChallan.trim(), rst: dpRst.trim(),
      });
      setDpParty(''); setDpTruck(''); setDpAmount(''); setDpQuantity(''); setDpProduct(''); setDpChallan(''); setDpRst(''); setDpNotes('');
    }
  };

  const handleAddBolder = async () => {
    if (!blCompany || !blQuality || !blTruck) {
      toast({ title: 'Error', description: 'Company, Quality & Truck are required', variant: 'destructive' });
      return;
    }
    const { error } = await supabase.from('bolder_reports').insert({
      company_name: blCompany.trim(), quality: blQuality.trim(),
      challan_number: blChallan.trim() || '', rst_number: blRst.trim() || '',
      truck_number: blTruck.trim(), date: blDate, notes: blNotes.trim() || null,
    });
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else {
      toast({ title: 'Success', description: 'Bolder entry added! Opening WhatsApp...' });
      sendWhatsAppNotification('bolder', {
        company: blCompany.trim(), quality: blQuality.trim(), truck: blTruck.trim(),
        date: blDate, challan: blChallan.trim(), rst: blRst.trim(),
      });
      setBlCompany(''); setBlQuality(''); setBlChallan(''); setBlRst(''); setBlTruck(''); setBlNotes('');
    }
  };

  const handleEditDispatch = async () => {
    if (!editingDispatch) return;
    const { error } = await supabase.from('dispatch_reports').update({
      party_name: editForm.party_name, date: editForm.date, truck_number: editForm.truck_number,
      amount: parseFloat(editForm.amount), quantity: parseFloat(editForm.quantity),
      product_name: editForm.product_name, challan_number: editForm.challan_number || '',
      rst_number: editForm.rst_number || '', notes: editForm.notes || null,
    }).eq('id', editingDispatch.id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Updated', description: 'Dispatch entry updated' }); setEditingDispatch(null); }
  };

  const handleEditBolder = async () => {
    if (!editingBolder) return;
    const { error } = await supabase.from('bolder_reports').update({
      company_name: editForm.company_name, quality: editForm.quality, date: editForm.date,
      truck_number: editForm.truck_number, challan_number: editForm.challan_number || '',
      rst_number: editForm.rst_number || '', notes: editForm.notes || null,
    }).eq('id', editingBolder.id);
    if (error) toast({ title: 'Error', description: error.message, variant: 'destructive' });
    else { toast({ title: 'Updated', description: 'Bolder entry updated' }); setEditingBolder(null); }
  };

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

  const getFilteredDispatches = (mode: 'daily' | 'monthly') => {
    let filtered = dispatches;
    if (mode === 'daily') { filtered = filtered.filter(d => d.date === filterDate); }
    else {
      const start = startOfMonth(new Date(filterYear, filterMonth - 1));
      const end = endOfMonth(new Date(filterYear, filterMonth - 1));
      filtered = filtered.filter(d => { const dt = new Date(d.date); return dt >= start && dt <= end; });
    }
    if (filterCompany) filtered = filtered.filter(d => d.party_name.toLowerCase().includes(filterCompany.toLowerCase()));
    return filtered;
  };

  const getFilteredBolders = (mode: 'daily' | 'monthly') => {
    let filtered = bolders;
    if (mode === 'daily') { filtered = filtered.filter(b => b.date === filterDate); }
    else {
      const start = startOfMonth(new Date(filterYear, filterMonth - 1));
      const end = endOfMonth(new Date(filterYear, filterMonth - 1));
      filtered = filtered.filter(b => { const dt = new Date(b.date); return dt >= start && dt <= end; });
    }
    if (filterCompany) filtered = filtered.filter(b => b.company_name.toLowerCase().includes(filterCompany.toLowerCase()));
    return filtered;
  };

  const exportDispatchWhatsApp = (data: DispatchEntry[], title: string) => {
    const totalQty = data.reduce((s, d) => s + d.quantity, 0);
    const totalAmt = data.reduce((s, d) => s + d.amount, 0);
    let msg = `📊 *${title}*\n${REPORT_FOOTER}\n\n*Summary:*\nTotal Entries: ${data.length}\nTotal Quantity: ${totalQty}\nTotal Amount: ₹${totalAmt.toLocaleString('en-IN')}\n\n*Details:*\n`;
    data.forEach((d, i) => {
      msg += `${i + 1}. ${format(new Date(d.date), 'dd/MM/yyyy')} | ${d.party_name} | ${d.product_name} | Qty: ${d.quantity} | ₹${d.amount.toLocaleString('en-IN')} | Truck: ${d.truck_number}`;
      if (d.challan_number) msg += ` | Ch: ${d.challan_number}`;
      if (d.rst_number) msg += ` | RST: ${d.rst_number}`;
      msg += '\n';
    });
    msg += `\n${REPORT_NOTE_ENGLISH}\n${REPORT_NOTE_HINDI}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const exportBolderWhatsApp = (data: BolderEntry[], title: string) => {
    let msg = `📊 *${title}*\n${REPORT_FOOTER}\n\n*Summary:*\nTotal Entries: ${data.length}\n\n*Details:*\n`;
    data.forEach((b, i) => {
      msg += `${i + 1}. ${format(new Date(b.date), 'dd/MM/yyyy')} | ${b.company_name} | Quality: ${b.quality} | Truck: ${b.truck_number}`;
      if (b.challan_number) msg += ` | Ch: ${b.challan_number}`;
      if (b.rst_number) msg += ` | RST: ${b.rst_number}`;
      msg += '\n';
    });
    msg += `\n${REPORT_NOTE_ENGLISH}\n${REPORT_NOTE_HINDI}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const exportDispatchPDF = (data: DispatchEntry[], title: string) => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text(title, 14, 20);
    doc.setFontSize(10); doc.text(REPORT_FOOTER, 14, 28);
    const totalQty = data.reduce((s, d) => s + d.quantity, 0);
    const totalAmt = data.reduce((s, d) => s + d.amount, 0);
    doc.text(`Total Entries: ${data.length} | Total Qty: ${totalQty} | Total Amount: Rs ${totalAmt.toLocaleString('en-IN')}`, 14, 36);
    autoTable(doc, {
      head: [['Date', 'Party', 'Product', 'Truck', 'Challan', 'RST', 'Qty', 'Amount']],
      body: data.map(d => [format(new Date(d.date), 'dd/MM/yyyy'), d.party_name, d.product_name, d.truck_number, d.challan_number || '-', d.rst_number || '-', d.quantity, `Rs ${d.amount.toLocaleString('en-IN')}`]),
      startY: 42, styles: { fontSize: 8 },
    });
    const fy = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8); doc.text(REPORT_NOTE_ENGLISH, 14, fy); doc.text(REPORT_NOTE_HINDI, 14, fy + 5);
    doc.save(`${title.replace(/\s/g, '_')}.pdf`);
  };

  const exportBolderPDF = (data: BolderEntry[], title: string) => {
    const doc = new jsPDF();
    doc.setFontSize(16); doc.text(title, 14, 20);
    doc.setFontSize(10); doc.text(REPORT_FOOTER, 14, 28);
    doc.text(`Total Entries: ${data.length}`, 14, 36);
    autoTable(doc, {
      head: [['Date', 'Company', 'Quality', 'Truck', 'Challan', 'RST']],
      body: data.map(b => [format(new Date(b.date), 'dd/MM/yyyy'), b.company_name, b.quality, b.truck_number, b.challan_number || '-', b.rst_number || '-']),
      startY: 42, styles: { fontSize: 8 },
    });
    const fy = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(8); doc.text(REPORT_NOTE_ENGLISH, 14, fy); doc.text(REPORT_NOTE_HINDI, 14, fy + 5);
    doc.save(`${title.replace(/\s/g, '_')}.pdf`);
  };

  const exportDispatchExcel = (data: DispatchEntry[], title: string) => {
    exportToExcel(
      data.map(d => [format(new Date(d.date), 'dd/MM/yyyy'), d.party_name, d.product_name, d.truck_number, d.challan_number || '-', d.rst_number || '-', d.quantity, d.amount]),
      ['Date', 'Party', 'Product', 'Truck', 'Challan', 'RST', 'Quantity', 'Amount'],
      title.replace(/\s/g, '_'), 'Dispatch', title
    );
  };

  const exportBolderExcel = (data: BolderEntry[], title: string) => {
    exportToExcel(
      data.map(b => [format(new Date(b.date), 'dd/MM/yyyy'), b.company_name, b.quality, b.truck_number, b.challan_number || '-', b.rst_number || '-']),
      ['Date', 'Company', 'Quality', 'Truck', 'Challan', 'RST'],
      title.replace(/\s/g, '_'), 'Bolder', title
    );
  };

  const months = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: format(new Date(2024, i), 'MMMM') }));
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  // --- STAT CARD ---
  const StatCard = ({ icon: Icon, label, value, accent }: { icon: typeof Truck; label: string; value: string; accent: string }) => (
    <motion.div {...fadeUp}>
      <Card className="border border-border/50 shadow-md overflow-hidden">
        <CardContent className="p-4 flex items-center gap-4">
          <div className={`h-11 w-11 rounded-xl flex items-center justify-center flex-shrink-0 ${accent}`}>
            <Icon className="h-5 w-5 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
            <p className="text-xl font-bold text-foreground tracking-tight tabular-nums">{value}</p>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  // --- FILTERS ---
  const renderFilters = (mode: 'daily' | 'monthly') => (
    <motion.div {...fadeUp} className="flex flex-wrap gap-3 mb-5 p-4 rounded-xl bg-muted/30 border border-border/40">
      {mode === 'daily' ? (
        <div className="flex-1 min-w-[140px]">
          <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Date</Label>
          <Input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="h-10" />
        </div>
      ) : (
        <>
          <div className="min-w-[130px]">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Month</Label>
            <Select value={String(filterMonth)} onValueChange={v => setFilterMonth(Number(v))}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>{months.map(m => <SelectItem key={m.value} value={String(m.value)}>{m.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="min-w-[100px]">
            <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Year</Label>
            <Select value={String(filterYear)} onValueChange={v => setFilterYear(Number(v))}>
              <SelectTrigger className="h-10"><SelectValue /></SelectTrigger>
              <SelectContent>{years.map(y => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </>
      )}
      <div className="flex-1 min-w-[140px]">
        <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">
          <Filter className="h-3 w-3 inline mr-1" />Company
        </Label>
        <Input placeholder="Filter by name..." value={filterCompany} onChange={e => setFilterCompany(e.target.value)} className="h-10" />
      </div>
    </motion.div>
  );

  // --- EXPORT BUTTONS ---
  const renderExportButtons = (onWhatsApp: () => void, onPDF: () => void, onExcel: () => void) => (
    <div className="flex gap-2 flex-wrap mb-5">
      <Button size="sm" variant="outline" onClick={onWhatsApp} className="gap-1.5 h-9 rounded-lg shadow-xs hover:shadow-sm transition-shadow">
        <Share2 className="h-3.5 w-3.5" />WhatsApp
      </Button>
      <Button size="sm" variant="outline" onClick={onPDF} className="gap-1.5 h-9 rounded-lg shadow-xs hover:shadow-sm transition-shadow">
        <Download className="h-3.5 w-3.5" />PDF
      </Button>
      <Button size="sm" variant="outline" onClick={onExcel} className="gap-1.5 h-9 rounded-lg shadow-xs hover:shadow-sm transition-shadow">
        <FileText className="h-3.5 w-3.5" />Excel
      </Button>
    </div>
  );

  // --- DISPATCH TABLE ---
  const renderDispatchTable = (data: DispatchEntry[], showActions = false) => {
    const totalQty = data.reduce((s, d) => s + d.quantity, 0);
    const totalAmt = data.reduce((s, d) => s + d.amount, 0);
    return (
      <motion.div {...fadeUp}>
        {/* Summary strip */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          <StatCard icon={Hash} label="Entries" value={String(data.length)} accent="bg-primary" />
          <StatCard icon={Package} label="Total Qty" value={totalQty.toLocaleString('en-IN')} accent="bg-chart-1" />
          <StatCard icon={IndianRupee} label="Total Amt" value={`₹${totalAmt.toLocaleString('en-IN')}`} accent="bg-accent" />
        </div>

        {/* Table */}
        <div className="rounded-xl border border-border/50 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="premium-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Party</th>
                  <th>Product</th>
                  <th>Truck</th>
                  <th>Challan</th>
                  <th>RST</th>
                  <th className="text-right">Qty</th>
                  <th className="text-right">Amount</th>
                  {showActions && <th className="w-20"></th>}
                </tr>
              </thead>
              <tbody>
                {data.length === 0 ? (
                  <tr>
                    <td colSpan={showActions ? 9 : 8} className="text-center text-muted-foreground py-12">
                      <div className="flex flex-col items-center gap-2">
                        <Truck className="h-8 w-8 text-muted-foreground/30" />
                        <p className="text-sm">No dispatch entries found</p>
                      </div>
                    </td>
                  </tr>
                ) : data.map(d => (
                  <tr key={d.id} className="group">
                    <td className="text-xs whitespace-nowrap">{format(new Date(d.date), 'dd MMM yy')}</td>
                    <td className="text-sm font-medium text-foreground">{d.party_name}</td>
                    <td><Badge variant="secondary" className="text-[10px] font-semibold">{d.product_name}</Badge></td>
                    <td className="text-xs font-mono">{d.truck_number}</td>
                    <td className="text-xs text-muted-foreground">{d.challan_number || '—'}</td>
                    <td className="text-xs text-muted-foreground">{d.rst_number || '—'}</td>
                    <td className="text-sm text-right tabular-nums font-medium">{d.quantity}</td>
                    <td className="text-sm text-right tabular-nums font-bold text-foreground">₹{d.amount.toLocaleString('en-IN')}</td>
                    {showActions && (
                      <td>
                        <div className="flex gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingDispatch(d); setEditForm({ ...d, amount: String(d.amount), quantity: String(d.quantity) }); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteDispatch(d.id)}>
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    );
  };

  // --- BOLDER TABLE ---
  const renderBolderTable = (data: BolderEntry[], showActions = false) => (
    <motion.div {...fadeUp}>
      <div className="grid grid-cols-1 gap-3 mb-5">
        <StatCard icon={Mountain} label="Total Entries" value={String(data.length)} accent="bg-emerald-600" />
      </div>

      <div className="rounded-xl border border-border/50 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="premium-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Company</th>
                <th>Quality</th>
                <th>Truck</th>
                <th>Challan</th>
                <th>RST</th>
                {showActions && <th className="w-20"></th>}
              </tr>
            </thead>
            <tbody>
              {data.length === 0 ? (
                <tr>
                  <td colSpan={showActions ? 7 : 6} className="text-center text-muted-foreground py-12">
                    <div className="flex flex-col items-center gap-2">
                      <Mountain className="h-8 w-8 text-muted-foreground/30" />
                      <p className="text-sm">No bolder entries found</p>
                    </div>
                  </td>
                </tr>
              ) : data.map(b => (
                <tr key={b.id} className="group">
                  <td className="text-xs whitespace-nowrap">{format(new Date(b.date), 'dd MMM yy')}</td>
                  <td className="text-sm font-medium text-foreground">{b.company_name}</td>
                  <td><Badge variant="outline" className="text-[10px] font-semibold">{b.quality}</Badge></td>
                  <td className="text-xs font-mono">{b.truck_number}</td>
                  <td className="text-xs text-muted-foreground">{b.challan_number || '—'}</td>
                  <td className="text-xs text-muted-foreground">{b.rst_number || '—'}</td>
                  {showActions && (
                    <td>
                      <div className="flex gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingBolder(b); setEditForm({ ...b }); }}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteBolder(b.id)}>
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );

  // --- SUB-VIEW TABS ---
  const TabButton = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Plus; label: string }) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
        active
          ? 'bg-primary text-primary-foreground shadow-md'
          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );

  // ===== LANDING PAGE =====
  if (activePage === 'landing') {
    const totalDispatches = dispatches.length;
    const totalBolders = bolders.length;
    const totalDispatchAmt = dispatches.reduce((s, d) => s + d.amount, 0);
    const totalDispatchQty = dispatches.reduce((s, d) => s + d.quantity, 0);

    return (
      <div className="max-w-5xl mx-auto pb-24 lg:pb-8">
        {/* Hero Header */}
        <motion.div {...fadeUp} className="relative overflow-hidden rounded-2xl bg-primary p-6 lg:p-10 mb-6">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" style={{ background: 'radial-gradient(circle, hsla(28,88%,52%,0.15) 0%, transparent 70%)' }} />
          </div>
          <div className="relative z-10 flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary-foreground/10 flex items-center justify-center border border-primary-foreground/10">
              <FileText className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-primary-foreground tracking-tight">Crusher Reports</h1>
              <p className="text-sm text-primary-foreground/60 mt-0.5">Dispatch & Bolder tracking system</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Truck} label="Dispatches" value={String(totalDispatches)} accent="bg-primary" />
          <StatCard icon={Mountain} label="Bolders" value={String(totalBolders)} accent="bg-emerald-600" />
          <StatCard icon={IndianRupee} label="Total Amount" value={`₹${totalDispatchAmt.toLocaleString('en-IN')}`} accent="bg-accent" />
          <StatCard icon={Package} label="Total Qty" value={totalDispatchQty.toLocaleString('en-IN')} accent="bg-chart-1" />
        </div>

        {/* Action Cards */}
        <div className="space-y-3">
          <motion.div {...fadeUp}>
            <Card
              className="cursor-pointer transition-all duration-200 hover:shadow-lg active:scale-[0.98] border border-border/50 overflow-hidden group"
              onClick={() => { setActivePage('dispatch'); setSubView('add'); }}
            >
              <CardContent className="p-0">
                <div className="flex items-center">
                  <div className="w-1.5 self-stretch bg-primary rounded-l-xl" />
                  <div className="flex items-center gap-4 p-5 flex-1">
                    <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                      <Truck className="h-7 w-7 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-foreground">Dispatch Report</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">Add, view & export dispatch entries</p>
                      <div className="flex gap-2 mt-2.5">
                        <Badge variant="secondary" className="text-[10px] font-bold px-2">{totalDispatches} entries</Badge>
                        <Badge variant="outline" className="text-[10px] font-bold px-2 tabular-nums">₹{totalDispatchAmt.toLocaleString('en-IN')}</Badge>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.1 }}>
            <Card
              className="cursor-pointer transition-all duration-200 hover:shadow-lg active:scale-[0.98] border border-border/50 overflow-hidden group"
              onClick={() => { setActivePage('bolder'); setSubView('add'); }}
            >
              <CardContent className="p-0">
                <div className="flex items-center">
                  <div className="w-1.5 self-stretch bg-emerald-500 rounded-l-xl" />
                  <div className="flex items-center gap-4 p-5 flex-1">
                    <div className="h-14 w-14 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-500/20 transition-colors">
                      <Mountain className="h-7 w-7 text-emerald-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-bold text-foreground">Bolder Report</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">Add, view & export bolder entries</p>
                      <div className="flex gap-2 mt-2.5">
                        <Badge variant="secondary" className="text-[10px] font-bold px-2">{totalBolders} entries</Badge>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground/40 group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    );
  }

  // ===== DISPATCH PAGE =====
  if (activePage === 'dispatch') {
    return (
      <div className="max-w-5xl mx-auto pb-24 lg:pb-8">
        <motion.div {...fadeUp} className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => setActivePage('landing')} className="hover:bg-muted rounded-xl h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">Dispatch Report</h1>
            <p className="text-xs text-muted-foreground">Manage dispatch entries</p>
          </div>
        </motion.div>

        <div className="flex gap-2 mb-5">
          <TabButton active={subView === 'add'} onClick={() => setSubView('add')} icon={Plus} label="Add" />
          <TabButton active={subView === 'daily'} onClick={() => setSubView('daily')} icon={Calendar} label="Daily" />
          <TabButton active={subView === 'monthly'} onClick={() => setSubView('monthly')} icon={TrendingUp} label="Monthly" />
        </div>

        {subView === 'add' && (
          <>
            <motion.div {...fadeUp}>
              <Card className="border border-border/50 shadow-md mb-6">
                <CardHeader className="pb-4 border-b border-border/40">
                  <CardTitle className="text-base font-bold flex items-center gap-2">
                    <Plus className="h-4 w-4 text-primary" />
                    Add Dispatch Entry
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Party Name *</Label>
                      <Input value={dpParty} onChange={e => setDpParty(e.target.value)} placeholder="Enter party name" className="h-10" />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Date *</Label>
                      <Input type="date" value={dpDate} onChange={e => setDpDate(e.target.value)} className="h-10" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Truck Number *</Label>
                      <Input value={dpTruck} onChange={e => setDpTruck(e.target.value)} placeholder="JH05AB1234" className="h-10 font-mono" />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Product Name *</Label>
                      <Input value={dpProduct} onChange={e => setDpProduct(e.target.value)} placeholder="Product" className="h-10" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Quantity *</Label>
                      <Input type="number" value={dpQuantity} onChange={e => setDpQuantity(e.target.value)} placeholder="0" className="h-10 tabular-nums" />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Amount *</Label>
                      <Input type="number" value={dpAmount} onChange={e => setDpAmount(e.target.value)} placeholder="₹0" className="h-10 tabular-nums" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Challan Number</Label>
                      <Input value={dpChallan} onChange={e => setDpChallan(e.target.value)} placeholder="Optional" className="h-10" />
                    </div>
                    <div>
                      <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">RST Number</Label>
                      <Input value={dpRst} onChange={e => setDpRst(e.target.value)} placeholder="Optional" className="h-10" />
                    </div>
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Notes</Label>
                    <Input value={dpNotes} onChange={e => setDpNotes(e.target.value)} placeholder="Optional notes..." className="h-10" />
                  </div>
                  <Button className="w-full h-11 text-sm font-bold shadow-md" onClick={handleAddDispatch}>
                    <Plus className="h-4 w-4 mr-1.5" />Add Dispatch Entry
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
            <div>
              <p className="text-[11px] font-bold text-muted-foreground mb-3 uppercase tracking-wider">Recent Dispatches</p>
              {renderDispatchTable(dispatches.slice(0, 20), true)}
            </div>
          </>
        )}

        {subView === 'daily' && (
          <Card className="border border-border/50 shadow-md">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-base font-bold">Daily Dispatch Report</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              {renderFilters('daily')}
              {(() => {
                const data = getFilteredDispatches('daily');
                const title = `Dispatch Daily Report - ${format(new Date(filterDate), 'dd MMM yyyy')}`;
                return (<>{renderExportButtons(() => exportDispatchWhatsApp(data, title), () => exportDispatchPDF(data, title), () => exportDispatchExcel(data, title))}{renderDispatchTable(data, true)}</>);
              })()}
            </CardContent>
          </Card>
        )}

        {subView === 'monthly' && (
          <Card className="border border-border/50 shadow-md">
            <CardHeader className="pb-4 border-b border-border/40">
              <CardTitle className="text-base font-bold">Monthly Dispatch Report</CardTitle>
            </CardHeader>
            <CardContent className="pt-5">
              {renderFilters('monthly')}
              {(() => {
                const data = getFilteredDispatches('monthly');
                const title = `Dispatch Monthly Report - ${months[filterMonth - 1].label} ${filterYear}`;
                return (<>{renderExportButtons(() => exportDispatchWhatsApp(data, title), () => exportDispatchPDF(data, title), () => exportDispatchExcel(data, title))}{renderDispatchTable(data, true)}</>);
              })()}
            </CardContent>
          </Card>
        )}

        {/* Edit Dispatch Dialog */}
        <Dialog open={!!editingDispatch} onOpenChange={open => { if (!open) setEditingDispatch(null); }}>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle className="text-lg font-bold">Edit Dispatch Entry</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Party Name</Label><Input value={editForm.party_name || ''} onChange={e => setEditForm({ ...editForm, party_name: e.target.value })} className="h-10" /></div>
                <div><Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Date</Label><Input type="date" value={editForm.date || ''} onChange={e => setEditForm({ ...editForm, date: e.target.value })} className="h-10" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Truck Number</Label><Input value={editForm.truck_number || ''} onChange={e => setEditForm({ ...editForm, truck_number: e.target.value })} className="h-10 font-mono" /></div>
                <div><Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Product</Label><Input value={editForm.product_name || ''} onChange={e => setEditForm({ ...editForm, product_name: e.target.value })} className="h-10" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Quantity</Label><Input type="number" value={editForm.quantity || ''} onChange={e => setEditForm({ ...editForm, quantity: e.target.value })} className="h-10 tabular-nums" /></div>
                <div><Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Amount</Label><Input type="number" value={editForm.amount || ''} onChange={e => setEditForm({ ...editForm, amount: e.target.value })} className="h-10 tabular-nums" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Challan</Label><Input value={editForm.challan_number || ''} onChange={e => setEditForm({ ...editForm, challan_number: e.target.value })} className="h-10" /></div>
                <div><Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">RST</Label><Input value={editForm.rst_number || ''} onChange={e => setEditForm({ ...editForm, rst_number: e.target.value })} className="h-10" /></div>
              </div>
              <div><Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Notes</Label><Input value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} className="h-10" /></div>
              <Button className="w-full h-11 font-bold shadow-md" onClick={handleEditDispatch}>Save Changes</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ===== BOLDER PAGE =====
  return (
    <div className="max-w-5xl mx-auto pb-24 lg:pb-8">
      <motion.div {...fadeUp} className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={() => setActivePage('landing')} className="hover:bg-muted rounded-xl h-10 w-10">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight">Bolder Report</h1>
          <p className="text-xs text-muted-foreground">Manage bolder entries</p>
        </div>
      </motion.div>

      <div className="flex gap-2 mb-5">
        <TabButton active={subView === 'add'} onClick={() => setSubView('add')} icon={Plus} label="Add" />
        <TabButton active={subView === 'daily'} onClick={() => setSubView('daily')} icon={Calendar} label="Daily" />
        <TabButton active={subView === 'monthly'} onClick={() => setSubView('monthly')} icon={TrendingUp} label="Monthly" />
      </div>

      {subView === 'add' && (
        <>
          <motion.div {...fadeUp}>
            <Card className="border border-border/50 shadow-md mb-6">
              <CardHeader className="pb-4 border-b border-border/40">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Plus className="h-4 w-4 text-emerald-500" />
                  Add Bolder Entry
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-5">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Company Name *</Label>
                    <Input value={blCompany} onChange={e => setBlCompany(e.target.value)} placeholder="Source company" className="h-10" />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Date *</Label>
                    <Input type="date" value={blDate} onChange={e => setBlDate(e.target.value)} className="h-10" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Quality *</Label>
                    <Input value={blQuality} onChange={e => setBlQuality(e.target.value)} placeholder="Quality type" className="h-10" />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Truck Number *</Label>
                    <Input value={blTruck} onChange={e => setBlTruck(e.target.value)} placeholder="JH05AB1234" className="h-10 font-mono" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Challan Number</Label>
                    <Input value={blChallan} onChange={e => setBlChallan(e.target.value)} placeholder="Optional" className="h-10" />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">RST Number</Label>
                    <Input value={blRst} onChange={e => setBlRst(e.target.value)} placeholder="Optional" className="h-10" />
                  </div>
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Notes</Label>
                  <Input value={blNotes} onChange={e => setBlNotes(e.target.value)} placeholder="Optional notes..." className="h-10" />
                </div>
                <Button className="w-full h-11 text-sm font-bold shadow-md bg-emerald-600 hover:bg-emerald-700" onClick={handleAddBolder}>
                  <Plus className="h-4 w-4 mr-1.5" />Add Bolder Entry
                </Button>
              </CardContent>
            </Card>
          </motion.div>
          <div>
            <p className="text-[11px] font-bold text-muted-foreground mb-3 uppercase tracking-wider">Recent Bolder Entries</p>
            {renderBolderTable(bolders.slice(0, 20), true)}
          </div>
        </>
      )}

      {subView === 'daily' && (
        <Card className="border border-border/50 shadow-md">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="text-base font-bold">Daily Bolder Report</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            {renderFilters('daily')}
            {(() => {
              const data = getFilteredBolders('daily');
              const title = `Bolder Daily Report - ${format(new Date(filterDate), 'dd MMM yyyy')}`;
              return (<>{renderExportButtons(() => exportBolderWhatsApp(data, title), () => exportBolderPDF(data, title), () => exportBolderExcel(data, title))}{renderBolderTable(data, true)}</>);
            })()}
          </CardContent>
        </Card>
      )}

      {subView === 'monthly' && (
        <Card className="border border-border/50 shadow-md">
          <CardHeader className="pb-4 border-b border-border/40">
            <CardTitle className="text-base font-bold">Monthly Bolder Report</CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            {renderFilters('monthly')}
            {(() => {
              const data = getFilteredBolders('monthly');
              const title = `Bolder Monthly Report - ${months[filterMonth - 1].label} ${filterYear}`;
              return (<>{renderExportButtons(() => exportBolderWhatsApp(data, title), () => exportBolderPDF(data, title), () => exportBolderExcel(data, title))}{renderBolderTable(data, true)}</>);
            })()}
          </CardContent>
        </Card>
      )}

      {/* Edit Bolder Dialog */}
      <Dialog open={!!editingBolder} onOpenChange={open => { if (!open) setEditingBolder(null); }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="text-lg font-bold">Edit Bolder Entry</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Company Name</Label><Input value={editForm.company_name || ''} onChange={e => setEditForm({ ...editForm, company_name: e.target.value })} className="h-10" /></div>
              <div><Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Date</Label><Input type="date" value={editForm.date || ''} onChange={e => setEditForm({ ...editForm, date: e.target.value })} className="h-10" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Quality</Label><Input value={editForm.quality || ''} onChange={e => setEditForm({ ...editForm, quality: e.target.value })} className="h-10" /></div>
              <div><Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Truck Number</Label><Input value={editForm.truck_number || ''} onChange={e => setEditForm({ ...editForm, truck_number: e.target.value })} className="h-10 font-mono" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Challan</Label><Input value={editForm.challan_number || ''} onChange={e => setEditForm({ ...editForm, challan_number: e.target.value })} className="h-10" /></div>
              <div><Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">RST</Label><Input value={editForm.rst_number || ''} onChange={e => setEditForm({ ...editForm, rst_number: e.target.value })} className="h-10" /></div>
            </div>
            <div><Label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1 block">Notes</Label><Input value={editForm.notes || ''} onChange={e => setEditForm({ ...editForm, notes: e.target.value })} className="h-10" /></div>
            <Button className="w-full h-11 font-bold shadow-md" onClick={handleEditBolder}>Save Changes</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CrusherReportsSection;
