import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ArrowLeft, FileText, Download, Eye, Search, Printer } from 'lucide-react';
import { formatCurrencyForPDF } from '@/lib/formatUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import companyLogo from '@/assets/company-logo.png';

interface InvoiceGeneratorSectionProps {
  onBack: () => void;
}

interface DispatchEntry {
  id: string;
  party_name: string;
  date: string;
  truck_number: string;
  amount: number;
  quantity: number;
  product_name: string;
  challan_number: string;
  rst_number: string;
  notes: string | null;
}

// Company details for the invoice
const COMPANY = {
  name: 'Tibrewal & Tibrewal Pvt. Ltd.',
  address: 'Village - Hesalong, P.O. - Barkagaon, Dist - Hazaribag, Jharkhand - 825311',
  gstin: '20AALCT4953Q1Z7',
  pan: 'AALCT4953Q',
  phone: '6203229118',
  email: 'tibrewalgroup@gmail.com',
  state: 'Jharkhand (20)',
  bankName: 'State Bank of India',
  accountNo: '40365aborte6174',
  ifsc: 'SBIN0003456',
};

const InvoiceGeneratorSection = ({ onBack }: InvoiceGeneratorSectionProps) => {
  const { toast } = useToast();
  const [dispatches, setDispatches] = useState<DispatchEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth() + 1);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [searchParty, setSearchParty] = useState('');
  const [selectedDispatches, setSelectedDispatches] = useState<string[]>([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [buyerName, setBuyerName] = useState('');
  const [buyerAddress, setBuyerAddress] = useState('');
  const [buyerGstin, setBuyerGstin] = useState('');
  const [buyerState, setBuyerState] = useState('Jharkhand (20)');
  const [gstRate, setGstRate] = useState('5');
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');

  // Pre-load logo as data URL for PDF embedding
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        setLogoDataUrl(canvas.toDataURL('image/png'));
      }
    };
    img.src = companyLogo;
  }, []);

  useEffect(() => {
    fetchDispatches();
  }, [filterMonth, filterYear]);

  useEffect(() => {
    // Auto-generate invoice number
    const num = `TT/${filterYear}/${String(filterMonth).padStart(2, '0')}/${String(Math.floor(Math.random() * 9000) + 1000)}`;
    setInvoiceNumber(num);
  }, [filterMonth, filterYear]);

  const fetchDispatches = async () => {
    setLoading(true);
    const start = format(startOfMonth(new Date(filterYear, filterMonth - 1)), 'yyyy-MM-dd');
    const end = format(endOfMonth(new Date(filterYear, filterMonth - 1)), 'yyyy-MM-dd');

    const { data, error } = await supabase
      .from('dispatch_reports')
      .select('*')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false });

    if (!error && data) setDispatches(data as DispatchEntry[]);
    setLoading(false);
  };

  const filteredDispatches = dispatches.filter(d =>
    d.party_name.toLowerCase().includes(searchParty.toLowerCase())
  );

  const uniqueParties = [...new Set(dispatches.map(d => d.party_name))];

  const toggleSelect = (id: string) => {
    setSelectedDispatches(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const selectAllForParty = (party: string) => {
    const partyIds = dispatches.filter(d => d.party_name === party).map(d => d.id);
    const allSelected = partyIds.every(id => selectedDispatches.includes(id));
    if (allSelected) {
      setSelectedDispatches(prev => prev.filter(x => !partyIds.includes(x)));
    } else {
      setSelectedDispatches(prev => [...new Set([...prev, ...partyIds])]);
    }
  };

  const selectedItems = dispatches.filter(d => selectedDispatches.includes(d.id));
  const subtotal = selectedItems.reduce((s, d) => s + d.amount, 0);
  const gstAmount = subtotal * (parseFloat(gstRate) / 100);
  const totalWithGst = subtotal + gstAmount;
  const totalQty = selectedItems.reduce((s, d) => s + d.quantity, 0);

  const handleAutoFillParty = (party: string) => {
    setBuyerName(party);
    selectAllForParty(party);
  };

  const generatePDF = () => {
    if (selectedItems.length === 0) {
      toast({ title: 'Select dispatch entries', description: 'Please select at least one dispatch entry to generate invoice.', variant: 'destructive' });
      return;
    }

    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.width;

    // --- HEADER with Logo ---
    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', 14, 10, 18, 18);
    }
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(COMPANY.name, pageWidth / 2, 16, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(COMPANY.address, pageWidth / 2, 22, { align: 'center' });
    doc.text(`Phone: ${COMPANY.phone} | Email: ${COMPANY.email}`, pageWidth / 2, 27, { align: 'center' });

    // Tax Invoice title
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setDrawColor(0);
    doc.line(14, 32, pageWidth - 14, 32);
    doc.text('TAX INVOICE', pageWidth / 2, 39, { align: 'center' });
    doc.line(14, 42, pageWidth - 14, 42);

    // Invoice details
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const detailY = 48;
    doc.text(`Invoice No: ${invoiceNumber}`, 14, detailY);
    doc.text(`Date: ${format(new Date(), 'dd/MM/yyyy')}`, pageWidth - 14, detailY, { align: 'right' });

    doc.text(`GSTIN: ${COMPANY.gstin}`, 14, detailY + 5);
    doc.text(`PAN: ${COMPANY.pan}`, pageWidth - 14, detailY + 5, { align: 'right' });
    doc.text(`State: ${COMPANY.state}`, 14, detailY + 10);

    // Buyer details box
    const buyerY = detailY + 18;
    doc.setDrawColor(150);
    doc.rect(14, buyerY, pageWidth - 28, 22);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 17, buyerY + 5);
    doc.setFont('helvetica', 'normal');
    doc.text(buyerName || 'N/A', 17, buyerY + 10);
    doc.text(buyerAddress || '', 17, buyerY + 15);
    doc.text(`GSTIN: ${buyerGstin || 'N/A'}`, 17, buyerY + 20);
    doc.text(`State: ${buyerState}`, pageWidth / 2, buyerY + 20);

    // Items table
    const tableStartY = buyerY + 28;
    const tableData = selectedItems.map((item, i) => [
      i + 1,
      item.product_name,
      `${item.quantity} MT`,
      formatCurrencyForPDF(Math.round(item.amount / (item.quantity || 1))),
      formatCurrencyForPDF(item.amount),
      item.challan_number || '-',
      item.truck_number,
      format(new Date(item.date), 'dd/MM/yy'),
    ]);

    autoTable(doc, {
      startY: tableStartY,
      head: [['#', 'Product', 'Qty', 'Rate/MT', 'Amount', 'Challan', 'Truck', 'Date']],
      body: tableData,
      styles: { fontSize: 7.5, cellPadding: 2 },
      headStyles: { fillColor: [15, 23, 42], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [245, 247, 250] },
      columnStyles: {
        0: { cellWidth: 8 },
        1: { cellWidth: 28 },
        2: { cellWidth: 18 },
        3: { cellWidth: 24 },
        4: { cellWidth: 26 },
        5: { cellWidth: 22 },
        6: { cellWidth: 28 },
        7: { cellWidth: 20 },
      },
    });

    const afterTableY = (doc as any).lastAutoTable.finalY + 5;

    // Summary box
    const summaryX = pageWidth - 80;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('Total Quantity:', summaryX, afterTableY);
    doc.text(`${totalQty} MT`, pageWidth - 14, afterTableY, { align: 'right' });

    doc.text('Subtotal:', summaryX, afterTableY + 6);
    doc.text(formatCurrencyForPDF(subtotal), pageWidth - 14, afterTableY + 6, { align: 'right' });

    const isIntraState = buyerState.includes('Jharkhand');
    if (isIntraState) {
      const cgst = gstAmount / 2;
      const sgst = gstAmount / 2;
      doc.text(`CGST @ ${parseFloat(gstRate) / 2}%:`, summaryX, afterTableY + 12);
      doc.text(formatCurrencyForPDF(Math.round(cgst)), pageWidth - 14, afterTableY + 12, { align: 'right' });
      doc.text(`SGST @ ${parseFloat(gstRate) / 2}%:`, summaryX, afterTableY + 18);
      doc.text(formatCurrencyForPDF(Math.round(sgst)), pageWidth - 14, afterTableY + 18, { align: 'right' });
    } else {
      doc.text(`IGST @ ${gstRate}%:`, summaryX, afterTableY + 12);
      doc.text(formatCurrencyForPDF(Math.round(gstAmount)), pageWidth - 14, afterTableY + 12, { align: 'right' });
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    const totalY = isIntraState ? afterTableY + 26 : afterTableY + 20;
    doc.line(summaryX, totalY - 2, pageWidth - 14, totalY - 2);
    doc.text('Grand Total:', summaryX, totalY + 3);
    doc.text(formatCurrencyForPDF(Math.round(totalWithGst)), pageWidth - 14, totalY + 3, { align: 'right' });

    // Amount in words
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Amount in Words: ${numberToWords(Math.round(totalWithGst))} Rupees Only`, 14, totalY + 12);

    // Bank details
    const bankY = totalY + 20;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Bank Details:', 14, bankY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(`Bank: ${COMPANY.bankName}`, 14, bankY + 5);
    doc.text(`A/c No: ${COMPANY.accountNo}`, 14, bankY + 10);
    doc.text(`IFSC: ${COMPANY.ifsc}`, 14, bankY + 15);

    // Signature area
    const sigY = bankY + 5;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('For Tibrewal & Tibrewal Pvt. Ltd.', pageWidth - 14, sigY, { align: 'right' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text('________________________', pageWidth - 14, sigY + 18, { align: 'right' });
    doc.text('Authorised Signatory', pageWidth - 14, sigY + 23, { align: 'right' });

    // Footer
    const footerY = doc.internal.pageSize.height - 15;
    doc.setFontSize(7);
    doc.setTextColor(120);
    doc.text('This is a computer generated invoice.', pageWidth / 2, footerY, { align: 'center' });
    doc.text(`Contact: ${COMPANY.phone} | ${COMPANY.email}`, pageWidth / 2, footerY + 4, { align: 'center' });

    return doc;
  };

  const handlePreview = () => {
    if (selectedItems.length === 0) {
      toast({ title: 'Select entries', variant: 'destructive' });
      return;
    }
    setPreviewOpen(true);
  };

  const handleDownload = () => {
    const doc = generatePDF();
    if (doc) {
      const safeName = buyerName.replace(/[^a-zA-Z0-9]/g, '_') || 'Invoice';
      doc.save(`Invoice_${safeName}_${invoiceNumber.replace(/\//g, '-')}.pdf`);
      toast({ title: '✅ Invoice downloaded!' });
    }
  };

  const handleShare = () => {
    const doc = generatePDF();
    if (doc) {
      const blob = doc.output('blob');
      const url = URL.createObjectURL(blob);
      const safeName = buyerName.replace(/[^a-zA-Z0-9]/g, '_') || 'Invoice';
      const fileName = `Invoice_${safeName}.pdf`;

      if (navigator.share && navigator.canShare) {
        const file = new File([blob], fileName, { type: 'application/pdf' });
        navigator.share({ files: [file], title: 'GST Invoice' }).catch(() => {
          window.open(url, '_blank');
        });
      } else {
        window.open(url, '_blank');
      }
    }
  };

  return (
    <div className="min-h-screen" style={{ background: '#F4F6F8' }}>
      <div className="p-4 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-4">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">🧾 GST Invoice Generator</h1>
            <p className="text-xs text-muted-foreground">Generate professional tax invoices from dispatch entries</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-0 mb-4">
          <CardContent className="p-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Month</Label>
                <Select value={String(filterMonth)} onValueChange={v => setFilterMonth(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => (
                      <SelectItem key={i + 1} value={String(i + 1)}>
                        {format(new Date(2024, i), 'MMMM')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Year</Label>
                <Select value={String(filterYear)} onValueChange={v => setFilterYear(Number(v))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[2024, 2025, 2026, 2027].map(y => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Quick party select */}
            {uniqueParties.length > 0 && (
              <div>
                <Label className="text-xs">Quick Select Party</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {uniqueParties.map(p => (
                    <Button
                      key={p}
                      variant={buyerName === p ? 'default' : 'outline'}
                      size="sm"
                      className="text-xs"
                      onClick={() => handleAutoFillParty(p)}
                    >
                      {p}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search party..."
                value={searchParty}
                onChange={e => setSearchParty(e.target.value)}
                className="pl-9"
              />
            </div>
          </CardContent>
        </Card>

        {/* Dispatch entries list */}
        <Card className="border-0 mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Dispatch Entries ({filteredDispatches.length}) • Selected: {selectedItems.length}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Loading...</div>
            ) : filteredDispatches.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-sm">No dispatches found</div>
            ) : (
              <div className="max-h-60 overflow-y-auto">
                {filteredDispatches.map(d => (
                  <div
                    key={d.id}
                    className={`flex items-center gap-3 p-3 border-b cursor-pointer transition-colors ${selectedDispatches.includes(d.id) ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                    onClick={() => toggleSelect(d.id)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDispatches.includes(d.id)}
                      onChange={() => {}}
                      className="rounded"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{d.party_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {d.product_name} • {d.quantity} MT • {d.truck_number} • {format(new Date(d.date), 'dd MMM')}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-foreground">₹{d.amount.toLocaleString('en-IN')}</p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Buyer Details */}
        <Card className="border-0 mb-4">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Buyer Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-xs">Invoice Number</Label>
              <Input value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Party / Buyer Name</Label>
              <Input value={buyerName} onChange={e => setBuyerName(e.target.value)} placeholder="Buyer company name" />
            </div>
            <div>
              <Label className="text-xs">Buyer Address</Label>
              <Textarea value={buyerAddress} onChange={e => setBuyerAddress(e.target.value)} placeholder="Full address" rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Buyer GSTIN</Label>
                <Input value={buyerGstin} onChange={e => setBuyerGstin(e.target.value)} placeholder="22AAAAA0000A1Z5" />
              </div>
              <div>
                <Label className="text-xs">Buyer State</Label>
                <Input value={buyerState} onChange={e => setBuyerState(e.target.value)} />
              </div>
            </div>
            <div>
              <Label className="text-xs">GST Rate (%)</Label>
              <Select value={gstRate} onValueChange={setGstRate}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['0', '5', '12', '18', '28'].map(r => (
                    <SelectItem key={r} value={r}>{r}%</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary & Actions */}
        {selectedItems.length > 0 && (
          <Card className="border-0 mb-4" style={{ background: '#0f172a' }}>
            <CardContent className="p-4 space-y-2">
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>Subtotal</span>
                <span className="text-sm font-medium" style={{ color: 'white' }}>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>GST ({gstRate}%)</span>
                <span className="text-sm font-medium" style={{ color: 'white' }}>₹{Math.round(gstAmount).toLocaleString('en-IN')}</span>
              </div>
              <div className="border-t border-white/20 pt-2 flex justify-between">
                <span className="text-sm font-bold" style={{ color: 'white' }}>Grand Total</span>
                <span className="text-lg font-bold" style={{ color: '#22c55e' }}>₹{Math.round(totalWithGst).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex gap-2 pt-2">
                <Button
                  className="flex-1"
                  style={{ background: '#22c55e', color: 'white' }}
                  onClick={handleDownload}
                >
                  <Download className="h-4 w-4 mr-1" /> Download PDF
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-white/20 hover:bg-white/10"
                  style={{ color: 'white' }}
                  onClick={handleShare}
                >
                  <Printer className="h-4 w-4 mr-1" /> Share
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Number to words converter for Indian numbering
function numberToWords(num: number): string {
  if (num === 0) return 'Zero';
  const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const convertBelowThousand = (n: number): string => {
    if (n === 0) return '';
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '');
    return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 ? ' ' + convertBelowThousand(n % 100) : '');
  };

  if (num >= 10000000) {
    const crores = Math.floor(num / 10000000);
    const remainder = num % 10000000;
    return convertBelowThousand(crores) + ' Crore' + (remainder ? ' ' + numberToWords(remainder) : '');
  }
  if (num >= 100000) {
    const lakhs = Math.floor(num / 100000);
    const remainder = num % 100000;
    return convertBelowThousand(lakhs) + ' Lakh' + (remainder ? ' ' + numberToWords(remainder) : '');
  }
  if (num >= 1000) {
    const thousands = Math.floor(num / 1000);
    const remainder = num % 1000;
    return convertBelowThousand(thousands) + ' Thousand' + (remainder ? ' ' + numberToWords(remainder) : '');
  }
  return convertBelowThousand(num);
}

export default InvoiceGeneratorSection;
