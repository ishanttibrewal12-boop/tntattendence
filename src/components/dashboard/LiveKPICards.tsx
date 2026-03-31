import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Users, Wallet, Calendar, AlertTriangle, Truck } from 'lucide-react';
import AnimatedNumber from '@/components/ui/AnimatedNumber';
import { format, subDays, startOfDay } from 'date-fns';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface KPIStat {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  icon: any;
  color: string;
  bgColor: string;
  trend?: { day: string; val: number }[];
}

const MiniSparkline = ({ data, color }: { data: { day: string; val: number }[]; color: string }) => {
  if (!data || data.length < 2) return null;
  return (
    <div className="h-8 w-20">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <Line type="monotone" dataKey="val" stroke={color} strokeWidth={1.5} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const LiveKPICards = () => {
  const [kpis, setKpis] = useState<KPIStat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Use cached data if available (within 2 minutes)
    const cached = sessionStorage.getItem('kpi_cache');
    if (cached) {
      try {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < 120000) {
          setKpis(data.map((k: any) => ({ ...k, icon: { Users, Wallet, Calendar, AlertTriangle, Truck }[k.iconKey] || Users })));
          setIsLoading(false);
          return;
        }
      } catch {}
    }
    fetchKPIs();
  }, []);

  const fetchKPIs = async () => {
    try {
      const [staffRes, advancesRes, attendanceRes, vehiclesRes] = await Promise.all([
        supabase.from('staff').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('advances').select('amount').eq('is_deducted', false),
        supabase.from('attendance').select('status, date').gte('date', format(subDays(new Date(), 6), 'yyyy-MM-dd')),
        supabase.from('vehicles').select('id, insurance_expiry, fitness_expiry').eq('is_active', true),
      ]);

      const activeStaff = staffRes.count || 0;
      const pendingAdvances = (advancesRes.data || []).reduce((s, a) => s + Number(a.amount), 0);

      const attendance = attendanceRes.data || [];
      const attendanceTrend: { day: string; val: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const d = format(subDays(new Date(), i), 'yyyy-MM-dd');
        const dayCount = attendance.filter(a => a.date === d && (a.status === 'present' || a.status === 'half_day')).length;
        attendanceTrend.push({ day: d.slice(5), val: dayCount });
      }
      const todayAttendance = attendanceTrend[attendanceTrend.length - 1]?.val || 0;

      const expiringVehicles = (vehiclesRes.data || []).filter(v => {
        const thirtyDaysFromNow = format(subDays(new Date(), -30), 'yyyy-MM-dd');
        return (v.insurance_expiry && v.insurance_expiry <= thirtyDaysFromNow) ||
               (v.fitness_expiry && v.fitness_expiry <= thirtyDaysFromNow);
      }).length;

      const result: KPIStat[] = [
        { label: 'Active Staff', value: activeStaff, icon: Users, color: 'hsl(217, 91%, 60%)', bgColor: 'hsla(217, 91%, 60%, 0.1)' },
        { label: 'Pending Advances', value: pendingAdvances, prefix: '₹', icon: Wallet, color: 'hsl(0, 84%, 60%)', bgColor: 'hsla(0, 84%, 60%, 0.1)' },
        { label: "Today's Attendance", value: todayAttendance, icon: Calendar, color: 'hsl(45, 93%, 47%)', bgColor: 'hsla(45, 93%, 47%, 0.1)', trend: attendanceTrend },
        { label: 'Expiring Docs', value: expiringVehicles, icon: AlertTriangle, color: 'hsl(25, 95%, 53%)', bgColor: 'hsla(25, 95%, 53%, 0.1)' },
        { label: 'Active Fleet', value: vehiclesRes.data?.length || 0, icon: Truck, color: 'hsl(262, 83%, 58%)', bgColor: 'hsla(262, 83%, 58%, 0.1)' },
      ];
      setKpis(result);
    } catch (e) {
      console.error('KPI fetch error:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-24 rounded-xl animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
      {kpis.map((kpi, i) => {
        const Icon = kpi.icon;
        return (
          <motion.div
            key={kpi.label}
            className="relative p-4 rounded-xl border border-primary-foreground/8 overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.03)' }}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06, duration: 0.4 }}
            whileHover={{ scale: 1.02, borderColor: 'hsla(28,88%,52%,0.2)' }}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="p-1.5 rounded-lg" style={{ background: kpi.bgColor }}>
                <Icon className="h-3.5 w-3.5" style={{ color: kpi.color }} />
              </div>
              {kpi.trend && <MiniSparkline data={kpi.trend} color={kpi.color} />}
            </div>
            <div className="text-xl lg:text-2xl font-extrabold text-primary-foreground tracking-tight tabular-nums">
              {kpi.prefix}<AnimatedNumber value={kpi.value} />
            </div>
            <p className="text-[10px] text-primary-foreground/40 font-semibold mt-0.5 uppercase tracking-[0.12em]">{kpi.label}</p>
          </motion.div>
        );
      })}
    </div>
  );
};

export default LiveKPICards;
