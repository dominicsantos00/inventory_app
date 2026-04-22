import { useState, useEffect } from 'react';
import type { JSX } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router';
import { useAuth } from '../context/AuthContext';
import { Button } from './ui/button';
import {
  LayoutDashboard,
  Package,
  Users,
  Database,
  LogOut,
  Settings,
  ClipboardList,
  Truck,
  ChevronLeft,
  ChevronRight,
  Bell,
  Search
} from 'lucide-react';

type OutletContextType = {
  isCollapsed: boolean;
};

// --- Helper Components for a cleaner Sidebar ---
function NavItem({ to, icon: Icon, label, isActive, isCollapsed }: { to: string, icon: any, label: string, isActive: boolean, isCollapsed: boolean }) {
  return (
    <Link
      to={to}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
        isActive 
          ? 'bg-green-50 text-green-700 font-medium' 
          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
      } ${isCollapsed ? 'justify-center' : ''}`}
      title={isCollapsed ? label : undefined}
    >
      <Icon size={20} className={isActive ? 'text-green-600' : 'text-slate-400'} />
      {!isCollapsed && <span className="text-sm">{label}</span>}
    </Link>
  );
}

function NavSection({ label, isCollapsed, children }: { label: string, isCollapsed: boolean, children: React.ReactNode }) {
  return (
    <div className="mt-6 mb-2">
      {!isCollapsed && (
        <p className="px-3 text-xs font-semibold text-slate-400 tracking-wider uppercase mb-2">
          {label}
        </p>
      )}
      <div className="space-y-1">{children}</div>
    </div>
  );
}

// --- Main Layout Component ---
export function Layout(): JSX.Element {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return <></>;

  const handleLogout = (): void => {
    logout();
    navigate('/login');
  };

  const isActive = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  // Role-based access logic
  const canAccessAdmin = user?.role === 'level1';
  const canAccessSupplies = user?.role === 'level1' || user?.role === 'level2a';
  const canAccessEquipment = user?.role === 'level1' || user?.role === 'level2b';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 font-sans">
      
      {/* Modern Sidebar */}
      <aside
        className={`h-screen bg-white border-r border-slate-200 transition-all duration-300 ease-in-out flex flex-col shrink-0 relative z-20 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Brand Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 h-[73px] shrink-0">
          {!isCollapsed ? (
            <div className="overflow-hidden flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-green-700 flex items-center justify-center text-white font-bold">
                D
              </div>
              <div>
                <h1 className="text-sm font-bold text-slate-900 tracking-tight">DENR-CAR</h1>
                <p className="text-[10px] text-slate-500 uppercase font-semibold tracking-wider">Inventory System</p>
              </div>
            </div>
          ) : (
            <div className="h-8 w-8 rounded-lg bg-green-700 flex items-center justify-center text-white font-bold mx-auto">
              D
            </div>
          )}
        </div>

        {/* Collapse Toggle Button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-6 bg-white border border-slate-200 text-slate-400 hover:text-slate-600 rounded-full p-1 shadow-sm transition-colors z-30"
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Navigation Area */}
        <div className="flex-1 overflow-y-auto p-4 scrollbar-hide">
          <nav className="space-y-1">
            <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" isActive={isActive('/dashboard')} isCollapsed={isCollapsed} />

            {canAccessAdmin && (
              <NavSection label="Administration" isCollapsed={isCollapsed}>
                <NavItem to="/admin/users" icon={Users} label="User Management" isActive={isActive('/admin/users')} isCollapsed={isCollapsed} />
                <NavItem to="/admin/master-data" icon={Database} label="Master Data" isActive={isActive('/admin/master-data')} isCollapsed={isCollapsed} />
              </NavSection>
            )}

            {(canAccessSupplies || canAccessEquipment) && (
              <NavSection label="Inventory" isCollapsed={isCollapsed}>
                <NavItem to="/inventory/delivery" icon={Truck} label="Deliveries" isActive={isActive('/inventory/delivery')} isCollapsed={isCollapsed} />
                {canAccessSupplies && <NavItem to="/inventory/supplies" icon={Package} label="Office Supplies" isActive={isActive('/inventory/supplies')} isCollapsed={isCollapsed} />}
                {canAccessEquipment && <NavItem to="/inventory/equipment" icon={Settings} label="Equipment" isActive={isActive('/inventory/equipment')} isCollapsed={isCollapsed} />}
              </NavSection>
            )}

            {user?.role === 'end-user' && (
              <NavSection label="Procurement" isCollapsed={isCollapsed}>
                <NavItem to="/procurement" icon={ClipboardList} label="My Procurement" isActive={isActive('/procurement')} isCollapsed={isCollapsed} />
              </NavSection>
            )}
          </nav>
        </div>

        {/* User Profile & Logout Footer */}
        <div className="p-4 border-t border-slate-100 shrink-0">
          {!isCollapsed ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 px-2">
                <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-medium">
                  {user?.fullName?.charAt(0) || 'U'}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">{user?.fullName}</p>
                  <p className="text-xs text-slate-500 truncate">
                    {user?.role === 'level1' && 'System Admin'}
                    {user?.role === 'level2a' && 'Supplies Admin'}
                    {user?.role === 'level2b' && 'Equipment Admin'}
                    {user?.role === 'end-user' && `End User`}
                  </p>
                </div>
              </div>
              <Button onClick={handleLogout} variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50">
                <LogOut size={18} className="mr-2" /> Logout
              </Button>
            </div>
          ) : (
            <Button onClick={handleLogout} variant="ghost" size="icon" className="w-full text-slate-400 hover:text-red-600 hover:bg-red-50" title="Logout">
              <LogOut size={20} />
            </Button>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8">
          <div className="max-w-7xl mx-auto">
            <Outlet context={{ isCollapsed } satisfies OutletContextType} />
          </div>
        </main>
      </div>
    </div>
  );
}