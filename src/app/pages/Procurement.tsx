import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Badge } from '../components/ui/badge';
import { Search, Package, Truck, CheckCircle, Boxes, FileText, TrendingUp } from 'lucide-react';

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
  // Fetch all necessary datasets from context
  const { deliveries, iarRecords, risRecords, stockCards } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState("for-delivery");

  // User's division string
  const userDivision = user?.division || 'End-User Division';

  // --- DATA FILTERING ---
  // 1. For Delivery (Pending Deliveries)
  const pendingDeliveries = deliveries.filter(
    (d) => d.status !== 'received' && d.item.toLowerCase().includes(searchQuery.toLowerCase())
  ).reverse();

  // 2. Delivered (IAR Records for this division)
  const divisionIARs = iarRecords.filter((iar) => 
    iar.requisitioningOffice.toLowerCase().includes(userDivision.toLowerCase())
  );

  // 3. Distributed (RIS Records for this division)
  const divisionRIS = risRecords.filter((ris) => 
    ris.division.toLowerCase().includes(userDivision.toLowerCase())
  );

  // 4. In Stock (Available balances from Stock Cards)
  const availableStock = (stockCards || []).filter((card) => 
    // FIXED: using 'description' instead of 'itemDescription'
    card.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Helper to safely format currency
  const formatCurrency = (amount: any) => Number(amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Delivery Management</h2>
          <p className="text-slate-500 text-sm mt-1 flex items-center">
            <Badge variant="outline" className="mr-2 bg-slate-100 text-slate-600 border-slate-200">{userDivision}</Badge>
            Read-only viewer account
          </p>
        </div>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            type="text"
            placeholder="Search item descriptions..."
            className="pl-9 bg-white border-slate-200 shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="IAR Records" 
          value={divisionIARs.length} 
          subtitle="Inspections & Acceptances" 
          icon={FileText} 
          colorClass="text-purple-600" 
          bgClass="bg-purple-50" 
        />
        <MetricCard 
          title="RIS Records" 
          value={divisionRIS.length} 
          subtitle="Requisitions & Issues" 
          icon={TrendingUp} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50" 
        />
        <MetricCard 
          title="Total Deliveries" 
          value={pendingDeliveries.length} 
          subtitle="Overall tracking" 
          icon={Package} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-50" 
        />
      </div>

      {/* Tabbed Navigation */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-3xl grid-cols-4 bg-slate-100 p-1 rounded-xl mb-6 h-12 border border-slate-200 shadow-sm">
          <TabsTrigger value="for-delivery" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg text-slate-500 transition-all font-medium text-sm">
            <Truck className="w-4 h-4 mr-2 hidden sm:block"/> For Delivery
          </TabsTrigger>
          <TabsTrigger value="delivered" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg text-slate-500 transition-all font-medium text-sm">
            <Package className="w-4 h-4 mr-2 hidden sm:block"/> Delivered
          </TabsTrigger>
          <TabsTrigger value="distributed" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg text-slate-500 transition-all font-medium text-sm">
            <CheckCircle className="w-4 h-4 mr-2 hidden sm:block"/> Distributed
          </TabsTrigger>
          <TabsTrigger value="in-stock" className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg text-slate-500 transition-all font-medium text-sm">
            <Boxes className="w-4 h-4 mr-2 hidden sm:block"/> In Stock
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: For Delivery */}
        <TabsContent value="for-delivery" className="mt-0">
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Office</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item Description</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Unit of Measure</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">QTY</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Unit Price</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pendingDeliveries.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">No data found.</TableCell></TableRow>
                  ) : (
                    pendingDeliveries.map((delivery, idx) => (
                      <TableRow key={`delivery-${idx}`} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="font-medium text-slate-900">{userDivision}</TableCell>
                        <TableCell className="text-slate-700">{delivery.item}</TableCell>
                        <TableCell className="text-center text-slate-600">{delivery.unit}</TableCell>
                        <TableCell className="text-center font-medium text-slate-800">{delivery.quantity}</TableCell>
                        <TableCell className="text-right text-slate-600">₱{formatCurrency(delivery.unitPrice)}</TableCell>
                        <TableCell className="text-right font-bold text-slate-900">₱{formatCurrency(delivery.totalPrice)}</TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 2: Delivered */}
        <TabsContent value="delivered" className="mt-0">
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Office</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item Description</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Unit of Measure</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">QTY</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Unit Price</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {divisionIARs.length === 0 ? (
                     <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">No data found.</TableCell></TableRow>
                   ) : (
                     divisionIARs.flatMap(iar => iar.items.map((item, idx) => (
                        <TableRow key={`iar-${iar.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="font-medium text-slate-900">{iar.requisitioningOffice}</TableCell>
                          <TableCell className="text-slate-700">{item.description}</TableCell>
                          <TableCell className="text-center text-slate-600">{item.unit}</TableCell>
                          <TableCell className="text-center font-medium text-slate-800">{item.quantity}</TableCell>
                          <TableCell className="text-right text-slate-600">₱{formatCurrency(item.totalCost / (item.quantity || 1))}</TableCell>
                          <TableCell className="text-right font-bold text-emerald-700">₱{formatCurrency(item.totalCost)}</TableCell>
                        </TableRow>
                     )))
                   )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 3: Distributed */}
        <TabsContent value="distributed" className="mt-0">
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Office</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item Description</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Unit of Measure</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">QTY</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Unit Price</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {divisionRIS.length === 0 ? (
                     <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">No data found.</TableCell></TableRow>
                   ) : (
                     divisionRIS.flatMap(ris => ris.items.map((item, idx) => (
                        <TableRow key={`ris-${ris.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="font-medium text-slate-900">{ris.division}</TableCell>
                          <TableCell className="text-slate-700">{item.description}</TableCell>
                          <TableCell className="text-center text-slate-600">{item.unit}</TableCell>
                          <TableCell className="text-center font-bold text-slate-900">{item.quantityIssued}</TableCell>
                          {/* Note: RIS schema typically doesn't hold unit prices natively, falling back to 0 if undefined */}
                          <TableCell className="text-right text-slate-600">₱{formatCurrency((item as any).unitPrice || 0)}</TableCell>
                          <TableCell className="text-right font-bold text-blue-700">₱{formatCurrency(((item as any).unitPrice || 0) * item.quantityIssued)}</TableCell>
                        </TableRow>
                     )))
                   )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB 4: In Stock */}
        <TabsContent value="in-stock" className="mt-0">
          <Card className="shadow-sm border-slate-200 overflow-hidden">
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-slate-50 border-b border-slate-200">
                  <TableRow className="hover:bg-transparent">
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Office</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider">Item Description</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">Unit of Measure</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-center">QTY</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Unit Price</TableHead>
                    <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {availableStock.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-slate-500">No data found.</TableCell></TableRow>
                  ) : (
                    availableStock.map((stock, idx) => {
                      // Retrieve latest transaction to get current balance and price info
                      const latestTxn = stock.transactions[stock.transactions.length - 1];
                      // FIXED: using 'balance' instead of 'balanceQuantity'
                      const balanceQty = latestTxn ? latestTxn.balance : 0;
                      
                      // Fallback logic for price if not strictly tracked in stock card
                      const currentPrice = 0; 
                      
                      return (
                        <TableRow key={`stock-${stock.id}-${idx}`} className="hover:bg-slate-50 transition-colors">
                          <TableCell className="font-medium text-slate-900">Supply Room</TableCell>
                          {/* FIXED: using 'description' instead of 'itemDescription' */}
                          <TableCell className="text-slate-700">{stock.description}</TableCell>
                          <TableCell className="text-center text-slate-600">Unit</TableCell>
                          <TableCell className="text-center font-bold text-slate-900">{balanceQty}</TableCell>
                          <TableCell className="text-right text-slate-600">₱{formatCurrency(currentPrice)}</TableCell>
                          <TableCell className="text-right font-bold text-amber-700">₱{formatCurrency(currentPrice * balanceQty)}</TableCell>
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