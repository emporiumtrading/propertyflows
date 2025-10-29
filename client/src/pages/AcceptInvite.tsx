import { useEffect, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function AcceptInvite() {
  const [, params] = useRoute("/accept-invite/:token");
  const [, setLocation] = useLocation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const token = params?.token;

  useEffect(() => {
    if (!authLoading && !isAuthenticated && token) {
      localStorage.setItem('pending_invite_token', token);
      window.location.href = '/api/login';
    }
  }, [isAuthenticated, authLoading, token]);

  const { data: invitation, isLoading: verifyLoading, error: verifyError } = useQuery<{
    email: string;
    role: string;
    valid: boolean;
  }>({
    queryKey: ['/api/invitations/verify', token],
    enabled: !!token && isAuthenticated,
  });

  const acceptMutation = useMutation<{ role: string }>({
    mutationFn: async (): Promise<{ role: string }> => {
      const response = await apiRequest('POST', `/api/invitations/accept/${token}`);
      return response as { role: string };
    },
    onSuccess: (data) => {
      localStorage.removeItem('pending_invite_token');
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      if (data.role === 'tenant') {
        setLocation('/tenant-portal');
      } else if (data.role === 'landlord') {
        setLocation('/owner-portal');
      } else if (data.role === 'vendor') {
        setLocation('/maintenance');
      } else {
        setLocation('/dashboard');
      }
    },
  });

  if (authLoading || verifyLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying invitation...</p>
        </div>
      </div>
    );
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="w-5 h-5" />
              Invalid Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              This invitation link is invalid or incomplete.
            </p>
            <Button onClick={() => setLocation('/')} data-testid="button-home">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verifyError || !invitation?.valid) {
    const errorMessage = verifyError 
      ? (verifyError as any).message || "Failed to verify invitation"
      : "This invitation is invalid or has expired";

    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="w-5 h-5" />
              Invitation Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{errorMessage}</p>
            <Button onClick={() => setLocation('/')} data-testid="button-home-error">
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-primary" />
            You've Been Invited!
          </CardTitle>
          <CardDescription>
            Accept this invitation to join PropertyFlows
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Email:</span>
              <span className="text-sm text-muted-foreground" data-testid="text-invite-email">
                {invitation.email}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Role:</span>
              <span className="text-sm text-muted-foreground capitalize" data-testid="text-invite-role">
                {invitation.role}
              </span>
            </div>
          </div>

          {acceptMutation.isError && (
            <Alert variant="destructive">
              <AlertDescription data-testid="text-accept-error">
                {(acceptMutation.error as any)?.message || "Failed to accept invitation. Please try again."}
              </AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={() => acceptMutation.mutate()}
              disabled={acceptMutation.isPending}
              className="flex-1"
              data-testid="button-accept-invite"
            >
              {acceptMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Accept Invitation
            </Button>
            <Button
              variant="outline"
              onClick={() => setLocation('/')}
              disabled={acceptMutation.isPending}
              data-testid="button-decline"
            >
              Decline
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
