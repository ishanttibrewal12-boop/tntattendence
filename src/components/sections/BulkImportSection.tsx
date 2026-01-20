import { useState, useRef } from 'react';
import { ArrowLeft, Upload, FileSpreadsheet, Check, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

interface StaffImport {
  name: string;
  category: 'petroleum' | 'crusher';
  phone: string;
  base_salary: number;
  isValid: boolean;
  error?: string;
}

interface BulkImportSectionProps {
  onBack: () => void;
}

const BulkImportSection = ({ onBack }: BulkImportSectionProps) => {
  const [importData, setImportData] = useState<StaffImport[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [confirmImport, setConfirmImport] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          const category = categoryRaw === 'crusher' ? 'crusher' : 'petroleum';
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
    }

    setIsImporting(false);
  };

  const validCount = importData.filter(d => d.isValid).length;
  const invalidCount = importData.filter(d => !d.isValid).length;

  return (
    <div className="p-4 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-xl font-bold text-foreground">Bulk Import</h1>
      </div>

      {/* Instructions */}
      <Card className="mb-4">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium">CSV/Excel Format</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-2">
            Upload a CSV or Excel file with the following columns:
          </p>
          <ul className="text-xs text-muted-foreground space-y-1">
            <li>• <strong>name</strong> - Staff name (required)</li>
            <li>• <strong>category</strong> - petroleum or crusher</li>
            <li>• <strong>phone</strong> - Phone number</li>
            <li>• <strong>base_salary</strong> - Monthly salary</li>
          </ul>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card className="mb-4">
        <CardContent className="p-6">
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full h-24 border-dashed"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center gap-2">
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Click to upload CSV or Excel file
              </span>
            </div>
          </Button>
        </CardContent>
      </Card>

      {/* Preview */}
      {importData.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 gap-2 mb-4">
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{validCount}</p>
                <p className="text-xs text-muted-foreground">Valid Records</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-3 text-center">
                <p className="text-2xl font-bold text-destructive">{invalidCount}</p>
                <p className="text-xs text-muted-foreground">Invalid Records</p>
              </CardContent>
            </Card>
          </div>

          {/* Data Preview */}
          <Card className="mb-4">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto space-y-2">
                {importData.map((item, index) => (
                  <div
                    key={index}
                    className={`p-2 rounded border ${
                      item.isValid ? 'border-border' : 'border-destructive bg-destructive/10'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{item.name || 'No name'}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.category} • {item.phone || 'No phone'} • ₹{item.base_salary.toLocaleString()}
                        </p>
                      </div>
                      {item.isValid ? (
                        <Check className="h-4 w-4 text-green-600" />
                      ) : (
                        <div className="flex items-center gap-1 text-destructive">
                          <AlertTriangle className="h-4 w-4" />
                          <span className="text-xs">{item.error}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Import Button */}
          <Button
            className="w-full"
            onClick={() => setConfirmImport(true)}
            disabled={validCount === 0 || isImporting}
          >
            <Upload className="h-4 w-4 mr-2" />
            {isImporting ? 'Importing...' : `Import ${validCount} Staff Members`}
          </Button>
        </>
      )}

      {/* Confirmation Dialog */}
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
    </div>
  );
};

export default BulkImportSection;
