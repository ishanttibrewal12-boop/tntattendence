import { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft, Plus, Trash2, Search, Edit2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  category?: 'petroleum' | 'crusher' | 'office';
}

const PAGE_SIZE = 50;

const StaffSection = ({ onBack, category }: StaffSectionProps) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<Staff | null>(null);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [confirmAdd, setConfirmAdd] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const searchTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [baseSalary, setBaseSalary] = useState('');
  const [notes, setNotes] = useState('');

  const categoryTitle = category ? category.charAt(0).toUpperCase() + category.slice(1) + ' ' : '';

  // Debounce search
  useEffect(() => {
    searchTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(searchTimerRef.current);
  }, [searchQuery]);

  // Reset and fetch when search or category changes
  useEffect(() => {
    setStaffList([]);
    setPage(0);
    setHasMore(true);
    fetchPage(0, true);
  }, [category, debouncedSearch]);

  const fetchPage = useCallback(async (pageNum: number, reset = false) => {
    if (reset) setIsLoading(true);
    else setIsLoadingMore(true);

    const from = pageNum * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;

    let query = supabase
      .from('staff')
      .select('id, name, category, phone, base_salary, is_active, notes, address', { count: 'exact' })
      .eq('is_active', true)
      .order('name')
      .range(from, to);

    if (category) query = query.eq('category', category);
    if (debouncedSearch) query = query.ilike('name', `%${debouncedSearch}%`);

    const { data, count } = await query;
    
    if (data) {
      setStaffList(prev => reset ? data as Staff[] : [...prev, ...(data as Staff[])]);
      setTotalCount(count || 0);
      setHasMore(data.length === PAGE_SIZE);
    }
    
    setIsLoading(false);
    setIsLoadingMore(false);
  }, [category, debouncedSearch]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el || isLoadingMore || !hasMore) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 200) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPage(nextPage);
    }
  }, [page, isLoadingMore, hasMore, fetchPage]);

  const resetForm = () => {
    setName('');
    setPhone('');
    setAddress('');
    setBaseSalary('');
    setNotes('');
    setEditingStaff(null);
  };

  const openEditDialog = (staff: Staff) => {
    setEditingStaff(staff);
    setName(staff.name);
    setPhone(staff.phone || '');
    setAddress(staff.address || '');
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
      const { error } = await supabase
        .from('staff')
        .update({
          name: name.trim(),
          phone: phone.trim() || null,
          address: address.trim() || null,
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
      const { error } = await supabase.from('staff').insert({
        name: name.trim(),
        phone: phone.trim() || null,
        address: address.trim() || null,
        category: category || 'petroleum',
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
    setStaffList([]);
    setPage(0);
    setHasMore(true);
    fetchPage(0, true);
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;

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
    setStaffList([]);
    setPage(0);
    setHasMore(true);
    fetchPage(0, true);
  };

  return (
    <div className="p-4 lg:p-6 max-w-5xl mx-auto">
      <h1 className="text-lg lg:text-xl font-bold text-foreground mb-4">{categoryTitle}Staff Management</h1>

      {/* Summary */}
      <Card className="mb-4">
        <CardContent className="p-3 text-center">
          <p className="text-2xl font-bold text-foreground">{totalCount}</p>
          <p className="text-xs text-muted-foreground">Total {categoryTitle}Staff</p>
        </CardContent>
      </Card>

      {/* Add Button */}
      <Dialog open={dialogOpen} onOpenChange={(open) => {
        setDialogOpen(open);
        if (!open) resetForm();
      }}>
        <DialogTrigger asChild>
          <Button className="w-full mb-4">
            <Plus className="h-4 w-4 mr-2" />
            Add {categoryTitle}Staff
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingStaff ? 'Edit Staff' : `Add New ${categoryTitle}Staff`}</DialogTitle>
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

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            className="pl-10"
            placeholder="Search staff..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Staff List */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="border">
              <CardContent className="p-3 flex items-center gap-3">
                <div className="animate-pulse bg-muted h-10 w-10 rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="animate-pulse bg-muted h-4 w-32 rounded" />
                  <div className="animate-pulse bg-muted h-3 w-20 rounded" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : staffList.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm font-medium">No staff found</p>
          <p className="text-xs mt-1">Try adjusting your search or add new staff</p>
        </div>
      ) : (
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="space-y-2 max-h-[60vh] overflow-y-auto pr-1"
        >
          {staffList.map((staff) => (
            <Card key={staff.id}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{staff.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      {staff.phone && <span>{staff.phone}</span>}
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
          {isLoadingMore && (
            <div className="flex justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!hasMore && staffList.length > 0 && (
            <p className="text-center text-xs text-muted-foreground py-2">
              Showing all {totalCount} staff
            </p>
          )}
        </div>
      )}

      {/* Add Confirmation Dialog */}
      <AlertDialog open={confirmAdd} onOpenChange={setConfirmAdd}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add Staff?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to add {name} as a {category || 'petroleum'} staff member?
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
