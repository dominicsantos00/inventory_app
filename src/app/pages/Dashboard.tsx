import { JSX } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { 
  FileText, 
  AlertTriangle, 
  Truck, 
  ArrowRightLeft, 
  TrendingUp, 
  TrendingDown,
  Plus,
  PackagePlus,
  FileBox,
  ClipboardList,
  Clock
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// --- Enhanced Mock Data ---
const stockMovementData = [
  { name: 'Jan', received: 1200, issued: 900 },
  { name: 'Feb', received: 1450, issued: 1100 },
  { name: 'Mar', received: 1100, issued: 1300 },
  { name: 'Apr', received: 1600, issued: 1200 },
  { name: 'May', received: 1300, issued: 1000 },
  { name: 'Jun', received: 1850, issued: 1450 },
];

const recentActivity = [
  { id: 'RIS-2026-042', title: 'Requisition Approved', type: 'ris', status: 'Approved', user: 'Legal Division', time: '2 hours ago' },
  { id: 'PO-2026-089', title: 'Purchase Order Created', type: 'po', status: 'Pending', user: 'Admin Div', time: '5 hours ago' },
  { id: 'IAR-2026-015', title: 'Delivery Received', type: 'delivery', status: 'Completed', user: 'Supplier A', time: 'Yesterday' },
  { id: 'RPCI-2026-001', title: 'Physical Count Generated', type: 'report', status: 'Draft', user: 'System', time: 'Yesterday' },
  { id: 'RIS-2026-041', title: 'Stock Deducted', type: 'ris', status: 'Completed', user: 'Finance', time: '2 days ago' },
];

// --- Helper Components ---
function MetricCard({ title, value, icon: Icon, trend, trendValue, isPositive, alert = false }: any) {
  return (
    <Card className={`relative overflow-hidden shadow-sm border border-slate-200/60 transition-all hover:shadow-md hover:border-slate-300 ${alert ? 'bg-rose-50/30' : 'bg-white'}`}>
      {/* Decorative top accent line */}
      <div className={`absolute top-0 left-0 w-full h-1 ${alert ? 'bg-rose-500' : 'bg-transparent'}`} />
      
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-slate-900 tracking-tight">{value}</h3>
          </div>
          <div className={`p-2.5 rounded-xl ${alert ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-600 border border-slate-100'}`}>
            <Icon size={20} strokeWidth={2.5} />
          </div>
        </div>
        
        <div className="mt-4 flex items-center text-sm">
          {trendValue && (
            <span className={`flex items-center font-medium mr-2 ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {isPositive ? <TrendingUp size={14} className="mr-1" /> : <TrendingDown size={14} className="mr-1" />}
              {trendValue}
            </span>
          )}
          <span className="text-slate-500">{trend}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function ActivityIcon({ type }: { type: string }) {
  const configs: Record<string, any> = {
    ris: { icon: ArrowRightLeft, classes: 'bg-blue-50 text-blue-600 border-blue-100' },
    po: { icon: FileText, classes: 'bg-amber-50 text-amber-600 border-amber-100' },
    delivery: { icon: Truck, classes: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    report: { icon: FileBox, classes: 'bg-purple-50 text-purple-600 border-purple-100' },
  };
  const config = configs[type] || configs.report;
  const Icon = config.icon;
  
  return (
    <div className={`h-10 w-10 rounded-full border flex items-center justify-center shrink-0 ${config.classes}`}>
      <Icon size={18} />
    </div>
  );
}

// --- Main Dashboard Component ---
export default function Dashboard(): JSX.Element {
  // Get current date formatted
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
      
      {/* Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 bg-white p-6 rounded-2xl border border-slate-200/60 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Overview Dashboard</h2>
          <p className="text-slate-500 text-sm mt-1 flex items-center">
            <Clock size={14} className="mr-1.5" /> {today}
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm">
            <Plus size={16} className="mr-2" /> New Purchase Order
          </Button>
          <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700">
            <PackagePlus size={16} className="mr-2" /> Receive Delivery
          </Button>
          <Button variant="outline" className="bg-white border-slate-200 hover:bg-slate-50 text-slate-700">
            <ClipboardList size={16} className="mr-2" /> Create RIS
          </Button>
        </div>
      </div>

      {/* Enhanced Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <MetricCard 
          title="Pending POs" 
          value="12" 
          icon={FileText} 
          trendValue="14%" 
          isPositive={true} 
          trend="vs last month" 
        />
        <MetricCard 
          title="Critical Low Stock" 
          value="8" 
          icon={AlertTriangle} 
          trendValue="2" 
          isPositive={false} 
          trend="requires attention" 
          alert={true} 
        />
        <MetricCard 
          title="Deliveries (IAR)" 
          value="24" 
          icon={Truck} 
          trendValue="8%" 
          isPositive={true} 
          trend="vs last month" 
        />
        <MetricCard 
          title="Pending RIS" 
          value="5" 
          icon={ArrowRightLeft} 
          trendValue="12%" 
          isPositive={false} 
          trend="awaiting approval" 
        />
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Dual Area Chart View */}
        <Card className="xl:col-span-2 shadow-sm border border-slate-200/60 overflow-hidden">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold text-slate-800">Inventory Movement</CardTitle>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-emerald-500 mr-2"></div> Received</div>
                <div className="flex items-center"><div className="w-3 h-3 rounded-full bg-blue-500 mr-2"></div> Issued</div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stockMovementData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorReceived" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorIssued" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12, fontWeight: 500}} 
                    dy={10} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{fill: '#64748b', fontSize: 12}} 
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '12px', 
                      border: '1px solid #e2e8f0', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                      padding: '12px'
                    }}
                    cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="received" 
                    name="Items Received"
                    stroke="#10b981" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorReceived)" 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="issued" 
                    name="Items Issued"
                    stroke="#3b82f6" 
                    strokeWidth={3} 
                    fillOpacity={1} 
                    fill="url(#colorIssued)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Rich Activity Feed */}
        <Card className="shadow-sm border border-slate-200/60 flex flex-col">
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg font-semibold text-slate-800">Recent Activity</CardTitle>
              <button className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">View All</button>
            </div>
          </CardHeader>
          <CardContent className="p-0 flex-1 overflow-y-auto">
            <div className="divide-y divide-slate-100">
              {recentActivity.map((activity) => (
                <div 
                  key={activity.id} 
                  className="flex items-start gap-4 p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                >
                  <ActivityIcon type={activity.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate group-hover:text-green-700 transition-colors">
                      {activity.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {activity.id}
                      </span>
                      <span className="text-xs text-slate-400 truncate hidden sm:inline-block">• {activity.user}</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider">{activity.time}</span>
                    <Badge variant="outline" className={`text-[10px] h-5 px-1.5 font-semibold ${
                      activity.status === 'Completed' ? 'border-emerald-200 text-emerald-700 bg-emerald-50' :
                      activity.status === 'Approved' ? 'border-blue-200 text-blue-700 bg-blue-50' :
                      activity.status === 'Draft' ? 'border-slate-200 text-slate-600 bg-slate-100' :
                      'border-amber-200 text-amber-700 bg-amber-50'
                    }`}>
                      {activity.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 text-center">
            <button className="text-sm font-medium text-green-600 hover:text-green-700 transition-colors w-full">
              Load More Activity
            </button>
          </div>
        </Card>

      </div>
    </div>
  );
}