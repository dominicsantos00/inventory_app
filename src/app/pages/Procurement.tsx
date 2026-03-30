import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../components/ui/table';
import { Badge } from '../components/ui/badge';
import { Search, ClipboardList, Package } from 'lucide-react';

export function Procurement() {
  const { user } = useAuth();
  const { deliveries, iarRecords, risRecords } = useData();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter data relevant to user's division
  const userDivision = user?.division || '';

  // Filter IAR records for user's division
  const divisionIARs = iarRecords.filter(
    (iar) => iar.requisitioningOffice.toLowerCase().includes(userDivision.toLowerCase())
  );

  // Filter RIS records for user's division
  const divisionRIS = risRecords.filter(
    (ris) => ris.division.toLowerCase().includes(userDivision.toLowerCase())
  );

  // Recent deliveries
  const recentDeliveries = deliveries.slice(-10).reverse();

  const filteredDeliveries = recentDeliveries.filter(
    (delivery) =>
      delivery.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.supplier.toLowerCase().includes(searchQuery.toLowerCase()) ||
      delivery.item.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900"></h2>
        <p className="text-gray-600 mt-1">View procurement records for {userDivision}</p>
      </div>


      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">IAR Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{divisionIARs.length}</div>
            <p className="text-xs text-gray-500 mt-1">Inspection and Acceptance Reports</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">RIS Records</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{divisionRIS.length}</div>
            <p className="text-xs text-gray-500 mt-1">Requisition and Issue Slips</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Deliveries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-900">{deliveries.length}</div>
            <p className="text-xs text-gray-500 mt-1">All procurement deliveries</p>
          </CardContent>
        </Card>
      </div>

      {/* IAR Records for Division */}
      {divisionIARs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>IAR Records - {userDivision}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IAR No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>PO Number</TableHead>
                  <TableHead>Supplier</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {divisionIARs.map((iar) => {
                  const total = iar.items.reduce((sum, item) => sum + item.totalCost, 0);
                  return (
                    <TableRow key={iar.id}>
                      <TableCell className="font-medium">{iar.iarNo}</TableCell>
                      <TableCell>{new Date(iar.date).toLocaleDateString()}</TableCell>
                      <TableCell>{iar.poNumber}</TableCell>
                      <TableCell>{iar.supplier}</TableCell>
                      <TableCell>{iar.items.length}</TableCell>
                      <TableCell>₱{total.toLocaleString()}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* RIS Records for Division */}
      {divisionRIS.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>RIS Records - {userDivision}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>RIS No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Total Requested</TableHead>
                  <TableHead>Total Issued</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {divisionRIS.map((ris) => {
                  const totalRequested = ris.items.reduce((sum, item) => sum + item.quantityRequested, 0);
                  const totalIssued = ris.items.reduce((sum, item) => sum + item.quantityIssued, 0);
                  return (
                    <TableRow key={ris.id}>
                      <TableCell className="font-medium">{ris.risNo}</TableCell>
                      <TableCell>{new Date(ris.date).toLocaleDateString()}</TableCell>
                      <TableCell>{ris.items.length}</TableCell>
                      <TableCell>{totalRequested}</TableCell>
                      <TableCell>{totalIssued}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Recent Deliveries */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Recent Deliveries</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search deliveries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>PO Number</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Item</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Total Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDeliveries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    <Package className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No deliveries found</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredDeliveries.map((delivery) => (
                  <TableRow key={delivery.id}>
                    <TableCell>{new Date(delivery.date).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge className={delivery.type === 'Office Supplies' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}>
                        {delivery.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">{delivery.poNumber}</TableCell>
                    <TableCell>{delivery.supplier}</TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{delivery.item}</p>
                        {delivery.itemDescription && (
                          <p className="text-xs text-gray-500">{delivery.itemDescription}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{delivery.quantity} {delivery.unit}</TableCell>
                    <TableCell className="font-semibold">₱{delivery.totalPrice.toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Info Card if no division-specific data */}
      {divisionIARs.length === 0 && divisionRIS.length === 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <ClipboardList className="h-6 w-6 text-blue-600 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-900">No Division-Specific Records Yet</h3>
                <p className="text-sm text-blue-700 mt-1">
                  There are currently no IAR or RIS records specifically for the {userDivision}. 
                  You can still view general procurement deliveries above.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
