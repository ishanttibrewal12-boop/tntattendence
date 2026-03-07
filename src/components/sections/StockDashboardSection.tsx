import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Package, TrendingDown, TrendingUp, AlertTriangle, BarChart3, Trash2 } from 'lucide-react';
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
import { format } from 'date-fns';

interface StockDashboardProps {
  onBack: () => void;
}

interface StockItem {
  id: string;
  product_name: string;
  current_stock: number;
  unit: string;
  low_stock_threshold: number;
}

interface StockMovement {
  id: string;
  product_name: string;
  movement_type: string;
  quantity: number;
  date: string;
  notes: string | null;
  created_at: string;
}

const StockDashboardSection = ({ onBack }: StockDashboardProps) => {
  const [stocks, setStocks] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [todayProduction, setTodayProduction] = useState(0);
  const [todayDispatch, setTodayDispatch] = useState(0);
  const [newMovement, setNewMovement] = useState({
    product_name: '', movement_type: 'production', quantity: '', notes: '', date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const [stockRes, movRes, dispatchRes, prodRes] = await Promise.all([
      supabase.from('stock_inventory').select('*').order('product_name'),
      supabase.from('stock_movements').select('*').order('created_at', { ascending: false }).limit(50),
      supabase.from('dispatch_reports').select('quantity').eq('date', today),
      supabase.from('production_entries').select('quantity_produced').eq('date', today),
    ]);
    setStocks((stockRes.data as any[]) || []);
    setMovements((movRes.data as any[]) || []);
    setTodayDispatch((dispatchRes.data || []).reduce((s: number, d: any) => s + Number(d.quantity), 0));
    setTodayProduction((prodRes.data || []).reduce((s: number, p: any) => s + Number(p.quantity_produced), 0));
  };

  const handleAddMovement = async () => {
    if (!newMovement.product_name || !newMovement.quantity) { toast.error('Fill required fields'); return; }
    const qty = parseFloat(newMovement.quantity);
    
    // Add movement record
    const { error: movError } = await supabase.from('stock_movements').insert({
      product_name: newMovement.product_name,
      movement_type: newMovement.movement_type,
      quantity: qty,
      date: newMovement.date,
      notes: newMovement.notes || null,
    });
    if (movError) { toast.error('Failed to add'); return; }

    // Update stock
    const stock = stocks.find(s => s.product_name === newMovement.product_name);
    if (stock) {
      const newStock = newMovement.movement_type === 'production' || newMovement.movement_type === 'purchase'
        ? stock.current_stock + qty
        : stock.current_stock - qty;
      await supabase.from('stock_inventory').update({ current_stock: Math.max(0, newStock) }).eq('id', stock.id);
    }

    toast.success('Stock updated!');
    setIsAddOpen(false);
    setNewMovement({ product_name: '', movement_type: 'production', quantity: '', notes: '', date: format(new Date(), 'yyyy-MM-dd') });
    fetchData();
  };

  const handleDeleteMovement = async (m: StockMovement) => {
    if (!confirm(`Delete ${m.product_name} ${m.movement_type} (${m.quantity}T)?`)) return;
    // Reverse stock
    const stock = stocks.find(s => s.product_name === m.product_name);
    if (stock) {
      const isAdd = m.movement_type === 'production' || m.movement_type === 'purchase';
      const newStock = isAdd ? stock.current_stock - m.quantity : stock.current_stock + m.quantity;
      await supabase.from('stock_inventory').update({ current_stock: Math.max(0, newStock) }).eq('id', stock.id);
    }
    await supabase.from('stock_movements').delete().eq('id', m.id);
    toast.success('Movement deleted & stock reversed');
    fetchData();
  };

  const lowStockItems = stocks.filter(s => s.current_stock < s.low_stock_threshold);
  const totalStock = stocks.reduce((s, st) => s + Number(st.current_stock), 0);

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-bold text-foreground">🏗 Live Stock Dashboard</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Card><CardContent className="p-3 text-center">
          <Package className="h-4 w-4 mx-auto text-primary mb-1" />
          <p className="text-lg font-bold text-foreground">{totalStock.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Stock</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <TrendingUp className="h-4 w-4 mx-auto text-green-600 mb-1" />
          <p className="text-lg font-bold text-foreground">{todayProduction}</p>
          <p className="text-xs text-muted-foreground">Today Prod.</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <TrendingDown className="h-4 w-4 mx-auto text-orange-600 mb-1" />
          <p className="text-lg font-bold text-foreground">{todayDispatch}</p>
          <p className="text-xs text-muted-foreground">Today Disp.</p>
        </CardContent></Card>
      </div>

      {/* Low Stock Alert */}
      {lowStockItems.length > 0 && (
        <Card className="mb-4 border-orange-500/50"><CardContent className="p-3">
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-bold">Low Stock Alert!</p>
          </div>
          {lowStockItems.map(s => (
            <p key={s.id} className="text-xs text-muted-foreground">{s.product_name}: {s.current_stock} {s.unit} (threshold: {s.low_stock_threshold})</p>
          ))}
        </CardContent></Card>
      )}

      {/* Stock Items */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-foreground">Stock Levels</h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Add Entry</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Stock Movement</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Product</Label>
                <Select value={newMovement.product_name} onValueChange={v => setNewMovement({...newMovement, product_name: v})}>
                  <SelectTrigger><SelectValue placeholder="Select product" /></SelectTrigger>
                  <SelectContent>{stocks.map(s => <SelectItem key={s.id} value={s.product_name}>{s.product_name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label>Type</Label>
                <Select value={newMovement.movement_type} onValueChange={v => setNewMovement({...newMovement, movement_type: v})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="production">Production (+)</SelectItem>
                    <SelectItem value="purchase">Purchase (+)</SelectItem>
                    <SelectItem value="dispatch">Dispatch (-)</SelectItem>
                    <SelectItem value="wastage">Wastage (-)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>Quantity (tonnes)</Label><Input type="number" value={newMovement.quantity} onChange={e => setNewMovement({...newMovement, quantity: e.target.value})} /></div>
              <div><Label>Date</Label><Input type="date" value={newMovement.date} onChange={e => setNewMovement({...newMovement, date: e.target.value})} /></div>
              <div><Label>Notes</Label><Textarea value={newMovement.notes} onChange={e => setNewMovement({...newMovement, notes: e.target.value})} /></div>
              <Button className="w-full" onClick={handleAddMovement}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2 mb-6">
        {stocks.map(stock => {
          const isLow = stock.current_stock < stock.low_stock_threshold;
          const pct = stock.low_stock_threshold > 0 ? Math.min(100, (stock.current_stock / (stock.low_stock_threshold * 3)) * 100) : 50;
          return (
            <Card key={stock.id}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground">{stock.product_name}</h3>
                    {isLow && <Badge variant="destructive" className="text-xs">Low</Badge>}
                  </div>
                  <p className="text-lg font-bold text-foreground">{stock.current_stock} <span className="text-xs text-muted-foreground">{stock.unit}</span></p>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className={`h-2 rounded-full ${isLow ? 'bg-destructive' : 'bg-primary'}`} style={{ width: `${pct}%` }} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Movements */}
      <h2 className="text-sm font-bold text-foreground mb-2">Recent Movements</h2>
      <div className="space-y-2">
        {movements.slice(0, 15).map(m => (
          <Card key={m.id}><CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">{m.product_name}</p>
              <p className="text-xs text-muted-foreground">{format(new Date(m.date), 'dd MMM yyyy')} • {m.movement_type}</p>
            </div>
            <p className={`text-sm font-bold ${m.movement_type === 'production' || m.movement_type === 'purchase' ? 'text-green-600' : 'text-destructive'}`}>
              {m.movement_type === 'production' || m.movement_type === 'purchase' ? '+' : '-'}{m.quantity} T
            </p>
          </CardContent></Card>
        ))}
      </div>
    </div>
  );
};

export default StockDashboardSection;
