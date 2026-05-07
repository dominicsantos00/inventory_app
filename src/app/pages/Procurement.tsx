import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from '../components/ui/badge';
import { Search, Package, Truck, CheckCircle, Boxes } from 'lucide-react';

// --- Reusable Read-Only Metric Card ---
function MetricCard({ title, value, subtitle, icon: Icon, colorClass, bgClass }: any) {
  return (
    <Card className="relative overflow-hidden shadow-sm border border-slate-200/60 bg-white">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl ${bgClass} ${colorClass}`}>
            <Icon size={22} strokeWidth={2.5} />
          </div>
        </div>
        <p className="mt-3 text-sm font-medium text-slate-500">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

export function Procurement() {
  const { user } = useAuth();
  const { 
    forDeliveryRecords = [], 
    iarRecords = [], 
    risRecords = [], 
    stockCards = [] 
  } = useData();
  
  const [searchTerm, setSearchTerm] = useState('');

// 1. Role Identification
  const isAdmin = user?.role === 'admin';
  const userDivision = user?.division || '';

  // 2. Safer Tab Data Filtering
  const completedPONumbers = forDeliveryRecords.filter((po: any) => {
      const relatedIARs = iarRecords.filter((iar: any) => iar.poNumber === po.poNumber);
      const totalReceivedItems = relatedIARs.reduce((total: number, iar: any) => total + (iar.items?.length || 0), 0);
      const expectedItems = po.items?.length || 0;
      return totalReceivedItems >= expectedItems && expectedItems > 0;
  }).map((po: any) => po.poNumber);

  // FIX 1: Smart PO Filtering
  const displayForDelivery = (isAdmin 
    ? forDeliveryRecords 
    : forDeliveryRecords.filter((record: any) => {
        const dept = record.division || record.requisitioningOffice || record.requestingOffice;
        // If it's general office stock (no dept) or sent to Supply, everyone can see the pending order
        if (!dept || dept.toLowerCase().includes('supply')) return true;
        // Otherwise, only show it if it strictly matches their division
        return dept === userDivision;
      })
  ).filter((pendingRecord: any) => !completedPONumbers.includes(pendingRecord.poNumber));

  // FIX 2: Smart IAR Filtering
  const displayDelivered = isAdmin 
    ? iarRecords 
    : iarRecords.filter((record: any) => {
        const dept = record.requisitioningOffice;
        // If it was delivered generally to the Supply Room, End-Users can see the history
        if (!dept || dept.toLowerCase().includes('supply')) return true;
        return dept === userDivision;
      }); 
  
  // Distributed records (RIS) ALWAYS have a division, so strict filtering is safe here
  const displayDistributed = isAdmin 
    ? risRecords 
    : risRecords.filter((record: any) => record.division === userDivision);

  const displayInStock = stockCards; 

  // 3. Dynamic Dashboard Metric Calculations
  // FIX 3: End-Users should only see the count of items ISSUED to them (RIS), not global IARs
  const totalSuppliesReceived = isAdmin 
    ? displayDelivered.reduce((total, iar) => total + iar.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0), 0)
    : displayDistributed.reduce((total, ris) => total + ris.items.reduce((sum: number, item: any) => sum + (Number(item.quantityIssued) || 0), 0), 0);

  const totalDeliveriesPending = displayForDelivery.length;
  
  const totalItemsInStock = displayInStock.reduce((total, stock) => {
    const latestTxn = stock.transactions?.[stock.transactions.length - 1];
    return total + (latestTxn ? latestTxn.balance : 0);
  }, 0);

  // Formatting Helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount || 0);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Delivery Management</h1>
          <p className="text-slate-500 mt-1">Track and manage inventory movements across DENR-CAR</p>
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title={isAdmin ? "Total Global Supplies" : "Supplies Received"} 
          value={totalSuppliesReceived} 
          subtitle={isAdmin ? "Total items accepted by Supply Room" : "Total items issued to your division"} 
          icon={Boxes} 
          colorClass="text-purple-600" 
          bgClass="bg-purple-50" 
        />
        <MetricCard 
          title="Current Stock" 
          value={totalItemsInStock} 
          subtitle="Total available items in Supply Room" 
          icon={CheckCircle} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50" 
        />
        <MetricCard 
          title="Pending Deliveries" 
          value={totalDeliveriesPending} 
          subtitle="Orders waiting to be received" 
          icon={Truck} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-50" 
        />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="for-delivery" className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <TabsList className="bg-slate-100/50 p-1">
            <TabsTrigger value="for-delivery" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">For Delivery</TabsTrigger>
            <TabsTrigger value="delivered" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Delivered</TabsTrigger>
            <TabsTrigger value="distributed" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">Distributed</TabsTrigger>
            <TabsTrigger value="in-stock" className="data-[state=active]:bg-white data-[state=active]:shadow-sm">In Stock</TabsTrigger>
          </TabsList>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search deliveries..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 border-slate-200 bg-white"
            />
          </div>
        </div>

        {/* 1. FOR DELIVERY TAB */}
        <TabsContent value="for-delivery" className="mt-0">
          <Card className="border-slate-200/60 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-600">PO Number</TableHead>
                    <TableHead className="font-semibold text-slate-600">PO Date</TableHead>
                    <TableHead className="font-semibold text-slate-600">Supplier</TableHead>
                    <TableHead className="font-semibold text-slate-600">Items Expected</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayForDelivery.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        <Package className="h-8 w-8 mx-auto text-slate-300 mb-3" />
                        <p>No pending deliveries found.</p>
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayForDelivery.map((record: any, idx: number) => (
                      <TableRow key={`delivery-${record.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-medium text-slate-900">{record.poNumber}</TableCell>
                        <TableCell className="text-slate-600">{record.poDate}</TableCell>
                        <TableCell className="text-slate-700">{record.supplier}</TableCell>
                        <TableCell className="text-slate-600">
                          {record.items?.length || 0} items
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Pending</Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 2. DELIVERED TAB (IAR) */}
        <TabsContent value="delivered" className="mt-0">
          <Card className="border-slate-200/60 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-600">Office</TableHead>
                    <TableHead className="font-semibold text-slate-600">IAR No.</TableHead>
                    <TableHead className="font-semibold text-slate-600">Items Received</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-center">Total QTY</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayDelivered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">No delivered records found.</TableCell>
                    </TableRow>
                  ) : (
                    displayDelivered.map((record: any, idx: number) => {
                      const totalQty = record.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 0), 0);
                      return (
                        <TableRow key={`iar-${record.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="font-medium text-slate-900">{record.requisitioningOffice}</TableCell>
                          <TableCell className="text-slate-700">{record.iarNo}</TableCell>
                          <TableCell className="text-slate-600">{record.items?.length || 0} unique items</TableCell>
                          <TableCell className="text-center font-semibold text-slate-800">{totalQty}</TableCell>
                          <TableCell className="text-right text-slate-600">{new Date(record.date).toLocaleDateString()}</TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. DISTRIBUTED TAB (RIS) */}
        <TabsContent value="distributed" className="mt-0">
          <Card className="border-slate-200/60 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-600">Division</TableHead>
                    <TableHead className="font-semibold text-slate-600">RIS No.</TableHead>
                    <TableHead className="font-semibold text-slate-600">Items Issued</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-center">Total QTY</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-right">Date Issued</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayDistributed.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                        {isAdmin ? "No distributed records found." : "No supplies have been issued to your division yet."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    displayDistributed.map((record: any, idx: number) => {
                      const totalQty = record.items.reduce((sum: number, item: any) => sum + (Number(item.quantityIssued) || 0), 0);
                      return (
                        <TableRow key={`ris-${record.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="font-medium text-slate-900">{record.division}</TableCell>
                          <TableCell className="text-slate-700">{record.risNo}</TableCell>
                          <TableCell className="text-slate-600">{record.items?.length || 0} unique items</TableCell>
                          <TableCell className="text-center font-semibold text-slate-800">{totalQty}</TableCell>
                          <TableCell className="text-right text-slate-600">{new Date(record.date).toLocaleDateString()}</TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. IN STOCK TAB (Stock Cards) */}
        <TabsContent value="in-stock" className="mt-0">
          <Card className="border-slate-200/60 shadow-sm overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50/80">
                  <TableRow>
                    <TableHead className="font-semibold text-slate-600">Item Description</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-center">Unit</TableHead>
                    <TableHead className="font-semibold text-slate-600 text-center">Available Balance</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {displayInStock.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-slate-500">No stock history available.</TableCell>
                    </TableRow>
                  ) : (
                    displayInStock.map((stock: any, idx: number) => {
                      const latestTxn = stock.transactions?.[stock.transactions.length - 1];
                      const balanceQty = latestTxn ? latestTxn.balance : 0;
                      
                      return (
                        <TableRow key={`stock-${stock.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="text-slate-700 font-medium">{stock.description}</TableCell>
                          <TableCell className="text-center text-slate-600">{stock.unit}</TableCell>
                          <TableCell className="text-center font-bold text-slate-900">{balanceQty}</TableCell>
                        </TableRow>
                      )
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}