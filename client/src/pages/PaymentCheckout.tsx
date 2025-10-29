import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import type { Lease } from "@shared/schema";

if (!import.meta.env.VITE_STRIPE_PUBLIC_KEY) {
  throw new Error('Missing required Stripe key: VITE_STRIPE_PUBLIC_KEY');
}
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

function CheckoutForm() {
  const stripe = useStripe();
  const elements = useElements();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: window.location.origin,
      },
    });

    if (error) {
      toast({
        title: "Payment Failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement />
      <Button type="submit" disabled={!stripe} className="w-full" data-testid="button-submit-payment">
        Pay Now
      </Button>
    </form>
  );
}

export default function PaymentCheckout() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [location] = useLocation();
  const [clientSecret, setClientSecret] = useState("");
  const [selectedLeaseId, setSelectedLeaseId] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"ach" | "debit_card" | "credit_card">("ach");
  const [isCreatingIntent, setIsCreatingIntent] = useState(false);

  const { data: leases = [] } = useQuery<Lease[]>({
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

  const activeLease = leases.find((lease) => lease.status === "active");
  const selectedLease = leases.find(lease => lease.id === selectedLeaseId);

  useEffect(() => {
    if (activeLease && !selectedLeaseId) {
      setSelectedLeaseId(activeLease.id);
    }
  }, [activeLease, selectedLeaseId]);

  const createPaymentIntent = async () => {
    if (!selectedLease) {
      toast({
        title: "Error",
        description: "Please select a lease",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingIntent(true);
    try {
      const response = await apiRequest("POST", "/api/payments/create-intent", { 
        amount: parseFloat(selectedLease.monthlyRent), 
        leaseId: selectedLease.id,
        paymentMethod: paymentMethod
      });
      const data = await response.json();
      setClientSecret(data.clientSecret);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingIntent(false);
    }
  };

  if (!clientSecret) {
    return (
      <div className="min-h-screen bg-muted/30 p-6 flex items-center justify-center">
        <div className="max-w-md w-full bg-card p-8 rounded-lg border border-border">
          <div className="mb-6">
            <Link href="/tenant-portal/payments">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Payments
              </Button>
            </Link>
          </div>
          <h2 className="text-2xl font-bold mb-6">Setup Payment</h2>
          
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Select Lease</label>
              <Select value={selectedLeaseId} onValueChange={setSelectedLeaseId}>
                <SelectTrigger data-testid="select-lease">
                  <SelectValue placeholder="Select lease" />
                </SelectTrigger>
                <SelectContent>
                  {leases.map((lease) => (
                    <SelectItem key={lease.id} value={lease.id}>
                      Lease #{lease.id.slice(0, 8)} - ${lease.monthlyRent}/mo
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedLease && (
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">Monthly Rent</p>
                <p className="text-2xl font-bold" data-testid="text-payment-amount">${selectedLease.monthlyRent}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium mb-2 block">Payment Method</label>
              <Select value={paymentMethod} onValueChange={(value: any) => setPaymentMethod(value)}>
                <SelectTrigger data-testid="select-payment-method">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ach">ACH (Free - $0.50 fee)</SelectItem>
                  <SelectItem value="debit_card">Debit Card (2.4% + $0.30)</SelectItem>
                  <SelectItem value="credit_card">Credit Card (2.9% + $0.30)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={createPaymentIntent} 
              className="w-full" 
              disabled={!selectedLease || isCreatingIntent}
              data-testid="button-continue-to-payment"
            >
              {isCreatingIntent ? "Loading..." : "Continue to Payment"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6 flex items-center justify-center">
      <div className="max-w-md w-full bg-card p-8 rounded-lg border border-border">
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setClientSecret("")}
            data-testid="button-back-to-setup"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Setup
          </Button>
        </div>
        <h2 className="text-2xl font-bold mb-2">Complete Payment</h2>
        {selectedLease && (
          <p className="text-sm text-muted-foreground mb-6">
            Paying ${selectedLease.monthlyRent} for Lease #{selectedLease.id.slice(0, 8)}
          </p>
        )}
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <CheckoutForm />
        </Elements>
      </div>
    </div>
  );
}
