import { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Database, Download, Upload } from 'lucide-react';
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

  useEffect(() => {
    fetchPin();
  }, []);

  const fetchPin = async () => {
    const { data } = await supabase
      .from('app_settings')
      .select('setting_value')
      .eq('setting_key', 'app_pin')
      .single();
    
    if (data?.setting_value) {
      setStoredPin(data.setting_value);
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
        toast.success('PIN updated successfully');
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
    try {
      toast.info('Creating backup...');

      // Fetch all data
      const [staffRes, attendanceRes, advancesRes, payrollRes, mltStaffRes, mltAttendanceRes, mltAdvancesRes, petroleumSalesRes] = await Promise.all([
        supabase.from('staff').select('*'),
        supabase.from('attendance').select('*'),
        supabase.from('advances').select('*'),
        supabase.from('payroll').select('*'),
        supabase.from('mlt_staff').select('*'),
        supabase.from('mlt_attendance').select('*'),
        supabase.from('mlt_advances').select('*'),
        supabase.from('petroleum_sales').select('*'),
      ]);

      const backupData = {
        version: '2.0',
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
      toast.error('Failed to create backup');
    }

    setBackupConfirm(null);
  };

  const handleRestore = async () => {
    if (!restoreFile) {
      toast.error('Please select a backup file');
      return;
    }

    try {
      toast.info('Restoring data...');

      const text = await restoreFile.text();
      const backupData = JSON.parse(text);

      if (!backupData.version || !backupData.data) {
        throw new Error('Invalid backup file');
      }

      // Clear existing data (in order to avoid conflicts)
      await supabase.from('payroll').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('advances').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('staff').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('mlt_advances').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('mlt_attendance').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('mlt_staff').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('petroleum_sales').delete().neq('id', '00000000-0000-0000-0000-000000000000');

      // Restore data
      if (backupData.data.staff?.length) {
        await supabase.from('staff').insert(backupData.data.staff);
      }
      if (backupData.data.attendance?.length) {
        await supabase.from('attendance').insert(backupData.data.attendance);
      }
      if (backupData.data.advances?.length) {
        await supabase.from('advances').insert(backupData.data.advances);
      }
      if (backupData.data.payroll?.length) {
        await supabase.from('payroll').insert(backupData.data.payroll);
      }
      if (backupData.data.mlt_staff?.length) {
        await supabase.from('mlt_staff').insert(backupData.data.mlt_staff);
      }
      if (backupData.data.mlt_attendance?.length) {
        await supabase.from('mlt_attendance').insert(backupData.data.mlt_attendance);
      }
      if (backupData.data.mlt_advances?.length) {
        await supabase.from('mlt_advances').insert(backupData.data.mlt_advances);
      }
      if (backupData.data.petroleum_sales?.length) {
        await supabase.from('petroleum_sales').insert(backupData.data.petroleum_sales);
      }

      toast.success('Data restored successfully');
      setRestoreFile(null);
    } catch (error) {
      console.error('Restore error:', error);
      toast.error('Failed to restore data. Please check the backup file.');
    }

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
          <CardDescription>Update the app access PIN</CardDescription>
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
            <Label>New PIN</Label>
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
          <CardDescription>Create backups or restore from previous backups</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button 
            variant="secondary" 
            className="w-full"
            onClick={() => setBackupConfirm('backup')}
          >
            <Download className="h-4 w-4 mr-2" />
            Create Backup
          </Button>

          <div>
            <Label>Restore from Backup</Label>
            <Input
              type="file"
              accept=".json"
              onChange={(e) => setRestoreFile(e.target.files?.[0] || null)}
              className="mt-1"
            />
          </div>

          <Button 
            variant="outline"
            className="w-full"
            disabled={!restoreFile}
            onClick={() => setBackupConfirm('restore')}
          >
            <Upload className="h-4 w-4 mr-2" />
            Restore Data
          </Button>

          <p className="text-xs text-muted-foreground text-center">
            ⚠️ Restoring will replace all existing data
          </p>
        </CardContent>
      </Card>

      {/* Confirmation Dialogs */}
      <AlertDialog open={backupConfirm === 'backup'} onOpenChange={() => setBackupConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Backup?</AlertDialogTitle>
            <AlertDialogDescription>
              This will create a backup of all your data (staff, attendance, advances, payroll, MLT, petroleum sales).
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleBackup}>Create Backup</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={backupConfirm === 'restore'} onOpenChange={() => setBackupConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore Data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will replace ALL existing data with the backup data. This action cannot be undone.
              Are you sure you want to continue?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRestore} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Restore
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default SettingsSection;
