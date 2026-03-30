import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Plus, Download, FileText, Trash2, Edit } from 'lucide-react';
import { IARRecord } from '../../types';
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
export function IARSubpage() {
  const { 
    iarRecords, 
    addIARRecord, 
    updateIARRecord, 
    deleteIARRecord, 
    deliveries = [], 
    rccItems = [], 
    ssnItems = [] 
  } = useData();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const emptyItem = { stockNo: '', description: '', unit: '', quantity: '' as any, unitCost: '' as any, totalCost: 0 };

  const [formData, setFormData] = useState({
    iarNo: '',
    poNumber: '',
    supplier: '',
    poDate: '',
    invoiceNo: '',
    requisitioningOffice: '',
    responsibilityCenterCode: '',
    date: '',
    items: [{ ...emptyItem }],
  });

  const safeDisplayDate = (value?: string) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString();
  };

  const formatExcelDate = (value?: string) => {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const handleEdit = useCallback((record: IARRecord) => {
    setEditingId(record.id);
    let formattedDate = '';
    if (record.date) {
      const d = new Date(record.date);
      if (!Number.isNaN(d.getTime())) {
        formattedDate = d.toISOString().split('T')[0];
      }
    }

    setFormData({
      iarNo: record.iarNo,
      poNumber: record.poNumber,
      supplier: record.supplier,
      poDate: record.poDate,
      invoiceNo: record.invoiceNo,
      requisitioningOffice: record.requisitioningOffice,
      responsibilityCenterCode: record.responsibilityCenterCode,
      date: formattedDate,
      items: JSON.parse(JSON.stringify(record.items)), 
    });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string, iarNo: string) => {
    if (window.confirm(`Are you sure you want to delete IAR No: ${iarNo}?`)) {
      try {
        if (deleteIARRecord) {
          await deleteIARRecord(id);
          toast.success(`IAR ${iarNo} deleted successfully`);
        } else {
          toast.error('Please add deleteIARRecord to your DataContext!');
        }
      } catch (error) {
        console.error(error);
        toast.error('Failed to delete IAR record');
      }
    }
  }, [deleteIARRecord]);

  const handlePOSelect = (poNumber: string) => {
    const delivery = deliveries.find((d) => d.poNumber === poNumber);
    if (delivery) {
      setFormData((prev) => ({
        ...prev,
        poNumber: delivery.poNumber,
        supplier: delivery.supplier,
        poDate: delivery.poDate,
      }));
    } else {
      setFormData((prev) => ({ ...prev, poNumber }));
    }
  };

  const handleOfficeSelect = (officeName: string) => {
    const rcc = rccItems.find((r) => r.divisionName === officeName);
    if (rcc) {
      setFormData((prev) => ({
        ...prev,
        requisitioningOffice: officeName,
        responsibilityCenterCode: rcc.code,
      }));
    } else {
      setFormData((prev) => ({ ...prev, requisitioningOffice: officeName }));
    }
  };

  const handleStockNoSelect = useCallback(
    (index: number, stockNo: string) => {
      const ssn = ssnItems.find((s) => s.code === stockNo);
      if (!ssn) return;

      setFormData((prev) => {
        const newItems = [...prev.items];
        newItems[index] = {
          ...newItems[index],
          stockNo: ssn.code,
          description: ssn.description,
          unit: ssn.unit,
        };
        return { ...prev, items: newItems };
      });
    },
    [ssnItems]
  );

  const addItem = () => {
    setFormData((prev) => ({
      ...prev,
      items: [...prev.items, { ...emptyItem }],
    }));
  };

  const updateItem = (
    index: number,
    field: 'stockNo' | 'description' | 'unit' | 'quantity' | 'unitCost',
    value: string | number
  ) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };

    if (field === 'quantity' || field === 'unitCost') {
      const quantity = parseFloat(newItems[index].quantity as unknown as string);
      const unitCost = parseFloat(newItems[index].unitCost as unknown as string);
      
      if (!Number.isNaN(quantity) && !Number.isNaN(unitCost)) {
         newItems[index].totalCost = quantity * unitCost;
      } else {
         newItems[index].totalCost = 0;
      }
    }

    setFormData((prev) => ({ ...prev, items: newItems }));
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData((prev) => ({
      ...prev,
      items: newItems.length ? newItems : [{ ...emptyItem }],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const cleanedData = {
        ...formData,
        items: formData.items.map(item => ({
            ...item,
            quantity: Number(item.quantity) || 0,
            unitCost: Number(item.unitCost) || 0,
        }))
    };

    try {
      if (editingId) {
        await updateIARRecord(editingId, cleanedData as any);
        toast.success('IAR record updated successfully');
      } else {
        await addIARRecord(cleanedData as any);
        toast.success('IAR record created successfully');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error(editingId ? 'Failed to update record' : 'Failed to create record');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      iarNo: '',
      poNumber: '',
      supplier: '',
      poDate: '',
      invoiceNo: '',
      requisitioningOffice: '',
      responsibilityCenterCode: '',
      date: '',
      items: [{ ...emptyItem }],
    });
  };

  const downloadIAR = async (record: IARRecord) => {
    try {
      setIsDownloading(true);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Inventory Management System';
      const sheet = workbook.addWorksheet('IAR', {
        pageSetup: {
          paperSize: 9, // A4
          orientation: 'portrait', // Strictly portrait as per PDF
          fitToPage: true,
          fitToWidth: 1,
          fitToHeight: 0,
          horizontalCentered: true,
          margins: {
            left: 0.35, right: 0.35, top: 0.4, bottom: 0.4, header: 0.2, footer: 0.2,
          },
          printArea: 'A1:H37',
        },
        views: [{ showGridLines: false }],
      });

      sheet.properties.defaultRowHeight = 19;

      // Maintain precise column widths to hit exact page bounds
      sheet.columns = [
        { width: 16 }, { width: 10 }, { width: 18 }, { width: 18 }, 
        { width: 18 }, { width: 18 }, { width: 12 }, { width: 16 },
      ];

      const thin = 'thin' as const;
      const medium = 'medium' as const;

      const fontBase: Partial<ExcelJS.Font> = { name: 'Times New Roman', size: 11 };
      const fontItalic: Partial<ExcelJS.Font> = { name: 'Times New Roman', size: 10, italic: true };
      const fontBold: Partial<ExcelJS.Font> = { name: 'Times New Roman', size: 11, bold: true };
      const fontTitle: Partial<ExcelJS.Font> = { name: 'Times New Roman', size: 13, bold: true };

      const alignCenter: Partial<ExcelJS.Alignment> = { horizontal: 'center', vertical: 'middle' };
      const alignLeft: Partial<ExcelJS.Alignment> = { horizontal: 'left', vertical: 'middle' };
      const alignWrapCenter: Partial<ExcelJS.Alignment> = { horizontal: 'center', vertical: 'middle', wrapText: true };
      const alignWrapLeft: Partial<ExcelJS.Alignment> = { horizontal: 'left', vertical: 'middle', wrapText: true };

      const getCell = (ref: string) => sheet.getCell(ref);

      const mergeValue = (
        range: string, value: string, font: Partial<ExcelJS.Font> = fontBase, alignment: Partial<ExcelJS.Alignment> = alignLeft
      ) => {
        sheet.mergeCells(range);
        const startCell = sheet.getCell(range.split(':')[0]);
        startCell.value = value;
        startCell.font = font;
        startCell.alignment = alignment;
        return startCell;
      };

      const setOuterBorder = (fromRow: number, fromCol: number, toRow: number, toCol: number, style: 'thin' | 'medium' = 'thin') => {
        for (let row = fromRow; row <= toRow; row++) {
          for (let col = fromCol; col <= toCol; col++) {
            const cell = sheet.getRow(row).getCell(col);
            const border: Partial<ExcelJS.Borders> = {};
            if (row === fromRow) border.top = { style };
            if (row === toRow) border.bottom = { style };
            if (col === fromCol) border.left = { style };
            if (col === toCol) border.right = { style };
            cell.border = { ...cell.border, ...border };
          }
        }
      };

      const setFullBorder = (fromRow: number, fromCol: number, toRow: number, toCol: number, style: 'thin' | 'medium' = 'thin') => {
        for (let row = fromRow; row <= toRow; row++) {
          for (let col = fromCol; col <= toCol; col++) {
            sheet.getRow(row).getCell(col).border = {
              top: { style }, bottom: { style }, left: { style }, right: { style },
            };
          }
        }
      };

      const setRowHeightRange = (start: number, end: number, height: number) => {
        for (let i = start; i <= end; i++) {
          sheet.getRow(i).height = height;
        }
      };

      const writeLabelValue = (cellRef: string, label: string, value: string) => {
        const cell = getCell(cellRef);
        cell.value = `${label} ${value}`;
        cell.font = fontBase;
        cell.alignment = alignLeft;
      };

      // Set explicit heights to match PDF proportions
      setRowHeightRange(1, 37, 18);
      sheet.getRow(3).height = 24;
      sheet.getRow(12).height = 32;
      for (let r = 13; r <= 27; r++) sheet.getRow(r).height = 26;
      sheet.getRow(30).height = 24;
      sheet.getRow(33).height = 30; // Gap for signatures

      // Page Header mapping
      mergeValue('G1:H1', 'Appendix 62', fontItalic, { horizontal: 'right', vertical: 'middle' });
      mergeValue('A3:H3', 'INSPECTION AND ACCEPTANCE REPORT', fontTitle, alignCenter);
      mergeValue('A5:D5', 'Entity Name :', fontBold, alignLeft);
      mergeValue('E5:H5', 'Fund Cluster :', fontBold, alignLeft);

      // Info Block Mapping (Rows 7-10)
      sheet.mergeCells('A7:D7'); sheet.mergeCells('E7:H7');
      sheet.mergeCells('A8:D8'); sheet.mergeCells('E8:H8');
      sheet.mergeCells('A9:D9'); sheet.mergeCells('E9:H9');
      sheet.mergeCells('A10:D10'); sheet.mergeCells('E10:H10');

      writeLabelValue('A7', ' Supplier:', record.supplier || '');
      writeLabelValue('E7', ' IAR No.:', record.iarNo || '');
      writeLabelValue('A8', ' PO No./Date:', `${record.poNumber || ''}${record.poDate ? ` / ${formatExcelDate(record.poDate)}` : ''}`);
      writeLabelValue('E8', ' Date:', formatExcelDate(record.date));
      writeLabelValue('A9', ' Requisitioning Office/Dept.:', record.requisitioningOffice || '');
      writeLabelValue('E9', ' Invoice No.:', record.invoiceNo || '');
      writeLabelValue('A10', ' Responsibility Center Code:', record.responsibilityCenterCode || '');
      writeLabelValue('E10', ' Date:', ''); // Invoice Date usually blank or pulled from specific data

      // Apply borders to the specific Info Block to match exact PDF look
      for (let r = 7; r <= 10; r++) {
        setOuterBorder(r, 1, r, 4, thin);
        setOuterBorder(r, 5, r, 8, thin);
      }

      // Main Form Table Headers
      getCell('A12').value = 'Stock/\nProperty No.';
      getCell('B12').value = 'Unit';
      sheet.mergeCells('C12:F12');
      getCell('C12').value = 'Description';
      sheet.mergeCells('G12:H12'); // Quantity merged to match strictly 4 logical columns
      getCell('G12').value = 'Quantity';

      ['A12', 'B12', 'C12', 'G12'].forEach((ref) => {
        getCell(ref).font = fontBold;
        getCell(ref).alignment = alignWrapCenter;
      });

      setFullBorder(12, 1, 12, 8, thin);

      // Main Form Table Body
      const visibleRows = 15;
      for (let i = 0; i < visibleRows; i++) {
        const row = 13 + i;
        const item = record.items[i];

        sheet.mergeCells(`C${row}:F${row}`);
        sheet.mergeCells(`G${row}:H${row}`);

        getCell(`A${row}`).value = item?.stockNo || '';
        getCell(`B${row}`).value = item?.unit || '';
        getCell(`C${row}`).value = item?.description || '';
        getCell(`G${row}`).value = item && item.quantity !== undefined && item.quantity !== null ? item.quantity : '';

        ['A', 'B', 'C', 'G'].forEach(col => {
          getCell(`${col}${row}`).font = fontBase;
          getCell(`${col}${row}`).alignment = alignCenter;
        });
        getCell(`C${row}`).alignment = alignWrapLeft;

        setFullBorder(row, 1, row, 8, thin);
      }

      // Checkbox and Signature Sections (Rows 29 - 35)
      mergeValue('A29:D29', 'INSPECTION', { ...fontBold, italic: true }, alignCenter);
      mergeValue('E29:H29', 'ACCEPTANCE', { ...fontBold, italic: true }, alignCenter);

      mergeValue('A30:D30', ' Date Inspected: ___________________', fontBase, alignLeft);
      mergeValue('E30:H30', ' Date Received: ____________________', fontBase, alignLeft);

      // Literal PDF checkboxes
      mergeValue('A31:D31', ' ☐ Inspected, verified and found in order as to', fontBase, alignLeft);
      mergeValue('E31:H31', ' ☐ Complete', fontBase, alignLeft);

      mergeValue('A32:D32', '      quantity and specifications', fontBase, alignLeft);
      mergeValue('E32:H32', ' ☐ Partial (pls. specify quantity)', fontBase, alignLeft);

      // Blank row 33 for signature padding
      sheet.mergeCells('A33:D33'); sheet.mergeCells('E33:H33');

      mergeValue('A34:D34', '________________________________________', fontBase, alignCenter);
      mergeValue('E34:H34', '________________________________________', fontBase, alignCenter);

      mergeValue('A35:D35', 'Inspection Officer/Inspection Committee', fontBase, alignCenter);
      mergeValue('E35:H35', 'Supply and/or Property Custodian', fontBase, alignCenter);

      // Form Section Borders
      setOuterBorder(29, 1, 35, 4, thin);
      setOuterBorder(29, 5, 35, 8, thin);

      // Draw horizontal line explicitly under row 29
      for (let col = 1; col <= 8; col++) {
        sheet.getRow(29).getCell(col).border = { ...sheet.getRow(29).getCell(col).border, bottom: { style: thin } };
      }

      // Main Table thick boundary
      setOuterBorder(12, 1, 27, 8, medium);
      for (let col = 1; col <= 8; col++) {
        sheet.getRow(12).getCell(col).border = {
          ...sheet.getRow(12).getCell(col).border, top: { style: medium }, bottom: { style: medium },
        };
      }

      // Base font safety sweep
      for (let row = 1; row <= 37; row++) {
        for (let col = 1; col <= 8; col++) {
          const cell = sheet.getRow(row).getCell(col);
          if (!cell.font) cell.font = fontBase;
        }
      }

      // Add PDF Page reference at bottom to strictly comply with provided source
      getCell('H37').value = '155';
      getCell('H37').alignment = { horizontal: 'right' };

      const fileName = `IAR-${record.iarNo || 'record'}.xlsx`;
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, fileName);
      toast.success('IAR Excel exported successfully');
    } catch (error) {
      console.error(error);
      toast.error('Failed to export IAR');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Inspection and Acceptance Report (IAR)</CardTitle>
              <p className="text-sm text-gray-600 mt-1">Generate and manage IAR records</p>
            </div>

            <Dialog
              open={isDialogOpen}
              onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) resetForm();
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-green-600 hover:bg-green-700">
                  <Plus className="mr-2 h-4 w-4" />
                  Create IAR
                </Button>
              </DialogTrigger>

              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Edit IAR Record' : 'Create New IAR'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="iarNo">IAR Number</Label>
                      <Input
                        id="iarNo"
                        value={formData.iarNo}
                        onChange={(e) => setFormData({ ...formData, iarNo: e.target.value })}
                        placeholder="e.g., IAR-2026-001"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date">Date</Label>
                      <Input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="poNumber">PO Number</Label>
                    <SearchableSelect
                      value={formData.poNumber}
                      options={deliveries.map((d) => ({
                        value: d.poNumber,
                        label: `${d.poNumber} - ${d.supplier}`,
                      }))}
                      onSelect={handlePOSelect}
                      placeholder="Type to search PO Number..."
                    />
                  </div>

                  {formData.poNumber && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg grid grid-cols-2 gap-2">
                      <p className="text-sm text-blue-900">
                        <strong>Supplier:</strong> {formData.supplier}
                      </p>
                      <p className="text-sm text-blue-900">
                        <strong>PO Date:</strong> {safeDisplayDate(formData.poDate)}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="invoiceNo">Invoice Number</Label>
                    <Input
                      id="invoiceNo"
                      value={formData.invoiceNo}
                      onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                      placeholder="Enter Invoice Number"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="requisitioningOffice">Requisitioning Office</Label>
                    <SearchableSelect
                      value={formData.requisitioningOffice}
                      options={rccItems.map((rcc) => ({
                        value: rcc.divisionName,
                        label: rcc.divisionName,
                      }))}
                      onSelect={handleOfficeSelect}
                      placeholder="Type to search Office..."
                    />
                  </div>

                  {formData.requisitioningOffice && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm text-blue-900">
                        <strong>Responsibility Center Code:</strong>{' '}
                        {formData.responsibilityCenterCode}
                      </p>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <Label>Items</Label>
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

                        <div className="space-y-2">
                          <Label className="text-xs">Stock Number / Description</Label>
                          <SearchableSelect
                            value={item.stockNo}
                            options={ssnItems.map((ssn) => ({
                              value: ssn.code,
                              label: `${ssn.code} - ${ssn.description}`,
                            }))}
                            onSelect={(value) => handleStockNoSelect(index, value)}
                            placeholder="Type to search item..."
                          />
                        </div>

                        {item.stockNo && (
                          <div className="p-2 bg-gray-50 rounded text-sm grid grid-cols-2 gap-2">
                            <p><strong>Description:</strong> {item.description}</p>
                            <p><strong>Unit:</strong> {item.unit}</p>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-3">
                          <div className="space-y-1">
                            <Label className="text-xs">Quantity</Label>
                            <Input
                              type="number"
                              placeholder="Enter Quantity"
                              value={item.quantity}
                              onChange={(e) => updateItem(index, 'quantity', e.target.value)}
                              required
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-xs">Unit Cost (₱)</Label>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Enter Unit Cost"
                              value={item.unitCost}
                              onChange={(e) => updateItem(index, 'unitCost', e.target.value)}
                              required
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <Label className="text-xs">Total Cost</Label>
                            <div className="flex items-center px-3 py-2 bg-gray-100 rounded-md h-10">
                              <span className="text-sm font-medium">
                                ₱{Number(item.totalCost).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-semibold text-green-900">
                      Grand Total: ₱
                      {Number(formData.items.reduce((sum, item) => sum + item.totalCost, 0)).toLocaleString()}
                    </p>
                  </div>

                  <div className="flex gap-2 pt-4">
                    <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                      {editingId ? 'Update IAR' : 'Create IAR'}
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
                <TableHead>IAR No.</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Office</TableHead>
                <TableHead>Total Amount</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {iarRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No IAR records yet</p>
                  </TableCell>
                </TableRow>
              ) : (
                iarRecords.map((record) => {
                  const total = record.items.reduce((sum, item) => sum + item.totalCost, 0);

                  return (
                    <TableRow key={record.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{record.iarNo}</TableCell>
                      <TableCell>{safeDisplayDate(record.date)}</TableCell>
                      <TableCell>{record.poNumber}</TableCell>
                      <TableCell>{record.supplier}</TableCell>
                      <TableCell>{record.requisitioningOffice}</TableCell>
                      <TableCell>₱{Number(total).toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 sm:gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(record)}
                            className="flex items-center gap-1"
                          >
                            <Edit className="w-3 h-3" />
                            <span className="hidden sm:inline">Edit</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(record.id, record.iarNo)}
                            className="flex items-center gap-1"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span className="hidden sm:inline">Delete</span>
                          </Button>

                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadIAR(record)}
                            disabled={isDownloading}
                            className="flex items-center gap-1"
                          >
                            <Download className="w-3 h-3" />
                            <span className="hidden sm:inline">Export</span>
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
    </div>
  );
}