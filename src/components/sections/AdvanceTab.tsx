import { useState, useEffect } from 'react';
import { Plus, Trash2, Download, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Staff {
  id: string;
  name: string;
  category: 'petroleum' | 'crusher';
}

interface Advance {
  id: string;
  staff_id: string;
  amount: number;
  date: string;
  notes: string | null;
  is_deducted: boolean;
  staff?: Staff;
}

const AdvanceTab = () => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [advances, setAdvances] = useState<Advance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState('');
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'petroleum' | 'crusher'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [staffRes, advancesRes] = await Promise.all([
      supabase.from('staff').select('id, name, category').eq('is_active', true).order('name'),
      supabase.from('advances').select('*').eq('is_deducted', false).order('date', { ascending: false }),
    ]);

    if (staffRes.data) setStaffList(staffRes.data as Staff[]);
    if (advancesRes.data) {
      const advancesWithStaff = advancesRes.data.map((adv) => ({
        ...adv,
        staff: staffRes.data?.find((s) => s.id === adv.staff_id),
      }));
      setAdvances(advancesWithStaff as Advance[]);
    }
    setIsLoading(false);
  };

  const handleAddAdvance = async () => {
    if (!selectedStaffId || !amount) {
      toast.error('Please select staff and enter amount');
      return;
    }

    const { error } = await supabase.from('advances').insert({
      staff_id: selectedStaffId,
      amount: parseFloat(amount),
      notes: notes || null,
      date: format(new Date(), 'yyyy-MM-dd'),
    });

    if (error) {
      toast.error('Failed to add advance');
      return;
    }

    toast.success('Advance added');
    setDialogOpen(false);
    setSelectedStaffId('');
    setAmount('');
    setNotes('');
    fetchData();
  };

  const handleDeleteAdvance = async (id: string) => {
    const { error } = await supabase.from('advances').delete().eq('id', id);
    if (error) {
      toast.error('Failed to delete advance');
      return;
    }
    toast.success('Advance deleted');
    fetchData();
  };

  const getStaffAdvances = (staffId: string) => {
    return advances.filter((a) => a.staff_id === staffId);
  };

  const getStaffTotalAdvance = (staffId: string) => {
    return advances.filter((a) => a.staff_id === staffId).reduce((sum, a) => sum + Number(a.amount), 0);
  };

  const filteredStaff = categoryFilter === 'all' 
    ? staffList 
    : staffList.filter(s => s.category === categoryFilter);

  const staffWithAdvances = filteredStaff.filter((s) => getStaffTotalAdvance(s.id) > 0);

  const totalAdvances = advances.reduce((sum, a) => sum + Number(a.amount), 0);

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    doc.setFontSize(18);
    doc.text('Pending Advances Report', 14, 20);
    doc.setFontSize(12);
    doc.text(`Generated: ${format(new Date(), 'dd MMM yyyy')}`, 14, 30);
    doc.text(`Total Pending: ₹${totalAdvances.toLocaleString()}`, 14, 38);

    const tableData = staffWithAdvances.map((staff) => [
      staff.name,
      staff.category,
      `₹${getStaffTotalAdvance(staff.id).toLocaleString()}`,
    ]);

    autoTable(doc, {
      head: [['Name', 'Category', 'Pending Advance']],
      body: tableData,
      startY: 48,
    });

    doc.save(`advances-${format(new Date(), 'yyyy-MM-dd')}.pdf`);
    toast.success('PDF downloaded');
  };

  const shareToWhatsApp = () => {
    let message = `💰 *Pending Advances Report*\n`;
    message += `Date: ${format(new Date(), 'dd MMM yyyy')}\n\n`;
    message += `Total Pending: ₹${totalAdvances.toLocaleString()}\n\n`;

    staffWithAdvances.forEach((staff) => {
      message += `${staff.name} (${staff.category}): ₹${getStaffTotalAdvance(staff.id).toLocaleString()}\n`;
    });

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${encodedMessage}`, '_blank');
  };

  return (
    <div>
      {/* Summary Card */}
      <Card className="mb-4 bg-primary text-primary-foreground">
        <CardContent className="p-4">
          <p className="text-sm opacity-90">Total Pending Advances</p>
          <p className="text-2xl font-bold">₹{totalAdvances.toLocaleString()}</p>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="text-xs">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Advance Payment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <Label>Staff</Label>
                <Select value={selectedStaffId} onValueChange={setSelectedStaffId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select staff" />
                  </SelectTrigger>
                  <SelectContent>
                    {staffList.map((staff) => (
                      <SelectItem key={staff.id} value={staff.id}>
                        {staff.name} ({staff.category})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Amount (₹)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label>Notes (Optional)</Label>
                <Input
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add notes"
                />
              </div>
              <Button onClick={handleAddAdvance} className="w-full">
                Add Advance
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Button variant="secondary" size="sm" className="text-xs" onClick={exportToPDF}>
          <Download className="h-4 w-4 mr-1" />
          PDF
        </Button>
        <Button variant="secondary" size="sm" className="text-xs" onClick={shareToWhatsApp}>
          <Share2 className="h-4 w-4 mr-1" />
          Share
        </Button>
      </div>

      {/* Category Filter */}
      <div className="mb-4">
        <Select value={categoryFilter} onValueChange={(v) => setCategoryFilter(v as typeof categoryFilter)}>
          <SelectTrigger>
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Staff</SelectItem>
            <SelectItem value="petroleum">Petroleum</SelectItem>
            <SelectItem value="crusher">Crusher</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Advances List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading...</div>
      ) : staffWithAdvances.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">No pending advances</div>
      ) : (
        <div className="space-y-3">
          {staffWithAdvances.map((staff) => {
            const staffAdvances = getStaffAdvances(staff.id);
            const total = getStaffTotalAdvance(staff.id);
            return (
              <Card key={staff.id}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="font-medium text-foreground">{staff.name}</p>
                      <p className="text-xs text-muted-foreground capitalize">{staff.category}</p>
                    </div>
                    <p className="font-bold text-foreground">₹{total.toLocaleString()}</p>
                  </div>
                  <div className="space-y-1">
                    {staffAdvances.map((adv) => (
                      <div key={adv.id} className="flex items-center justify-between text-sm bg-muted/30 p-2 rounded">
                        <div>
                          <span className="text-muted-foreground">{format(new Date(adv.date), 'dd MMM')}</span>
                          <span className="ml-2">₹{Number(adv.amount).toLocaleString()}</span>
                          {adv.notes && <span className="text-xs text-muted-foreground ml-2">({adv.notes})</span>}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => handleDeleteAdvance(adv.id)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdvanceTab;
