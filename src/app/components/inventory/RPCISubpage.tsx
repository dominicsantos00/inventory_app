import React, { useState, useEffect } from 'react';
import { useData } from '../../context/DataContext';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Trash2, FileBox } from 'lucide-react';
import { toast } from 'sonner';

interface DerivedRPCIItem { stockNo: string; description: string; unit: string; bookBalance: number; totalDelivered: number; totalIssued: number; unitPrice?: number; totalCost?: number; remarks?: string; category?: string; categoryName?: string; }

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

  useEffect(() => {
    const loadDerivedItems = async () => {
      try {
        setIsLoading(true);
        const items = await fetchStockCardItemsForRPCI();
        let filteredItems = items.filter((item: DerivedRPCIItem) => item.bookBalance > 0);
        filteredItems = filteredItems.map((item: DerivedRPCIItem) => {
          const stockPrefix = item.stockNo?.replace(/\d+/g, '').trim() || '';
          const matchedSSN = ssnItems?.find((ssn: any) => ssn.code?.toUpperCase() === stockPrefix.toUpperCase());
          return { ...item, category: stockPrefix || 'Uncategorized', categoryName: matchedSSN?.category || stockPrefix || 'Uncategorized' };
        });
        setDerivedItems(filteredItems);
      } catch (error) { toast.error('Failed to load inventory items'); } finally { setIsLoading(false); }
    };
    loadDerivedItems();
  }, [rpciRecords, fetchStockCardItemsForRPCI, ssnItems]);

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this RPCI?')) {
      try { await deleteRPCIRecord(id); toast.success('RPCI deleted successfully!'); } catch (error) { toast.error('Failed to delete RPCI'); }
    }
  };

  const filteredByCategory = selectedCategory === '' ? derivedItems : derivedItems.filter(item => item.category === selectedCategory);

  return (
    <div className="space-y-6">
      
      {/* PRIMARY VIEW: Derived Inventory Items from Stock Card */}
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">Current Physical Inventory</CardTitle>
            <p className="text-sm text-slate-500 mt-1">Auto-derived from positive stock card balances.</p>
          </div>
          <Select value={selectedCategory || "all"} onValueChange={(value) => setSelectedCategory(value === "all" ? "" : value)}>
            <SelectTrigger className="w-full sm:w-64 border-slate-200 bg-white">
              <SelectValue placeholder="Filter by Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All SSN Categories</SelectItem>
              {SSN_CATEGORIES.map((cat) => (
                <SelectItem key={cat.code} value={cat.code}>{cat.label} ({cat.code})</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm outline outline-1 outline-slate-200">
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">SSN Code</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-center">Unit</TableHead>
                <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Remaining Balance</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={4} className="text-center text-slate-500 py-12">Loading inventory items...</TableCell></TableRow>
              ) : filteredByCategory.length > 0 ? (
                filteredByCategory.map((item, idx) => (
                  <TableRow key={idx} className="hover:bg-slate-50 transition-colors">
                    <TableCell className="font-semibold text-slate-900">{item.stockNo}</TableCell>
                    <TableCell className="text-slate-700">{item.description}</TableCell>
                    <TableCell className="text-center text-slate-600">{item.unit}</TableCell>
                    <TableCell className="text-right text-indigo-700 font-black text-lg">{item.bookBalance}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-12 text-slate-500">
                    <FileBox className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                    <p>No items currently in stock matching this category.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      {/* SECONDARY VIEW: Manual RPCI Records */}
      {rpciRecords && rpciRecords.length > 0 && (
        <Card className="shadow-sm border-slate-200 overflow-hidden mt-8">
          <CardHeader className="bg-white border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900">Historical RPCI Records</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm outline outline-1 outline-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Date of Count</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Items Counted</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Value</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Fund Cluster</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rpciRecords.map((rpci) => (
                  <React.Fragment key={rpci.id}>
                    <TableRow className="cursor-pointer group hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium text-slate-900" onClick={() => setExpandedId(expandedId === rpci.id ? null : rpci.id)}>
                        {rpci.reportNo}
                      </TableCell>
                      <TableCell className="text-slate-600" onClick={() => setExpandedId(expandedId === rpci.id ? null : rpci.id)}>
                        {rpci.countDate}
                      </TableCell>
                      <TableCell className="text-center font-medium text-slate-700" onClick={() => setExpandedId(expandedId === rpci.id ? null : rpci.id)}>
                        {rpci.items.length}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" onClick={() => handleDelete(rpci.id)} className="h-8 w-8 text-slate-500 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {expandedId === rpci.id && (
                      <TableRow className="bg-slate-50/50">
                        <TableCell colSpan={4} className="p-0">
                          <div className="p-4 bg-indigo-50/30 border-y border-indigo-100">
                            <table className="w-full text-sm">
                              <thead>
                                <tr>
                                  <th className="py-2 px-3 text-left text-xs font-semibold text-indigo-800 uppercase tracking-wider">SSN Code</th>
                                  <th className="py-2 px-3 text-left text-xs font-semibold text-indigo-800 uppercase tracking-wider">Description</th>
                                  <th className="py-2 px-3 text-center text-xs font-semibold text-indigo-800 uppercase tracking-wider">Unit</th>
                                  <th className="py-2 px-3 text-right text-xs font-semibold text-indigo-800 uppercase tracking-wider">Remaining Balance</th>
                                  <th className="py-2 px-3 text-left text-xs font-semibold text-indigo-800 uppercase tracking-wider">Remarks</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-indigo-100">
                                {rpci.items.map((item: any, idx) => (
                                  <tr key={idx} className="hover:bg-indigo-50/50 transition-colors">
                                    <td className="py-3 px-3 font-medium text-slate-900">{item.stockNo}</td>
                                    <td className="py-3 px-3 text-slate-700">{item.description}</td>
                                    <td className="py-3 px-3 text-center text-slate-600">{item.unit}</td>
                                    <td className="py-3 px-3 text-right text-indigo-700 font-bold text-base">{item.bookBalance}</td>
                                    <td className="py-3 px-3 text-slate-500">{item.remarks || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
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