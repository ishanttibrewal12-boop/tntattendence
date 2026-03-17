import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays, startOfDay } from 'date-fns';

const SkeletonPulse = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse rounded-lg bg-muted ${className}`} />
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-lg border border-border bg-card p-2.5 shadow-lg">
        <p className="text-[11px] font-semibold text-foreground mb-1">{label}</p>
        {payload.map((entry: any, i: number) => (
          <p key={i} className="text-[11px] text-muted-foreground">
            {entry.name}: <span className="font-semibold text-foreground">{entry.name === 'Revenue' ? `₹${Number(entry.value).toLocaleString('en-IN')}` : entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const RevenueChart = () => {
  const [data, setData] = useState<{ day: string; Revenue: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRevenue = async () => {
      const days = 7;
      const chartData: { day: string; Revenue: number }[] = [];

      // Fetch petroleum + tyre sales for last 7 days
      const from = format(subDays(new Date(), days - 1), 'yyyy-MM-dd');
      const [petRes, tyreRes] = await Promise.all([
        supabase.from('petroleum_sales').select('date, amount').gte('date', from),
        supabase.from('tyre_sales').select('date, amount').gte('date', from),
      ]);

      const revenueMap: Record<string, number> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
        revenueMap[d] = 0;
      }

      (petRes.data || []).forEach((r) => {
        if (revenueMap[r.date] !== undefined) revenueMap[r.date] += Number(r.amount);
      });
      (tyreRes.data || []).forEach((r) => {
        if (revenueMap[r.date] !== undefined) revenueMap[r.date] += Number(r.amount);
      });

      Object.entries(revenueMap).forEach(([date, rev]) => {
        chartData.push({ day: format(new Date(date), 'EEE'), Revenue: rev });
      });

      setData(chartData);
      setLoading(false);
    };
    fetchRevenue();
  }, []);

  if (loading) {
    return (
      <Card className="border border-border/50">
        <CardContent className="p-4 lg:p-5 space-y-3">
          <SkeletonPulse className="h-4 w-32" />
          <SkeletonPulse className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45, duration: 0.35 }}>
      <Card className="border border-border/50 overflow-hidden">
        <CardContent className="p-4 lg:p-5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">Revenue · Last 7 Days</p>
          <div className="h-[200px] lg:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(28, 88%, 52%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(28, 88%, 52%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(216, 14%, 17%)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(210, 12%, 62%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(210, 12%, 62%)' }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="Revenue"
                  stroke="hsl(28, 88%, 52%)"
                  strokeWidth={2.5}
                  fill="url(#revenueGrad)"
                  animationDuration={1200}
                  animationEasing="ease-out"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export const DispatchChart = () => {
  const [data, setData] = useState<{ day: string; Dispatches: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDispatches = async () => {
      const days = 7;
      const from = format(subDays(new Date(), days - 1), 'yyyy-MM-dd');
      const res = await supabase.from('dispatch_reports').select('date').gte('date', from);

      const countMap: Record<string, number> = {};
      for (let i = days - 1; i >= 0; i--) {
        const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
        countMap[d] = 0;
      }

      (res.data || []).forEach((r) => {
        if (countMap[r.date] !== undefined) countMap[r.date]++;
      });

      const chartData = Object.entries(countMap).map(([date, count]) => ({
        day: format(new Date(date), 'EEE'),
        Dispatches: count,
      }));

      setData(chartData);
      setLoading(false);
    };
    fetchDispatches();
  }, []);

  if (loading) {
    return (
      <Card className="border border-border/50">
        <CardContent className="p-4 lg:p-5 space-y-3">
          <SkeletonPulse className="h-4 w-32" />
          <SkeletonPulse className="h-[200px] w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.35 }}>
      <Card className="border border-border/50 overflow-hidden">
        <CardContent className="p-4 lg:p-5">
          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-4">Dispatches · Last 7 Days</p>
          <div className="h-[200px] lg:h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(216, 14%, 17%)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(210, 12%, 62%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(210, 12%, 62%)' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar
                  dataKey="Dispatches"
                  fill="hsl(210, 60%, 40%)"
                  radius={[6, 6, 0, 0]}
                  animationDuration={1000}
                  animationEasing="ease-out"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
