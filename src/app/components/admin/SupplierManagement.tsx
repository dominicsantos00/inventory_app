import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Search, Plus, Edit, Trash2, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export function SupplierManagement() {
  // LIVE DATABASE CONNECTION
  const { suppliers, addSupplier, updateSupplier, deleteSupplier } = useData();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    contact: ''
  });

  // Filter suppliers based on search
  const filteredSuppliers = (suppliers || []).filter(s => 
    s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.contact?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateSupplier(editingId, formData);
        toast.success('Supplier updated successfully');
      } else {
        await addSupplier(formData);
        toast.success('Supplier added successfully');
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast.error('Failed to save supplier to database');
    }
  };

  const handleEdit = (supplier: any) => {
    setEditingId(supplier.id);
    setFormData({
      name: supplier.name || '',
      contact: supplier.contact || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this supplier?')) {
      try {
        await deleteSupplier(id);
        toast.success('Supplier deleted successfully');
      } catch (error) {
        toast.error('Failed to delete supplier');
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', contact: '' });
  };

  return (
    <div className="space-y-6">
      {/* Header and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">Supplier Management</h2>
          <p className="text-slate-500 text-sm mt-1">Manage accredited suppliers for procurement deliveries.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input 
            placeholder="Search suppliers..." 
            className="pl-9 bg-white border-slate-200" 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
          />
        </div>
      </div>

      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100 flex flex-row justify-between items-center py-4">
          <CardTitle className="text-lg font-bold text-slate-900">Supplier Roster</CardTitle>
          
          <Dialog open={isDialogOpen} onOpenChange={(open) => { setIsDialogOpen(open); if(!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm h-9">
                <Plus className="mr-2 h-4 w-4" /> Add Supplier
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md border-slate-200 shadow-xl overflow-hidden p-0">
              <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                <DialogTitle className="text-xl text-slate-900">{editingId ? 'Edit Supplier' : 'Add New Supplier'}</DialogTitle>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-700">Supplier Name <span className="text-red-500">*</span></Label>
                  <Input 
                    id="name" 
                    required 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    placeholder="e.g. PhilCopy Corporation" 
                    className="border-slate-200" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact" className="text-slate-700">Contact Details</Label>
                  <Input 
                    id="contact" 
                    value={formData.contact} 
                    onChange={e => setFormData({...formData, contact: e.target.value})} 
                    placeholder="Phone number, email, or address" 
                    className="border-slate-200" 
                  />
                </div>
                <div className="flex justify-end gap-3 pt-6 mt-2 border-t border-slate-100">
                  <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-slate-600">Cancel</Button>
                  <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">{editingId ? 'Save Changes' : 'Add Supplier'}</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50 border-b border-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier Name</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Contact Information</TableHead>
                <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSuppliers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-12 text-slate-500">
                    <Building2 className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                    <p>No suppliers found.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredSuppliers.map((supplier) => (
                  <TableRow key={supplier.id} className="group hover:bg-slate-50 transition-colors">
                    <TableCell className="font-bold text-slate-900">{supplier.name}</TableCell>
                    <TableCell className="text-slate-600">{supplier.contact || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant="ghost" onClick={() => handleEdit(supplier)} className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" onClick={() => handleDelete(supplier.id)} className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}