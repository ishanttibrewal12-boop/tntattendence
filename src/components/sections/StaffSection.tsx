import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Search, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Staff {
  id: string;
  name: string;
  category: 'petroleum' | 'crusher' | 'office';
  phone: string | null;
  base_salary: number;
  is_active: boolean;
  notes: string | null;
  address: string | null;
}

interface StaffSectionProps {
  onBack: () => void;
}

const StaffSection = ({ onBack }: StaffSectionProps) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'petroleum' | 'crusher' | 'office'>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<Staff | null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [confirmAdd, setConfirmAdd] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [category, setCategory] = useState<'petroleum' | 'crusher' | 'office'>('petroleum');
  const [baseSalary, setBaseSalary] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const { data } = await supabase
      .from('staff')
      .select('id, name, category, phone, base_salary, is_active, notes, address')
      .eq('is_active', true)
      .order('name');

    if (data) setStaffList(data as Staff[]);
    setIsLoading(false);
  };

  const resetForm = () => {
    setName('');
    setPhone('');
    setAddress('');
    setCategory('petroleum');
    setBaseSalary('');
    setNotes('');
    setEditingStaff(null);
  };

  const openEditDialog = (staff: Staff) => {
    setEditingStaff(staff);
    setName(staff.name);
    setPhone(staff.phone || '');
    setAddress(staff.address || '');
    setCategory(staff.category);
    setBaseSalary(staff.base_salary.toString());
    setNotes(staff.notes || '');
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error('Please enter name');
      return;
    }

    if (editingStaff) {
      // Update existing staff
      const { error } = await supabase
        .from('staff')
        .update({
          name: name.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
          category,
          base_salary: parseFloat(baseSalary) || 0,
          notes: notes.trim() || null,
        })
        .eq('id', editingStaff.id);

      if (error) {
        toast.error('Failed to update staff');
        return;
      }
      toast.success('Staff updated');
    } else {
      // Add new staff
      const { error } = await supabase.from('staff').insert({
        name: name.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        category,
        base_salary: parseFloat(baseSalary) || 0,
        notes: notes.trim() || null,
      });

      if (error) {
        toast.error('Failed to add staff');
        return;
      }
      toast.success('Staff added');
    }

    setDialogOpen(false);
    setConfirmAdd(false);
    resetForm();
    fetchData();
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('staff')
      .update({ is_active: false })
      .eq('id', deleteDialog.id);

    if (error) {
      toast.error('Failed to delete staff');
      return;
    }

    toast.success('Staff removed');
    setDeleteDialog(null);
    fetchData();
  };

  const filteredStaff = staffList.filter((staff) => {
    const matchesSearch = staff.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || staff.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  const petroleumCount = staffList.filter(s => s.category === 'petroleum').length;
  const crusherCount = staffList.filter(s => s.category === 'crusher').length;
  const officeCount = staffList.filter(s => s.category === 'office').length;

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Staff Management</h1>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        <Card>
          <CardContent className="p-2 text-center">
            <p className="text-xl font-bold text-foreground">{staffList.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <p className="text-xl font-bold text-primary">{petroleumCount}</p>
            <p className="text-xs text-muted-foreground">Petroleum</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <p className="text-xl font-bold text-secondary">{crusherCount}</p>
            <p className="text-xs text-muted-foreground">Crusher</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-2 text-center">
            <p className="text-xl font-bold text-chart-3">{officeCount}</p>
            <p className="text-xs text-muted-foreground">Office</p>
          </CardContent>
        </Card>
      </div>

      {/* Add Button */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogTrigger asChild>
          <Button className="w-full mb-4">
            <Plus className="h-4 w-4 mr-2" />
            Add Staff
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff' : 'Add New Staff'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter name"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <Label>Address</Label>
              <Textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter address"
                className="min-h-[60px]"
              />
            </div>
            <div>
              <Label>Category *</Label>
              <Select value={category} onValueChange={(v) => setCategory(v as typeof category)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="petroleum">Petroleum</SelectItem>
                  <SelectItem value="crusher">Crusher</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Base Salary (₹)</Label>
              <Input
                type="number"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
                placeholder="Enter monthly salary"
              />
            </div>
            <div>
              <Label>Notes</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this staff..."
                className="min-h-[60px]"
              />
            </div>
            <Button onClick={() => editingStaff ? handleSubmit() : setConfirmAdd(true)} className="w-full">
              {editingStaff ? 'Update Staff' : 'Add Staff'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search and Filter */}
      <div className="space-y-2 mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="petroleum">Petroleum</SelectItem>
            <SelectItem value="crusher">Crusher</SelectItem>
            <SelectItem value="office">Office</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Staff List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : filteredStaff.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No staff found</div>
      ) : (
        <div className="space-y-2">
          {filteredStaff.map((staff) => (
            <Card key={staff.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{staff.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{staff.category}</span>
                      {staff.phone && <span>• {staff.phone}</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">₹{staff.base_salary.toLocaleString()}/month</p>
                    {staff.notes && (
                      <p className="text-xs text-muted-foreground mt-1 bg-muted/30 p-1 rounded">📝 {staff.notes}</p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => openEditDialog(staff)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive"
                      onClick={() => setDeleteDialog(staff)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add Confirmation Dialog */}
      <AlertDialog open={confirmAdd} onOpenChange={setConfirmAdd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Staff?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to add {name} as a {category} staff member?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>Add</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {deleteDialog?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StaffSection;
