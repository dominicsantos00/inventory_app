import { useState, useCallback } from 'react';
import { useData } from '../../context/DataContext';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Card, CardContent } from '../../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Plus, Edit, Trash2, Download, FileText } from 'lucide-react';
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
    setFormData({ poNo: '', supplier: '', poDate: '', invoiceNo: '', remarks: '', status: 'pending' });
  }, []);

  const handleCreate = useCallback(() => {
    resetForm();
    setIsDialogOpen(true);
  }, [resetForm]);

  const handleEdit = useCallback((record: PORecord) => {
    setEditingId(record.id);
    setFormData({
      poNo: record.poNo, supplier: record.supplier, poDate: record.poDate,
      invoiceNo: record.invoiceNo, remarks: record.remarks, status: record.status,
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
        toast.success('Purchase Order updated');
      } else {
        await addPORecord(formData);
        toast.success('Purchase Order created');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to save Purchase Order');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this Purchase Order permanently?')) {
      try {
        await deletePORecord(id);
        toast.success('Purchase Order deleted');
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
      poRecords.forEach((po) => worksheet.addRow(po));
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), 'purchase_orders.xlsx');
      toast.success('Export successful');
    } catch (error) {
      toast.error('Failed to export');
    } finally {
      setIsDownloading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-amber-50 text-amber-700 border-amber-200',
      approved: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      delivered: 'bg-blue-50 text-blue-700 border-blue-200',
      rejected: 'bg-rose-50 text-rose-700 border-rose-200',
    };
    return <Badge variant="outline" className={`font-medium capitalize ${styles[status]}`}>{status}</Badge>;
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Purchase Orders</h2>
          <p className="text-slate-500 text-sm mt-1">Create, track, and manage procurement orders.</p>
        </div>
        
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport} disabled={isDownloading} className="bg-white text-slate-700 border-slate-200 shadow-sm">
            <Download className="w-4 h-4 mr-2" /> Export Excel
          </Button>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={handleCreate} className="bg-green-600 hover:bg-green-700 text-white shadow-sm">
                <Plus className="w-4 h-4 mr-2" /> New PO
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl border-slate-200 shadow-lg">
              <DialogHeader>
                <DialogTitle className="text-xl">{editingId ? 'Edit Purchase Order' : 'Create Purchase Order'}</DialogTitle>
              </DialogHeader>
              
              <div className="grid grid-cols-2 gap-5 mt-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-700">PO Number <span className="text-red-500">*</span></Label>
                  <Input value={formData.poNo} onChange={(e) => setFormData({ ...formData, poNo: e.target.value })} placeholder="PO-2024-001" className="border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700">Supplier <span className="text-red-500">*</span></Label>
                  <Input value={formData.supplier} onChange={(e) => setFormData({ ...formData, supplier: e.target.value })} placeholder="Enter supplier name" className="border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700">PO Date <span className="text-red-500">*</span></Label>
                  <Input type="date" value={formData.poDate} onChange={(e) => setFormData({ ...formData, poDate: e.target.value })} className="border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700">Invoice Number</Label>
                  <Input value={formData.invoiceNo} onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })} placeholder="Optional" className="border-slate-200" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-700">Status</Label>
                  <Select value={formData.status} onValueChange={(val: any) => setFormData({ ...formData, status: val })}>
                    <SelectTrigger className="border-slate-200"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5 col-span-2">
                  <Label className="text-slate-700">Remarks</Label>
                  <Input value={formData.remarks} onChange={(e) => setFormData({ ...formData, remarks: e.target.value })} placeholder="Add any specific notes here..." className="border-slate-200" />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
                <Button variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-slate-600">Cancel</Button>
                <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">Save Purchase Order</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">PO Number</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {poRecords && poRecords.length > 0 ? (
                poRecords.map((po) => (
                  <TableRow key={po.id} className="group hover:bg-slate-50 transition-colors">
                    <TableCell className="font-medium text-slate-900">{po.poNo}</TableCell>
                    <TableCell className="text-slate-600">{po.supplier}</TableCell>
                    <TableCell className="text-slate-600">{po.poDate}</TableCell>
                    <TableCell>{getStatusBadge(po.status)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => handleEdit(po)} className="h-8 w-8 text-slate-500 hover:text-green-600 hover:bg-green-50">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDelete(po.id)} className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-slate-500">
                     <div className="flex flex-col items-center justify-center">
                        <FileText className="h-8 w-8 text-slate-300 mb-2" />
                        <p>No Purchase Orders found.</p>
                      </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}