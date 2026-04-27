import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, LogOut, ShieldCheck, Calendar as CalendarIcon, UserPlus,
  CalendarDays, Wallet, DollarSign, Clock, Users, Folder, Settings as SettingsIcon,
  KeyRound, RefreshCw,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppAuth } from '@/contexts/AppAuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

interface ProfileSectionProps {
  onBack: () => void;
  onNavigate?: (section: string) => void;
}

const QUICK_LINKS: {
  id: string;
  label: string;
  desc: string;
  icon: typeof Users;
  tone: string;
}[] = [
  { id: 'staff', label: 'Manage Staff', desc: 'Add, edit, archive staff', icon: UserPlus, tone: 'bg-blue-500/10 text-blue-600' },
  { id: 'attendance', label: 'Attendance', desc: 'Mark daily shifts', icon: CalendarDays, tone: 'bg-emerald-500/10 text-emerald-600' },
  { id: 'salary', label: 'Payroll & Salary', desc: 'Calculate & pay', icon: DollarSign, tone: 'bg-amber-500/10 text-amber-700' },
  { id: 'advance-salary', label: 'Advances', desc: 'Track and deduct', icon: Wallet, tone: 'bg-violet-500/10 text-violet-600' },
  { id: 'staff-details', label: 'Shift Rates', desc: 'Configure 28/30/31-day rates', icon: Clock, tone: 'bg-rose-500/10 text-rose-600' },
  { id: 'user-management', label: 'User Management', desc: 'Admin profiles', icon: Users, tone: 'bg-cyan-500/10 text-cyan-600' },
  { id: 'file-manager', label: 'File Manager', desc: 'Files, Word & Excel', icon: Folder, tone: 'bg-indigo-500/10 text-indigo-600' },
  { id: 'settings', label: 'Settings', desc: 'App preferences', icon: SettingsIcon, tone: 'bg-slate-500/10 text-slate-600' },
];

const roleLabel = (role: string) =>
  role === 'manager' ? 'Manager (Super Admin)' :
  role === 'mlt_admin' ? 'MLT Admin' :
  role === 'petroleum_admin' ? 'Petroleum Admin' :
  role === 'crusher_admin' ? 'Crusher Admin' :
  role.replace('_', ' ');

const ProfileSection = ({ onBack, onNavigate }: ProfileSectionProps) => {
  const { user, requestLogout } = useAppAuth();
  const [stats, setStats] = useState({
    activeStaff: 0,
    pendingAdvances: 0,
    todayAttendance: 0,
  });
  const [loadingStats, setLoadingStats] = useState(true);

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const [staffRes, advRes, attRes] = await Promise.all([
        supabase.from('staff').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('advances').select('id', { count: 'exact', head: true }).eq('is_deducted', false),
        supabase.from('attendance').select('id', { count: 'exact', head: true }).eq('date', today),
      ]);
      setStats({
        activeStaff: staffRes.count ?? 0,
        pendingAdvances: advRes.count ?? 0,
        todayAttendance: attRes.count ?? 0,
      });
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const initials = useMemo(() => {
    const n = user?.full_name || user?.username || '?';
    return n
      .split(/\s+/)
      .map((p) => p.charAt(0))
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }, [user]);

  const lastLoginExact = user?.last_login_at
    ? format(new Date(user.last_login_at), 'EEEE, dd MMM yyyy · HH:mm')
    : 'First time login';
  const previousLoginRel = user?.previous_login_at
    ? formatDistanceToNow(new Date(user.previous_login_at), { addSuffix: true })
    : '—';

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 shrink-0">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl lg:text-2xl font-bold tracking-tight">My Profile</h1>
          <p className="text-xs text-muted-foreground">Account, activity & quick actions</p>
        </div>
        <Button variant="outline" size="sm" className="h-10" onClick={requestLogout}>
          <LogOut className="h-4 w-4 mr-2" />
          Sign out
        </Button>
      </div>

      {/* Identity card */}
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-primary/15 via-primary/5 to-transparent p-5 lg:p-6">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 lg:h-20 lg:w-20 rounded-2xl bg-primary text-primary-foreground flex items-center justify-center text-2xl lg:text-3xl font-bold shrink-0 shadow-lg">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl lg:text-2xl font-bold leading-tight truncate">
                {user?.full_name || user?.username}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5 font-mono">@{user?.username}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  <ShieldCheck className="h-3 w-3" />
                  {roleLabel(user?.role || '')}
                </span>
                {user?.category && (
                  <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border capitalize">
                    {user.category}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <CardContent className="p-0">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-border">
            <div className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Current login
              </p>
              <p className="text-sm font-medium mt-1 flex items-center gap-1.5">
                <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                {lastLoginExact}
              </p>
            </div>
            <div className="p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Previous login
              </p>
              <p className="text-sm font-medium mt-1 flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {previousLoginRel}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Live stats */}
      <div className="grid grid-cols-3 gap-2 lg:gap-4">
        <StatTile label="Active Staff" value={stats.activeStaff} loading={loadingStats} tone="from-blue-500/15" />
        <StatTile label="Pending Advances" value={stats.pendingAdvances} loading={loadingStats} tone="from-amber-500/15" />
        <StatTile label="Today's Attendance" value={stats.todayAttendance} loading={loadingStats} tone="from-emerald-500/15" />
      </div>
      <div className="-mt-2">
        <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={loadStats} disabled={loadingStats}>
          <RefreshCw className={cn('h-3 w-3 mr-1.5', loadingStats && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {/* Quick links */}
      <div>
        <h3 className="text-sm font-semibold mb-2.5">Quick links</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 lg:gap-3">
          {QUICK_LINKS.map((link) => (
            <button
              key={link.id}
              onClick={() => onNavigate?.(link.id)}
              className="group flex flex-col items-start gap-2 p-3 lg:p-4 rounded-xl border border-border bg-card hover:bg-muted/40 hover:border-primary/30 transition-all text-left min-h-[92px]"
            >
              <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center', link.tone)}>
                <link.icon className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight group-hover:text-primary transition-colors">
                  {link.label}
                </p>
                <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{link.desc}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Security tips */}
      <Card>
        <CardContent className="p-4 flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-amber-500/10 text-amber-700 flex items-center justify-center shrink-0">
            <KeyRound className="h-4 w-4" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold">Session security</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              You are auto-logged out after 5 minutes of inactivity. Always sign out on shared devices.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

const StatTile = ({
  label, value, loading, tone,
}: { label: string; value: number; loading: boolean; tone: string }) => (
  <Card className={cn('overflow-hidden bg-gradient-to-br to-transparent', tone)}>
    <CardContent className="p-3 lg:p-4">
      <p className="text-[10px] lg:text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="text-2xl lg:text-3xl font-bold tabular-nums mt-1">
        {loading ? '—' : value}
      </p>
    </CardContent>
  </Card>
);

export default ProfileSection;
