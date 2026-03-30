import { useState, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Plus, Edit, Trash2, Download } from 'lucide-react';
import { PORecord } from '../../types';
import { toast } from 'sonner';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

export function PurchaseOrder() {
  const { poRecords, addPORecord, updatePORecord, deletePORecord } = useData();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    poNo: '',
    supplier: '',
    poDate: '',
    invoiceNo: '',
    remarks: '',
    status: 'pending' as 'pending' | 'approved' | 'rejected' | 'delivered',
  });

  const resetForm = useCallback(() => {
    setEditingId(null);
    setFormData({
      poNo: '',
      supplier: '',
      poDate: '',
      invoiceNo: '',
      remarks: '',
      status: 'pending',
    });
  }, []);

  const handleCreate = useCallback(() => {
    resetForm();
    setIsDialogOpen(true);
  }, [resetForm]);

  const handleEdit = useCallback((record: PORecord) => {
    setEditingId(record.id);
    setFormData({
      poNo: record.poNo,
      supplier: record.supplier,
      poDate: record.poDate,
      invoiceNo: record.invoiceNo,
      remarks: record.remarks,
      status: record.status,
    });
    setIsDialogOpen(true);
  }, []);

  const handleSave = async () => {
    if (!formData.poNo || !formData.supplier || !formData.poDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      if (editingId) {
        await updatePORecord(editingId, formData);
        toast.success('Purchase Order updated successfully!');
      } else {
        await addPORecord(formData);
        toast.success('Purchase Order created successfully!');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to save Purchase Order');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this Purchase Order?')) {
      try {
        await deletePORecord(id);
        toast.success('Purchase Order deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete Purchase Order');
      }
    }
  };

  const handleExport = async () => {
    try {
      setIsDownloading(true);
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Purchase Orders');

      worksheet.columns = [
        { header: 'PO Number', key: 'poNo', width: 15 },
        { header: 'Supplier', key: 'supplier', width: 25 },
        { header: 'PO Date', key: 'poDate', width: 15 },
        { header: 'Invoice No', key: 'invoiceNo', width: 15 },
        { header: 'Status', key: 'status', width: 12 },
        { header: 'Remarks', key: 'remarks', width: 30 },
      ];

      poRecords.forEach((po) => {
        worksheet.addRow({
          poNo: po.poNo,
          supplier: po.supplier,
          poDate: po.poDate,
          invoiceNo: po.invoiceNo,
          status: po.status,
          remarks: po.remarks,
        });
      });

      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), 'purchase_orders.xlsx');
      toast.success('Purchase Orders exported successfully!');
    } catch (error) {
      toast.error('Failed to export Purchase Orders');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Purchase Orders</h1>
        <div className="flex gap-2">
          <Button onClick={handleExport} disabled={isDownloading}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate}>
                <Plus className="w-4 h-4 mr-2" />
                New PO
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingId ? 'Edit PO' : 'Create Purchase Order'}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="poNo">PO Number *</Label>
                  <Input
                    id="poNo"
                    value={formData.poNo}
                    onChange={(e) => setFormData({ ...formData, poNo: e.target.value })}
                    placeholder="e.g., PO-2024-001"
                  />
                </div>

                <div>
                  <Label htmlFor="supplier">Supplier *</Label>
                  <Input
                    id="supplier"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Supplier name"
                  />
                </div>

                <div>
                  <Label htmlFor="poDate">PO Date *</Label>
                  <Input
                    id="poDate"
                    type="date"
                    value={formData.poDate}
                    onChange={(e) => setFormData({ ...formData, poDate: e.target.value })}
                  />
                </div>

                <div>
                  <Label htmlFor="invoiceNo">Invoice Number</Label>
                  <Input
                    id="invoiceNo"
                    value={formData.invoiceNo}
                    onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                    placeholder="Invoice number"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="remarks">Remarks</Label>
                  <Input
                    id="remarks"
                    value={formData.remarks}
                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                    placeholder="Additional remarks"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave}>Save</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Purchase Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Invoice No</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Remarks</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {poRecords && poRecords.length > 0 ? (
                  poRecords.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.poNo}</TableCell>
                      <TableCell>{po.supplier}</TableCell>
                      <TableCell>{po.poDate}</TableCell>
                      <TableCell>{po.invoiceNo || '-'}</TableCell>
                      <TableCell>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            po.status === 'approved'
                              ? 'bg-green-100 text-green-800'
                              : po.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : po.status === 'delivered'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {po.status.charAt(0).toUpperCase() + po.status.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>{po.remarks || '-'}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(po)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(po.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-600" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">
                      No Purchase Orders found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
