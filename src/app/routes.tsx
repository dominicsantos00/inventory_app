import { createBrowserRouter, Navigate } from 'react-router';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { UserManagement } from './pages/admin/UserManagement';
import { MasterData } from './pages/admin/MasterData';
import { DeliveryPage } from './pages/inventory/DeliveryPage';
import { OfficeSupplies } from './pages/inventory/OfficeSupplies';
import { Equipment } from './pages/inventory/Equipment';
import { Procurement } from './pages/Procurement';
import { PurchaseOrder } from './pages/procurement/PurchaseOrder';
import { RSMISubpage } from './components/inventory/RSMISubpage';
import { StockCardSubpage } from './components/inventory/StockCardSubpage';
import { RPCISubpage } from './components/inventory/RPCISubpage';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <Login />,
  },
  {
    path: '/',
    element: <Layout />,
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <Dashboard />,
      },
      {
        path: 'admin/users',
        element: <UserManagement />,
      },
      {
        path: 'admin/master-data',
        element: <MasterData />,
      },
      {
        path: 'inventory/delivery',
        element: <DeliveryPage />,
      },
      {
        path: 'inventory/supplies',
        element: <OfficeSupplies />,
      },
      {
        path: 'inventory/rsmi',
        element: <RSMISubpage />,
      },
      {
        path: 'inventory/stockcard',
        element: <StockCardSubpage />,
      },
      {
        path: 'inventory/equipment',
        element: <Equipment />,
      },
      {
        path: 'inventory/rpci',
        element: <RPCISubpage />,
      },
      {
        path: 'procurement',
        element: <Procurement />,
      },
      {
        path: 'procurement/po',
        element: <PurchaseOrder />,
      },
    ],
  },
]);
