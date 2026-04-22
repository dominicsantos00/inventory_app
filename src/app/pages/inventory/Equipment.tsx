import React, { useState, useMemo } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Search, Monitor, Image as ImageIcon, Plus, Edit, Trash2, Printer, FileBox, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

export function Equipment() {
  // POINTING TO THE NEW deliveredRecords TABLE!
  const { deliveredRecords, equipmentRecords, addEquipmentRecord, deleteEquipmentRecord } = useData();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('ics');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const [formData, setFormData] = useState({
    type: 'ICS',
    formNumber: '',
    propertyNumber: '',
    poNumber: '',
    supplier: '',
    accountablePerson: '',
    accountablePosition: '',
    releaserName: '',
    releaserPosition: '',
    dateAcquired: '',
    itemDescription: '',
    quantity: 1,
    unit: 'Unit',
    amount: 0,
    imageUrl: '',
    status: 'Active'
  });

  // Only pull items that have physically arrived (Delivered)
  const equipmentDeliveries = useMemo(() => (deliveredRecords || []).filter(d => d.type === 'Equipment'), [deliveredRecords]);

  const handlePOSelect = (poNum: string) => {
    const delivery = equipmentDeliveries.find(d => d.poNumber === poNum);
    if (delivery) {
      setFormData(prev => ({
        ...prev,
        poNumber: delivery.poNumber,
        supplier: delivery.supplier,
        itemDescription: delivery.itemDescription,
        unit: delivery.unit,
        amount: delivery.price
      }));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, imageUrl: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Safety check to ensure they selected a PO
    if (!formData.poNumber) {
      toast.error('Please select a Source PO Number first!');
      return;
    }

    try {
      await addEquipmentRecord(formData);
      toast.success(`${formData.type} Record Created Successfully!`);
      setIsDialogOpen(false);
      setFormData({ ...formData, formNumber: '', propertyNumber: '', imageUrl: '' });
    } catch (error) {
      toast.error('Failed to save equipment record');
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this equipment record?")) {
       try {
         await deleteEquipmentRecord(id);
         toast.success("Record deleted");
       } catch (error) {
         toast.error("Failed to delete");
       }
    }
  };

  const filteredList = (equipmentRecords || []).filter(eq => 
    eq.type.toLowerCase() === activeTab.toLowerCase() &&
    (eq.itemDescription.toLowerCase().includes(searchQuery.toLowerCase()) || 
     eq.accountablePerson.toLowerCase().includes(searchQuery.toLowerCase()) ||
     eq.propertyNumber.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatCurrency = (amount: any) => Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Equipment Accountability</h2>
          <p className="text-slate-500 text-sm mt-1">Manage Inventory Custodian Slips (ICS) and Property Acknowledgement Receipts (PAR).</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input placeholder="Search property, item, or person..." className="pl-9 bg-white border-slate-200" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-slate-100 p-1.5 rounded-xl h-auto border border-slate-200 shadow-sm">
            <TabsTrigger value="ics" className="flex items-center py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm transition-all font-bold tracking-wide">
              <FileBox className="w-4 h-4 mr-2" /> ICS (Semi-Expendable)
            </TabsTrigger>
            <TabsTrigger value="par" className="flex items-center py-2.5 rounded-lg data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm transition-all font-bold tracking-wide">
              <ShieldCheck className="w-4 h-4 mr-2" /> PAR (PPE Equipment)
            </TabsTrigger>
          </TabsList>

          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) setFormData({...formData, poNumber: '', itemDescription: '', supplier: ''}); }}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm w-full md:w-auto" onClick={() => setFormData(prev => ({...prev, type: activeTab.toUpperCase()}))}>
                <Plus className="mr-2 h-4 w-4" /> Issue New {activeTab.toUpperCase()}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl border-slate-200 shadow-xl overflow-hidden p-0 max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50 sticky top-0 z-10">
                <DialogTitle className="text-xl text-indigo-900">Create {formData.type} Form</DialogTitle>
              </div>
              <form onSubmit={handleSubmit} className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  
                  {/* Left Column: Image & Equipment Details */}
                  <div className="md:col-span-1 space-y-6">
                    <div className="space-y-2">
                      <Label className="text-slate-700 font-bold uppercase text-xs tracking-wider">Picture of Item</Label>
                      <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 flex flex-col items-center justify-center p-4 relative h-48 overflow-hidden group">
                        {formData.imageUrl ? (
                          <img src={formData.imageUrl} alt="Equipment" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="text-center">
                            <ImageIcon className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                            <span className="text-xs text-slate-500 font-medium">Click to upload image</span>
                          </div>
                        )}
                        <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-slate-700">Source PO Number</Label>
                      <Select value={formData.poNumber} onValueChange={handlePOSelect}>
                        <SelectTrigger className="bg-white border-slate-200"><SelectValue placeholder="Select equipment PO..." /></SelectTrigger>
                        <SelectContent>
                          {equipmentDeliveries.map(d => <SelectItem key={d.id} value={d.poNumber}>{d.poNumber} - {d.itemDescription}</SelectItem>)}
                          {equipmentDeliveries.length === 0 && <SelectItem value="none" disabled>No received equipment found.</SelectItem>}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-slate-700">Property Number <span className="text-red-500">*</span></Label>
                      <Input required value={formData.propertyNumber} onChange={e => setFormData({...formData, propertyNumber: e.target.value})} placeholder="e.g. PROP-2026-001" className="bg-white border-slate-200" />
                    </div>
                  </div>

                  {/* Right Column: Accountability Details */}
                  <div className="md:col-span-2 grid grid-cols-2 gap-5">
                    
                    <div className="col-span-2 border-b border-slate-100 pb-2 mb-2">
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Form Information</h4>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-slate-700">{formData.type} Number <span className="text-red-500">*</span></Label>
                      <Input required value={formData.formNumber} onChange={e => setFormData({...formData, formNumber: e.target.value})} placeholder={`e.g. ${formData.type}-2026-001`} className="border-slate-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-700">Date Acquired / Issued <span className="text-red-500">*</span></Label>
                      <Input required type="date" value={formData.dateAcquired} onChange={e => setFormData({...formData, dateAcquired: e.target.value})} className="border-slate-200" />
                    </div>

                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-slate-700">Item Description (Auto-filled from PO)</Label>
                      <Input readOnly value={formData.itemDescription} className="bg-slate-50 border-slate-200 text-slate-600" placeholder="Awaiting PO selection..." />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-slate-700">Quantity</Label>
                      <Input type="number" required value={formData.quantity} onChange={e => setFormData({...formData, quantity: Number(e.target.value)})} className="border-slate-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-700">Unit Cost / Amount (₱)</Label>
                      <Input type="number" required value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} className="border-slate-200" />
                    </div>

                    <div className="col-span-2 border-b border-slate-100 pb-2 mt-4 mb-2">
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Signatories</h4>
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-slate-700">Accountable Person <span className="text-red-500">*</span></Label>
                      <Input required value={formData.accountablePerson} onChange={e => setFormData({...formData, accountablePerson: e.target.value})} placeholder="Name of receiver" className="border-slate-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-700">Position</Label>
                      <Input required value={formData.accountablePosition} onChange={e => setFormData({...formData, accountablePosition: e.target.value})} placeholder="Position/Title" className="border-slate-200" />
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-slate-700">Releaser Name <span className="text-red-500">*</span></Label>
                      <Input required value={formData.releaserName} onChange={e => setFormData({...formData, releaserName: e.target.value})} placeholder="Name of releaser" className="border-slate-200" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-slate-700">Releaser Position</Label>
                      <Input required value={formData.releaserPosition} onChange={e => setFormData({...formData, releaserPosition: e.target.value})} placeholder="Position/Title" className="border-slate-200" />
                    </div>

                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-6 mt-6 border-t border-slate-100">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-slate-600">Cancel</Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Issue {formData.type} Document</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Display Table for both Tabs */}
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-16"></TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Property Details</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Accountable Person</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Acquisition</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Amount</TableHead>
                  <TableHead className="text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredList.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-16 text-slate-500">
                      <Monitor className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                      <p className="text-lg font-medium text-slate-700">No {activeTab.toUpperCase()} records found</p>
                      <p className="text-sm mt-1">Issue a new property receipt to see it listed here.</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredList.map((eq) => (
                    <TableRow key={eq.id} className="group hover:bg-slate-50 transition-colors">
                      <TableCell className="py-3">
                        <div className="h-12 w-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center">
                          {eq.imageUrl ? <img src={eq.imageUrl} alt="Item" className="object-cover w-full h-full" /> : <ImageIcon size={20} className="text-slate-400" />}
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-900">{eq.itemDescription}</span>
                          <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md w-fit mt-1 border border-indigo-100">
                            {eq.formNumber} • Prop: {eq.propertyNumber}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col">
                          <span className="font-medium text-slate-800">{eq.accountablePerson}</span>
                          <span className="text-xs text-slate-500">{eq.accountablePosition}</span>
                        </div>
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700">{new Date(eq.dateAcquired).toLocaleDateString()}</span>
                          <span className="text-xs text-slate-500">PO: {eq.poNumber}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <div className="flex flex-col items-end">
                          <span className="font-bold text-slate-900">₱{formatCurrency(eq.amount)}</span>
                          <span className="text-xs text-slate-500">{eq.quantity} {eq.unit}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-3">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"><Printer className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"><Edit className="w-4 h-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(eq.id)} className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Tabs>
    </div>
  );
}