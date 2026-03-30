import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useData } from '../../context/DataContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Plus, Edit, Search, Truck, Trash2, ChevronDown } from 'lucide-react';
import { DeliveryItem } from '../../types';
import { toast } from 'sonner';

type DeliveryType = 'Office Supplies' | 'Equipment';

type PendingDeliveryItem = {
  item: string;
  itemDescription: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export function DeliveryPage() {
  const { deliveries, addDelivery, updateDelivery, deleteDelivery, ssnItems } = useData();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<DeliveryItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [ssnSearchTerm, setSsnSearchTerm] = useState('');
  const [showSSNDropdown, setShowSSNDropdown] = useState(false);

  const ssnDropdownRef = useRef<HTMLDivElement | null>(null);

  const [formData, setFormData] = useState({
    type: 'Office Supplies' as DeliveryType,
    date: '',
    poNumber: '',
    poDate: '',
    supplier: '',
    receiptNumber: '',
  });

  const [currentItem, setCurrentItem] = useState({
    item: '',
    itemDescription: '',
    unit: '',
    quantity: 0,
    unitPrice: 0,
  });

  const [deliveryItems, setDeliveryItems] = useState<PendingDeliveryItem[]>([]);

  const handleTypeChange = (type: DeliveryType) => {
    setFormData({ ...formData, type });
    setCurrentItem({
      item: '',
      itemDescription: '',
      unit: '',
      quantity: 0,
      unitPrice: 0,
    });
    setDeliveryItems([]);
    setSsnSearchTerm('');
    setShowSSNDropdown(false);
  };

  const handleItemSelect = (itemCode: string) => {
    const ssnItem = ssnItems.find((item) => item.code === itemCode);

    if (ssnItem) {
      setCurrentItem((prev) => ({
        ...prev,
        item: ssnItem.code,
        itemDescription: ssnItem.description,
        unit: ssnItem.unit,
      }));
      setSsnSearchTerm(ssnItem.description);
      setShowSSNDropdown(false);
    }
  };

  const resetCurrentItem = () => {
    setCurrentItem({
      item: '',
      itemDescription: '',
      unit: '',
      quantity: 0,
      unitPrice: 0,
    });
    setSsnSearchTerm('');
    setShowSSNDropdown(false);
  };

  const currentItemTotal = useMemo(() => {
    return (currentItem.quantity || 0) * (currentItem.unitPrice || 0);
  }, [currentItem.quantity, currentItem.unitPrice]);

  const grandTotal = useMemo(() => {
    return deliveryItems.reduce((sum, item) => sum + item.totalPrice, 0);
  }, [deliveryItems]);

  const filteredSSNItems = useMemo(() => {
    const term = ssnSearchTerm.trim().toLowerCase();

    if (!term) return ssnItems;

    return ssnItems.filter((item) =>
      item.description.trim().toLowerCase().startsWith(term)
    );
  }, [ssnItems, ssnSearchTerm]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        ssnDropdownRef.current &&
        !ssnDropdownRef.current.contains(event.target as Node)
      ) {
        setShowSSNDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const addItemToList = () => {
    if (!currentItem.itemDescription.trim()) {
      toast.error('Please select or enter an item description');
      return;
    }

    if (!currentItem.unit.trim()) {
      toast.error('Please enter unit');
      return;
    }

    if (!currentItem.quantity || currentItem.quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }

    if (!currentItem.unitPrice || currentItem.unitPrice <= 0) {
      toast.error('Please enter a valid unit price');
      return;
    }

    const newItem: PendingDeliveryItem = {
      item: currentItem.item,
      itemDescription: currentItem.itemDescription,
      unit: currentItem.unit,
      quantity: currentItem.quantity,
      unitPrice: currentItem.unitPrice,
      totalPrice: currentItem.quantity * currentItem.unitPrice,
    };

    setDeliveryItems((prev) => [...prev, newItem]);
    resetCurrentItem();
    toast.success('Item added');
  };

  const removePendingItem = (index: number) => {
    setDeliveryItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (editingDelivery) {
      try {
        await updateDelivery(editingDelivery.id, {
          ...editingDelivery,
          ...formData,
          item: currentItem.item,
          itemDescription: currentItem.itemDescription,
          unit: currentItem.unit,
          quantity: currentItem.quantity,
          unitPrice: currentItem.unitPrice,
        });
        toast.success('Delivery updated successfully');
      } catch (error) {
        toast.error('Failed to update delivery');
        console.error('Error updating delivery:', error);
        return;
      }
      setIsDialogOpen(false);
      resetForm();
      return;
    }

    if (deliveryItems.length === 0) {
      toast.error('Please add at least one item');
      return;
    }

    try {
      await Promise.all(
        deliveryItems.map((item) =>
          addDelivery({
            ...formData,
            type: formData.type,
            date: formData.date,
            poNumber: formData.poNumber,
            poDate: formData.poDate,
            supplier: formData.supplier,
            receiptNumber: formData.receiptNumber,
            item: item.item,
            itemDescription: item.itemDescription,
            unit: item.unit,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            remarks: '',
          })
        )
      );
      
      toast.success('Delivery recorded successfully');
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to record delivery');
      console.error('Error adding delivery:', error);
    }
  };

  const handleEdit = (delivery: DeliveryItem) => {
    setEditingDelivery(delivery);

    setFormData({
      type: delivery.type as DeliveryType,
      date: delivery.date,
      poNumber: delivery.poNumber,
      poDate: delivery.poDate,
      supplier: delivery.supplier,
      receiptNumber: delivery.receiptNumber,
    });

    setCurrentItem({
      item: delivery.item,
      itemDescription: delivery.itemDescription || '',
      unit: delivery.unit,
      quantity: delivery.quantity,
      unitPrice: delivery.unitPrice,
    });

    setSsnSearchTerm(delivery.itemDescription || '');
    setDeliveryItems([]);
    setIsDialogOpen(true);
  };

  const resetForm = () => {
    setEditingDelivery(null);
    setFormData({
      type: 'Office Supplies',
      date: '',
      poNumber: '',
      poDate: '',
      supplier: '',
      receiptNumber: '',
    });
    resetCurrentItem();
    setDeliveryItems([]);
  };

  const handleDelete = async (deliveryId: string) => {
    if (window.confirm('Are you sure you want to delete this delivery record?')) {
      try {
        await deleteDelivery(deliveryId);
        toast.success('Delivery record deleted successfully');
      } catch (error) {
        toast.error('Failed to delete delivery record');
        console.error('Error deleting delivery:', error);
      }
    }
  };

  const filteredDeliveries = deliveries.filter(
    (delivery) =>
      delivery.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (delivery.itemDescription &&
        delivery.itemDescription.toLowerCase().includes(searchQuery.toLowerCase())) ||
      delivery.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Delivery (Stock In)</h2>
          <p className="mt-1 text-gray-600">Record and manage incoming deliveries</p>
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
              Add Delivery
            </Button>
          </DialogTrigger>

          <DialogContent className="w-[95vw] max-w-[900px] max-h-[88vh] overflow-hidden rounded-2xl p-0">
            <DialogHeader className="border-b px-6 py-4">
              <DialogTitle className="text-center text-xl font-semibold">
                {editingDelivery ? 'Edit Delivery' : 'Record New Delivery'}
              </DialogTitle>
            </DialogHeader>

            <div className="max-h-[calc(88vh-72px)] overflow-y-auto px-6 py-6">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="type">Type of Delivery</Label>
                    <Select value={formData.type} onValueChange={handleTypeChange}>
                      <SelectTrigger className="h-11">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Office Supplies">Office Supplies</SelectItem>
                        <SelectItem value="Equipment">Equipment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="date">Date Delivered</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="poNumber">PO Number</Label>
                    <Input
                      id="poNumber"
                      value={formData.poNumber}
                      onChange={(e) => setFormData({ ...formData, poNumber: e.target.value })}
                      placeholder="e.g., PO-2026-001"
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="poDate">PO Date</Label>
                    <Input
                      id="poDate"
                      type="date"
                      value={formData.poDate}
                      onChange={(e) => setFormData({ ...formData, poDate: e.target.value })}
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="supplier">Supplier</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier}
                      onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                      placeholder="Supplier name"
                      required
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receiptNumber">Receipt Number</Label>
                    <Input
                      id="receiptNumber"
                      value={formData.receiptNumber}
                      onChange={(e) => setFormData({ ...formData, receiptNumber: e.target.value })}
                      placeholder="e.g., RN-001"
                      required
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 rounded-xl border bg-gray-50 p-4 md:grid-cols-2">
                  {formData.type === 'Office Supplies' ? (
                    <>
                      <div className="space-y-2" ref={ssnDropdownRef}>
                        <Label htmlFor="ssnSearch">Item Description (SSN)</Label>

                        <div className="relative">
                          <Input
                            id="ssnSearch"
                            value={ssnSearchTerm}
                            onChange={(e) => {
                              setSsnSearchTerm(e.target.value);
                              setShowSSNDropdown(true);
                              setCurrentItem((prev) => ({
                                ...prev,
                                item: '',
                                itemDescription: e.target.value,
                                unit: '',
                              }));
                            }}
                            onFocus={() => setShowSSNDropdown(true)}
                            placeholder="Type item starting letter..."
                            className="h-11 pr-10"
                            autoComplete="off"
                          />
                          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />

                          {showSSNDropdown && (
                            <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
                              {filteredSSNItems.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-gray-500">
                                  No items found
                                </div>
                              ) : (
                                filteredSSNItems.map((item) => (
                                  <button
                                    key={item.id}
                                    type="button"
                                    onClick={() => handleItemSelect(item.code)}
                                    className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
                                  >
                                    {item.description}
                                  </button>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="unit">Unit (Auto-filled)</Label>
                        <Input
                          id="unit"
                          value={currentItem.unit}
                          readOnly
                          className="h-11 cursor-not-allowed bg-gray-200 text-gray-700"
                          placeholder="System auto-filled data"
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="itemDescription">Item Description</Label>
                        <Input
                          id="itemDescription"
                          value={currentItem.itemDescription}
                          onChange={(e) =>
                            setCurrentItem({
                              ...currentItem,
                              item: e.target.value,
                              itemDescription: e.target.value,
                            })
                          }
                          placeholder="Equipment description"
                          required={editingDelivery !== null}
                          className="h-11"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="unitManual">Unit</Label>
                        <Input
                          id="unitManual"
                          value={currentItem.unit}
                          onChange={(e) =>
                            setCurrentItem({
                              ...currentItem,
                              unit: e.target.value,
                            })
                          }
                          placeholder="e.g., Unit, Set, Piece"
                          required={editingDelivery !== null}
                          className="h-11"
                        />
                      </div>
                    </>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="quantity">Quantity</Label>
                    <Input
                      id="quantity"
                      type="number"
                      min="0"
                      step="1"
                      value={currentItem.quantity || ''}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          quantity: parseFloat(e.target.value) || 0,
                        })
                      }
                      required={editingDelivery !== null}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="unitPrice">Unit Price (₱)</Label>
                    <Input
                      id="unitPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={currentItem.unitPrice || ''}
                      onChange={(e) =>
                        setCurrentItem({
                          ...currentItem,
                          unitPrice: parseFloat(e.target.value) || 0,
                        })
                      }
                      required={editingDelivery !== null}
                      className="h-11"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3">
                  <span className="font-medium text-green-900">
                    {editingDelivery ? 'Total Amount:' : 'Current Item Total:'}
                  </span>
                  <span className="text-lg font-bold text-green-900">
                    ₱
                    {currentItemTotal.toLocaleString('en-PH', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                </div>

                {!editingDelivery && (
                  <div className="flex justify-end">
                    <Button
                      type="button"
                      onClick={addItemToList}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Item
                    </Button>
                  </div>
                )}

                {!editingDelivery && deliveryItems.length > 0 && (
                  <div className="space-y-3">
                    <div className="overflow-x-auto rounded-lg border">
                      <div className="min-w-[760px]">
                        <div className="grid grid-cols-[2.2fr_0.8fr_0.8fr_1fr_1fr_auto] gap-3 bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-700">
                          <div>Item Description</div>
                          <div>Unit</div>
                          <div>Qty</div>
                          <div>Unit Price</div>
                          <div>Total</div>
                          <div>Action</div>
                        </div>

                        <div className="divide-y">
                          {deliveryItems.map((item, index) => (
                            <div
                              key={index}
                              className="grid grid-cols-[2.2fr_0.8fr_0.8fr_1fr_1fr_auto] items-center gap-3 px-4 py-3 text-sm"
                            >
                              <div>{item.itemDescription}</div>
                              <div>{item.unit}</div>
                              <div>{item.quantity}</div>
                              <div>
                                ₱
                                {item.unitPrice.toLocaleString('en-PH', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                              <div className="font-semibold">
                                ₱
                                {item.totalPrice.toLocaleString('en-PH', {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 2,
                                })}
                              </div>
                              <div>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  onClick={() => removePendingItem(index)}
                                  className="border-red-200 text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                      <span className="font-medium text-emerald-900">Total Amount:</span>
                      <span className="text-xl font-bold text-emerald-900">
                        ₱
                        {grandTotal.toLocaleString('en-PH', {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex flex-col-reverse gap-2 pt-4 sm:flex-row sm:justify-end">
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
                  <Button type="submit" className="bg-green-600 hover:bg-green-700 sm:min-w-[180px]">
                    {editingDelivery ? 'Update Delivery' : 'Record Delivery'}
                  </Button>
                </div>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>All Deliveries ({deliveries.length})</CardTitle>
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search description, PO, etc..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
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
                {filteredDeliveries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="py-8 text-center text-gray-500">
                      <Truck className="mx-auto mb-2 h-12 w-12 text-gray-300" />
                      <p>No deliveries recorded yet</p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredDeliveries.map((delivery) => (
                    <TableRow key={delivery.id}>
                      <TableCell>{new Date(delivery.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            delivery.type === 'Office Supplies'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-purple-100 text-purple-700'
                          }
                        >
                          {delivery.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-medium">
                        {delivery.itemDescription || delivery.item}
                      </TableCell>
                      <TableCell>{delivery.poNumber}</TableCell>
                      <TableCell>{delivery.receiptNumber}</TableCell>
                      <TableCell>{delivery.supplier}</TableCell>
                      <TableCell>{delivery.quantity}</TableCell>
                      <TableCell>{delivery.unit}</TableCell>
                      <TableCell>
                        ₱
                        {delivery.unitPrice.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ₱
                        {delivery.totalPrice.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(delivery)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(delivery.id)}
                            className="border-red-600 text-red-600 hover:bg-red-600 hover:text-white"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
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