import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, CheckCircle, AlertCircle, Clock, ArrowRight, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';

interface StripeBalance {
  available: Array<{ amount: number; currency: string }>;
  pending: Array<{ amount: number; currency: string }>;
}

interface Payout {
  id: string;
  amount: string;
  currency: string;
  status: string;
  description?: string;
  arrivalDate?: string;
  createdAt: string;
  failureReason?: string;
}

export default function PayoutDashboard() {
  const { toast } = useToast();
  const [payoutAmount, setPayoutAmount] = useState('');
  const [description, setDescription] = useState('');

  const { data: accountStatus, isLoading: statusLoading } = useQuery<any>({
    queryKey: ['/api/stripe/account/status'],
  });

  const { data: balance, isLoading: balanceLoading, refetch: refetchBalance } = useQuery<StripeBalance>({
    queryKey: ['/api/stripe/balance'],
    enabled: accountStatus?.connected && accountStatus?.onboardingComplete,
  });

  const { data: payouts = [], isLoading: payoutsLoading } = useQuery<Payout[]>({
    queryKey: ['/api/payouts'],
  });

  const connectAccountMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('/api/stripe/connect/account', 'POST', {});
    },
    onSuccess: async (data) => {
      const linkRes = await apiRequest('/api/stripe/connect/onboarding-link', 'POST', {});
      window.location.href = linkRes.url;
    },
    onError: () => {
      toast({
        title: 'Connection Failed',
        description: 'Failed to connect Stripe account. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const createPayoutMutation = useMutation({
    mutationFn: async (data: { amount: number; description: string }) => {
      return await apiRequest('/api/payouts', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: 'Payout Requested',
        description: 'Your payout has been initiated successfully.',
      });
      setPayoutAmount('');
      setDescription('');
      queryClient.invalidateQueries({ queryKey: ['/api/payouts'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stripe/balance'] });
    },
    onError: (error: any) => {
      toast({
        title: 'Payout Failed',
        description: error.message || 'Failed to create payout. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleConnectStripe = () => {
    connectAccountMutation.mutate();
  };

  const handleCreatePayout = () => {
    const amount = parseFloat(payoutAmount);
    if (!amount || amount <= 0) {
      toast({
        title: 'Invalid Amount',
        description: 'Please enter a valid payout amount.',
        variant: 'destructive',
      });
      return;
    }

    createPayoutMutation.mutate({ amount, description });
  };

  const availableBalance = balance?.available?.[0]?.amount || 0;
  const pendingBalance = balance?.pending?.[0]?.amount || 0;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { icon: any; color: string; label: string }> = {
      pending: { icon: Clock, color: 'bg-yellow-500', label: 'Pending' },
      processing: { icon: RefreshCw, color: 'bg-blue-500', label: 'Processing' },
      completed: { icon: CheckCircle, color: 'bg-green-500', label: 'Completed' },
      failed: { icon: AlertCircle, color: 'bg-red-500', label: 'Failed' },
      canceled: { icon: AlertCircle, color: 'bg-gray-500', label: 'Canceled' },
    };
    const config = variants[status] || variants.pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  if (statusLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <p className="text-muted-foreground">Loading payout dashboard...</p>
      </div>
    );
  }

  if (!accountStatus?.connected || !accountStatus?.onboardingComplete) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6" data-testid="text-payout-title">Instant Payouts</h1>
          
          <Card>
            <CardHeader>
              <CardTitle>Connect Your Bank Account</CardTitle>
              <CardDescription>
                Set up instant payouts to receive your rental income directly to your bank account.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <DollarSign className="h-4 w-4" />
                <AlertDescription>
                  <strong>Instant Payouts:</strong> Get your money in minutes instead of days. 
                  Connect your bank account through Stripe to enable instant transfers.
                </AlertDescription>
              </Alert>

              <Button
                onClick={handleConnectStripe}
                disabled={connectAccountMutation.isPending}
                data-testid="button-connect-stripe"
              >
                {connectAccountMutation.isPending ? 'Connecting...' : 'Connect with Stripe'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto space-y-6 p-6">
        <div>
          <h1 className="text-3xl font-bold mb-2" data-testid="text-payout-title">Instant Payouts</h1>
          <p className="text-muted-foreground">Manage your payouts and view your balance</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Available Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              {balanceLoading ? (
                <p className="text-muted-foreground">Loading balance...</p>
              ) : (
                <div className="space-y-2">
                  <p className="text-4xl font-bold" data-testid="text-available-balance">
                    ${(availableBalance / 100).toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Pending: ${(pendingBalance / 100).toFixed(2)}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => refetchBalance()}
                    data-testid="button-refresh-balance"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request Payout</CardTitle>
              <CardDescription>Transfer funds to your bank account</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  data-testid="input-payout-amount"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <Input
                  id="description"
                  placeholder="Rental income"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  data-testid="input-payout-description"
                />
              </div>

              <Button
                onClick={handleCreatePayout}
                disabled={createPayoutMutation.isPending || !payoutAmount}
                className="w-full"
                data-testid="button-create-payout"
              >
                {createPayoutMutation.isPending ? 'Processing...' : 'Request Instant Payout'}
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
            <CardDescription>View all your past payouts</CardDescription>
          </CardHeader>
          <CardContent>
            {payoutsLoading ? (
              <p className="text-muted-foreground">Loading payouts...</p>
            ) : payouts.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No payouts yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Arrival</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payouts.map((payout) => (
                    <TableRow key={payout.id} data-testid={`row-payout-${payout.id}`}>
                      <TableCell>
                        {new Date(payout.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        ${parseFloat(payout.amount).toFixed(2)}
                      </TableCell>
                      <TableCell>{payout.description || '-'}</TableCell>
                      <TableCell>{getStatusBadge(payout.status)}</TableCell>
                      <TableCell>
                        {payout.arrivalDate
                          ? new Date(payout.arrivalDate).toLocaleDateString()
                          : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
