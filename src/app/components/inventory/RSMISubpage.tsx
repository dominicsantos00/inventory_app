import React, { useState, useEffect, useRef } from 'react';
import { useData } from '../../context/DataContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Plus, Download, FileText, Eye } from 'lucide-react';
import { RSMIRecord } from '../../types';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

// --- CUSTOM SEARCHABLE DROPDOWN COMPONENT ---
function SearchableSelect({
  value,
  options,
  onSelect,
  placeholder = 'Search...',
}: {
  value: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
  placeholder?: string;
}) {
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
  const filteredOptions = options.filter(
    (opt) =>
      (opt.label || '').toLowerCase().includes(safeSearch) ||
      (opt.value || '').toLowerCase().includes(safeSearch)
  );

  return (
    <div className="relative" ref={wrapperRef}>
      <Input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setIsOpen(true);
        }}
        onFocus={(e) => {
          setIsOpen(true);
          e.target.select();
        }}
        placeholder={placeholder}
        className="w-full bg-white"
      />

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt, i) => (
              <div
                key={i}
                className="px-3 py-2 text-sm cursor-pointer hover:bg-gray-100 transition-colors"
                onClick={() => {
                  onSelect(opt.value);
                  setIsOpen(false);
                }}
              >
                {opt.label}
              </div>
            ))
          ) : (
            <div className="px-3 py-2 text-sm text-gray-500">No results found.</div>
          )}
        </div>
      )}
    </div>
  );
}

// --- MAIN PAGE COMPONENT ---
export function RSMISubpage() {
  const { rsmiRecords, addRSMIRecord, updateRSMIRecord, deleteRSMIRecord, rccItems = [], deliveries = [] } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingRecord, setViewingRecord] = useState<RSMIRecord | null>(null);
  
  const emptyItem = { stockNo: '', description: '', unit: '', quantity: '' as any, unitCost: 0 as any, totalCost: 0, office: '' };

  const [formData, setFormData] = useState({
    reportNo: '',
    period: '',
    items: [{ ...emptyItem }],
  });

  const handleEdit = (record: RSMIRecord) => {
    setEditingId(record.id);
    
    let formattedDate = record.period;
    const d = new Date(record.period);
    if (!Number.isNaN(d.getTime())) {
      formattedDate = d.toISOString().split('T')[0];
    }

    setFormData({
      reportNo: record.reportNo,
      period: formattedDate,
      items: JSON.parse(JSON.stringify(record.items)), 
    });
    setIsDialogOpen(true);
  };
  
  // Suppress unused - Edit button removed from UI
  void handleEdit;

  const handleView = (record: RSMIRecord) => {
    setViewingRecord(record);
  };

  const handleDeleteRecord = async (id: string, reportNo: string) => {
    if (window.confirm(`Are you sure you want to delete RSMI Report No: ${reportNo}?`)) {
      try {
        if (deleteRSMIRecord) {
          await deleteRSMIRecord(id);
          toast.success(`RSMI ${reportNo} deleted successfully`);
        }
      } catch (error) {
        toast.error('Failed to delete RSMI record');
      }
    }
  };
  
  // Suppress unused - Delete button removed from UI
  void handleDeleteRecord;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanedData = {
        ...formData,
        items: formData.items.map(item => ({
            ...item,
            quantity: Number(item.quantity) || 0,
            unitCost: Number(item.unitCost) || 0,
            totalCost: Number(item.totalCost) || 0,
        }))
    };

    try {
      if (editingId) {
        await updateRSMIRecord(editingId, cleanedData as any);
        toast.success('RSMI record updated successfully');
      } else {
        await addRSMIRecord(cleanedData as any);
        toast.success('RSMI record created successfully');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error(editingId ? 'Failed to update record' : 'Failed to create record');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      reportNo: '',
      period: '',
      items: [{ ...emptyItem }],
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, { ...emptyItem }],
    });
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // When stock number is changed, auto-fetch data from delivery
    if (field === 'stockNo' && value) {
      const matchingDelivery = deliveries.find((d: any) => 
        d.item && d.item.toLowerCase() === value.toLowerCase()
      );
      
      if (matchingDelivery) {
        newItems[index].description = matchingDelivery.itemDescription || matchingDelivery.item || '';
        newItems[index].unit = matchingDelivery.unit || '';
        newItems[index].unitCost = Number(matchingDelivery.unitPrice) || 0;
      } else {
        newItems[index].unitCost = 0;
      }
    }
    
    // Always recalculate total cost when quantity or unitCost changes
    if (field === 'quantity' || field === 'stockNo' || field === 'unitCost') {
      const qty = parseFloat(newItems[index].quantity as unknown as string);
      const cost = Number(newItems[index].unitCost);
      
      if (!Number.isNaN(qty) && !Number.isNaN(cost) && qty >= 0 && cost >= 0) {
         newItems[index].totalCost = qty * cost;
      } else {
         newItems[index].totalCost = 0;
      }
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
      
      // STRICT PORTRAIT PAGE SETUP matching PDF requirements
      const worksheet = workbook.addWorksheet('RSMI Report', {
        pageSetup: {
          paperSize: 9, // A4 Paper Size
          orientation: 'portrait',
          fitToPage: true,
          fitToWidth: 1, 
          fitToHeight: 0, 
          horizontalCentered: true,
          margins: { left: 0.25, right: 0.25, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 }
        }
      });

      // EXACT 9-COLUMN GRID to accommodate Main Table & Dual Recapitulation blocks
      worksheet.columns = [
        { key: 'A', width: 10 }, // RIS No
        { key: 'B', width: 15 }, // RCC
        { key: 'C', width: 12 }, // Stock No
        { key: 'D', width: 25 }, // Item
        { key: 'E', width: 8 },  // Unit
        { key: 'F', width: 10 }, // Qty Issued
        { key: 'G', width: 12 }, // Unit Cost / Recap Unit Cost
        { key: 'H', width: 12 }, // Amount / Recap Total Cost
        { key: 'I', width: 15 }, // UACS Object Code (only in recap)
      ];

      const fontBase = { name: 'Arial', size: 10 };
      const fontBold = { name: 'Arial', size: 10, bold: true };
      const fontItalic = { name: 'Arial', size: 10, italic: true };
      const fontTitle = { name: 'Arial', size: 12, bold: true };

      const alignCenter: Partial<ExcelJS.Alignment> = { horizontal: 'center', vertical: 'middle', wrapText: true };
      const alignLeft: Partial<ExcelJS.Alignment> = { horizontal: 'left', vertical: 'middle', wrapText: true };
      const alignRight: Partial<ExcelJS.Alignment> = { horizontal: 'right', vertical: 'middle' };

      const setOuterBorder = (sheet: ExcelJS.Worksheet, startRow: number, endRow: number, startCol: number, endCol: number, style: ExcelJS.BorderStyle = 'thin') => {
        for(let r = startRow; r <= endRow; r++) {
          for(let c = startCol; c <= endCol; c++) {
            const cell = sheet.getCell(r, c);
            const border = cell.border ? { ...cell.border } : {};
            if (r === startRow) border.top = { style };
            if (r === endRow) border.bottom = { style };
            if (c === startCol) border.left = { style };
            if (c === endCol) border.right = { style };
            cell.border = border;
          }
        }
      };

      const setFullBorder = (sheet: ExcelJS.Worksheet, startRow: number, endRow: number, startCol: number, endCol: number, style: ExcelJS.BorderStyle = 'thin') => {
        for (let r = startRow; r <= endRow; r++) {
          for (let c = startCol; c <= endCol; c++) {
            sheet.getCell(r, c).border = { top: {style}, bottom: {style}, left: {style}, right: {style} };
          }
        }
      };

      // 1. EXACT HEADER REPLICATION
      worksheet.getCell('I2').value = 'Appendix 64';
      worksheet.getCell('I2').font = { ...fontBold, italic: true };
      worksheet.getCell('I2').alignment = alignRight;

      worksheet.mergeCells('A4:D4');
      worksheet.getCell('A4').value = 'Entity Name: ____________________________';
      worksheet.getCell('A4').font = fontBold;

      worksheet.mergeCells('G4:I4');
      worksheet.getCell('G4').value = `Serial No. : ${record.reportNo || '___________________'}`;
      worksheet.getCell('G4').font = fontBold;

      worksheet.mergeCells('A5:D5');
      worksheet.getCell('A5').value = 'Fund Cluster: ____________________________';
      worksheet.getCell('A5').font = fontBold;

      worksheet.mergeCells('G5:I5');
      let displayDate = record.period;
      const d = new Date(record.period);
      if (!Number.isNaN(d.getTime())) displayDate = d.toLocaleDateString();
      worksheet.getCell('G5').value = `Date : ${displayDate || '___________________'}`;
      worksheet.getCell('G5').font = fontBold;

      // TITLE
      worksheet.mergeCells('A7:I7');
      worksheet.getCell('A7').value = 'REPORT OF SUPPLIES AND MATERIALS ISSUED';
      worksheet.getCell('A7').font = fontTitle;
      worksheet.getCell('A7').alignment = alignCenter;

      // 2. MAIN FORM STRUCTURE - GROUPED HEADERS
      worksheet.mergeCells('A9:F9');
      worksheet.getCell('A9').value = 'To be filled up by the Supply and/or Property Division/Unit';
      worksheet.getCell('A9').font = fontItalic;
      worksheet.getCell('A9').alignment = alignCenter;

      worksheet.mergeCells('G9:I9');
      worksheet.getCell('G9').value = 'To be filled up by the Accounting Division/Unit';
      worksheet.getCell('G9').font = fontItalic;
      worksheet.getCell('G9').alignment = alignCenter;

      // Column Headers
      ['A', 'B', 'C', 'D', 'E', 'F', 'G'].forEach(col => {
        worksheet.mergeCells(`${col}10:${col}11`);
        worksheet.getCell(`${col}10`).font = fontBold;
        worksheet.getCell(`${col}10`).alignment = alignCenter;
      });
      worksheet.mergeCells('H10:I11'); // Merge H & I for Amount in main table
      worksheet.getCell('H10').font = fontBold;
      worksheet.getCell('H10').alignment = alignCenter;

      worksheet.getCell('A10').value = 'RIS No.';
      worksheet.getCell('B10').value = 'Responsibility\nCenter Code';
      worksheet.getCell('C10').value = 'Stock No.';
      worksheet.getCell('D10').value = 'Item';
      worksheet.getCell('E10').value = 'Unit';
      worksheet.getCell('F10').value = 'Quantity\nIssued';
      worksheet.getCell('G10').value = 'Unit Cost';
      worksheet.getCell('H10').value = 'Amount';

      setFullBorder(worksheet, 9, 11, 1, 9);

      // DATA MAPPING (Main Table)
      let currentRow = 12;
      const minRows = 15; // Maintain a good printed form size
      const totalRows = Math.max(minRows, record.items.length);

      for (let i = 0; i < totalRows; i++) {
        const item = record.items[i];
        
        worksheet.mergeCells(`H${currentRow}:I${currentRow}`); // keep Amount merged

        if (item) {
          worksheet.getCell(`A${currentRow}`).value = ''; // Usually blank per item
          worksheet.getCell(`B${currentRow}`).value = item.office || '';
          worksheet.getCell(`C${currentRow}`).value = item.stockNo || '';
          worksheet.getCell(`D${currentRow}`).value = item.description || '';
          worksheet.getCell(`E${currentRow}`).value = item.unit || '';
          worksheet.getCell(`F${currentRow}`).value = item.quantity || '';
          worksheet.getCell(`G${currentRow}`).value = item.unitCost ? Number(item.unitCost) : '';
          worksheet.getCell(`G${currentRow}`).numFmt = '#,##0.00';
          worksheet.getCell(`H${currentRow}`).value = item.totalCost ? Number(item.totalCost) : '';
          worksheet.getCell(`H${currentRow}`).numFmt = '#,##0.00';
        }

        for (let c = 1; c <= 9; c++) {
          const cell = worksheet.getCell(currentRow, c);
          cell.font = fontBase;
          cell.border = { top: {style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} };
          
          if (c === 4) cell.alignment = alignLeft;
          else if (c === 7 || c === 8) cell.alignment = alignRight;
          else cell.alignment = alignCenter;
        }
        currentRow++;
      }

      // 3. RECAPITULATION SECTION (Exactly 2 Blocks like PDF)
      const recapStart = currentRow;

      worksheet.mergeCells(`A${recapStart}:F${recapStart}`);
      worksheet.getCell(`A${recapStart}`).value = 'Recapitulation';
      worksheet.getCell(`A${recapStart}`).font = fontBold;
      worksheet.getCell(`A${recapStart}`).alignment = alignCenter;

      worksheet.mergeCells(`G${recapStart}:I${recapStart}`);
      worksheet.getCell(`G${recapStart}`).value = 'Recapitulation';
      worksheet.getCell(`G${recapStart}`).font = fontBold;
      worksheet.getCell(`G${recapStart}`).alignment = alignCenter;

      const recapHeaderRow = recapStart + 1;
      
      // Left Recap Headers
      worksheet.mergeCells(`A${recapHeaderRow}:D${recapHeaderRow}`);
      worksheet.getCell(`A${recapHeaderRow}`).value = 'Stock No.';
      worksheet.mergeCells(`E${recapHeaderRow}:F${recapHeaderRow}`);
      worksheet.getCell(`E${recapHeaderRow}`).value = 'Quantity';
      
      // Right Recap Headers
      worksheet.getCell(`G${recapHeaderRow}`).value = 'Unit Cost';
      worksheet.getCell(`H${recapHeaderRow}`).value = 'Total Cost';
      worksheet.getCell(`I${recapHeaderRow}`).value = 'UACS Object Code';

      for (let c = 1; c <= 9; c++) {
        worksheet.getCell(recapStart, c).border = { top: {style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} };
        worksheet.getCell(recapHeaderRow, c).border = { top: {style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} };
        worksheet.getCell(recapHeaderRow, c).font = fontBold;
        worksheet.getCell(recapHeaderRow, c).alignment = alignCenter;
      }

      currentRow = recapHeaderRow + 1;

      // Recap Data Mapping
      const recapRows = Math.max(5, record.items.length); // At least 5 empty rows for recap block
      for (let i = 0; i < recapRows; i++) {
        const item = record.items[i];

        worksheet.mergeCells(`A${currentRow}:D${currentRow}`);
        worksheet.mergeCells(`E${currentRow}:F${currentRow}`);

        if (item) {
          worksheet.getCell(`A${currentRow}`).value = item.stockNo || '';
          worksheet.getCell(`E${currentRow}`).value = item.quantity || '';
          worksheet.getCell(`G${currentRow}`).value = item.unitCost ? Number(item.unitCost) : '';
          worksheet.getCell(`G${currentRow}`).numFmt = '#,##0.00';
          worksheet.getCell(`H${currentRow}`).value = item.totalCost ? Number(item.totalCost) : '';
          worksheet.getCell(`H${currentRow}`).numFmt = '#,##0.00';
          worksheet.getCell(`I${currentRow}`).value = ''; // UACS usually blank/manual
        }

        for (let c = 1; c <= 9; c++) {
          const cell = worksheet.getCell(currentRow, c);
          cell.font = fontBase;
          cell.border = { top: {style:'thin'}, bottom:{style:'thin'}, left:{style:'thin'}, right:{style:'thin'} };
          if (c === 7 || c === 8) cell.alignment = alignRight;
          else cell.alignment = alignCenter;
        }
        currentRow++;
      }

      // 4. CERTIFICATION / SIGNATURE SECTION
      const sigStart = currentRow;
      
      worksheet.mergeCells(`A${sigStart}:F${sigStart}`);
      worksheet.getCell(`A${sigStart}`).value = 'I hereby certify to the correctness of the above information.';
      worksheet.getCell(`A${sigStart}`).font = fontBase;
      worksheet.getCell(`A${sigStart}`).alignment = { horizontal: 'left', vertical: 'top', indent: 1 };

      worksheet.mergeCells(`G${sigStart}:I${sigStart}`);
      worksheet.getCell(`G${sigStart}`).value = 'Posted by:';
      worksheet.getCell(`G${sigStart}`).font = fontBase;
      worksheet.getCell(`G${sigStart}`).alignment = { horizontal: 'left', vertical: 'top', indent: 1 };

      // Spacing for signatures
      worksheet.getRow(sigStart).height = 20;
      worksheet.getRow(sigStart + 1).height = 20;
      worksheet.getRow(sigStart + 2).height = 20;

      // Signature Lines
      worksheet.mergeCells(`A${sigStart+3}:F${sigStart+3}`);
      worksheet.getCell(`A${sigStart+3}`).value = '__________________________________________________';
      worksheet.getCell(`A${sigStart+3}`).alignment = { horizontal: 'center', vertical: 'bottom' };

      worksheet.mergeCells(`G${sigStart+3}:I${sigStart+3}`);
      worksheet.getCell(`G${sigStart+3}`).value = '_______________________________________';
      worksheet.getCell(`G${sigStart+3}`).alignment = { horizontal: 'center', vertical: 'bottom' };

      // Signature Titles
      worksheet.mergeCells(`A${sigStart+4}:F${sigStart+4}`);
      worksheet.getCell(`A${sigStart+4}`).value = 'Signature over Printed Name of Supply and/or Property Custodian';
      worksheet.getCell(`A${sigStart+4}`).font = fontBase;
      worksheet.getCell(`A${sigStart+4}`).alignment = { horizontal: 'center', vertical: 'top' };

      worksheet.mergeCells(`G${sigStart+4}:I${sigStart+4}`);
      worksheet.getCell(`G${sigStart+4}`).value = 'Signature over Printed Name of Designated Accounting Staff';
      worksheet.getCell(`G${sigStart+4}`).font = fontBase;
      worksheet.getCell(`G${sigStart+4}`).alignment = { horizontal: 'center', vertical: 'top', wrapText: true };

      // Date Bottom
      worksheet.mergeCells(`A${sigStart+6}:F${sigStart+6}`);
      worksheet.getCell(`A${sigStart+6}`).value = 'Date';
      worksheet.getCell(`A${sigStart+6}`).font = fontBase;
      worksheet.getCell(`A${sigStart+6}`).alignment = { horizontal: 'center', vertical: 'top' };

      worksheet.mergeCells(`G${sigStart+6}:I${sigStart+6}`);
      worksheet.getCell(`G${sigStart+6}`).value = 'Date';
      worksheet.getCell(`G${sigStart+6}`).font = fontBase;
      worksheet.getCell(`G${sigStart+6}`).alignment = { horizontal: 'center', vertical: 'top' };

      // Draw strict outer borders for the two distinct signature boxes
      setOuterBorder(worksheet, sigStart, sigStart+6, 1, 6, 'thin'); // Supply Box
      setOuterBorder(worksheet, sigStart, sigStart+6, 7, 9, 'thin'); // Accounting Box

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `RSMI-${record.reportNo || 'Report'}.xlsx`);

      toast.success('Excel file generated successfully!');
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to generate Excel file');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCreate = () => {
    setEditingId(null);
    setFormData({
      reportNo: '',
      period: '',
      items: [{ ...emptyItem }],
    });
    setIsDialogOpen(true);
  };
  
  // Suppress unused - Create button removed from UI
  void handleCreate;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Report of Supplies and Materials Issued (RSMI)</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Create and manage RSMI records. Reports can be auto-generated from approved RIS or manually created with custom report numbers.</p>
            </div>
            
            {/* Dialog for Creating and Editing */}
            <Dialog open={isDialogOpen} onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (!open) resetForm();
            }}>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Edit RSMI Record' : 'Create New RSMI Report'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="reportNo">Report Number</Label>
                      <Input
                        id="reportNo"
                        value={formData.reportNo}
                        onChange={(e) => setFormData({ ...formData, reportNo: e.target.value })}
                        placeholder="e.g., RSMI-2026-Q1"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="period">Period</Label>
                      <Input
                        id="period"
                        type="date"
                        value={formData.period}
                        onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Items Issued</Label>
                      <Button type="button" size="sm" onClick={addItem} variant="outline">
                        <Plus className="h-4 w-4 mr-1" />
                        Add Item
                      </Button>
                    </div>

                    {formData.items.map((item, index) => (
                      <div key={index} className="p-4 border rounded-lg space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Item {index + 1}</span>
                          {formData.items.length > 1 && (
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => removeItem(index)}
                              className="text-red-600"
                            >
                              Remove
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Stock No. - Select from Delivery</Label>
                            <SearchableSelect
                              value={item.stockNo}
                              options={deliveries.map((d: any) => ({
                                value: d.item || '',
                                label: `${d.item || ''} - ${d.itemDescription || d.item || ''}`,
                              }))}
                              onSelect={(value) => updateItem(index, 'stockNo', value)}
                              placeholder="Search stock number..."
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Description (Auto-populated)</Label>
                            <Input
                              placeholder="Auto-filled from Delivery"
                              value={item.description}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Unit (Auto-populated)</Label>
                            <Input
                              placeholder="Auto-filled from Delivery"
                              value={item.unit}
                              disabled
                              className="bg-gray-50"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Quantity</Label>
                            <Input
                              type="number"
                              placeholder="Enter Qty"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                              required
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Unit Cost (₱) - From Delivery</Label>
                            <div className="flex items-center px-3 py-2 bg-gray-100 rounded-md h-10">
                              <span className="text-sm font-medium">₱{(Number(item.unitCost) || 0).toFixed(2)}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Total Cost</Label>
                            <div className="flex items-center px-3 py-2 bg-gray-100 rounded-md h-10">
                              <span className="text-sm font-medium">₱{Number(item.totalCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-xs">Division (RCC)</Label>
                            <SearchableSelect
                              value={item.office}
                              options={rccItems.map((rcc) => ({
                                value: rcc.divisionName,
                                label: rcc.divisionName,
                              }))}
                              onSelect={(value) => updateItem(index, 'office', value)}
                              placeholder="Select Division..."
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-semibold text-green-900">
                      Grand Total: ₱{Number(formData.items.reduce((sum, item) => sum + Number(item.totalCost), 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                      {editingId ? 'Update RSMI' : 'Create RSMI'}
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsDialogOpen(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Items Count</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rsmiRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No RSMI records yet. Approve an RIS to generate.</p>
                  </TableCell>
                </TableRow>
              ) : (
                rsmiRecords.map((record) => {
                  const total = Number(record.items.reduce((sum, item) => sum + Number(item.totalCost), 0));
                  
                  let tableDateDisplay = record.period;
                  const d = new Date(record.period);
                  if (!Number.isNaN(d.getTime())) {
                    tableDateDisplay = d.toLocaleDateString();
                  }

                  return (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.reportNo}</TableCell>
                      <TableCell>{tableDateDisplay}</TableCell>
                      <TableCell>{record.items.length}</TableCell>
                      <TableCell>₱{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleView(record)}>
                            <Eye className="w-4 h-4 mr-1" /> View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadRSMI(record)}
                            disabled={isDownloading}
                          >
                            <Download className="h-4 w-4 mr-1" />
                            {isDownloading ? 'Exporting...' : 'Export'}
                          </Button>
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
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>View RSMI Record</DialogTitle>
          </DialogHeader>
          {viewingRecord && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-gray-700">Report No.</label>
                  <p className="text-gray-900">{viewingRecord.reportNo}</p>
                </div>
                <div>
                  <label className="text-sm font-semibold text-gray-700">Date</label>
                  <p className="text-gray-900">{new Date(viewingRecord.period).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <label className="text-sm font-semibold text-gray-700">Items</label>
                <table className="w-full mt-2">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 text-sm">Stock No.</th>
                      <th className="text-left py-2 px-2 text-sm">Description</th>
                      <th className="text-left py-2 px-2 text-sm">Unit</th>
                      <th className="text-right py-2 px-2 text-sm">Quantity</th>
                      <th className="text-right py-2 px-2 text-sm">Unit Cost</th>
                      <th className="text-right py-2 px-2 text-sm">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {viewingRecord.items.map((item, idx) => (
                      <tr key={idx} className="border-b">
                        <td className="py-2 px-2 text-sm">{item.stockNo}</td>
                        <td className="py-2 px-2 text-sm">{item.description}</td>
                        <td className="py-2 px-2 text-sm">{item.unit}</td>
                        <td className="py-2 px-2 text-sm text-right">{item.quantity}</td>
                        <td className="py-2 px-2 text-sm text-right">₱{Number(item.unitCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                        <td className="py-2 px-2 text-sm text-right">₱{Number(item.totalCost).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border-t pt-4">
                <p className="text-sm font-semibold text-green-900">
                  Grand Total: ₱{Number(viewingRecord.items.reduce((sum, item) => sum + Number(item.totalCost), 0)).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setViewingRecord(null)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}