import React, { useState, useMemo } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Badge } from '../../components/ui/badge';
import { Plus, Truck, Package, CheckCircle, Boxes, Edit, Trash2, X } from 'lucide-react';
import { toast } from 'sonner';

// --- MOCK DATA --- 
const initialForDelivery = [
  {
    id: 'po-1', type: 'Office Supplies', poNumber: 'PO-2026-001', poDate: '2026-04-01', supplier: 'Acme Corp',
    items: [
      { id: 'i1', itemDescription: 'BOND PAPER, A4', qty: 50, unit: 'Ream', price: 250 },
      { id: 'i2', itemDescription: 'FOLDER, VERTICAL WITH METAL RINGBINDER, LEGAL', qty: 100, unit: 'Piece', price: 50 }
    ]
  },
  {
    id: 'po-2', type: 'Equipment', poNumber: 'PO-2026-002', poDate: '2026-04-05', supplier: 'Tech Solutions',
    items: [
      { id: 'i3', itemDescription: 'EPSON L3210 PRINTER', qty: 2, unit: 'Unit', price: 8500 }
    ]
  }
];

export function DeliveryPage() {
  const [activeTab, setActiveTab] = useState("for-delivery");

  // States for the Data
  const [forDeliveryRecords, setForDeliveryRecords] = useState(initialForDelivery);
  const [deliveredRecords, setDeliveredRecords] = useState<any[]>([]);

  // Dialog & Edit States
  const [isForDeliveryDialogOpen, setIsForDeliveryDialogOpen] = useState(false);
  const [isDeliveredDialogOpen, setIsDeliveredDialogOpen] = useState(false);
  const [editingForDeliveryId, setEditingForDeliveryId] = useState<string | null>(null);
  const [editingDeliveredId, setEditingDeliveredId] = useState<string | null>(null);

  // Forms
  const [forDeliveryForm, setForDeliveryForm] = useState({ type: 'Office Supplies', poNumber: '', poDate: '', supplier: '' });
  const [deliveredForm, setDeliveredForm] = useState({ poNumber: '', poDate: '', supplier: '', receiptNumber: '', dateDelivered: '', type: '' });
  
  // Items State
  const [currentItem, setCurrentItem] = useState({ itemDescription: '', qty: 0, unit: '', price: 0 });
  const [pendingItems, setPendingItems] = useState<any[]>([]);

  // --- SAFE CURRENCY FORMATTER ---
  const formatCurrency = (amount: any) => {
    const validNumber = Number(amount) || 0;
    return validNumber.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // --- AUTOMATION RULES (DELIVERED MODAL) ---
  const handlePOSelect = (selectedPO: string) => {
    const poDetails = forDeliveryRecords.find(r => r.poNumber === selectedPO);
    if (poDetails) {
      setDeliveredForm({
        ...deliveredForm, poNumber: selectedPO, poDate: poDetails.poDate, supplier: poDetails.supplier, type: poDetails.type
      });
      // Reset current item so the user has to pick a new one from the dropdown
      setCurrentItem({ itemDescription: '', qty: 0, unit: '', price: 0 });
    }
  };

  const availableItemsForSelectedPO = useMemo(() => {
    const po = forDeliveryRecords.find(r => r.poNumber === deliveredForm.poNumber);
    return po ? po.items : [];
  }, [deliveredForm.poNumber, forDeliveryRecords]);

  const handleItemSelect = (desc: string) => {
    const itemDetails = availableItemsForSelectedPO.find((i: any) => i.itemDescription === desc);
    if (itemDetails) {
      setCurrentItem({ itemDescription: desc, qty: itemDetails.qty, unit: itemDetails.unit, price: itemDetails.price });
    }
  };

  // --- ITEM MANAGEMENT ---
  const handleAddPendingItem = () => {
    if (!currentItem.itemDescription || currentItem.qty <= 0 || currentItem.price <= 0) {
      toast.error("Please fill all item fields properly");
      return;
    }
    setPendingItems([...pendingItems, { 
      itemDescription: currentItem.itemDescription, 
      qty: currentItem.qty, 
      unit: currentItem.unit, 
      price: currentItem.price, 
      amount: currentItem.qty * currentItem.price 
    }]);
    setCurrentItem({ itemDescription: '', qty: 0, unit: '', price: 0 });
  };

  const handleRemovePendingItem = (index: number) => {
    setPendingItems(pendingItems.filter((_, i) => i !== index));
  };

  const resetForms = () => {
    setForDeliveryForm({ type: 'Office Supplies', poNumber: '', poDate: '', supplier: '' });
    setDeliveredForm({ poNumber: '', poDate: '', supplier: '', receiptNumber: '', dateDelivered: '', type: '' });
    setCurrentItem({ itemDescription: '', qty: 0, unit: '', price: 0 });
    setPendingItems([]);
    setEditingForDeliveryId(null);
    setEditingDeliveredId(null);
  };

  // --- FOR DELIVERY (CRUD) ---
  const submitForDelivery = (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingItems.length === 0) return toast.error("Add at least one item.");
    
    if (editingForDeliveryId) {
      setForDeliveryRecords(forDeliveryRecords.map(r => 
        r.id === editingForDeliveryId ? { ...r, ...forDeliveryForm, items: pendingItems } : r
      ));
      toast.success("Procurement updated successfully");
    } else {
      const newRecord = { id: Date.now().toString(), ...forDeliveryForm, items: pendingItems };
      setForDeliveryRecords([...forDeliveryRecords, newRecord]);
      toast.success("Procurement recorded For Delivery");
    }
    
    setIsForDeliveryDialogOpen(false);
    resetForms();
  };

  const handleEditForDelivery = (record: any) => {
    setEditingForDeliveryId(record.id);
    setForDeliveryForm({ type: record.type, poNumber: record.poNumber, poDate: record.poDate, supplier: record.supplier });
    
    setPendingItems([...record.items]);
    setIsForDeliveryDialogOpen(true);
  };

  const handleDeleteForDelivery = (id: string) => {
    if(confirm("Are you sure you want to delete this Entire PO?")) {
      setForDeliveryRecords(forDeliveryRecords.filter(r => r.id !== id));
      toast.success("Record deleted");
    }
  };

  // --- DELIVERED (CRUD) ---
  const submitDelivered = (e: React.FormEvent) => {
    e.preventDefault();
    if (pendingItems.length === 0) return toast.error("Add at least one item.");

    const newDeliveries = pendingItems.map(item => ({
      id: editingDeliveredId && pendingItems.length === 1 ? editingDeliveredId : Date.now().toString() + Math.random(),
      dateDelivered: deliveredForm.dateDelivered,
      type: deliveredForm.type,
      itemDescription: item.itemDescription,
      poNumber: deliveredForm.poNumber,
      poDate: deliveredForm.poDate,
      receiptNumber: deliveredForm.receiptNumber,
      supplier: deliveredForm.supplier,
      qty: item.qty,
      unit: item.unit,
      price: item.price,
      amount: item.amount || (item.qty * item.price)
    }));

    if (editingDeliveredId) {
      const filtered = deliveredRecords.filter(d => d.id !== editingDeliveredId);
      setDeliveredRecords([...filtered, ...newDeliveries]);
      toast.success("Delivery record updated");
    } else {
      setDeliveredRecords([...deliveredRecords, ...newDeliveries]);
      toast.success("Supplies Recorded as Delivered");
    }
    
    setIsDeliveredDialogOpen(false);
    resetForms();
  };

  const handleEditDelivered = (record: any) => {
    setEditingDeliveredId(record.id);
    setDeliveredForm({
      poNumber: record.poNumber || '',
      poDate: record.poDate || '',
      supplier: record.supplier || '',
      receiptNumber: record.receiptNumber || '',
      dateDelivered: record.dateDelivered || '',
      type: record.type || ''
    });
    setPendingItems([{
      itemDescription: record.itemDescription || '',
      qty: record.qty || 0,
      unit: record.unit || '',
      price: record.price || 0,
      amount: record.amount || (record.qty * record.price)
    }]);
    setIsDeliveredDialogOpen(true);
  };

  const handleDeleteDelivered = (id: string) => {
    if(confirm("Are you sure you want to delete this delivery entry?")) {
      setDeliveredRecords(deliveredRecords.filter(d => d.id !== id));
      toast.success("Entry deleted");
    }
  };

  return (
    <div className="space-y-6">
      {/* Clean Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Delivery Management</h2>
        <p className="text-gray-600 mt-1">Manage procurement from order to distribution</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-4 bg-gray-100 p-1 rounded-lg mb-6">
          <TabsTrigger value="for-delivery" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white transition-all"><Truck className="w-4 h-4 mr-2"/> For Delivery</TabsTrigger>
          <TabsTrigger value="delivered" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white transition-all"><Package className="w-4 h-4 mr-2"/> Delivered</TabsTrigger>
          <TabsTrigger value="distributed" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white transition-all"><CheckCircle className="w-4 h-4 mr-2"/> Distributed</TabsTrigger>
          <TabsTrigger value="in-stock" className="data-[state=active]:bg-gray-800 data-[state=active]:text-white transition-all"><Boxes className="w-4 h-4 mr-2"/> In Stock</TabsTrigger>
        </TabsList>

        {/* ------------------------------------------------------------------------- */}
        {/* TAB 1: FOR DELIVERY */}
        {/* ------------------------------------------------------------------------- */}
        <TabsContent value="for-delivery">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>For Delivery Records</CardTitle>
                <Dialog open={isForDeliveryDialogOpen} onOpenChange={(open) => { setIsForDeliveryDialogOpen(open); if(!open) resetForms(); }}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="mr-2 h-4 w-4" /> Supplies for Delivery
                    </Button>
                  </DialogTrigger>
                  {/* WIDENED MODAL TO 900px TO PREVENT SQUISHING */}
                  <DialogContent className="max-w-[900px]">
                    <DialogHeader><DialogTitle>{editingForDeliveryId ? 'Edit Procurement Record' : 'Supplies for Delivery (Procured)'}</DialogTitle></DialogHeader>
                    <form onSubmit={submitForDelivery} className="space-y-6">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-gray-50/50 p-4 rounded-lg border border-gray-100">
                        <div className="space-y-2">
                          <Label>Type of Delivery</Label>
                          <Select value={forDeliveryForm.type || undefined} onValueChange={(val) => setForDeliveryForm({...forDeliveryForm, type: val})}>
                            <SelectTrigger className="bg-white"><SelectValue/></SelectTrigger>
                            <SelectContent><SelectItem value="Office Supplies">Office Supplies</SelectItem><SelectItem value="Equipment">Equipment</SelectItem></SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>PO Number</Label>
                          <Input required value={forDeliveryForm.poNumber} onChange={e => setForDeliveryForm({...forDeliveryForm, poNumber: e.target.value})} placeholder="PO-2026-001" className="bg-white" />
                        </div>
                        <div className="space-y-2">
                          <Label>PO Date</Label>
                          <Input required type="date" value={forDeliveryForm.poDate} onChange={e => setForDeliveryForm({...forDeliveryForm, poDate: e.target.value})} className="bg-white" />
                        </div>
                        <div className="space-y-2">
                          <Label>Supplier</Label>
                          <Input required value={forDeliveryForm.supplier} onChange={e => setForDeliveryForm({...forDeliveryForm, supplier: e.target.value})} placeholder="Supplier Name" className="bg-white" />
                        </div>
                      </div>
                      
                      <div className="space-y-4 border-t pt-4">
                        <h4 className="font-semibold text-gray-700">Add Items</h4>
                        {/* FIXED GRID: 12 Columns total so they stay perfectly in line */}
                        <div className="grid grid-cols-12 gap-3 items-end">
                          <div className="col-span-4 space-y-1">
                            <Label className="text-xs">Item Description</Label>
                            <Input value={currentItem.itemDescription} onChange={e => setCurrentItem({...currentItem, itemDescription: e.target.value})} placeholder="e.g. Bond Paper" />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <Label className="text-xs">Qty</Label>
                            <Input type="number" value={currentItem.qty || ''} onChange={e => setCurrentItem({...currentItem, qty: Number(e.target.value)})} />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <Label className="text-xs">Unit</Label>
                            <Input value={currentItem.unit} onChange={e => setCurrentItem({...currentItem, unit: e.target.value})} placeholder="e.g. Ream" />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <Label className="text-xs">Unit Price (₱)</Label>
                            <Input type="number" value={currentItem.price || ''} onChange={e => setCurrentItem({...currentItem, price: Number(e.target.value)})} />
                          </div>
                          <div className="col-span-2">
                            <Button type="button" onClick={handleAddPendingItem} className="w-full bg-gray-800 hover:bg-gray-900 text-white">Add Item</Button>
                          </div>
                        </div>

                        {pendingItems.length > 0 && (
                          <Table className="border mt-4">
                            <TableHeader className="bg-gray-50">
                              <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Qty</TableHead>
                                <TableHead>Unit Price</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead></TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {pendingItems.map((pi, i) => (
                                <TableRow key={i}>
                                  <TableCell className="text-sm">{pi.itemDescription}</TableCell>
                                  <TableCell>{pi.qty} {pi.unit}</TableCell>
                                  <TableCell>₱{formatCurrency(pi.price)}</TableCell>
                                  <TableCell className="font-medium">₱{formatCurrency((Number(pi.qty) || 0) * (Number(pi.price) || 0))}</TableCell>
                                  <TableCell className="text-right">
                                    <Button type="button" variant="ghost" size="sm" onClick={() => handleRemovePendingItem(i)} className="text-red-500 hover:text-red-700 h-6 w-6 p-0"><X className="h-4 w-4"/></Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        )}
                      </div>
                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setIsForDeliveryDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-green-600 px-8">{editingForDeliveryId ? 'Update Record' : 'Save Record'}</Button>
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
                    <TableHead>Type</TableHead>
                    <TableHead>Item Description</TableHead>
                    <TableHead>PO Number</TableHead>
                    <TableHead>PO Date</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forDeliveryRecords.flatMap(record => 
                    record.items.map((item, idx) => (
                      <TableRow key={`${record.id}-${idx}`}>
                        <TableCell><Badge variant="outline">{record.type}</Badge></TableCell>
                        <TableCell className="max-w-[200px] whitespace-normal break-words font-medium">{item.itemDescription}</TableCell>
                        <TableCell>{record.poNumber}</TableCell>
                        <TableCell>{record.poDate}</TableCell>
                        <TableCell>{record.supplier}</TableCell>
                        <TableCell>{item.qty}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell>₱{formatCurrency(item.price)}</TableCell>
                        <TableCell className="font-semibold text-gray-700">₱{formatCurrency((Number(item.qty) || 0) * (Number(item.price) || 0))}</TableCell>
                        <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button size="sm" variant="outline" onClick={() => handleEditForDelivery(record)}><Edit className="h-4 w-4" /></Button>
                              <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteForDelivery(record.id)}><Trash2 className="h-4 w-4" /></Button>
                            </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {forDeliveryRecords.length === 0 && (
                    <TableRow><TableCell colSpan={10} className="text-center py-8 text-gray-500">No records found</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------------- */}
        {/* TAB 2: DELIVERED (Supplies Delivered) */}
        {/* ------------------------------------------------------------------------- */}
        <TabsContent value="delivered">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Delivered Records</CardTitle>
                <Dialog open={isDeliveredDialogOpen} onOpenChange={(open) => { setIsDeliveredDialogOpen(open); if(!open) resetForms(); }}>
                  <DialogTrigger asChild>
                    <Button className="bg-green-600 hover:bg-green-700">
                      <Plus className="mr-2 h-4 w-4" /> Record Supplies
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-[900px]">
                    <DialogHeader><DialogTitle>{editingDeliveredId ? 'Edit Delivered Record' : 'Record Supplies (Delivered)'}</DialogTitle></DialogHeader>
                    <form onSubmit={submitDelivered} className="space-y-6">
                      <div className="grid grid-cols-2 gap-x-8 gap-y-4 bg-blue-50/50 p-4 rounded-lg border border-blue-100">
                        <div className="space-y-2">
                          <Label>PO Number <span className="text-red-500">*</span></Label>
                          <Select value={deliveredForm.poNumber || undefined} onValueChange={handlePOSelect}>
                            <SelectTrigger className="bg-white"><SelectValue placeholder="Select from For Delivery" /></SelectTrigger>
                            <SelectContent>
                              {forDeliveryRecords.map(r => <SelectItem key={r.id} value={r.poNumber}>{r.poNumber} ({r.supplier})</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Supplier</Label>
                          <Input readOnly value={deliveredForm.supplier} className="bg-gray-100 cursor-not-allowed" placeholder="Auto-filled" />
                        </div>
                        <div className="space-y-2">
                          <Label>PO Date</Label>
                          <Input readOnly type="date" value={deliveredForm.poDate} className="bg-gray-100 cursor-not-allowed" />
                        </div>
                        <div className="space-y-2">
                          <Label>Receipt Number <span className="text-red-500">*</span></Label>
                          <Input required value={deliveredForm.receiptNumber} onChange={e => setDeliveredForm({...deliveredForm, receiptNumber: e.target.value})} placeholder="e.g. RN-001" className="bg-white" />
                        </div>
                        <div className="space-y-2 col-span-2 md:col-span-1">
                          <Label>Date Delivered <span className="text-red-500">*</span></Label>
                          <Input required type="date" value={deliveredForm.dateDelivered} onChange={e => setDeliveredForm({...deliveredForm, dateDelivered: e.target.value})} className="bg-white" />
                        </div>
                      </div>

                      <div className="space-y-4 border-t pt-4">
                        <h4 className="font-semibold text-gray-700">Items from PO</h4>
                        <div className="grid grid-cols-12 gap-3 items-end">
                          <div className="col-span-5 space-y-1">
                            <Label className="text-xs">Item Description (Filtered)</Label>
                            <Select 
                              key={deliveredForm.poNumber || 'item-select'} 
                              disabled={!deliveredForm.poNumber} 
                              value={currentItem.itemDescription || undefined} 
                              onValueChange={handleItemSelect}
                            >
                              <SelectTrigger><SelectValue placeholder="Select Item..." /></SelectTrigger>
                              <SelectContent>
                                {availableItemsForSelectedPO.map((item: any, idx: number) => {
                                  const desc = item.itemDescription || `Unknown Item ${idx}`;
                                  return (
                                    <SelectItem key={idx} value={desc}>{desc}</SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="col-span-2 space-y-1">
                            <Label className="text-xs">Qty</Label>
                            <Input type="number" value={currentItem.qty || ''} onChange={e => setCurrentItem({...currentItem, qty: Number(e.target.value)})} />
                          </div>
                          <div className="col-span-2 space-y-1">
                            <Label className="text-xs">Unit Price</Label>
                            <Input type="number" value={currentItem.price || ''} onChange={e => setCurrentItem({...currentItem, price: Number(e.target.value)})} />
                          </div>
                          <div className="col-span-3">
                            <Button type="button" onClick={handleAddPendingItem} className="w-full bg-blue-600 hover:bg-blue-700 text-white">Add to Delivery</Button>
                          </div>
                        </div>

                        {pendingItems.length > 0 && (
                          <Table className="border mt-4">
                            <TableHeader className="bg-gray-50"><TableRow><TableHead>Item</TableHead><TableHead>Qty</TableHead><TableHead>Unit Price</TableHead><TableHead>Amount</TableHead><TableHead></TableHead></TableRow></TableHeader>
                            <TableBody>{pendingItems.map((pi, i) => (
                              <TableRow key={i}>
                                <TableCell className="text-sm">{pi.itemDescription}</TableCell>
                                <TableCell>{pi.qty} {pi.unit}</TableCell>
                                <TableCell>₱{formatCurrency(pi.price)}</TableCell>
                                <TableCell className="font-medium">₱{formatCurrency(pi.amount)}</TableCell>
                                <TableCell className="text-right">
                                  <Button type="button" variant="ghost" size="sm" onClick={() => handleRemovePendingItem(i)} className="text-red-500 hover:text-red-700 h-6 w-6 p-0"><X className="h-4 w-4"/></Button>
                                </TableCell>
                              </TableRow>
                            ))}</TableBody>
                          </Table>
                        )}
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button type="button" variant="outline" onClick={() => setIsDeliveredDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" className="bg-green-600 px-8">{editingDeliveredId ? 'Update Record' : 'Record Supplies'}</Button>
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
                    <TableHead>Date Delivered</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Item Description</TableHead>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Receipt No.</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Unit Price</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deliveredRecords.length === 0 ? (
                    <TableRow><TableCell colSpan={11} className="text-center py-8 text-gray-500">No deliveries recorded yet</TableCell></TableRow>
                  ) : (
                    deliveredRecords.map((d) => (
                      <TableRow key={d.id}>
                        <TableCell>{d.dateDelivered}</TableCell>
                        <TableCell><Badge variant="outline" className="bg-blue-50 text-blue-700">{d.type}</Badge></TableCell>
                        <TableCell className="max-w-[200px] whitespace-normal break-words font-medium">{d.itemDescription}</TableCell>
                        <TableCell>{d.poNumber}</TableCell>
                        <TableCell>{d.receiptNumber}</TableCell>
                        <TableCell>{d.supplier}</TableCell>
                        <TableCell>{d.qty}</TableCell>
                        <TableCell>{d.unit}</TableCell>
                        <TableCell>₱{formatCurrency(d.price)}</TableCell>
                        <TableCell className="font-semibold text-green-700">₱{formatCurrency(d.amount)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button size="sm" variant="outline" onClick={() => handleEditDelivered(d)}><Edit className="h-4 w-4" /></Button>
                            <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteDelivered(d.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------------- */}
        {/* TAB 3: DISTRIBUTED (Placeholder UI) */}
        {/* ------------------------------------------------------------------------- */}
        <TabsContent value="distributed">
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              <CheckCircle className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Distributed Records</h3>
              <p>Items distributed to divisions will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ------------------------------------------------------------------------- */}
        {/* TAB 4: IN STOCK (Placeholder UI) */}
        {/* ------------------------------------------------------------------------- */}
        <TabsContent value="in-stock">
          <Card>
            <CardContent className="p-12 text-center text-gray-500">
              <Boxes className="w-12 h-12 mx-auto text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900">In Stock Records</h3>
              <p>Items delivered but not yet distributed will appear here.</p>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}