import { useState } from 'react';
import { useData } from '../../context/DataContext';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Eye, FileText } from 'lucide-react';
import { StockCardRecord } from '../../types';

export function StockCardSubpage() {
  const { stockCards } = useData();
  const [selectedCard, setSelectedCard] = useState<StockCardRecord | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const viewStockCard = (card: StockCardRecord) => {
    setSelectedCard(card);
    setIsViewDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-slate-200 overflow-hidden">
        <CardHeader className="bg-white border-b border-slate-100">
          <div>
            <CardTitle className="text-lg font-bold text-slate-900">Stock Cards</CardTitle>
            <p className="text-sm text-slate-500 mt-1">Track individual item transaction history. Automatically synced from Incoming Deliveries and RIS requests.</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="max-h-[60vh] overflow-y-auto">
            <Table>
              <TableHeader className="bg-slate-50 border-b border-slate-200 sticky top-0 z-10 shadow-sm outline outline-1 outline-slate-200">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Stock No.</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Description</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Current Balance</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reorder Point</TableHead>
                  <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</TableHead>
                </TableRow>
              </TableHeader>
            <TableBody>
              {stockCards.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-slate-500">
                    <FileText className="h-10 w-10 mx-auto mb-3 text-slate-300" />
                    <p>No stock cards available yet.</p>
                  </TableCell>
                </TableRow>
              ) : (
                stockCards.map((card) => {
                  const currentBalance = card.transactions?.length > 0 ? card.transactions[card.transactions.length - 1].balance : 0;
                  return (
                    <TableRow key={card.id} className="group hover:bg-slate-50 transition-colors">
                      <TableCell className="font-medium text-slate-900">{card.stockNo}</TableCell>
                      <TableCell className="text-slate-700">{card.description}</TableCell>
                      <TableCell className="text-center text-slate-600">{card.unit}</TableCell>
                      <TableCell className="text-center font-bold text-amber-700 text-base">{currentBalance}</TableCell>
                      <TableCell className="text-center font-medium text-slate-600">{card.transactions?.length || 0}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button size="icon" variant="ghost" onClick={() => viewStockCard(card)} className="h-8 w-8 text-slate-500 hover:text-amber-600 hover:bg-amber-50">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl border-slate-200 shadow-xl overflow-hidden p-0">
          <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <DialogTitle className="text-xl text-slate-900">Stock Card Details</DialogTitle>
          </div>
          {selectedCard && (
            <div className="p-6 bg-white space-y-6">
              <div className="grid grid-cols-3 gap-4 p-4 bg-amber-50 border border-amber-100 rounded-lg">
                <div>
                  <Label className="text-xs font-bold uppercase tracking-wider text-amber-700/80">Stock Number</Label>
                  <p className="font-bold text-amber-900 text-lg mt-1">{selectedCard.stockNo}</p>
                </div>
                <div className="col-span-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-amber-700/80">Description</Label>
                  <p className="font-bold text-amber-900 text-lg mt-1">{selectedCard.description} <span className="text-sm font-medium ml-1">({selectedCard.unit})</span></p>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50 border-b border-slate-200">
                    <TableRow>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">Date</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">Reference</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 text-center">Received (+)</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 text-center">Issued (-)</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3 text-center">Balance</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 uppercase tracking-wider py-3">Office</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100">
                    {selectedCard.transactions?.map((transaction, index) => (
                      <TableRow key={index} className="hover:bg-slate-50 transition-colors">
                        <TableCell className="text-slate-600 text-sm py-3">{new Date(transaction.date).toLocaleDateString()}</TableCell>
                        <TableCell className="font-medium text-slate-900 text-sm py-3">{transaction.reference}</TableCell>
                        <TableCell className="text-emerald-600 font-medium text-center text-sm py-3">
                          {transaction.received > 0 ? `+${transaction.received}` : '-'}
                        </TableCell>
                        <TableCell className="text-rose-600 font-medium text-center text-sm py-3">
                          {transaction.issued > 0 ? `-${transaction.issued}` : '-'}
                        </TableCell>
                        <TableCell className="font-bold text-slate-900 text-center text-base py-3">{transaction.balance}</TableCell>
                        <TableCell className="text-slate-700 text-sm py-3">{transaction.office}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-end pt-2">
                <Button type="button" onClick={() => setIsViewDialogOpen(false)} className="bg-slate-900 hover:bg-slate-800 text-white shadow-sm">Close Card</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}