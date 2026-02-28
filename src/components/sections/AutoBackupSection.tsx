import { useState, useEffect } from 'react';
import { Cloud, Download, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface BackupLog {
  id: string;
  file_path: string;
  file_size: number;
  status: string;
  error_message: string | null;
  created_at: string;
}

const AutoBackupSection = () => {
  const [backupLogs, setBackupLogs] = useState<BackupLog[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBackupLogs();
    fetchAutoBackupSetting();
  }, []);

  const fetchBackupLogs = async () => {
    const { data, error } = await supabase
      .from('backup_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (!error && data) {
      setBackupLogs(data as BackupLog[]);
    }
    setLoading(false);
  };

  const fetchAutoBackupSetting = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'auto_backup_enabled')
      .single();

    if (data?.setting_value) {
      setAutoBackupEnabled(data.setting_value === 'true');
    }
  };

  const toggleAutoBackup = async (enabled: boolean) => {
    setAutoBackupEnabled(enabled);

    const { data: existing } = await supabase
      .from('app_settings')
      .select('id')
      .eq('setting_key', 'auto_backup_enabled')
      .single();

    if (existing) {
      await supabase
        .from('app_settings')
        .update({ setting_value: enabled ? 'true' : 'false', updated_at: new Date().toISOString() })
        .eq('setting_key', 'auto_backup_enabled');
    } else {
      await supabase
        .from('app_settings')
        .insert({ setting_key: 'auto_backup_enabled', setting_value: enabled ? 'true' : 'false' });
    }

    toast.success(`Auto backup ${enabled ? 'enabled' : 'disabled'}`);
  };

  const runBackupNow = async () => {
    setIsRunning(true);
    toast.info('Running backup... This may take a moment.');

    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/daily-backup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success(`Backup completed! Size: ${formatSize(result.size)}`);
        fetchBackupLogs();
      } else {
        toast.error(`Backup failed: ${result.error}`);
      }
    } catch (err: any) {
      toast.error('Backup failed: ' + err.message);
    }

    setIsRunning(false);
  };

  const downloadBackup = async (filePath: string) => {
    try {
      const { data, error } = await supabase.storage
        .from('daily_backups')
        .download(filePath);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = filePath;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Backup downloaded');
    } catch (err: any) {
      toast.error('Download failed: ' + err.message);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const lastBackup = backupLogs[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          Automatic Backups
        </CardTitle>
        <CardDescription>
          Daily cloud backups run automatically at 2:00 AM. Last 30 days are retained.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle */}
        <div className="flex items-center justify-between">
          <Label htmlFor="auto-backup-toggle">Auto Daily Backup</Label>
          <Switch
            id="auto-backup-toggle"
            checked={autoBackupEnabled}
            onCheckedChange={toggleAutoBackup}
          />
        </div>

        {/* Last Backup Status */}
        {lastBackup && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
            {lastBackup.status === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <XCircle className="h-4 w-4 text-destructive" />
            )}
            <div className="flex-1 text-sm">
              <p className="font-medium">
                Last backup: {format(new Date(lastBackup.created_at), 'dd MMM yyyy, hh:mm a')}
              </p>
              <p className="text-muted-foreground text-xs">
                {lastBackup.status === 'success'
                  ? `Size: ${formatSize(lastBackup.file_size)}`
                  : `Error: ${lastBackup.error_message}`}
              </p>
            </div>
          </div>
        )}

        {/* Run Now Button */}
        <Button
          variant="secondary"
          className="w-full"
          onClick={runBackupNow}
          disabled={isRunning}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRunning ? 'animate-spin' : ''}`} />
          {isRunning ? 'Running Backup...' : 'Run Backup Now'}
        </Button>

        {/* Backup History */}
        {backupLogs.length > 0 && (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Recent Backups</Label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {backupLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-2 rounded border text-sm"
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <Clock className="h-3 w-3 text-muted-foreground shrink-0" />
                    <span className="truncate">
                      {format(new Date(log.created_at), 'dd MMM yy, hh:mm a')}
                    </span>
                    <Badge variant={log.status === 'success' ? 'default' : 'destructive'} className="text-[10px] px-1.5 py-0">
                      {log.status}
                    </Badge>
                  </div>
                  {log.status === 'success' && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 shrink-0"
                      onClick={() => downloadBackup(log.file_path)}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {loading && <p className="text-xs text-muted-foreground text-center">Loading backup history...</p>}

        {!loading && backupLogs.length === 0 && (
          <p className="text-xs text-muted-foreground text-center">No backups yet. Click "Run Backup Now" to create your first cloud backup.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default AutoBackupSection;
