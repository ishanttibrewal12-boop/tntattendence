import { useState, useEffect } from 'react';
import { HardDrive, Database, FolderOpen, RefreshCw, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

interface TableInfo {
  table_name: string;
  total_size: string;
  size_bytes: number;
}

interface BucketInfo {
  bucket_id: string;
  file_count: number;
  total_bytes: number;
}

interface StorageStats {
  tables: TableInfo[];
  storage: BucketInfo[];
  database_size: { size_pretty: string; size_bytes: number };
}

const MAX_DB_BYTES = 8 * 1024 * 1024 * 1024; // 8 GB

const formatBytes = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
};

const StorageUsageWidget = () => {
  const [stats, setStats] = useState<StorageStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(
        `https://${projectId}.supabase.co/functions/v1/storage-stats`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${anonKey}`,
          },
        }
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setStats(data);
    } catch (err: any) {
      toast.error('Failed to load storage stats');
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const dbBytes = stats?.database_size?.size_bytes || 0;
  const dbPercent = Math.min((dbBytes / MAX_DB_BYTES) * 100, 100);
  const totalStorageFiles = stats?.storage?.reduce((sum, b) => sum + b.total_bytes, 0) || 0;

  const topTables = (stats?.tables || [])
    .sort((a, b) => b.size_bytes - a.size_bytes)
    .slice(0, 8);

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5" />
              Storage Usage
            </CardTitle>
            <CardDescription>Real-time database and file storage consumption</CardDescription>
          </div>
          <Button variant="ghost" size="icon" onClick={fetchStats} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        {loading && !stats ? (
          <div className="space-y-3">
            <div className="h-4 w-32 bg-muted animate-pulse rounded" />
            <div className="h-3 w-full bg-muted animate-pulse rounded" />
            <div className="h-20 w-full bg-muted animate-pulse rounded" />
          </div>
        ) : (
          <>
            {/* Overall DB usage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  <Database className="h-3.5 w-3.5 text-primary" />
                  Database
                </span>
                <span className="text-muted-foreground">
                  {stats?.database_size?.size_pretty || '—'} / 8 GB
                </span>
              </div>
              <Progress value={dbPercent} className="h-2.5" />
              <p className="text-[11px] text-muted-foreground">
                {dbPercent.toFixed(2)}% used
              </p>
            </div>

            {/* File storage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1.5 font-medium">
                  <FolderOpen className="h-3.5 w-3.5 text-primary" />
                  File Storage
                </span>
                <span className="text-muted-foreground">{formatBytes(totalStorageFiles)}</span>
              </div>
              {(stats?.storage || []).map((bucket) => (
                <div key={bucket.bucket_id} className="flex items-center justify-between text-xs pl-5 py-1 border-l-2 border-border ml-1.5">
                  <span className="text-foreground">{bucket.bucket_id}</span>
                  <span className="text-muted-foreground">
                    {bucket.file_count} files · {formatBytes(bucket.total_bytes)}
                  </span>
                </div>
              ))}
            </div>

            {/* Top tables */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top Tables</p>
              <div className="space-y-1">
                {topTables.map((t) => {
                  const pct = dbBytes > 0 ? (t.size_bytes / dbBytes) * 100 : 0;
                  return (
                    <div key={t.table_name} className="flex items-center gap-2 text-xs">
                      <span className="w-36 truncate text-foreground">{t.table_name}</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary/60 rounded-full"
                          style={{ width: `${Math.max(pct, 1)}%` }}
                        />
                      </div>
                      <span className="text-muted-foreground w-16 text-right">{t.total_size}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StorageUsageWidget;
