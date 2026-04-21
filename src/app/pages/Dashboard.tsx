import { useOutletContext, useNavigate } from 'react-router';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { 
  Package, 
  Truck, 
  FileText, 
  Users, 
  TrendingUp, 
  Archive,
  Layers,
  ClipboardCheck,
  ArrowRight,
  Clock
} from 'lucide-react';

type OutletContextType = {
  isCollapsed: boolean;
};

// --- Modern Metric Card Component ---
function StatCard({ title, value, subtitle, icon: Icon, colorClass, bgClass }: any) {
  return (
    <Card className="shadow-sm border-slate-200 hover:shadow-md hover:border-slate-300 transition-all overflow-hidden group relative bg-white">
      <CardContent className="p-6">
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-2">{title}</p>
            <div className="text-4xl font-bold text-slate-900 tracking-tight">{value}</div>
          </div>
          <div className={`p-3 rounded-2xl ${bgClass} ${colorClass} group-hover:scale-110 transition-transform`}>
            <Icon size={24} strokeWidth={2.5} />
          </div>
        </div>
        <p className="text-sm text-slate-500 mt-4 font-medium">{subtitle}</p>
      </CardContent>
    </Card>
  );
}

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
  const canViewInventory = user?.role === 'level1' || user?.role === 'level2a' || user?.role === 'level2b';

  // Get current date
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="w-full max-w-full min-w-0 space-y-8 overflow-x-hidden pb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.fullName || 'System Administrator'}
          </h1>
          <p className="text-sm text-slate-500 mt-1 flex items-center">
            Here's what's happening with your inventory today.
          </p>
        </div>
        <div className="flex items-center text-sm font-medium text-slate-600 bg-slate-50 px-4 py-2 rounded-lg border border-slate-100">
          <Clock size={16} className="mr-2 text-slate-400" />
          {today}
        </div>
      </div>

      {/* Main Dashboard Metrics - 4x2 Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">

        {/* --- TOP ROW --- */}
        {canViewInventory && (
          <>
            <StatCard 
              title="Deliveries" value={totalDeliveries} subtitle="All time deliveries" 
              icon={Truck} colorClass="text-emerald-600" bgClass="bg-emerald-50" 
            />
            <StatCard 
              title="SSN Items" value={totalSSNItems} subtitle="Supply stock numbers" 
              icon={Package} colorClass="text-blue-600" bgClass="bg-blue-50" 
            />
            <StatCard 
              title="IAR Records" value={totalIARRecords} subtitle="Inspection reports" 
              icon={FileText} colorClass="text-purple-600" bgClass="bg-purple-50" 
            />
            <StatCard 
              title="RIS Records" value={totalRISRecords} subtitle="Requisition slips" 
              icon={TrendingUp} colorClass="text-amber-600" bgClass="bg-amber-50" 
            />
          </>
        )}

        {/* --- BOTTOM ROW --- */}
        {isAdmin && (
          <StatCard 
            title="System Users" value={totalUsers} subtitle="Active accounts" 
            icon={Users} colorClass="text-indigo-600" bgClass="bg-indigo-50" 
          />
        )}

        {canViewInventory && (
          <>
            <StatCard 
              title="RSMI" value={totalRSMIRecords} subtitle="Supplies & Materials" 
              icon={Archive} colorClass="text-pink-600" bgClass="bg-pink-50" 
            />
            <StatCard 
              title="Stock Cards" value={totalStockCards} subtitle="Inventory Tracking" 
              icon={Layers} colorClass="text-teal-600" bgClass="bg-teal-50" 
            />
            <StatCard 
              title="RPCI" value={totalRPCIRecords} subtitle="Physical Count items" 
              icon={ClipboardCheck} colorClass="text-cyan-600" bgClass="bg-cyan-50" 
            />
          </>
        )}
      </div>

      {/* --- Quick Access Action Buttons --- */}
      <div>
        <h3 className="text-xl font-bold text-slate-900 mb-4 px-1">Quick Actions</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
          {isAdmin && (
            <>
              <button 
                className="group flex flex-col p-6 bg-white border border-slate-200 rounded-2xl hover:border-green-300 hover:shadow-md transition-all text-left relative overflow-hidden"
                onClick={() => navigate('/admin/users')}
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                  <ArrowRight className="text-green-600" size={20} />
                </div>
                <Users className="h-10 w-10 text-green-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-900">User Management</h3>
                <p className="text-sm text-slate-500 mt-1">Manage system accounts & roles</p>
              </button>

              <button 
                className="group flex flex-col p-6 bg-white border border-slate-200 rounded-2xl hover:border-blue-300 hover:shadow-md transition-all text-left relative overflow-hidden"
                onClick={() => navigate('/admin/master-data')}
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                  <ArrowRight className="text-blue-600" size={20} />
                </div>
                <Package className="h-10 w-10 text-blue-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-900">Master Data</h3>
                <p className="text-sm text-slate-500 mt-1">Configure SSN and RCC records</p>
              </button>
            </>
          )}

          {canViewInventory && (
            <>
              <button 
                className="group flex flex-col p-6 bg-white border border-slate-200 rounded-2xl hover:border-purple-300 hover:shadow-md transition-all text-left relative overflow-hidden"
                onClick={() => navigate('/inventory/delivery')}
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                  <ArrowRight className="text-purple-600" size={20} />
                </div>
                <Truck className="h-10 w-10 text-purple-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-900">Add Delivery</h3>
                <p className="text-sm text-slate-500 mt-1">Record new incoming deliveries</p>
              </button>

              <button 
                className="group flex flex-col p-6 bg-white border border-slate-200 rounded-2xl hover:border-orange-300 hover:shadow-md transition-all text-left relative overflow-hidden"
                onClick={() => navigate('/inventory/supplies')}
              >
                <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                  <ArrowRight className="text-orange-600" size={20} />
                </div>
                <FileText className="h-10 w-10 text-orange-600 mb-4" />
                <h3 className="text-lg font-bold text-slate-900">Generate Reports</h3>
                <p className="text-sm text-slate-500 mt-1">Access IAR, RIS, and RSMI</p>
              </button>
            </>
          )}
        </div>
      </div>

      {/* --- Recent Deliveries List --- */}
      {canViewInventory && recentDeliveries.length > 0 && (
        <Card className="shadow-sm border-slate-200 overflow-hidden">
          <CardHeader className="bg-white border-b border-slate-100 pb-4">
            <CardTitle className="text-lg font-bold text-slate-900">
              Recent Deliveries
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {recentDeliveries.map((delivery) => (
                <div
                  key={delivery.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-5 hover:bg-slate-50 transition-colors gap-4"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      <Truck className="h-5 w-5 text-slate-500" />
                    </div>
                    <div>
                      <p className="text-base font-bold text-slate-900">{delivery.item}</p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200">
                          {delivery.poNumber}
                        </Badge>
                        <span className="text-sm text-slate-500">from <span className="font-medium text-slate-700">{delivery.supplier}</span></span>
                      </div>
                    </div>
                  </div>

                  <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center pl-14 sm:pl-0">
                    <p className="text-lg font-bold text-slate-900">
                      ₱{delivery.totalPrice.toLocaleString()}
                    </p>
                    <p className="text-sm font-medium text-slate-500">
                      {delivery.quantity} <span className="text-slate-400">{delivery.unit}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}