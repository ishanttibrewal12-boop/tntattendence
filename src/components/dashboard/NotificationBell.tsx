import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<{ label: string; count: number; type: string }[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const thirtyDays = format(subDays(new Date(), -30), 'yyyy-MM-dd');

    const [remindersRes, vehiclesRes, advancesRes] = await Promise.all([
      supabase.from('reminders').select('*', { count: 'exact', head: true })
        .eq('reminder_date', today).eq('is_sent', false),
      supabase.from('vehicles').select('id, insurance_expiry, fitness_expiry, truck_number').eq('is_active', true),
      supabase.from('advances').select('*', { count: 'exact', head: true }).eq('is_deducted', false),
    ]);

    const reminderCount = remindersRes.count || 0;
    const expiringVehicles = (vehiclesRes.data || []).filter(v =>
      (v.insurance_expiry && v.insurance_expiry <= thirtyDays) ||
      (v.fitness_expiry && v.fitness_expiry <= thirtyDays)
    ).length;
    const pendingAdvances = advancesRes.count || 0;

    const items: { label: string; count: number; type: string }[] = [];
    if (reminderCount > 0) items.push({ label: 'Reminders today', count: reminderCount, type: 'warning' });
    if (expiringVehicles > 0) items.push({ label: 'Expiring vehicle docs', count: expiringVehicles, type: 'danger' });
    if (pendingAdvances > 0) items.push({ label: 'Pending advances', count: pendingAdvances, type: 'info' });

    setNotifications(items);
    setTotal(items.reduce((s, i) => s + i.count, 0));
  };

  const getColor = (type: string) => {
    if (type === 'danger') return 'hsl(0, 84%, 60%)';
    if (type === 'warning') return 'hsl(45, 93%, 47%)';
    return 'hsl(217, 91%, 60%)';
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-accent/10 transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {total > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
              {total > 99 ? '99+' : total}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="end">
        <p className="text-xs font-bold text-foreground mb-2">Notifications</p>
        {notifications.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">All clear! No pending items.</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((n, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                <span className="text-xs text-foreground">{n.label}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${getColor(n.type)}15`, color: getColor(n.type) }}>
                  {n.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
