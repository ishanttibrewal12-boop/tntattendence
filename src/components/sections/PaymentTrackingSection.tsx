import { useState, useEffect } from 'react';
import TablePagination from '@/components/ui/TablePagination';
import { ArrowLeft, Plus, IndianRupee, AlertTriangle, Clock, CheckCircle, CreditCard, TrendingUp, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';

interface PaymentTrackingProps {
  onBack: () => void;
}

interface Party {
  id: string;
  name: string;
  credit_limit: number;
  phone: string | null;
}

interface Payment {
  id: string;
  party_id: string;
  amount: number;
  payment_type: string;
  payment_mode: string;
  date: string;
  notes: string | null;
  created_at: string;
}

interface Transaction {
  id: string;
  party_id: string;
  amount: number;
  date: string;
  transaction_type: string;
}

const PaymentTrackingSection = ({ onBack }: PaymentTrackingProps) => {
  const [parties, setParties] = useState<Party[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedParty, setSelectedParty] = useState<string>('all');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isLimitOpen, setIsLimitOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [newPayment, setNewPayment] = useState({ party_id: '', amount: '', payment_mode: 'cash', notes: '', date: format(new Date(), 'yyyy-MM-dd') });
  const [editForm, setEditForm] = useState({ amount: '', payment_mode: 'cash', notes: '', date: '' });
  const [limitParty, setLimitParty] = useState({ id: '', limit: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [partiesRes, paymentsRes, txnRes] = await Promise.all([
      supabase.from('credit_parties').select('id, name, credit_limit, phone').eq('is_active', true),
      supabase.from('party_payments').select('*').order('date', { ascending: false }),
      supabase.from('credit_party_transactions').select('id, party_id, amount, date, transaction_type').order('date', { ascending: false }),
    ]);
    setParties((partiesRes.data as any[]) || []);
    setPayments(paymentsRes.data || []);
    setTransactions(txnRes.data || []);
  };

  const getPartyStats = (partyId: string) => {
    const partyTxns = transactions.filter(t => t.party_id === partyId);
    const partyPayments = payments.filter(p => p.party_id === partyId);
    const totalDebit = partyTxns.filter(t => t.transaction_type !== 'credit_payment').reduce((s, t) => s + Number(t.amount), 0);
    const totalCredit = partyTxns.filter(t => t.transaction_type === 'credit_payment').reduce((s, t) => s + Number(t.amount), 0);
    const totalReceived = partyPayments.filter(p => p.payment_type === 'received').reduce((s, p) => s + Number(p.amount), 0);
    const dueAmount = totalDebit - totalCredit - totalReceived;
    const lastPayment = partyPayments.length > 0 ? partyPayments[0] : null;
    const oldestUnpaid = partyTxns.filter(t => t.transaction_type !== 'credit_payment').sort((a, b) => a.date.localeCompare(b.date))[0];
    const overdueDays = oldestUnpaid && dueAmount > 0 ? differenceInDays(new Date(), new Date(oldestUnpaid.date)) : 0;
    return { totalDebit, totalCredit: totalCredit + totalReceived, dueAmount, overdueDays, lastPayment };
  };

  const handleAddPayment = async () => {
    if (!newPayment.party_id || !newPayment.amount) { toast.error('Select party and enter amount'); return; }
    const { error } = await supabase.from('party_payments').insert({
      party_id: newPayment.party_id, amount: parseFloat(newPayment.amount),
      payment_type: 'received', payment_mode: newPayment.payment_mode,
      date: newPayment.date, notes: newPayment.notes || null,
    });
    if (error) { toast.error('Failed to add payment'); return; }
    toast.success('Payment recorded!');
    setIsAddOpen(false);
    setNewPayment({ party_id: '', amount: '', payment_mode: 'cash', notes: '', date: format(new Date(), 'yyyy-MM-dd') });
    fetchData();
  };

  const handleDeletePayment = async (id: string) => {
    if (!confirm('Delete this payment?')) return;
    await supabase.from('party_payments').delete().eq('id', id);
    toast.success('Payment deleted');
    fetchData();
  };

  const handleEditPayment = async () => {
    if (!editingPayment) return;
    const { error } = await supabase.from('party_payments').update({
      amount: parseFloat(editForm.amount), payment_mode: editForm.payment_mode,
      date: editForm.date, notes: editForm.notes || null,
    }).eq('id', editingPayment.id);
    if (error) { toast.error('Failed to update'); return; }
    toast.success('Payment updated');
    setIsEditOpen(false);
    setEditingPayment(null);
    fetchData();
  };

  const openEditPayment = (p: Payment) => {
    setEditingPayment(p);
    setEditForm({ amount: String(p.amount), payment_mode: p.payment_mode || 'cash', notes: p.notes || '', date: p.date });
    setIsEditOpen(true);
  };

  const handleSetLimit = async () => {
    if (!limitParty.id) return;
    const { error } = await supabase.from('credit_parties').update({ credit_limit: parseFloat(limitParty.limit) || 0 }).eq('id', limitParty.id);
    if (error) { toast.error('Failed to update limit'); return; }
    toast.success('Credit limit updated!');
    setIsLimitOpen(false);
    fetchData();
  };

  const filteredParties = selectedParty === 'all' ? parties : parties.filter(p => p.id === selectedParty);
  const totalDue = parties.reduce((s, p) => s + Math.max(0, getPartyStats(p.id).dueAmount), 0);
  const totalReceived = payments.filter(p => p.payment_type === 'received').reduce((s, p) => s + Number(p.amount), 0);
  const overdueParties = parties.filter(p => getPartyStats(p.id).overdueDays > 30 && getPartyStats(p.id).dueAmount > 0);
  const overLimitParties = parties.filter(p => {
    const limit = Number(p.credit_limit);
    return limit > 0 && getPartyStats(p.id).dueAmount > limit;
  });

  const PARTY_PAGE_SIZE = 20;
  const [partyPage, setPartyPage] = useState(0);
  const [paymentPage, setPaymentPage] = useState(0);
  const PAYMENT_PAGE_SIZE = 20;

  useEffect(() => { setPartyPage(0); }, [selectedParty]);

  const partyTotalPages = Math.ceil(filteredParties.length / PARTY_PAGE_SIZE);
  const paginatedParties = filteredParties.slice(partyPage * PARTY_PAGE_SIZE, (partyPage + 1) * PARTY_PAGE_SIZE);

  const paymentTotalPages = Math.ceil(payments.length / PAYMENT_PAGE_SIZE);
  const paginatedPayments = payments.slice(paymentPage * PAYMENT_PAGE_SIZE, (paymentPage + 1) * PAYMENT_PAGE_SIZE);

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-bold text-foreground">💰 Payment Tracking</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <Card><CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-destructive/10"><IndianRupee className="h-4 w-4 text-destructive" /></div>
            <div><p className="text-lg font-bold text-foreground">₹{totalDue.toLocaleString()}</p><p className="text-xs text-muted-foreground">Total Due</p></div>
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-green-500/10"><CheckCircle className="h-4 w-4 text-green-600" /></div>
            <div><p className="text-lg font-bold text-foreground">₹{totalReceived.toLocaleString()}</p><p className="text-xs text-muted-foreground">Received</p></div>
          </div>
        </CardContent></Card>
      </div>

      {/* Alerts */}
      {overLimitParties.length > 0 && (
        <Card className="mb-3 border-destructive/50"><CardContent className="p-3">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-medium">⚠️ {overLimitParties.length} {overLimitParties.length === 1 ? 'party' : 'parties'} over credit limit!</p>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{overLimitParties.map(p => p.name).join(', ')}</div>
        </CardContent></Card>
      )}
      {overdueParties.length > 0 && (
        <Card className="mb-3 border-orange-500/50"><CardContent className="p-3">
          <div className="flex items-center gap-2 text-orange-600">
            <Clock className="h-4 w-4" />
            <p className="text-sm font-medium">🕐 {overdueParties.length} {overdueParties.length === 1 ? 'party' : 'parties'} overdue (&gt;30 days)</p>
          </div>
          <div className="mt-1 text-xs text-muted-foreground">{overdueParties.map(p => p.name).join(', ')}</div>
        </CardContent></Card>
      )}

      {/* Actions */}
      <div className="flex gap-2 mb-4">
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button className="flex-1" size="sm"><Plus className="h-4 w-4 mr-1" /> Record Payment</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Record Payment Received</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Party</Label>
                <Select value={newPayment.party_id} onValueChange={(v) => setNewPayment({...newPayment, party_id: v})}>
                  <SelectTrigger><SelectValue placeholder="Select party" /></SelectTrigger>
                  <SelectContent>{parties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Amount (₹)</Label><Input type="number" value={newPayment.amount} onChange={e => setNewPayment({...newPayment, amount: e.target.value})} /></div>
              <div><Label>Date</Label><Input type="date" value={newPayment.date} onChange={e => setNewPayment({...newPayment, date: e.target.value})} /></div>
              <div><Label>Mode</Label>
                <Select value={newPayment.payment_mode} onValueChange={(v) => setNewPayment({...newPayment, payment_mode: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="upi">UPI</SelectItem>
                    <SelectItem value="bank">Bank Transfer</SelectItem>
                    <SelectItem value="cheque">Cheque</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Notes</Label><Textarea value={newPayment.notes} onChange={e => setNewPayment({...newPayment, notes: e.target.value})} /></div>
              <Button className="w-full" onClick={handleAddPayment}>Save Payment</Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={isLimitOpen} onOpenChange={setIsLimitOpen}>
          <DialogTrigger asChild><Button variant="outline" size="sm"><CreditCard className="h-4 w-4 mr-1" /> Set Limit</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Set Credit Limit</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Party</Label>
                <Select value={limitParty.id} onValueChange={(v) => {
                  const p = parties.find(p => p.id === v);
                  setLimitParty({ id: v, limit: String(p?.credit_limit || 0) });
                }}>
                  <SelectTrigger><SelectValue placeholder="Select party" /></SelectTrigger>
                  <SelectContent>{parties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Credit Limit (₹)</Label><Input type="number" value={limitParty.limit} onChange={e => setLimitParty({...limitParty, limit: e.target.value})} /></div>
              <Button className="w-full" onClick={handleSetLimit}>Update Limit</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Payment Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Payment</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Amount (₹)</Label><Input type="number" value={editForm.amount} onChange={e => setEditForm({...editForm, amount: e.target.value})} /></div>
            <div><Label>Date</Label><Input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} /></div>
            <div><Label>Mode</Label>
              <Select value={editForm.payment_mode} onValueChange={(v) => setEditForm({...editForm, payment_mode: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="cheque">Cheque</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Notes</Label><Textarea value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} /></div>
            <Button className="w-full" onClick={handleEditPayment}>Update Payment</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filter */}
      <Select value={selectedParty} onValueChange={setSelectedParty}>
        <SelectTrigger className="mb-4"><SelectValue placeholder="Filter by party" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Parties</SelectItem>
          {parties.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
        </SelectContent>
      </Select>

      {/* Party Cards */}
      <div className="space-y-3">
        {filteredParties.map(party => {
          const stats = getPartyStats(party.id);
          const limit = Number(party.credit_limit);
          const isOverLimit = limit > 0 && stats.dueAmount > limit;
          const isOverdue = stats.overdueDays > 30 && stats.dueAmount > 0;
          return (
            <Card key={party.id} className={isOverLimit ? 'border-destructive/50' : isOverdue ? 'border-orange-500/50' : ''}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-foreground">{party.name}</h3>
                  <div className="flex gap-1">
                    {isOverLimit && <Badge variant="destructive" className="text-xs">Over Limit</Badge>}
                    {isOverdue && <Badge className="text-xs bg-orange-500">Overdue</Badge>}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-xs text-muted-foreground">Total Debit</p><p className="text-sm font-bold text-foreground">₹{stats.totalDebit.toLocaleString()}</p></div>
                  <div><p className="text-xs text-muted-foreground">Received</p><p className="text-sm font-bold text-green-600">₹{stats.totalCredit.toLocaleString()}</p></div>
                  <div><p className="text-xs text-muted-foreground">Due</p><p className="text-sm font-bold text-destructive">₹{Math.max(0, stats.dueAmount).toLocaleString()}</p></div>
                </div>
                {limit > 0 && (
                  <div className="mt-2 text-xs text-muted-foreground flex justify-between">
                    <span>Credit Limit: ₹{limit.toLocaleString()}</span>
                    <span>Used: {limit > 0 ? Math.round((stats.dueAmount / limit) * 100) : 0}%</span>
                  </div>
                )}
                {stats.lastPayment && (
                  <p className="text-xs text-muted-foreground mt-1">Last payment: ₹{Number(stats.lastPayment.amount).toLocaleString()} on {format(new Date(stats.lastPayment.date), 'dd MMM yyyy')}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Payments */}
      {payments.length > 0 && (
        <div className="mt-6">
          <h2 className="text-sm font-bold text-foreground mb-2">Recent Payments</h2>
          <div className="space-y-2">
            {payments.slice(0, 10).map(p => {
              const party = parties.find(pt => pt.id === p.party_id);
              return (
                <Card key={p.id}>
                  <CardContent className="p-3 flex items-center justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{party?.name || 'Unknown'}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(p.date), 'dd MMM yyyy')} • {p.payment_mode}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-green-600">₹{Number(p.amount).toLocaleString()}</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditPayment(p)}>
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeletePayment(p.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentTrackingSection;
