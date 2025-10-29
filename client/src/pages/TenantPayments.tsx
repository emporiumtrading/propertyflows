import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, CreditCard, Eye, Download, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import TenantSidebar from "@/components/TenantSidebar";
import Header from "@/components/Header";
import type { Payment, User, Lease, Unit, Property } from "@shared/schema";

export default function TenantPayments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const { data: payments = [], isLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments", user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.id) params.append("tenantId", user.id);
      const queryString = params.toString();
      const url = queryString ? `/api/payments?${queryString}` : "/api/payments";
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!user?.id,
  });

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-500",
      processing: "bg-blue-400",
      completed: "bg-green-500",
      failed: "bg-red-500",
      refunded: "bg-gray-400",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const pendingPayments = payments.filter(p => p.status === 'pending');
  const completedPayments = payments.filter(p => p.status === 'completed');
  
  const totalPaid = completedPayments.reduce((sum, p) => {
    const amount = parseFloat(p.amount);
    const fee = p.processingFee ? parseFloat(p.processingFee) : 0;
    return sum + amount + fee;
  }, 0);

  const totalPending = pendingPayments.reduce((sum, p) => {
    const amount = parseFloat(p.amount);
    const fee = p.processingFee ? parseFloat(p.processingFee) : 0;
    return sum + amount + fee;
  }, 0);

  const updateAutopayMutation = useMutation({
    mutationFn: (data: { id: string; isAutopay: boolean }) =>
      apiRequest("PATCH", `/api/payments/${data.id}`, { isAutopay: data.isAutopay }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payments", user?.id] });
      toast({ title: "Success", description: "Autopay setting updated" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update autopay",
        variant: "destructive" 
      });
    },
  });

  const handleAutopayToggle = (paymentId: string, currentValue: boolean) => {
    updateAutopayMutation.mutate({
      id: paymentId,
      isAutopay: !currentValue,
    });
  };

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setDetailsDialogOpen(true);
  };

  const handleDownloadReceipt = (payment: Payment) => {
    const processingFee = payment.processingFee ? parseFloat(payment.processingFee) : 0;
    const amount = parseFloat(payment.amount);
    const total = amount + processingFee;
    
    const receiptContent = `
PAYMENT RECEIPT
================

Payment ID: ${payment.id}
Date: ${payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'N/A'}

PAYMENT DETAILS
---------------
Rent Amount: $${amount.toFixed(2)}
Processing Fee: $${processingFee.toFixed(2)}
Total Paid: $${total.toFixed(2)}

Payment Method: ${payment.paymentMethod}
Status: ${payment.status}
Due Date: ${new Date(payment.dueDate).toLocaleDateString()}

Thank you for your payment!
    `.trim();
    
    const blob = new Blob([receiptContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `receipt-${payment.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: "Success", description: "Receipt downloaded" });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground" data-testid="text-loading">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <TenantSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Payments" 
          subtitle="View and manage your rent payments"
          user={user}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card data-testid="card-total-paid">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${totalPaid.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground mt-1">{completedPayments.length} payments</p>
              </CardContent>
            </Card>

            <Card data-testid="card-pending-balance">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-500">${totalPending.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground mt-1">{pendingPayments.length} pending</p>
              </CardContent>
            </Card>

            <Card data-testid="card-payment-action">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Link href="/payments/checkout">
                  <Button className="w-full" data-testid="button-make-payment">
                    <CreditCard className="w-4 h-4 mr-2" />
                    Make Payment
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {payments.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8" data-testid="text-no-payments">No payment history yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Processing Fee</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Autopay</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Due Date</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payments.map((payment) => {
                        const amount = parseFloat(payment.amount);
                        const fee = payment.processingFee ? parseFloat(payment.processingFee) : 0;
                        const total = amount + fee;

                        return (
                          <TableRow key={payment.id} data-testid={`payment-row-${payment.id}`}>
                            <TableCell data-testid={`text-payment-date-${payment.id}`}>
                              {payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : 'N/A'}
                            </TableCell>
                            <TableCell data-testid={`text-payment-amount-${payment.id}`}>
                              ${amount.toFixed(2)}
                            </TableCell>
                            <TableCell data-testid={`text-payment-fee-${payment.id}`}>
                              ${fee.toFixed(2)}
                            </TableCell>
                            <TableCell className="font-semibold" data-testid={`text-payment-total-${payment.id}`}>
                              ${total.toFixed(2)}
                            </TableCell>
                            <TableCell data-testid={`text-payment-method-${payment.id}`}>
                              {payment.paymentMethod || 'N/A'}
                            </TableCell>
                            <TableCell>
                              <Switch
                                data-testid={`switch-autopay-${payment.id}`}
                                checked={payment.isAutopay}
                                onCheckedChange={() => handleAutopayToggle(payment.id, payment.isAutopay)}
                                disabled={updateAutopayMutation.isPending || payment.status === 'completed'}
                              />
                            </TableCell>
                            <TableCell>
                              <Badge className={getStatusBadge(payment.status)} data-testid={`badge-payment-status-${payment.id}`}>
                                {payment.status}
                              </Badge>
                            </TableCell>
                            <TableCell data-testid={`text-payment-due-${payment.id}`}>
                              {new Date(payment.dueDate).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleViewDetails(payment)}
                                  data-testid={`button-view-details-${payment.id}`}
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDownloadReceipt(payment)}
                                  data-testid={`button-download-receipt-${payment.id}`}
                                >
                                  <Download className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Payment Details Dialog */}
          <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Payment Details</DialogTitle>
                <DialogDescription>Complete payment information and receipt</DialogDescription>
              </DialogHeader>
              {selectedPayment && (
                <div className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-semibold mb-2">Payment Information</h4>
                      <div className="space-y-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Payment ID:</span>
                          <p className="font-mono text-xs">{selectedPayment.id}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Status:</span>
                          <Badge className={getStatusBadge(selectedPayment.status)} data-testid="dialog-payment-status">
                            {selectedPayment.status}
                          </Badge>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Payment Method:</span>
                          <p data-testid="dialog-payment-method">{selectedPayment.paymentMethod}</p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Due Date:</span>
                          <p data-testid="dialog-due-date">{new Date(selectedPayment.dueDate).toLocaleDateString()}</p>
                        </div>
                        {selectedPayment.paidAt && (
                          <div>
                            <span className="text-muted-foreground">Paid Date:</span>
                            <p data-testid="dialog-paid-date">{new Date(selectedPayment.paidAt).toLocaleDateString()}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold mb-2">Payment Breakdown</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Rent Amount:</span>
                          <span className="font-semibold" data-testid="dialog-amount">${parseFloat(selectedPayment.amount).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Processing Fee:</span>
                          <span data-testid="dialog-fee">
                            ${selectedPayment.processingFee ? parseFloat(selectedPayment.processingFee).toFixed(2) : '0.00'}
                          </span>
                        </div>
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total Paid:</span>
                          <span data-testid="dialog-total">
                            ${(parseFloat(selectedPayment.amount) + (selectedPayment.processingFee ? parseFloat(selectedPayment.processingFee) : 0)).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {selectedPayment.stripePaymentIntentId && (
                    <div>
                      <span className="text-muted-foreground text-sm">Transaction ID:</span>
                      <p className="font-mono text-xs" data-testid="dialog-transaction-id">{selectedPayment.stripePaymentIntentId}</p>
                    </div>
                  )}
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => selectedPayment && handleDownloadReceipt(selectedPayment)}
                  data-testid="button-dialog-download-receipt"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Download Receipt
                </Button>
                <Button onClick={() => setDetailsDialogOpen(false)} data-testid="button-dialog-close">
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
