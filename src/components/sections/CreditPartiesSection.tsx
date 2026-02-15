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
import { Badge } from '@/components/ui/badge';
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
  fuel_type: string | null;
  rate_per_litre: number | null;
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
  const [txFuelType, setTxFuelType] = useState<'diesel' | 'petrol' | ''>('');
  const [txAmount, setTxAmount] = useState('');
  const [txLitres, setTxLitres] = useState('');
  const [txRatePerLitre, setTxRatePerLitre] = useState('');
  const [txTyreName, setTxTyreName] = useState('');
  const [txDate, setTxDate] = useState(new Date());
  const [txNotes, setTxNotes] = useState('');
  const [txCalendarOpen, setTxCalendarOpen] = useState(false);
  const [txManualAmount, setTxManualAmount] = useState(false);

  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [viewAllTime, setViewAllTime] = useState(false);
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => { fetchParties(); }, []);
  useEffect(() => { if (selectedParty) fetchTransactions(selectedParty.id); }, [selectedParty, selectedMonth, selectedYear, viewAllTime]);

  // Auto-calculate amount from litres × rate
  useEffect(() => {
    if (txType === 'petroleum' && !txManualAmount && txLitres && txRatePerLitre) {
      const calc = parseFloat(txLitres) * parseFloat(txRatePerLitre);
      if (!isNaN(calc)) setTxAmount(calc.toFixed(2));
    }
  }, [txLitres, txRatePerLitre, txType, txManualAmount]);

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
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
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
    if (txType === 'petroleum' && !txFuelType) { toast.error('Please select Diesel or Petrol'); return; }
    if (txType === 'petroleum' && !txLitres) { toast.error('Litres is required for petroleum entries'); return; }
    
    const insertData: any = {
      party_id: selectedParty.id,
      transaction_type: txType,
      amount: parseFloat(txAmount),
      litres: txType === 'petroleum' && txLitres ? parseFloat(txLitres) : null,
      tyre_name: txType === 'tyre' && txTyreName ? txTyreName : null,
      date: format(txDate, 'yyyy-MM-dd'),
      notes: txNotes || null,
      fuel_type: txType === 'petroleum' && txFuelType ? txFuelType : null,
      rate_per_litre: txType === 'petroleum' && txRatePerLitre ? parseFloat(txRatePerLitre) : null,
    };

    const { error } = await supabase.from('credit_party_transactions').insert(insertData);
    if (error) { toast.error('Failed to add'); return; }
    toast.success(txType === 'payment' ? 'Credit (Payment) recorded' : txType === 'debit' ? 'Manual debit recorded' : 'Debit added');
    setShowAddTransaction(false);
    resetTxForm();
    fetchTransactions(selectedParty.id);
  };

  const updateTransaction = async () => {
    if (!editingTx || !txAmount) return;
    if (txType === 'petroleum' && !txFuelType) { toast.error('Please select Diesel or Petrol'); return; }
    if (txType === 'petroleum' && !txLitres) { toast.error('Litres is required for petroleum entries'); return; }

    const updateData: any = {
      transaction_type: txType,
      amount: parseFloat(txAmount),
      litres: txType === 'petroleum' && txLitres ? parseFloat(txLitres) : null,
      tyre_name: txType === 'tyre' && txTyreName ? txTyreName : null,
      date: format(txDate, 'yyyy-MM-dd'),
      notes: txNotes || null,
      fuel_type: txType === 'petroleum' && txFuelType ? txFuelType : null,
      rate_per_litre: txType === 'petroleum' && txRatePerLitre ? parseFloat(txRatePerLitre) : null,
    };

    const { error } = await supabase.from('credit_party_transactions').update(updateData).eq('id', editingTx.id);
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
    setTxAmount(''); setTxLitres(''); setTxRatePerLitre(''); setTxTyreName(''); setTxNotes(''); setTxDate(new Date()); setTxType('petroleum'); setTxFuelType(''); setTxManualAmount(false);
  };

  const openEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setTxType(tx.transaction_type as 'petroleum' | 'tyre' | 'payment' | 'debit');
    setTxAmount(tx.amount.toString());
    setTxLitres(tx.litres?.toString() || '');
    setTxRatePerLitre(tx.rate_per_litre?.toString() || '');
    setTxTyreName(tx.tyre_name || '');
    setTxDate(new Date(tx.date));
    setTxNotes(tx.notes || '');
    setTxFuelType((tx.fuel_type as 'diesel' | 'petrol') || '');
    setTxManualAmount(true); // When editing, don't auto-calc
  };

  const filteredParties = parties.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const debitEntries = allTransactions.filter(t => t.transaction_type !== 'payment');
  const creditEntries = allTransactions.filter(t => t.transaction_type === 'payment');
  
  const totalDebits = debitEntries.reduce((s, t) => s + Number(t.amount), 0);
  const totalCredits = creditEntries.reduce((s, t) => s + Number(t.amount), 0);
  const pendingBalance = totalDebits - totalCredits;
  
  const petroTotal = allTransactions.filter(t => t.transaction_type === 'petroleum').reduce((s, t) => s + Number(t.amount), 0);
  const dieselTotal = allTransactions.filter(t => t.transaction_type === 'petroleum' && t.fuel_type === 'diesel').reduce((s, t) => s + Number(t.amount), 0);
  const petrolTotal = allTransactions.filter(t => t.transaction_type === 'petroleum' && t.fuel_type === 'petrol').reduce((s, t) => s + Number(t.amount), 0);
  const dieselLitres = allTransactions.filter(t => t.transaction_type === 'petroleum' && t.fuel_type === 'diesel').reduce((s, t) => s + Number(t.litres || 0), 0);
  const petrolLitres = allTransactions.filter(t => t.transaction_type === 'petroleum' && t.fuel_type === 'petrol').reduce((s, t) => s + Number(t.litres || 0), 0);
  const tyreTotal = allTransactions.filter(t => t.transaction_type === 'tyre').reduce((s, t) => s + Number(t.amount), 0);
  const grandTotal = totalDebits + totalCredits;

  const getFuelTypeLabel = (tx: Transaction) => {
    if (tx.transaction_type !== 'petroleum') return null;
    if (tx.fuel_type === 'diesel') return 'Diesel';
    if (tx.fuel_type === 'petrol') return 'Petrol';
    return 'Unspecified';
  };

  const getLedgerWithBalance = () => {
    let running = 0;
    return allTransactions.map(tx => {
      if (tx.transaction_type === 'payment') {
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
    doc.text(`Petroleum Credit Ledger: ${selectedParty.name}`, 14, 15);
    doc.setFontSize(10);
    const period = viewAllTime ? 'All Time' : `${months[selectedMonth - 1]} ${selectedYear}`;
    doc.text(period, 14, 22);
    doc.text(`Debit (Pending): ${formatCurrencyForPDF(totalDebits)} | Credit (Received): ${formatCurrencyForPDF(totalCredits)} | Balance: ${formatCurrencyForPDF(pendingBalance)}`, 14, 30);
    
    // Fuel breakdown
    let infoY = 36;
    if (dieselTotal > 0 || petrolTotal > 0) {
      doc.text(`Diesel: ${dieselLitres.toFixed(1)}L = ${formatCurrencyForPDF(dieselTotal)} | Petrol: ${petrolLitres.toFixed(1)}L = ${formatCurrencyForPDF(petrolTotal)}`, 14, infoY);
      infoY += 6;
    }
    doc.text(REPORT_FOOTER, 14, infoY);

    autoTable(doc, {
      head: [['Date', 'Type', 'Fuel', 'Litres', 'Rate', 'Debit', 'Credit', 'Balance', 'Notes']],
      body: ledger.map(t => [
        format(new Date(t.date), 'dd/MM/yyyy'),
        t.transaction_type === 'payment' ? 'Credit' : t.transaction_type === 'petroleum' ? 'Petroleum' : t.transaction_type === 'tyre' ? 'Tyre' : 'Debit',
        getFuelTypeLabel(t) || '-',
        t.litres ? `${t.litres}` : '-',
        t.rate_per_litre ? `${t.rate_per_litre}` : '-',
        t.transaction_type !== 'payment' ? formatCurrencyForPDF(Number(t.amount)) : '-',
        t.transaction_type === 'payment' ? formatCurrencyForPDF(Number(t.amount)) : '-',
        formatCurrencyForPDF(t.runningBalance),
        t.notes || '-',
      ]),
      startY: infoY + 6,
      styles: { fontSize: 6 },
    });
    const finalY = (doc as any).lastAutoTable.finalY + 15;
    addReportNotes(doc, finalY);
    doc.save(`ledger-${selectedParty.name}.pdf`);
    toast.success('PDF downloaded');
  };

  const exportPartyExcel = () => {
    if (!selectedParty) return;
    const ledger = getLedgerWithBalance();
    const data = ledger.map(t => [
      format(new Date(t.date), 'dd/MM/yyyy'),
      t.transaction_type === 'payment' ? 'Credit (Received)' : t.transaction_type === 'petroleum' ? 'Petroleum' : t.transaction_type === 'tyre' ? 'Tyre' : 'Debit',
      getFuelTypeLabel(t) || '-',
      t.litres || '',
      t.rate_per_litre || '',
      t.transaction_type !== 'payment' ? Number(t.amount) : '',
      t.transaction_type === 'payment' ? Number(t.amount) : '',
      t.runningBalance,
      t.tyre_name || '',
      t.notes || '',
    ]);
    exportToExcel(data, ['Date', 'Type', 'Fuel Type', 'Litres', 'Rate/L', 'Debit', 'Credit', 'Balance', 'Tyre', 'Notes'], `ledger-${selectedParty.name}`, 'Ledger', `Petroleum Credit Ledger: ${selectedParty.name}`);
    toast.success('Excel downloaded');
  };

  const sharePartyWhatsApp = () => {
    if (!selectedParty) return;
    const ledger = getLedgerWithBalance();
    const period = viewAllTime ? 'All Time' : `${months[selectedMonth - 1]} ${selectedYear}`;
    let msg = `📋 *Petroleum Credit Ledger: ${selectedParty.name}*\n📅 ${period}\n\n`;
    if (dieselTotal > 0) msg += `⛽ Diesel: ${dieselLitres.toFixed(1)}L = ₹${dieselTotal.toLocaleString()}\n`;
    if (petrolTotal > 0) msg += `⛽ Petrol: ${petrolLitres.toFixed(1)}L = ₹${petrolTotal.toLocaleString()}\n`;
    msg += `📊 Debit (Pending): ₹${totalDebits.toLocaleString()}\n`;
    msg += `💰 Credit (Received): ₹${totalCredits.toLocaleString()}\n`;
    msg += `⏳ *Balance (Pending): ₹${pendingBalance.toLocaleString()}*\n\n`;
    msg += `📋 *Date-wise:*\n`;
    ledger.forEach(t => {
      const icon = t.transaction_type === 'payment' ? '💰' : t.transaction_type === 'petroleum' ? '⛽' : t.transaction_type === 'tyre' ? '🛞' : '📤';
      const sign = t.transaction_type === 'payment' ? '-' : '+';
      const fuelLabel = getFuelTypeLabel(t);
      msg += `${format(new Date(t.date), 'dd MMM')}: ${icon} ${sign}₹${Number(t.amount).toLocaleString()} (Bal: ₹${t.runningBalance.toLocaleString()})`;
      if (fuelLabel && fuelLabel !== 'Unspecified') msg += ` [${fuelLabel}]`;
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

        {/* Fuel Type Summary Cards */}
        <div className="grid grid-cols-2 gap-2 mb-2">
          <Card className="border-blue-800/30 bg-blue-900/10"><CardContent className="p-3"><p className="text-xs text-muted-foreground">⛽ Diesel</p><p className="text-sm font-bold text-foreground">{formatFullCurrency(dieselTotal)}</p><p className="text-xs text-muted-foreground">{dieselLitres.toFixed(1)} Litres</p></CardContent></Card>
          <Card className="border-blue-400/30 bg-blue-400/10"><CardContent className="p-3"><p className="text-xs text-muted-foreground">⛽ Petrol</p><p className="text-sm font-bold text-foreground">{formatFullCurrency(petrolTotal)}</p><p className="text-xs text-muted-foreground">{petrolLitres.toFixed(1)} Litres</p></CardContent></Card>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Card className="bg-primary/10"><CardContent className="p-3"><p className="text-xs text-muted-foreground">🛞 Tyre</p><p className="text-sm font-bold text-primary">{formatFullCurrency(tyreTotal)}</p></CardContent></Card>
          <Card className="bg-muted"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Grand Total</p><p className="text-sm font-bold text-foreground">{formatFullCurrency(grandTotal)}</p></CardContent></Card>
        </div>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <Card className="bg-destructive/10"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total Debit</p><p className="text-sm font-bold text-destructive">{formatFullCurrency(totalDebits)}</p></CardContent></Card>
          <Card className="bg-green-500/10"><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total Credit</p><p className="text-sm font-bold text-green-600">{formatFullCurrency(totalCredits)}</p></CardContent></Card>
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
          <Button size="sm" onClick={() => { setTxType('petroleum'); setShowAddTransaction(true); }}>⛽ Petroleum</Button>
          <Button size="sm" variant="secondary" onClick={() => { setTxType('debit'); setShowAddTransaction(true); }}>📤 Manual Debit</Button>
          <Button size="sm" variant="secondary" onClick={() => { setTxType('payment'); setShowAddTransaction(true); }}>💰 Credit</Button>
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
            const isCredit = tx.transaction_type === 'payment';
            const typeLabel = tx.transaction_type === 'payment' ? '💰 Credit' : tx.transaction_type === 'debit' ? '📤 Debit' : tx.transaction_type === 'petroleum' ? '⛽ Petroleum' : '🛞 Tyre';
            const typeBg = tx.transaction_type === 'payment' ? 'bg-green-500/20 text-green-600' : tx.transaction_type === 'debit' ? 'bg-orange-500/20 text-orange-600' : tx.transaction_type === 'petroleum' ? 'bg-primary/20 text-primary' : 'bg-accent/30 text-accent-foreground';
            const fuelLabel = getFuelTypeLabel(tx);
            return (
            <Card key={tx.id} className={isCredit ? 'border-green-500/30' : ''}>
              <CardContent className="p-2.5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-xs px-1.5 py-0.5 rounded ${typeBg}`}>
                        {typeLabel}
                      </span>
                      {fuelLabel && (
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${
                          tx.fuel_type === 'diesel' ? 'border-blue-800/50 bg-blue-900/20 text-blue-300' :
                          tx.fuel_type === 'petrol' ? 'border-blue-400/50 bg-blue-400/20 text-blue-400' :
                          'border-muted-foreground/30'
                        }`}>
                          {fuelLabel}
                        </Badge>
                      )}
                      <span className={`font-bold text-sm ${isCredit ? 'text-green-600' : 'text-destructive'}`}>
                        {isCredit ? '-' : '+'}₹{Number(tx.amount).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(new Date(tx.date), 'dd MMM yyyy')}
                      {tx.litres ? ` • ${tx.litres}L` : ''}
                      {tx.rate_per_litre ? ` @ ₹${tx.rate_per_litre}/L` : ''}
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

        {/* Add/Edit Transaction Dialog */}
        <Dialog open={showAddTransaction || !!editingTx} onOpenChange={(open) => { if (!open) { setShowAddTransaction(false); setEditingTx(null); resetTxForm(); } }}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingTx ? 'Edit Entry' : txType === 'payment' ? 'Record Credit (Payment Received)' : txType === 'debit' ? 'Record Manual Debit' : 'Add Debit Entry'}</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Type</Label>
                <Select value={txType} onValueChange={(v) => { setTxType(v as 'petroleum' | 'tyre' | 'payment' | 'debit'); if (v !== 'petroleum') setTxFuelType(''); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="petroleum">⛽ Petroleum (Debit)</SelectItem>
                    <SelectItem value="tyre">🛞 Tyre (Debit)</SelectItem>
                    <SelectItem value="debit">📤 Manual Debit</SelectItem>
                    <SelectItem value="payment">💰 Credit (Payment Received)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fuel Type - only for petroleum */}
              {txType === 'petroleum' && (
                <div>
                  <Label>Fuel Type *</Label>
                  <Select value={txFuelType} onValueChange={(v) => setTxFuelType(v as 'diesel' | 'petrol')}>
                    <SelectTrigger><SelectValue placeholder="Select fuel type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diesel">⛽ Diesel</SelectItem>
                      <SelectItem value="petrol">⛽ Petrol</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              {txType === 'petroleum' && (
                <>
                  <div><Label>Litres *</Label><Input type="number" value={txLitres} onChange={(e) => setTxLitres(e.target.value)} placeholder="Enter litres" /></div>
                  <div><Label>Rate per Litre (₹)</Label><Input type="number" value={txRatePerLitre} onChange={(e) => { setTxRatePerLitre(e.target.value); setTxManualAmount(false); }} placeholder="Rate per litre (optional)" /></div>
                </>
              )}

              <div>
                <Label>Amount (₹) * {txType === 'petroleum' && txLitres && txRatePerLitre && !txManualAmount ? '(Auto-calculated)' : ''}</Label>
                <Input type="number" value={txAmount} onChange={(e) => { setTxAmount(e.target.value); if (txType === 'petroleum') setTxManualAmount(true); }} placeholder="Amount" />
              </div>

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

        {/* Delete Transaction Confirmation */}
        <AlertDialog open={!!showDeleteTx} onOpenChange={() => setShowDeleteTx(null)}>
          <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Delete Entry?</AlertDialogTitle><AlertDialogDescription>This will permanently delete this ledger entry.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={deleteTransaction}>Delete</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
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
