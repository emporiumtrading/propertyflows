import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { CreditCard, FileText, AlertCircle, CheckCircle2, Clock, ArrowUpCircle, ArrowDownCircle, ExternalLink } from "lucide-react";
import { format } from "date-fns";

interface SubscriptionData {
  organization: {
    id: string;
    name: string;
    status: string;
    subscriptionPlan: string | null;
    trialEndsAt: string | null;
    gracePeriodDays: number;
    paymentFailedAt: string | null;
  };
  subscription: {
    id: string;
    status: string;
    currentPeriodEnd: number;
    currentPeriodStart: number;
    cancelAtPeriodEnd: boolean;
    trialEnd: number | null;
  } | null;
}

interface Invoice {
  id: string;
  number: string | null;
  amount: number;
  amountDue: number;
  status: string;
  created: number;
  dueDate: number | null;
  paidAt: number | null;
  invoicePdf: string | null;
  hostedInvoiceUrl: string | null;
}

const PLAN_ORDER = ['starter', 'professional', 'enterprise'];

const PLAN_DETAILS = {
  starter: {
    name: 'Starter',
    price: '$49/month',
    features: [
      'Up to 10 properties',
      'Basic tenant portal',
      'Online rent collection',
      'Maintenance tracking',
    ],
  },
  professional: {
    name: 'Professional',
    price: '$149/month',
    features: [
      'Up to 50 properties',
      'Advanced reporting',
      'Automated rent reminders',
      'QuickBooks integration',
      'AI-powered insights',
    ],
  },
  enterprise: {
    name: 'Enterprise',
    price: '$499/month',
    features: [
      'Unlimited properties',
      'White-label branding',
      'Dedicated account manager',
      'Custom integrations',
      'Priority support',
    ],
  },
};

export function SubscriptionPortal() {
  const { toast } = useToast();
  const [showChangePlanDialog, setShowChangePlanDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string>('');

  const { data: subscriptionData, isLoading } = useQuery<SubscriptionData>({
    queryKey: ["/api/subscription/current"],
  });

  const { data: invoicesData } = useQuery<{ invoices: Invoice[] }>({
    queryKey: ["/api/subscription/invoices"],
  });

  const billingPortalMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', '/api/subscription/billing-portal');
      return await response.json();
    },
    onSuccess: (data: { url: string }) => {
      window.location.href = data.url;
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to open billing portal",
        variant: "destructive" 
      });
    },
  });

  const changePlanMutation = useMutation({
    mutationFn: async (newPlan: string) =>
      apiRequest('POST', '/api/subscription/change-plan', { newPlan }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/subscription/current"] });
      setShowChangePlanDialog(false);
      toast({ title: "Plan changed successfully!" });
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to change plan",
        variant: "destructive" 
      });
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!subscriptionData) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          No subscription data found. Please contact support.
        </AlertDescription>
      </Alert>
    );
  }

  const { organization, subscription } = subscriptionData;
  const currentPlan = organization.subscriptionPlan || 'starter';
  const planDetails = PLAN_DETAILS[currentPlan as keyof typeof PLAN_DETAILS];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
      trialing: { label: "Trial", variant: "secondary" },
      active: { label: "Active", variant: "default" },
      past_due: { label: "Past Due", variant: "destructive" },
      suspended: { label: "Suspended", variant: "destructive" },
      canceled: { label: "Canceled", variant: "outline" },
    };

    const config = statusConfig[status] || { label: status, variant: "outline" as const };
    return <Badge variant={config.variant} data-testid={`badge-status-${status}`}>{config.label}</Badge>;
  };

  const handleChangePlan = (plan: string) => {
    if (plan === currentPlan) {
      toast({ 
        title: "Already on this plan", 
        description: `You're currently on the ${planDetails.name} plan`,
      });
      return;
    }
    setSelectedPlan(plan);
    setShowChangePlanDialog(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Current Subscription</CardTitle>
              <CardDescription>Manage your PropertyFlows subscription</CardDescription>
            </div>
            {getStatusBadge(organization.status)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">Plan</p>
            <p className="text-2xl font-bold" data-testid="text-current-plan">{planDetails.name}</p>
            <p className="text-lg text-muted-foreground">{planDetails.price}</p>
          </div>

          {organization.status === 'trialing' && organization.trialEndsAt && (
            <Alert>
              <Clock className="h-4 w-4" />
              <AlertDescription>
                Your trial ends on {format(new Date(organization.trialEndsAt), "MMMM d, yyyy")}
              </AlertDescription>
            </Alert>
          )}

          {organization.status === 'past_due' && organization.paymentFailedAt && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Payment failed. Grace period: {organization.gracePeriodDays} days from{' '}
                {format(new Date(organization.paymentFailedAt), "MMMM d, yyyy")}
              </AlertDescription>
            </Alert>
          )}

          {subscription && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Current billing period: {format(new Date(subscription.currentPeriodStart * 1000), "MMM d, yyyy")} -{' '}
                {format(new Date(subscription.currentPeriodEnd * 1000), "MMM d, yyyy")}
              </p>
              {subscription.cancelAtPeriodEnd && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Your subscription will be canceled on{' '}
                    {format(new Date(subscription.currentPeriodEnd * 1000), "MMMM d, yyyy")}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              data-testid="button-manage-billing"
              onClick={() => billingPortalMutation.mutate()}
              disabled={billingPortalMutation.isPending}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {billingPortalMutation.isPending ? "Opening..." : "Manage Payment Method"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>Upgrade or downgrade your subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            {Object.entries(PLAN_DETAILS).map(([key, plan]) => {
              const currentPlanIndex = PLAN_ORDER.indexOf(currentPlan);
              const planIndex = PLAN_ORDER.indexOf(key);
              const isUpgrade = planIndex > currentPlanIndex;
              
              return (
                <div
                  key={key}
                  className={`border rounded-lg p-4 ${
                    key === currentPlan ? 'border-primary bg-primary/5' : ''
                  }`}
                  data-testid={`plan-card-${key}`}
                >
                  <h3 className="font-bold text-lg">{plan.name}</h3>
                  <p className="text-2xl font-bold my-2">{plan.price}</p>
                  <ul className="space-y-2 mb-4">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="text-sm flex items-start">
                        <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                  {key === currentPlan ? (
                    <Button variant="outline" disabled className="w-full" data-testid={`button-current-plan-${key}`}>
                      Current Plan
                    </Button>
                  ) : (
                    <Button
                      variant={isUpgrade ? 'default' : 'outline'}
                      className="w-full"
                      data-testid={`button-select-plan-${key}`}
                      onClick={() => handleChangePlan(key)}
                    >
                      {isUpgrade ? (
                        <>
                          <ArrowUpCircle className="h-4 w-4 mr-2" />
                          Upgrade
                        </>
                      ) : (
                        <>
                          <ArrowDownCircle className="h-4 w-4 mr-2" />
                          Downgrade
                        </>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>View and download your invoices</CardDescription>
        </CardHeader>
        <CardContent>
          {invoicesData?.invoices && invoicesData.invoices.length > 0 ? (
            <div className="space-y-2">
              {invoicesData.invoices.map((invoice) => (
                <div
                  key={invoice.id}
                  data-testid={`invoice-${invoice.id}`}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium" data-testid={`invoice-number-${invoice.id}`}>
                        {invoice.number || `Invoice ${invoice.id.slice(0, 8)}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(invoice.created * 1000), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="font-medium" data-testid={`invoice-amount-${invoice.id}`}>
                        ${(invoice.amount / 100).toFixed(2)}
                      </p>
                      <Badge
                        variant={invoice.status === 'paid' ? 'default' : 'destructive'}
                        data-testid={`invoice-status-${invoice.id}`}
                      >
                        {invoice.status}
                      </Badge>
                    </div>
                    {invoice.hostedInvoiceUrl && (
                      <Button
                        variant="ghost"
                        size="sm"
                        asChild
                        data-testid={`button-view-invoice-${invoice.id}`}
                      >
                        <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground" data-testid="text-no-invoices">
              No invoices yet
            </p>
          )}
        </CardContent>
      </Card>

      <Dialog open={showChangePlanDialog} onOpenChange={setShowChangePlanDialog}>
        <DialogContent data-testid="dialog-change-plan">
          <DialogHeader>
            <DialogTitle>Change Subscription Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to change your plan to{' '}
              {PLAN_DETAILS[selectedPlan as keyof typeof PLAN_DETAILS]?.name}?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Your billing will be prorated automatically. You'll be charged or credited for the
                difference immediately.
              </AlertDescription>
            </Alert>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              data-testid="button-cancel-change-plan"
              onClick={() => setShowChangePlanDialog(false)}
            >
              Cancel
            </Button>
            <Button
              data-testid="button-confirm-change-plan"
              onClick={() => changePlanMutation.mutate(selectedPlan)}
              disabled={changePlanMutation.isPending}
            >
              {changePlanMutation.isPending ? "Changing..." : "Confirm Change"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
