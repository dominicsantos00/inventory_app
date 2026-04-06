import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  SSNItem,
  RCCItem,
  DeliveryItem,
  PORecord,
  IARRecord,
  RISRecord,
  RSMIRecord,
  StockCardRecord,
  RPCIRecord,
  User,
} from '../types';

interface DataContextType {
  // SSN Data
  ssnItems: SSNItem[];
  addSSNItem: (item: Omit<SSNItem, 'id'>) => Promise<void>;
  updateSSNItem: (id: string, item: Partial<SSNItem>) => Promise<void>;
  deleteSSNItem: (id: string) => Promise<void>;

  // RCC Data
  rccItems: RCCItem[];
  addRCCItem: (item: Omit<RCCItem, 'id'>) => Promise<void>;
  updateRCCItem: (id: string, item: Partial<RCCItem>) => Promise<void>;
  deleteRCCItem: (id: string) => Promise<void>;

  // Purchase Order Data
  poRecords: PORecord[];
  addPORecord: (record: Omit<PORecord, 'id'>) => Promise<void>;
  updatePORecord: (id: string, record: Partial<PORecord>) => Promise<void>;
  deletePORecord: (id: string) => Promise<void>;

  // Delivery Data
  deliveries: DeliveryItem[];
  addDelivery: (item: Omit<DeliveryItem, 'id' | 'totalPrice'>) => Promise<void>;
  updateDelivery: (id: string, item: Partial<DeliveryItem>) => Promise<void>;
  deleteDelivery: (id: string) => Promise<void>;

  // IAR Data
  iarRecords: IARRecord[];
  addIARRecord: (record: Omit<IARRecord, 'id'>) => Promise<void>;
  updateIARRecord: (id: string, record: Partial<IARRecord>) => Promise<void>;
  deleteIARRecord: (id: string) => Promise<void>;

  // RIS Data
  risRecords: RISRecord[];
  addRISRecord: (record: Omit<RISRecord, 'id'>) => Promise<void>;
  updateRISRecord: (id: string, record: Partial<RISRecord>) => Promise<void>;
  deleteRISRecord: (id: string) => Promise<void>;

  // RSMI Data
  rsmiRecords: RSMIRecord[];
  addRSMIRecord: (record: Omit<RSMIRecord, 'id'>) => Promise<void>;
  updateRSMIRecord: (id: string, record: Partial<RSMIRecord>) => Promise<void>;
  deleteRSMIRecord: (id: string) => Promise<void>;

  // Stock Card Data
  stockCards: StockCardRecord[];
  addStockCard: (record: Omit<StockCardRecord, 'id'>) => Promise<void>;
  updateStockCard: (id: string, record: Partial<StockCardRecord>) => Promise<void>;
  deleteStockCard: (id: string) => Promise<void>;

  // RPCI Data
  rpciRecords: RPCIRecord[];
  addRPCIRecord: (record: Omit<RPCIRecord, 'id'>) => Promise<void>;
  updateRPCIRecord: (id: string, record: Partial<RPCIRecord>) => Promise<void>;
  deleteRPCIRecord: (id: string) => Promise<void>;
  fetchStockCardItemsForRPCI: () => Promise<any[]>;
  autoGenerateRPCI: (countDate: string) => Promise<void>;

  // User Management
  users: User[];
  addUser: (user: Omit<User, 'id'>) => Promise<void>;
  updateUser: (id: string, user: Partial<User>) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const API_URL = '/api';

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [ssnItems, setSSNItems] = useState<SSNItem[]>([]);
  const [rccItems, setRCCItems] = useState<RCCItem[]>([]);
  const [poRecords, setPORecords] = useState<PORecord[]>([]);
  const [deliveries, setDeliveries] = useState<DeliveryItem[]>([]);
  const [iarRecords, setIARRecords] = useState<IARRecord[]>([]);
  const [risRecords, setRISRecords] = useState<RISRecord[]>([]);
  const [rsmiRecords, setRSMIRecords] = useState<RSMIRecord[]>([]);
  const [stockCards, setStockCards] = useState<StockCardRecord[]>([]);
  const [rpciRecords, setRPCIRecords] = useState<RPCIRecord[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const endpoints = [
          { url: 'ssnItems', setter: setSSNItems },
          { url: 'rccItems', setter: setRCCItems },
          { url: 'poRecords', setter: setPORecords },
          { url: 'deliveries', setter: setDeliveries },
          { url: 'iarRecords', setter: setIARRecords },
          { url: 'risRecords', setter: setRISRecords },
          { url: 'rsmiRecords', setter: setRSMIRecords },
          { url: 'stockCards', setter: setStockCards },
          { url: 'rpciRecords', setter: setRPCIRecords },
          { url: 'users', setter: setUsers }
        ];

        for (const endpoint of endpoints) {
          try {
            // === CACHE BUSTER 1: Add ?t=timestamp to bypass Vercel Cache ===
            const timestamp = new Date().getTime();
            const response = await fetch(`${API_URL}/${endpoint.url}?t=${timestamp}`, {
              headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              if (Array.isArray(data)) endpoint.setter(data);
            }
          } catch (e) {
            console.warn(`Failed to fetch ${endpoint.url}:`, e);
          }
        }
      } catch (error) {
        console.error('Error fetching data from MySQL database:', error);
      }
    };

    fetchAllData();
  }, []);

  const apiRequest = async (endpoint: string, method: string, data?: any) => {
    try {
      // === CACHE BUSTER 2: Append timestamp if it is a GET request ===
      let url = `${API_URL}/${endpoint}`;
      if (method === 'GET') {
        const separator = url.includes('?') ? '&' : '?';
        url = `${url}${separator}t=${new Date().getTime()}`;
      }

      const response = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        },
        body: data ? JSON.stringify(data) : undefined,
      });

      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        const message = payload?.error || payload?.message || `HTTP error! status: ${response.status}`;
        throw new Error(message);
      }

      return payload;
    } catch (error) {
      console.error(`Error with ${method} on ${endpoint}:`, error);
      throw error;
    }
  };

  // ------------------------------------
  // SSN Functions
  // ------------------------------------
  const addSSNItem = async (item: Omit<SSNItem, 'id'>) => {
    const res = await apiRequest('ssnItems', 'POST', item);
    setSSNItems((prev) => [...prev, { ...item, id: res.id }]);
  };

  const updateSSNItem = async (id: string, item: Partial<SSNItem>) => {
    await apiRequest(`ssnItems/${id}`, 'PUT', item);
    setSSNItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...item } : i)));
  };

  const deleteSSNItem = async (id: string) => {
    await apiRequest(`ssnItems/${id}`, 'DELETE');
    setSSNItems((prev) => prev.filter((i) => i.id !== id));
  };

  // ------------------------------------
  // RCC Functions
  // ------------------------------------
  const addRCCItem = async (item: Omit<RCCItem, 'id'>) => {
    const res = await apiRequest('rccItems', 'POST', item);
    setRCCItems((prev) => [...prev, { ...item, id: res.id }]);
  };

  const updateRCCItem = async (id: string, item: Partial<RCCItem>) => {
    await apiRequest(`rccItems/${id}`, 'PUT', item);
    setRCCItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...item } : i)));
  };

  const deleteRCCItem = async (id: string) => {
    await apiRequest(`rccItems/${id}`, 'DELETE');
    setRCCItems((prev) => prev.filter((i) => i.id !== id));
  };

  // ------------------------------------
  // Purchase Order Functions
  // ------------------------------------
  const addPORecord = async (record: Omit<PORecord, 'id'>) => {
    const res = await apiRequest('poRecords', 'POST', record);
    setPORecords((prev) => [...prev, { ...record, id: res.id }]);
  };

  const updatePORecord = async (id: string, record: Partial<PORecord>) => {
    await apiRequest(`poRecords/${id}`, 'PUT', record);
    setPORecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...record } : r)));
  };

  const deletePORecord = async (id: string) => {
    await apiRequest(`poRecords/${id}`, 'DELETE');
    setPORecords((prev) => prev.filter((r) => r.id !== id));
  };

  // ------------------------------------
  // Delivery Functions
  // ------------------------------------
  const addDelivery = async (item: Omit<DeliveryItem, 'id' | 'totalPrice'>) => {
    const totalPrice = item.quantity * item.unitPrice;
    const newItem = { ...item, totalPrice };
    const res = await apiRequest('deliveries', 'POST', newItem);
    setDeliveries((prev) => [...prev, { ...newItem, id: res.id }]);
    const rpciResponse = await apiRequest('rpciRecords', 'GET');
    setRPCIRecords(rpciResponse);
  };

  const updateDelivery = async (id: string, item: Partial<DeliveryItem>) => {
    const updatedDeliveries = [...deliveries];
    const index = updatedDeliveries.findIndex(i => i.id === id);
    if (index !== -1) {
      const updatedItem = { ...updatedDeliveries[index], ...item };
      updatedItem.totalPrice = updatedItem.quantity * updatedItem.unitPrice;
      await apiRequest(`deliveries/${id}`, 'PUT', updatedItem);
      updatedDeliveries[index] = updatedItem;
      setDeliveries(updatedDeliveries);
      const rpciResponse = await apiRequest('rpciRecords', 'GET');
      setRPCIRecords(rpciResponse);
    }
  };

  const deleteDelivery = async (id: string) => {
    await apiRequest(`deliveries/${id}`, 'DELETE');
    setDeliveries((prev) => prev.filter((i) => i.id !== id));
    const rpciResponse = await apiRequest('rpciRecords', 'GET');
    setRPCIRecords(rpciResponse);
  };

  // ------------------------------------
  // IAR Functions
  // ------------------------------------
  const addIARRecord = async (record: Omit<IARRecord, 'id'>) => {
    const res = await apiRequest('iarRecords', 'POST', record);
    setIARRecords((prev) => [...prev, { ...record, id: res.id }]);
  };

  const updateIARRecord = async (id: string, record: Partial<IARRecord>) => {
    await apiRequest(`iarRecords/${id}`, 'PUT', record);
    setIARRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...record } : r)));
  };

  const deleteIARRecord = async (id: string) => {
    await apiRequest(`iarRecords/${id}`, 'DELETE');
    setIARRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // ------------------------------------
  // RIS Functions
  // ------------------------------------
  const addRISRecord = async (record: Omit<RISRecord, 'id'>) => {
    const res = await apiRequest('risRecords', 'POST', record);
    setRISRecords((prev) => [...prev, { ...record, id: res.id }]);
    const rpciResponse = await apiRequest('rpciRecords', 'GET');
    setRPCIRecords(rpciResponse);
  };

  const updateRISRecord = async (id: string, record: Partial<RISRecord>) => {
    await apiRequest(`risRecords/${id}`, 'PUT', record);
    setRISRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...record } : r)));
    const rpciResponse = await apiRequest('rpciRecords', 'GET');
    setRPCIRecords(rpciResponse);
  };

  const deleteRISRecord = async (id: string) => {
    await apiRequest(`risRecords/${id}`, 'DELETE');
    setRISRecords((prev) => prev.filter((r) => r.id !== id));
    const rpciResponse = await apiRequest('rpciRecords', 'GET');
    setRPCIRecords(rpciResponse);
  };

  // ------------------------------------
  // RSMI Functions
  // ------------------------------------
  const addRSMIRecord = async (record: Omit<RSMIRecord, 'id'>) => {
    const res = await apiRequest('rsmiRecords', 'POST', record);
    setRSMIRecords((prev) => [...prev, { ...record, id: res.id }]);
  };

  const updateRSMIRecord = async (id: string, record: Partial<RSMIRecord>) => {
    await apiRequest(`rsmiRecords/${id}`, 'PUT', record);
    setRSMIRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...record } : r)));
  };

  const deleteRSMIRecord = async (id: string) => {
    await apiRequest(`rsmiRecords/${id}`, 'DELETE');
    setRSMIRecords((prev) => prev.filter((r) => r.id !== id));
  };

  // ------------------------------------
  // Stock Card Functions
  // ------------------------------------
  const addStockCard = async (record: Omit<StockCardRecord, 'id'>) => {
    const res = await apiRequest('stockCards', 'POST', record);
    setStockCards((prev) => [...prev, { ...record, id: res.id }]);
  };

  const updateStockCard = async (id: string, record: Partial<StockCardRecord>) => {
    await apiRequest(`stockCards/${id}`, 'PUT', record);
    setStockCards((prev) => prev.map((r) => (r.id === id ? { ...r, ...record } : r)));
  };

  const deleteStockCard = async (id: string) => {
    await apiRequest(`stockCards/${id}`, 'DELETE');
    setStockCards((prev) => prev.filter((r) => r.id !== id));
  };

  // ------------------------------------
  // RPCI Functions
  // ------------------------------------
  const addRPCIRecord = async (record: Omit<RPCIRecord, 'id'>) => {
    const res = await apiRequest('rpciRecords', 'POST', record);
    setRPCIRecords((prev) => [...prev, { ...record, id: res.id }]);
  };

  const updateRPCIRecord = async (id: string, record: Partial<RPCIRecord>) => {
    await apiRequest(`rpciRecords/${id}`, 'PUT', record);
    setRPCIRecords((prev) => prev.map((r) => (r.id === id ? { ...r, ...record } : r)));
  };

  const deleteRPCIRecord = async (id: string) => {
    await apiRequest(`rpciRecords/${id}`, 'DELETE');
    setRPCIRecords((prev) => prev.filter((r) => r.id !== id));
  };

  const fetchStockCardItemsForRPCI = async () => {
    const response = await apiRequest('rpciRecords/fetch-stock-items', 'GET');
    return response.items || [];
  };

  const autoGenerateRPCI = async (countDate: string) => {
    await apiRequest('rpciRecords/auto-generate', 'POST', { countDate });
    const rpciResponse = await apiRequest('rpciRecords', 'GET');
    setRPCIRecords(rpciResponse);
  };

  // ------------------------------------
  // User Functions
  // ------------------------------------
  const addUser = async (user: Omit<User, 'id'>) => {
    try {
      const res = await apiRequest('users', 'POST', user);
      
      const userData = res.data || res.user || {
        id: res.id,
        ...user
      };
      
      if (!userData.id) {
        throw new Error('Server did not return user ID');
      }
      
      const newUser: User = {
        id: userData.id,
        username: userData.username || user.username,
        fullName: userData.fullName || user.fullName,
        email: userData.email || user.email,
        role: userData.role || user.role,
        division: userData.division !== undefined ? userData.division : user.division
      };
      
      setUsers((prev) => [...prev, newUser]);
    } catch (error) {
      console.error('[DataContext] Error in addUser:', error);
      throw error;
    }
  };

  const updateUser = async (id: string, user: Partial<User>) => {
    try {
      await apiRequest(`users/${id}`, 'PUT', user);
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...user } : u)));
    } catch (error) {
      throw error;
    }
  };

  const deleteUser = async (id: string) => {
    try {
      await apiRequest(`users/${id}`, 'DELETE');
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (error) {
      throw error;
    }
  };

  const value: DataContextType = {
    ssnItems, addSSNItem, updateSSNItem, deleteSSNItem,
    rccItems, addRCCItem, updateRCCItem, deleteRCCItem,
    poRecords, addPORecord, updatePORecord, deletePORecord,
    deliveries, addDelivery, updateDelivery, deleteDelivery,
    iarRecords, addIARRecord, updateIARRecord, deleteIARRecord,
    risRecords, addRISRecord, updateRISRecord, deleteRISRecord,
    rsmiRecords, addRSMIRecord, updateRSMIRecord, deleteRSMIRecord,
    stockCards, addStockCard, updateStockCard, deleteStockCard,
    rpciRecords, addRPCIRecord, updateRPCIRecord, deleteRPCIRecord, fetchStockCardItemsForRPCI, autoGenerateRPCI,
    users, addUser, updateUser, deleteUser,
  };

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}