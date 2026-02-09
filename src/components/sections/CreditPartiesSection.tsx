import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Download, Share2, User, Phone, MapPin, Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addReportNotes, REPORT_FOOTER, exportToExcel } from '@/lib/exportUtils';
import { formatFullCurrency, formatCurrencyForPDF } from '@/lib/formatUtils';

interface CreditParty {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  notes: string | null;
  is_active: boolean;
}

interface Transaction {
  id: string;
  party_id: string;
  transaction_type: string;
  amount: number;
  litres: number | null;
  tyre_name: string | null;
  date: string;
  notes: string | null;
}

interface CreditPartiesSectionProps {
  onBack: () => void;
}

const CreditPartiesSection = ({ onBack }: CreditPartiesSectionProps) => {
  const [parties, setParties] = useState<CreditParty[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('parties');
  const [selectedParty, setSelectedParty] = useState<CreditParty | null>(null);
  const [showAddParty, setShowAddParty] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // New party form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPartyNotes, setNewPartyNotes] = useState('');

  // New transaction form
  const [txType, setTxType] = useState<'petroleum' | 'tyre'>('petroleum');
  const [txAmount, setTxAmount] = useState('');
  const [txLitres, setTxLitres] = useState('');
  const [txTyreName, setTxTyreName] = useState('');
  const [txDate, setTxDate] = useState(new Date());
  const [txNotes, setTxNotes] = useState('');
  const [txCalendarOpen, setTxCalendarOpen] = useState(false);
  const [txPartyId, setTxPartyId] = useState('');

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => { fetchParties(); }, []);
  useEffect(() => { if (selectedParty) fetchTransactions(selectedParty.id); }, [selectedParty, selectedMonth, selectedYear]);

  const fetchParties = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('credit_parties').select('*').eq('is_active', true).order('name');
    if (data) setParties(data as CreditParty[]);
    setIsLoading(false);
  };

  const fetchTransactions = async (partyId: string) => {
    const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
    const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-31`;
    const { data } = await supabase
      .from('credit_party_transactions')
      .select('*')
      .eq('party_id', partyId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });
    if (data) setTransactions(data as Transaction[]);
  };

  const addParty = async () => {
    if (!newName) { toast.error('Name is required'); return; }
    const { error } = await supabase.from('credit_parties').insert({ name: newName, phone: newPhone || null, address: newAddress || null, notes: newPartyNotes || null });
    if (error) { toast.error('Failed to add party'); return; }
    toast.success('Party added');
    setShowAddParty(false);
    setNewName(''); setNewPhone(''); setNewAddress(''); setNewPartyNotes('');
    fetchParties();
  };

  const deleteParty = async (id: string) => {
    const { error } = await supabase.from('credit_parties').delete().eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Party deleted');
    setShowDeleteConfirm(null);
    if (selectedParty?.id === id) setSelectedParty(null);
    fetchParties();
  };

  const addTransaction = async () => {
    if (!txAmount || !txPartyId) { toast.error('Party and amount required'); return; }
    const { error } = await supabase.from('credit_party_transactions').insert({
      party_id: txPartyId,
      transaction_type: txType,
      amount: parseFloat(txAmount),
      litres: txType === 'petroleum' && txLitres ? parseFloat(txLitres) : null,
      tyre_name: txType === 'tyre' && txTyreName ? txTyreName : null,
      date: format(txDate, 'yyyy-MM-dd'),
      notes: txNotes || null,
    });
    if (error) { toast.error('Failed to add transaction'); return; }
    toast.success('Transaction added');
    setShowAddTransaction(false);
    setTxAmount(''); setTxLitres(''); setTxTyreName(''); setTxNotes(''); setTxDate(new Date());
    if (selectedParty) fetchTransactions(selectedParty.id);
  };

  const filteredParties = parties.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const petroTotal = transactions.filter(t => t.transaction_type === 'petroleum').reduce((s, t) => s + Number(t.amount), 0);
  const tyreTotal = transactions.filter(t => t.transaction_type === 'tyre').reduce((s, t) => s + Number(t.amount), 0);
  const grandTotal = petroTotal + tyreTotal;

  const exportPartyPDF = () => {
    if (!selectedParty) return;
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Credit Party: ${selectedParty.name}`, 14, 15);
    doc.setFontSize(10);
    doc.text(`${months[selectedMonth - 1]} ${selectedYear}`, 14, 22);
    doc.text(`Petroleum: ${formatCurrencyForPDF(petroTotal)} | Tyre: ${formatCurrencyForPDF(tyreTotal)} | Total: ${formatCurrencyForPDF(grandTotal)}`, 14, 30);

    autoTable(doc, {
      head: [['Date', 'Type', 'Amount', 'Litres', 'Tyre', 'Notes']],
      body: transactions.map(t => [
        format(new Date(t.date), 'dd/MM/yyyy'),
        t.transaction_type === 'petroleum' ? 'Petroleum' : 'Tyre',
        formatCurrencyForPDF(Number(t.amount)),
        t.litres ? String(t.litres) : '-',
        t.tyre_name || '-',
        t.notes || '-',
      ]),
      startY: 36,
    });
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    addReportNotes(doc, finalY);
    doc.save(`credit-${selectedParty.name}-${selectedMonth}-${selectedYear}.pdf`);
    toast.success('PDF downloaded');
  };

  const sharePartyWhatsApp = () => {
    if (!selectedParty) return;
    let msg = `💳 *Credit Party: ${selectedParty.name}*\n${months[selectedMonth - 1]} ${selectedYear}\n\n`;
    msg += `⛽ Petroleum: ${formatFullCurrency(petroTotal)}\n🛞 Tyre: ${formatFullCurrency(tyreTotal)}\n📊 Total: ${formatFullCurrency(grandTotal)}\n\n`;
    transactions.forEach(t => {
      msg += `${format(new Date(t.date), 'dd MMM')}: ${t.transaction_type === 'petroleum' ? '⛽' : '🛞'} ${formatFullCurrency(Number(t.amount))}${t.litres ? ` (${t.litres}L)` : ''}${t.tyre_name ? ` - ${t.tyre_name}` : ''}\n`;
    });
    msg += `\n_${REPORT_FOOTER}_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const exportPartyExcel = () => {
    if (!selectedParty) return;
    const data = transactions.map(t => [
      format(new Date(t.date), 'dd/MM/yyyy'),
      t.transaction_type === 'petroleum' ? 'Petroleum' : 'Tyre',
      Number(t.amount),
      t.litres || '-',
      t.tyre_name || '-',
      t.notes || '-',
    ]);
    exportToExcel(data, ['Date', 'Type', 'Amount', 'Litres', 'Tyre', 'Notes'], `credit-${selectedParty.name}-${selectedMonth}-${selectedYear}`, 'Transactions', `Credit: ${selectedParty.name} - ${months[selectedMonth - 1]} ${selectedYear}`);
    toast.success('Excel downloaded');
  };

  // Party Profile View
  if (selectedParty) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedParty(null)}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{selectedParty.name}</h1>
            {selectedParty.phone && <p className="text-xs text-muted-foreground">{selectedParty.phone}</p>}
          </div>
        </div>

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

        {/* Summary */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Card style={{ background: '#1e3a8a' }}><CardContent className="p-3 text-center"><p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Petroleum</p><p className="text-sm font-bold" style={{ color: 'white' }}>{formatFullCurrency(petroTotal)}</p></CardContent></Card>
          <Card style={{ background: '#1e3a8a' }}><CardContent className="p-3 text-center"><p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Tyre</p><p className="text-sm font-bold" style={{ color: 'white' }}>{formatFullCurrency(tyreTotal)}</p></CardContent></Card>
          <Card style={{ background: '#0f172a' }}><CardContent className="p-3 text-center"><p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>Total</p><p className="text-sm font-bold" style={{ color: 'white' }}>{formatFullCurrency(grandTotal)}</p></CardContent></Card>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Button size="sm" onClick={() => { setTxPartyId(selectedParty.id); setShowAddTransaction(true); }}><Plus className="h-4 w-4 mr-1" />Add</Button>
          <Button variant="outline" size="sm" onClick={exportPartyPDF}><Download className="h-4 w-4 mr-1" />PDF</Button>
          <Button variant="secondary" size="sm" onClick={sharePartyWhatsApp}><Share2 className="h-4 w-4 mr-1" />Share</Button>
        </div>
        <Button variant="outline" size="sm" className="w-full mb-4" onClick={exportPartyExcel}><Download className="h-4 w-4 mr-2" />Excel</Button>

        {/* Transactions */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {transactions.map(tx => (
            <Card key={tx.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${tx.transaction_type === 'petroleum' ? 'bg-primary/20 text-primary' : 'bg-accent/30 text-accent-foreground'}`}>
                        {tx.transaction_type === 'petroleum' ? '⛽ Petroleum' : '🛞 Tyre'}
                      </span>
                      <span className="font-bold text-foreground">{formatFullCurrency(Number(tx.amount))}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {format(new Date(tx.date), 'dd MMM yyyy')}
                      {tx.litres && ` • ${tx.litres}L`}
                      {tx.tyre_name && ` • ${tx.tyre_name}`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {transactions.length === 0 && <p className="text-center text-muted-foreground py-8">No transactions this month</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-bold text-foreground">Credit Parties</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 mb-4">
          <TabsTrigger value="parties">Parties</TabsTrigger>
          <TabsTrigger value="petroleum">Petroleum</TabsTrigger>
          <TabsTrigger value="tyre">Tyre</TabsTrigger>
        </TabsList>

        <TabsContent value="parties">
          <Button className="w-full mb-4" onClick={() => setShowAddParty(true)}><Plus className="h-4 w-4 mr-2" />Add Party</Button>
          <Input placeholder="Search parties..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="mb-4" />
          {isLoading ? <p className="text-center text-muted-foreground py-8">Loading...</p> : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredParties.map(party => (
                <Card key={party.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setSelectedParty(party)}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center"><User className="h-5 w-5 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">{party.name}</p>
                      {party.phone && <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{party.phone}</p>}
                    </div>
                    <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(party.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </CardContent>
                </Card>
              ))}
              {filteredParties.length === 0 && <p className="text-center text-muted-foreground py-8">No parties found</p>}
            </div>
          )}
        </TabsContent>

        <TabsContent value="petroleum">
          <p className="text-sm text-muted-foreground mb-4">Select a party to add petroleum credit</p>
          {parties.map(p => (
            <Card key={p.id} className="cursor-pointer hover:shadow-md mb-2" onClick={() => { setSelectedParty(p); setTxType('petroleum'); }}>
              <CardContent className="p-3"><p className="font-medium text-foreground">{p.name}</p></CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="tyre">
          <p className="text-sm text-muted-foreground mb-4">Select a party to add tyre credit</p>
          {parties.map(p => (
            <Card key={p.id} className="cursor-pointer hover:shadow-md mb-2" onClick={() => { setSelectedParty(p); setTxType('tyre'); }}>
              <CardContent className="p-3"><p className="font-medium text-foreground">{p.name}</p></CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Add Party Dialog */}
      <Dialog open={showAddParty} onOpenChange={setShowAddParty}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Credit Party</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Name *</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Party name" /></div>
            <div><Label>Phone</Label><Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Phone number" /></div>
            <div><Label>Address</Label><Input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Address" /></div>
            <div><Label>Notes</Label><Textarea value={newPartyNotes} onChange={(e) => setNewPartyNotes(e.target.value)} placeholder="Notes" /></div>
          </div>
          <DialogFooter><Button onClick={addParty}>Add Party</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Transaction Dialog */}
      <Dialog open={showAddTransaction} onOpenChange={setShowAddTransaction}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Credit Transaction</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Party *</Label>
              <Select value={txPartyId} onValueChange={setTxPartyId}>
                <SelectTrigger><SelectValue placeholder="Select party" /></SelectTrigger>
                <SelectContent>{parties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Type</Label>
              <Select value={txType} onValueChange={(v) => setTxType(v as 'petroleum' | 'tyre')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="petroleum">Petroleum</SelectItem><SelectItem value="tyre">Tyre</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label>Amount (₹) *</Label><Input type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} placeholder="Amount" /></div>
            {txType === 'petroleum' && <div><Label>Litres</Label><Input type="number" value={txLitres} onChange={(e) => setTxLitres(e.target.value)} placeholder="Litres (optional)" /></div>}
            {txType === 'tyre' && <div><Label>Tyre Name</Label><Input value={txTyreName} onChange={(e) => setTxTyreName(e.target.value)} placeholder="Tyre name (optional)" /></div>}
            <div>
              <Label>Date</Label>
              <Popover open={txCalendarOpen} onOpenChange={setTxCalendarOpen}>
                <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start"><CalendarIcon className="h-4 w-4 mr-2" />{format(txDate, 'dd MMM yyyy')}</Button></PopoverTrigger>
                <PopoverContent className="w-auto p-0"><Calendar mode="single" selected={txDate} onSelect={(d) => { if (d) setTxDate(d); setTxCalendarOpen(false); }} initialFocus /></PopoverContent>
              </Popover>
            </div>
            <div><Label>Notes</Label><Textarea value={txNotes} onChange={(e) => setTxNotes(e.target.value)} placeholder="Notes" /></div>
          </div>
          <DialogFooter><Button onClick={addTransaction}>Add</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Party?</AlertDialogTitle><AlertDialogDescription>This will delete the party and all their transactions.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => showDeleteConfirm && deleteParty(showDeleteConfirm)}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreditPartiesSection;
