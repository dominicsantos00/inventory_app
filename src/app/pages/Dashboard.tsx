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
  ClipboardCheck,
  ChevronRight,
  Clock
} from 'lucide-react';

type OutletContextType = {
  isCollapsed: boolean;
};

// --- Reusable Metric Card Component ---
function MetricCard({ title, value, subtitle, icon: Icon, colorClass, bgClass }: any) {
  return (
    <Card className="relative overflow-hidden shadow-sm border border-slate-200/60 transition-all hover:shadow-md hover:border-slate-300 bg-white">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">{title}</p>
            <h3 className="text-4xl font-black text-slate-900 tracking-tight">{value}</h3>
          </div>
          <div className={`p-3 rounded-xl ${bgClass} ${colorClass}`}>
            <Icon size={24} strokeWidth={2.5} />
          </div>
        </div>
        <div className="mt-4 flex items-center text-sm">
          <span className="text-slate-500 font-medium">{subtitle}</span>
        </div>
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

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="w-full max-w-full min-w-0 space-y-8 overflow-x-hidden pb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-4 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome, {user?.fullName || 'System Administrator'}
          </h1>
          <p className="text-slate-500 mt-1 flex items-center">
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

        {/* --- INVENTORY METRICS --- */}
        {canViewInventory && (
          <>
            <MetricCard 
              title="Deliveries" 
              value={totalDeliveries} 
              subtitle="All time deliveries" 
              icon={Truck} 
              colorClass="text-emerald-600" 
              bgClass="bg-emerald-50" 
            />
            <MetricCard 
              title="SSN Items" 
              value={totalSSNItems} 
              subtitle="Supply stock numbers" 
              icon={Package} 
              colorClass="text-blue-600" 
              bgClass="bg-blue-50" 
            />
            <MetricCard 
              title="IAR Records" 
              value={totalIARRecords} 
              subtitle="Inspection reports" 
              icon={FileText} 
              colorClass="text-purple-600" 
              bgClass="bg-purple-50" 
            />
            <MetricCard 
              title="RIS Records" 
              value={totalRISRecords} 
              subtitle="Requisition slips" 
              icon={TrendingUp} 
              colorClass="text-amber-600" 
              bgClass="bg-amber-50" 
            />
          </>
        )}

        {/* --- SYSTEM & REPORTING METRICS --- */}
        
        {isAdmin && (
          <MetricCard 
            title="System Users" 
            value={totalUsers} 
            subtitle="Active accounts" 
            icon={Users} 
            colorClass="text-indigo-600" 
            bgClass="bg-indigo-50" 
          />
        )}

        {canViewInventory && (
          <>
            <MetricCard 
              title="RSMI" 
              value={totalRSMIRecords} 
              subtitle="Supplies & Materials" 
              icon={Archive} 
              colorClass="text-pink-600" 
              bgClass="bg-pink-50" 
            />
            <MetricCard 
              title="Stock Cards" 
              value={totalStockCards} 
              subtitle="Inventory tracking items" 
              icon={Layers} 
              colorClass="text-teal-600" 
              bgClass="bg-teal-50" 
            />
            <MetricCard 
              title="RPCI Items" 
              value={totalRPCIRecords} 
              subtitle="Pending physical count" 
              icon={ClipboardCheck} 
              colorClass="text-cyan-600" 
              bgClass="bg-cyan-50" 
            />
          </>
        )}

      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* --- Quick Access Action Buttons --- */}
        <Card className="xl:col-span-1 shadow-sm border-slate-200/60 flex flex-col">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <CardTitle className="text-lg font-bold text-slate-800">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="p-4 flex-1">
            <div className="flex flex-col gap-3">
              {isAdmin && (
                <>
                  <button 
                    onClick={() => navigate('/admin/users')}
                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-indigo-300 hover:shadow-sm hover:bg-indigo-50/30 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-100 transition-colors"><Users size={20} /></div>
                      <div>
                        <h3 className="font-bold text-slate-900">User Management</h3>
                        <p className="text-sm text-slate-500">Manage access</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                  </button>

                  <button 
                    onClick={() => navigate('/admin/master-data')}
                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-300 hover:shadow-sm hover:bg-blue-50/30 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors"><Package size={20} /></div>
                      <div>
                        <h3 className="font-bold text-slate-900">Master Data</h3>
                        <p className="text-sm text-slate-500">SSN & RCC setup</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
                  </button>
                </>
              )}

              {canViewInventory && (
                <>
                  <button 
                    onClick={() => navigate('/inventory/delivery')}
                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-emerald-300 hover:shadow-sm hover:bg-emerald-50/30 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:bg-emerald-100 transition-colors"><Truck size={20} /></div>
                      <div>
                        <h3 className="font-bold text-slate-900">Add Delivery</h3>
                        <p className="text-sm text-slate-500">Record incoming stock</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-emerald-600 transition-colors" />
                  </button>

                  <button 
                    onClick={() => navigate('/inventory/supplies')}
                    className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-amber-300 hover:shadow-sm hover:bg-amber-50/30 transition-all text-left group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-100 transition-colors"><FileText size={20} /></div>
                      <div>
                        <h3 className="font-bold text-slate-900">Generate Reports</h3>
                        <p className="text-sm text-slate-500">IAR, RIS, RSMI</p>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-slate-300 group-hover:text-amber-600 transition-colors" />
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* --- Recent Deliveries List --- */}
        {canViewInventory && (
          <Card className="xl:col-span-2 shadow-sm border-slate-200/60 flex flex-col">
            <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4 flex flex-row items-center justify-between">
              <CardTitle className="text-lg font-bold text-slate-800">Recent Deliveries</CardTitle>
              <button 
                onClick={() => navigate('/inventory/delivery')}
                className="text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                View Inventory
              </button>
            </CardHeader>

            <CardContent className="p-0 flex-1">
              {recentDeliveries.length > 0 ? (
                <div className="divide-y divide-slate-100">
                  {recentDeliveries.map((delivery) => (
                    <div key={delivery.id} className="flex justify-between items-center p-5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-4">
                        <div className="mt-1 h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0">
                          <Package size={18} className="text-slate-500" />
                        </div>
                        <div>
                          <p className="text-base font-bold text-slate-900 line-clamp-1">{delivery.item}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                              PO: {delivery.poNumber}
                            </span>
                            <span className="text-sm text-slate-500 hidden sm:inline-block">• {delivery.supplier}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-lg font-bold text-slate-900">
                          ₱{delivery.totalPrice.toLocaleString()}
                        </p>
                        <p className="text-sm font-medium text-slate-500 mt-0.5">
                          {delivery.quantity} <span className="text-xs">{delivery.unit}</span>
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center p-8 text-slate-500 min-h-[300px]">
                   <Truck size={40} className="text-slate-300 mb-4" />
                   <p className="font-medium text-slate-700">No recent deliveries</p>
                   <p className="text-sm mt-1">Deliveries logged in the system will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}