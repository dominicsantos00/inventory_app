import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Plus, Download, FileText, Eye } from 'lucide-react';
import { RSMIRecord } from '../../types';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

function SearchableSelect({ value, options, onSelect, placeholder = 'Search...' }: { value: string; options: { value: string; label: string }[]; onSelect: (value: string) => void; placeholder?: string; }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);
  useEffect(() => { const selectedOpt = options.find((o) => o.value === value); setSearch(selectedOpt ? selectedOpt.label : value || ''); }, [value, options]);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) { if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) { setIsOpen(false); const selectedOpt = options.find((o) => o.value === value); setSearch(selectedOpt ? selectedOpt.label : value || ''); } }
    document.addEventListener('mousedown', handleClickOutside); return () => document.removeEventListener('mousedown', handleClickOutside);
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

export function RSMISubpage() {
  const { rsmiRecords, addRSMIRecord, updateRSMIRecord, deleteRSMIRecord, rccItems = [], deliveries = [] } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingRecord, setViewingRecord] = useState<RSMIRecord | null>(null);
  
  const emptyItem = { stockNo: '', description: '', unit: '', quantity: '' as any, unitCost: 0 as any, totalCost: 0, office: '' };
  const [formData, setFormData] = useState({ reportNo: '', period: '', items: [{ ...emptyItem }] });

  const handleEdit = (record: RSMIRecord) => {
    setEditingId(record.id);
    let formattedDate = record.period;
    const d = new Date(record.period);
    if (!Number.isNaN(d.getTime())) formattedDate = d.toISOString().split('T')[0];
    setFormData({ reportNo: record.reportNo, period: formattedDate, items: JSON.parse(JSON.stringify(record.items)) });
    setIsDialogOpen(true);
  };
  void handleEdit;

  const handleView = (record: RSMIRecord) => setViewingRecord(record);

  const handleDeleteRecord = async (id: string, reportNo: string) => {
    if (window.confirm(`Are you sure you want to delete RSMI Report No: ${reportNo}?`)) {
      try { if (deleteRSMIRecord) { await deleteRSMIRecord(id); toast.success(`RSMI ${reportNo} deleted`); } } catch (error) { toast.error('Failed to delete RSMI record'); }
    }
  };
  void handleDeleteRecord;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedData = { ...formData, items: formData.items.map(item => ({ ...item, quantity: Number(item.quantity) || 0, unitCost: Number(item.unitCost) || 0, totalCost: Number(item.totalCost) || 0 })) };
    try {
      if (editingId) { await updateRSMIRecord(editingId, cleanedData as any); toast.success('RSMI updated successfully'); }
      else { await addRSMIRecord(cleanedData as any); toast.success('RSMI created successfully'); }
      setIsDialogOpen(false); resetForm();
    } catch (error) { toast.error(editingId ? 'Failed to update record' : 'Failed to create record'); }
  };

  const resetForm = () => { setEditingId(null); setFormData({ reportNo: '', period: '', items: [{ ...emptyItem }] }); };
  const addItem = () => setFormData({ ...formData, items: [...formData.items, { ...emptyItem }] });

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items]; newItems[index] = { ...newItems[index], [field]: value };
    if (field === 'stockNo' && value) {
      const matchingDelivery = deliveries.find((d: any) => d.item && d.item.toLowerCase() === value.toLowerCase());
      if (matchingDelivery) { newItems[index].description = matchingDelivery.itemDescription || matchingDelivery.item || ''; newItems[index].unit = matchingDelivery.unit || ''; newItems[index].unitCost = Number(matchingDelivery.unitPrice) || 0; } else { newItems[index].unitCost = 0; }
    }
    if (field === 'quantity' || field === 'stockNo' || field === 'unitCost') {
      const qty = parseFloat(newItems[index].quantity as unknown as string); const cost = Number(newItems[index].unitCost);
      newItems[index].totalCost = (!Number.isNaN(qty) && !Number.isNaN(cost) && qty >= 0 && cost >= 0) ? qty * cost : 0;
    }
    setFormData({ ...formData, items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: newItems.length ? newItems : [{ ...emptyItem }]});
  };

  const downloadRSMI = async (record: RSMIRecord) => {
    try {
      setIsDownloading(true);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('RSMI Report', { pageSetup: { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 0, horizontalCentered: true, margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 } } });
      worksheet.columns = [{ key: 'A', width: 10 }, { key: 'B', width: 15 }, { key: 'C', width: 12 }, { key: 'D', width: 25 }, { key: 'E', width: 8 }, { key: 'F', width: 10 }, { key: 'G', width: 12 }, { key: 'H', width: 12 }, { key: 'I', width: 15 }];
      const fontBase = { name: 'Arial', size: 10 }; const fontBold = { name: 'Arial', size: 10, bold: true }; const fontItalic = { name: 'Arial', size: 10, italic: true }; const fontTitle = { name: 'Arial', size: 12, bold: true };
      const alignCenter: Partial<ExcelJS.Alignment> = { horizontal: 'center', vertical: 'middle', wrapText: true }; const alignLeft: Partial<ExcelJS.Alignment> = { horizontal: 'left', vertical: 'middle', wrapText: true }; const alignRight: Partial<ExcelJS.Alignment> = { horizontal: 'right', vertical: 'middle' };
      const setOuterBorder = (sheet: ExcelJS.Worksheet, startRow: number, endRow: number, startCol: number, endCol: number, style: ExcelJS.BorderStyle = 'thin') => { for(let r = startRow; r <= endRow; r++) { for(let c = startCol; c <= endCol; c++) { const cell = sheet.getCell(r, c); const border = cell.border ? { ...cell.border } : {}; if (r === startRow) border.top = { style }; if (r === endRow) border.bottom = { style }; if (c === startCol) border.left = { style }; if (c === endCol) border.right = { style }; cell.border = border; } } };
      const setFullBorder = (sheet: ExcelJS.Worksheet, startRow: number, endRow: number, startCol: number, endCol: number, style: ExcelJS.BorderStyle = 'thin') => { for (let r = startRow; r <= endRow; r++) { for (let c = startCol; c <= endCol; c++) sheet.getCell(r, c).border = { top: {style}, bottom: {style}, left: {style}, right: {style} }; } };

      worksheet.getCell('I2').value = 'Appendix 64'; worksheet.getCell('I2').font = { ...fontBold, italic: true }; worksheet.getCell('I2').alignment = alignRight;
      worksheet.mergeCells('A4:D4'); worksheet.getCell('A4').value = 'Entity Name: ____________________________'; worksheet.getCell('A4').font = fontBold;
      worksheet.mergeCells('G4:I4'); worksheet.getCell('G4').value = `Serial No. : ${record.reportNo || '___________________'}`; worksheet.getCell('G4').font = fontBold;
      worksheet.mergeCells('A5:D5'); worksheet.getCell('A5').value = 'Fund Cluster: ____________________________'; worksheet.getCell('A5').font = fontBold;
      worksheet.mergeCells('G5:I5'); let displayDate = record.period; const d = new Date(record.period); if (!Number.isNaN(d.getTime())) displayDate = d.toLocaleDateString(); worksheet.getCell('G5').value = `Date : ${displayDate || '___________________'}`; worksheet.getCell('G5').font = fontBold;
      worksheet.mergeCells('A7:I7'); worksheet.getCell('A7').value = 'REPORT OF SUPPLIES AND MATERIALS ISSUED'; worksheet.getCell('A7').font = fontTitle; worksheet.getCell('A7').alignment = alignCenter;
      worksheet.mergeCells('A9:F9'); worksheet.getCell('A9').value = 'To be filled up by the Supply and/or Property Division/Unit'; worksheet.getCell('A9').font = fontItalic; worksheet.getCell('A9').alignment = alignCenter;
      worksheet.mergeCells('G9:I9'); worksheet.getCell('G9').value = 'To be filled up by the Accounting Division/Unit'; worksheet.getCell('G9').font = fontItalic; worksheet.getCell('G9').alignment = alignCenter;
      ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(col => { worksheet.mergeCells(`${col}10:${col}11`); worksheet.getCell(`${col}10`).font = fontBold; worksheet.getCell(`${col}10`).alignment = alignCenter; });
      worksheet.mergeCells('H10:I11'); worksheet.getCell('H10').font = fontBold; worksheet.getCell('H10').alignment = alignCenter;
      worksheet.getCell('A10').value = 'RIS No.'; worksheet.getCell('B10').value = 'Responsibility\nCenter Code'; worksheet.getCell('C10').value = 'Stock No.'; worksheet.getCell('D10').value = 'Item'; worksheet.getCell('E10').value = 'Unit'; worksheet.getCell('F10').value = 'Quantity\nIssued'; worksheet.getCell('G10').value = 'Unit Cost'; worksheet.getCell('H10').value = 'Amount';
      setFullBorder(worksheet, 9, 11, 1, 9);
      
      let currentRow = 12; const totalRows = Math.max(15, record.items.length);
      for (let i = 0; i < totalRows; i++) {
        const item = record.items[i]; worksheet.mergeCells(`H${currentRow}:I${currentRow}`);
        if (item) { worksheet.getCell(`B${currentRow}`).value = item.office || ''; worksheet.getCell(`C${currentRow}`).value = item.stockNo || ''; worksheet.getCell(`D${currentRow}`).value = item.description || ''; worksheet.getCell(`E${currentRow}`).value = item.unit || ''; worksheet.getCell(`F${currentRow}`).value = item.quantity || ''; worksheet.getCell(`G${currentRow}`).value = item.unitCost ? Number(item.unitCost) : ''; worksheet.getCell(`G${currentRow}`).numFmt = '#,##0.00'; worksheet.getCell(`H${currentRow}`).value = item.totalCost ? Number(item.totalCost) : ''; worksheet.getCell(`H${currentRow}`).numFmt = '#,##0.00'; }
        for (let c = 1; c <= 9; c++) { const cell = worksheet.getCell(currentRow, c); cell.font = fontBase; cell.border = { top: {style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} }; if (c === 4) cell.alignment = alignLeft; else if (c === 7 || c === 8) cell.alignment = alignRight; else cell.alignment = alignCenter; }
        currentRow++;
      }
      
      const recapStart = currentRow; worksheet.mergeCells(`A${recapStart}:F${recapStart}`); worksheet.getCell(`A${recapStart}`).value = 'Recapitulation'; worksheet.getCell(`A${recapStart}`).font = fontBold; worksheet.getCell(`A${recapStart}`).alignment = alignCenter; worksheet.mergeCells(`G${recapStart}:I${recapStart}`); worksheet.getCell(`G${recapStart}`).value = 'Recapitulation'; worksheet.getCell(`G${recapStart}`).font = fontBold; worksheet.getCell(`G${recapStart}`).alignment = alignCenter;
      const recapHeaderRow = recapStart + 1; worksheet.mergeCells(`A${recapHeaderRow}:D${recapHeaderRow}`); worksheet.getCell(`A${recapHeaderRow}`).value = 'Stock No.'; worksheet.mergeCells(`E${recapHeaderRow}:F${recapHeaderRow}`); worksheet.getCell(`E${recapHeaderRow}`).value = 'Quantity'; worksheet.getCell(`G${recapHeaderRow}`).value = 'Unit Cost'; worksheet.getCell(`H${recapHeaderRow}`).value = 'Total Cost'; worksheet.getCell(`I${recapHeaderRow}`).value = 'UACS Object Code';
      for (let c = 1; c <= 9; c++) { worksheet.getCell(recapStart, c).border = { top: {style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} }; worksheet.getCell(recapHeaderRow, c).border = { top: {style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} }; worksheet.getCell(recapHeaderRow, c).font = fontBold; worksheet.getCell(recapHeaderRow, c).alignment = alignCenter; }
      
      currentRow = recapHeaderRow + 1; const recapRows = Math.max(5, record.items.length);
      for (let i = 0; i < recapRows; i++) {
        const item = record.items[i]; worksheet.mergeCells(`A${currentRow}:D${currentRow}`); worksheet.mergeCells(`E${currentRow}:F${currentRow}`);
        if (item) { worksheet.getCell(`A${currentRow}`).value = item.stockNo || ''; worksheet.getCell(`E${currentRow}`).value = item.quantity || ''; worksheet.getCell(`G${currentRow}`).value = item.unitCost ? Number(item.unitCost) : ''; worksheet.getCell(`G${currentRow}`).numFmt = '#,##0.00'; worksheet.getCell(`H${currentRow}`).value = item.totalCost ? Number(item.totalCost) : ''; worksheet.getCell(`H${currentRow}`).numFmt = '#,##0.00'; }
        for (let c = 1; c <= 9; c++) { const cell = worksheet.getCell(currentRow, c); cell.font = fontBase; cell.border = { top: {style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} }; if (c === 7 || c === 8) cell.alignment = alignRight; else cell.alignment = alignCenter; }
        currentRow++;
      }
      
      const sigStart = currentRow; worksheet.mergeCells(`A${sigStart}:F${sigStart}`); worksheet.getCell(`A${sigStart}`).value = 'I hereby certify to the correctness of the above information.'; worksheet.getCell(`A${sigStart}`).font = fontBase; worksheet.getCell(`A${sigStart}`).alignment = { horizontal: 'left', vertical: 'top', indent: 1 }; worksheet.mergeCells(`G${sigStart}:I${sigStart}`); worksheet.getCell(`G${sigStart}`).value = 'Posted by:'; worksheet.getCell(`G${sigStart}`).font = fontBase; worksheet.getCell(`G${sigStart}`).alignment = { horizontal: 'left', vertical: 'top', indent: 1 };
      worksheet.getRow(sigStart).height = 20; worksheet.getRow(sigStart + 1).height = 20; worksheet.getRow(sigStart + 2).height = 20;
      worksheet.mergeCells(`A${sigStart+3}:F${sigStart+3}`); worksheet.getCell(`A${sigStart+3}`).value = '__________________________________________________'; worksheet.getCell(`A${sigStart+3}`).alignment = { horizontal: 'center', vertical: 'bottom' }; worksheet.mergeCells(`G${sigStart+3}:I${sigStart+3}`); worksheet.getCell(`G${sigStart+3}`).value = '_______________________________________'; worksheet.getCell(`G${sigStart+3}`).alignment = { horizontal: 'center', vertical: 'bottom' };
      worksheet.mergeCells(`A${sigStart+4}:F${sigStart+4}`); worksheet.getCell(`A${sigStart+4}`).value = 'Signature over Printed Name of Supply and/or Property Custodian'; worksheet.getCell(`A${sigStart+4}`).font = fontBase; worksheet.getCell(`A${sigStart+4}`).alignment = { horizontal: 'center', vertical: 'top' }; worksheet.mergeCells(`G${sigStart+4}:I${sigStart+4}`); worksheet.getCell(`G${sigStart+4}`).value = 'Signature over Printed Name of Designated Accounting Staff'; worksheet.getCell(`G${sigStart+4}`).font = fontBase; worksheet.getCell(`G${sigStart+4}`).alignment = { horizontal: 'center', vertical: 'top', wrapText: true };
      worksheet.mergeCells(`A${sigStart+6}:F${sigStart+6}`); worksheet.getCell(`A${sigStart+6}`).value = 'Date'; worksheet.getCell(`A${sigStart+6}`).font = fontBase; worksheet.getCell(`A${sigStart+6}`).alignment = { horizontal: 'center', vertical: 'top' }; worksheet.mergeCells(`G${sigStart+6}:I${sigStart+6}`); worksheet.getCell(`G${sigStart+6}`).value = 'Date'; worksheet.getCell(`G${sigStart+6}`).font = fontBase; worksheet.getCell(`G${sigStart+6}`).alignment = { horizontal: 'center', vertical: 'top' };
      setOuterBorder(worksheet, sigStart, sigStart+6, 1, 6, 'thin'); setOuterBorder(worksheet, sigStart, sigStart+6, 7, 9, 'thin');

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `RSMI-${record.reportNo || 'Report'}.xlsx`);
      toast.success('Excel generated successfully!');
    } catch (error) { toast.error('Failed to generate Excel file'); } finally { setIsDownloading(false); }
  };

  const handleCreate = () => { setEditingId(null); setFormData({ reportNo: '', period: '', items: [{ ...emptyItem }] }); setIsDialogOpen(true); };
  void handleCreate;

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100">
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Report of Supplies and Materials Issued</CardTitle>
            </div>
            
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700 shadow-sm text-white"><Plus className="mr-2 h-4 w-4" /> Create RSMI</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl border-slate-200 shadow-xl overflow-hidden p-0">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <DialogTitle className="text-xl">{editingId ? 'Edit RSMI Record' : 'Create New RSMI Report'}</DialogTitle>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reportNo">Report Number</Label>
                      <Input id="reportNo" value={formData.reportNo} onChange={(e) => setFormData({ ...formData, reportNo: e.target.value })} placeholder="e.g., RSMI-2026-Q1" required className="border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="period">Period</Label>
                      <Input id="period" type="date" value={formData.period} onChange={(e) => setFormData({ ...formData, period: e.target.value })} required className="border-slate-200" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Items Issued</Label>
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

                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Stock No.</Label>
                            <SearchableSelect value={item.stockNo} options={deliveries.map((d: any) => ({ value: d.item || '', label: `${d.item || ''} - ${d.itemDescription || d.item || ''}` }))} onSelect={(value) => updateItem(index, 'stockNo', value)} placeholder="Search..." />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Description</Label>
                            <Input placeholder="Auto" value={item.description} disabled className="bg-white border-slate-100 shadow-sm" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Unit</Label>
                            <Input placeholder="Auto" value={item.unit} disabled className="bg-white border-slate-100 shadow-sm" />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Quantity</Label>
                            <Input type="number" placeholder="Enter Qty" value={item.quantity} onChange={(e) => updateItem(index, 'quantity', e.target.value)} required className="border-slate-200" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Unit Cost (₱)</Label>
                            <div className="flex items-center px-3 py-2 bg-white rounded-md border border-slate-100 shadow-sm h-10">
                              <span className="text-sm text-slate-600 font-medium">₱{(Number(item.unitCost) || 0).toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Total Cost</Label>
                            <div className="flex items-center px-3 py-2 bg-slate-100 rounded-md border border-slate-200 h-10">
                              <span className="text-sm font-semibold text-slate-800">₱{Number(item.totalCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Division (RCC)</Label>
                            <SearchableSelect value={item.office} options={rccItems.map((rcc) => ({ value: rcc.divisionName, label: rcc.divisionName }))} onSelect={(value) => updateItem(index, 'office', value)} placeholder="Select Division" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg flex justify-between items-center">
                    <span className="text-sm font-semibold text-purple-800">Grand Total</span>
                    <span className="text-lg font-bold text-purple-900">₱{Number(formData.items.reduce((sum, item) => sum + Number(item.totalCost), 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                    <Button type="button" variant="ghost" onClick={() => { setIsDialogOpen(false); resetForm(); }} className="text-slate-600">Cancel</Button>
                    <Button type="submit" className="bg-purple-600 hover:bg-purple-700 shadow-sm">{editingId ? 'Save Changes' : 'Create RSMI'}</Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Report No.</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Items Count</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Value</TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rsmiRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    <FileText className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                    <p>No RSMI records found</p>
                  </TableCell>
                </TableRow>
              ) : (
                rsmiRecords.map((record) => {
                  const total = Number(record.items.reduce((sum, item) => sum + Number(item.totalCost), 0));
                  let tableDateDisplay = record.period; const d = new Date(record.period); if (!Number.isNaN(d.getTime())) tableDateDisplay = d.toLocaleDateString();

                  return (
                    <TableRow key={record.id} className="group hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium text-slate-900">{record.reportNo}</TableCell>
                      <TableCell className="text-slate-600">{tableDateDisplay}</TableCell>
                      <TableCell className="font-medium text-slate-800">{record.items.length}</TableCell>
                      <TableCell className="font-semibold text-slate-900">₱{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" onClick={() => handleView(record)} className="h-8 w-8 text-slate-500 hover:text-purple-600 hover:bg-purple-50"><Eye className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => downloadRSMI(record)} disabled={isDownloading} className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"><Download className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Record Modal */}
      <Dialog open={!!viewingRecord} onOpenChange={(open) => !open && setViewingRecord(null)}>
        <DialogContent className="max-w-4xl border-slate-200 shadow-xl overflow-hidden p-0">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-xl">View RSMI Record</DialogTitle>
          </div>
          {viewingRecord && (
            <div className="p-6 space-y-4 bg-white">
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-lg">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Report No.</label>
                  <p className="text-slate-900 font-medium text-lg">{viewingRecord.reportNo}</p>
                </div>
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Date</label>
                  <p className="text-slate-900 font-medium text-lg">{new Date(viewingRecord.period).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-slate-50 border-b border-slate-200">
                    <tr>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock No.</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit</th>
                      <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit Cost</th>
                      <th className="text-right py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {viewingRecord.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="py-3 px-4 text-sm font-medium text-slate-900">{item.stockNo}</td>
                        <td className="py-3 px-4 text-sm text-slate-700">{item.description}</td>
                        <td className="py-3 px-4 text-sm text-slate-600 text-center">{item.unit}</td>
                        <td className="py-3 px-4 text-sm font-medium text-slate-800 text-center">{item.quantity}</td>
                        <td className="py-3 px-4 text-sm text-slate-600 text-right">₱{Number(item.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-3 px-4 text-sm font-semibold text-slate-900 text-right">₱{Number(item.totalCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg flex justify-between items-center">
                <span className="text-sm font-semibold text-purple-800">Grand Total</span>
                <span className="text-lg font-bold text-purple-900">₱{Number(viewingRecord.items.reduce((sum, item) => sum + Number(item.totalCost), 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <Button type="button" onClick={() => setViewingRecord(null)} className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm">Close Record</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}