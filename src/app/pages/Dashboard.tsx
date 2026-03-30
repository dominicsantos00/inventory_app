import { useOutletContext, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { 
  Package, 
  Truck, 
  FileText, 
  Users, 
  TrendingUp, 
  Archive,
  Layers,
  ClipboardCheck 
} from 'lucide-react';

type OutletContextType = {
  isCollapsed: boolean;
};

export function Dashboard() {
  const { user } = useAuth();
  const [derivedRPCICount, setDerivedRPCICount] = useState<number>(0);
  
  // Pull all required data arrays from DataContext
  const { 
    deliveries, 
    ssnItems, 
    users, 
    iarRecords, 
    risRecords, 
    rsmiRecords, 
    stockCards, 
    rpciRecords,
    fetchStockCardItemsForRPCI 
  } = useData();
  
  useOutletContext<OutletContextType>();
  const navigate = useNavigate();

  // Fetch derived RPCI items using same function as RPCI module
  useEffect(() => {
    const fetchDerivedRPCICount = async () => {
      try {
        const items = await fetchStockCardItemsForRPCI();
        // Filter to show only items with positive remaining balance (matching RPCI module)
        const count = items.filter((item: any) => item.bookBalance > 0).length;
        setDerivedRPCICount(count);
      } catch (error) {
        console.error('Failed to fetch derived RPCI items:', error);
      }
    };

    fetchDerivedRPCICount();
  }, [deliveries, risRecords, rpciRecords, fetchStockCardItemsForRPCI]);

  // Calculate dynamic totals for all 8 modules
  const totalDeliveries = deliveries?.length || 0;
  const totalSSNItems = ssnItems?.length || 0;
  const totalIARRecords = iarRecords?.length || 0;
  const totalRISRecords = risRecords?.length || 0;
  
  const totalUsers = users?.length || 0;
  const totalRSMIRecords = rsmiRecords?.length || 0;
  const totalStockCards = stockCards?.length || 0;
  const totalRPCIRecords = derivedRPCICount;

  const recentDeliveries = deliveries.slice(-5).reverse();

  const isAdmin = user?.role === 'level1';
  const canViewInventory =
    user?.role === 'level1' || user?.role === 'level2a' || user?.role === 'level2b';

  return (
    <div className="w-full max-w-full min-w-0 space-y-8 overflow-x-hidden pb-8">

      {/* Header */}
      <div>
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">
          {user?.fullName || 'System Administrator'}
        </h1>
        <p className="text-lg text-slate-500 mt-2">
          Here's what's happening with your inventory today.
        </p>
      </div>

      {/* Main Dashboard Metrics - 4x2 Grid Layout
        All cards here are strictly static, view-only components.
      */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        {/* --- TOP ROW (4 Cards) --- */}
        {canViewInventory && (
          <>
            {/* Total Deliveries */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold uppercase text-slate-500">
                  Total Deliveries
                </CardTitle>
                <Truck className="h-7 w-7 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-slate-900">
                  {totalDeliveries}
                </div>
                <p className="text-lg text-slate-500 mt-2">
                  All time deliveries
                </p>
              </CardContent>
            </Card>

            {/* SSN Items */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold uppercase text-slate-500">
                  SSN Items
                </CardTitle>
                <Package className="h-7 w-7 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-slate-900">
                  {totalSSNItems}
                </div>
                <p className="text-lg text-slate-500 mt-2">
                  Supply stock numbers
                </p>
              </CardContent>
            </Card>

            {/* IAR Records */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold uppercase text-slate-500">
                  IAR Records
                </CardTitle>
                <FileText className="h-7 w-7 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-slate-900">
                  {totalIARRecords}
                </div>
                <p className="text-lg text-slate-500 mt-2">
                  Inspection reports
                </p>
              </CardContent>
            </Card>

            {/* RIS Records */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold uppercase text-slate-500">
                  RIS Records
                </CardTitle>
                <TrendingUp className="h-7 w-7 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-slate-900">
                  {totalRISRecords}
                </div>
                <p className="text-lg text-slate-500 mt-2">
                  Requisition slips
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {/* --- BOTTOM ROW (4 Cards) --- */}
        
        {/* System Users (Conditionally rendered for Admins) */}
        {isAdmin && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-bold uppercase text-slate-500">
                System Users
              </CardTitle>
              <Users className="h-7 w-7 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-black text-slate-900">
                {totalUsers}
              </div>
              <p className="text-lg text-slate-500 mt-2">
                Active accounts
              </p>
            </CardContent>
          </Card>
        )}

        {canViewInventory && (
          <>
            {/* RSMI Card */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold uppercase text-slate-500">
                  RSMI
                </CardTitle>
                <Archive className="h-7 w-7 text-pink-600" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-slate-900">
                  {totalRSMIRecords}
                </div>
                <p className="text-lg text-slate-500 mt-2">
                  Supplies & Materials
                </p>
              </CardContent>
            </Card>

            {/* Stock Card */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold uppercase text-slate-500">
                  Stock Card
                </CardTitle>
                <Layers className="h-7 w-7 text-teal-600" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-slate-900">
                  {totalStockCards}
                </div>
                <p className="text-lg text-slate-500 mt-2">
                  Inventory Tracking
                </p>
              </CardContent>
            </Card>

            {/* RPCI Card */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-bold uppercase text-slate-500">
                  RPCI
                </CardTitle>
                <ClipboardCheck className="h-7 w-7 text-cyan-600" />
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-black text-slate-900">
                  {totalRPCIRecords}
                </div>
                <p className="text-lg text-slate-500 mt-2">
                  Physical Count
                </p>
              </CardContent>
            </Card>
          </>
        )}

      </div>

      {/* --- Quick Access Action Buttons --- */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle className="text-3xl font-bold">
            Quick Access
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
            {isAdmin && (
              <>
                <button 
                  className="p-6 border rounded-xl hover:bg-green-50 transition-colors text-left"
                  onClick={() => navigate('/admin/users')}
                >
                  <Users className="h-11 w-11 text-green-600 mb-3" />
                  <h3 className="text-xl font-bold">
                    User Management
                  </h3>
                  <p className="text-base text-slate-500">
                    Manage user accounts
                  </p>
                </button>

                <button 
                  className="p-6 border rounded-xl hover:bg-blue-50 transition-colors text-left"
                  onClick={() => navigate('/admin/master-data')}
                >
                  <Package className="h-11 w-11 text-blue-600 mb-3" />
                  <h3 className="text-xl font-bold">
                    Master Data
                  </h3>
                  <p className="text-base text-slate-500">
                    Manage SSN and RCC
                  </p>
                </button>
              </>
            )}

            {canViewInventory && (
              <>
                <button 
                  className="p-6 border rounded-xl hover:bg-purple-50 transition-colors text-left"
                  onClick={() => navigate('/inventory/delivery')}
                >
                  <Truck className="h-11 w-11 text-purple-600 mb-3" />
                  <h3 className="text-xl font-bold">
                    Add Delivery
                  </h3>
                  <p className="text-base text-slate-500">
                    Record new deliveries
                  </p>
                </button>

                <button 
                  className="p-6 border rounded-xl hover:bg-orange-50 transition-colors text-left"
                  onClick={() => navigate('/inventory/supplies')}
                >
                  <FileText className="h-11 w-11 text-orange-600 mb-3" />
                  <h3 className="text-xl font-bold">
                    Generate Reports
                  </h3>
                  <p className="text-base text-slate-500">
                    IAR, RIS, RSMI reports
                  </p>
                </button>
              </>
            )}
          </div>
        </CardContent>
      </Card>

      {/* --- Recent Deliveries List --- */}
      {canViewInventory && recentDeliveries.length > 0 && (
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-2xl font-bold">
              Recent Deliveries
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-4">
            {recentDeliveries.map((delivery) => (
              <div
                key={delivery.id}
                className="flex justify-between items-center p-4 border rounded-lg bg-slate-50"
              >
                <div>
                  <p className="text-lg font-bold">{delivery.item}</p>
                  <p className="text-base text-slate-500">
                    PO: {delivery.poNumber} • Supplier: {delivery.supplier}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold">
                    ₱{delivery.totalPrice.toLocaleString()}
                  </p>
                  <p className="text-base text-slate-500">
                    {delivery.quantity} {delivery.unit}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

    </div>
  );
}