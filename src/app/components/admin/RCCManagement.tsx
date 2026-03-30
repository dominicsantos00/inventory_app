import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import { RCCItem } from '../../types';
import { toast } from 'sonner';

export function RCCManagement() {
  const { rccItems, addRCCItem, updateRCCItem, deleteRCCItem } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RCCItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    code: '',
    officeName: '',
    divisionName: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingItem) {
      updateRCCItem(editingItem.id, formData);
      toast.success('RCC item updated successfully');
    } else {
      addRCCItem(formData);
      toast.success('RCC item created successfully');
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (item: RCCItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      officeName: item.officeName,
      divisionName: item.divisionName,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this RCC item?')) {
      deleteRCCItem(id);
      toast.success('RCC item deleted successfully');
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      officeName: '',
      divisionName: '',
    });
  };

  const filteredItems = rccItems.filter(
    (item) =>
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.officeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.divisionName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Responsibility Center Code (RCC) Management</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                Add RCC Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit RCC Item' : 'Add New RCC Item'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">RCC Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., 00014"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="officeName">Office Name</Label>
                  <Input
                    id="officeName"
                    value={formData.officeName}
                    onChange={(e) => setFormData({ ...formData, officeName: e.target.value })}
                    placeholder="e.g., Regional Office"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="divisionName">Abbreviation</Label>
                  <Input
                    id="divisionName"
                    value={formData.divisionName}
                    onChange={(e) => setFormData({ ...formData, divisionName: e.target.value })}
                    placeholder="e.g., PMD"
                    required
                  />
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700">
                    {editingItem ? 'Update Item' : 'Create Item'}
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
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by code, office, or division..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>RCC Code</TableHead>
              <TableHead>Office Name</TableHead>
              <TableHead>Abbreviation</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.code}</TableCell>
                <TableCell>{item.officeName}</TableCell>
                <TableCell>{item.divisionName}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(item.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {filteredItems.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No RCC items found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
