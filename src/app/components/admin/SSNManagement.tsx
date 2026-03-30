import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { SSNItem, CategoryOption } from '../../types';
import { toast } from 'sonner';

export function SSNManagement() {
  const { ssnItems, addSSNItem, updateSSNItem, deleteSSNItem } = useData();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SSNItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  const categoryOptions: CategoryOption[] = [
    { label: 'Office Supplies', code: 'OS' },
    { label: 'Office Equipment', code: 'OE' },
    { label: 'ICT Supplies', code: 'ICT' },
    { label: 'Other Supplies', code: 'OT' },
    { label: 'Non-Accountable Forms', code: 'AF1/JS' },
    { label: 'Electrical Supplies', code: 'ES' },
  ];

  const [formData, setFormData] = useState({
    code: '',
    description: '',
    unit: '',
    category: '',
    categoryCode: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingItem) {
      updateSSNItem(editingItem.id, formData);
      toast.success('SSN item updated successfully');
    } else {
      addSSNItem(formData);
      toast.success('SSN item created successfully');
    }
    
    setIsDialogOpen(false);
    resetForm();
  };

  const handleEdit = (item: SSNItem) => {
    setEditingItem(item);
    setFormData({
      code: item.code,
      description: item.description,
      unit: item.unit,
      category: item.category,
      categoryCode: item.categoryCode,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this SSN item?')) {
      deleteSSNItem(id);
      toast.success('SSN item deleted successfully');
    }
  };

  const resetForm = () => {
    setEditingItem(null);
    setFormData({
      code: '',
      description: '',
      unit: '',
      category: '',
      categoryCode: '',
    });
  };

  const filteredItems = ssnItems.filter((item) => {
    const matchesSearch = 
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === '' || (() => {
      switch (selectedCategory) {
        case 'OS':
          return item.code.startsWith('OS');
        case 'OE':
          return item.code.startsWith('OE');
        case 'ICT':
          return item.code.startsWith('ICT');
        case 'OT':
          return item.code.startsWith('OT');
        case 'AF1/JS':
          return item.code.startsWith('AF1') || item.code.startsWith('JS');
        case 'ES':
          return item.code.startsWith('ES');
        default:
          return true;
      }
    })();
    
    return matchesSearch && matchesCategory;
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Supply Stock Number (SSN) Management</CardTitle>
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="bg-green-600 hover:bg-green-700">
                <Plus className="mr-2 h-4 w-4" />
                Add SSN Item
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>{editingItem ? 'Edit SSN Item' : 'Add New SSN Item'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code">SSN Code</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="e.g., SSN-001"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Item Description</Label>
                  <Input
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="e.g., Bond Paper, A4"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="unit">Unit</Label>
                  <Input
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="e.g., Ream, Box, Piece"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="e.g., Ink, Stamp"
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
        <div className="mb-4 flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by code, description, or category..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="w-64">
            <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by SSN Code" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SSN Code</SelectItem>
                {categoryOptions.map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    {option.label} ({option.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SSN Code</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Unit</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.code}</TableCell>
                <TableCell>{item.description}</TableCell>
                <TableCell>{item.unit}</TableCell>
                <TableCell>{item.category}</TableCell>
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
            No SSN items found
          </div>
        )}
      </CardContent>
    </Card>
  );
}
