import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { IARSubpage } from '../../components/inventory/IARSubpage';
import { RISSubpage } from '../../components/inventory/RISSubpage';
import { RSMISubpage } from '../../components/inventory/RSMISubpage';
import { StockCardSubpage } from '../../components/inventory/StockCardSubpage';
import { RPCISubpage } from '../../components/inventory/RPCISubpage';
import {
  FileCheck,
  FileSpreadsheet,
  ClipboardList,
  Database,
  FileBox,
} from 'lucide-react';

export function OfficeSupplies() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Office Supplies</h2>
          <p className="text-slate-500 text-sm mt-1">
            Manage inventory reports, records, stock cards, and physical counts.
          </p>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="iar" className="w-full">
        {/* Modernized Large Tabs */}
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5 bg-slate-100/50 p-1.5 rounded-xl h-auto gap-1.5 border border-slate-200">
          
          <TabsTrigger
            value="iar"
            className="flex flex-col py-3.5 rounded-lg text-slate-500 transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200 group"
          >
            <FileCheck className="h-5 w-5 mb-1.5 text-slate-400 group-data-[state=active]:text-green-600 transition-colors" />
            <span className="font-semibold text-sm">IAR</span>
            <span className="text-[10px] font-normal text-slate-400 mt-0.5 hidden md:inline">Inspection & Acceptance</span>
          </TabsTrigger>

          <TabsTrigger
            value="ris"
            className="flex flex-col py-3.5 rounded-lg text-slate-500 transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200 group"
          >
            <ClipboardList className="h-5 w-5 mb-1.5 text-slate-400 group-data-[state=active]:text-blue-600 transition-colors" />
            <span className="font-semibold text-sm">RIS</span>
            <span className="text-[10px] font-normal text-slate-400 mt-0.5 hidden md:inline">Requisition & Issue</span>
          </TabsTrigger>

          <TabsTrigger
            value="rsmi"
            className="flex flex-col py-3.5 rounded-lg text-slate-500 transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200 group"
          >
            <FileSpreadsheet className="h-5 w-5 mb-1.5 text-slate-400 group-data-[state=active]:text-purple-600 transition-colors" />
            <span className="font-semibold text-sm">RSMI</span>
            <span className="text-[10px] font-normal text-slate-400 mt-0.5 hidden md:inline">Supplies & Materials</span>
          </TabsTrigger>

          <TabsTrigger
            value="stock-card"
            className="flex flex-col py-3.5 rounded-lg text-slate-500 transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200 group"
          >
            <Database className="h-5 w-5 mb-1.5 text-slate-400 group-data-[state=active]:text-amber-600 transition-colors" />
            <span className="font-semibold text-sm">Stock Card</span>
            <span className="text-[10px] font-normal text-slate-400 mt-0.5 hidden md:inline">Inventory Tracking</span>
          </TabsTrigger>

          <TabsTrigger
            value="rpci"
            className="flex flex-col py-3.5 rounded-lg text-slate-500 transition-all data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm border border-transparent data-[state=active]:border-slate-200 group"
          >
            <FileBox className="h-5 w-5 mb-1.5 text-slate-400 group-data-[state=active]:text-indigo-600 transition-colors" />
            <span className="font-semibold text-sm">RPCI</span>
            <span className="text-[10px] font-normal text-slate-400 mt-0.5 hidden md:inline">Physical Count</span>
          </TabsTrigger>

        </TabsList>

        <div className="mt-6">
          <TabsContent value="iar" className="m-0"><IARSubpage /></TabsContent>
          <TabsContent value="ris" className="m-0"><RISSubpage /></TabsContent>
          <TabsContent value="rsmi" className="m-0"><RSMISubpage /></TabsContent>
          <TabsContent value="stock-card" className="m-0"><StockCardSubpage /></TabsContent>
          <TabsContent value="rpci" className="m-0"><RPCISubpage /></TabsContent>
        </div>
      </Tabs>
    </div>
  );
}