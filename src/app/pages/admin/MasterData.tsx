import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { SSNManagement } from '../../components/admin/SSNManagement';
import { RCCManagement } from '../../components/admin/RCCManagement';

export function MasterData() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900"></h2>
        <p className="text-gray-600 mt-1">Manage SSN (Supply Stock Number) and RCC (Responsibility Center Code) data</p>
      </div>

      <Tabs defaultValue="ssn" className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="ssn">SSN (Supply Stock Number)</TabsTrigger>
          <TabsTrigger value="rcc">RCC (Responsibility Center Code)</TabsTrigger>
        </TabsList>

        <TabsContent value="ssn" className="mt-6">
          <SSNManagement />
        </TabsContent>

        <TabsContent value="rcc" className="mt-6">
          <RCCManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
