import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { SSNManagement } from '../../components/admin/SSNManagement';
import { RCCManagement } from '../../components/admin/RCCManagement';
import { SupplierManagement } from '../../components/admin/SupplierManagement';

export function MasterData() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 flex flex-col h-full">
      {/* Clean Page Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Master Data Management</h2>
        <p className="text-slate-500 text-sm mt-1">Configure and manage core system entities: SSN, RCC, and Suppliers.</p>
      </div>

      <Tabs defaultValue="ssn" className="w-full flex-1 flex flex-col">
        {/* Modern Segmented Navigation */}
        <TabsList className="grid w-full max-w-3xl grid-cols-3 bg-slate-100 p-1 rounded-xl h-12 border border-slate-200 shadow-sm">
          <TabsTrigger 
            value="ssn" 
            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg text-slate-500 transition-all font-medium text-sm"
          >
            Supply Stock Numbers (SSN)
          </TabsTrigger>
          
          <TabsTrigger 
            value="rcc"
            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg text-slate-500 transition-all font-medium text-sm"
          >
            Responsibility Centers (RCC)
          </TabsTrigger>
          
          <TabsTrigger 
            value="supplier"
            className="data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm rounded-lg text-slate-500 transition-all font-medium text-sm"
          >
            Suppliers Directory
          </TabsTrigger>
        </TabsList>

        {/* Tab Contents - Spaced properly below the tabs */}
        <div className="mt-6">
          <TabsContent value="ssn" className="m-0 focus-visible:outline-none">
            <SSNManagement />
          </TabsContent>

          <TabsContent value="rcc" className="m-0 focus-visible:outline-none">
            <RCCManagement />
          </TabsContent>

          <TabsContent value="supplier" className="m-0 focus-visible:outline-none">
            <SupplierManagement />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}