import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Plus, Download, FileText, Edit, Trash2 } from 'lucide-react';
import { RISRecord } from '../../types';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

function SearchableSelect({ value, options, onSelect, placeholder = 'Search...' }: { value: string; options: { value: string; label: string }[]; onSelect: (value: string) => void; placeholder?: string; }) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selectedOpt = options.find((o) => o.value === value);
    setSearch(selectedOpt ? selectedOpt.label : value);
  }, [value, options]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        const selectedOpt = options.find((o) => o.value === value);
        setSearch(selectedOpt ? selectedOpt.label : value);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, options]);

  const filteredOptions = options.filter(opt => opt.label.toLowerCase().includes(search.toLowerCase()) || opt.value.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="relative" ref={wrapperRef}>
      <Input
        type="text" value={search}
        onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }}
        onFocus={(e) => { setIsOpen(true); e.target.select(); }}
        placeholder={placeholder}
        className="w-full bg-white border-slate-200"
      />
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, i) => (
              <div key={i} className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 transition-colors text-slate-700" onClick={() => { onSelect(opt.value); setIsOpen(false); }}>{opt.label}</div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-slate-500">No results found.</div>
          )}
        </div>
      )}
    </div>
  );
}

export function RISSubpage({ }: { isEditMode?: boolean }) {
  const { risRecords, addRISRecord, updateRISRecord, deleteRISRecord, rccItems, ssnItems } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; recordId: string | null; risNo: string | null; isDeleting: boolean; }>({ isOpen: false, recordId: null, risNo: null, isDeleting: false });

  const emptyItem = { stockNo: '', description: '', unit: '', quantityRequested: '' as any, quantityIssued: '' as any, remarks: '' };
  const [formData, setFormData] = useState({ risNo: '', division: '', responsibilityCenterCode: '', date: '', items: [{ ...emptyItem }] });

  const resetForm = useCallback(() => {
    setEditingId(null); setFormData({ risNo: '', division: '', responsibilityCenterCode: '', date: '', items: [{ ...emptyItem }] });
  }, []);

  const handleCreate = useCallback(() => { resetForm(); setIsDialogOpen(true); }, [resetForm]);

  const handleEdit = useCallback((record: RISRecord) => {
    setEditingId(record.id);
    let formattedDate = '';
    if (record.date) { const d = new Date(record.date); if (!Number.isNaN(d.getTime())) formattedDate = d.toISOString().split('T')[0]; }
    setFormData({ risNo: record.risNo, division: record.division, responsibilityCenterCode: record.responsibilityCenterCode, date: formattedDate, items: JSON.parse(JSON.stringify(record.items)) });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback((id: string, risNo: string) => { setDeleteConfirmation({ isOpen: true, recordId: id, risNo, isDeleting: false }); }, []);

  const handleConfirmDelete = useCallback(async () => {
    const { recordId, risNo } = deleteConfirmation;
    if (!recordId || !risNo) return;
    setDeleteConfirmation((prev) => ({ ...prev, isDeleting: true }));
    try {
      await deleteRISRecord(recordId);
      toast.success(`RIS ${risNo} deleted successfully! Stock has been reversed.`);
      setDeleteConfirmation({ isOpen: false, recordId: null, risNo: null, isDeleting: false });
    } catch (error) { toast.error('Failed to delete RIS record.'); setDeleteConfirmation((prev) => ({ ...prev, isDeleting: false })); }
  }, [deleteConfirmation, deleteRISRecord]);

  const handleCancelDelete = useCallback(() => { setDeleteConfirmation({ isOpen: false, recordId: null, risNo: null, isDeleting: false }); }, []);

  const addItem = useCallback(() => { setFormData((prev) => ({ ...prev, items: [...prev.items, { ...emptyItem }] })); }, []);

  const updateItem = useCallback((index: number, field: string, value: any) => {
    setFormData((prev) => { const newItems = [...prev.items]; newItems[index] = { ...newItems[index], [field]: value }; return { ...prev, items: newItems }; });
  }, []);

  const removeItem = useCallback((index: number) => {
    setFormData((prev) => { const newItems = prev.items.filter((_, i) => i !== index); return { ...prev, items: newItems.length ? newItems : [{ ...emptyItem }] }; });
  }, []);

  const handleDivisionSelect = useCallback((division: string) => {
    const rcc = rccItems.find((r) => r.divisionName === division);
    setFormData((prev) => ({ ...prev, division, responsibilityCenterCode: rcc ? rcc.code : '' }));
  }, [rccItems]);

  const handleStockNoSelect = useCallback((index: number, stockNo: string) => {
    const ssn = ssnItems.find((s) => s.code === stockNo);
    if (!ssn) return;
    setFormData((prev) => { const newItems = [...prev.items]; newItems[index] = { ...newItems[index], stockNo: ssn.code, description: ssn.description, unit: ssn.unit }; return { ...prev, items: newItems }; });
  }, [ssnItems]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedData = { ...formData, items: formData.items.map(item => ({ ...item, quantityRequested: Number(item.quantityRequested) || 0, quantityIssued: Number(item.quantityIssued) || 0 })) };
    const hasInvalidItem = cleanedData.items.some((item) => !item.stockNo || item.quantityRequested <= 0 || item.quantityIssued < 0);
    if (hasInvalidItem) { toast.error('Each RIS line must have a valid stock number and quantities.'); return; }
    try {
      if (editingId) { await updateRISRecord(editingId, cleanedData as any); toast.success('RIS updated successfully'); }
      else { await addRISRecord(cleanedData as any); toast.success('RIS created successfully'); }
      setIsDialogOpen(false); resetForm();
    } catch (error) { toast.error(editingId ? 'Failed to update record' : 'Failed to create record'); }
  }, [editingId, formData, updateRISRecord, addRISRecord, resetForm]);

  const downloadRIS = useCallback(async (record: RISRecord) => {
    try {
      setIsDownloading(true);
      const workbook = new ExcelJS.Workbook(); const worksheet = workbook.addWorksheet('RIS Report');
      worksheet.pageSetup = { paperSize: 9, orientation: 'portrait', fitToPage: true, fitToWidth: 1, fitToHeight: 1, margins: { left: 0.5, right: 0.5, top: 0.75, bottom: 0.75, header: 0.3, footer: 0.3 } };
      worksheet.columns = [{ key: 'A', width: 15 }, { key: 'B', width: 10 }, { key: 'C', width: 35 }, { key: 'D', width: 12 }, { key: 'E', width: 8 }, { key: 'F', width: 8 }, { key: 'G', width: 12 }, { key: 'H', width: 20 }];
      const borderThin: Partial<ExcelJS.Borders> = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      const centerMiddle: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'center' };
      const leftMiddle: Partial<ExcelJS.Alignment> = { vertical: 'middle', horizontal: 'left' };
      const defaultFont = { name: 'Arial', size: 10 };
      worksheet.columns.forEach((col) => { if (col) col.font = defaultFont; });
      worksheet.getCell('H2').value = 'Appendix 63'; worksheet.getCell('H2').font = { ...defaultFont, italic: true }; worksheet.getCell('H2').alignment = { horizontal: 'right' };
      worksheet.mergeCells('A4:H4'); const titleCell = worksheet.getCell('A4'); titleCell.value = 'REQUISITION AND ISSUE SLIP'; titleCell.font = { ...defaultFont, bold: true, size: 14 }; titleCell.alignment = centerMiddle;
      worksheet.mergeCells('A6:E6'); worksheet.getCell('A6').value = 'Entity Name : __________________________________';
      worksheet.mergeCells('F6:H6'); worksheet.getCell('F6').value = 'Fund Cluster : ______________________';
      worksheet.mergeCells('A7:E7'); worksheet.getCell('A7').value = `Division : ${record.division || '_______________________________________________'}`;
      worksheet.mergeCells('F7:H7'); worksheet.getCell('F7').value = `Responsibility Center Code : ${record.responsibilityCenterCode || '______________________'}`;
      worksheet.mergeCells('A8:E8'); worksheet.getCell('A8').value = 'Office : ________________________________________________';
      worksheet.mergeCells('F8:H8'); worksheet.getCell('F8').value = `RIS No. : ${record.risNo || '_____________________________________'}`;
      const applyBorders = (startRow: number, endRow: number, startCol: number, endCol: number) => { for (let r = startRow; r <= endRow; r++) { for (let c = startCol; c <= endCol; c++) worksheet.getCell(r, c).border = borderThin; } };
      applyBorders(10, 11, 1, 8);
      worksheet.mergeCells('A10:D10'); worksheet.getCell('A10').value = 'Requisition'; worksheet.mergeCells('E10:F10'); worksheet.getCell('E10').value = 'Stock Available?'; worksheet.mergeCells('G10:H10'); worksheet.getCell('G10').value = 'Issue';
      worksheet.getCell('A11').value = 'Stock No.'; worksheet.getCell('B11').value = 'Unit'; worksheet.getCell('C11').value = 'Description'; worksheet.getCell('D11').value = 'Quantity'; worksheet.getCell('E11').value = 'Yes'; worksheet.getCell('F11').value = 'No'; worksheet.getCell('G11').value = 'Quantity'; worksheet.getCell('H11').value = 'Remarks';
      for (let r = 10; r <= 11; r++) { for (let c = 1; c <= 8; c++) { const cell = worksheet.getCell(r, c); cell.font = { ...defaultFont, bold: true }; cell.alignment = centerMiddle; } }
      applyBorders(12, 31, 1, 8);
      for (let i = 0; i < 20; i++) {
        const r = 12 + i; const item = record.items[i];
        if (item) {
          worksheet.getCell(r, 1).value = item.stockNo || ''; worksheet.getCell(r, 2).value = item.unit || ''; worksheet.getCell(r, 3).value = item.description || ''; worksheet.getCell(r, 4).value = item.quantityRequested || ''; worksheet.getCell(r, 5).value = ''; worksheet.getCell(r, 6).value = ''; worksheet.getCell(r, 7).value = item.quantityIssued || ''; worksheet.getCell(r, 8).value = item.remarks || '';
        }
        worksheet.getCell(r, 1).alignment = centerMiddle; worksheet.getCell(r, 2).alignment = centerMiddle; worksheet.getCell(r, 3).alignment = leftMiddle; worksheet.getCell(r, 4).alignment = centerMiddle; worksheet.getCell(r, 5).alignment = centerMiddle; worksheet.getCell(r, 6).alignment = centerMiddle; worksheet.getCell(r, 7).alignment = centerMiddle; worksheet.getCell(r, 8).alignment = leftMiddle;
      }
      applyBorders(32, 34, 1, 8); worksheet.mergeCells('A32:H34'); const purposeCell = worksheet.getCell('A32'); purposeCell.value = '   Purpose: '; purposeCell.alignment = { vertical: 'top', horizontal: 'left' };
      applyBorders(35, 39, 1, 8);
      for (let r = 35; r <= 39; r++) { worksheet.mergeCells(`A${r}:B${r}`); worksheet.mergeCells(`D${r}:E${r}`); worksheet.mergeCells(`F${r}:G${r}`); }
      worksheet.getCell('A35').value = ''; worksheet.getCell('C35').value = 'Requested by:'; worksheet.getCell('D35').value = 'Approved by:'; worksheet.getCell('F35').value = 'Issued by:'; worksheet.getCell('H35').value = 'Received by:';
      const sigTopAlign: Partial<ExcelJS.Alignment> = { vertical: 'top', horizontal: 'left', indent: 1 };
      worksheet.getCell('C35').alignment = sigTopAlign; worksheet.getCell('D35').alignment = sigTopAlign; worksheet.getCell('F35').alignment = sigTopAlign; worksheet.getCell('H35').alignment = sigTopAlign;
      worksheet.getCell('A36').value = 'Signature:'; worksheet.getCell('A37').value = 'Printed Name:'; worksheet.getCell('A38').value = 'Designation:'; worksheet.getCell('A39').value = 'Date:';
      worksheet.getRow(36).height = 40; [36, 37, 38, 39].forEach((r) => { worksheet.getCell(`A${r}`).alignment = centerMiddle; });
      worksheet.getCell('C39').value = new Date(record.date).toLocaleDateString(); worksheet.getCell('C39').alignment = centerMiddle;
      worksheet.getCell('H41').value = '157'; worksheet.getCell('H41').font = { ...defaultFont, italic: true }; worksheet.getCell('H41').alignment = { horizontal: 'right' };
      const buffer = await workbook.xlsx.writeBuffer(); saveAs(new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), `RIS-${record.risNo || 'Export'}.xlsx`);
      toast.success('Excel file exported successfully');
    } catch (error: any) { toast.error('Failed to generate Excel file'); } finally { setIsDownloading(false); }
  }, []);

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100">
          <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
            <div>
              <CardTitle className="text-lg font-bold text-slate-900">Requisition and Issue Slip</CardTitle>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700 shadow-sm text-white" onClick={handleCreate}><Plus className="mr-2 h-4 w-4" /> Create RIS</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl border-slate-200 shadow-xl overflow-hidden p-0">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                  <DialogTitle className="text-xl">{editingId ? 'Edit RIS Record' : 'Create New RIS'}</DialogTitle>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="risNo">RIS Number</Label>
                      <Input id="risNo" value={formData.risNo} onChange={(e) => setFormData((prev) => ({ ...prev, risNo: e.target.value }))} placeholder="e.g., RIS-2026-001" required className="border-slate-200" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input id="date" type="date" value={formData.date} onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))} required className="border-slate-200" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="division">Division</Label>
                    <SearchableSelect value={formData.division} options={rccItems.map((rcc) => ({ value: rcc.divisionName, label: rcc.divisionName }))} onSelect={handleDivisionSelect} placeholder="Search division..." />
                  </div>

                  {formData.division && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900"><strong>RCC:</strong> {formData.responsibilityCenterCode}</p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Items</Label>
                      <Button type="button" size="sm" onClick={addItem} variant="outline" className="border-slate-200 shadow-sm"><Plus className="h-4 w-4 mr-1" />Add Item</Button>
                    </div>

                    {formData.items.map((item, index) => (
                      <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-3 bg-slate-50/50 relative">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-sm text-slate-800">Item {index + 1}</span>
                          {formData.items.length > 1 && (
                            <Button type="button" size="sm" variant="ghost" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 hover:bg-red-50 h-8">Remove</Button>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label>Stock Number / Description</Label>
                          <SearchableSelect value={item.stockNo} options={ssnItems.map((ssn) => ({ value: ssn.code, label: `${ssn.code} - ${ssn.description}` }))} onSelect={(value) => handleStockNoSelect(index, value)} placeholder="Search item..." />
                        </div>

                        {item.stockNo && (
                          <div className="p-2 bg-white border border-slate-100 rounded text-sm grid grid-cols-2 gap-2 shadow-sm text-slate-600">
                            <p><strong>Desc:</strong> {item.description}</p>
                            <p><strong>Unit:</strong> {item.unit}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Qty Requested</Label>
                            <Input type="number" placeholder="Enter Quantity" value={item.quantityRequested} onChange={(e) => updateItem(index, 'quantityRequested', e.target.value)} required className="border-slate-200" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Qty Issued</Label>
                            <Input type="number" placeholder="Enter Quantity" value={item.quantityIssued} onChange={(e) => updateItem(index, 'quantityIssued', e.target.value)} required className="border-slate-200" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Remarks</Label>
                            <Input value={item.remarks} onChange={(e) => updateItem(index, 'remarks', e.target.value)} placeholder="Optional Remarks" className="border-slate-200" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                    <Button type="button" variant="ghost" onClick={() => { setIsDialogOpen(false); resetForm(); }} className="text-slate-600">Cancel</Button>
                    <Button type="submit" className="bg-blue-600 hover:bg-blue-700 shadow-sm">{editingId ? 'Save Changes' : 'Create RIS'}</Button>
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
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">RIS No.</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Division</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">RCC</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Items</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {risRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                      <FileText className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                      <p>No RIS records found</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  risRecords.map((record) => (
                    <TableRow key={record.id} className="group hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium text-slate-900">{record.risNo}</TableCell>
                      <TableCell className="text-slate-600">{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-slate-700">{record.division}</TableCell>
                      <TableCell className="text-slate-600">{record.responsibilityCenterCode}</TableCell>
                      <TableCell className="font-medium text-slate-800">{record.items.length}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(record)} className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"><Edit className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => downloadRIS(record)} disabled={isDownloading} className="h-8 w-8 text-slate-500 hover:text-green-600 hover:bg-green-50"><Download className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(record.id, record.risNo)} className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={deleteConfirmation.isOpen} onOpenChange={handleCancelDelete}>
        <DialogContent className="sm:max-w-md border-slate-200 shadow-xl overflow-hidden p-0">
          <div className="p-6 border-b border-slate-100 bg-red-50/50">
            <DialogTitle className="text-xl text-red-700">Delete RIS Record</DialogTitle>
          </div>
          <div className="p-6 space-y-4 bg-white">
            <p className="text-sm text-slate-700">Are you sure you want to delete RIS record <strong className="text-slate-900">{deleteConfirmation.risNo}</strong>?</p>
            <div className="bg-red-50 border border-red-100 rounded-lg p-4 text-sm text-red-800">
              <strong className="block mb-2">Warning! This will:</strong>
              <ul className="list-disc list-inside space-y-1 ml-1 text-red-700/80">
                <li>Reverse the inventory stock deduction</li>
                <li>Remove the auto-generated distribution report (RSMI)</li>
                <li>Update the physical count report (RPCI)</li>
              </ul>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="ghost" onClick={handleCancelDelete} disabled={deleteConfirmation.isDeleting} className="text-slate-600">Cancel</Button>
              <Button variant="destructive" onClick={handleConfirmDelete} disabled={deleteConfirmation.isDeleting}>{deleteConfirmation.isDeleting ? 'Deleting...' : 'Delete Record'}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}