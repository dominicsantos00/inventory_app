import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Plus, Download, FileText, Trash2, Edit } from 'lucide-react';
import { toast } from 'sonner';

// --- CUSTOM SEARCHABLE DROPDOWN ---
function SearchableSelect({ value, options, onSelect, placeholder = 'Search...' }: any) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selectedOpt = options.find((o: any) => o.value === value);
    setSearch(selectedOpt ? selectedOpt.label : value || '');
  }, [value, options]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        const selectedOpt = options.find((o: any) => o.value === value);
        setSearch(selectedOpt ? selectedOpt.label : value || '');
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [value, options]);

  const safeSearch = (search || '').toLowerCase();
  const filteredOptions = options.filter((opt: any) => (opt.label || '').toLowerCase().includes(safeSearch) || (opt.value || '').toLowerCase().includes(safeSearch));

  return (
    <div className="relative" ref={wrapperRef}>
      <Input type="text" value={search} onChange={(e) => { setSearch(e.target.value); setIsOpen(true); }} onFocus={(e) => { setIsOpen(true); e.target.select(); }} placeholder={placeholder} className="w-full bg-white border-slate-200" />
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg max-h-60 overflow-auto">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt: any, i: number) => (
              <div key={i} className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 transition-colors text-slate-700" onClick={() => { onSelect(opt.value); setIsOpen(false); }}>{opt.label}</div>
            ))
          ) : ( <div className="px-3 py-2 text-sm text-slate-500">No results found.</div> )}
        </div>
      )}
    </div>
  );
}

export function RISSubpage() {
  const { risRecords, addRISRecord, updateRISRecord, deleteRISRecord, rccItems = [], ssnItems = [], stockCards = [] } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const emptyItem = { stockNo: '', description: '', unit: '', quantityRequested: '' as any, quantityIssued: '' as any, remarks: '' };
  
  const [formData, setFormData] = useState({
    risNo: '', entityName: 'Department of Environment and Natural Resources', fundCluster: '', division: '',
    responsibilityCenterCode: '', office: '', date: '', poNumber: '', saiNo: '', dateSai: '', items: [{ ...emptyItem }]
  });

  const handleEdit = useCallback((record: any) => {
    setEditingId(record.id);
    let formattedDate = '';
    if (record.date) {
      const d = new Date(record.date);
      if (!Number.isNaN(d.getTime())) formattedDate = d.toISOString().split('T')[0];
    }
    let formattedDateSai = '';
    if (record.dateSai) {
      const d = new Date(record.dateSai);
      if (!Number.isNaN(d.getTime())) formattedDateSai = d.toISOString().split('T')[0];
    }
    setFormData({ ...record, date: formattedDate, dateSai: formattedDateSai, items: JSON.parse(JSON.stringify(record.items)) });
    setIsDialogOpen(true);
  }, []);

  const handleDelete = useCallback(async (id: string, risNo: string) => {
    if (window.confirm(`Are you sure you want to delete RIS No: ${risNo}?`)) {
      try { await deleteRISRecord(id); toast.success(`RIS ${risNo} deleted`); } catch (error) { toast.error('Failed to delete RIS record'); }
    }
  }, [deleteRISRecord]);

  const handleOfficeSelect = (officeName: string) => {
    const rcc = rccItems.find((r) => r.divisionName === officeName);
    setFormData(prev => rcc ? { ...prev, division: officeName, responsibilityCenterCode: rcc.code } : { ...prev, division: officeName });
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

  const addItem = () => setFormData(prev => ({ ...prev, items: [...prev.items, { ...emptyItem }] }));

  const updateItem = (index: number, field: string, value: string | number) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const removeItem = (index: number) => {
    const newItems = formData.items.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, items: newItems.length ? newItems : [{ ...emptyItem }] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Basic validation to ensure required fields aren't empty
    if (!formData.risNo || !formData.division) {
      toast.error("Please fill in all required fields (RIS No. and Division).");
      return;
    }

    const cleanedData = {
      ...formData,
      
      // FIX 1: Ensure the database doesn't crash if an RCC isn't selected
      responsibilityCenterCode: formData.responsibilityCenterCode || 'N/A', 
      
      // FIX 2: Convert empty strings to null for MySQL DATE columns
      dateSai: formData.dateSai ? formData.dateSai : null, 

      items: formData.items.map(item => {
        // Find the unit price from the Stock Card to calculate the exact amount distributed
        const stock = stockCards.find(sc => sc.description === item.description);
        const unitPrice = (stock as any)?.unitPrice || 0;
        const qtyIssued = Number(item.quantityIssued) || 0;
        
        return {
          ...item,
          quantityRequested: Number(item.quantityRequested) || 0,
          quantityIssued: qtyIssued,
          unitPrice: unitPrice,
          amount: qtyIssued * unitPrice // Crucial for Dashboard totals!
        };
      })
    };

    try {
      if (editingId) {
        await updateRISRecord(editingId, cleanedData as any);
        toast.success('RIS updated successfully');
      } else {
        await addRISRecord(cleanedData as any);
        toast.success('RIS created successfully');
      }
      setIsDialogOpen(false); 
      resetForm();
    } catch (error) { 
      console.error(error);
      toast.error('Failed to save RIS record'); 
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ risNo: '', entityName: 'Department of Environment and Natural Resources', fundCluster: '', division: '', responsibilityCenterCode: '', office: '', date: '', poNumber: '', saiNo: '', dateSai: '', items: [{ ...emptyItem }] });
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100">
          <div className="flex justify-between items-center">
            <CardTitle className="text-lg font-bold text-slate-900">Requisition and Issue Slip (RIS)</CardTitle>
            <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if (!open) resetForm(); }}>
              <DialogTrigger asChild>
                <Button className="bg-amber-600 hover:bg-amber-700 shadow-sm text-white"><Plus className="mr-2 h-4 w-4" /> Create RIS</Button>
              </DialogTrigger>
              
              {/* --- FLEXBOX FIX: This stops the modal from overflowing the screen! --- */}
              <DialogContent className="max-w-4xl border-slate-200 shadow-xl p-0 flex flex-col max-h-[90vh] overflow-hidden">
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                  <DialogTitle className="text-xl">{editingId ? 'Edit RIS Record' : 'Create New RIS'}</DialogTitle>
                </div>
                
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                  
                  {/* --- SCROLLABLE BODY --- */}
                  <div className="p-6 space-y-4 overflow-y-auto flex-1">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>RIS Number</Label>
                        <Input value={formData.risNo} onChange={e => setFormData({ ...formData, risNo: e.target.value })} placeholder="e.g., RIS-2026-001" required />
                      </div>
                      <div className="space-y-2">
                        <Label>Date</Label>
                        <Input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} required />
                      </div>
                      <div className="space-y-2">
                        <Label>Division</Label>
                        <SearchableSelect value={formData.division} options={rccItems.map((rcc: any) => ({ value: rcc.divisionName, label: rcc.divisionName }))} onSelect={handleOfficeSelect} placeholder="Search Division..." />
                      </div>
                      <div className="space-y-2">
                        <Label>Responsibility Center Code</Label>
                        <Input value={formData.responsibilityCenterCode} readOnly className="bg-slate-50" placeholder="Auto-filled" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between items-center mt-4">
                        <Label>Requested Items</Label>
                        <Button type="button" size="sm" onClick={addItem} variant="outline"><Plus className="h-4 w-4 mr-1" />Add Item</Button>
                      </div>

                      {formData.items.map((item, index) => (
                        <div key={index} className="p-4 border border-slate-200 rounded-lg space-y-3 bg-slate-50/50">
                          <div className="flex justify-between items-center">
                            <span className="font-medium text-sm text-slate-800">Item {index + 1}</span>
                            {formData.items.length > 1 && <Button type="button" size="sm" variant="ghost" onClick={() => removeItem(index)} className="text-red-500 hover:text-red-700 h-8">Remove</Button>}
                          </div>
                          
                          <div className="space-y-2">
                            <Label className="text-xs">Stock Number / Description</Label>
                            <SearchableSelect value={item.stockNo} options={ssnItems.map((ssn: any) => ({ value: ssn.code, label: `${ssn.code} - ${ssn.description}` }))} onSelect={(value: any) => handleStockNoSelect(index, value)} />
                          </div>

                          <div className="grid grid-cols-4 gap-3 mt-2">
                            <div className="space-y-1 col-span-2">
                              <Label className="text-xs">Description</Label>
                              <Input readOnly value={item.description} className="bg-slate-50 text-xs" />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Qty Requested</Label>
                              <Input type="number" value={item.quantityRequested} onChange={e => updateItem(index, 'quantityRequested', e.target.value)} required />
                            </div>
                            <div className="space-y-1">
                              <Label className="text-xs">Qty Issued</Label>
                              <Input type="number" value={item.quantityIssued} onChange={e => updateItem(index, 'quantityIssued', e.target.value)} required />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* --- FIXED FOOTER WITH BUTTONS --- */}
                  <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
                    <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-slate-600">Cancel</Button>
                    <Button type="submit" className="bg-amber-600 hover:bg-amber-700 shadow-sm px-8">{editingId ? 'Save Changes' : 'Create RIS'}</Button>
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
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Total Items</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {risRecords.length === 0 ? (
                  <TableRow><TableCell colSpan={6} className="text-center py-12 text-slate-500">No RIS records found</TableCell></TableRow>
                ) : (
                  risRecords.map((record) => (
                    <TableRow key={record.id} className="group hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium text-slate-900">{record.risNo}</TableCell>
                      <TableCell className="text-slate-600">{new Date(record.date).toLocaleDateString()}</TableCell>
                      <TableCell className="text-slate-700">{record.division}</TableCell>
                      <TableCell className="text-slate-600">{record.responsibilityCenterCode}</TableCell>
                      <TableCell className="text-center font-semibold text-slate-800">{record.items.reduce((sum: number, item: any) => sum + (Number(item.quantityIssued) || 0), 0)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" onClick={() => handleEdit(record)} className="h-8 w-8 text-slate-500 hover:text-amber-600 hover:bg-amber-50"><Edit className="w-4 h-4" /></Button>
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
    </div>
  );
}