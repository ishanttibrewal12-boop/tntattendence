import { useState, useEffect } from 'react';
import { Activity, Plus, Pencil, Trash2, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';

const ActivityFeed = () => {
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Use cache if fresh (2 min)
    const cached = sessionStorage.getItem('activity_feed_cache');
    if (cached) {
      try {
        const { data, ts } = JSON.parse(cached);
        if (Date.now() - ts < 120000) {
          setLogs(data);
          setIsLoading(false);
          return;
        }
      } catch {}
    }

    const fetchLogs = async () => {
      const { data } = await supabase.from('activity_logs')
        .select('id,action,user_name,table_name,created_at')
        .order('created_at', { ascending: false })
        .limit(5);
      const result = data || [];
      setLogs(result);
      sessionStorage.setItem('activity_feed_cache', JSON.stringify({ data: result, ts: Date.now() }));
      setIsLoading(false);
    };
    fetchLogs();
  }, []);

  const getActionIcon = (action: string) => {
    if (action === 'INSERT' || action === 'create') return Plus;
    if (action === 'UPDATE' || action === 'edit') return Pencil;
    if (action === 'DELETE' || action === 'delete') return Trash2;
    return Activity;
  };

  const getActionColor = (action: string) => {
    if (action === 'INSERT' || action === 'create') return 'hsl(142, 71%, 45%)';
    if (action === 'UPDATE' || action === 'edit') return 'hsl(217, 91%, 60%)';
    if (action === 'DELETE' || action === 'delete') return 'hsl(0, 84%, 60%)';
    return 'hsl(0, 0%, 60%)';
  };

  if (isLoading) {
    return (
      <div className="space-y-2">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: 'rgba(255,255,255,0.03)' }} />
        ))}
      </div>
    );
  }

  if (logs.length === 0) {
    return (
      <p className="text-xs text-primary-foreground/30 text-center py-4">No recent activity</p>
    );
  }

  return (
    <div className="space-y-1.5">
      {logs.map((log) => {
        const ActionIcon = getActionIcon(log.action);
        const color = getActionColor(log.action);
        return (
          <div
            key={log.id}
            className="flex items-center gap-3 p-2.5 rounded-lg border border-primary-foreground/5"
            style={{ background: 'rgba(255,255,255,0.02)' }}
          >
            <div className="p-1 rounded-md" style={{ background: `${color}15` }}>
              <ActionIcon className="h-3 w-3" style={{ color }} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-primary-foreground/70 font-medium truncate">
                <span className="font-bold text-primary-foreground/90">{log.user_name}</span>
                {' '}{log.action.toLowerCase()}d in {log.table_name.replace(/_/g, ' ')}
              </p>
            </div>
            <span className="text-[10px] text-primary-foreground/25 flex items-center gap-1 flex-shrink-0">
              <Clock className="h-2.5 w-2.5" />
              {formatDistanceToNow(new Date(log.created_at), { addSuffix: false })}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export default ActivityFeed;
