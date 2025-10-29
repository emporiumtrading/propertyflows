import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { DollarSign, TrendingUp, Clock, CheckCircle, Send, CreditCard, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import VendorSidebar from '@/components/VendorSidebar';
import Header from '@/components/Header';

const paymentRequestFormSchema = z.object({
  bidId: z.string().optional(),
  workCompletionDocId: z.string().optional(),
  jobType: z.enum(['maintenance', 'turn_task']),
  jobId: z.string().min(1, 'Job ID is required'),
  amount: z.string().min(1, 'Amount is required'),
  description: z.string().optional(),
});

const payoutFormSchema = z.object({
  amount: z.string().min(1, 'Amount is required'),
  description: z.string().optional(),
});

export default function VendorFinance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [paymentRequestDialogOpen, setPaymentRequestDialogOpen] = useState(false);
  const [payoutDialogOpen, setPayoutDialogOpen] = useState(false);
  const [stripeOnboarding, setStripeOnboarding] = useState(false);

  const { data: paymentRequests = [], isLoading: requestsLoading } = useQuery({
    queryKey: ['/api/vendor-payment-requests'],
  });

  const { data: payments = [], isLoading: paymentsLoading } = useQuery({
    queryKey: ['/api/vendor-payments'],
  });

  const { data: transactions = [], isLoading: transactionsLoading } = useQuery({
    queryKey: ['/api/vendor-transactions'],
  });

  const { data: bids = [] } = useQuery({
    queryKey: ['/api/vendor-bids'],
  });

  const { data: balance } = useQuery({
    queryKey: ['/api/vendor/stripe/balance'],
    retry: false,
  });

  const paymentRequestForm = useForm<z.infer<typeof paymentRequestFormSchema>>({
    resolver: zodResolver(paymentRequestFormSchema),
    defaultValues: {
      jobType: 'maintenance',
      jobId: '',
      amount: '',
      description: '',
    },
  });

  const payoutForm = useForm<z.infer<typeof payoutFormSchema>>({
    resolver: zodResolver(payoutFormSchema),
    defaultValues: {
      amount: '',
      description: '',
    },
  });

  const createPaymentRequestMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/vendor-payment-requests', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-payment-requests'] });
      setPaymentRequestDialogOpen(false);
      paymentRequestForm.reset();
      toast({
        title: 'Payment Request Submitted',
        description: 'Your payment request has been submitted for approval.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to submit payment request. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const createPayoutMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/vendor/payouts', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-payments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendor/stripe/balance'] });
      setPayoutDialogOpen(false);
      payoutForm.reset();
      toast({
        title: 'Payout Requested',
        description: 'Your payout has been initiated and should arrive soon.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Payout Failed',
        description: error.message || 'Failed to request payout. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const setupStripeMutation = useMutation({
    mutationFn: async () => {
      const accountResponse = await apiRequest('POST', '/api/vendor/stripe/connect/account');
      const linkResponse = await apiRequest('POST', '/api/vendor/stripe/connect/onboarding-link');
      return linkResponse.json();
    },
    onSuccess: (data: any) => {
      window.location.href = data.url;
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to setup Stripe account. Please try again.',
        variant: 'destructive',
      });
      setStripeOnboarding(false);
    },
  });

  const onPaymentRequestSubmit = (values: z.infer<typeof paymentRequestFormSchema>) => {
    createPaymentRequestMutation.mutate({
      ...values,
      amount: parseFloat(values.amount),
    });
  };

  const onPayoutSubmit = (values: z.infer<typeof payoutFormSchema>) => {
    if (!user?.stripeOnboardingComplete) {
      toast({
        title: 'Stripe Setup Required',
        description: 'Please complete Stripe onboarding to request payouts.',
        variant: 'destructive',
      });
      return;
    }

    createPayoutMutation.mutate({
      amount: parseFloat(values.amount),
      description: values.description,
    });
  };

  const handleStripeSetup = () => {
    setStripeOnboarding(true);
    setupStripeMutation.mutate();
  };

  const totalEarnings = payments
    .filter((p: any) => p.status === 'completed')
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount || '0'), 0);

  const pendingPayments = payments.filter((p: any) => p.status === 'pending' || p.status === 'processing').length;

  const acceptedBids = bids.filter((b: any) => b.status === 'accepted');
  const potentialEarnings = acceptedBids.reduce((sum: number, b: any) => sum + parseFloat(b.bidAmount || '0'), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500';
      case 'approved': return 'bg-blue-500';
      case 'paid': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <VendorSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Finance" 
          subtitle="Manage your earnings, payments, and payouts"
        />
        <main className="flex-1 overflow-y-auto p-6" data-testid="main-vendor-finance">

        {!user?.stripeOnboardingComplete && (
          <Card className="mb-6 border-yellow-500">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-500" />
                  <CardTitle>Setup Stripe Connect</CardTitle>
                </div>
                <Button onClick={handleStripeSetup} disabled={stripeOnboarding} data-testid="button-setup-stripe">
                  <CreditCard className="h-4 w-4 mr-2" />
                  {stripeOnboarding ? 'Setting up...' : 'Setup Stripe'}
                </Button>
              </div>
              <CardDescription>
                Connect your bank account to receive instant payouts when you complete jobs
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-earnings">
                ${totalEarnings.toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Potential Earnings</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-potential-earnings">
                ${potentialEarnings.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                From {acceptedBids.length} accepted {acceptedBids.length === 1 ? 'bid' : 'bids'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Payments</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-pending-payments">
                {pendingPayments}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-available-balance">
                ${balance?.available?.[0]?.amount ? (balance.available[0].amount / 100).toFixed(2) : '0.00'}
              </div>
              {user?.stripeOnboardingComplete && (
                <Dialog open={payoutDialogOpen} onOpenChange={setPayoutDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="mt-2" data-testid="button-request-payout">
                      Request Payout
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Request Payout</DialogTitle>
                      <DialogDescription>Transfer funds to your bank account</DialogDescription>
                    </DialogHeader>
                    <Form {...payoutForm}>
                      <form onSubmit={payoutForm.handleSubmit(onPayoutSubmit)} className="space-y-4">
                        <FormField
                          control={payoutForm.control}
                          name="amount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Amount ($)</FormLabel>
                              <FormControl>
                                <Input type="number" step="0.01" placeholder="100.00" data-testid="input-payout-amount" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={payoutForm.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description (Optional)</FormLabel>
                              <FormControl>
                                <Input placeholder="Payout description..." data-testid="input-payout-description" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => setPayoutDialogOpen(false)} data-testid="button-cancel-payout">
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createPayoutMutation.isPending} data-testid="button-confirm-payout">
                            {createPayoutMutation.isPending ? 'Processing...' : 'Request Payout'}
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              )}
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="requests" className="space-y-4">
          <div className="flex justify-between items-center">
            <TabsList>
              <TabsTrigger value="requests" data-testid="tab-requests">Payment Requests</TabsTrigger>
              <TabsTrigger value="payments" data-testid="tab-payments">Payments</TabsTrigger>
              <TabsTrigger value="transactions" data-testid="tab-transactions">Transactions</TabsTrigger>
            </TabsList>
            
            <Dialog open={paymentRequestDialogOpen} onOpenChange={setPaymentRequestDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-payment-request">
                  <Send className="h-4 w-4 mr-2" />
                  New Payment Request
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Payment Request</DialogTitle>
                  <DialogDescription>Request payment for completed work</DialogDescription>
                </DialogHeader>
                <Form {...paymentRequestForm}>
                  <form onSubmit={paymentRequestForm.handleSubmit(onPaymentRequestSubmit)} className="space-y-4">
                    <FormField
                      control={paymentRequestForm.control}
                      name="jobType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job Type</FormLabel>
                          <FormControl>
                            <select className="w-full border rounded p-2" data-testid="select-job-type" {...field}>
                              <option value="maintenance">Maintenance</option>
                              <option value="turn_task">Turn Task</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={paymentRequestForm.control}
                      name="jobId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Job ID</FormLabel>
                          <FormControl>
                            <Input placeholder="Job ID" data-testid="input-job-id" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={paymentRequestForm.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Amount ($)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="500.00" data-testid="input-request-amount" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={paymentRequestForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe the work completed..." data-testid="textarea-request-description" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2">
                      <Button type="button" variant="outline" onClick={() => setPaymentRequestDialogOpen(false)} data-testid="button-cancel-request">
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createPaymentRequestMutation.isPending} data-testid="button-submit-request">
                        {createPaymentRequestMutation.isPending ? 'Submitting...' : 'Submit Request'}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <TabsContent value="requests" className="space-y-4">
            {requestsLoading ? (
              <div className="text-center py-8">Loading payment requests...</div>
            ) : paymentRequests.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No payment requests yet. Create one to get paid for completed work.
                </CardContent>
              </Card>
            ) : (
              paymentRequests.map((request: any) => (
                <Card key={request.id} data-testid={`card-request-${request.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>${parseFloat(request.amount).toFixed(2)}</CardTitle>
                        <CardDescription className="mt-2">
                          {request.jobType === 'maintenance' ? 'Maintenance' : 'Turn Task'} • Created {new Date(request.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(request.status)}>{request.status}</Badge>
                    </div>
                  </CardHeader>
                  {request.description && (
                    <CardContent>
                      <p className="text-sm text-muted-foreground">{request.description}</p>
                      {request.approvedAt && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Approved on {new Date(request.approvedAt).toLocaleDateString()}
                        </p>
                      )}
                      {request.paidAt && (
                        <p className="text-sm text-green-600 mt-2">
                          Paid on {new Date(request.paidAt).toLocaleDateString()}
                        </p>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            {paymentsLoading ? (
              <div className="text-center py-8">Loading payments...</div>
            ) : payments.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No payments received yet
                </CardContent>
              </Card>
            ) : (
              payments.map((payment: any) => (
                <Card key={payment.id} data-testid={`card-payment-${payment.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>${parseFloat(payment.amount).toFixed(2)}</CardTitle>
                        <CardDescription className="mt-2">
                          {payment.description || 'Payment received'} • {new Date(payment.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(payment.status)}>{payment.status}</Badge>
                    </div>
                  </CardHeader>
                  {payment.completedAt && (
                    <CardContent>
                      <p className="text-sm text-green-600">
                        Completed on {new Date(payment.completedAt).toLocaleDateString()}
                      </p>
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4">
            {transactionsLoading ? (
              <div className="text-center py-8">Loading transactions...</div>
            ) : transactions.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No transactions yet
                </CardContent>
              </Card>
            ) : (
              transactions.map((transaction: any) => (
                <Card key={transaction.id} data-testid={`card-transaction-${transaction.id}`}>
                  <CardContent className="py-4">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {transaction.type} • {new Date(transaction.date).toLocaleDateString()}
                        </p>
                      </div>
                      <div className={`font-bold ${parseFloat(transaction.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {parseFloat(transaction.amount) >= 0 ? '+' : ''}${parseFloat(transaction.amount).toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
        </main>
      </div>
    </div>
  );
}
