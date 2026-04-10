import { useState, useEffect } from 'react';
import { Bell, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { useRealtimeNotifications } from '@/hooks/useRealtimeNotifications';

const NotificationBell = () => {
  const [summaryItems, setSummaryItems] = useState<{ label: string; count: number; type: string }[]>([]);
  const [summaryTotal, setSummaryTotal] = useState(0);
  const { notifications: realtimeNotifications, unreadCount, markAsRead, markAllRead } = useRealtimeNotifications();

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
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

    setSummaryItems(items);
    setSummaryTotal(items.reduce((s, i) => s + i.count, 0));
  };

  const totalBadge = summaryTotal + unreadCount;

  const getColor = (type: string) => {
    if (type === 'danger') return 'hsl(0, 84%, 60%)';
    if (type === 'warning') return 'hsl(45, 93%, 47%)';
    return 'hsl(217, 91%, 60%)';
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'reminder': return '🔔';
      case 'advance': return '💰';
      case 'attendance': return '📋';
      case 'vehicle': return '🚛';
      default: return '📢';
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button className="relative p-2 rounded-lg hover:bg-accent/10 transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {totalBadge > 0 && (
            <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-[18px] h-[18px] rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold px-1">
              {totalBadge > 99 ? '99+' : totalBadge}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-3 max-h-[400px] overflow-y-auto" align="end">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-bold text-foreground">Notifications</p>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-2" onClick={markAllRead}>
              <Check className="h-3 w-3 mr-1" /> Mark all read
            </Button>
          )}
        </div>

        {/* Summary notifications */}
        {summaryItems.length > 0 && (
          <div className="space-y-1.5 mb-3">
            {summaryItems.map((n, i) => (
              <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/40">
                <span className="text-xs text-foreground">{n.label}</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: `${getColor(n.type)}15`, color: getColor(n.type) }}>
                  {n.count}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Live realtime notifications */}
        {realtimeNotifications.length > 0 && (
          <>
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">Live Updates</p>
            <div className="space-y-1.5">
              {realtimeNotifications.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`p-2 rounded-lg cursor-pointer transition-colors ${n.read ? 'bg-muted/20' : 'bg-primary/5 border border-primary/10'}`}
                  onClick={() => markAsRead(n.id)}
                >
                  <div className="flex items-start gap-2">
                    <span className="text-sm">{getTypeIcon(n.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium ${n.read ? 'text-muted-foreground' : 'text-foreground'}`}>{n.title}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{n.message}</p>
                    </div>
                    {!n.read && <span className="h-2 w-2 rounded-full bg-primary flex-shrink-0 mt-1" />}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {summaryItems.length === 0 && realtimeNotifications.length === 0 && (
          <p className="text-xs text-muted-foreground py-2">All clear! No pending items.</p>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
