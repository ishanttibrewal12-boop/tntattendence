import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, FileSpreadsheet, Check, X, AlertTriangle, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import * as XLSX from 'xlsx';

interface StaffImport {
  name: string;
  category: 'petroleum' | 'crusher' | 'office';
  phone: string;
  base_salary: number;
  isValid: boolean;
  error?: string;
}

interface Staff {
  id: string;
  name: string;
  category: string;
  phone: string | null;
}

interface AttendanceRecord {
  staff_id: string;
  date: string;
  status: string;
  shift_count: number | null;
}

interface BulkImportSectionProps {
  onBack: () => void;
}

const BulkImportSection = ({ onBack }: BulkImportSectionProps) => {
  const [importData, setImportData] = useState<StaffImport[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [confirmImport, setConfirmImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Export state
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedStaff, setSelectedStaff] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [confirmExport, setConfirmExport] = useState(false);

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  useEffect(() => {
    fetchStaffList();
  }, []);

  useEffect(() => {
    if (staffList.length > 0) {
      fetchAttendanceData();
    }
  }, [selectedMonth, selectedYear, staffList]);

  const fetchStaffList = async () => {
    const { data } = await supabase
      .from('staff')
      .select('id, name, category, phone')
      .eq('is_active', true)
      .order('name');
    
    if (data) setStaffList(data as Staff[]);
  };

  const fetchAttendanceData = async () => {
    const startDate = format(startOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
    const endDate = format(endOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');

    const { data } = await supabase
      .from('attendance')
      .select('staff_id, date, status, shift_count')
      .gte('date', startDate)
      .lte('date', endDate);

    if (data) setAttendanceData(data as AttendanceRecord[]);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        const parsedData: StaffImport[] = jsonData.map((row: any) => {
          const name = row.name || row.Name || row.NAME || '';
          const categoryRaw = (row.category || row.Category || row.CATEGORY || 'petroleum').toString().toLowerCase();
          const category = categoryRaw === 'crusher' ? 'crusher' : categoryRaw === 'office' ? 'office' : 'petroleum';
          const phone = (row.phone || row.Phone || row.PHONE || '').toString();
          const salaryRaw = row.base_salary || row.salary || row.Salary || row.SALARY || 0;
          const base_salary = parseFloat(salaryRaw) || 0;

          let isValid = true;
          let error = '';

          if (!name.trim()) {
            isValid = false;
            error = 'Name is required';
          }

          return {
            name: name.trim(),
            category,
            phone: phone.trim(),
            base_salary,
            isValid,
            error,
          };
        });

        setImportData(parsedData);
        toast.success(`Found ${parsedData.length} records`);
      } catch (error) {
        toast.error('Failed to parse file');
        console.error(error);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    setIsImporting(true);
    setConfirmImport(false);

    const validRecords = importData.filter(d => d.isValid);
    
    if (validRecords.length === 0) {
      toast.error('No valid records to import');
      setIsImporting(false);
      return;
    }

    const insertData = validRecords.map(d => ({
      name: d.name,
      category: d.category,
      phone: d.phone || null,
      base_salary: d.base_salary,
    }));

    const { error } = await supabase.from('staff').insert(insertData);

    if (error) {
      toast.error('Failed to import staff');
      console.error(error);
    } else {
      toast.success(`Successfully imported ${validRecords.length} staff members`);
      setImportData([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      fetchStaffList();
    }

    setIsImporting(false);
  };

  const toggleStaffSelection = (staffId: string) => {
    const newSelection = new Set(selectedStaff);
    if (newSelection.has(staffId)) {
      newSelection.delete(staffId);
    } else {
      newSelection.add(staffId);
    }
    setSelectedStaff(newSelection);
  };

  const selectAll = () => {
    if (selectedStaff.size === filteredStaff.length) {
      setSelectedStaff(new Set());
    } else {
      setSelectedStaff(new Set(filteredStaff.map(s => s.id)));
    }
  };

  const exportToExcel = () => {
    if (selectedStaff.size === 0) {
      toast.error('Please select at least one staff member');
      return;
    }

    const selectedStaffList = staffList.filter(s => selectedStaff.has(s.id));
    
    const excelData = selectedStaffList.map((staff, index) => {
      const staffAttendance = attendanceData.filter(a => a.staff_id === staff.id);
      const totalShifts = staffAttendance.reduce((sum, a) => {
        if (a.status === 'present') {
          return sum + (a.shift_count || 1);
        }
        return sum;
      }, 0);

      return {
        'S.No.': index + 1,
        'Name': staff.name,
        'Category': staff.category.charAt(0).toUpperCase() + staff.category.slice(1),
        'Working Shifts': totalShifts,
        'Contact': '9386469006',
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Staff Report');

    // Auto-width columns
    const colWidths = [
      { wch: 6 },  // S.No.
      { wch: 25 }, // Name
      { wch: 12 }, // Category
      { wch: 15 }, // Working Shifts
      { wch: 15 }, // Contact
    ];
    worksheet['!cols'] = colWidths;

    XLSX.writeFile(workbook, `staff-report-${months[selectedMonth - 1]}-${selectedYear}.xlsx`);
    toast.success('Excel file downloaded');
    setConfirmExport(false);
  };

  const filteredStaff = staffList.filter(staff =>
    staff.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const validCount = importData.filter(d => d.isValid).length;
  const invalidCount = importData.filter(d => !d.isValid).length;

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Import & Export</h1>
      </div>

      {/* Import Section */}
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Bulk Import Staff
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-muted-foreground mb-3">
            Upload CSV/Excel with columns: name, category (petroleum/crusher/office), phone, base_salary
          </p>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full h-16 border-dashed"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-1">
              <FileSpreadsheet className="h-6 w-6 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Click to upload file
              </span>
            </div>
          </Button>

          {importData.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-green-500/10 rounded text-center">
                  <p className="text-lg font-bold text-green-600">{validCount}</p>
                  <p className="text-xs text-muted-foreground">Valid</p>
                </div>
                <div className="p-2 bg-destructive/10 rounded text-center">
                  <p className="text-lg font-bold text-destructive">{invalidCount}</p>
                  <p className="text-xs text-muted-foreground">Invalid</p>
                </div>
              </div>

              <div className="max-h-40 overflow-y-auto space-y-1">
                {importData.slice(0, 5).map((item, index) => (
                  <div key={index} className={`p-2 rounded text-xs flex items-center justify-between ${item.isValid ? 'bg-muted/30' : 'bg-destructive/10'}`}>
                    <span>{item.name || 'No name'} - {item.category}</span>
                    {item.isValid ? <Check className="h-3 w-3 text-green-600" /> : <X className="h-3 w-3 text-destructive" />}
                  </div>
                ))}
                {importData.length > 5 && (
                  <p className="text-xs text-muted-foreground text-center">+{importData.length - 5} more</p>
                )}
              </div>

              <Button
                className="w-full"
                onClick={() => setConfirmImport(true)}
                disabled={validCount === 0 || isImporting}
              >
                {isImporting ? 'Importing...' : `Import ${validCount} Staff`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Section */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export Monthly Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Month/Year Selection */}
          <div className="grid grid-cols-2 gap-2">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {months.map((month, i) => (
                  <SelectItem key={i} value={(i + 1).toString()}>{month}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027].map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-10"
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Select All */}
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={selectAll}>
              {selectedStaff.size === filteredStaff.length ? 'Deselect All' : 'Select All'}
            </Button>
            <span className="text-xs text-muted-foreground">{selectedStaff.size} selected</span>
          </div>

          {/* Staff List */}
          <div className="max-h-48 overflow-y-auto space-y-1">
            {filteredStaff.map((staff) => (
              <div
                key={staff.id}
                className={`p-2 rounded flex items-center gap-2 cursor-pointer transition-colors ${selectedStaff.has(staff.id) ? 'bg-primary/10' : 'bg-muted/30 hover:bg-muted/50'}`}
                onClick={() => toggleStaffSelection(staff.id)}
              >
                <Checkbox checked={selectedStaff.has(staff.id)} />
                <div className="flex-1">
                  <p className="text-sm font-medium">{staff.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{staff.category}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Export Button */}
          <Button
            className="w-full"
            onClick={() => setConfirmExport(true)}
            disabled={selectedStaff.size === 0 || isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Selected ({selectedStaff.size})
          </Button>
        </CardContent>
      </Card>

      {/* Import Confirmation Dialog */}
      <AlertDialog open={confirmImport} onOpenChange={setConfirmImport}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Import</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to import {validCount} staff members? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleImport}>Import</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Export Confirmation Dialog */}
      <AlertDialog open={confirmExport} onOpenChange={setConfirmExport}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Export Report</AlertDialogTitle>
            <AlertDialogDescription>
              Export {selectedStaff.size} staff member(s) report for {months[selectedMonth - 1]} {selectedYear}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={exportToExcel}>Export</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default BulkImportSection;
