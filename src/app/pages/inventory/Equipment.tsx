import React, { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { Badge } from '../../components/ui/badge';
import { Search, Settings } from 'lucide-react';

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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900"></h2>
        <p className="text-gray-600 mt-1">Manage and track non-consumable equipment inventory</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Equipment Items</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalEquipment}</div>
            <p className="text-xs text-gray-500 mt-1">All equipment records</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Units</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{totalUnits}</div>
            <p className="text-xs text-gray-500 mt-1">Equipment units in inventory</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">₱{totalValue.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Total investment value</p>
          </CardContent>
        </Card>
      </div>

      {/* Equipment List */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Equipment Inventory ({equipmentDeliveries.length})</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search equipment..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date Acquired</TableHead>
                <TableHead>Equipment Name</TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total Value</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEquipment.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                    <Settings className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>{searchQuery ? 'No equipment found matching your search' : 'No equipment recorded yet'}</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEquipment.map((equipment) => (
                  <TableRow key={equipment.id}>
                    <TableCell>{new Date(equipment.date).toLocaleDateString()}</TableCell>
                    <TableCell className="font-medium">{equipment.item}</TableCell>
                    <TableCell>{equipment.poNumber}</TableCell>
                    <TableCell>{equipment.supplier}</TableCell>
                    <TableCell>{equipment.quantity} {equipment.unit}</TableCell>
                    <TableCell>₱{equipment.unitPrice.toLocaleString()}</TableCell>
                    <TableCell className="font-semibold">₱{equipment.totalPrice.toLocaleString()}</TableCell>
                    <TableCell>
                      <Badge className="bg-green-100 text-green-700">Active</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Equipment Categories (Sample Data) */}
      {equipmentDeliveries.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Equipment by Category</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {['Office Equipment', 'IT Equipment', 'Furniture', 'Vehicles', 'Machinery', 'Other'].map((category) => {
                const count = Math.floor(Math.random() * 10) + 1;
                return (
                  <div key={category} className="p-4 border rounded-lg">
                    <h3 className="font-semibold text-gray-900">{category}</h3>
                    <p className="text-2xl font-bold text-green-600 mt-2">{count}</p>
                    <p className="text-xs text-gray-500">items</p>
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
