import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Edit2, Trash2, Eye, EyeOff, Shield, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { AppRole } from '@/contexts/AppAuthContext';

interface UserManagementSectionProps {
  onBack: () => void;
}

interface AppUser {
  id: string;
  username: string;
  full_name: string;
  role: AppRole;
  category: string | null;
  is_active: boolean;
  password_hash: string;
}

const ALL_SECTIONS = [
  { key: 'petroleum', label: 'Petroleum' },
  { key: 'petroleum-attendance', label: 'Petroleum Attendance' },
  { key: 'petroleum-advances', label: 'Petroleum Advances' },
  { key: 'petroleum-staff', label: 'Petroleum Staff' },
  { key: 'petroleum-profiles', label: 'Petroleum Profiles' },
  { key: 'crusher', label: 'Crusher' },
  { key: 'crusher-attendance', label: 'Crusher Attendance' },
  { key: 'crusher-advances', label: 'Crusher Advances' },
  { key: 'crusher-staff', label: 'Crusher Staff' },
  { key: 'crusher-profiles', label: 'Crusher Profiles' },
  { key: 'mlt', label: 'MLT Dashboard' },
  { key: 'mlt-attendance', label: 'MLT Attendance' },
  { key: 'mlt-advances', label: 'MLT Advances' },
  { key: 'mlt-staff', label: 'MLT Staff' },
  { key: 'mlt-profiles', label: 'MLT Profiles' },
  { key: 'mlt-services', label: 'MLT Services' },
  { key: 'mlt-fuel-report', label: 'MLT Fuel Report' },
  { key: 'petroleum-sales', label: 'Petroleum Sales' },
  { key: 'tyre-sales', label: 'Tyre Sales' },
  { key: 'credit-parties', label: 'Credit Parties' },
  { key: 'crusher-reports', label: 'Crusher Reports' },
  { key: 'salary', label: 'Salary Management' },
  { key: 'paid-deducted', label: 'Payment/Deduction Status' },
  { key: 'yearly-data', label: 'Yearly Data' },
  { key: 'daily-report', label: 'Daily Reports' },
  { key: 'monthly-calendar', label: 'Monthly Calendar' },
  { key: 'backup', label: 'Monthly Backup' },
  { key: 'settings', label: 'Settings' },
  { key: 'calculator', label: 'Calculator' },
  { key: 'photo-gallery', label: 'Photo Gallery' },
  { key: 'reminders', label: 'Reminders' },
  { key: 'bulk-import', label: 'Import/Export' },
];

const ROLE_PRESETS: Record<string, { sections: string[]; editSections: string[] }> = {
  manager: { sections: ['*'], editSections: ['*'] },
  mlt_admin: {
    sections: ['mlt', 'mlt-attendance', 'mlt-advances', 'mlt-staff', 'mlt-profiles', 'mlt-services', 'mlt-fuel-report'],
    editSections: ['mlt', 'mlt-attendance', 'mlt-advances', 'mlt-staff', 'mlt-profiles', 'mlt-services', 'mlt-fuel-report'],
  },
  petroleum_admin: {
    sections: ['petroleum', 'petroleum-attendance', 'petroleum-advances', 'petroleum-staff', 'petroleum-profiles', 'mlt-fuel-report'],
    editSections: ['petroleum', 'petroleum-attendance', 'petroleum-advances', 'petroleum-staff', 'petroleum-profiles', 'mlt-fuel-report'],
  },
  crusher_admin: {
    sections: ['crusher', 'crusher-attendance', 'crusher-advances', 'crusher-staff', 'crusher-profiles'],
    editSections: ['crusher', 'crusher-attendance', 'crusher-advances', 'crusher-staff', 'crusher-profiles'],
  },
};

const UserManagementSection = ({ onBack }: UserManagementSectionProps) => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<AppUser | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  // Form state
  const [formUsername, setFormUsername] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formRole, setFormRole] = useState<AppRole>('petroleum_admin');
  const [formIsActive, setFormIsActive] = useState(true);
  const [formAccessSections, setFormAccessSections] = useState<string[]>([]);
  const [formEditSections, setFormEditSections] = useState<string[]>([]);
  const [useCustomAccess, setUseCustomAccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    const { data, error } = await supabase.from('app_users').select('*').order('created_at', { ascending: true });
    if (error) {
      toast.error('Failed to load users');
    } else {
      setUsers(data || []);
    }
    setIsLoading(false);
  };

  const resetForm = () => {
    setFormUsername('');
    setFormPassword('');
    setFormFullName('');
    setFormRole('petroleum_admin');
    setFormIsActive(true);
    setFormAccessSections([]);
    setFormEditSections([]);
    setUseCustomAccess(false);
    setShowPassword(false);
  };

  const openCreateForm = () => {
    resetForm();
    setEditingUser(null);
    setIsCreating(true);
  };

  const openEditForm = (user: AppUser) => {
    setFormUsername(user.username);
    setFormPassword(user.password_hash);
    setFormFullName(user.full_name);
    setFormRole(user.role);
    setFormIsActive(user.is_active);
    // Check if user has custom access beyond role preset
    const preset = ROLE_PRESETS[user.role];
    if (preset && !preset.sections.includes('*')) {
      setFormAccessSections(preset.sections);
      setFormEditSections(preset.editSections);
    } else {
      setFormAccessSections([]);
      setFormEditSections([]);
    }
    setUseCustomAccess(false);
    setEditingUser(user);
    setIsCreating(true);
  };

  const handleRoleChange = (role: AppRole) => {
    setFormRole(role);
    if (!useCustomAccess) {
      const preset = ROLE_PRESETS[role];
      setFormAccessSections(preset.sections.includes('*') ? ALL_SECTIONS.map(s => s.key) : preset.sections);
      setFormEditSections(preset.editSections.includes('*') ? ALL_SECTIONS.map(s => s.key) : preset.editSections);
    }
  };

  const toggleAccessSection = (key: string) => {
    setFormAccessSections(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    );
    // Remove from edit if removing from access
    if (formAccessSections.includes(key)) {
      setFormEditSections(prev => prev.filter(s => s !== key));
    }
  };

  const toggleEditSection = (key: string) => {
    if (!formAccessSections.includes(key)) return; // Must have access first
    setFormEditSections(prev =>
      prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (!formUsername.trim()) { toast.error('Username is required'); return; }
    if (!formFullName.trim()) { toast.error('Full name is required'); return; }
    if (!editingUser && !formPassword.trim()) { toast.error('Password is required'); return; }
    if (formPassword.trim().length < 4 && formPassword.trim().length > 0) { toast.error('Password must be at least 4 characters'); return; }

    setIsSaving(true);

    try {
      if (editingUser) {
        const updateData: Record<string, unknown> = {
          username: formUsername.trim(),
          full_name: formFullName.trim(),
          role: formRole,
          is_active: formIsActive,
          updated_at: new Date().toISOString(),
        };
        if (formPassword.trim()) {
          updateData.password_hash = formPassword.trim();
        }

        const { error } = await supabase.from('app_users').update(updateData).eq('id', editingUser.id);
        if (error) throw error;
        toast.success('User updated successfully');
      } else {
        // Check for duplicate username
        const { data: existing } = await supabase.from('app_users').select('id').eq('username', formUsername.trim()).single();
        if (existing) { toast.error('Username already exists'); setIsSaving(false); return; }

        const { error } = await supabase.from('app_users').insert({
          username: formUsername.trim(),
          password_hash: formPassword.trim(),
          full_name: formFullName.trim(),
          role: formRole,
          is_active: formIsActive,
        });
        if (error) throw error;
        toast.success('User created successfully');
      }

      setIsCreating(false);
      resetForm();
      fetchUsers();
    } catch (err: any) {
      console.error('Save error:', err);
      toast.error(err.message || 'Failed to save user');
    }
    setIsSaving(false);
  };

  const handleDelete = async (userId: string) => {
    try {
      const { error } = await supabase.from('app_users').delete().eq('id', userId);
      if (error) throw error;
      toast.success('User deleted');
      fetchUsers();
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete user');
    }
    setDeleteConfirm(null);
  };

  const getRoleBadgeColor = (role: AppRole) => {
    switch (role) {
      case 'manager': return 'default';
      case 'mlt_admin': return 'secondary';
      case 'petroleum_admin': return 'outline';
      case 'crusher_admin': return 'destructive';
    }
  };

  const getRoleLabel = (role: AppRole) => {
    switch (role) {
      case 'manager': return 'Manager';
      case 'mlt_admin': return 'MLT Admin';
      case 'petroleum_admin': return 'Petroleum Admin';
      case 'crusher_admin': return 'Crusher Admin';
    }
  };

  // Create/Edit Form
  if (isCreating) {
    return (
      <div className="p-4 max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => { setIsCreating(false); resetForm(); }}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold text-foreground">{editingUser ? 'Edit User' : 'Add New User'}</h1>
        </div>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">User Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Full Name *</Label>
              <Input value={formFullName} onChange={(e) => setFormFullName(e.target.value)} placeholder="e.g. John Doe" />
            </div>
            <div>
              <Label>Username *</Label>
              <Input value={formUsername} onChange={(e) => setFormUsername(e.target.value)} placeholder="e.g. john1234" />
            </div>
            <div>
              <Label>{editingUser ? 'Password (leave blank to keep current)' : 'Password *'}</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder={editingUser ? '••••••' : 'Enter password'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <div>
              <Label>Role</Label>
              <Select value={formRole} onValueChange={(v) => handleRoleChange(v as AppRole)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager (Full Access)</SelectItem>
                  <SelectItem value="mlt_admin">MLT Admin</SelectItem>
                  <SelectItem value="petroleum_admin">Petroleum Admin</SelectItem>
                  <SelectItem value="crusher_admin">Crusher Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Active</Label>
              <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
            </div>
          </CardContent>
        </Card>

        {/* Access Configuration */}
        {formRole !== 'manager' && (
          <Card className="mb-4">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Access & Permissions
              </CardTitle>
              <CardDescription>
                {useCustomAccess ? 'Custom permissions' : `Using ${getRoleLabel(formRole)} preset`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between mb-4">
                <Label className="text-sm">Customize Access</Label>
                <Switch
                  checked={useCustomAccess}
                  onCheckedChange={(checked) => {
                    setUseCustomAccess(checked);
                    if (!checked) {
                      const preset = ROLE_PRESETS[formRole];
                      setFormAccessSections(preset.sections);
                      setFormEditSections(preset.editSections);
                    } else {
                      const preset = ROLE_PRESETS[formRole];
                      setFormAccessSections([...preset.sections]);
                      setFormEditSections([...preset.editSections]);
                    }
                  }}
                />
              </div>

              {useCustomAccess && (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {ALL_SECTIONS.map((section) => (
                    <div key={section.key} className="flex items-center justify-between py-1.5 border-b border-border/50 last:border-0">
                      <span className="text-sm text-foreground">{section.label}</span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">View</span>
                          <Switch
                            checked={formAccessSections.includes(section.key)}
                            onCheckedChange={() => toggleAccessSection(section.key)}
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-muted-foreground">Edit</span>
                          <Switch
                            checked={formEditSections.includes(section.key)}
                            onCheckedChange={() => toggleEditSection(section.key)}
                            disabled={!formAccessSections.includes(section.key)}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {!useCustomAccess && (
                <div className="flex flex-wrap gap-1.5">
                  {ROLE_PRESETS[formRole].sections.map((s) => (
                    <Badge key={s} variant="secondary" className="text-xs">{ALL_SECTIONS.find(sec => sec.key === s)?.label || s}</Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Button className="w-full" onClick={handleSave} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
        </Button>
      </div>
    );
  }

  // User List
  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground flex-1">User Management</h1>
        <Button size="sm" onClick={openCreateForm}>
          <Plus className="h-4 w-4 mr-1" />
          Add User
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading users...</div>
      ) : users.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No users found</div>
      ) : (
        <div className="space-y-3">
          {users.map((u) => (
            <Card key={u.id} className={!u.is_active ? 'opacity-60' : ''}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground truncate">{u.full_name}</p>
                      {!u.is_active && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground">@{u.username}</p>
                    <Badge variant={getRoleBadgeColor(u.role)} className="mt-1.5 text-xs">
                      {getRoleLabel(u.role)}
                    </Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditForm(u)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => setDeleteConfirm(u.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete User?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove this user. They will no longer be able to log in. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagementSection;
