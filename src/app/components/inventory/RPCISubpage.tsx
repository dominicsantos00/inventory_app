import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface DerivedRPCIItem {
  stockNo: string;
  description: string;
  unit: string;
  bookBalance: number;
  totalDelivered: number;
  totalIssued: number;
  unitPrice?: number;
  totalCost?: number;
  remarks?: string;
  category?: string;
  categoryName?: string;
}

const SSN_CATEGORIES = [
  { label: 'Office Supplies', code: 'OS' },
  { label: 'Office Equipment', code: 'OE' },
  { label: 'ICT Supplies', code: 'ICT' },
  { label: 'Other Supplies', code: 'OT' },
  { label: 'Non-Accountable Forms', code: 'AF1/JS' },
  { label: 'Electrical Supplies', code: 'ES' },
];

export function RPCISubpage() {
  const { rpciRecords, deleteRPCIRecord, fetchStockCardItemsForRPCI, ssnItems } = useData();
  const [derivedItems, setDerivedItems] = useState<DerivedRPCIItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  // Fetch derived items from Stock Card on mount and when rpciRecords change
  useEffect(() => {
    const loadDerivedItems = async () => {
      try {
        setIsLoading(true);
        const items = await fetchStockCardItemsForRPCI();
        // Filter to show only items with positive remaining balance
        let filteredItems = items.filter((item: DerivedRPCIItem) => item.bookBalance > 0);
        
        // Match items with SSN categories by stock number prefix
        filteredItems = filteredItems.map((item: DerivedRPCIItem) => {
          // Extract prefix from stock number (e.g., "OS" from "OS17")
          const stockPrefix = item.stockNo?.replace(/\d+/g, '').trim() || '';
          
          // Find matching SSN item by code for display name
          const matchedSSN = ssnItems?.find((ssn: any) => 
            ssn.code?.toUpperCase() === stockPrefix.toUpperCase()
          );
          
          return {
            ...item,
            category: stockPrefix || 'Uncategorized',  // Use stock prefix directly for filtering
            categoryName: matchedSSN?.category || stockPrefix || 'Uncategorized'  // Use display name if available
          };
        });
        
        setDerivedItems(filteredItems);
      } catch (error) {
        console.error('Failed to fetch stock card items:', error);
        toast.error('Failed to load inventory items');
      } finally {
        setIsLoading(false);
      }
    };
    loadDerivedItems();
  }, [rpciRecords, fetchStockCardItemsForRPCI, ssnItems]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this RPCI?')) {
      try {
        await deleteRPCIRecord(id);
        toast.success('RPCI deleted successfully!');
      } catch (error) {
        toast.error('Failed to delete RPCI');
      }
    }
  };

  // Filter items based on selected category using code prefix matching
  const filteredByCategory = selectedCategory === '' ? derivedItems : derivedItems.filter(item => item.category === selectedCategory);

  return (
    <div className="space-y-6 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Report on Physical Count of Inventory (RPCI)</h1>
      </div>

      {/* PRIMARY VIEW: Derived Inventory Items from Stock Card */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Current Inventory Items (Auto-Derived from Stock Card)</CardTitle>
            <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
              <SelectTrigger className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All SSN Code</SelectItem>
                {SSN_CATEGORIES.map((cat) => (
                  <SelectItem key={cat.code} value={cat.code}>
                    {cat.label} ({cat.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-blue-50">
                  <TableHead>SSN Code</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead className="text-right">Remaining Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-4">
                      Loading inventory items...
                    </TableCell>
                  </TableRow>
                ) : filteredByCategory && filteredByCategory.length > 0 ? (
                  <>
                    {filteredByCategory.map((item, idx) => (
                      <TableRow key={idx} className="hover:bg-gray-50">
                        <TableCell className="font-semibold">{item.stockNo}</TableCell>
                        <TableCell>{item.description}</TableCell>
                        <TableCell>{item.unit}</TableCell>
                        <TableCell className="text-right text-green-700 font-bold text-lg">{item.bookBalance}</TableCell>
                      </TableRow>
                    ))}
                  </>
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-gray-500 py-4">
                      No items currently in stock (Stock Card balance = 0)
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* SECONDARY VIEW: Manual RPCI Records (if any exist) */}
      {rpciRecords && rpciRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Manual RPCI Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report Number</TableHead>
                    <TableHead>Count Date</TableHead>
                    <TableHead>Items Count</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rpciRecords.map((rpci) => (
                    <React.Fragment key={rpci.id}>
                      <TableRow className="cursor-pointer hover:bg-gray-50">
                        <TableCell
                          className="font-medium"
                          onClick={() =>
                            setExpandedId(expandedId === rpci.id ? null : rpci.id)
                          }
                        >
                          {rpci.reportNo}
                        </TableCell>
                        <TableCell onClick={() => setExpandedId(expandedId === rpci.id ? null : rpci.id)}>
                          {rpci.countDate}
                        </TableCell>
                        <TableCell onClick={() => setExpandedId(expandedId === rpci.id ? null : rpci.id)}>
                          {rpci.items.length}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDelete(rpci.id)}
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedId === rpci.id && (
                        <TableRow>
                          <TableCell colSpan={4}>
                            <div className="bg-gray-50 p-4 mt-2 rounded">
                              <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="bg-gray-100">
                                      <th className="p-2 text-left">SSN Code</th>
                                      <th className="p-2 text-left">Description</th>
                                      <th className="p-2 text-left">Unit</th>
                                      <th className="p-2 text-right">Remaining Balance</th>
                                      <th className="p-2 text-left">Remarks</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {rpci.items.map((item: any, idx) => (
                                      <tr key={idx} className="border-b hover:bg-gray-100">
                                        <td className="p-2">{item.stockNo}</td>
                                        <td className="p-2">{item.description}</td>
                                        <td className="p-2">{item.unit}</td>
                                        <td className="p-2 text-right text-green-700 font-bold text-lg">{item.bookBalance}</td>
                                        <td className="p-2">{item.remarks || '-'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}