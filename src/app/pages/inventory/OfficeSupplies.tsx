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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900"></h1>
          <p className="text-gray-600 mt-1">
            Manage inventory reports, records, and stock cards.
          </p>
        </div>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="iar" className="w-full">
        <TabsList className="grid w-full grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 bg-white border rounded-lg h-auto p-1 gap-1">
          <TabsTrigger
            value="iar"
            className="flex flex-col py-3 data-[state=active]:bg-green-50 data-[state=active]:text-green-700"
          >
            <FileCheck className="h-5 w-5 mb-1" />
            <span className="font-semibold">IAR</span>
            <span className="text-[10px] font-normal hidden md:inline">
              Inspection & Acceptance
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="ris"
            className="flex flex-col py-3 data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700"
          >
            <ClipboardList className="h-5 w-5 mb-1" />
            <span className="font-semibold">RIS</span>
            <span className="text-[10px] font-normal hidden md:inline">
              Requisition & Issue
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="rsmi"
            className="flex flex-col py-3 data-[state=active]:bg-purple-50 data-[state=active]:text-purple-700"
          >
            <FileSpreadsheet className="h-5 w-5 mb-1" />
            <span className="font-semibold">RSMI</span>
            <span className="text-[10px] font-normal hidden md:inline">
              Supplies & Materials
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="stock-card"
            className="flex flex-col py-3 data-[state=active]:bg-orange-50 data-[state=active]:text-orange-700"
          >
            <Database className="h-5 w-5 mb-1" />
            <span className="font-semibold">Stock Card</span>
            <span className="text-[10px] font-normal hidden md:inline">
              Inventory Tracking
            </span>
          </TabsTrigger>

          <TabsTrigger
            value="rpci"
            className="flex flex-col py-3 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700"
          >
            <FileBox className="h-5 w-5 mb-1" />
            <span className="font-semibold">RPCI</span>
            <span className="text-[10px] font-normal hidden md:inline">
              Physical Count
            </span>
          </TabsTrigger>
        </TabsList>

        <div className="mt-6">
          <TabsContent value="iar">
            <IARSubpage />
          </TabsContent>

          <TabsContent value="ris">
            <RISSubpage />
          </TabsContent>

          <TabsContent value="rsmi">
            <RSMISubpage />
          </TabsContent>

          <TabsContent value="stock-card">
            <StockCardSubpage />
          </TabsContent>

          <TabsContent value="rpci">
            <RPCISubpage />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}