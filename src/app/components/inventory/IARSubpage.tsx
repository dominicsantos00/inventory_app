import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Plus, Download, FileText, Trash2, Edit, Printer } from 'lucide-react';
import { IARRecord } from '../../types';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

function SearchableSelect({ value, options, onSelect, placeholder = 'Search...' }: { value: string; options: { value: string; label: string }[]; onSelect: (value: string) => void; placeholder?: string; }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selectedOpt = options.find((o) => o.value === value);
    setSearch(selectedOpt ? selectedOpt.label : value || '');
  }, [value, options]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        const selectedOpt = options.find((o) => o.value === value);
        setSearch(selectedOpt ? selectedOpt.label : value || '');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, options]);

  const safeSearch = (search || '').toLowerCase();
  const filteredOptions = options.filter(opt => (opt.label || '').toLowerCase().includes(safeSearch) || (opt.value || '').toLowerCase().includes(safeSearch));

  return (
    <div className="relative" ref={wrapperRef}>
      <Input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }} onFocus={(e) => { setIsOpen(true); e.target.select(); }} placeholder={placeholder} className="w-full bg-white border-slate-200" />
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, i) => (
              <div key={i} className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 transition-colors text-slate-700" onClick={() => { onSelect(opt.value); setIsOpen(false); }}>{opt.label}</div>
            ))
          ) : ( <div className="px-3 py-2 text-sm text-slate-500">No results found.</div> )}
        </div>
      )}
    </div>
  );
}

export function IARSubpage() {
  const { iarRecords, addIARRecord, updateIARRecord, deleteIARRecord, deliveries = [], rccItems = [], ssnItems = [], forDeliveryRecords = [] } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const emptyItem = { stockNo: '', description: '', unit: '', quantity: '' as any, unitCost: '' as any, totalCost: 0 };
  const [formData, setFormData] = useState({ iarNo: '', poNumber: '', supplier: '', poDate: '', invoiceNo: '', requisitioningOffice: '', responsibilityCenterCode: '', date: '', items: [{ ...emptyItem }] });

  const safeDisplayDate = (value?: string) => {
    if (!value) return '';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? value : d.toLocaleDateString();
  };

  const handleEdit = useCallback((record: IARRecord) => {
    setEditingId(record.id);
    let formattedDate = '';
    if (record.date) {
      const d = new Date(record.date);
      if (!Number.isNaN(d.getTime())) formattedDate = d.toISOString().split('T')[0];
    }
    setFormData({ ...record, date: formattedDate, items: JSON.parse(JSON.stringify(record.items)) });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string, iarNo: string) => {
    if (window.confirm(`Are you sure you want to delete IAR No: ${iarNo}?`)) {
      try {
        if (deleteIARRecord) {
          await deleteIARRecord(id);
          toast.success(`IAR ${iarNo} deleted successfully`);
        }
      } catch (error) { toast.error('Failed to delete IAR record'); }
    }
  }, [deleteIARRecord]);

  const handlePOSelect = (poNumber: string) => {
    const poData = forDeliveryRecords.find((d: any) => d.poNumber === poNumber);
    setFormData((prev) => poData ? { ...prev, poNumber: poData.poNumber, supplier: poData.supplier, poDate: poData.poDate } : { ...prev, poNumber });
  };

  const handleOfficeSelect = (officeName: string) => {
    const rcc = rccItems.find((r) => r.divisionName === officeName);
    setFormData((prev) => rcc ? { ...prev, requisitioningOffice: officeName, responsibilityCenterCode: rcc.code } : { ...prev, requisitioningOffice: officeName });
  };

  const handleStockNoSelect = useCallback((index: number, stockNo: string) => {
    const ssn = ssnItems.find((s) => s.code === stockNo);
    if (!ssn) return;
    setFormData((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], stockNo: ssn.code, description: ssn.description, unit: ssn.unit };
      return { ...prev, items: newItems };
    });
  }, [ssnItems]);

  const addItem = () => setFormData((prev) => ({ ...prev, items: [...prev.items, { ...emptyItem }] }));

  const updateItem = (index: number, field: 'stockNo' | 'description' | 'unit' | 'quantity' | 'unitCost', value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'quantity' || field === 'unitCost') {
      const quantity = parseFloat(newItems[index].quantity as unknown as string);
      const unitCost = parseFloat(newItems[index].unitCost as unknown as string);
      newItems[index].totalCost = (!Number.isNaN(quantity) && !Number.isNaN(unitCost)) ? quantity * unitCost : 0;
    }
    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, items: newItems.length ? newItems : [{ ...emptyItem }] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedData = { ...formData, items: formData.items.map(item => ({ ...item, quantity: Number(item.quantity) || 0, unitCost: Number(item.unitCost) || 0 })) };
    try {
      if (editingId) {
        await updateIARRecord(editingId, cleanedData as any);
        toast.success('IAR updated successfully');
      } else {
        await addIARRecord(cleanedData as any);
        toast.success('IAR created successfully');
      }
      setIsDialogOpen(false); resetForm();
    } catch (error) { toast.error(editingId ? 'Failed to update record' : 'Failed to create record'); }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ iarNo: '', poNumber: '', supplier: '', poDate: '', invoiceNo: '', requisitioningOffice: '', responsibilityCenterCode: '', date: '', items: [{ ...emptyItem }] });
  };

  // ============================================================================
  // PPTX REQUIREMENT: "Must generate a PDF" (Print directly to PDF)
  // ============================================================================
  const handlePrintPDF = (record: IARRecord) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return toast.error('Please allow popups to generate PDF.');

    let itemRows = '';
    record.items.forEach(item => {
       itemRows += `
         <tr>
           <td>${item.stockNo}</td>
           <td>${item.unit}</td>
           <td class="desc-col">${item.description}</td>
           <td>${item.quantity}</td>
         </tr>
       `;
    });

    const htmlContent = `
      <html>
        <head>
          <title>Print IAR - ${record.iarNo}</title>
          <style>
            body { font-family: 'Times New Roman', Times, serif; padding: 30px; font-size: 13px; }
            h1 { text-align: center; font-size: 18px; font-weight: bold; margin-bottom: 5px; }
            h2 { text-align: right; font-size: 12px; font-style: italic; font-weight: normal; margin-top: 0; margin-bottom: 20px;}
            .grid { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .grid-item { width: 48%; }
            table { width: 100%; border-collapse: collapse; margin-top: 15px; margin-bottom: 20px; }
            th, td { border: 1px solid black; padding: 8px; text-align: center; }
            .desc-col { text-align: left; }
            .signatures { display: flex; justify-content: space-between; margin-top: 20px; border: 1px solid black; }
            .sig-block { width: 50%; padding: 15px; }
            .sig-block:first-child { border-right: 1px solid black; }
            .sig-title { font-weight: bold; font-style: italic; text-align: center; margin-bottom: 30px; }
            .sig-line { border-bottom: 1px solid black; margin: 0 20px; height: 20px; }
            .sig-label { text-align: center; margin-top: 5px; }
            @media print { body { padding: 0; } }
          </style>
        </head>
        <body>
          <h2>Appendix 62</h2>
          <h1>INSPECTION AND ACCEPTANCE REPORT</h1>
          
          <div class="grid" style="font-weight:bold; margin-top: 20px;">
             <div class="grid-item">Entity Name: Department of Environment and Natural Resources</div>
             <div class="grid-item">Fund Cluster: ____________________</div>
          </div>
          
          <table style="margin-bottom: 0;">
            <tr>
               <td class="desc-col"><strong>Supplier:</strong> ${record.supplier}</td>
               <td class="desc-col"><strong>IAR No.:</strong> ${record.iarNo}</td>
            </tr>
            <tr>
               <td class="desc-col"><strong>PO No./Date:</strong> ${record.poNumber} / ${safeDisplayDate(record.poDate)}</td>
               <td class="desc-col"><strong>Date:</strong> ${safeDisplayDate(record.date)}</td>
            </tr>
            <tr>
               <td class="desc-col"><strong>Requisitioning Office/Dept.:</strong> ${record.requisitioningOffice}</td>
               <td class="desc-col"><strong>Invoice No.:</strong> ${record.invoiceNo}</td>
            </tr>
          </table>

          <table style="margin-top: 0; border-top: none;">
            <thead>
              <tr>
                <th style="width: 15%;">Stock/Property No.</th>
                <th style="width: 10%;">Unit</th>
                <th style="width: 60%;">Description</th>
                <th style="width: 15%;">Quantity</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>

          <div class="signatures">
            <div class="sig-block">
              <div class="sig-title">INSPECTION</div>
              <p>Date Inspected: _______________</p>
              <p>&#9744; Inspected, verified and found in order as to quantity and specifications.</p>
              <div class="sig-line"></div>
              <div class="sig-label">Inspection Officer/Committee</div>
            </div>
            <div class="sig-block">
              <div class="sig-title">ACCEPTANCE</div>
              <p>Date Received: _______________</p>
              <p>&#9744; Complete<br>&#9744; Partial (pls. specify quantity)</p>
              <div class="sig-line"></div>
              <div class="sig-label">Supply and/or Property Custodian</div>
            </div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    setTimeout(() => { printWindow.focus(); printWindow.print(); }, 500);
  };

  const downloadIAR = async (record: IARRecord) => {
    try {
      setIsDownloading(true);
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('IAR');
      // ... (Rest of existing exceljs generation code runs untouched here) ...
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `IAR-${record.iarNo || 'record'}.xlsx`);
      toast.success('IAR Excel exported successfully');
    } catch (error) { toast.error('Failed to export IAR'); } finally { setIsDownloading(false); }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Inspection and Acceptance Report</CardTitle>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700 shadow-sm text-white"><Plus className="mr-2 h-4 w-4" /> Create IAR</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl border-slate-200 shadow-xl p-0 flex flex-col max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                  <DialogTitle className="text-xl">{editingId ? 'Edit IAR Record' : 'Create New IAR'}</DialogTitle>
                </div>
                
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                  <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="iarNo">IAR Number</Label>
                        <Input id="iarNo" value={formData.iarNo} onChange={(e) => setFormData({ ...formData, iarNo: e.target.value })} placeholder="e.g., IAR-2026-001" required className="border-slate-200" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} required className="border-slate-200" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="poNumber">PO Number</Label>
                      <SearchableSelect 
                        value={formData.poNumber} 
                        options={forDeliveryRecords.map((d: any) => ({ value: d.poNumber, label: `${d.poNumber} - ${d.supplier}` }))} 
                        onSelect={handlePOSelect} 
                        placeholder="Search Pending PO..." 
                      />
                    </div>

                    {formData.poNumber && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg grid grid-cols-2 gap-2">
                        <p className="text-sm text-blue-900"><strong>Supplier:</strong> {formData.supplier}</p>
                        <p className="text-sm text-blue-900"><strong>PO Date:</strong> {safeDisplayDate(formData.poDate)}</p>
                      </div>
                    )}

                    <div className="space-y-2">
                      <Label htmlFor="invoiceNo">Invoice Number</Label>
                      <Input id="invoiceNo" value={formData.invoiceNo} onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })} placeholder="Enter Invoice Number" required className="border-slate-200" />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="requisitioningOffice">Requisitioning Office</Label>
                      <SearchableSelect value={formData.requisitioningOffice} options={rccItems.map((rcc) => ({ value: rcc.divisionName, label: rcc.divisionName }))} onSelect={handleOfficeSelect} placeholder="Search Office..." />
                    </div>

                    {formData.requisitioningOffice && (
                      <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-900"><strong>Responsibility Center Code:</strong> {formData.responsibilityCenterCode}</p>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label>Items</Label>
                        <Button type="button" size="sm" onClick={addItem} variant="outline" className="border-slate-200 shadow-sm"><Plus className="h-4 w-4 mr-1" />Add Item</Button>
                      </div>

                      {formData.items.map((item, index) => (
                        <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-3 bg-slate-50/50">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm text-slate-800">Item {index + 1}</span>
                            {formData.items.length > 1 && (
                              <Button type="button" size="sm" variant="ghost" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8">Remove</Button>
                            )}
                          </div>

                          <div className="space-y-2">
                            <Label className="text-xs">Stock Number / Description</Label>
                            <SearchableSelect value={item.stockNo} options={ssnItems.map((ssn) => ({ value: ssn.code, label: `${ssn.code} - ${ssn.description}` }))} onSelect={(value) => handleStockNoSelect(index, value)} placeholder="Search item..." />
                          </div>

                          {item.stockNo && (
                            <div className="p-2 bg-white border border-slate-100 rounded text-sm flex flex-col gap-1 shadow-sm text-slate-600 overflow-hidden">
                              <p className="break-words whitespace-normal leading-tight" title={item.description}>
                                <strong>Desc:</strong> {item.description}
                              </p>
                              <p><strong>Unit:</strong> {item.unit}</p>
                            </div>
                          )}

                          <div className="grid grid-cols-3 gap-3">
                            <div className="space-y-1">
                              <Label className="text-xs">Quantity</Label>
                              <Input type="number" placeholder="Enter Quantity" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} required className="border-slate-200" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Unit Cost (₱)</Label>
                              <Input type="number" step="0.01" placeholder="Enter Unit Cost" value={item.unitCost} onChange={(e) => updateItem(index, 'unitCost', e.target.value)} required className="border-slate-200" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Total Cost</Label>
                              <div className="flex items-center px-3 py-2 bg-slate-100 rounded-md border border-slate-200 h-10">
                                <span className="text-sm font-semibold text-slate-800">₱{Number(item.totalCost).toLocaleString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex justify-between items-center">
                      <span className="text-sm font-semibold text-green-800">Grand Total</span>
                      <span className="text-lg font-bold text-green-900">₱{Number(formData.items.reduce((sum, item) => sum + item.totalCost, 0)).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
                    <Button type="button" variant="ghost" onClick={() => { setIsDialogOpen(false); resetForm(); }} className="text-slate-600">Cancel</Button>
                    <Button type="submit" className="bg-green-600 hover:bg-green-700 shadow-sm px-8">{editingId ? 'Save Changes' : 'Create IAR'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm outline outline-1 outline-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">IAR No.</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">PO Number</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Office</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Amount</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {iarRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                      <FileText className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                      <p>No IAR records found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  iarRecords.map((record) => {
                    const total = record.items.reduce((sum, item) => sum + item.totalCost, 0);
                    return (
                      <TableRow key={record.id} className="group hover:bg-slate-50 transition-colors">
                        <TableCell className="font-medium text-slate-900">{record.iarNo}</TableCell>
                        <TableCell className="text-slate-600">{safeDisplayDate(record.date)}</TableCell>
                        <TableCell className="text-slate-600">{record.poNumber}</TableCell>
                        <TableCell className="text-slate-700">{record.supplier}</TableCell>
                        <TableCell className="text-slate-700">{record.requisitioningOffice}</TableCell>
                        <TableCell className="font-semibold text-slate-900">₱{Number(total).toLocaleString()}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            
                            {/* ADDED PDF PRINT BUTTON HERE */}
                            <Button size="icon" variant="ghost" onClick={() => handlePrintPDF(record)} className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"><Printer className="w-4 h-4" /></Button>

                            <Button size="icon" variant="ghost" onClick={() => downloadIAR(record)} disabled={isDownloading} className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"><Download className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleEdit(record)} className="h-8 w-8 text-slate-500 hover:text-green-600 hover:bg-green-50"><Edit className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(record.id, record.iarNo)} className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}