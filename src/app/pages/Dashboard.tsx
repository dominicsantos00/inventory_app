import { JSX } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { FileText, AlertTriangle, Truck, ArrowRightLeft } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

// --- Mock Data (Replace with real context data later) ---
const stockData = [
  { name: 'Jan', units: 1200 },
  { name: 'Feb', units: 1450 },
  { name: 'Mar', units: 1100 },
  { name: 'Apr', units: 1600 },
  { name: 'May', units: 1300 },
  { name: 'Jun', units: 1550 },
];

const recentTransactions = [
  { id: 'RIS-2024-001', type: 'Requisition (RIS)', status: 'Pending', date: '2024-03-24' },
  { id: 'PO-2024-042', type: 'Purchase Order', status: 'Approved', date: '2024-03-23' },
  { id: 'IAR-2024-015', type: 'Goods Receipt', status: 'Completed', date: '2024-03-22' },
  { id: 'RSMI-2024-008', type: 'Report Auto-Gen', status: 'Completed', date: '2024-03-20' },
];

// --- Helper Components ---
function MetricCard({ title, value, icon: Icon, trend, alert = false }: { title: string, value: string, icon: any, trend: string, alert?: boolean }) {
  return (
    <Card className={`shadow-sm border-slate-200 transition-all hover:shadow-md ${alert ? 'border-red-200 bg-red-50/30' : 'bg-white'}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`p-3 rounded-xl ${alert ? 'bg-red-100 text-red-600' : 'bg-green-50 text-green-600'}`}>
            <Icon size={24} />
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="text-3xl font-bold text-slate-900 mt-1">{value}</h3>
          <p className={`text-xs mt-2 font-medium ${alert ? 'text-red-600' : 'text-slate-500'}`}>{trend}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Pending: 'bg-yellow-100 text-yellow-800',
    Approved: 'bg-blue-100 text-blue-800',
    Completed: 'bg-green-100 text-green-800',
  };
  
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-slate-100 text-slate-800'}`}>
      {status}
    </span>
  );
}

// --- Main Dashboard Component ---
export default function Dashboard(): JSX.Element {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Page Title & Greeting */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Overview</h2>
        <p className="text-slate-500 text-sm mt-1">Here's what's happening in your inventory today.</p>
      </div>

      {/* Top Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard title="Pending POs" value="12" icon={FileText} trend="+2 from yesterday" />
        <MetricCard title="Critical Low Stock" value="8" icon={AlertTriangle} trend="Requires immediate action" alert />
        <MetricCard title="Deliveries (IAR)" value="24" icon={Truck} trend="This month" />
        <MetricCard title="Pending RIS" value="5" icon={ArrowRightLeft} trend="Awaiting approval" />
      </div>

      {/* Main Charts & Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Area Chart View */}
        <Card className="lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg text-slate-800">Stock Movement Trend (6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stockData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUnits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="units" 
                    stroke="#16a34a" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorUnits)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions List */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg text-slate-800">Recent Activity</CardTitle>
            <button className="text-sm text-green-600 hover:text-green-700 font-medium transition-colors">
              View all
            </button>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 mt-4">
              {recentTransactions.map((tx) => (
                <div 
                  key={tx.id} 
                  className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-lg transition-colors border border-transparent hover:border-slate-100 cursor-pointer"
                >
                  <div>
                    <p className="text-sm font-medium text-slate-900">{tx.id}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{tx.type} • {tx.date}</p>
                  </div>
                  <StatusBadge status={tx.status} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}