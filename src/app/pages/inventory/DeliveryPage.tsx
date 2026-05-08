import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useData } from '../../context/DataContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Badge } from '../../components/ui/badge';
import { Plus, Truck, Package, CheckCircle, Boxes, Trash2, X, PlusCircle, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export function DeliveryPage() {
  const { user } = useAuth();
  const { 
    forDeliveryRecords, addForDeliveryRecord, updateForDeliveryRecord, deleteForDeliveryRecord,
    deliveredRecords, addDeliveredRecord, deleteDeliveredRecord,
    suppliers, ssnItems, risRecords, stockCards, equipmentRecords 
  } = useData();

  const isEndUser = user?.role === 'end-user';

  const handleDeletePendingPO = async (id: string, poNumber: string) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete the pending Purchase Order: ${poNumber}?\n\nThis action cannot be undone.`);
    if (isConfirmed) {
      try {
        await deleteForDeliveryRecord(id);
        toast.success(`PO ${poNumber} deleted successfully.`);
      } catch (error) {
        toast.error("Failed to delete PO.");
      }
    }
  };

  const handleDeleteDelivered = async (id: string, iarNo: string) => {
    const isConfirmed = window.confirm(`Are you sure you want to delete Delivery Record: ${iarNo}?\n\nWARNING: This will automatically reverse and deduct the items from your Supply Room stock!`);
    if (isConfirmed) {
      try {
        await deleteDeliveredRecord(id);
        toast.success(`Delivery ${iarNo} deleted and stock reversed.`);
      } catch (error) {
        toast.error("Failed to delete Delivery.");
      }
    }
  };

  const [activeTab, setActiveTab] = useState("for-delivery");

  const [isForDeliveryDialogOpen, setIsForDeliveryDialogOpen] = useState(false);
  const [isDeliveredDialogOpen, setIsDeliveredDialogOpen] = useState(false);
  const [editingForDeliveryId, setEditingForDeliveryId] = useState<string | null>(null);

  const [forDeliveryForm, setForDeliveryForm] = useState({ type: 'Office Supplies', poNumber: '', poDate: '', supplier: '' });
  const [deliveredForm, setDeliveredForm] = useState({ poNumber: '', poDate: '', supplier: '', receiptNumber: '', dateDelivered: '', type: '' });
  
  const [currentItem, setCurrentItem] = useState({ itemDescription: '', qty: 0, unit: '', price: 0 });
  const [pendingItems, setPendingItems] = useState<any[]>([]);

  const formatCurrency = (amount: any) => Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // ============================================================================
  // PPTX REQUIREMENT B1: "Items that have already been delivered will be removed"
  // ============================================================================
  const pendingForDeliveryItems = useMemo(() => {
    const deliveredMap: Record<string, number> = {};
    (deliveredRecords || []).forEach(d => {
      const key = `${d.poNumber}-${d.itemDescription}`;
      deliveredMap[key] = (deliveredMap[key] || 0) + (Number(d.qty) || 0);
    });

    const pending: any[] = [];
    (forDeliveryRecords || []).forEach(record => {
      record.items.forEach(item => {
        const key = `${record.poNumber}-${item.itemDescription}`;
        const deliveredQty = deliveredMap[key] || 0;
        const remainingQty = (Number(item.qty) || 0) - deliveredQty;

        if (remainingQty > 0) {
          pending.push({
            id: record.id,
            poNumber: record.poNumber,
            supplier: record.supplier,
            poDate: record.poDate,
            type: record.type,
            itemDescription: item.itemDescription,
            qty: remainingQty, 
            unit: item.unit,
            price: item.price,
            amount: remainingQty * item.price
          });
        }
      });
    });
    return pending;
  }, [forDeliveryRecords, deliveredRecords]);

  const availablePendingPOs = Array.from(new Set(pendingForDeliveryItems.map(item => item.poNumber)));

  const handlePOSelect = (selectedPO: string) => {
    const poDetails = pendingForDeliveryItems.find(r => r.poNumber === selectedPO);
    if (poDetails) {
      setDeliveredForm({ ...deliveredForm, poNumber: selectedPO, poDate: poDetails.poDate, supplier: poDetails.supplier, type: poDetails.type });
      setCurrentItem({ itemDescription: '', qty: 0, unit: '', price: 0 });
    }
  };

  const availableItemsForSelectedPO = pendingForDeliveryItems.filter(item => item.poNumber === deliveredForm.poNumber);

  const handlePOItemSelect = (desc: string) => {
    const itemDetails = availableItemsForSelectedPO.find((i: any) => i.itemDescription === desc);
    if (itemDetails) setCurrentItem({ itemDescription: desc, qty: itemDetails.qty, unit: itemDetails.unit, price: itemDetails.price });
  };

  const handleSSNSelect = (desc: string) => {
    const ssn = ssnItems.find(s => s.description === desc);
    if (ssn) setCurrentItem(prev => ({ ...prev, itemDescription: ssn.description, unit: ssn.unit }));
  };

  const handleAddPendingItem = () => {
    if (!currentItem.itemDescription || currentItem.qty <= 0 || currentItem.price <= 0) return toast.error("Please fill all item fields properly");
    setPendingItems([...pendingItems, { ...currentItem, amount: currentItem.qty * currentItem.price }]);
    setCurrentItem({ itemDescription: '', qty: 0, unit: '', price: 0 });
  };

  // --- FIX: Restored the missing Remove Item function! ---
  const handleRemovePendingItem = (index: number) => {
    setPendingItems(pendingItems.filter((_, i) => i !== index));
  };

  const resetForms = () => {
    setForDeliveryForm({ type: 'Office Supplies', poNumber: '', poDate: '', supplier: '' });
    setDeliveredForm({ poNumber: '', poDate: '', supplier: '', receiptNumber: '', dateDelivered: '', type: '' });
    setCurrentItem({ itemDescription: '', qty: 0, unit: '', price: 0 });
    setPendingItems([]);
    setEditingForDeliveryId(null);
  };

  const submitForDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingItems.length === 0) return toast.error("Add at least one item.");
    try {
      if (editingForDeliveryId) await updateForDeliveryRecord(editingForDeliveryId, { ...forDeliveryForm, items: pendingItems });
      else await addForDeliveryRecord({ ...forDeliveryForm, items: pendingItems } as any);
      toast.success("Incoming PO registered successfully");
      setIsForDeliveryDialogOpen(false); resetForms();
    } catch (error) { toast.error("Failed to save PO record"); }
  };

  const submitDelivered = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingItems.length === 0) return toast.error("Add at least one received item.");
    try {
      for (const item of pendingItems) {
        const payload = {
          dateDelivered: deliveredForm.dateDelivered, type: deliveredForm.type, itemDescription: item.itemDescription,
          poNumber: deliveredForm.poNumber, poDate: deliveredForm.poDate, receiptNumber: deliveredForm.receiptNumber,
          supplier: deliveredForm.supplier, qty: item.qty, unit: item.unit, price: item.price, amount: item.amount
        };
        await addDeliveredRecord(payload as any);
      }
      toast.success("Supplies recorded as delivered");
      setIsDeliveredDialogOpen(false); resetForms();
    } catch (error) { toast.error("Failed to record delivery"); }
  };

  // ============================================================================
  // PPTX REQUIREMENT B3: "Contains Office Supplies (RIS) AND Equipment (ICS/PAR)"
  // ============================================================================
  const distributedItems = useMemo(() => {
    const supplies = (risRecords || []).flatMap(ris => 
      ris.items.map(item => ({
        office: ris.division,
        itemDescription: item.description,
        unit: item.unit,
        qtyIssued: item.quantityIssued,
        unitPrice: item.unitPrice || 0,
        amount: item.amount || 0,
        source: `RIS: ${ris.risNo}`
      }))
    );

    const equipment = (equipmentRecords || []).map(eq => ({
      office: `${eq.accountablePerson} (${eq.accountablePosition})`,
      itemDescription: eq.itemDescription,
      unit: eq.unit,
      qtyIssued: eq.quantity,
      unitPrice: eq.amount,
      amount: eq.quantity * eq.amount,
      source: `${eq.type}: ${eq.formNumber}`
    }));

    return [...supplies, ...equipment].filter(item => {
      if (isEndUser) {
        const safeOffice = item.office?.toLowerCase() || '';
        return safeOffice.includes(user?.division?.toLowerCase() || '') || safeOffice.includes(user?.fullName?.toLowerCase() || '');
      }
      return true;
    });
  }, [risRecords, equipmentRecords, isEndUser, user]);

  // ============================================================================
  // PPTX REQUIREMENT B4: "Basis will be Delivered less Distributed"
  // ============================================================================
  const inStockItems = useMemo(() => {
    const suppliesInStock = (stockCards || []).map(stock => {
      const balanceQty = stock.transactions?.[stock.transactions.length - 1]?.balance || 0;
      return {
        office: 'Supply Room',
        itemDescription: stock.description,
        unit: stock.unit,
        qty: balanceQty,
        unitPrice: stock.unitPrice || 0,
        amount: balanceQty * (stock.unitPrice || 0)
      };
    }).filter(item => item.qty > 0);

    const eqDeliveredMap: Record<string, any> = {};
    (deliveredRecords || []).filter(d => d.type === 'Equipment').forEach(d => {
      if(!eqDeliveredMap[d.itemDescription]) eqDeliveredMap[d.itemDescription] = { qty: 0, price: Number(d.price), unit: d.unit };
      eqDeliveredMap[d.itemDescription].qty += Number(d.qty);
    });

    (equipmentRecords || []).forEach(eq => {
      if(eqDeliveredMap[eq.itemDescription]) eqDeliveredMap[eq.itemDescription].qty -= Number(eq.quantity);
    });

    const equipmentInStock = Object.keys(eqDeliveredMap).map(key => ({
        office: 'Equipment Room',
        itemDescription: key,
        unit: eqDeliveredMap[key].unit,
        qty: eqDeliveredMap[key].qty,
        unitPrice: eqDeliveredMap[key].price,
        amount: eqDeliveredMap[key].qty * eqDeliveredMap[key].price
    })).filter(item => item.qty > 0);

    return [...suppliesInStock, ...equipmentInStock];
  }, [stockCards, deliveredRecords, equipmentRecords]);


  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Delivery Management</h2>
        <p className="text-slate-500 text-sm mt-1">Track the entire lifecycle from PO delivery to physical distribution.</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-4 bg-slate-100 p-1 rounded-xl mb-6 h-12 border border-slate-200 shadow-sm">
          <TabsTrigger value="for-delivery" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg text-slate-500 transition-all font-medium text-sm">
            <Truck className="w-4 h-4 mr-2"/> Incoming
          </TabsTrigger>
          <TabsTrigger value="delivered" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg text-slate-500 transition-all font-medium text-sm">
            <Package className="w-4 h-4 mr-2"/> Delivered
          </TabsTrigger>
          <TabsTrigger value="distributed" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg text-slate-500 transition-all font-medium text-sm">
            <CheckCircle className="w-4 h-4 mr-2"/> Distributed
          </TabsTrigger>
          <TabsTrigger value="in-stock" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg text-slate-500 transition-all font-medium text-sm">
            <Boxes className="w-4 h-4 mr-2"/> In Stock
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: FOR DELIVERY (INCOMING) */}
        <TabsContent value="for-delivery" className="mt-0">
          {!isEndUser && (
            <div className="flex justify-end mb-4">
              <Dialog open={isForDeliveryDialogOpen} onOpenChange={(open) => { setIsForDeliveryDialogOpen(open); if(!open) resetForms(); }}>
                <DialogTrigger asChild>
                  <Button className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                    <Plus className="mr-2 h-4 w-4" /> Add Incoming PO
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl border-slate-200 shadow-xl overflow-hidden p-0 max-h-[90vh] flex flex-col">
                  <div className="p-6 border-b border-slate-100 bg-slate-50/50 shrink-0">
                    <DialogTitle className="text-xl">Register Incoming PO</DialogTitle>
                  </div>
                  <form onSubmit={submitForDelivery} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-2 gap-5 mb-8">
                      <div className="space-y-1.5">
                        <Label className="text-slate-700">Type of Delivery</Label>
                        <Select value={forDeliveryForm.type || undefined} onValueChange={(val) => setForDeliveryForm({...forDeliveryForm, type: val})}>
                          <SelectTrigger className="bg-white border-slate-200"><SelectValue/></SelectTrigger>
                          <SelectContent><SelectItem value="Office Supplies">Office Supplies</SelectItem><SelectItem value="Equipment">Equipment</SelectItem></SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-700">PO Number <span className="text-red-500">*</span></Label>
                        <Input required value={forDeliveryForm.poNumber} onChange={e => setForDeliveryForm({...forDeliveryForm, poNumber: e.target.value})} placeholder="PO-2026-001" className="bg-white border-slate-200" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-700">PO Date <span className="text-red-500">*</span></Label>
                        <Input required type="date" value={forDeliveryForm.poDate} onChange={e => setForDeliveryForm({...forDeliveryForm, poDate: e.target.value})} className="bg-white border-slate-200" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-700">Supplier <span className="text-red-500">*</span></Label>
                        <Select required value={forDeliveryForm.supplier || undefined} onValueChange={(val) => setForDeliveryForm({...forDeliveryForm, supplier: val})}>
                          <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select supplier..." /></SelectTrigger>
                          <SelectContent>
                            {suppliers && suppliers.length > 0 ? (
                              suppliers.map((s: any) => {
                                const supplierName = s.name || s.supplierName || s.supplier;
                                return supplierName ? <SelectItem key={s.id || supplierName} value={supplierName}>{supplierName}</SelectItem> : null;
                              })
                            ) : <SelectItem value="none" disabled>No suppliers found. Add in Master Data.</SelectItem>}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                      <h4 className="font-semibold text-slate-800 flex items-center"><Package className="w-4 h-4 mr-2" /> Line Items</h4>
                      <div className="grid grid-cols-12 gap-3 items-end bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                        <div className="col-span-5 space-y-1">
                          <Label className="text-xs text-slate-500">Item Description</Label>
                          <Select value={currentItem.itemDescription || undefined} onValueChange={handleSSNSelect}>
                            <SelectTrigger className="h-9 text-sm border-slate-200"><SelectValue placeholder="Select item..." /></SelectTrigger>
                            <SelectContent>{ssnItems.map(ssn => <SelectItem key={ssn.id} value={ssn.description}>{ssn.description}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs text-slate-500">Qty</Label>
                          <Input className="h-9 text-sm border-slate-200" type="number" value={currentItem.qty || ''} onChange={e => setCurrentItem({...currentItem, qty: Number(e.target.value)})} />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs text-slate-500">Unit</Label>
                          <Input readOnly className="h-9 text-sm border-slate-200 bg-slate-50" value={currentItem.unit} placeholder="Auto" />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs text-slate-500">Unit Price</Label>
                          <Input className="h-9 text-sm border-slate-200" type="number" value={currentItem.price || ''} onChange={e => setCurrentItem({...currentItem, price: Number(e.target.value)})} />
                        </div>
                        <div className="col-span-1">
                          <Button type="button" size="icon" onClick={handleAddPendingItem} className="h-9 w-full bg-slate-900 hover:bg-slate-800 text-white shadow-sm"><PlusCircle className="h-4 w-4" /></Button>
                        </div>
                      </div>

                      {pendingItems.length > 0 && (
                        <Table className="bg-white rounded-lg overflow-hidden shadow-sm mt-3">
                          <TableHeader className="bg-slate-100 border-b-0">
                            <TableRow>
                              <TableHead className="h-9 text-xs">Item</TableHead>
                              <TableHead className="h-9 text-xs">Qty/Unit</TableHead>
                              <TableHead className="h-9 text-xs">Price</TableHead>
                              <TableHead className="h-9 text-xs">Total</TableHead>
                              <TableHead className="h-9 w-10"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingItems.map((pi, i) => (
                              <TableRow key={i}>
                                <TableCell className="text-sm py-2 font-medium">{pi.itemDescription}</TableCell>
                                <TableCell className="text-sm py-2 text-slate-500">{pi.qty} {pi.unit}</TableCell>
                                <TableCell className="text-sm py-2 text-slate-500">₱{formatCurrency(pi.price)}</TableCell>
                                <TableCell className="text-sm py-2 text-slate-900 font-semibold">₱{formatCurrency(pi.amount)}</TableCell>
                                <TableCell className="py-2 text-right">
                                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemovePendingItem(i)} className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"><X className="h-3 w-3"/></Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>
                    </div> {/* End scrollable area */}
                    <div className="p-5 border-t border-slate-100 bg-white shrink-0 flex justify-end gap-3">
                      <Button type="button" variant="ghost" onClick={() => setIsForDeliveryDialogOpen(false)} className="text-slate-600">Cancel</Button>
                      <Button type="submit" className="bg-green-600 hover:bg-green-700">Register Incoming PO</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}

          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              <div className="max-h-[55vh] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm outline outline-1 outline-slate-200">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">PO Details</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Item Description</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Amount</TableHead>
                      {!isEndUser && <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingForDeliveryItems.map((item, idx) => (
                      <TableRow key={`${item.id}-${idx}`} className="group hover:bg-slate-50 transition-colors">
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900">{item.poNumber}</span>
                            <span className="text-xs text-slate-500">{item.supplier} • {item.poDate}</span>
                            <Badge variant="outline" className="mt-1 w-fit text-[10px] bg-slate-100 text-slate-600 border-slate-200">{item.type}</Badge>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[250px] whitespace-normal break-words font-medium text-slate-700">{item.itemDescription}</TableCell>
                        <TableCell className="text-slate-600">{item.qty} <span className="text-slate-400 text-xs ml-1">{item.unit}</span></TableCell>
                        <TableCell className="font-semibold text-slate-900">₱{formatCurrency(item.amount)}</TableCell>
                        
                        {!isEndUser && (
                          <TableCell className="text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeletePendingPO(item.id, item.poNumber)}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                    {pendingForDeliveryItems.length === 0 && (
                      <TableRow><TableCell colSpan={isEndUser ? 4 : 5} className="text-center py-12 text-slate-500">No incoming records found</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: DELIVERED */}
        <TabsContent value="delivered" className="mt-0">
          {!isEndUser && (
            <div className="flex justify-end mb-4">
              <Dialog open={isDeliveredDialogOpen} onOpenChange={(open) => { setIsDeliveredDialogOpen(open); if(!open) resetForms(); }}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-sm">
                    <Package className="mr-2 h-4 w-4" /> Receive Delivery
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl border-slate-200 shadow-xl overflow-hidden p-0 max-h-[90vh] flex flex-col">
                  <div className="p-6 border-b border-slate-100 bg-blue-50/30 shrink-0">
                    <DialogTitle className="text-xl text-blue-900">Log Received Delivery</DialogTitle>
                  </div>
                  <form onSubmit={submitDelivered} className="flex flex-col flex-1 overflow-hidden">
                    <div className="p-6 overflow-y-auto flex-1">
                    <div className="grid grid-cols-2 gap-5 mb-8">
                      <div className="space-y-1.5">
                        <Label className="text-slate-700">Select PO Number <span className="text-red-500">*</span></Label>
                        <Select value={deliveredForm.poNumber || undefined} onValueChange={handlePOSelect}>
                          <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Choose incoming PO..." /></SelectTrigger>
                          <SelectContent>
                            {availablePendingPOs.map(po => {
                               const sample = pendingForDeliveryItems.find(p => p.poNumber === po);
                               return <SelectItem key={po} value={po}>{po} ({sample?.supplier})</SelectItem>
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-700">Supplier (Auto-filled)</Label>
                        <Input readOnly value={deliveredForm.supplier} className="bg-slate-50 text-slate-500 cursor-not-allowed border-slate-200" placeholder="Awaiting PO selection..." />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-700">Receipt/Invoice Number <span className="text-red-500">*</span></Label>
                        <Input required value={deliveredForm.receiptNumber} onChange={e => setDeliveredForm({...deliveredForm, receiptNumber: e.target.value})} placeholder="e.g. INV-12345" className="bg-white border-slate-200" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-slate-700">Date Received <span className="text-red-500">*</span></Label>
                        <Input required type="date" value={deliveredForm.dateDelivered} onChange={e => setDeliveredForm({...deliveredForm, dateDelivered: e.target.value})} className="bg-white border-slate-200" />
                      </div>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
                      <h4 className="font-semibold text-slate-800 flex items-center"><Boxes className="w-4 h-4 mr-2" /> Verify Items Received</h4>
                      <div className="grid grid-cols-12 gap-3 items-end bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                        <div className="col-span-5 space-y-1">
                          <Label className="text-xs text-slate-500">Select Item from PO</Label>
                          <Select key={deliveredForm.poNumber || 'item-select'} disabled={!deliveredForm.poNumber} value={currentItem.itemDescription || undefined} onValueChange={handlePOItemSelect}>
                            <SelectTrigger className="h-9 text-sm border-slate-200"><SelectValue placeholder="Choose item..." /></SelectTrigger>
                            <SelectContent>
                              {availableItemsForSelectedPO.map((item: any, idx: number) => (
                                <SelectItem key={idx} value={item.itemDescription}>{item.itemDescription} (Max: {item.qty})</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs text-slate-500">Qty Received</Label>
                          <Input className="h-9 text-sm border-slate-200" type="number" value={currentItem.qty || ''} onChange={e => setCurrentItem({...currentItem, qty: Number(e.target.value)})} />
                        </div>
                        <div className="col-span-2 space-y-1">
                          <Label className="text-xs text-slate-500">Unit Price</Label>
                          <Input readOnly className="h-9 text-sm border-slate-200 bg-slate-50" value={currentItem.price || ''} placeholder="Auto" />
                        </div>
                        <div className="col-span-3">
                          <Button type="button" onClick={handleAddPendingItem} className="h-9 w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm text-sm">Add to Receipt</Button>
                        </div>
                      </div>

                      {pendingItems.length > 0 && (
                        <Table className="bg-white rounded-lg overflow-hidden shadow-sm mt-3">
                          <TableHeader className="bg-slate-100 border-b-0">
                            <TableRow>
                              <TableHead className="h-9 text-xs">Item Description</TableHead>
                              <TableHead className="h-9 text-xs">Qty</TableHead>
                              <TableHead className="h-9 text-xs">Price</TableHead>
                              <TableHead className="h-9 text-xs">Total</TableHead>
                              <TableHead className="h-9 w-10"></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {pendingItems.map((pi, i) => (
                              <TableRow key={i}>
                                <TableCell className="text-sm py-2 font-medium">{pi.itemDescription}</TableCell>
                                <TableCell className="text-sm py-2 text-slate-500">{pi.qty} {pi.unit}</TableCell>
                                <TableCell className="text-sm py-2 text-slate-500">₱{formatCurrency(pi.price)}</TableCell>
                                <TableCell className="text-sm py-2 text-slate-900 font-semibold">₱{formatCurrency(pi.amount)}</TableCell>
                                <TableCell className="py-2 text-right">
                                  <Button type="button" variant="ghost" size="icon" onClick={() => handleRemovePendingItem(i)} className="h-7 w-7 text-red-400 hover:text-red-600 hover:bg-red-50"><X className="h-3 w-3"/></Button>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      )}
                    </div>

                    </div> {/* End scrollable area */}
                    <div className="p-5 border-t border-slate-100 bg-white shrink-0 flex justify-end gap-3">
                      <Button type="button" variant="ghost" onClick={() => setIsDeliveredDialogOpen(false)} className="text-slate-600">Cancel</Button>
                      <Button type="submit" className="bg-blue-600 hover:bg-blue-700">Save Received Delivery</Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          )}

          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              <div className="max-h-[55vh] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm outline outline-1 outline-slate-200">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Received</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Type</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Item Details</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">PO & Receipt</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Qty/Amount</TableHead>
                      {!isEndUser && <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {deliveredRecords.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={isEndUser ? 5 : 6} className="h-32 text-center text-slate-500">
                          <div className="flex flex-col items-center justify-center">
                            <Package className="h-8 w-8 text-slate-300 mb-2" />
                            <p>No deliveries recorded yet.</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      deliveredRecords.map((d) => (
                        <TableRow key={d.id} className="group hover:bg-slate-50 transition-colors">
                          <TableCell className="text-slate-600 font-medium flex items-center mt-2">
                            <Calendar className="h-3 w-3 mr-2 text-slate-400" />{d.dateDelivered}
                          </TableCell>
                          <TableCell><Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 font-medium">{d.type}</Badge></TableCell>
                          <TableCell className="max-w-[200px] whitespace-normal break-words">
                            <p className="font-medium text-slate-800">{d.itemDescription}</p>
                            <p className="text-xs text-slate-500 mt-0.5">from {d.supplier}</p>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-slate-700">{d.receiptNumber}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{d.poNumber}</p>
                          </TableCell>
                          <TableCell>
                             <p className="text-slate-700">{d.qty} <span className="text-xs text-slate-400">{d.unit}</span></p>
                             <p className="font-semibold text-green-700 text-sm mt-0.5">₱{formatCurrency(d.amount)}</p>
                          </TableCell>
                          {!isEndUser && (
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50" onClick={() => handleDeleteDelivered(d.id, d.receiptNumber || d.poNumber || 'Record')}><Trash2 className="h-4 w-4" /></Button>
                              </div>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: DISTRIBUTED */}
        <TabsContent value="distributed" className="mt-0">
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              <div className="max-h-[55vh] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm outline outline-1 outline-slate-200">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Office / Assignee</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item Description</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Unit</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">QTY</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Unit Price</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {distributedItems.length === 0 ? (
                      <TableRow><TableCell colSpan={7} className="text-center py-8 text-slate-500">No distributed items found.</TableCell></TableRow>
                    ) : (
                      distributedItems.map((item, idx) => (
                        <TableRow key={`dist-${idx}`} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="font-medium text-slate-900 max-w-[150px] whitespace-normal break-words">{item.office}</TableCell>
                          <TableCell className="text-slate-700 max-w-[200px] whitespace-normal break-words">{item.itemDescription}</TableCell>
                          <TableCell className="text-center text-slate-600">{item.unit}</TableCell>
                          <TableCell className="text-center font-medium text-slate-800">{item.qtyIssued}</TableCell>
                          <TableCell className="text-right text-slate-600">₱{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right font-bold text-slate-900">₱{formatCurrency(item.amount)}</TableCell>
                          <TableCell className="text-right text-xs text-slate-500">{item.source}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: IN STOCK */}
        <TabsContent value="in-stock" className="mt-0">
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              <div className="max-h-[55vh] overflow-y-auto">
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm outline outline-1 outline-slate-200">
                    <TableRow className="hover:bg-transparent">
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Location</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item Description</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Unit</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Available QTY</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Unit Price</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {inStockItems.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">No stock records found.</TableCell></TableRow>
                    ) : (
                      inStockItems.map((item, idx) => (
                        <TableRow key={`stock-${idx}`} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="font-medium text-slate-900">{item.office}</TableCell>
                          <TableCell className="text-slate-700 max-w-[250px] whitespace-normal break-words">{item.itemDescription}</TableCell>
                          <TableCell className="text-center text-slate-600">{item.unit}</TableCell>
                          <TableCell className="text-center font-bold text-indigo-600">{item.qty}</TableCell>
                          <TableCell className="text-right text-slate-600">₱{formatCurrency(item.unitPrice)}</TableCell>
                          <TableCell className="text-right font-bold text-slate-900">₱{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}