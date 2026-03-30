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
  
  
} from 'lucide-react';

type OutletContextType = {
  isCollapsed: boolean;
};

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

  if (!isAuthenticated) {
    return <></>;
  }

  const handleLogout = (): void => {
    logout();
    navigate('/login');
  };

  const toggleSidebar = (): void => {
    setIsCollapsed((prev) => !prev);
  };

  const isActive = (path: string): boolean => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  const canAccessAdmin = user?.role === 'level1';
  const canAccessSupplies = user?.role === 'level1' || user?.role === 'level2a';
  const canAccessEquipment = user?.role === 'level1' || user?.role === 'level2b';

  return (
    <div className="flex h-screen w-full overflow-hidden bg-gray-50">
      {/* Sidebar */}
      <aside
        className={`h-screen bg-green-800 text-white transition-all duration-300 ease-in-out flex flex-col shrink-0 ${
          isCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Toggle Button */}
        <div className="flex items-center justify-between p-4 border-b border-green-700 h-[73px] shrink-0">
          {!isCollapsed ? (
            <>
              <div className="overflow-hidden">
                <h1 className="text-xl font-bold whitespace-nowrap">DENR-CAR</h1>
                <p className="text-sm text-green-200 whitespace-nowrap">
                  Supply Inventory System
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                className="text-green-100 hover:text-white hover:bg-green-700 shrink-0"
              >
                <ChevronLeft size={24} />
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleSidebar}
              className="text-green-100 hover:text-white hover:bg-green-700 mx-auto"
            >
              <ChevronRight size={24} />
            </Button>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4">
          <nav className="space-y-2">
            <Link
              to="/dashboard"
              className={`flex items-center gap-3 px-3 py-4 rounded-lg transition-all duration-300 ease-in-out ${
                isActive('/dashboard')
                  ? 'bg-green-700 text-white'
                  : 'text-green-100 hover:bg-green-700/50'
              } ${isCollapsed ? 'justify-center min-h-14' : ''}`}
              title={isCollapsed ? 'Dashboard' : undefined}
            >
              <LayoutDashboard size={isCollapsed ? 28 : 20} className="shrink-0" />
              {!isCollapsed && <span className="truncate text-base font-medium">Dashboard</span>}
            </Link>

            {canAccessAdmin && (
              <>
                {!isCollapsed ? (
                  <div className="pt-4 pb-2">
                    <p className="text-xs text-green-300 px-3">ADMINISTRATION</p>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-green-700/50 mt-2" />
                )}

                <Link
                  to="/admin/users"
                  className={`flex items-center gap-3 px-3 py-4 rounded-lg transition-all duration-300 ease-in-out ${
                    isActive('/admin/users')
                      ? 'bg-green-700 text-white'
                      : 'text-green-100 hover:bg-green-700/50'
                  } ${isCollapsed ? 'justify-center min-h-14' : ''}`}
                  title={isCollapsed ? 'User Management' : undefined}
                >
                  <Users size={isCollapsed ? 28 : 20} className="shrink-0" />
                  {!isCollapsed && (
                    <span className="truncate text-base font-medium">User Management</span>
                  )}
                </Link>

                <Link
                  to="/admin/master-data"
                  className={`flex items-center gap-3 px-3 py-4 rounded-lg transition-all duration-300 ease-in-out ${
                    isActive('/admin/master-data')
                      ? 'bg-green-700 text-white'
                      : 'text-green-100 hover:bg-green-700/50'
                  } ${isCollapsed ? 'justify-center min-h-14' : ''}`}
                  title={isCollapsed ? 'Master Data' : undefined}
                >
                  <Database size={isCollapsed ? 28 : 20} className="shrink-0" />
                  {!isCollapsed && <span className="truncate text-base font-medium">Master Data</span>}
                </Link>
              </>
            )}

            {(canAccessSupplies || canAccessEquipment) && (
              <>
                {!isCollapsed ? (
                  <div className="pt-4 pb-2">
                    <p className="text-xs text-green-300 px-3">INVENTORY</p>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-green-700/50 mt-2" />
                )}

                <Link
                  to="/inventory/delivery"
                  className={`flex items-center gap-3 px-3 py-4 rounded-lg transition-all duration-300 ease-in-out ${
                    isActive('/inventory/delivery')
                      ? 'bg-green-700 text-white'
                      : 'text-green-100 hover:bg-green-700/50'
                  } ${isCollapsed ? 'justify-center min-h-14' : ''}`}
                  title={isCollapsed ? 'Delivery (Stock In)' : undefined}
                >
                  <Truck size={isCollapsed ? 28 : 20} className="shrink-0" />
                  {!isCollapsed && (
                    <span className="truncate text-base font-medium">Delivery (Stock In)</span>
                  )}
                </Link>
              </>
            )}

            {canAccessSupplies && (
              <>
                <Link
                  to="/inventory/supplies"
                  className={`flex items-center gap-3 px-3 py-4 rounded-lg transition-all duration-300 ease-in-out ${
                    isActive('/inventory/supplies')
                      ? 'bg-green-700 text-white'
                      : 'text-green-100 hover:bg-green-700/50'
                  } ${isCollapsed ? 'justify-center min-h-14' : ''}`}
                  title={isCollapsed ? 'Office' : undefined}
                >
                  <Package size={isCollapsed ? 28 : 20} className="shrink-0" />
                  {!isCollapsed && (
                    <span className="truncate text-base font-medium">Office</span>
                  )}
                </Link>

              </>
            )}

            {canAccessEquipment && (
              <Link
                to="/inventory/equipment"
                className={`flex items-center gap-3 px-3 py-4 rounded-lg transition-all duration-300 ease-in-out ${
                  isActive('/inventory/equipment')
                    ? 'bg-green-700 text-white'
                    : 'text-green-100 hover:bg-green-700/50'
                } ${isCollapsed ? 'justify-center min-h-14' : ''}`}
                title={isCollapsed ? 'Equipment' : undefined}
              >
                <Settings size={isCollapsed ? 28 : 20} className="shrink-0" />
                {!isCollapsed && <span className="truncate text-base font-medium">Equipment</span>}
              </Link>
            )}


            {user?.role === 'end-user' && (
              <>
                {!isCollapsed ? (
                  <div className="pt-4 pb-2">
                    <p className="text-xs text-green-300 px-3">PROCUREMENT</p>
                  </div>
                ) : (
                  <div className="pt-4 border-t border-green-700/50 mt-2" />
                )}

                <Link
                  to="/procurement"
                  className={`flex items-center gap-3 px-3 py-4 rounded-lg transition-all duration-300 ease-in-out ${
                    isActive('/procurement')
                      ? 'bg-green-700 text-white'
                      : 'text-green-100 hover:bg-green-700/50'
                  } ${isCollapsed ? 'justify-center min-h-14' : ''}`}
                  title={isCollapsed ? 'My Procurement' : undefined}
                >
                  <ClipboardList size={isCollapsed ? 28 : 20} className="shrink-0" />
                  {!isCollapsed && (
                    <span className="truncate text-base font-medium">My Procurement</span>
                  )}
                </Link>
              </>
            )}
          </nav>
        </div>

        {/* User Area */}
        {!isCollapsed ? (
          <div className="p-4 border-t border-green-700 shrink-0 overflow-hidden">
            <div className="mb-3 px-3 min-w-0">
              <p className="text-base font-semibold truncate">{user?.fullName}</p>
              <p className="text-sm text-green-300 truncate">{user?.email}</p>
              <p className="text-sm text-green-300 mt-1 truncate">
                {user?.role === 'level1' && 'System Administrator'}
                {user?.role === 'level2a' && 'Office Supplies Admin'}
                {user?.role === 'level2b' && 'Equipment Admin'}
                {user?.role === 'end-user' && `End User - ${user?.division}`}
              </p>
            </div>

            <Button
              onClick={handleLogout}
              variant="outline"
              className="w-full bg-green-700 border-green-600 text-white hover:bg-green-600 text-base"
            >
              <LogOut size={18} className="mr-2 shrink-0" />
              Logout
            </Button>
          </div>
        ) : (
          <div className="p-4 border-t border-green-700 flex justify-center shrink-0">
            <Button
              onClick={handleLogout}
              variant="ghost"
              size="icon"
              className="text-green-100 hover:text-white hover:bg-green-700"
              title="Logout"
            >
              <LogOut size={24} />
            </Button>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <div className="flex-1 min-w-0 max-w-full flex flex-col overflow-hidden transition-all duration-300 ease-in-out">
        <header className="bg-white border-b border-gray-200 px-6 py-4 shrink-0 min-w-0">
          <h2 className="text-3xl font-bold text-gray-800 truncate">
            {location.pathname === '/dashboard' && 'Dashboard'}
            {location.pathname.startsWith('/admin/users') && 'User Account Management'}
            {location.pathname.startsWith('/admin/master-data') && 'Master Data Management'}
            {location.pathname.startsWith('/inventory/delivery') && 'Delivery Management'}
            {location.pathname.startsWith('/inventory/supplies') && 'Office'}
            {location.pathname.startsWith('/inventory/equipment') && 'Equipment Management'}
            {location.pathname.startsWith('/procurement') && 'Procurement Data'}
          </h2>
        </header>

        <main className="flex-1 min-w-0 max-w-full overflow-y-auto overflow-x-hidden p-6 transition-all duration-300 ease-in-out">
          <Outlet context={{ isCollapsed } satisfies OutletContextType} />
        </main>
      </div>
    </div>
  );
}