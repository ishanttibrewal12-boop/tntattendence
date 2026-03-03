import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, IndianRupee } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ProfitTrackerProps {
  onBack: () => void;
}

const ProfitTrackerSection = ({ onBack }: ProfitTrackerProps) => {
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  useEffect(() => { fetchData(); }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    const start = format(startOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
    const end = format(endOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
    const { data } = await supabase.from('dispatch_reports').select('*').gte('date', start).lte('date', end).order('date');
    setDispatches(data || []);
  };

  const totalRevenue = dispatches.reduce((s, d) => s + Number(d.amount), 0);
  const totalProdCost = dispatches.reduce((s, d) => s + Number(d.production_cost || 0), 0);
  const totalDieselCost = dispatches.reduce((s, d) => s + Number(d.diesel_cost || 0), 0);
  const totalLabourCost = dispatches.reduce((s, d) => s + Number(d.labour_cost || 0), 0);
  const totalCost = totalProdCost + totalDieselCost + totalLabourCost;
  const netProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : '—';

  // Daily profit chart
  const dailyMap: Record<string, { revenue: number; cost: number }> = {};
  dispatches.forEach(d => {
    if (!dailyMap[d.date]) dailyMap[d.date] = { revenue: 0, cost: 0 };
    dailyMap[d.date].revenue += Number(d.amount);
    dailyMap[d.date].cost += Number(d.production_cost || 0) + Number(d.diesel_cost || 0) + Number(d.labour_cost || 0);
  });
  const chartData = Object.entries(dailyMap).map(([date, vals]) => ({
    name: format(new Date(date), 'dd'),
    profit: vals.revenue - vals.cost,
    revenue: vals.revenue,
  }));

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-bold text-foreground">📊 Profit Tracker</h1>
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
          <p className="text-lg font-bold text-foreground">₹{totalRevenue.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Revenue</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className={`text-lg font-bold ${netProfit >= 0 ? 'text-green-600' : 'text-destructive'}`}>₹{netProfit.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Net Profit</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-lg font-bold text-foreground">₹{totalCost.toLocaleString()}</p>
          <p className="text-xs text-muted-foreground">Total Cost</p>
        </CardContent></Card>
        <Card><CardContent className="p-3 text-center">
          <p className="text-lg font-bold text-foreground">{margin}%</p>
          <p className="text-xs text-muted-foreground">Margin</p>
        </CardContent></Card>
      </div>

      {/* Cost Breakdown */}
      <Card className="mb-4"><CardContent className="p-3">
        <p className="text-xs font-bold text-foreground mb-2">Cost Breakdown</p>
        <div className="space-y-1">
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Production</span><span className="font-bold text-foreground">₹{totalProdCost.toLocaleString()}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Diesel</span><span className="font-bold text-foreground">₹{totalDieselCost.toLocaleString()}</span></div>
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Labour</span><span className="font-bold text-foreground">₹{totalLabourCost.toLocaleString()}</span></div>
        </div>
      </CardContent></Card>

      {/* Profit Chart */}
      {chartData.length > 0 && (
        <Card className="mb-4">
          <CardHeader className="pb-2"><CardTitle className="text-sm">Daily Profit</CardTitle></CardHeader>
          <CardContent>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" fontSize={10} />
                  <YAxis fontSize={10} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                  <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                  <Bar dataKey="profit" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Per Dispatch */}
      <h2 className="text-sm font-bold text-foreground mb-2">Dispatch Details</h2>
      <div className="space-y-2">
        {dispatches.slice().reverse().slice(0, 20).map(d => {
          const cost = Number(d.production_cost || 0) + Number(d.diesel_cost || 0) + Number(d.labour_cost || 0);
          const profit = Number(d.amount) - cost;
          return (
            <Card key={d.id}><CardContent className="p-3">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm font-medium text-foreground">{d.party_name}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(d.date), 'dd MMM')} • {d.product_name} • {d.quantity}T</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">₹{Number(d.amount).toLocaleString()}</p>
                  <p className={`text-xs font-medium ${profit >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                    P: ₹{profit.toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent></Card>
          );
        })}
        {dispatches.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No dispatches this month</p>}
      </div>

      <p className="text-xs text-muted-foreground text-center mt-4">💡 Add production, diesel & labour costs in Crusher Reports → Dispatch to track profit per dispatch</p>
    </div>
  );
};

export default ProfitTrackerSection;
