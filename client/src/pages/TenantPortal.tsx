import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Wrench, FileText, Home, DollarSign, AlertCircle } from "lucide-react";
import { Link } from "wouter";
import TenantSidebar from "@/components/TenantSidebar";
import Header from "@/components/Header";
import { InteractiveTutorial, useTutorial, type TutorialStep } from "@/components/InteractiveTutorial";
import { useToast } from "@/hooks/use-toast";
import type { Lease, Payment, MaintenanceRequest, User } from "@shared/schema";

export default function TenantPortal() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { showTutorial } = useTutorial("tenant-portal");

  const tenantTutorialSteps: TutorialStep[] = [
    {
      target: "card-balance",
      title: "Your Current Balance",
      description: "This shows how much rent you owe. Keep this at $0 by paying on time!",
      position: "bottom",
      action: "Check this regularly to stay on top of payments",
    },
    {
      target: "card-active-lease-status",
      title: "Lease Status",
      description: "See your active lease details and expiration date here.",
      position: "bottom",
      action: "Know when your lease is ending",
    },
    {
      target: "card-monthly-rent",
      title: "Monthly Rent Amount",
      description: "Your monthly rent is shown here. This is what you need to pay each month.",
      position: "bottom",
      action: "Set up auto-pay to never miss a payment",
    },
    {
      target: "button-pay-now",
      title: "Pay Your Rent",
      description: "Click here to pay rent online via ACH (free), debit card, or credit card.",
      position: "left",
      action: "Try clicking to see payment options",
    },
    {
      target: "button-view-maintenance",
      title: "Submit Maintenance Requests",
      description: "Report any issues with your unit here. Upload photos for faster resolution!",
      position: "left",
      action: "Get help with repairs quickly",
    },
  ];

  const userLoading = false;
  const userError = false;

  const { data: leases = [], isLoading: leasesLoading, isError: leasesError } = useQuery<Lease[]>({
    queryKey: ["/api/leases", user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.id) params.append("tenantId", user.id);
      const queryString = params.toString();
      const url = queryString ? `/api/leases?${queryString}` : "/api/leases";
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!user?.id,
  });

  const { data: payments = [], isLoading: paymentsLoading, isError: paymentsError } = useQuery<Payment[]>({
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

  const { data: maintenanceRequests = [], isLoading: maintenanceLoading, isError: maintenanceError } = useQuery<MaintenanceRequest[]>({
    queryKey: ["/api/maintenance", user?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (user?.id) params.append("tenantId", user.id);
      const queryString = params.toString();
      const url = queryString ? `/api/maintenance?${queryString}` : "/api/maintenance";
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!user?.id,
  });

  const activeLease = leases.find((lease) => lease.status === "active");
  const pendingPayments = payments.filter((p) => p.status === "pending");
  const totalBalance = pendingPayments.reduce((sum, p) => {
    const amount = parseFloat(p.amount);
    const fee = p.processingFee ? parseFloat(p.processingFee) : 0;
    return sum + amount + fee;
  }, 0);

  const openMaintenanceRequests = maintenanceRequests.filter(
    (r) => r.status === "open" || r.status === "assigned" || r.status === "in_progress"
  );

  const getStatusBadge = (status: string) => {
    const colors = {
      active: "bg-green-500",
      pending: "bg-yellow-500",
      pending_signature: "bg-yellow-500",
      completed: "bg-blue-500",
      open: "bg-orange-500",
      assigned: "bg-indigo-500",
      in_progress: "bg-purple-500",
      cancelled: "bg-gray-500",
      processing: "bg-blue-400",
      failed: "bg-red-500",
      refunded: "bg-gray-400",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  if (userLoading || leasesLoading || paymentsLoading || maintenanceLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground" data-testid="text-loading">Loading your portal...</p>
        </div>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-destructive" data-testid="text-error">Failed to load user information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {showTutorial && (
        <InteractiveTutorial
          steps={tenantTutorialSteps}
          tutorialKey="tenant-portal"
          onComplete={() => toast({
            title: "Tutorial Complete!",
            description: "You're all set! Enjoy your tenant portal.",
          })}
          onSkip={() => toast({
            title: "Tutorial Skipped",
            description: "You can restart it anytime from settings.",
          })}
        />
      )}
      <TenantSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Tenant Dashboard" 
          subtitle={`Welcome, ${user?.firstName} ${user?.lastName}`}
          user={user}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card data-testid="card-balance">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Current Balance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${totalBalance.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground mt-1">{pendingPayments.length} pending payments</p>
              </CardContent>
            </Card>

            <Card data-testid="card-active-lease-status">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Lease Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activeLease ? 'Active' : 'None'}</div>
                <p className="text-sm text-muted-foreground mt-1">
                  {activeLease ? `Expires ${new Date(activeLease.endDate).toLocaleDateString()}` : 'No active lease'}
                </p>
              </CardContent>
            </Card>

            <Card data-testid="card-maintenance-count">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Open Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{openMaintenanceRequests.length}</div>
                <p className="text-sm text-muted-foreground mt-1">Maintenance requests</p>
              </CardContent>
            </Card>

            <Card data-testid="card-monthly-rent">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Monthly Rent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${activeLease?.monthlyRent || '0'}</div>
                <p className="text-sm text-muted-foreground mt-1">Current lease</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card className="cursor-pointer hover:shadow-lg transition-shadow" data-testid="card-pay-rent">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
                  <CreditCard className="h-6 w-6 text-green-600 dark:text-green-300" />
                </div>
                <div>
                  <CardTitle className="text-lg">Pay Rent</CardTitle>
                  <CardDescription>Current balance: ${totalBalance.toFixed(2)}</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/payments">
                <Button className="w-full" data-testid="button-pay-now">
                  Pay Now
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" data-testid="card-maintenance">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 dark:bg-orange-900 rounded-full">
                  <Wrench className="h-6 w-6 text-orange-600 dark:text-orange-300" />
                </div>
                <div>
                  <CardTitle className="text-lg">Maintenance</CardTitle>
                  <CardDescription>{openMaintenanceRequests.length} open requests</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/tenant-portal/maintenance">
                <Button className="w-full" variant="outline" data-testid="button-view-maintenance">
                  View Requests
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" data-testid="card-documents">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
                  <FileText className="h-6 w-6 text-blue-600 dark:text-blue-300" />
                </div>
                <div>
                  <CardTitle className="text-lg">Documents</CardTitle>
                  <CardDescription>Lease & agreements</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Link href="/tenant-portal/documents">
                <Button className="w-full" variant="outline" data-testid="button-view-documents">
                  View Documents
                </Button>
              </Link>
            </CardContent>
          </Card>
          </div>

          {activeLease ? (
          <Card data-testid="card-active-lease" className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="h-5 w-5" />
                Active Lease
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Unit</p>
                  <p className="font-semibold" data-testid="text-lease-unit">{activeLease.unitId}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Monthly Rent</p>
                  <p className="font-semibold" data-testid="text-lease-rent">${activeLease.monthlyRent}/mo</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Lease Period</p>
                  <p className="font-semibold" data-testid="text-lease-period">
                    {new Date(activeLease.startDate).toLocaleDateString()} - {new Date(activeLease.endDate).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Security Deposit</p>
                  <p className="font-semibold" data-testid="text-lease-deposit">${activeLease.securityDeposit}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge className={getStatusBadge(activeLease.status)} data-testid="badge-lease-status">
                    {activeLease.status}
                  </Badge>
                </div>
                {activeLease.documentUrl && (
                  <div>
                    <p className="text-sm text-muted-foreground">Lease Document</p>
                    <a href={activeLease.documentUrl} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline" data-testid="link-lease-document">
                      View Document
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ) : leasesError ? (
          <Card className="mb-6">
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-destructive mb-3" />
              <p className="text-destructive" data-testid="text-leases-error">Failed to load lease information</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="mb-6">
            <CardContent className="py-8 text-center">
              <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground" data-testid="text-no-active-lease">No active lease found</p>
            </CardContent>
          </Card>
        )}

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Recent Payments
                </CardTitle>
                <CardDescription>Your payment history</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentsError ? (
                  <p className="text-destructive text-sm" data-testid="text-payments-error">Failed to load payments</p>
                ) : payments.length === 0 ? (
                  <p className="text-muted-foreground text-sm" data-testid="text-no-payment-history">No payment history</p>
                ) : (
                  <div className="space-y-3">
                    {payments.slice(0, 5).map((payment) => {
                      const amount = parseFloat(payment.amount);
                      const fee = payment.processingFee ? parseFloat(payment.processingFee) : 0;
                      const total = amount + fee;

                      return (
                        <div key={payment.id} className="flex items-center justify-between p-3 bg-muted rounded-lg" data-testid={`payment-item-${payment.id}`}>
                          <div>
                            <p className="font-medium">${total.toFixed(2)}</p>
                            <p className="text-sm text-muted-foreground">
                              Due: {new Date(payment.dueDate).toLocaleDateString()}
                            </p>
                            {fee > 0 && (
                              <p className="text-xs text-muted-foreground">
                                Includes ${fee.toFixed(2)} processing fee
                              </p>
                            )}
                          </div>
                          <Badge className={getStatusBadge(payment.status)} data-testid={`badge-payment-status-${payment.id}`}>
                            {payment.status}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wrench className="h-5 w-5" />
                  Maintenance Requests
                </CardTitle>
                <CardDescription>Track your requests</CardDescription>
              </CardHeader>
              <CardContent>
                {maintenanceError ? (
                  <p className="text-destructive text-sm" data-testid="text-maintenance-error">Failed to load maintenance requests</p>
                ) : maintenanceRequests.length === 0 ? (
                  <p className="text-muted-foreground text-sm" data-testid="text-no-maintenance-requests">No maintenance requests</p>
                ) : (
                  <div className="space-y-3">
                    {maintenanceRequests.slice(0, 5).map((request) => (
                      <div key={request.id} className="flex items-center justify-between p-3 bg-muted rounded-lg" data-testid={`maintenance-item-${request.id}`}>
                        <div>
                          <p className="font-medium">{request.title}</p>
                          <p className="text-sm text-muted-foreground">{request.priority} priority</p>
                          {request.description && (
                            <p className="text-xs text-muted-foreground mt-1">{request.description.substring(0, 80)}...</p>
                          )}
                        </div>
                        <Badge className={getStatusBadge(request.status)} data-testid={`badge-maintenance-status-${request.id}`}>
                          {request.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
