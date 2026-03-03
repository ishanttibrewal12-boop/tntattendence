import { useState, useEffect } from 'react';
import { ArrowLeft, Search, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';

interface ActivityLogProps {
  onBack: () => void;
}

const ActivityLogSection = ({ onBack }: ActivityLogProps) => {
  const [logs, setLogs] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterTable, setFilterTable] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => { fetchLogs(); }, [filterTable]);

  const fetchLogs = async () => {
    setIsLoading(true);
    let query = supabase.from('activity_logs').select('*').order('created_at', { ascending: false }).limit(100);
    if (filterTable !== 'all') query = query.eq('table_name', filterTable);
    const { data } = await query;
    setLogs(data || []);
    setIsLoading(false);
  };

  const filteredLogs = search
    ? logs.filter(l => l.user_name.toLowerCase().includes(search.toLowerCase()) || l.action.toLowerCase().includes(search.toLowerCase()) || l.table_name.toLowerCase().includes(search.toLowerCase()))
    : logs;

  const getActionColor = (action: string) => {
    if (action === 'INSERT' || action === 'create') return 'bg-green-500/10 text-green-700';
    if (action === 'UPDATE' || action === 'edit') return 'bg-blue-500/10 text-blue-700';
    if (action === 'DELETE' || action === 'delete') return 'bg-destructive/10 text-destructive';
    return 'bg-muted text-muted-foreground';
  };

  const tables = [...new Set(logs.map(l => l.table_name))];

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-bold text-foreground">🛡️ Activity Log</h1>
      </div>

      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={filterTable} onValueChange={setFilterTable}>
          <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {tables.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? <p className="text-center text-muted-foreground py-8">Loading...</p> : (
        <div className="space-y-2">
          {filteredLogs.map(log => (
            <Card key={log.id}>
              <CardContent className="p-3">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Shield className="h-3 w-3 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{log.user_name}</span>
                  </div>
                  <Badge className={`text-xs ${getActionColor(log.action)}`}>{log.action}</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{log.table_name} • {format(new Date(log.created_at), 'dd MMM yyyy HH:mm')}</p>
              </CardContent>
            </Card>
          ))}
          {filteredLogs.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">No activity logs yet. Logs will appear as users perform actions.</p>}
        </div>
      )}
    </div>
  );
};

export default ActivityLogSection;
