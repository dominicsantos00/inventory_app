/// <reference types="vite/client" />
export type UserRole = 'level1' | 'level2a' | 'level2b' | 'end-user';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  division?: string; // For end-users
  email: string;
}

export interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}

export interface SSNItem {
  id: string;
  code: string;
  description: string;
  unit: string;
  category: string;
  categoryCode: string;
}

export interface CategoryOption {
  label: string;
  code: string;
}

export interface RCCItem {
  id: string;
  code: string;
  officeName: string;
  divisionName: string;
}

export interface DeliveryItem {
  id: string;
  type: 'Office Supplies' | 'Equipment';
  date: string;
  poNumber: string;
  poDate: string;
  supplier: string;
  receiptNumber: string;
  item: string;
  itemDescription?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  remarks: string;
}

export interface PORecord {
  id: string;
  poNo: string;
  supplier: string;
  poDate: string;
  invoiceNo: string;
  remarks: string;
  status: 'pending' | 'approved' | 'rejected' | 'delivered';
}

export interface IARRecord {
  id: string;
  iarNo: string;
  poNumber: string;
  supplier: string;
  poDate: string;
  invoiceNo: string;
  requisitioningOffice: string;
  responsibilityCenterCode: string;
  items: Array<{
    stockNo: string;
    description: string;
    unit: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
  }>;
  date: string;
}

export interface RISRecord {
  id: string;
  risNo: string;
  division: string;
  responsibilityCenterCode: string;
  date: string;
  requestedBy?: string;
  requestingOffice?: string;
  requestDate?: string;
  items: Array<{
    stockNo: string;
    description: string;
    unit: string;
    quantityRequested: number;
    quantityIssued: number;
    remarks: string;
  }>;
}

export interface RSMIRecord {
  id: string;
  reportNo: string;
  period: string;
  items: Array<{
    stockNo: string;
    description: string;
    unit: string;
    quantity: number;
    unitCost: number;
    totalCost: number;
    office: string;
  }>;
}

export interface StockCardRecord {
  id: string;
  stockNo: string;
  description: string;
  unit: string;
  reorderPoint: number;
  transactions: Array<{
    date: string;
    reference: string;
    received: number;
    issued: number;
    balance: number;
    office: string;
  }>;
}

export interface RPCIRecord {
  id: string;
  reportNo: string;
  countDate: string;
  items: Array<{
    stockNo: string;
    description: string;
    unit: string;
    bookBalance: number;
    unitPrice?: number;
    totalCost?: number;
    physicalCount: number;
    variance: number;
    remarks: string;
  }>;
}
