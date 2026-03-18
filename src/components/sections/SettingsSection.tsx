import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Lock, Database, Download, Upload, Shield, Settings, Clock, Users, HardDrive, Bell } from 'lucide-react';
import AutoBackupSection from './AutoBackupSection';
import WhatsAppSettingsSection from './WhatsAppSettingsSection';
import StorageUsageWidget from './StorageUsageWidget';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SettingsSectionProps {
  onBack: () => void;
}

const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.35 },
};

const SettingsSection = ({ onBack }: SettingsSectionProps) => {
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [storedPin, setStoredPin] = useState('8465');
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [backupConfirm, setBackupConfirm] = useState<'backup' | 'restore' | null>(null);
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);

  useEffect(() => {
    fetchPin();
  }, []);

  const fetchPin = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'app_pin')
        .single();
      if (data?.setting_value) {
        setStoredPin(data.setting_value);
      } else if (error && error.code !== 'PGRST116') {
        console.log('No PIN found, using default');
      }
    } catch {
      console.log('PIN fetch error, using default');
    }
  };

  const handleChangePin = async () => {
    if (currentPin !== storedPin) { toast.error('Current PIN is incorrect'); return; }
    if (newPin.length < 4) { toast.error('PIN must be at least 4 digits'); return; }
    if (newPin !== confirmPin) { toast.error('New PINs do not match'); return; }

    setIsChangingPin(true);
    try {
      const { data: existing } = await supabase.from('app_settings').select('id').eq('setting_key', 'app_pin').single();
      let error;
      if (existing) {
        const result = await supabase.from('app_settings').update({ setting_value: newPin, updated_at: new Date().toISOString() }).eq('setting_key', 'app_pin');
        error = result.error;
      } else {
        const result = await supabase.from('app_settings').insert({ setting_key: 'app_pin', setting_value: newPin });
        error = result.error;
      }
      if (error) { toast.error('Failed to update PIN'); } else {
        toast.success('PIN updated successfully!');
        setCurrentPin(''); setNewPin(''); setConfirmPin(''); setStoredPin(newPin);
      }
    } catch { toast.error('Failed to update PIN'); }
    setIsChangingPin(false);
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      toast.info('Creating backup...');
      const [staffRes, attendanceRes, advancesRes, payrollRes, mltStaffRes, mltAttendanceRes, mltAdvancesRes, petroleumSalesRes, petroleumPaymentsRes, remindersRes, appSettingsRes] = await Promise.all([
        supabase.from('staff').select('*'), supabase.from('attendance').select('*'), supabase.from('advances').select('*'),
        supabase.from('payroll').select('*'), supabase.from('mlt_staff').select('*'), supabase.from('mlt_attendance').select('*'),
        supabase.from('mlt_advances').select('*'), supabase.from('petroleum_sales').select('*'), supabase.from('petroleum_payments').select('*'),
        supabase.from('reminders').select('*'), supabase.from('app_settings').select('*'),
      ]);
      const backupData = {
        version: '3.0', created_at: new Date().toISOString(),
        data: { staff: staffRes.data || [], attendance: attendanceRes.data || [], advances: advancesRes.data || [], payroll: payrollRes.data || [],
          mlt_staff: mltStaffRes.data || [], mlt_attendance: mltAttendanceRes.data || [], mlt_advances: mltAdvancesRes.data || [],
          petroleum_sales: petroleumSalesRes.data || [], petroleum_payments: petroleumPaymentsRes.data || [], reminders: remindersRes.data || [], app_settings: appSettingsRes.data || [],
        }
      };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = `tnt-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
      toast.success('Backup created successfully');
    } catch { toast.error('Failed to create backup'); }
    setIsBackingUp(false); setBackupConfirm(null);
  };

  const handleRestore = async () => {
    if (!restoreFile) { toast.error('Please select a backup file'); return; }
    setIsRestoring(true);
    try {
      toast.info('Restoring data...');
      const text = await restoreFile.text();
      const backupData = JSON.parse(text);
      if (!backupData.version || !backupData.data) throw new Error('Invalid backup');
      const clearPromises = [
        supabase.from('payroll').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('advances').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('staff').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('mlt_advances').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('mlt_attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('mlt_staff').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('petroleum_sales').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('petroleum_payments').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
        supabase.from('reminders').delete().neq('id', '00000000-0000-0000-0000-000000000000'),
      ];
      await Promise.all(clearPromises);
      const insertData = async (tableName: 'staff' | 'attendance' | 'advances' | 'payroll' | 'mlt_staff' | 'mlt_attendance' | 'mlt_advances' | 'petroleum_sales' | 'petroleum_payments' | 'reminders', data: any[]) => {
        if (!data || data.length === 0) return;
        const batchSize = 100;
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          try { await supabase.from(tableName).insert(batch as any); } catch (err) { console.error(`Error restoring ${tableName}:`, err); }
        }
      };
      await insertData('staff', backupData.data.staff);
      await insertData('mlt_staff', backupData.data.mlt_staff);
      await Promise.all([
        insertData('attendance', backupData.data.attendance), insertData('advances', backupData.data.advances),
        insertData('mlt_attendance', backupData.data.mlt_attendance), insertData('mlt_advances', backupData.data.mlt_advances),
        insertData('petroleum_sales', backupData.data.petroleum_sales), insertData('petroleum_payments', backupData.data.petroleum_payments),
        insertData('reminders', backupData.data.reminders),
      ]);
      await insertData('payroll', backupData.data.payroll);
      if (backupData.data.app_settings?.length > 0) {
        for (const setting of backupData.data.app_settings) {
          const { data: existing } = await supabase.from('app_settings').select('id').eq('setting_key', setting.setting_key).single();
          if (existing) { await supabase.from('app_settings').update({ setting_value: setting.setting_value }).eq('setting_key', setting.setting_key); }
          else { await supabase.from('app_settings').insert(setting); }
        }
        fetchPin();
      }
      toast.success('Data restored successfully! Please refresh the app.'); setRestoreFile(null);
    } catch { toast.error('Failed to restore data. Check backup format.'); }
    setIsRestoring(false); setBackupConfirm(null);
  };

  return (
    <div className="max-w-5xl mx-auto pb-24 lg:pb-8">
      {/* Header */}
      <motion.div {...fadeIn} className="mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary">
            <Settings className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl lg:text-2xl font-bold text-foreground tracking-tight">Settings</h1>
            <p className="text-xs text-muted-foreground mt-0.5">System configuration & administration</p>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <Tabs defaultValue="security" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 h-auto p-1 bg-muted/50">
          <TabsTrigger value="security" className="text-xs py-2.5 gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Shield className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Security</span>
          </TabsTrigger>
          <TabsTrigger value="backup" className="text-xs py-2.5 gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Database className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Backup</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs py-2.5 gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <Bell className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Alerts</span>
          </TabsTrigger>
          <TabsTrigger value="system" className="text-xs py-2.5 gap-1.5 data-[state=active]:bg-card data-[state=active]:shadow-sm">
            <HardDrive className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Storage</span>
          </TabsTrigger>
        </TabsList>

        {/* SECURITY TAB */}
        <TabsContent value="security" className="space-y-6">
          <motion.div {...fadeIn}>
            <Card className="border border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-accent/10">
                    <Lock className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">App Access PIN</CardTitle>
                    <CardDescription className="text-xs">Secure your application with a PIN code</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label className="text-xs font-medium">Current PIN</Label>
                    <Input type="password" value={currentPin} onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))} placeholder="••••" maxLength={6} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">New PIN</Label>
                    <Input type="password" value={newPin} onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))} placeholder="Min 4 digits" maxLength={6} className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-xs font-medium">Confirm PIN</Label>
                    <Input type="password" value={confirmPin} onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))} placeholder="••••" maxLength={6} className="mt-1" />
                  </div>
                </div>
                <Button onClick={handleChangePin} className="w-full sm:w-auto" disabled={isChangingPin || !currentPin || !newPin || !confirmPin}>
                  {isChangingPin ? 'Updating...' : 'Update PIN'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
            <Card className="border border-border/50">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-chart-1/10">
                    <Clock className="h-4 w-4 text-chart-1" />
                  </div>
                  <div>
                    <CardTitle className="text-sm font-bold">Session Security</CardTitle>
                    <CardDescription className="text-xs">Automatic session management</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">Auto-logout on inactivity</p>
                    <p className="text-xs text-muted-foreground">Session expires after 10 minutes of idle time</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">Session-only storage</p>
                    <p className="text-xs text-muted-foreground">Login clears when tab/browser is closed</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div>
                    <p className="text-sm font-medium text-foreground">Logout warning</p>
                    <p className="text-xs text-muted-foreground">Warning shown 1 minute before auto-logout</p>
                  </div>
                  <Badge variant="secondary" className="text-xs">Active</Badge>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* BACKUP TAB */}
        <TabsContent value="backup" className="space-y-6">
          <motion.div {...fadeIn}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card className="border border-border/50 action-card" onClick={() => setBackupConfirm('backup')}>
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="p-3 rounded-xl bg-primary">
                    <Download className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Download Backup</h3>
                    <p className="text-xs text-muted-foreground mt-1">Export all data as JSON file</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border border-border/50 relative overflow-hidden">
                <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                  <div className="p-3 rounded-xl bg-accent">
                    <Upload className="h-6 w-6 text-accent-foreground" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Restore Data</h3>
                    <p className="text-xs text-muted-foreground mt-1">Upload a backup file to restore</p>
                  </div>
                  <Input type="file" accept=".json" onChange={(e) => setRestoreFile(e.target.files?.[0] || null)} className="mt-1" />
                  {restoreFile && (
                    <Button size="sm" variant="destructive" className="mt-1" onClick={() => setBackupConfirm('restore')} disabled={isRestoring}>
                      {isRestoring ? 'Restoring...' : 'Restore Now'}
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>
          </motion.div>

          <motion.div {...fadeIn} transition={{ delay: 0.1 }}>
            <Card className="border border-border/50 bg-destructive/5">
              <CardContent className="p-4 flex items-start gap-3">
                <Shield className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-destructive">Important Warning</p>
                  <p className="text-xs text-muted-foreground mt-1">Restoring will replace ALL existing data. This action cannot be undone. Always create a backup before restoring.</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div {...fadeIn} transition={{ delay: 0.15 }}>
            <AutoBackupSection />
          </motion.div>

          <motion.div {...fadeIn} transition={{ delay: 0.2 }}>
            <Card className="border border-border/50 bg-muted/30">
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground text-center">
                  Backups include: Staff, Attendance, Advances, Payroll, MLT data, Petroleum Sales, Credit Parties, Dispatch Reports, Reminders, and App Settings.
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* NOTIFICATIONS TAB */}
        <TabsContent value="notifications" className="space-y-6">
          <motion.div {...fadeIn}>
            <WhatsAppSettingsSection />
          </motion.div>
        </TabsContent>

        {/* SYSTEM TAB */}
        <TabsContent value="system" className="space-y-6">
          <motion.div {...fadeIn}>
            <StorageUsageWidget />
          </motion.div>
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialogs */}
      <AlertDialog open={backupConfirm === 'backup'} onOpenChange={() => setBackupConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Database Backup?</AlertDialogTitle>
            <AlertDialogDescription>This will create a complete backup of all your data.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBackup} disabled={isBackingUp}>{isBackingUp ? 'Creating...' : 'Create Backup'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={backupConfirm === 'restore'} onOpenChange={() => setBackupConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">⚠️ Restore Data?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently DELETE all existing data and replace it with the backup. This action CANNOT be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} className="bg-destructive text-destructive-foreground hover:bg-destructive/90" disabled={isRestoring}>
              {isRestoring ? 'Restoring...' : 'Yes, Restore Data'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsSection;