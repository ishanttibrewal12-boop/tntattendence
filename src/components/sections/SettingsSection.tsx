import { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Database, Download, Upload, RefreshCw } from 'lucide-react';
import AutoBackupSection from './AutoBackupSection';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SettingsSectionProps {
  onBack: () => void;
}

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
        // PGRST116 is "no rows found" - that's ok, we'll use default
        console.log('No PIN found, using default');
      }
    } catch (err) {
      console.log('PIN fetch error, using default');
    }
  };

  const handleChangePin = async () => {
    if (currentPin !== storedPin) {
      toast.error('Current PIN is incorrect');
      return;
    }

    if (newPin.length < 4) {
      toast.error('PIN must be at least 4 digits');
      return;
    }

    if (newPin !== confirmPin) {
      toast.error('New PINs do not match');
      return;
    }

    setIsChangingPin(true);

    try {
      // First check if setting exists
      const { data: existing } = await supabase
        .from('app_settings')
        .select('id')
        .eq('setting_key', 'app_pin')
        .single();

      let error;
      if (existing) {
        // Update existing setting
        const result = await supabase
          .from('app_settings')
          .update({ setting_value: newPin, updated_at: new Date().toISOString() })
          .eq('setting_key', 'app_pin');
        error = result.error;
      } else {
        // Insert new setting
        const result = await supabase
          .from('app_settings')
          .insert({ setting_key: 'app_pin', setting_value: newPin });
        error = result.error;
      }

      if (error) {
        console.error('PIN update error:', error);
        toast.error('Failed to update PIN. Please try again.');
      } else {
        toast.success('PIN updated successfully! New PIN is: ' + newPin);
        setCurrentPin('');
        setNewPin('');
        setConfirmPin('');
        setStoredPin(newPin);
      }
    } catch (err) {
      console.error('PIN update error:', err);
      toast.error('Failed to update PIN');
    }

    setIsChangingPin(false);
  };

  const handleBackup = async () => {
    setIsBackingUp(true);
    try {
      toast.info('Creating backup...');

      // Fetch all data
      const [staffRes, attendanceRes, advancesRes, payrollRes, mltStaffRes, mltAttendanceRes, mltAdvancesRes, petroleumSalesRes, petroleumPaymentsRes, remindersRes, appSettingsRes] = await Promise.all([
        supabase.from('staff').select('*'),
        supabase.from('attendance').select('*'),
        supabase.from('advances').select('*'),
        supabase.from('payroll').select('*'),
        supabase.from('mlt_staff').select('*'),
        supabase.from('mlt_attendance').select('*'),
        supabase.from('mlt_advances').select('*'),
        supabase.from('petroleum_sales').select('*'),
        supabase.from('petroleum_payments').select('*'),
        supabase.from('reminders').select('*'),
        supabase.from('app_settings').select('*'),
      ]);

      const backupData = {
        version: '3.0',
        created_at: new Date().toISOString(),
        data: {
          staff: staffRes.data || [],
          attendance: attendanceRes.data || [],
          advances: advancesRes.data || [],
          payroll: payrollRes.data || [],
          mlt_staff: mltStaffRes.data || [],
          mlt_attendance: mltAttendanceRes.data || [],
          mlt_advances: mltAdvancesRes.data || [],
          petroleum_sales: petroleumSalesRes.data || [],
          petroleum_payments: petroleumPaymentsRes.data || [],
          reminders: remindersRes.data || [],
          app_settings: appSettingsRes.data || [],
        }
      };

      // Create JSON file
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tnt-backup-${format(new Date(), 'yyyy-MM-dd-HHmm')}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Backup created successfully');
    } catch (error) {
      console.error('Backup error:', error);
      toast.error('Failed to create backup');
    }

    setIsBackingUp(false);
    setBackupConfirm(null);
  };

  const handleRestore = async () => {
    if (!restoreFile) {
      toast.error('Please select a backup file');
      return;
    }

    setIsRestoring(true);

    try {
      toast.info('Restoring data... This may take a moment.');

      const text = await restoreFile.text();
      const backupData = JSON.parse(text);

      if (!backupData.version || !backupData.data) {
        throw new Error('Invalid backup file format');
      }

      // Clear existing data (in order to avoid conflicts)
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

      // Restore data helper function
      const insertData = async (tableName: 'staff' | 'attendance' | 'advances' | 'payroll' | 'mlt_staff' | 'mlt_attendance' | 'mlt_advances' | 'petroleum_sales' | 'petroleum_payments' | 'reminders', data: any[]) => {
        if (!data || data.length === 0) return;
        
        // Insert in batches of 100
        const batchSize = 100;
        for (let i = 0; i < data.length; i += batchSize) {
          const batch = data.slice(i, i + batchSize);
          try {
            // Use raw insert approach for dynamic tables
            const { error } = await supabase.from(tableName).insert(batch as any);
            if (error) {
              console.error(`Error restoring ${tableName}:`, error);
            }
          } catch (err) {
            console.error(`Error restoring ${tableName}:`, err);
          }
        }
      };

      // Restore in correct order (dependencies first)
      await insertData('staff', backupData.data.staff);
      await insertData('mlt_staff', backupData.data.mlt_staff);
      
      await Promise.all([
        insertData('attendance', backupData.data.attendance),
        insertData('advances', backupData.data.advances),
        insertData('mlt_attendance', backupData.data.mlt_attendance),
        insertData('mlt_advances', backupData.data.mlt_advances),
        insertData('petroleum_sales', backupData.data.petroleum_sales),
        insertData('petroleum_payments', backupData.data.petroleum_payments),
        insertData('reminders', backupData.data.reminders),
      ]);
      
      await insertData('payroll', backupData.data.payroll);

      // Restore app settings if present
      if (backupData.data.app_settings?.length > 0) {
        for (const setting of backupData.data.app_settings) {
          const { data: existing } = await supabase
            .from('app_settings')
            .select('id')
            .eq('setting_key', setting.setting_key)
            .single();
          
          if (existing) {
            await supabase
              .from('app_settings')
              .update({ setting_value: setting.setting_value })
              .eq('setting_key', setting.setting_key);
          } else {
            await supabase.from('app_settings').insert(setting);
          }
        }
        // Refresh PIN
        fetchPin();
      }

      toast.success('Data restored successfully! Please refresh the app.');
      setRestoreFile(null);
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore data. Please check the backup file format.');
    }

    setIsRestoring(false);
    setBackupConfirm(null);
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Settings</h1>
      </div>

      {/* Change PIN */}
      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Change PIN
          </CardTitle>
          <CardDescription>Update the app access PIN (Current PIN required)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Current PIN</Label>
            <Input
              type="password"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter current PIN"
              maxLength={6}
            />
          </div>
          <div>
            <Label>New PIN (min 4 digits)</Label>
            <Input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Enter new PIN"
              maxLength={6}
            />
          </div>
          <div>
            <Label>Confirm New PIN</Label>
            <Input
              type="password"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Confirm new PIN"
              maxLength={6}
            />
          </div>
          <Button 
            onClick={handleChangePin} 
            className="w-full"
            disabled={isChangingPin || !currentPin || !newPin || !confirmPin}
          >
            {isChangingPin ? 'Updating...' : 'Update PIN'}
          </Button>
        </CardContent>
      </Card>

      {/* Backup & Restore */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Backup & Restore
          </CardTitle>
          <CardDescription>Create database backups or restore from previous backups</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={() => setBackupConfirm('backup')}
            disabled={isBackingUp}
          >
            <Download className="h-4 w-4 mr-2" />
            {isBackingUp ? 'Creating Backup...' : 'Create Database Backup'}
          </Button>

          <div className="border-t pt-4">
            <Label>Restore from Backup File</Label>
            <Input
              type="file"
              accept=".json"
              onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
              className="mt-1"
            />
            {restoreFile && (
              <p className="text-xs text-muted-foreground mt-1">
                Selected: {restoreFile.name}
              </p>
            )}
          </div>

          <Button 
            variant="outline"
            className="w-full"
            disabled={!restoreFile || isRestoring}
            onClick={() => setBackupConfirm('restore')}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isRestoring ? 'Restoring...' : 'Restore Data'}
          </Button>

          <div className="bg-destructive/10 p-3 rounded-lg">
            <p className="text-xs text-destructive font-medium">⚠️ Warning</p>
            <p className="text-xs text-muted-foreground">
              Restoring will replace ALL existing data with the backup data. This action cannot be undone.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Auto Backup Section */}
      <AutoBackupSection />

      {/* Info Card */}
      <Card className="mt-4 bg-muted/50">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground text-center">
            Backups include: Staff, Attendance, Advances, Payroll, MLT data, Petroleum Sales, Credit Parties, Dispatch Reports, Reminders, and App Settings.
          </p>
        </CardContent>
      </Card>

      {/* Confirmation Dialogs */}
      <AlertDialog open={backupConfirm === 'backup'} onOpenChange={() => setBackupConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Database Backup?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a complete backup of all your data including staff, attendance, advances, payroll, MLT, petroleum sales, reminders, and app settings.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBackup} disabled={isBackingUp}>
              {isBackingUp ? 'Creating...' : 'Create Backup'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={backupConfirm === 'restore'} onOpenChange={() => setBackupConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">⚠️ Restore Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently DELETE all existing data and replace it with the backup data. 
              This action CANNOT be undone. Are you absolutely sure?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRestore} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isRestoring}
            >
              {isRestoring ? 'Restoring...' : 'Yes, Restore Data'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsSection;