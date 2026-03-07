import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Factory, Clock, AlertTriangle, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';

interface ProductionEntryProps {
  onBack: () => void;
}

const PRODUCTS = ['20MM', '40MM', 'Dust', '10MM', 'Gitti'];

const ProductionEntrySection = ({ onBack }: ProductionEntryProps) => {
  const [entries, setEntries] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [newEntry, setNewEntry] = useState({
    date: format(new Date(), 'yyyy-MM-dd'), crusher_hours: '', product_name: '20MM', quantity_produced: '', downtime_hours: '', downtime_reason: '', notes: ''
  });
  const [editForm, setEditForm] = useState({
    date: '', crusher_hours: '', product_name: '', quantity_produced: '', downtime_hours: '', downtime_reason: '', notes: ''
  });

  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => { fetchData(); }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    const start = format(startOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
    const end = format(endOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
    const { data } = await supabase.from('production_entries').select('*').gte('date', start).lte('date', end).order('date', { ascending: false });
    setEntries(data || []);
  };

  const handleAdd = async () => {
    if (!newEntry.quantity_produced || !newEntry.crusher_hours) { toast.error('Fill required fields'); return; }
    const { error } = await supabase.from('production_entries').insert({
      date: newEntry.date, crusher_hours: parseFloat(newEntry.crusher_hours),
      product_name: newEntry.product_name, quantity_produced: parseFloat(newEntry.quantity_produced),
      downtime_hours: parseFloat(newEntry.downtime_hours) || 0,
      downtime_reason: newEntry.downtime_reason || null, notes: newEntry.notes || null,
    });
    if (error) { toast.error('Failed'); return; }

    // Also update stock
    const stockRes = await supabase.from('stock_inventory').select('id, current_stock').eq('product_name', newEntry.product_name).single();
    if (stockRes.data) {
      await supabase.from('stock_inventory').update({ current_stock: Number(stockRes.data.current_stock) + parseFloat(newEntry.quantity_produced) }).eq('id', stockRes.data.id);
    }
    await supabase.from('stock_movements').insert({
      product_name: newEntry.product_name, movement_type: 'production', quantity: parseFloat(newEntry.quantity_produced), date: newEntry.date,
    });

    toast.success('Production entry added & stock updated!');
    setIsAddOpen(false);
    setNewEntry({ date: format(new Date(), 'yyyy-MM-dd'), crusher_hours: '', product_name: '20MM', quantity_produced: '', downtime_hours: '', downtime_reason: '', notes: '' });
    fetchData();
  };

  const handleDelete = async (entry: any) => {
    if (!confirm(`Delete ${entry.product_name} entry for ${format(new Date(entry.date), 'dd MMM')}?`)) return;
    const stockRes = await supabase.from('stock_inventory').select('id, current_stock').eq('product_name', entry.product_name).single();
    if (stockRes.data) {
      await supabase.from('stock_inventory').update({ current_stock: Math.max(0, Number(stockRes.data.current_stock) - Number(entry.quantity_produced)) }).eq('id', stockRes.data.id);
    }
    await supabase.from('stock_movements').delete().eq('product_name', entry.product_name).eq('date', entry.date).eq('movement_type', 'production').eq('quantity', entry.quantity_produced);
    await supabase.from('production_entries').delete().eq('id', entry.id);
    toast.success('Entry deleted & stock reversed');
    fetchData();
  };

  const openEdit = (entry: any) => {
    setEditingEntry(entry);
    setEditForm({
      date: entry.date, crusher_hours: String(entry.crusher_hours), product_name: entry.product_name,
      quantity_produced: String(entry.quantity_produced), downtime_hours: String(entry.downtime_hours || ''),
      downtime_reason: entry.downtime_reason || '', notes: entry.notes || '',
    });
    setIsEditOpen(true);
  };

  const handleEdit = async () => {
    if (!editingEntry) return;
    const oldQty = Number(editingEntry.quantity_produced);
    const newQty = parseFloat(editForm.quantity_produced);
    const qtyDiff = newQty - oldQty;

    const { error } = await supabase.from('production_entries').update({
      date: editForm.date, crusher_hours: parseFloat(editForm.crusher_hours),
      product_name: editForm.product_name, quantity_produced: newQty,
      downtime_hours: parseFloat(editForm.downtime_hours) || 0,
      downtime_reason: editForm.downtime_reason || null, notes: editForm.notes || null,
    }).eq('id', editingEntry.id);
    if (error) { toast.error('Failed to update'); return; }

    // Adjust stock if quantity changed
    if (qtyDiff !== 0) {
      const stockRes = await supabase.from('stock_inventory').select('id, current_stock').eq('product_name', editForm.product_name).single();
      if (stockRes.data) {
        await supabase.from('stock_inventory').update({ current_stock: Math.max(0, Number(stockRes.data.current_stock) + qtyDiff) }).eq('id', stockRes.data.id);
      }
    }

    toast.success('Entry updated');
    setIsEditOpen(false);
    setEditingEntry(null);
    fetchData();
  };

  const totalProduction = entries.reduce((s, e) => s + Number(e.quantity_produced), 0);
  const totalHours = entries.reduce((s, e) => s + Number(e.crusher_hours), 0);
  const totalDowntime = entries.reduce((s, e) => s + Number(e.downtime_hours || 0), 0);
  const efficiency = totalHours > 0 ? (((totalHours - totalDowntime) / totalHours) * 100).toFixed(1) : '—';

  const productWise: Record<string, number> = {};
  entries.forEach(e => { productWise[e.product_name] = (productWise[e.product_name] || 0) + Number(e.quantity_produced); });

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-bold text-foreground">🏭 Production Entry</h1>
      </div>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <Select value={selectedMonth.toString()} onValueChange={v => setSelectedMonth(parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{months.map((m, i) => <SelectItem key={i} value={(i+1).toString()}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{[2024,2025,2026,2027].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        <Card><CardContent className="p-3 text-center">
          <Factory className="h-4 w-4 mx-auto text-primary mb-1" />
          <p className="text-lg font-bold text-foreground">{totalProduction.toLocaleString()} T</p>
          <p className="text-xs text-muted-foreground">Total Production</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <Clock className="h-4 w-4 mx-auto text-primary mb-1" />
          <p className="text-lg font-bold text-foreground">{totalHours}h</p>
          <p className="text-xs text-muted-foreground">Crusher Hours</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <AlertTriangle className="h-4 w-4 mx-auto text-orange-600 mb-1" />
          <p className="text-lg font-bold text-foreground">{totalDowntime}h</p>
          <p className="text-xs text-muted-foreground">Downtime</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-lg font-bold text-foreground">{efficiency}%</p>
          <p className="text-xs text-muted-foreground">Efficiency</p>
        </CardContent></Card>
      </div>

      {Object.keys(productWise).length > 0 && (
        <Card className="mb-4"><CardContent className="p-3">
          <p className="text-xs font-bold text-foreground mb-2">Product Breakdown</p>
          {Object.entries(productWise).map(([name, qty]) => (
            <div key={name} className="flex justify-between py-1 text-sm">
              <span className="text-muted-foreground">{name}</span>
              <span className="font-bold text-foreground">{qty.toLocaleString()} T</span>
            </div>
          ))}
        </CardContent></Card>
      )}

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogTrigger asChild><Button className="w-full mb-4"><Plus className="h-4 w-4 mr-1" /> Add Production Entry</Button></DialogTrigger>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Production Entry</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Date</Label><Input type="date" value={newEntry.date} onChange={e => setNewEntry({...newEntry, date: e.target.value})} /></div>
            <div><Label>Product</Label>
              <Select value={newEntry.product_name} onValueChange={v => setNewEntry({...newEntry, product_name: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRODUCTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Quantity Produced (tonnes) *</Label><Input type="number" value={newEntry.quantity_produced} onChange={e => setNewEntry({...newEntry, quantity_produced: e.target.value})} /></div>
            <div><Label>Crusher Hours *</Label><Input type="number" value={newEntry.crusher_hours} onChange={e => setNewEntry({...newEntry, crusher_hours: e.target.value})} /></div>
            <div><Label>Downtime Hours</Label><Input type="number" value={newEntry.downtime_hours} onChange={e => setNewEntry({...newEntry, downtime_hours: e.target.value})} /></div>
            <div><Label>Downtime Reason</Label><Input value={newEntry.downtime_reason} onChange={e => setNewEntry({...newEntry, downtime_reason: e.target.value})} /></div>
            <div><Label>Notes</Label><Textarea value={newEntry.notes} onChange={e => setNewEntry({...newEntry, notes: e.target.value})} /></div>
            <Button className="w-full" onClick={handleAdd}>Save Entry</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Production Entry</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Date</Label><Input type="date" value={editForm.date} onChange={e => setEditForm({...editForm, date: e.target.value})} /></div>
            <div><Label>Product</Label>
              <Select value={editForm.product_name} onValueChange={v => setEditForm({...editForm, product_name: v})}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{PRODUCTS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>Quantity (tonnes)</Label><Input type="number" value={editForm.quantity_produced} onChange={e => setEditForm({...editForm, quantity_produced: e.target.value})} /></div>
            <div><Label>Crusher Hours</Label><Input type="number" value={editForm.crusher_hours} onChange={e => setEditForm({...editForm, crusher_hours: e.target.value})} /></div>
            <div><Label>Downtime Hours</Label><Input type="number" value={editForm.downtime_hours} onChange={e => setEditForm({...editForm, downtime_hours: e.target.value})} /></div>
            <div><Label>Downtime Reason</Label><Input value={editForm.downtime_reason} onChange={e => setEditForm({...editForm, downtime_reason: e.target.value})} /></div>
            <div><Label>Notes</Label><Textarea value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} /></div>
            <Button className="w-full" onClick={handleEdit}>Update Entry</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Entries list */}
      <div className="space-y-2">
        {entries.map(e => (
          <Card key={e.id}><CardContent className="p-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{e.product_name} - {format(new Date(e.date), 'dd MMM')}</p>
                <p className="text-xs text-muted-foreground">{e.crusher_hours}h running {e.downtime_hours > 0 ? `• ${e.downtime_hours}h down` : ''}</p>
                {e.downtime_reason && <p className="text-xs text-orange-600">{e.downtime_reason}</p>}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-bold text-foreground">{Number(e.quantity_produced).toLocaleString()} T</p>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(e)}>
                  <Pencil className="h-3 w-3 text-muted-foreground" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(e)}>
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              </div>
            </div>
          </CardContent></Card>
        ))}
        {entries.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No production entries this month</p>}
      </div>
    </div>
  );
};

export default ProductionEntrySection;
