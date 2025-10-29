import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, FileText, AlertCircle } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { Lease, Unit, Property } from "@shared/schema";

export default function SignLease() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const [agreed, setAgreed] = useState(false);
  const { toast } = useToast();

  const { data: lease, isLoading, error } = useQuery<Lease>({
    queryKey: ["/api/leases", id],
    queryFn: async () => {
      const res = await fetch(`/api/leases/${id}`, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      return await res.json();
    },
    enabled: !!id,
  });

  const { data: unit } = useQuery<Unit>({
    queryKey: ["/api/units", lease?.unitId],
    enabled: !!lease?.unitId,
  });

  const { data: property } = useQuery<Property>({
    queryKey: ["/api/properties", unit?.propertyId],
    enabled: !!unit?.propertyId,
  });

  const signLeaseMutation = useMutation({
    mutationFn: () => apiRequest("POST", `/api/leases/${id}/sign`, {}),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Lease signed successfully!",
      });
      setTimeout(() => {
        setLocation("/tenant");
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to sign lease",
        variant: "destructive",
      });
    },
  });

  const handleSign = () => {
    if (!agreed) {
      toast({
        title: "Agreement Required",
        description: "Please confirm that you agree to the lease terms",
        variant: "destructive",
      });
      return;
    }
    signLeaseMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading lease agreement...</p>
        </div>
      </div>
    );
  }

  if (error || !lease) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Error Loading Lease
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {error?.message || "Lease not found or you don't have permission to view it."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (lease.status !== "pending_signature") {
    return (
      <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Lease Already Signed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This lease has already been signed and is now {lease.status}.
            </p>
            <Button onClick={() => setLocation("/tenant")} data-testid="button-go-to-portal">
              Go to Tenant Portal
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background py-12">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">PropertyFlows</h1>
          <p className="text-muted-foreground">Electronic Lease Signature</p>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Lease Agreement
            </CardTitle>
            <CardDescription>
              Please review the lease details below and sign electronically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Property Address</label>
                <p className="text-base mt-1" data-testid="text-property-address">
                  {property ? `${property.address}, ${property.city}, ${property.state} ${property.zipCode}` : "Loading..."}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Unit Number</label>
                <p className="text-base mt-1" data-testid="text-unit-number">
                  {unit?.unitNumber || "Loading..."}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Lease Period</label>
                <p className="text-base mt-1" data-testid="text-lease-period">
                  {new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Lease Duration</label>
                <p className="text-base mt-1">
                  {Math.round((new Date(lease.endDate).getTime() - new Date(lease.startDate).getTime()) / (1000 * 60 * 60 * 24 * 30))} months
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Monthly Rent</label>
                <p className="text-2xl font-bold mt-1 text-primary" data-testid="text-monthly-rent">
                  ${lease.monthlyRent}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-muted-foreground">Security Deposit</label>
                <p className="text-2xl font-bold mt-1" data-testid="text-security-deposit">
                  ${lease.securityDeposit}
                </p>
              </div>
            </div>

            {lease.documentUrl && (
              <div className="border-t pt-6">
                <label className="text-sm font-medium text-muted-foreground">Lease Document</label>
                <div className="mt-2">
                  <a
                    href={lease.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-2"
                    data-testid="link-view-document"
                  >
                    <FileText className="h-4 w-4" />
                    View Full Lease Agreement
                  </a>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Alert className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            By signing this lease electronically, you agree to all terms and conditions outlined in the lease agreement.
            Your signature will be legally binding and recorded with a timestamp, IP address, and device information for security purposes.
          </AlertDescription>
        </Alert>

        <Card>
          <CardContent className="pt-6">
            <div className="space-y-6">
              <div className="flex items-start space-x-3">
                <Checkbox
                  id="terms"
                  checked={agreed}
                  onCheckedChange={(checked) => setAgreed(checked as boolean)}
                  data-testid="checkbox-agree-terms"
                />
                <label
                  htmlFor="terms"
                  className="text-sm leading-relaxed cursor-pointer"
                >
                  I have read and agree to the terms and conditions of this lease agreement.
                  I understand that this electronic signature is legally binding and equivalent to a handwritten signature.
                </label>
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={handleSign}
                  disabled={!agreed || signLeaseMutation.isPending}
                  className="flex-1"
                  size="lg"
                  data-testid="button-sign-lease"
                >
                  {signLeaseMutation.isPending ? "Signing..." : "Sign Lease Agreement"}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/tenant")}
                  size="lg"
                  data-testid="button-cancel"
                >
                  Cancel
                </Button>
              </div>

              {signLeaseMutation.isSuccess && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    Lease signed successfully! Redirecting to your tenant portal...
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-8 text-sm text-muted-foreground">
          <p>Questions? Contact your property manager for assistance.</p>
          <p className="mt-2">© {new Date().getFullYear()} PropertyFlows. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
