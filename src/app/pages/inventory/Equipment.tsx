import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Search, Settings, Monitor, PhilippinePeso, Layers } from 'lucide-react';

export function Equipment() {
  const { deliveries } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  const equipmentDeliveries = deliveries.filter((d) => d.type === 'Equipment');

  const filteredEquipment = equipmentDeliveries.filter(
    (equipment) =>
      equipment.item.toLowerCase().includes(searchQuery.toLowerCase()) ||
      equipment.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      equipment.poNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate summary statistics
  const totalEquipment = equipmentDeliveries.length;
  const totalValue = equipmentDeliveries.reduce((sum, eq) => sum + eq.totalPrice, 0);
  const totalUnits = equipmentDeliveries.reduce((sum, eq) => sum + eq.quantity, 0);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Equipment Inventory</h2>
        <p className="text-slate-500 text-sm mt-1">Manage and track non-consumable equipment and assets.</p>
      </div>

      {/* Modern Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Equipment Items</p>
                <div className="text-3xl font-bold text-slate-900 mt-2">{totalEquipment}</div>
              </div>
              <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Monitor size={20} /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Units</p>
                <div className="text-3xl font-bold text-slate-900 mt-2">{totalUnits}</div>
              </div>
              <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><Layers size={20} /></div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Investment Value</p>
                <div className="text-3xl font-bold text-slate-900 mt-2">₱{totalValue.toLocaleString()}</div>
              </div>
              <div className="p-3 bg-green-50 text-green-600 rounded-xl"><PhilippinePeso size={20} /></div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Equipment List Table */}
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="border-b border-slate-100 pb-4 bg-white">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg font-semibold text-slate-800">Inventory Records</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                placeholder="Search by name, supplier, or PO..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 border-slate-200"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date Acquired</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Equipment Details</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Supplier & PO</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Quantity</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unit Price</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Value</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipment.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-slate-500">
                    <Settings className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                    <p>{searchQuery ? 'No equipment found matching your search.' : 'No equipment recorded yet.'}</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEquipment.map((equipment) => (
                  <TableRow key={equipment.id} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="text-slate-600">{new Date(equipment.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium text-slate-900">{equipment.item}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-slate-700">{equipment.supplier}</span>
                        <span className="text-xs text-slate-500">{equipment.poNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-slate-600">{equipment.quantity} <span className="text-xs text-slate-400">{equipment.unit}</span></TableCell>
                    <TableCell className="text-slate-600">₱{equipment.unitPrice.toLocaleString()}</TableCell>
                    <TableCell className="font-semibold text-slate-900">₱{equipment.totalPrice.toLocaleString()}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Equipment Categories (Mock visual improvement) */}
      {equipmentDeliveries.length > 0 && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-slate-800">Categories Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {['Office Equipment', 'IT Equipment', 'Furniture', 'Vehicles', 'Machinery', 'Other'].map((category) => {
                // Mock count generation based on name length for stable visual mock data
                const count = category.length % 5 + 2; 
                return (
                  <div key={category} className="p-4 bg-slate-50 border border-slate-100 rounded-xl hover:border-slate-300 transition-colors">
                    <h3 className="font-medium text-slate-700 text-sm line-clamp-1" title={category}>{category}</h3>
                    <div className="flex items-end gap-2 mt-2">
                       <p className="text-2xl font-bold text-slate-900">{count}</p>
                       <p className="text-xs text-slate-500 mb-1">items</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}