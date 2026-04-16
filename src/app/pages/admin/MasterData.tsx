import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { SSNManagement } from '../../components/admin/SSNManagement';
import { RCCManagement } from '../../components/admin/RCCManagement';
import { SupplierManagement } from '../../components/admin/SupplierManagement'; // Import the new component

export function MasterData() {
  return (
    <div className="space-y-0 relative h-full flex flex-col">
      {/* Sticky Top Header Section */}
      <div className="sticky top-0 z-40 bg-white border-b pb-4 pt-2 -mx-6 px-6 mb-2">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Master Data Management</h2>
          <p className="text-gray-600 mt-1">Manage SSN, RCC, and Supplier data</p>
        </div>
      </div>

      <Tabs defaultValue="ssn" className="w-full flex-1 flex flex-col">
        {/* Sticky Tabs Navigation Wrapper */}
        <div className="sticky top-[80px] z-30 bg-white py-2 -mx-6 px-6 border-b">
          <TabsList className="grid w-full max-w-3xl grid-cols-3 bg-gray-100 p-1 rounded-lg">
            
            {/* The active tab is made distinctly darker using data-[state=active] */}
            <TabsTrigger 
              value="ssn" 
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              SSN (Supply Stock Number)
            </TabsTrigger>
            
            <TabsTrigger 
              value="rcc"
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              RCC (Responsibility Center Code)
            </TabsTrigger>
            
            <TabsTrigger 
              value="supplier"
              className="data-[state=active]:bg-gray-800 data-[state=active]:text-white data-[state=active]:shadow-sm transition-all"
            >
              Suppliers
            </TabsTrigger>

          </TabsList>
        </div>

        {/* Tab Contents */}
        <TabsContent value="ssn" className="mt-6">
          <SSNManagement />
        </TabsContent>

        <TabsContent value="rcc" className="mt-6">
          <RCCManagement />
        </TabsContent>

        <TabsContent value="supplier" className="mt-6">
          <SupplierManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}