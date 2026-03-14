import { useState, useEffect } from 'react';
import { ArrowLeft, Plus, Trash2, Filter, Fuel, X, Download, Share2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { toast } from 'sonner';
import { exportToExcel } from '@/lib/exportUtils';

interface Props {
  onBack: () => void;
}

interface FuelEntry {
  id: string;
  date: string;
  section: string;
  litres: number;
  running_hours: number;
  rate_per_litre: number;
  total_cost: number;
  notes: string | null;
}

interface FuelSection {
  id: string;
  name: string;
  is_preset: boolean;
}

const COLORS = ['#3b82f6', '#ef4444', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const CrusherFuelAnalysisSection = ({ onBack }: Props) => {
  const [entries, setEntries] = useState<FuelEntry[]>([]);
  const [sections, setSections] = useState<FuelSection[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [filterSection, setFilterSection] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<FuelEntry | null>(null);

  // Form state
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formSection, setFormSection] = useState('');
  const [formLitres, setFormLitres] = useState('');
  const [formHours, setFormHours] = useState('');
  const [formRate, setFormRate] = useState('');
  const [formNotes, setFormNotes] = useState('');

  // Edit form state
  const [editDate, setEditDate] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editLitres, setEditLitres] = useState('');
  const [editHours, setEditHours] = useState('');
  const [editRate, setEditRate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  useEffect(() => { fetchSections(); }, []);
  useEffect(() => { fetchEntries(); }, [selectedMonth, selectedYear]);

  const fetchSections = async () => {
    const { data } = await supabase.from('crusher_fuel_sections').select('*').order('is_preset', { ascending: false }).order('name');
    setSections((data as FuelSection[]) || []);
  };

  const fetchEntries = async () => {
    setIsLoading(true);
    const start = format(startOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
    const end = format(endOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
    const { data } = await supabase.from('crusher_fuel_entries').select('*').gte('date', start).lte('date', end).order('date', { ascending: false });
    setEntries((data as FuelEntry[]) || []);
    setIsLoading(false);
  };

  const handleAddEntry = async () => {
    if (!formSection || !formLitres) {
      toast.error('Section and Litres are required');
      return;
    }
    const { error } = await supabase.from('crusher_fuel_entries').insert({
      date: formDate,
      section: formSection,
      litres: parseFloat(formLitres),
      running_hours: parseFloat(formHours) || 0,
      rate_per_litre: parseFloat(formRate) || 0,
      notes: formNotes || null,
    });
    if (error) { toast.error('Failed to add entry'); return; }
    toast.success('Fuel entry added');
    setShowAddDialog(false);
    resetForm();
    fetchEntries();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return;
    await supabase.from('crusher_fuel_entries').delete().eq('id', id);
    toast.success('Deleted');
    fetchEntries();
  };

  const openEdit = (entry: FuelEntry) => {
    setEditingEntry(entry);
    setEditDate(entry.date);
    setEditSection(entry.section);
    setEditLitres(String(entry.litres));
    setEditHours(String(entry.running_hours));
    setEditRate(String(entry.rate_per_litre));
    setEditNotes(entry.notes || '');
    setIsEditOpen(true);
  };

  const handleEditEntry = async () => {
    if (!editingEntry || !editSection || !editLitres) {
      toast.error('Section and Litres are required');
      return;
    }
    const { error } = await supabase.from('crusher_fuel_entries').update({
      date: editDate, section: editSection,
      litres: parseFloat(editLitres), running_hours: parseFloat(editHours) || 0,
      rate_per_litre: parseFloat(editRate) || 0, notes: editNotes || null,
    }).eq('id', editingEntry.id);
    if (error) { toast.error('Failed to update'); return; }
    toast.success('Entry updated');
    setIsEditOpen(false);
    setEditingEntry(null);
    fetchEntries();
  };

  const handleAddSection = async () => {
    if (!newSectionName.trim()) return;
    const { error } = await supabase.from('crusher_fuel_sections').insert({ name: newSectionName.trim(), is_preset: false });
    if (error) { toast.error('Failed to add section'); return; }
    toast.success('Section added');
    setNewSectionName('');
    setShowAddSection(false);
    fetchSections();
  };

  const resetForm = () => {
    setFormDate(format(new Date(), 'yyyy-MM-dd'));
    setFormSection('');
    setFormLitres('');
    setFormHours('');
    setFormRate('');
    setFormNotes('');
  };

  const filtered = filterSection === 'all' ? entries : entries.filter(e => e.section === filterSection);

  // Analytics
  const totalLitres = filtered.reduce((s, e) => s + Number(e.litres), 0);
  const totalCost = filtered.reduce((s, e) => s + Number(e.total_cost), 0);
  const totalHours = filtered.reduce((s, e) => s + Number(e.running_hours), 0);
  const avgConsumption = totalHours > 0 ? (totalLitres / totalHours).toFixed(1) : '—';

  // Section-wise pie data
  const sectionMap: Record<string, number> = {};
  entries.forEach(e => { sectionMap[e.section] = (sectionMap[e.section] || 0) + Number(e.litres); });
  const sectionPieData = Object.entries(sectionMap).map(([name, value]) => ({ name, value }));

  // Daily line chart
  const mStart = startOfMonth(new Date(selectedYear, selectedMonth - 1));
  const mEnd = endOfMonth(new Date(selectedYear, selectedMonth - 1));
  const dailyData = eachDayOfInterval({ start: mStart, end: mEnd }).map(day => {
    const dayStr = format(day, 'yyyy-MM-dd');
    const dayEntries = filtered.filter(e => e.date === dayStr);
    return {
      name: format(day, 'dd'),
      litres: dayEntries.reduce((s, e) => s + Number(e.litres), 0),
      cost: dayEntries.reduce((s, e) => s + Number(e.total_cost), 0),
    };
  }).filter(d => d.litres > 0);

  const monthLabel = `${months[selectedMonth - 1]} ${selectedYear}`;

  const handleExcelExport = () => {
    if (filtered.length === 0) { toast.error('No data to export'); return; }
    const headers = ['Date', 'Section', 'Litres', 'Running Hours', 'Rate (Rs/L)', 'Total Cost (Rs)', 'Notes'];
    const data = filtered.map(e => [
      format(new Date(e.date), 'dd MMM yyyy'),
      e.section,
      Number(e.litres),
      Number(e.running_hours),
      Number(e.rate_per_litre),
      Number(e.total_cost),
      e.notes || '',
    ]);
    // Add summary row
    data.push([]);
    data.push(['SUMMARY', '', totalLitres, totalHours, '', totalCost, `Avg: ${avgConsumption} L/hr`]);
    exportToExcel(data, headers, `Fuel_Analysis_${months[selectedMonth - 1]}_${selectedYear}`, 'Fuel Report', `Crusher Fuel Report - ${monthLabel}`);
    toast.success('Excel exported');
  };

  const handleWhatsAppShare = () => {
    if (filtered.length === 0) { toast.error('No data to share'); return; }
    // Section-wise breakdown
    const sectionBreakdown = Object.entries(sectionMap)
      .map(([name, litres]) => {
        const sectionEntries = entries.filter(e => e.section === name);
        const cost = sectionEntries.reduce((s, e) => s + Number(e.total_cost), 0);
        const hours = sectionEntries.reduce((s, e) => s + Number(e.running_hours), 0);
        return `  • ${name}: ${litres}L | ${hours}hrs | Rs.${cost.toLocaleString()}`;
      })
      .join('\n');

    const message = `⛽ *Crusher Fuel Report - ${monthLabel}*\n\n` +
      `📊 *Summary*\n` +
      `Total Fuel: ${totalLitres.toLocaleString()} L\n` +
      `Total Cost: Rs.${totalCost.toLocaleString()}\n` +
      `Running Hours: ${totalHours.toLocaleString()} hrs\n` +
      `Avg Consumption: ${avgConsumption} L/hr\n\n` +
      `📋 *Section-wise Breakdown*\n${sectionBreakdown}\n\n` +
      `_Tibrewal Staff Manager_`;

    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <h1 className="text-xl font-bold text-foreground flex-1">⛽ Fuel Analysis</h1>
        <Button variant="outline" size="icon" onClick={handleExcelExport} title="Export Excel"><Download className="h-4 w-4" /></Button>
        <Button variant="outline" size="icon" onClick={handleWhatsAppShare} title="Share on WhatsApp"><Share2 className="h-4 w-4" /></Button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-2 mb-3">
        <Select value={selectedMonth.toString()} onValueChange={v => setSelectedMonth(parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{months.map((m, i) => <SelectItem key={i} value={(i + 1).toString()}>{m}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={selectedYear.toString()} onValueChange={v => setSelectedYear(parseInt(v))}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>{[2024, 2025, 2026, 2027].map(y => <SelectItem key={y} value={y.toString()}>{y}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      <div className="flex gap-2 mb-4">
        <Select value={filterSection} onValueChange={setFilterSection}>
          <SelectTrigger className="flex-1">
            <Filter className="h-4 w-4 mr-1" />
            <SelectValue placeholder="Filter by section" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sections</SelectItem>
            {sections.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
          </SelectContent>
        </Select>

        <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
          <DialogTrigger asChild>
            <Button size="icon"><Plus className="h-4 w-4" /></Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Add Fuel Entry</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <Input type="date" value={formDate} onChange={e => setFormDate(e.target.value)} />
              <Select value={formSection} onValueChange={setFormSection}>
                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>
                  {sections.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="grid grid-cols-2 gap-2">
                <Input type="number" placeholder="Litres" value={formLitres} onChange={e => setFormLitres(e.target.value)} />
                <Input type="number" placeholder="Hours" value={formHours} onChange={e => setFormHours(e.target.value)} />
              </div>
              <Input type="number" placeholder="Rate ₹/litre (optional)" value={formRate} onChange={e => setFormRate(e.target.value)} />
              {formLitres && formRate && (
                <p className="text-sm text-muted-foreground">Total: ₹{(parseFloat(formLitres) * parseFloat(formRate)).toLocaleString()}</p>
              )}
              <Input placeholder="Notes (optional)" value={formNotes} onChange={e => setFormNotes(e.target.value)} />
              <Button className="w-full" onClick={handleAddEntry}>Add Entry</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="table">
        <TabsList className="w-full mb-3">
          <TabsTrigger value="table" className="flex-1">Table</TabsTrigger>
          <TabsTrigger value="charts" className="flex-1">Charts</TabsTrigger>
          <TabsTrigger value="sections" className="flex-1">Sections</TabsTrigger>
        </TabsList>

        {/* TABLE TAB */}
        <TabsContent value="table">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            <Card><CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">{totalLitres.toLocaleString()} L</p>
              <p className="text-xs text-muted-foreground">Total Fuel</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">₹{totalCost.toLocaleString()}</p>
              <p className="text-xs text-muted-foreground">Total Cost</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">{totalHours.toLocaleString()} hrs</p>
              <p className="text-xs text-muted-foreground">Running Hours</p>
            </CardContent></Card>
            <Card><CardContent className="p-3 text-center">
              <p className="text-lg font-bold text-foreground">{avgConsumption} L/hr</p>
              <p className="text-xs text-muted-foreground">Avg Consumption</p>
            </CardContent></Card>
          </div>

          {isLoading ? (
            <p className="text-center text-muted-foreground py-6">Loading...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-6">No fuel entries for this month</p>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Date</TableHead>
                    <TableHead className="text-xs">Section</TableHead>
                    <TableHead className="text-xs text-right">Litres</TableHead>
                    <TableHead className="text-xs text-right">Hrs</TableHead>
                    <TableHead className="text-xs text-right">Cost</TableHead>
                    <TableHead className="text-xs w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(entry => (
                    <TableRow key={entry.id}>
                      <TableCell className="text-xs py-2">{format(new Date(entry.date), 'dd MMM')}</TableCell>
                      <TableCell className="text-xs py-2 max-w-[80px] truncate">{entry.section}</TableCell>
                      <TableCell className="text-xs py-2 text-right font-medium">{Number(entry.litres)}</TableCell>
                      <TableCell className="text-xs py-2 text-right">{Number(entry.running_hours)}</TableCell>
                      <TableCell className="text-xs py-2 text-right font-medium">₹{Number(entry.total_cost).toLocaleString()}</TableCell>
                      <TableCell className="py-2">
                        <div className="flex gap-0.5">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(entry)}>
                            <Pencil className="h-3 w-3 text-muted-foreground" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDelete(entry.id)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Edit Entry Dialog */}
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogContent className="max-w-sm">
              <DialogHeader><DialogTitle>Edit Fuel Entry</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <Input type="date" value={editDate} onChange={e => setEditDate(e.target.value)} />
                <Select value={editSection} onValueChange={setEditSection}>
                  <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                  <SelectContent>
                    {sections.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                  </SelectContent>
                </Select>
                <div className="grid grid-cols-2 gap-2">
                  <Input type="number" placeholder="Litres" value={editLitres} onChange={e => setEditLitres(e.target.value)} />
                  <Input type="number" placeholder="Hours" value={editHours} onChange={e => setEditHours(e.target.value)} />
                </div>
                <Input type="number" placeholder="Rate ₹/litre (optional)" value={editRate} onChange={e => setEditRate(e.target.value)} />
                {editLitres && editRate && (
                  <p className="text-sm text-muted-foreground">Total: ₹{(parseFloat(editLitres) * parseFloat(editRate)).toLocaleString()}</p>
                )}
                <Input placeholder="Notes (optional)" value={editNotes} onChange={e => setEditNotes(e.target.value)} />
                <Button className="w-full" onClick={handleEditEntry}>Update Entry</Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* CHARTS TAB */}
        <TabsContent value="charts">
          {/* Section-wise Pie */}
          {sectionPieData.length > 0 && (
            <Card className="mb-4">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Section-wise Fuel Usage</CardTitle></CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={sectionPieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}L`}>
                        {sectionPieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => `${v} L`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily consumption line */}
          {dailyData.length > 0 && (
            <Card className="mb-4">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Daily Fuel Consumption</CardTitle></CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip formatter={(v: number, name: string) => [name === 'litres' ? `${v} L` : `₹${v}`, name === 'litres' ? 'Fuel' : 'Cost']} />
                      <Bar dataKey="litres" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Daily cost line */}
          {dailyData.length > 0 && (
            <Card className="mb-4">
              <CardHeader className="pb-2"><CardTitle className="text-sm">Daily Fuel Cost</CardTitle></CardHeader>
              <CardContent>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" fontSize={10} />
                      <YAxis fontSize={10} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
                      <Tooltip formatter={(v: number) => [`₹${v.toLocaleString()}`, 'Cost']} />
                      <Line type="monotone" dataKey="cost" stroke="#ef4444" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Section-wise consumption per hour */}
          {(() => {
            const sectionHourData = Object.entries(sectionMap).map(([name]) => {
              const sectionEntries = entries.filter(e => e.section === name);
              const litres = sectionEntries.reduce((s, e) => s + Number(e.litres), 0);
              const hours = sectionEntries.reduce((s, e) => s + Number(e.running_hours), 0);
              return { name: name.length > 10 ? name.substring(0, 10) + '...' : name, lph: hours > 0 ? parseFloat((litres / hours).toFixed(1)) : 0 };
            }).filter(d => d.lph > 0);

            return sectionHourData.length > 0 ? (
              <Card className="mb-4">
                <CardHeader className="pb-2"><CardTitle className="text-sm">Litres/Hour by Section</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-40">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={sectionHourData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" fontSize={10} />
                        <YAxis dataKey="name" type="category" fontSize={10} width={80} />
                        <Tooltip formatter={(v: number) => `${v} L/hr`} />
                        <Bar dataKey="lph" fill="#22c55e" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            ) : null;
          })()}
        </TabsContent>

        {/* SECTIONS TAB */}
        <TabsContent value="sections">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Fuel Sections</CardTitle>
                <Button size="sm" variant="outline" onClick={() => setShowAddSection(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Add
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {showAddSection && (
                <div className="flex gap-2 mb-3">
                  <Input placeholder="New section name" value={newSectionName} onChange={e => setNewSectionName(e.target.value)} className="flex-1" />
                  <Button size="sm" onClick={handleAddSection}>Save</Button>
                  <Button size="sm" variant="ghost" onClick={() => { setShowAddSection(false); setNewSectionName(''); }}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <div className="space-y-2">
                {sections.map(s => (
                  <div key={s.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                    <div className="flex items-center gap-2">
                      <Fuel className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">{s.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {s.is_preset && <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Preset</span>}
                      <Button variant="ghost" size="icon" className="h-6 w-6" onClick={async () => {
                        if (!confirm(`Delete section "${s.name}"? This won't delete existing fuel entries.`)) return;
                        await supabase.from('crusher_fuel_sections').delete().eq('id', s.id);
                        toast.success('Section removed');
                        fetchSections();
                      }}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CrusherFuelAnalysisSection;
