import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Search, Edit2, Save, X, User, Phone, MapPin, Wallet, Building2, Camera, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface Staff {
  id: string;
  name: string;
  category: 'petroleum' | 'crusher' | 'office';
  phone: string | null;
  address: string | null;
  base_salary: number;
  shift_rate: number | null;
  notes: string | null;
  designation: string | null;
  photo_url: string | null;
}

interface StaffDetailsSectionProps {
  onBack: () => void;
  category?: 'petroleum' | 'crusher' | 'office';
}

const StaffDetailsSection = ({ onBack, category }: StaffDetailsSectionProps) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [confirmSave, setConfirmSave] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: '',
    category: 'petroleum' as 'petroleum' | 'crusher' | 'office',
    base_salary: '',
    shift_rate: '',
    notes: '',
    designation: '',
  });

  useEffect(() => {
    fetchData();
  }, [category]);

  const fetchData = async () => {
    setIsLoading(true);
    let query = supabase
      .from('staff')
      .select('id, name, category, phone, address, base_salary, shift_rate, notes, designation, photo_url')
      .eq('is_active', true)
      .order('name');
    
    if (category) query = query.eq('category', category);

    const { data } = await query;
    if (data) setStaffList(data as Staff[]);
    setIsLoading(false);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedStaff) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setIsUploadingPhoto(true);

    try {
      // Convert to base64 for storage
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64Data = reader.result as string;
        
        const { error } = await supabase
          .from('staff')
          .update({ photo_url: base64Data })
          .eq('id', selectedStaff.id);

        if (error) {
          toast.error('Failed to upload photo');
        } else {
          toast.success('Photo uploaded');
          setSelectedStaff({ ...selectedStaff, photo_url: base64Data });
          fetchData();
        }
        setIsUploadingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Failed to upload photo');
      setIsUploadingPhoto(false);
    }
  };

  const removePhoto = async () => {
    if (!selectedStaff) return;
    
    const { error } = await supabase
      .from('staff')
      .update({ photo_url: null })
      .eq('id', selectedStaff.id);

    if (error) {
      toast.error('Failed to remove photo');
    } else {
      toast.success('Photo removed');
      setSelectedStaff({ ...selectedStaff, photo_url: null });
      fetchData();
    }
  };

  const openStaffDetails = (staff: Staff) => {
    setSelectedStaff(staff);
    setEditForm({
      name: staff.name,
      phone: staff.phone || '',
      address: staff.address || '',
      category: staff.category,
      base_salary: staff.base_salary.toString(),
      shift_rate: staff.shift_rate?.toString() || '',
      notes: staff.notes || '',
      designation: staff.designation || '',
    });
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!selectedStaff) return;

    const { error } = await supabase
      .from('staff')
      .update({
        name: editForm.name.trim(),
        phone: editForm.phone.trim() || null,
        address: editForm.address.trim() || null,
        category: editForm.category,
        base_salary: parseFloat(editForm.base_salary) || 0,
        shift_rate: parseFloat(editForm.shift_rate) || 0,
        notes: editForm.notes.trim() || null,
        designation: editForm.designation.trim() || null,
      })
      .eq('id', selectedStaff.id);

    if (error) {
      toast.error('Failed to update staff details');
      return;
    }

    toast.success('Staff details updated');
    setConfirmSave(false);
    setIsEditing(false);
    fetchData();
    
    // Update local selected staff
    setSelectedStaff({
      ...selectedStaff,
      name: editForm.name.trim(),
      phone: editForm.phone.trim() || null,
      address: editForm.address.trim() || null,
      category: editForm.category,
      base_salary: parseFloat(editForm.base_salary) || 0,
      shift_rate: parseFloat(editForm.shift_rate) || 0,
      notes: editForm.notes.trim() || null,
      designation: editForm.designation.trim() || null,
    });
  };

  const filteredStaff = staffList.filter((staff) => {
    return staff.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (staff.phone && staff.phone.includes(searchQuery));
  });

  const categoryTitle = category ? category.charAt(0).toUpperCase() + category.slice(1) + ' ' : '';

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">{categoryTitle}Shift Rates</h1>
      </div>

      {/* Summary */}
      <Card className="mb-4">
        <CardContent className="p-3 text-center">
          <p className="text-xl font-bold text-foreground">{staffList.length}</p>
          <p className="text-xs text-muted-foreground">Total {categoryTitle}Staff</p>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : filteredStaff.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No staff found</div>
      ) : (
        <div className="space-y-2 max-h-[60vh] overflow-y-auto">
          {filteredStaff.map((staff) => (
            <Card 
              key={staff.id} 
              className="cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => openStaffDetails(staff)}
            >
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  {staff.photo_url ? (
                    <img src={staff.photo_url} alt={staff.name} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="p-2 rounded-full bg-primary/10">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{staff.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="capitalize">{staff.category}</span>
                      {staff.phone && <span className="truncate">• {staff.phone}</span>}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground flex-shrink-0">→</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Staff Details Dialog */}
      <Dialog open={!!selectedStaff} onOpenChange={(open) => !open && setSelectedStaff(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              Staff Details
              {!isEditing ? (
                <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
              ) : (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setConfirmSave(true)}>
                    <Save className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedStaff && (
            <div className="space-y-4 mt-4">
              {isEditing ? (
                // Edit Form
                <>
                  <div>
                    <Label>Name *</Label>
                    <Input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Phone</Label>
                    <Input
                      value={editForm.phone}
                      onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                      placeholder="Enter phone number"
                    />
                  </div>
                  <div>
                    <Label>Address</Label>
                    <Textarea
                      value={editForm.address}
                      onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                      placeholder="Enter address"
                    />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v as typeof editForm.category })}>
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
                    <Label>Designation</Label>
                    <Input
                      value={editForm.designation}
                      onChange={(e) => setEditForm({ ...editForm, designation: e.target.value })}
                      placeholder="e.g. Operator, Manager"
                    />
                  </div>
                  <div>
                    <Label>Base Salary (₹)</Label>
                    <Input
                      type="number"
                      value={editForm.base_salary}
                      onChange={(e) => setEditForm({ ...editForm, base_salary: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Shift Rate (₹)</Label>
                    <Input
                      type="number"
                      value={editForm.shift_rate}
                      onChange={(e) => setEditForm({ ...editForm, shift_rate: e.target.value })}
                      placeholder="Amount per shift in ₹"
                    />
                  </div>
                  <div>
                    <Label>Notes</Label>
                    <Textarea
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      placeholder="Add notes..."
                    />
                  </div>
                </>
              ) : (
                // View Mode
                <>
                  {/* Photo Section */}
                  <div className="flex flex-col items-center gap-3">
                    <div className="relative">
                      {selectedStaff.photo_url ? (
                        <img 
                          src={selectedStaff.photo_url} 
                          alt={selectedStaff.name} 
                          className="h-24 w-24 rounded-full object-cover border-4 border-primary/20" 
                        />
                      ) : (
                        <div className="h-24 w-24 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-12 w-12 text-primary" />
                        </div>
                      )}
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={handlePhotoUpload}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingPhoto}
                      >
                        <Camera className="h-4 w-4 mr-1" />
                        {isUploadingPhoto ? 'Uploading...' : selectedStaff.photo_url ? 'Change' : 'Add Photo'}
                      </Button>
                      {selectedStaff.photo_url && (
                        <Button variant="outline" size="sm" onClick={removePhoto}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{selectedStaff.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{selectedStaff.category}</p>
                    </div>
                  </div>

                  {selectedStaff.designation && (
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Designation:</span>
                      <span className="text-foreground">{selectedStaff.designation}</span>
                    </div>
                  )}

                  {selectedStaff.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Phone:</span>
                      <span className="text-foreground">{selectedStaff.phone}</span>
                    </div>
                  )}

                  {selectedStaff.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                      <span className="text-muted-foreground">Address:</span>
                      <span className="text-foreground flex-1">{selectedStaff.address}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Base Salary:</span>
                    <span className="text-foreground font-medium">₹{selectedStaff.base_salary.toLocaleString()}/month</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Wallet className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Shift Rate:</span>
                    <span className="text-foreground font-medium">₹{(selectedStaff.shift_rate || 0).toLocaleString()}/shift</span>
                  </div>

                  {selectedStaff.notes && (
                    <Card className="bg-muted/30">
                      <CardContent className="p-3">
                        <p className="text-xs text-muted-foreground mb-1">Notes</p>
                        <p className="text-sm text-foreground">{selectedStaff.notes}</p>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmSave} onOpenChange={setConfirmSave}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Save Changes?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to save the changes to {editForm.name}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSave}>Save</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default StaffDetailsSection;
