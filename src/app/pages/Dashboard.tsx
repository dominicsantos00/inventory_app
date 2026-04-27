import React, { useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Package, Truck, Boxes, Building2, Users, CheckCircle } from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const { deliveredRecords, forDeliveryRecords, risRecords, stockCards, users } = useData();

  const isEndUser = user?.role === 'end-user';

  // --- END USER METRICS (Filtered by their division) ---
  const myDistributions = useMemo(() => {
    if (!isEndUser) return [];
    return (risRecords || [])
      .filter(ris => ris.division === user?.division)
      .flatMap(ris => ris.items.map(item => ({
        date: ris.date,
        risNo: ris.risNo,
        description: item.description,
        qty: item.quantityIssued,
        unit: item.unit,
        amount: (item.quantityIssued * (item.unitPrice || 0))
      })))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [risRecords, isEndUser, user]);

  const totalMyItems = myDistributions.reduce((sum, item) => sum + item.qty, 0);
  const totalMyAmount = myDistributions.reduce((sum, item) => sum + item.amount, 0);

  // --- ADMIN METRICS (System Wide) ---
  const totalInStockItems = (stockCards || []).length;
  const pendingDeliveries = (forDeliveryRecords || []).length;
  const recentDeliveries = [...(deliveredRecords || [])].sort((a, b) => new Date(b.dateDelivered).getTime() - new Date(a.dateDelivered).getTime()).slice(0, 5);
  const totalUsers = (users || []).length;

  const formatCurrency = (val: number) => Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

  // ==========================================
  // VIEW 1: END-USER DASHBOARD
  // ==========================================
  if (isEndUser) {
    return (
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">End-User Dashboard</h2>
          <p className="text-slate-500 text-sm mt-1">Welcome back, {user?.fullName || user?.username}. Here is the summary for {user?.division || 'your division'}.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Supplies Received</CardTitle>
              <Package className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{totalMyItems}</div>
              <p className="text-xs text-slate-500 mt-1">Items distributed to your office</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Cost of Supplies</CardTitle>
              <Building2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">₱{formatCurrency(totalMyAmount)}</div>
              <p className="text-xs text-slate-500 mt-1">Total value allocated</p>
            </CardContent>
          </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Available In Supply Room</CardTitle>
              <Boxes className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-slate-900">{totalInStockItems}</div>
              <p className="text-xs text-slate-500 mt-1">Unique items ready to be requested via RIS</p>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-100">
            <CardTitle className="text-lg font-bold text-slate-900">Recent Supplies Distributed to Your Division</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[50vh] overflow-y-auto">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">RIS Number</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Description</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Quantity</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {myDistributions.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">No supplies distributed yet.</TableCell></TableRow>
                  ) : (
                    myDistributions.map((item, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-slate-900">{new Date(item.date).toLocaleDateString()}</TableCell>
                        <TableCell className="text-slate-600">{item.risNo}</TableCell>
                        <TableCell className="text-slate-700">{item.description}</TableCell>
                        <TableCell className="text-right font-medium text-slate-800">{item.qty} <span className="text-xs text-slate-400">{item.unit}</span></TableCell>
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

  // ==========================================
  // VIEW 2: ADMIN DASHBOARD
  // ==========================================
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">System Dashboard</h2>
        <p className="text-slate-500 text-sm mt-1">Overview of inventory, deliveries, and system metrics.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Pending Incoming POs</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{pendingDeliveries}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Items In Stock</CardTitle>
            <Boxes className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalInStockItems}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Delivered Supplies</CardTitle>
            <CheckCircle className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{(deliveredRecords || []).length}</div>
          </CardContent>
        </Card>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">System Users</CardTitle>
            <Users className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{totalUsers}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100">
          <CardTitle className="text-lg font-bold text-slate-900">Recent Deliveries</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[50vh] overflow-y-auto">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm">
                <TableRow>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Date</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Supplier</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Quantity</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentDeliveries.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center py-8 text-slate-500">No deliveries yet.</TableCell></TableRow>
                ) : (
                  recentDeliveries.map((d, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium text-slate-900">{new Date(d.dateDelivered).toLocaleDateString()}</TableCell>
                      <TableCell className="text-slate-700">{d.itemDescription}</TableCell>
                      <TableCell className="text-slate-600">{d.supplier}</TableCell>
                      <TableCell className="text-right font-medium text-slate-800">{d.qty} <span className="text-xs text-slate-400">{d.unit}</span></TableCell>
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