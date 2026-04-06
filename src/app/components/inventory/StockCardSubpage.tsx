import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Eye, FileText, Trash2 } from 'lucide-react';
import { StockCardRecord } from '../../types';
import { toast } from 'sonner';

export function StockCardSubpage() {
  const { stockCards, deleteStockCard } = useData();
  const [selectedCard, setSelectedCard] = useState<StockCardRecord | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const viewStockCard = (card: StockCardRecord) => {
    setSelectedCard(card);
    setIsViewDialogOpen(true);
  };

  const handleDeleteStockCard = async (cardId: string, stockNo: string) => {
    if (confirm(`Are you sure you want to delete stock card "${stockNo}"? This action cannot be undone.`)) {
      try {
        await deleteStockCard(cardId);
        toast.success('Stock card deleted successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete stock card';
        toast.error(errorMessage);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Stock Card</CardTitle>
            <p className="text-sm text-gray-600 mt-1">Track individual item transaction history (Automatically synced from Deliveries & RIS)</p>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Stock No.</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Current Balance</TableHead>
                <TableHead>Transactions</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockCards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>No stock cards available yet. They will generate upon Delivery or RIS.</p>
                  </TableCell>
                </TableRow>
              ) : (
                stockCards.map((card) => {
                  const currentBalance = card.transactions?.length > 0
                    ? card.transactions[card.transactions.length - 1].balance
                    : 0;

                  return (
                    <TableRow key={card.id}>
                      <TableCell className="font-medium">{card.stockNo}</TableCell>
                      <TableCell>{card.description}</TableCell>
                      <TableCell>{card.unit}</TableCell>
                      <TableCell>
                        <span>
                          {currentBalance}
                        </span>
                      </TableCell>
                      <TableCell>{card.transactions?.length || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => viewStockCard(card)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => handleDeleteStockCard(card.id, card.stockNo)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Delete
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock Card Details</DialogTitle>
          </DialogHeader>
          {selectedCard && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg">
                <div>
                  <Label className="text-sm text-gray-600">Stock Number</Label>
                  <p className="font-medium">{selectedCard.stockNo}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Description</Label>
                  <p className="font-medium">{selectedCard.description}</p>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Unit</Label>
                  <p className="font-medium">{selectedCard.unit}</p>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-3">Transaction History</h3>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Received</TableHead>
                      <TableHead>Issued</TableHead>
                      <TableHead>Balance</TableHead>
                      <TableHead>Office</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCard.transactions?.map((transaction, index) => (
                      <TableRow key={index}>
                        <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium">{transaction.reference}</TableCell>
                        <TableCell className="text-green-600">
                          {transaction.received > 0 ? `+${transaction.received}` : '-'}
                        </TableCell>
                        <TableCell className="text-red-600">
                          {transaction.issued > 0 ? `-${transaction.issued}` : '-'}
                        </TableCell>
                        <TableCell className="font-semibold">{transaction.balance}</TableCell>
                        <TableCell>{transaction.office}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}