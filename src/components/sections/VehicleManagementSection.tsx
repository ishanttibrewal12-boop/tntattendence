import { useState, useEffect } from 'react';
import { Plus, Truck, AlertTriangle, Wrench, Calendar, Fuel, Trash2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, differenceInDays } from 'date-fns';

interface VehicleManagementProps {
  onBack: () => void;
}

const VehicleManagementSection = ({ onBack }: VehicleManagementProps) => {
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [maintenance, setMaintenance] = useState<any[]>([]);
  const [fuelLogs, setFuelLogs] = useState<any[]>([]);
  const [dispatches, setDispatches] = useState<any[]>([]);
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isAddMaintenanceOpen, setIsAddMaintenanceOpen] = useState(false);
  const [isEditVehicleOpen, setIsEditVehicleOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<any>(null);
  const [newVehicle, setNewVehicle] = useState({ truck_number: '', driver_name: '', insurance_expiry: '', fitness_expiry: '', notes: '' });
  const [editVehicleForm, setEditVehicleForm] = useState({ truck_number: '', driver_name: '', insurance_expiry: '', fitness_expiry: '', notes: '' });
  const [newMaintenance, setNewMaintenance] = useState({ vehicle_id: '', maintenance_type: '', description: '', cost: '', date: format(new Date(), 'yyyy-MM-dd'), next_due_date: '' });

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [vRes, mRes, fRes, dRes] = await Promise.all([
      supabase.from('vehicles').select('*').eq('is_active', true).order('truck_number'),
      supabase.from('vehicle_maintenance').select('*').order('date', { ascending: false }).limit(50),
      supabase.from('mlt_fuel_reports').select('*').order('date', { ascending: false }).limit(100),
      supabase.from('dispatch_reports').select('truck_number, date, party_name, quantity, amount').order('date', { ascending: false }).limit(100),
    ]);
    setVehicles(vRes.data || []);
    setMaintenance(mRes.data || []);
    setFuelLogs(fRes.data || []);
    setDispatches(dRes.data || []);
  };

  const handleAddVehicle = async () => {
    if (!newVehicle.truck_number) { toast.error('Enter truck number'); return; }
    const { error } = await supabase.from('vehicles').insert({
      truck_number: newVehicle.truck_number.toUpperCase(),
      driver_name: newVehicle.driver_name || null,
      insurance_expiry: newVehicle.insurance_expiry || null,
      fitness_expiry: newVehicle.fitness_expiry || null,
      notes: newVehicle.notes || null,
    });
    if (error) { toast.error(error.message); return; }
    toast.success('Vehicle added!');
    setIsAddVehicleOpen(false);
    setNewVehicle({ truck_number: '', driver_name: '', insurance_expiry: '', fitness_expiry: '', notes: '' });
    fetchData();
  };

  const handleAddMaintenance = async () => {
    if (!newMaintenance.vehicle_id || !newMaintenance.maintenance_type) { toast.error('Fill required fields'); return; }
    const { error } = await supabase.from('vehicle_maintenance').insert({
      vehicle_id: newMaintenance.vehicle_id, maintenance_type: newMaintenance.maintenance_type,
      description: newMaintenance.description || null, cost: parseFloat(newMaintenance.cost) || 0,
      date: newMaintenance.date, next_due_date: newMaintenance.next_due_date || null,
    });
    if (error) { toast.error('Failed'); return; }
    toast.success('Maintenance recorded!');
    setIsAddMaintenanceOpen(false);
    setNewMaintenance({ vehicle_id: '', maintenance_type: '', description: '', cost: '', date: format(new Date(), 'yyyy-MM-dd'), next_due_date: '' });
    fetchData();
  };

  const handleDeleteVehicle = async (id: string) => {
    if (!confirm('Delete this vehicle? Maintenance records will also be removed.')) return;
    await supabase.from('vehicle_maintenance').delete().eq('vehicle_id', id);
    await supabase.from('vehicles').delete().eq('id', id);
    toast.success('Vehicle deleted');
    fetchData();
  };

  const handleDeleteMaintenance = async (id: string) => {
    if (!confirm('Delete this maintenance record?')) return;
    await supabase.from('vehicle_maintenance').delete().eq('id', id);
    toast.success('Record deleted');
    fetchData();
  };

  const openEditVehicle = (v: any) => {
    setEditingVehicle(v);
    setEditVehicleForm({
      truck_number: v.truck_number, driver_name: v.driver_name || '',
      insurance_expiry: v.insurance_expiry || '', fitness_expiry: v.fitness_expiry || '', notes: v.notes || '',
    });
    setIsEditVehicleOpen(true);
  };

  const handleEditVehicle = async () => {
    if (!editingVehicle) return;
    const { error } = await supabase.from('vehicles').update({
      truck_number: editVehicleForm.truck_number.toUpperCase(),
      driver_name: editVehicleForm.driver_name || null,
      insurance_expiry: editVehicleForm.insurance_expiry || null,
      fitness_expiry: editVehicleForm.fitness_expiry || null,
      notes: editVehicleForm.notes || null,
    }).eq('id', editingVehicle.id);
    if (error) { toast.error('Failed to update'); return; }
    toast.success('Vehicle updated');
    setIsEditVehicleOpen(false);
    setEditingVehicle(null);
    fetchData();
  };

  const expiryAlerts = vehicles.filter(v => {
    const insExpiry = v.insurance_expiry ? differenceInDays(new Date(v.insurance_expiry), new Date()) : 999;
    const fitExpiry = v.fitness_expiry ? differenceInDays(new Date(v.fitness_expiry), new Date()) : 999;
    return insExpiry < 30 || fitExpiry < 30;
  });

  return (
    <div className="p-4 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-bold text-foreground">🚛 Vehicle Management</h1>
      </div>

      {expiryAlerts.length > 0 && (
        <Card className="mb-4 border-orange-500/50"><CardContent className="p-3">
          <div className="flex items-center gap-2 text-orange-600 mb-1">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-bold">Expiry Alerts</p>
          </div>
          {expiryAlerts.map(v => {
            const insD = v.insurance_expiry ? differenceInDays(new Date(v.insurance_expiry), new Date()) : null;
            const fitD = v.fitness_expiry ? differenceInDays(new Date(v.fitness_expiry), new Date()) : null;
            return (
              <p key={v.id} className="text-xs text-muted-foreground">
                {v.truck_number}: {insD !== null && insD < 30 ? `Insurance ${insD < 0 ? 'EXPIRED' : `in ${insD}d`}` : ''} {fitD !== null && fitD < 30 ? `Fitness ${fitD < 0 ? 'EXPIRED' : `in ${fitD}d`}` : ''}
              </p>
            );
          })}
        </CardContent></Card>
      )}

      <div className="flex gap-2 mb-4">
        <Dialog open={isAddVehicleOpen} onOpenChange={setIsAddVehicleOpen}>
          <DialogTrigger asChild><Button size="sm" className="flex-1"><Plus className="h-4 w-4 mr-1" /> Add Vehicle</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Vehicle</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Truck Number *</Label><Input value={newVehicle.truck_number} onChange={e => setNewVehicle({...newVehicle, truck_number: e.target.value})} placeholder="JH 05 AB 1234" /></div>
              <div><Label>Driver Name</Label><Input value={newVehicle.driver_name} onChange={e => setNewVehicle({...newVehicle, driver_name: e.target.value})} /></div>
              <div><Label>Insurance Expiry</Label><Input type="date" value={newVehicle.insurance_expiry} onChange={e => setNewVehicle({...newVehicle, insurance_expiry: e.target.value})} /></div>
              <div><Label>Fitness Expiry</Label><Input type="date" value={newVehicle.fitness_expiry} onChange={e => setNewVehicle({...newVehicle, fitness_expiry: e.target.value})} /></div>
              <div><Label>Notes</Label><Textarea value={newVehicle.notes} onChange={e => setNewVehicle({...newVehicle, notes: e.target.value})} /></div>
              <Button className="w-full" onClick={handleAddVehicle}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
        <Dialog open={isAddMaintenanceOpen} onOpenChange={setIsAddMaintenanceOpen}>
          <DialogTrigger asChild><Button variant="outline" size="sm"><Wrench className="h-4 w-4 mr-1" /> Maintenance</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Add Maintenance Record</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Vehicle *</Label>
                <select className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={newMaintenance.vehicle_id} onChange={e => setNewMaintenance({...newMaintenance, vehicle_id: e.target.value})}>
                  <option value="">Select</option>
                  {vehicles.map(v => <option key={v.id} value={v.id}>{v.truck_number}</option>)}
                </select>
              </div>
              <div><Label>Type *</Label><Input value={newMaintenance.maintenance_type} onChange={e => setNewMaintenance({...newMaintenance, maintenance_type: e.target.value})} placeholder="Oil change, tyre, etc." /></div>
              <div><Label>Description</Label><Textarea value={newMaintenance.description} onChange={e => setNewMaintenance({...newMaintenance, description: e.target.value})} /></div>
              <div><Label>Cost (₹)</Label><Input type="number" value={newMaintenance.cost} onChange={e => setNewMaintenance({...newMaintenance, cost: e.target.value})} /></div>
              <div><Label>Date</Label><Input type="date" value={newMaintenance.date} onChange={e => setNewMaintenance({...newMaintenance, date: e.target.value})} /></div>
              <div><Label>Next Due Date</Label><Input type="date" value={newMaintenance.next_due_date} onChange={e => setNewMaintenance({...newMaintenance, next_due_date: e.target.value})} /></div>
              <Button className="w-full" onClick={handleAddMaintenance}>Save</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Edit Vehicle Dialog */}
      <Dialog open={isEditVehicleOpen} onOpenChange={setIsEditVehicleOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Vehicle</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Truck Number</Label><Input value={editVehicleForm.truck_number} onChange={e => setEditVehicleForm({...editVehicleForm, truck_number: e.target.value})} /></div>
            <div><Label>Driver Name</Label><Input value={editVehicleForm.driver_name} onChange={e => setEditVehicleForm({...editVehicleForm, driver_name: e.target.value})} /></div>
            <div><Label>Insurance Expiry</Label><Input type="date" value={editVehicleForm.insurance_expiry} onChange={e => setEditVehicleForm({...editVehicleForm, insurance_expiry: e.target.value})} /></div>
            <div><Label>Fitness Expiry</Label><Input type="date" value={editVehicleForm.fitness_expiry} onChange={e => setEditVehicleForm({...editVehicleForm, fitness_expiry: e.target.value})} /></div>
            <div><Label>Notes</Label><Textarea value={editVehicleForm.notes} onChange={e => setEditVehicleForm({...editVehicleForm, notes: e.target.value})} /></div>
            <Button className="w-full" onClick={handleEditVehicle}>Update Vehicle</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Tabs defaultValue="vehicles">
        <TabsList className="w-full"><TabsTrigger value="vehicles" className="flex-1">Vehicles</TabsTrigger><TabsTrigger value="history" className="flex-1">History</TabsTrigger><TabsTrigger value="fuel" className="flex-1">Fuel</TabsTrigger></TabsList>
        
        <TabsContent value="vehicles">
          <div className="space-y-2 mt-3">
            {vehicles.map(v => {
              const vDispatches = dispatches.filter(d => d.truck_number?.toUpperCase() === v.truck_number?.toUpperCase());
              const vFuel = fuelLogs.filter(f => f.truck_number?.toUpperCase() === v.truck_number?.toUpperCase());
              const totalFuel = vFuel.reduce((s: number, f: any) => s + Number(f.fuel_litres), 0);
              return (
                <Card key={v.id}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-primary" />
                        <h3 className="font-bold text-foreground">{v.truck_number}</h3>
                      </div>
                      <div className="flex gap-1">
                        {v.insurance_expiry && differenceInDays(new Date(v.insurance_expiry), new Date()) < 0 && <Badge variant="destructive" className="text-xs">Ins Expired</Badge>}
                        {v.fitness_expiry && differenceInDays(new Date(v.fitness_expiry), new Date()) < 0 && <Badge variant="destructive" className="text-xs">Fit Expired</Badge>}
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEditVehicle(v)}>
                          <Pencil className="h-3 w-3 text-muted-foreground" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteVehicle(v.id)}>
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {v.driver_name && <p className="text-xs text-muted-foreground mb-1">Driver: {v.driver_name}</p>}
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      <div><p className="font-bold text-foreground">{vDispatches.length}</p><p className="text-muted-foreground">Trips</p></div>
                      <div><p className="font-bold text-foreground">{totalFuel.toFixed(0)}L</p><p className="text-muted-foreground">Fuel</p></div>
                      <div><p className="font-bold text-foreground">₹{vDispatches.reduce((s: number, d: any) => s + Number(d.amount), 0).toLocaleString()}</p><p className="text-muted-foreground">Revenue</p></div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            {vehicles.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No vehicles added yet</p>}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-2 mt-3">
            {maintenance.slice(0, 20).map(m => {
              const v = vehicles.find(v => v.id === m.vehicle_id);
              return (
                <Card key={m.id}><CardContent className="p-3">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{v?.truck_number || 'Unknown'} - {m.maintenance_type}</p>
                      <p className="text-xs text-muted-foreground">{format(new Date(m.date), 'dd MMM yyyy')}</p>
                      {m.description && <p className="text-xs text-muted-foreground mt-1">{m.description}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">₹{Number(m.cost).toLocaleString()}</p>
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDeleteMaintenance(m.id)}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </CardContent></Card>
              );
            })}
            {maintenance.length === 0 && <p className="text-center text-sm text-muted-foreground py-4">No maintenance records</p>}
          </div>
        </TabsContent>

        <TabsContent value="fuel">
          <div className="space-y-2 mt-3">
            {fuelLogs.slice(0, 20).map(f => (
              <Card key={f.id}><CardContent className="p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-foreground">{f.truck_number}</p>
                  <p className="text-xs text-muted-foreground">{format(new Date(f.date), 'dd MMM yyyy')} {f.driver_name ? `• ${f.driver_name}` : ''}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{f.fuel_litres}L</p>
                  {f.amount && <p className="text-xs text-muted-foreground">₹{Number(f.amount).toLocaleString()}</p>}
                </div>
              </CardContent></Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default VehicleManagementSection;
