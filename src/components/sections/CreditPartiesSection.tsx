import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import TablePagination from '@/components/ui/TablePagination';
import { Plus, Trash2, Download, Share2, User, Phone, Edit2, Calendar as CalendarIcon, FileSpreadsheet, Search, CreditCard, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, ChevronRight, MoreVertical, MapPin, StickyNote, Fuel, CircleDot, Banknote, Eye, Clock } from 'lucide-react';
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, subDays, startOfQuarter, startOfYear } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { addReportNotes, REPORT_FOOTER, exportToExcel } from '@/lib/exportUtils';
import { formatFullCurrency, formatCurrencyForPDF, formatCompactCurrency } from '@/lib/formatUtils';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedNumber from '@/components/ui/AnimatedNumber';

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

interface PartyWithBalance extends CreditParty {
  totalDebit: number;
  totalCredit: number;
  pendingBalance: number;
  lastTransactionDate: string | null;
  txCount: number;
}

interface CreditPartiesSectionProps {
  onBack: () => void;
}

const CreditPartiesSection = ({ onBack }: CreditPartiesSectionProps) => {
  const [parties, setParties] = useState<CreditParty[]>([]);
  const [allPartyTransactions, setAllPartyTransactions] = useState<Record<string, Transaction[]>>({});
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedParty, setSelectedParty] = useState<CreditParty | null>(null);

  // Browser back button support for internal navigation
  const handledPopState = useRef(false);
  
  useEffect(() => {
    const handlePopState = () => {
      if (selectedParty) {
        handledPopState.current = true;
        setSelectedParty(null);
        // Re-push state so the parent's popstate doesn't also fire a back
        window.history.pushState({}, '', '');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [selectedParty]);

  const selectParty = useCallback((party: CreditParty) => {
    window.history.pushState({ partyView: true }, '');
    setSelectedParty(party);
  }, []);

  const goBackFromParty = useCallback(() => {
    window.history.back();
  }, []);
  const [showAddParty, setShowAddParty] = useState(false);
  const [showAddTransaction, setShowAddTransaction] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showDeleteTx, setShowDeleteTx] = useState<Transaction | null>(null);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);
  const [editingParty, setEditingParty] = useState<CreditParty | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'balance' | 'recent'>('balance');

  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newAddress, setNewAddress] = useState('');
  const [newPartyNotes, setNewPartyNotes] = useState('');

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
  const [viewMode, setViewMode] = useState<'all' | 'monthly' | 'range'>('all');
  const [rangeStart, setRangeStart] = useState<Date | undefined>(undefined);
  const [rangeEnd, setRangeEnd] = useState<Date | undefined>(undefined);
  const [rangeStartOpen, setRangeStartOpen] = useState(false);
  const [rangeEndOpen, setRangeEndOpen] = useState(false);
  const [ledgerFilter, setLedgerFilter] = useState<'all' | 'debit' | 'credit'>('all');
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const viewAllTime = viewMode === 'all';
  const [partyPage, setPartyPage] = useState(0);
  const [ledgerPage, setLedgerPage] = useState(0);
  const PAGE_SIZE = 50;

  useEffect(() => { fetchParties(); fetchAllPartyTransactions(); }, []);
  useEffect(() => { if (selectedParty) fetchTransactions(selectedParty.id); }, [selectedParty, selectedMonth, selectedYear, viewMode, rangeStart, rangeEnd]);

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

  const fetchAllPartyTransactions = async () => {
    const { data } = await supabase.from('credit_party_transactions').select('*').order('date', { ascending: false });
    if (data) {
      const grouped: Record<string, Transaction[]> = {};
      (data as Transaction[]).forEach(tx => {
        if (!grouped[tx.party_id]) grouped[tx.party_id] = [];
        grouped[tx.party_id].push(tx);
      });
      setAllPartyTransactions(grouped);
    }
  };

  const fetchTransactions = async (partyId: string) => {
    let query = supabase.from('credit_party_transactions').select('*').eq('party_id', partyId).order('date', { ascending: true });
    if (viewMode === 'monthly') {
      const startDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, selectedMonth, 0).getDate();
      const endDate = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      query = query.gte('date', startDate).lte('date', endDate);
    } else if (viewMode === 'range') {
      if (rangeStart) query = query.gte('date', format(rangeStart, 'yyyy-MM-dd'));
      if (rangeEnd) query = query.lte('date', format(rangeEnd, 'yyyy-MM-dd'));
    }
    const { data } = await query;
    if (data) setAllTransactions(data as Transaction[]);
  };

  const partiesWithBalance: PartyWithBalance[] = useMemo(() => {
    return parties.map(p => {
      const txs = allPartyTransactions[p.id] || [];
      const totalDebit = txs.filter(t => t.transaction_type !== 'payment').reduce((s, t) => s + Number(t.amount), 0);
      const totalCredit = txs.filter(t => t.transaction_type === 'payment').reduce((s, t) => s + Number(t.amount), 0);
      const lastTx = txs.length > 0 ? txs[0].date : null;
      return { ...p, totalDebit, totalCredit, pendingBalance: totalDebit - totalCredit, lastTransactionDate: lastTx, txCount: txs.length };
    });
  }, [parties, allPartyTransactions]);

  const filteredParties = useMemo(() => {
    let result = partiesWithBalance.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    if (sortBy === 'balance') result.sort((a, b) => b.pendingBalance - a.pendingBalance);
    else if (sortBy === 'recent') result.sort((a, b) => (b.lastTransactionDate || '').localeCompare(a.lastTransactionDate || ''));
    else result.sort((a, b) => a.name.localeCompare(b.name));
    return result;
  }, [partiesWithBalance, searchQuery, sortBy]);

  const totalPortfolioDebit = partiesWithBalance.reduce((s, p) => s + p.totalDebit, 0);
  const totalPortfolioCredit = partiesWithBalance.reduce((s, p) => s + p.totalCredit, 0);
  const totalPortfolioPending = partiesWithBalance.reduce((s, p) => s + p.pendingBalance, 0);

  // Reset pages when filters change
  useEffect(() => { setPartyPage(0); }, [searchQuery, sortBy]);
  useEffect(() => { setLedgerPage(0); }, [ledgerFilter, selectedParty, selectedMonth, selectedYear, viewMode]);

  // Paginated slices
  const partyTotalPages = Math.ceil(filteredParties.length / PAGE_SIZE);
  const paginatedParties = filteredParties.slice(partyPage * PAGE_SIZE, (partyPage + 1) * PAGE_SIZE);

  const addParty = async () => {
    if (!newName) { toast.error('Name is required'); return; }
    const { error } = await supabase.from('credit_parties').insert({ name: newName, phone: newPhone || null, address: newAddress || null, notes: newPartyNotes || null });
    if (error) { toast.error('Failed to add party'); return; }
    toast.success('Party added');
    setShowAddParty(false);
    setNewName(''); setNewPhone(''); setNewAddress(''); setNewPartyNotes('');
    fetchParties(); fetchAllPartyTransactions();
  };

  const updateParty = async () => {
    if (!editingParty || !newName) return;
    const { error } = await supabase.from('credit_parties').update({ name: newName, phone: newPhone || null, address: newAddress || null, notes: newPartyNotes || null }).eq('id', editingParty.id);
    if (error) { toast.error('Failed to update'); return; }
    toast.success('Party updated');
    setEditingParty(null);
    setNewName(''); setNewPhone(''); setNewAddress(''); setNewPartyNotes('');
    fetchParties();
    if (selectedParty?.id === editingParty.id) {
      setSelectedParty({ ...selectedParty, name: newName, phone: newPhone || null, address: newAddress || null, notes: newPartyNotes || null });
    }
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
    const insertData: any = {
      party_id: selectedParty.id, transaction_type: txType, amount: parseFloat(txAmount),
      litres: txType === 'petroleum' && txLitres ? parseFloat(txLitres) : null,
      tyre_name: txType === 'tyre' && txTyreName ? txTyreName : null,
      date: format(txDate, 'yyyy-MM-dd'), notes: txNotes || null,
      fuel_type: txType === 'petroleum' && txFuelType ? txFuelType : null,
      rate_per_litre: txType === 'petroleum' && txRatePerLitre ? parseFloat(txRatePerLitre) : null,
    };
    const { error } = await supabase.from('credit_party_transactions').insert(insertData);
    if (error) { toast.error('Failed to add'); return; }
    toast.success(txType === 'payment' ? 'Payment recorded' : 'Entry added');
    setShowAddTransaction(false);
    resetTxForm();
    fetchTransactions(selectedParty.id);
    fetchAllPartyTransactions();
  };

  const updateTransaction = async () => {
    if (!editingTx || !txAmount) return;
    if (txType === 'petroleum' && !txFuelType) { toast.error('Please select Diesel or Petrol'); return; }
    const updateData: any = {
      transaction_type: txType, amount: parseFloat(txAmount),
      litres: txType === 'petroleum' && txLitres ? parseFloat(txLitres) : null,
      tyre_name: txType === 'tyre' && txTyreName ? txTyreName : null,
      date: format(txDate, 'yyyy-MM-dd'), notes: txNotes || null,
      fuel_type: txType === 'petroleum' && txFuelType ? txFuelType : null,
      rate_per_litre: txType === 'petroleum' && txRatePerLitre ? parseFloat(txRatePerLitre) : null,
    };
    const { error } = await supabase.from('credit_party_transactions').update(updateData).eq('id', editingTx.id);
    if (error) { toast.error('Failed to update'); return; }
    toast.success('Updated');
    setEditingTx(null);
    resetTxForm();
    if (selectedParty) fetchTransactions(selectedParty.id);
    fetchAllPartyTransactions();
  };

  const deleteTransaction = async () => {
    if (!showDeleteTx) return;
    const { error } = await supabase.from('credit_party_transactions').delete().eq('id', showDeleteTx.id);
    if (error) { toast.error('Failed to delete'); return; }
    toast.success('Deleted');
    setShowDeleteTx(null);
    if (selectedParty) fetchTransactions(selectedParty.id);
    fetchAllPartyTransactions();
  };

  const resetTxForm = () => {
    setTxAmount(''); setTxLitres(''); setTxRatePerLitre(''); setTxTyreName(''); setTxNotes(''); setTxDate(new Date()); setTxType('petroleum'); setTxFuelType(''); setTxManualAmount(false);
  };

  const openEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setTxType(tx.transaction_type as any);
    setTxAmount(tx.amount.toString());
    setTxLitres(tx.litres?.toString() || '');
    setTxRatePerLitre(tx.rate_per_litre?.toString() || '');
    setTxTyreName(tx.tyre_name || '');
    setTxDate(new Date(tx.date));
    setTxNotes(tx.notes || '');
    setTxFuelType((tx.fuel_type as 'diesel' | 'petrol') || '');
    setTxManualAmount(true);
  };

  const openEditParty = (party: CreditParty) => {
    setEditingParty(party);
    setNewName(party.name);
    setNewPhone(party.phone || '');
    setNewAddress(party.address || '');
    setNewPartyNotes(party.notes || '');
  };

  const applyPreset = (preset: string) => {
    const today = new Date();
    setViewMode('range');
    setRangeEnd(today);
    if (preset === '7d') setRangeStart(subDays(today, 7));
    else if (preset === '30d') setRangeStart(subDays(today, 30));
    else if (preset === 'quarter') setRangeStart(startOfQuarter(today));
    else if (preset === 'year') setRangeStart(startOfYear(today));
  };

  const debitEntries = allTransactions.filter(t => t.transaction_type !== 'payment');
  const creditEntries = allTransactions.filter(t => t.transaction_type === 'payment');
  const totalDebits = debitEntries.reduce((s, t) => s + Number(t.amount), 0);
  const totalCredits = creditEntries.reduce((s, t) => s + Number(t.amount), 0);
  const pendingBalance = totalDebits - totalCredits;

  const dieselTotal = allTransactions.filter(t => t.transaction_type === 'petroleum' && t.fuel_type === 'diesel').reduce((s, t) => s + Number(t.amount), 0);
  const petrolTotal = allTransactions.filter(t => t.transaction_type === 'petroleum' && t.fuel_type === 'petrol').reduce((s, t) => s + Number(t.amount), 0);
  const dieselLitres = allTransactions.filter(t => t.transaction_type === 'petroleum' && t.fuel_type === 'diesel').reduce((s, t) => s + Number(t.litres || 0), 0);
  const petrolLitres = allTransactions.filter(t => t.transaction_type === 'petroleum' && t.fuel_type === 'petrol').reduce((s, t) => s + Number(t.litres || 0), 0);
  const tyreTotal = allTransactions.filter(t => t.transaction_type === 'tyre').reduce((s, t) => s + Number(t.amount), 0);

  const getFuelTypeLabel = (tx: Transaction) => {
    if (tx.transaction_type !== 'petroleum') return null;
    return tx.fuel_type === 'diesel' ? 'Diesel' : tx.fuel_type === 'petrol' ? 'Petrol' : 'Fuel';
  };

  const getLedgerWithBalance = () => {
    let running = 0;
    return allTransactions.map(tx => {
      if (tx.transaction_type === 'payment') running -= Number(tx.amount);
      else running += Number(tx.amount);
      return { ...tx, runningBalance: running };
    });
  };

  const filteredLedger = useMemo(() => {
    const ledger = getLedgerWithBalance();
    if (ledgerFilter === 'debit') return ledger.filter(t => t.transaction_type !== 'payment');
    if (ledgerFilter === 'credit') return ledger.filter(t => t.transaction_type === 'payment');
    return ledger;
  }, [allTransactions, ledgerFilter]);

  const exportPartyPDF = () => {
    if (!selectedParty) return;
    const ledger = getLedgerWithBalance();
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text(`Credit Ledger: ${selectedParty.name}`, 14, 15);
    doc.setFontSize(10);
    const period = viewMode === 'all' ? 'All Time' : viewMode === 'range' ? `${rangeStart ? format(rangeStart, 'dd MMM yyyy') : '...'} to ${rangeEnd ? format(rangeEnd, 'dd MMM yyyy') : '...'}` : `${months[selectedMonth - 1]} ${selectedYear}`;
    doc.text(period, 14, 22);
    doc.text(`Debit: ${formatCurrencyForPDF(totalDebits)} | Credit: ${formatCurrencyForPDF(totalCredits)} | Pending: ${formatCurrencyForPDF(pendingBalance)}`, 14, 30);
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
        getFuelTypeLabel(t) || '-', t.litres ? `${t.litres}` : '-', t.rate_per_litre ? `${t.rate_per_litre}` : '-',
        t.transaction_type !== 'payment' ? formatCurrencyForPDF(Number(t.amount)) : '-',
        t.transaction_type === 'payment' ? formatCurrencyForPDF(Number(t.amount)) : '-',
        formatCurrencyForPDF(t.runningBalance), t.notes || '-',
      ]),
      startY: infoY + 6, styles: { fontSize: 6 },
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
      t.transaction_type === 'payment' ? 'Credit' : t.transaction_type === 'petroleum' ? 'Petroleum' : t.transaction_type === 'tyre' ? 'Tyre' : 'Debit',
      getFuelTypeLabel(t) || '-', t.litres || '', t.rate_per_litre || '',
      t.transaction_type !== 'payment' ? Number(t.amount) : '',
      t.transaction_type === 'payment' ? Number(t.amount) : '',
      t.runningBalance, t.tyre_name || '', t.notes || '',
    ]);
    exportToExcel(data, ['Date', 'Type', 'Fuel', 'Litres', 'Rate/L', 'Debit', 'Credit', 'Balance', 'Tyre', 'Notes'], `ledger-${selectedParty.name}`, 'Ledger', `Credit Ledger: ${selectedParty.name}`);
    toast.success('Excel downloaded');
  };

  const sharePartyWhatsApp = () => {
    if (!selectedParty) return;
    const ledger = getLedgerWithBalance();
    const period = viewMode === 'all' ? 'All Time' : viewMode === 'range' ? `${rangeStart ? format(rangeStart, 'dd MMM yyyy') : '...'} to ${rangeEnd ? format(rangeEnd, 'dd MMM yyyy') : '...'}` : `${months[selectedMonth - 1]} ${selectedYear}`;
    let msg = `*Credit Ledger: ${selectedParty.name}*\n${period}\n\n`;
    if (dieselTotal > 0) msg += `Diesel: ${dieselLitres.toFixed(1)}L = Rs.${dieselTotal.toLocaleString('en-IN')}\n`;
    if (petrolTotal > 0) msg += `Petrol: ${petrolLitres.toFixed(1)}L = Rs.${petrolTotal.toLocaleString('en-IN')}\n`;
    if (tyreTotal > 0) msg += `Tyre: Rs.${tyreTotal.toLocaleString('en-IN')}\n`;
    msg += `\nDebit: Rs.${totalDebits.toLocaleString('en-IN')}\nCredit: Rs.${totalCredits.toLocaleString('en-IN')}\n*Pending: Rs.${pendingBalance.toLocaleString('en-IN')}*\n\n*Entries:*\n`;
    ledger.forEach(t => {
      const sign = t.transaction_type === 'payment' ? '-' : '+';
      const typeLabel = t.transaction_type === 'payment' ? 'CR' : t.transaction_type === 'petroleum' ? 'Fuel' : t.transaction_type === 'tyre' ? 'Tyre' : 'DR';
      msg += `${format(new Date(t.date), 'dd MMM')}: ${typeLabel} ${sign}Rs.${Number(t.amount).toLocaleString('en-IN')} (Bal: Rs.${t.runningBalance.toLocaleString('en-IN')})`;
      if (t.litres) msg += ` ${t.litres}L`;
      if (t.tyre_name) msg += ` ${t.tyre_name}`;
      msg += `\n`;
    });
    msg += `\n_${REPORT_FOOTER}_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // ===== SHARED DIALOGS =====
  const renderTransactionDialog = () => (
    <Dialog open={showAddTransaction || !!editingTx} onOpenChange={(open) => { if (!open) { setShowAddTransaction(false); setEditingTx(null); resetTxForm(); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${txType === 'payment' ? 'bg-green-500/10' : 'bg-primary/10'}`}>
              {txType === 'payment' ? <Banknote className="h-5 w-5 text-green-600" /> : <CreditCard className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <DialogTitle className="text-base">{editingTx ? 'Edit Entry' : 'New Transaction'}</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">{selectedParty?.name}</p>
            </div>
          </div>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div>
            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</Label>
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[
                { value: 'petroleum', label: 'Fuel', icon: <Fuel className="h-3.5 w-3.5" />, color: 'text-blue-500 border-blue-500/40 bg-blue-500/5' },
                { value: 'tyre', label: 'Tyre', icon: <CircleDot className="h-3.5 w-3.5" />, color: 'text-accent border-accent/40 bg-accent/5' },
                { value: 'debit', label: 'Debit', icon: <ArrowUpRight className="h-3.5 w-3.5" />, color: 'text-destructive border-destructive/40 bg-destructive/5' },
                { value: 'payment', label: 'Credit', icon: <Banknote className="h-3.5 w-3.5" />, color: 'text-green-600 border-green-500/40 bg-green-500/5' },
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => { setTxType(opt.value as any); if (opt.value !== 'petroleum') setTxFuelType(''); }}
                  className={`flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all text-xs font-medium ${
                    txType === opt.value ? `${opt.color} ring-1 ring-offset-1 ring-offset-background` : 'border-border/50 text-muted-foreground hover:border-border'
                  }`}
                >{opt.icon}{opt.label}</button>
              ))}
            </div>
          </div>
          {txType === 'petroleum' && (
            <div>
              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Fuel Type *</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button type="button" onClick={() => setTxFuelType('diesel')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${txFuelType === 'diesel' ? 'border-blue-500/50 bg-blue-500/10 text-blue-500' : 'border-border/50 text-muted-foreground hover:border-border'}`}
                ><Fuel className="h-4 w-4" /> Diesel</button>
                <button type="button" onClick={() => setTxFuelType('petrol')}
                  className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 transition-all text-sm font-medium ${txFuelType === 'petrol' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-500' : 'border-border/50 text-muted-foreground hover:border-border'}`}
                ><Fuel className="h-4 w-4" /> Petrol</button>
              </div>
            </div>
          )}
          {txType === 'petroleum' && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Litres *</Label><Input type="number" value={txLitres} onChange={(e) => setTxLitres(e.target.value)} placeholder="0.00" className="mt-1.5 font-mono" /></div>
              <div><Label className="text-xs">Rate/Litre (₹)</Label><Input type="number" value={txRatePerLitre} onChange={(e) => { setTxRatePerLitre(e.target.value); setTxManualAmount(false); }} placeholder="Auto" className="mt-1.5 font-mono" /></div>
            </div>
          )}
          <div>
            <Label className="text-xs">Amount (₹) *
              {txType === 'petroleum' && txLitres && txRatePerLitre && !txManualAmount && (
                <Badge variant="outline" className="ml-2 text-[9px] h-4 px-1.5 border-green-500/30 text-green-600">Auto-calculated</Badge>
              )}
            </Label>
            <div className="relative mt-1.5">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">₹</span>
              <Input type="number" value={txAmount} onChange={(e) => { setTxAmount(e.target.value); if (txType === 'petroleum') setTxManualAmount(true); }} placeholder="0.00" className="pl-7 font-mono text-lg font-bold h-12" />
            </div>
          </div>
          {txType === 'tyre' && (
            <div><Label className="text-xs">Tyre Name</Label><Input value={txTyreName} onChange={(e) => setTxTyreName(e.target.value)} placeholder="e.g. MRF 295/80" className="mt-1.5" /></div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Date</Label>
              <Popover open={txCalendarOpen} onOpenChange={setTxCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start mt-1.5 h-10 text-sm">
                    <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />{format(txDate, 'dd MMM yyyy')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar mode="single" selected={txDate} onSelect={(d) => { if (d) setTxDate(d); setTxCalendarOpen(false); }} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
            <div><Label className="text-xs">Notes</Label><Input value={txNotes} onChange={(e) => setTxNotes(e.target.value)} placeholder="Optional" className="mt-1.5 h-10" /></div>
          </div>
        </div>
        <DialogFooter className="mt-2">
          <Button onClick={editingTx ? updateTransaction : addTransaction}
            className={`w-full h-11 text-sm font-semibold ${txType === 'payment' ? 'bg-green-600 hover:bg-green-700' : ''}`}
          >{editingTx ? 'Update Entry' : txType === 'payment' ? '✓ Record Payment' : '+ Add Entry'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  const renderDeleteTxDialog = () => (
    <AlertDialog open={!!showDeleteTx} onOpenChange={() => setShowDeleteTx(null)}>
      <AlertDialogContent>
        <AlertDialogHeader><AlertDialogTitle>Delete Entry?</AlertDialogTitle><AlertDialogDescription>This will permanently remove this ledger entry.</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={deleteTransaction} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  const renderEditPartyDialog = () => (
    <Dialog open={!!editingParty} onOpenChange={(open) => { if (!open) { setEditingParty(null); setNewName(''); setNewPhone(''); setNewAddress(''); setNewPartyNotes(''); } }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10"><User className="h-5 w-5 text-primary" /></div>
            <DialogTitle className="text-base">Edit Party Details</DialogTitle>
          </div>
        </DialogHeader>
        <div className="space-y-4 mt-2">
          <div><Label className="text-xs">Name *</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} className="mt-1.5" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label className="text-xs">Phone</Label><Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} className="mt-1.5" /></div>
            <div><Label className="text-xs">Address</Label><Input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} className="mt-1.5" /></div>
          </div>
          <div><Label className="text-xs">Notes</Label><Textarea value={newPartyNotes} onChange={(e) => setNewPartyNotes(e.target.value)} className="mt-1.5" rows={2} /></div>
        </div>
        <DialogFooter className="mt-2"><Button onClick={updateParty} className="w-full h-11 text-sm font-semibold">Update Party</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // ============ PARTY LEDGER VIEW ============
  if (selectedParty) {
    const ledger = filteredLedger;
    const ledgerTotalPages = Math.ceil(ledger.length / PAGE_SIZE);
    const paginatedLedger = ledger.slice(ledgerPage * PAGE_SIZE, (ledgerPage + 1) * PAGE_SIZE);
    return (
      <div className="p-4 lg:p-8 max-w-5xl mx-auto pb-24 lg:pb-8 section-enter">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={goBackFromParty}>
              <ChevronRight className="h-5 w-5 rotate-180" />
            </Button>
            <div>
              <h1 className="text-lg lg:text-2xl font-bold text-foreground tracking-tight">{selectedParty.name}</h1>
              <div className="flex items-center gap-3 mt-0.5">
                {selectedParty.phone && <span className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />{selectedParty.phone}</span>}
                {selectedParty.address && <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />{selectedParty.address}</span>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Desktop export buttons */}
            <div className="hidden lg:flex items-center gap-1.5">
              <Button variant="outline" size="sm" onClick={exportPartyPDF}><Download className="h-3.5 w-3.5 mr-1.5" />PDF</Button>
              <Button variant="outline" size="sm" onClick={exportPartyExcel}><FileSpreadsheet className="h-3.5 w-3.5 mr-1.5" />Excel</Button>
              <Button variant="outline" size="sm" onClick={sharePartyWhatsApp}><Share2 className="h-3.5 w-3.5 mr-1.5" />WhatsApp</Button>
              <Button variant="outline" size="sm" onClick={() => openEditParty(selectedParty)}><Edit2 className="h-3.5 w-3.5 mr-1.5" />Edit</Button>
            </div>
            {/* Mobile menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 lg:hidden"><MoreVertical className="h-4 w-4" /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => openEditParty(selectedParty)}><Edit2 className="h-3.5 w-3.5 mr-2" />Edit Party</DropdownMenuItem>
                <DropdownMenuItem onClick={exportPartyPDF}><Download className="h-3.5 w-3.5 mr-2" />Export PDF</DropdownMenuItem>
                <DropdownMenuItem onClick={exportPartyExcel}><FileSpreadsheet className="h-3.5 w-3.5 mr-2" />Export Excel</DropdownMenuItem>
                <DropdownMenuItem onClick={sharePartyWhatsApp}><Share2 className="h-3.5 w-3.5 mr-2" />Share WhatsApp</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Summary Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className={`rounded-2xl p-4 lg:p-5 col-span-2 lg:col-span-1 ${pendingBalance > 0 ? 'bg-destructive/10 border border-destructive/20' : 'bg-green-500/10 border border-green-500/20'}`}
          >
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Pending Balance</p>
            <p className={`text-2xl lg:text-3xl font-extrabold tracking-tight ${pendingBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>
              {formatFullCurrency(Math.abs(pendingBalance))}
            </p>
            {pendingBalance < 0 && <p className="text-xs text-green-600 mt-1 font-medium">Overpaid</p>}
          </motion.div>
          <Card className="border-border/50"><CardContent className="p-3 lg:p-4">
            <div className="flex items-center gap-1.5 mb-1"><ArrowUpRight className="h-3.5 w-3.5 text-destructive" /><span className="text-[10px] font-semibold text-muted-foreground uppercase">Debit</span></div>
            <p className="text-sm lg:text-base font-bold text-foreground">{formatCompactCurrency(totalDebits)}</p>
          </CardContent></Card>
          <Card className="border-border/50"><CardContent className="p-3 lg:p-4">
            <div className="flex items-center gap-1.5 mb-1"><ArrowDownRight className="h-3.5 w-3.5 text-green-600" /><span className="text-[10px] font-semibold text-muted-foreground uppercase">Credit</span></div>
            <p className="text-sm lg:text-base font-bold text-foreground">{formatCompactCurrency(totalCredits)}</p>
          </CardContent></Card>
          <Card className="border-border/50 hidden lg:block"><CardContent className="p-3 lg:p-4">
            <div className="flex items-center gap-1.5 mb-1"><CreditCard className="h-3.5 w-3.5 text-primary" /><span className="text-[10px] font-semibold text-muted-foreground uppercase">Entries</span></div>
            <p className="text-sm lg:text-base font-bold text-foreground">{allTransactions.length}</p>
          </CardContent></Card>
        </div>

        {/* Fuel & Tyre Breakdown */}
        {(dieselTotal > 0 || petrolTotal > 0 || tyreTotal > 0) && (
          <div className="grid grid-cols-3 gap-2 mb-5">
            {dieselTotal > 0 && <Card className="border-blue-800/20 bg-blue-900/5"><CardContent className="p-3"><p className="text-[10px] font-semibold text-blue-400 uppercase">Diesel</p><p className="text-xs font-bold text-foreground mt-0.5">{formatCompactCurrency(dieselTotal)}</p><p className="text-[10px] text-muted-foreground">{dieselLitres.toFixed(1)} L</p></CardContent></Card>}
            {petrolTotal > 0 && <Card className="border-emerald-500/20 bg-emerald-500/5"><CardContent className="p-3"><p className="text-[10px] font-semibold text-emerald-400 uppercase">Petrol</p><p className="text-xs font-bold text-foreground mt-0.5">{formatCompactCurrency(petrolTotal)}</p><p className="text-[10px] text-muted-foreground">{petrolLitres.toFixed(1)} L</p></CardContent></Card>}
            {tyreTotal > 0 && <Card className="border-accent/20 bg-accent/5"><CardContent className="p-3"><p className="text-[10px] font-semibold text-accent uppercase">Tyre</p><p className="text-xs font-bold text-foreground mt-0.5">{formatCompactCurrency(tyreTotal)}</p></CardContent></Card>}
          </div>
        )}

        {/* Period Controls + Presets */}
        <div className="space-y-3 mb-5">
          <div className="flex flex-wrap items-center gap-2">
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-3 h-7">All Time</TabsTrigger>
                <TabsTrigger value="monthly" className="text-xs px-3 h-7">Monthly</TabsTrigger>
                <TabsTrigger value="range" className="text-xs px-3 h-7">Date Range</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex-1" />
            <Tabs value={ledgerFilter} onValueChange={(v) => setLedgerFilter(v as any)}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-2.5 h-7">All</TabsTrigger>
                <TabsTrigger value="debit" className="text-xs px-2.5 h-7">Debit</TabsTrigger>
                <TabsTrigger value="credit" className="text-xs px-2.5 h-7">Credit</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap gap-1.5">
            {[
              { key: '7d', label: 'Last 7 days' },
              { key: '30d', label: 'Last 30 days' },
              { key: 'quarter', label: 'This Quarter' },
              { key: 'year', label: 'This Year' },
            ].map(p => (
              <Button key={p.key} variant="outline" size="sm"
                className={`h-7 text-[11px] px-2.5 rounded-full ${
                  viewMode === 'range' && rangeStart && (
                    (p.key === '7d' && format(rangeStart, 'yyyy-MM-dd') === format(subDays(new Date(), 7), 'yyyy-MM-dd')) ||
                    (p.key === '30d' && format(rangeStart, 'yyyy-MM-dd') === format(subDays(new Date(), 30), 'yyyy-MM-dd')) ||
                    (p.key === 'quarter' && format(rangeStart, 'yyyy-MM-dd') === format(startOfQuarter(new Date()), 'yyyy-MM-dd')) ||
                    (p.key === 'year' && format(rangeStart, 'yyyy-MM-dd') === format(startOfYear(new Date()), 'yyyy-MM-dd'))
                  ) ? 'bg-primary text-primary-foreground border-primary hover:bg-primary/90' : ''
                }`}
                onClick={() => applyPreset(p.key)}
              >
                <Clock className="h-3 w-3 mr-1" />{p.label}
              </Button>
            ))}
          </div>

          {viewMode === 'monthly' && (
            <div className="grid grid-cols-2 gap-2">
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{months.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}</SelectContent>
              </Select>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                <SelectContent>{[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          )}

          {viewMode === 'range' && (
            <div className="grid grid-cols-2 gap-2">
              <Popover open={rangeStartOpen} onOpenChange={setRangeStartOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start h-9 text-xs">
                    <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    {rangeStart ? format(rangeStart, 'dd MMM yyyy') : 'Start date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={rangeStart} onSelect={(d) => { setRangeStart(d); setRangeStartOpen(false); }} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
              <Popover open={rangeEndOpen} onOpenChange={setRangeEndOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start h-9 text-xs">
                    <CalendarIcon className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                    {rangeEnd ? format(rangeEnd, 'dd MMM yyyy') : 'End date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar mode="single" selected={rangeEnd} onSelect={(d) => { setRangeEnd(d); setRangeEndOpen(false); }} initialFocus className="p-3 pointer-events-auto" />
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-4 gap-2 mb-5">
          <Button size="sm" className="h-10 text-xs" onClick={() => { setTxType('petroleum'); setShowAddTransaction(true); }}><Fuel className="h-3.5 w-3.5 mr-1" />Fuel</Button>
          <Button size="sm" variant="secondary" className="h-10 text-xs" onClick={() => { setTxType('tyre'); setShowAddTransaction(true); }}><CircleDot className="h-3.5 w-3.5 mr-1" />Tyre</Button>
          <Button size="sm" variant="secondary" className="h-10 text-xs" onClick={() => { setTxType('debit'); setShowAddTransaction(true); }}><ArrowUpRight className="h-3.5 w-3.5 mr-1" />Debit</Button>
          <Button size="sm" className="h-10 text-xs bg-green-600 hover:bg-green-700" onClick={() => { setTxType('payment'); setShowAddTransaction(true); }}><Banknote className="h-3.5 w-3.5 mr-1" />Credit</Button>
        </div>

        {/* Ledger Header */}
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
          Ledger · {filteredLedger.length} entries
        </p>

        {/* Desktop Table View */}
        <div className="hidden lg:block">
          <div className="rounded-xl border border-border/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border/50">
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Date</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Type</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Details</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Debit</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Credit</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Balance</th>
                  <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLedger.map((tx) => {
                  const isCredit = tx.transaction_type === 'payment';
                  const fuelLabel = getFuelTypeLabel(tx);
                  return (
                    <tr key={tx.id} className="border-b border-border/30 hover:bg-muted/30 transition-colors">
                      <td className="p-3 text-foreground font-mono text-xs">{format(new Date(tx.date), 'dd MMM yyyy')}</td>
                      <td className="p-3">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${
                          isCredit ? 'bg-green-500/15 text-green-600' : 'bg-destructive/10 text-destructive'
                        }`}>
                          {tx.transaction_type === 'payment' ? 'Credit' : tx.transaction_type === 'petroleum' ? 'Petroleum' : tx.transaction_type === 'tyre' ? 'Tyre' : 'Debit'}
                        </span>
                        {fuelLabel && <Badge variant="outline" className={`ml-1.5 text-[10px] px-1.5 py-0 h-5 ${tx.fuel_type === 'diesel' ? 'border-blue-500/40 text-blue-400' : 'border-emerald-500/40 text-emerald-400'}`}>{fuelLabel}</Badge>}
                      </td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {tx.litres && <span>{tx.litres}L</span>}
                        {tx.rate_per_litre && <span> @ ₹{tx.rate_per_litre}/L</span>}
                        {tx.tyre_name && <span>{tx.tyre_name}</span>}
                        {tx.notes && <span className="italic ml-1">· {tx.notes}</span>}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-sm text-destructive">{!isCredit ? `₹${Number(tx.amount).toLocaleString('en-IN')}` : ''}</td>
                      <td className="p-3 text-right font-mono font-bold text-sm text-green-600">{isCredit ? `₹${Number(tx.amount).toLocaleString('en-IN')}` : ''}</td>
                      <td className={`p-3 text-right font-mono font-bold text-sm ${tx.runningBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>₹{tx.runningBalance.toLocaleString('en-IN')}</td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end gap-0.5">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditTx(tx)}><Edit2 className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowDeleteTx(tx)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {ledger.length === 0 && (
              <div className="text-center py-16">
                <CreditCard className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No entries found</p>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-1.5 max-h-[50vh] overflow-y-auto">
          <AnimatePresence>
            {paginatedLedger.map((tx, i) => {
              const isCredit = tx.transaction_type === 'payment';
              const icon = tx.transaction_type === 'payment' ? <Banknote className="h-3.5 w-3.5" />
                : tx.transaction_type === 'petroleum' ? <Fuel className="h-3.5 w-3.5" />
                : tx.transaction_type === 'tyre' ? <CircleDot className="h-3.5 w-3.5" />
                : <ArrowUpRight className="h-3.5 w-3.5" />;
              const typeLabel = tx.transaction_type === 'payment' ? 'Credit' : tx.transaction_type === 'petroleum' ? 'Petroleum' : tx.transaction_type === 'tyre' ? 'Tyre' : 'Debit';
              const fuelLabel = getFuelTypeLabel(tx);
              return (
                <motion.div key={tx.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.02, 0.3), duration: 0.2 }}>
                  <Card className={`border-border/40 ${isCredit ? 'border-l-2 border-l-green-500' : 'border-l-2 border-l-destructive/50'}`}>
                    <CardContent className="p-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md ${isCredit ? 'bg-green-500/15 text-green-600' : 'bg-destructive/10 text-destructive'}`}>{icon}{typeLabel}</span>
                            {fuelLabel && <Badge variant="outline" className={`text-[10px] px-1.5 py-0 h-5 ${tx.fuel_type === 'diesel' ? 'border-blue-500/40 text-blue-400' : 'border-emerald-500/40 text-emerald-400'}`}>{fuelLabel}</Badge>}
                            <span className={`font-bold text-sm ${isCredit ? 'text-green-600' : 'text-foreground'}`}>{isCredit ? '-' : '+'}₹{Number(tx.amount).toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                            <span>{format(new Date(tx.date), 'dd MMM yyyy')}</span>
                            {tx.litres && <span>· {tx.litres}L</span>}
                            {tx.rate_per_litre && <span>@ ₹{tx.rate_per_litre}/L</span>}
                            {tx.tyre_name && <span>· {tx.tyre_name}</span>}
                          </div>
                          {tx.notes && <p className="text-[11px] text-muted-foreground/70 mt-0.5 italic">{tx.notes}</p>}
                          <p className="text-[11px] font-mono text-muted-foreground/60 mt-0.5">Bal: <span className={tx.runningBalance > 0 ? 'text-destructive' : 'text-green-600'}>₹{tx.runningBalance.toLocaleString('en-IN')}</span></p>
                        </div>
                        <div className="flex gap-0.5 ml-2">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEditTx(tx)}><Edit2 className="h-3 w-3" /></Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowDeleteTx(tx)}><Trash2 className="h-3 w-3 text-destructive" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
          {ledger.length === 0 && (
            <div className="text-center py-12">
              <CreditCard className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No entries found</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Add a transaction to get started</p>
            </div>
          )}
        </div>

        {renderTransactionDialog()}
        {renderDeleteTxDialog()}
        {renderEditPartyDialog()}
        <TablePagination
          currentPage={ledgerPage}
          totalPages={ledgerTotalPages}
          totalCount={ledger.length}
          pageSize={PAGE_SIZE}
          hasNext={ledgerPage < ledgerTotalPages - 1}
          hasPrev={ledgerPage > 0}
          onNext={() => setLedgerPage(p => p + 1)}
          onPrev={() => setLedgerPage(p => p - 1)}
        />
      </div>
    );
  }

  // ============ PARTY LIST VIEW ============
  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto pb-24 lg:pb-8 section-enter">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">Credit Parties</h1>
          <p className="text-xs lg:text-sm text-muted-foreground mt-0.5">Petroleum & Tyre credit ledger</p>
        </div>
        <Button size="sm" onClick={() => setShowAddParty(true)} className="h-9 lg:h-10 lg:px-5">
          <Plus className="h-4 w-4 mr-1.5" />Add Party
        </Button>
      </div>

      {/* Portfolio Summary */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl bg-primary p-5 lg:p-6 mb-6"
      >
        <p className="text-[10px] lg:text-xs font-bold text-primary-foreground/50 uppercase tracking-wider mb-3">Portfolio Overview</p>
        <div className="grid grid-cols-3 gap-4 lg:gap-8">
          <div>
            <p className="text-2xl lg:text-3xl font-extrabold text-primary-foreground tracking-tight">
              <AnimatedNumber value={totalPortfolioPending} prefix="₹" />
            </p>
            <p className="text-[10px] lg:text-xs text-primary-foreground/50 font-medium mt-0.5">Total Pending</p>
          </div>
          <div>
            <p className="text-sm lg:text-lg font-bold text-primary-foreground/80">{formatCompactCurrency(totalPortfolioDebit)}</p>
            <p className="text-[10px] lg:text-xs text-primary-foreground/50 font-medium mt-0.5">Total Debit</p>
          </div>
          <div>
            <p className="text-sm lg:text-lg font-bold text-primary-foreground/80">{formatCompactCurrency(totalPortfolioCredit)}</p>
            <p className="text-[10px] lg:text-xs text-primary-foreground/50 font-medium mt-0.5">Total Credit</p>
          </div>
        </div>
      </motion.div>

      {/* Search & Sort */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search parties..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-10 lg:h-11" />
        </div>
        <Select value={sortBy} onValueChange={(v) => setSortBy(v as any)}>
          <SelectTrigger className="w-[130px] h-10 lg:h-11"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="balance">By Balance</SelectItem>
            <SelectItem value="name">By Name</SelectItem>
            <SelectItem value="recent">By Recent</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Party Count */}
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-3">
        {filteredParties.length} {filteredParties.length === 1 ? 'Party' : 'Parties'}
      </p>

      {/* Desktop Table View */}
      {isLoading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : (
        <>
          {/* Desktop */}
          <div className="hidden lg:block rounded-xl border border-border/50 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted/50 border-b border-border/50">
                  <th className="text-left p-3.5 text-xs font-semibold text-muted-foreground uppercase">Party</th>
                  <th className="text-left p-3.5 text-xs font-semibold text-muted-foreground uppercase">Contact</th>
                  <th className="text-right p-3.5 text-xs font-semibold text-muted-foreground uppercase">Debit</th>
                  <th className="text-right p-3.5 text-xs font-semibold text-muted-foreground uppercase">Credit</th>
                  <th className="text-right p-3.5 text-xs font-semibold text-muted-foreground uppercase">Pending</th>
                  <th className="text-center p-3.5 text-xs font-semibold text-muted-foreground uppercase">Status</th>
                  <th className="text-right p-3.5 text-xs font-semibold text-muted-foreground uppercase">Last Txn</th>
                  <th className="text-right p-3.5 text-xs font-semibold text-muted-foreground uppercase w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedParties.map((party) => (
                  <tr key={party.id}
                    className="border-b border-border/30 hover:bg-muted/30 transition-colors cursor-pointer"
                    onClick={() => selectParty(party)}
                  >
                    <td className="p-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-primary">{party.name.charAt(0)}</span>
                        </div>
                        <div>
                          <p className="font-semibold text-foreground">{party.name}</p>
                          <p className="text-[11px] text-muted-foreground">{party.txCount} entries</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3.5 text-xs text-muted-foreground">
                      {party.phone && <span className="flex items-center gap-1"><Phone className="h-3 w-3" />{party.phone}</span>}
                    </td>
                    <td className="p-3.5 text-right font-mono text-sm text-foreground">{formatCompactCurrency(party.totalDebit)}</td>
                    <td className="p-3.5 text-right font-mono text-sm text-green-600">{formatCompactCurrency(party.totalCredit)}</td>
                    <td className={`p-3.5 text-right font-mono text-sm font-bold ${party.pendingBalance > 0 ? 'text-destructive' : party.pendingBalance < 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                      {party.pendingBalance !== 0 ? formatFullCurrency(Math.abs(party.pendingBalance)) : '—'}
                    </td>
                    <td className="p-3.5 text-center">
                      {party.pendingBalance > 0 && <Badge variant="outline" className="text-[9px] h-5 px-2 border-destructive/30 text-destructive bg-destructive/5">Pending</Badge>}
                      {party.pendingBalance === 0 && party.totalDebit > 0 && <Badge variant="outline" className="text-[9px] h-5 px-2 border-green-500/30 text-green-600 bg-green-500/5">Settled</Badge>}
                      {party.pendingBalance < 0 && <Badge variant="outline" className="text-[9px] h-5 px-2 border-blue-500/30 text-blue-500 bg-blue-500/5">Overpaid</Badge>}
                    </td>
                    <td className="p-3.5 text-right text-xs text-muted-foreground">
                      {party.lastTransactionDate ? format(new Date(party.lastTransactionDate), 'dd MMM yyyy') : '—'}
                    </td>
                    <td className="p-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-7 w-7"><MoreVertical className="h-3.5 w-3.5" /></Button></DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditParty(party)}><Edit2 className="h-3.5 w-3.5 mr-2" />Edit</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setShowDeleteConfirm(party.id)} className="text-destructive"><Trash2 className="h-3.5 w-3.5 mr-2" />Remove</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredParties.length === 0 && (
              <div className="text-center py-16">
                <CreditCard className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">No parties found</p>
              </div>
            )}
          </div>

          {/* Mobile Cards */}
          <div className="lg:hidden space-y-2">
            {paginatedParties.map((party, i) => (
              <motion.div key={party.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.25 }}>
                <Card className="cursor-pointer card-hover border-border/50 overflow-hidden" onClick={() => selectParty(party)}>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-bold text-primary">{party.name.charAt(0)}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-foreground text-sm truncate">{party.name}</p>
                          <p className={`text-sm font-bold tabular-nums ${party.pendingBalance > 0 ? 'text-destructive' : party.pendingBalance < 0 ? 'text-green-600' : 'text-muted-foreground'}`}>
                            {party.pendingBalance !== 0 ? formatFullCurrency(Math.abs(party.pendingBalance)) : '—'}
                          </p>
                        </div>
                        <div className="flex items-center justify-between mt-0.5">
                          <div className="flex items-center gap-2">
                            {party.phone && <span className="text-[11px] text-muted-foreground flex items-center gap-0.5"><Phone className="h-2.5 w-2.5" />{party.phone}</span>}
                          </div>
                          <div className="flex items-center gap-1.5">
                            {party.pendingBalance > 0 && <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-destructive/30 text-destructive bg-destructive/5">Pending</Badge>}
                            {party.pendingBalance === 0 && party.totalDebit > 0 && <Badge variant="outline" className="text-[9px] h-4 px-1.5 border-green-500/30 text-green-600 bg-green-500/5">Settled</Badge>}
                            {party.lastTransactionDate && <span className="text-[10px] text-muted-foreground/50">{format(new Date(party.lastTransactionDate), 'dd MMM')}</span>}
                          </div>
                        </div>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/40 flex-shrink-0" />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
            {filteredParties.length === 0 && (
              <div className="text-center py-16">
                <CreditCard className="h-12 w-12 text-muted-foreground/20 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground font-medium">No parties found</p>
                <p className="text-xs text-muted-foreground/60 mt-1">Add a credit party to start tracking</p>
              </div>
            )}
          </div>
        </>
      )}

      <TablePagination
        currentPage={partyPage}
        totalPages={partyTotalPages}
        totalCount={filteredParties.length}
        pageSize={PAGE_SIZE}
        hasNext={partyPage < partyTotalPages - 1}
        hasPrev={partyPage > 0}
        onNext={() => setPartyPage(p => p + 1)}
        onPrev={() => setPartyPage(p => p - 1)}
      />

      {/* Add Party Dialog */}
      <Dialog open={showAddParty} onOpenChange={setShowAddParty}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-primary/10"><Plus className="h-5 w-5 text-primary" /></div>
              <div>
                <DialogTitle className="text-base">Add Credit Party</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Create a new party for credit tracking</p>
              </div>
            </div>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div><Label className="text-xs">Party Name *</Label><Input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Enter party name" className="mt-1.5" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Phone</Label><Input value={newPhone} onChange={(e) => setNewPhone(e.target.value)} placeholder="Phone number" className="mt-1.5" /></div>
              <div><Label className="text-xs">Address</Label><Input value={newAddress} onChange={(e) => setNewAddress(e.target.value)} placeholder="Address" className="mt-1.5" /></div>
            </div>
            <div><Label className="text-xs">Notes</Label><Textarea value={newPartyNotes} onChange={(e) => setNewPartyNotes(e.target.value)} placeholder="Any additional notes" className="mt-1.5" rows={2} /></div>
          </div>
          <DialogFooter className="mt-2"><Button onClick={addParty} className="w-full h-11 text-sm font-semibold">Add Party</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Party Confirm */}
      <AlertDialog open={!!showDeleteConfirm} onOpenChange={() => setShowDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Remove Party?</AlertDialogTitle><AlertDialogDescription>This will hide the party from the list. All transactions are preserved.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => showDeleteConfirm && deleteParty(showDeleteConfirm)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {renderEditPartyDialog()}
    </div>
  );
};

export default CreditPartiesSection;
