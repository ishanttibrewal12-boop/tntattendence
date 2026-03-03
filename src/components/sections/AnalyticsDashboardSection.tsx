import { useState, useEffect } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, IndianRupee, Truck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format, subMonths, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, Legend } from 'recharts';

interface AnalyticsProps {
  onBack: () => void;
}

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const AnalyticsDashboardSection = ({ onBack }: AnalyticsProps) => {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => { fetchData(); }, [selectedYear, selectedMonth]);

  const fetchData = async () => {
    setIsLoading(true);
    const yearStart = `${selectedYear}-01-01`;
    const yearEnd = `${selectedYear}-12-31`;
    const { data } = await supabase.from('dispatch_reports').select('*').gte('date', yearStart).lte('date', yearEnd).order('date');
    setDispatches(data || []);
    setIsLoading(false);
  };

  // Monthly revenue data
  const monthlyRevenue = months.map((m, i) => {
    const monthData = dispatches.filter(d => new Date(d.date).getMonth() === i);
    return {
      name: m,
      revenue: monthData.reduce((s, d) => s + Number(d.amount), 0),
      quantity: monthData.reduce((s, d) => s + Number(d.quantity), 0),
      count: monthData.length,
    };
  });

  // Daily revenue for selected month
  const monthStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
  const monthEnd = endOfMonth(new Date(selectedYear, selectedMonth - 1));
  const dailyRevenue = eachDayOfInterval({ start: monthStart, end: monthEnd }).map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayData = dispatches.filter(d => d.date === dayStr);
    return {
      name: format(day, 'dd'),
      revenue: dayData.reduce((s, d) => s + Number(d.amount), 0),
    };
  }).filter(d => d.revenue > 0);

  // Company-wise revenue
  const companyMap: Record<string, number> = {};
  dispatches.filter(d => new Date(d.date).getMonth() === selectedMonth - 1).forEach(d => {
    companyMap[d.party_name] = (companyMap[d.party_name] || 0) + Number(d.amount);
  });
  const companyData = Object.entries(companyMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name: name.length > 12 ? name.substring(0, 12) + '...' : name, value }));

  // Product-wise quantity
  const productMap: Record<string, number> = {};
  dispatches.filter(d => new Date(d.date).getMonth() === selectedMonth - 1).forEach(d => {
    productMap[d.product_name] = (productMap[d.product_name] || 0) + Number(d.quantity);
  });
  const productData = Object.entries(productMap).map(([name, value]) => ({ name, quantity: value }));

  // Year totals
  const totalRevenue = dispatches.reduce((s, d) => s + Number(d.amount), 0);
  const totalQuantity = dispatches.reduce((s, d) => s + Number(d.quantity), 0);
  const totalDispatches = dispatches.length;

  // Top 5 parties
  const yearPartyMap: Record<string, number> = {};
  dispatches.forEach(d => { yearPartyMap[d.party_name] = (yearPartyMap[d.party_name] || 0) + Number(d.amount); });
  const top5 = Object.entries(yearPartyMap).sort((a, b) => b[1] - a[1]).slice(0, 5);

  // Growth comparison
  const thisMonthRev = monthlyRevenue[selectedMonth - 1]?.revenue || 0;
  const lastMonthRev = selectedMonth > 1 ? (monthlyRevenue[selectedMonth - 2]?.revenue || 0) : 0;
  const growthPct = lastMonthRev > 0 ? ((thisMonthRev - lastMonthRev) / lastMonthRev * 100).toFixed(1) : '—';

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-bold text-foreground">📈 Analytics</h1>
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

      {isLoading ? <p className="text-center text-muted-foreground py-8">Loading...</p> : (
        <>
          {/* Year Summary */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <Card><CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">₹{(totalRevenue / 100000).toFixed(1)}L</p>
              <p className="text-xs text-muted-foreground">Revenue</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">{totalQuantity.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Qty (T)</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">{totalDispatches}</p>
              <p className="text-xs text-muted-foreground">Dispatches</p>
            </CardContent></Card>
          </div>

          {/* Growth */}
          <Card className="mb-4"><CardContent className="p-3 flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Month Growth</p>
              <p className="text-lg font-bold text-foreground">{growthPct}%</p>
            </div>
            {Number(growthPct) > 0 ? <TrendingUp className="h-6 w-6 text-green-600" /> : <TrendingDown className="h-6 w-6 text-destructive" />}
          </CardContent></Card>

          {/* Monthly Revenue Chart */}
          <Card className="mb-4">
            <CardHeader className="pb-2"><CardTitle className="text-sm">Monthly Revenue - {selectedYear}</CardTitle></CardHeader>
            <CardContent>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" fontSize={10} />
                    <YAxis fontSize={10} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Daily Revenue */}
          {dailyRevenue.length > 0 && (
            <Card className="mb-4">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Daily Revenue - {months[selectedMonth-1]}</CardTitle></CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyRevenue}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={10} />
                      <YAxis fontSize={10} tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Revenue']} />
                      <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Company-wise Pie */}
          {companyData.length > 0 && (
            <Card className="mb-4">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Company-wise Revenue</CardTitle></CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={companyData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name }) => name}>
                        {companyData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `₹${v.toLocaleString()}`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product-wise Bar */}
          {productData.length > 0 && (
            <Card className="mb-4">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Product-wise Quantity</CardTitle></CardHeader>
              <CardContent>
                <div className="h-40">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={productData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" fontSize={10} />
                      <YAxis dataKey="name" type="category" fontSize={10} width={60} />
                      <Tooltip />
                      <Bar dataKey="quantity" fill="#22c55e" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Top 5 Parties */}
          <Card className="mb-4">
            <CardHeader className="pb-2"><CardTitle className="text-sm">🏆 Top 5 Parties - {selectedYear}</CardTitle></CardHeader>
            <CardContent>
              {top5.map(([name, amount], i) => (
                <div key={name} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground">#{i+1}</span>
                    <span className="text-sm text-foreground">{name}</span>
                  </div>
                  <span className="text-sm font-bold text-foreground">₹{amount.toLocaleString()}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default AnalyticsDashboardSection;
