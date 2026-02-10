import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Download, Share2, User, Phone, Edit2, Calendar as CalendarIcon, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
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
  transaction_type: string; // 'petroleum' | 'tyre' | 'payment'
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
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedParty, setSelectedParty] = useState<CreditParty | null>(null);
  const [showAddParty, setShowAddParty] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showDeleteTx, setShowDeleteTx] = useState<Transaction | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // New party form
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPartyNotes, setNewPartyNotes] = useState('');

  // Transaction form
  const [txType, setTxType] = useState<'petroleum' | 'tyre' | 'payment' | 'debit'>('petroleum');
  const [txAmount, setTxAmount] = useState('');
  const [txLitres, setTxLitres] = useState('');
  const [txTyreName, setTxTyreName] = useState('');
  const [txDate, setTxDate] = useState(new Date());
  const [txNotes, setTxNotes] = useState('');
  const [txCalendarOpen, setTxCalendarOpen] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewAllTime, setViewAllTime] = useState(false);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => { fetchParties(); }, []);
  useEffect(() => { if (selectedParty) fetchTransactions(selectedParty.id); }, [selectedParty, selectedMonth, selectedYear, viewAllTime]);

  const fetchParties = async () => {
    setIsLoading(true);
    const { data } = await supabase.from('credit_parties').select('*').eq('is_active', true).order('name');
    if (data) setParties(data as CreditParty[]);
    setIsLoading(false);
  };

  const fetchTransactions = async (partyId: string) => {
    let query = supabase.from('credit_party_transactions').select('*').eq('party_id', partyId).order('date', { ascending: true });
    if (!viewAllTime) {
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-31`;
      query = query.gte('date', startDate).lte('date', endDate);
    }
    const { data } = await query;
    if (data) setAllTransactions(data as Transaction[]);
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
    const { error } = await supabase.from('credit_parties').update({ is_active: false }).eq('id', id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Party removed');
    setShowDeleteConfirm(null);
    if (selectedParty?.id === id) setSelectedParty(null);
    fetchParties();
  };

  const addTransaction = async () => {
    if (!txAmount || !selectedParty) { toast.error('Amount required'); return; }
    const { error } = await supabase.from('credit_party_transactions').insert({
      party_id: selectedParty.id,
      transaction_type: txType,
      amount: parseFloat(txAmount),
      litres: txType === 'petroleum' && txLitres ? parseFloat(txLitres) : null,
      tyre_name: txType === 'tyre' && txTyreName ? txTyreName : null,
      date: format(txDate, 'yyyy-MM-dd'),
      notes: txNotes || null,
    });
    if (error) { toast.error('Failed to add'); return; }
    toast.success(txType === 'payment' ? 'Payment recorded' : txType === 'debit' ? 'Debit recorded' : 'Credit added');
    setShowAddTransaction(false);
    resetTxForm();
    fetchTransactions(selectedParty.id);
  };

  const updateTransaction = async () => {
    if (!editingTx || !txAmount) return;
    const { error } = await supabase.from('credit_party_transactions').update({
      transaction_type: txType,
      amount: parseFloat(txAmount),
      litres: txType === 'petroleum' && txLitres ? parseFloat(txLitres) : null,
      tyre_name: txType === 'tyre' && txTyreName ? txTyreName : null,
      date: format(txDate, 'yyyy-MM-dd'),
      notes: txNotes || null,
    }).eq('id', editingTx.id);
    if (error) { toast.error('Failed to update'); return; }
    toast.success('Updated');
    setEditingTx(null);
    resetTxForm();
    if (selectedParty) fetchTransactions(selectedParty.id);
  };

  const deleteTransaction = async () => {
    if (!showDeleteTx) return;
    const { error } = await supabase.from('credit_party_transactions').delete().eq('id', showDeleteTx.id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Deleted');
    setShowDeleteTx(null);
    if (selectedParty) fetchTransactions(selectedParty.id);
  };

  const resetTxForm = () => {
    setTxAmount(''); setTxLitres(''); setTxTyreName(''); setTxNotes(''); setTxDate(new Date()); setTxType('petroleum' as any);
  };

  const openEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setTxType(tx.transaction_type as 'petroleum' | 'tyre' | 'payment' | 'debit');
    setTxAmount(tx.amount.toString());
    setTxLitres(tx.litres?.toString() || '');
    setTxTyreName(tx.tyre_name || '');
    setTxDate(new Date(tx.date));
    setTxNotes(tx.notes || '');
  };

  const filteredParties = parties.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  // Ledger calculations
  const credits = allTransactions.filter(t => t.transaction_type !== 'payment' && t.transaction_type !== 'debit');
  const payments = allTransactions.filter(t => t.transaction_type === 'payment');
  const debits = allTransactions.filter(t => t.transaction_type === 'debit');
  const totalCredits = credits.reduce((s, t) => s + Number(t.amount), 0);
  const totalPayments = payments.reduce((s, t) => s + Number(t.amount), 0);
  const totalDebits = debits.reduce((s, t) => s + Number(t.amount), 0);
  const pendingBalance = totalCredits - totalPayments - totalDebits;
  const petroTotal = allTransactions.filter(t => t.transaction_type === 'petroleum').reduce((s, t) => s + Number(t.amount), 0);
  const tyreTotal = allTransactions.filter(t => t.transaction_type === 'tyre').reduce((s, t) => s + Number(t.amount), 0);
  const grandTotal = totalCredits + totalPayments + totalDebits;

  // Running balance calculation
  const getLedgerWithBalance = () => {
    let running = 0;
    return allTransactions.map(tx => {
      if (tx.transaction_type === 'payment' || tx.transaction_type === 'debit') {
        running -= Number(tx.amount);
      } else {
        running += Number(tx.amount);
      }
      return { ...tx, runningBalance: running };
    });
  };

  const exportPartyPDF = () => {
    if (!selectedParty) return;
    const ledger = getLedgerWithBalance();
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Credit Ledger: ${selectedParty.name}`, 14, 15);
    doc.setFontSize(10);
    const period = viewAllTime ? 'All Time' : `${months[selectedMonth - 1]} ${selectedYear}`;
    doc.text(period, 14, 22);
    doc.text(`Credits: ${formatCurrencyForPDF(totalCredits)} | Payments: ${formatCurrencyForPDF(totalPayments)} | Pending: ${formatCurrencyForPDF(pendingBalance)}`, 14, 30);
    doc.text(REPORT_FOOTER, 14, 36);

    autoTable(doc, {
      head: [['Date', 'Type', 'Credit', 'Payment', 'Balance', 'Details']],
      body: ledger.map(t => [
        format(new Date(t.date), 'dd/MM/yyyy'),
        t.transaction_type === 'payment' ? 'Payment' : t.transaction_type === 'petroleum' ? 'Petroleum' : 'Tyre',
        t.transaction_type !== 'payment' ? formatCurrencyForPDF(Number(t.amount)) : '-',
        t.transaction_type === 'payment' ? formatCurrencyForPDF(Number(t.amount)) : '-',
        formatCurrencyForPDF(t.runningBalance),
        [t.litres ? `${t.litres}L` : '', t.tyre_name || '', t.notes || ''].filter(Boolean).join(' | ') || '-',
      ]),
      startY: 42,
      styles: { fontSize: 7 },
    });
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    addReportNotes(doc, finalY);
    doc.save(`credit-ledger-${selectedParty.name}.pdf`);
    toast.success('PDF downloaded');
  };

  const exportPartyExcel = () => {
    if (!selectedParty) return;
    const ledger = getLedgerWithBalance();
    const data = ledger.map(t => [
      format(new Date(t.date), 'dd/MM/yyyy'),
      t.transaction_type === 'payment' ? 'Payment' : t.transaction_type === 'petroleum' ? 'Petroleum' : 'Tyre',
      t.transaction_type !== 'payment' ? Number(t.amount) : '',
      t.transaction_type === 'payment' ? Number(t.amount) : '',
      t.runningBalance,
      t.litres || '',
      t.tyre_name || '',
      t.notes || '',
    ]);
    exportToExcel(data, ['Date', 'Type', 'Credit', 'Payment', 'Balance', 'Litres', 'Tyre', 'Notes'], `credit-ledger-${selectedParty.name}`, 'Ledger', `Credit Ledger: ${selectedParty.name}`);
    toast.success('Excel downloaded');
  };

  const sharePartyWhatsApp = () => {
    if (!selectedParty) return;
    const ledger = getLedgerWithBalance();
    const period = viewAllTime ? 'All Time' : `${months[selectedMonth - 1]} ${selectedYear}`;
    let msg = `💳 *Credit Ledger: ${selectedParty.name}*\n📅 ${period}\n\n`;
    msg += `📊 Credits: ₹${totalCredits.toLocaleString()}\n`;
    msg += `💰 Payments: ₹${totalPayments.toLocaleString()}\n`;
    msg += `⏳ *Pending: ₹${pendingBalance.toLocaleString()}*\n\n`;
    msg += `📋 *Date-wise:*\n`;
    ledger.forEach(t => {
      const icon = t.transaction_type === 'payment' ? '💰' : t.transaction_type === 'petroleum' ? '⛽' : '🛞';
      const sign = t.transaction_type === 'payment' ? '-' : '+';
      msg += `${format(new Date(t.date), 'dd MMM')}: ${icon} ${sign}₹${Number(t.amount).toLocaleString()} (Bal: ₹${t.runningBalance.toLocaleString()})`;
      if (t.litres) msg += ` ${t.litres}L`;
      if (t.tyre_name) msg += ` ${t.tyre_name}`;
      msg += `\n`;
    });
    msg += `\n_${REPORT_FOOTER}_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // Party Ledger View
  if (selectedParty) {
    const ledger = getLedgerWithBalance();
    return (
      <div className="p-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedParty(null)}><ArrowLeft className="h-5 w-5" /></Button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-foreground">{selectedParty.name}</h1>
            {selectedParty.phone && <p className="text-xs text-muted-foreground">{selectedParty.phone}</p>}
          </div>
        </div>

        {/* Period Selection */}
        <div className="flex gap-2 mb-3">
          <Button size="sm" variant={viewAllTime ? 'outline' : 'default'} onClick={() => setViewAllTime(false)} className="text-xs">Monthly</Button>
          <Button size="sm" variant={viewAllTime ? 'default' : 'outline'} onClick={() => setViewAllTime(true)} className="text-xs">All Time</Button>
        </div>
        {!viewAllTime && (
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{months.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}</SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{[2024, 2025, 2026].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        )}

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Card className="bg-primary/10"><CardContent className="p-3"><p className="text-xs text-muted-foreground">⛽ Petroleum</p><p className="text-sm font-bold text-primary">{formatFullCurrency(petroTotal)}</p></CardContent></Card>
          <Card className="bg-primary/10"><CardContent className="p-3"><p className="text-xs text-muted-foreground">🛞 Tyre</p><p className="text-sm font-bold text-primary">{formatFullCurrency(tyreTotal)}</p></CardContent></Card>
          <Card className="bg-destructive/10"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total Credits</p><p className="text-sm font-bold text-destructive">{formatFullCurrency(totalCredits)}</p></CardContent></Card>
          <Card className="bg-green-500/10"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Payments</p><p className="text-sm font-bold text-green-600">{formatFullCurrency(totalPayments)}</p></CardContent></Card>
          {totalDebits > 0 && <Card className="bg-orange-500/10"><CardContent className="p-3"><p className="text-xs text-muted-foreground">📤 Debits</p><p className="text-sm font-bold text-orange-600">{formatFullCurrency(totalDebits)}</p></CardContent></Card>}
          <Card className="bg-muted"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Grand Total</p><p className="text-sm font-bold text-foreground">{formatFullCurrency(grandTotal)}</p></CardContent></Card>
        </div>
        
        {/* Pending Balance */}
        <Card className={`mb-3 ${pendingBalance > 0 ? 'bg-destructive/10 border-destructive/30' : 'bg-green-500/10 border-green-500/30'}`}>
          <CardContent className="p-3 text-center">
            <p className="text-xs text-muted-foreground">Pending Balance</p>
            <p className={`text-xl font-bold ${pendingBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>{formatFullCurrency(pendingBalance)}</p>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <Button size="sm" onClick={() => { setTxType('petroleum'); setShowAddTransaction(true); }}><Plus className="h-4 w-4 mr-1" />Credit</Button>
          <Button size="sm" variant="secondary" onClick={() => { setTxType('debit' as any); setShowAddTransaction(true); }}>📤 Debit</Button>
          <Button size="sm" variant="secondary" onClick={() => { setTxType('payment'); setShowAddTransaction(true); }}>💰 Payment</Button>
        </div>
        <Button size="sm" variant="outline" className="w-full mb-3" onClick={() => { setTxType('petroleum'); setShowAddTransaction(true); }}>📋 Add Ledger Entry</Button>
        <div className="grid grid-cols-3 gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={exportPartyPDF}><Download className="h-3 w-3 mr-1" />PDF</Button>
          <Button variant="outline" size="sm" onClick={exportPartyExcel}><FileSpreadsheet className="h-3 w-3 mr-1" />Excel</Button>
          <Button variant="outline" size="sm" onClick={sharePartyWhatsApp}><Share2 className="h-3 w-3 mr-1" />Share</Button>
        </div>

        {/* Ledger */}
        <p className="text-xs font-semibold text-muted-foreground mb-2">LEDGER ({allTransactions.length} entries)</p>
        <div className="space-y-1.5 max-h-[50vh] overflow-y-auto">
          {ledger.map(tx => {
            const isDeduction = tx.transaction_type === 'payment' || tx.transaction_type === 'debit';
            const typeLabel = tx.transaction_type === 'payment' ? '💰 Payment' : tx.transaction_type === 'debit' ? '📤 Debit' : tx.transaction_type === 'petroleum' ? '⛽ Petroleum' : '🛞 Tyre';
            const typeBg = tx.transaction_type === 'payment' ? 'bg-green-500/20 text-green-600' : tx.transaction_type === 'debit' ? 'bg-orange-500/20 text-orange-600' : tx.transaction_type === 'petroleum' ? 'bg-primary/20 text-primary' : 'bg-accent/30 text-accent-foreground';
            return (
            <Card key={tx.id} className={isDeduction ? 'border-green-500/30' : ''}>
              <CardContent className="p-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${typeBg}`}>
                        {typeLabel}
                      </span>
                      <span className={`font-bold text-sm ${isDeduction ? 'text-green-600' : 'text-destructive'}`}>
                        {isDeduction ? '-' : '+'}₹{Number(tx.amount).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(tx.date), 'dd MMM yyyy')}
                      {tx.litres ? ` • ${tx.litres}L` : ''}
                      {tx.tyre_name ? ` • ${tx.tyre_name}` : ''}
                      {tx.notes ? ` • ${tx.notes}` : ''}
                    </p>
                    <p className="text-xs font-mono text-muted-foreground">Bal: ₹{tx.runningBalance.toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1 ml-2">
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditTx(tx)}><Edit2 className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowDeleteTx(tx)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
          })}
          {allTransactions.length === 0 && <p className="text-center text-muted-foreground py-8">No entries</p>}
        </div>
      </div>
    );
  }

  // Party List
  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-bold text-foreground">Credit Parties</h1>
      </div>

      <Button className="w-full mb-4" onClick={() => setShowAddParty(true)}><Plus className="h-4 w-4 mr-2" />Add Party</Button>
      <Input placeholder="Search parties..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="mb-4" />
      
      {isLoading ? <p className="text-center text-muted-foreground py-8">Loading...</p> : (
        <div className="space-y-2">
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

      {/* Add/Edit Transaction Dialog */}
      <Dialog open={showAddTransaction || !!editingTx} onOpenChange={(open) => { if (!open) { setShowAddTransaction(false); setEditingTx(null); resetTxForm(); } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingTx ? 'Edit Entry' : txType === 'payment' ? 'Record Payment' : 'Add Credit'}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Type</Label>
              <Select value={txType} onValueChange={(v) => setTxType(v as 'petroleum' | 'tyre' | 'payment' | 'debit')}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="petroleum">⛽ Petroleum Credit</SelectItem>
                  <SelectItem value="tyre">🛞 Tyre Credit</SelectItem>
                  <SelectItem value="debit">📤 Debit</SelectItem>
                  <SelectItem value="payment">💰 Payment Received</SelectItem>
                </SelectContent>
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
          <DialogFooter><Button onClick={editingTx ? updateTransaction : addTransaction}>{editingTx ? 'Update' : 'Add'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Party Confirmation */}
      <AlertDialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove Party?</AlertDialogTitle><AlertDialogDescription>This will hide the party from the list. Transactions are preserved.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => showDeleteConfirm && deleteParty(showDeleteConfirm)}>Remove</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Transaction Confirmation */}
      <AlertDialog open={!!showDeleteTx} onOpenChange={() => setShowDeleteTx(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Entry?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this ledger entry.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={deleteTransaction}>Delete</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default CreditPartiesSection;
