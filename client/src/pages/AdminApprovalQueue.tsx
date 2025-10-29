import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

type Organization = {
  id: string;
  name: string;
  email: string;
  phone: string;
  businessAddress: string;
  businessLicense: string;
  taxId: string;
  verificationStatus: string;
  createdAt: string;
  latestLog?: {
    riskScore?: number;
    metadata?: any;
    notes?: string;
    createdAt: string;
  };
};

export default function AdminApprovalQueue() {
  const { toast } = useToast();
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const { data: organizations, isLoading } = useQuery<Organization[]>({
    queryKey: ["/api/admin/organizations/pending"],
  });

  const approveMutation = useMutation({
    mutationFn: async (orgId: string) => {
      await apiRequest("POST", `/api/admin/organizations/${orgId}/approve`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations/pending"] });
      toast({
        title: "Organization Approved",
        description: "The business has been approved and can now activate their trial.",
      });
      setSelectedOrg(null);
    },
    onError: (error: any) => {
      toast({
        title: "Approval Failed",
        description: error.message || "Failed to approve organization",
        variant: "destructive",
      });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ orgId, reason }: { orgId: string; reason: string }) => {
      await apiRequest("POST", `/api/admin/organizations/${orgId}/reject`, { reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/organizations/pending"] });
      toast({
        title: "Organization Rejected",
        description: "The business application has been rejected.",
      });
      setRejectDialogOpen(false);
      setSelectedOrg(null);
      setRejectionReason("");
    },
    onError: (error: any) => {
      toast({
        title: "Rejection Failed",
        description: error.message || "Failed to reject organization",
        variant: "destructive",
      });
    },
  });

  const handleApprove = (org: Organization) => {
    setSelectedOrg(org);
    approveMutation.mutate(org.id);
  };

  const handleRejectClick = (org: Organization) => {
    setSelectedOrg(org);
    setRejectDialogOpen(true);
  };

  const handleRejectConfirm = () => {
    if (!selectedOrg || !rejectionReason.trim()) {
      toast({
        title: "Rejection Reason Required",
        description: "Please provide a reason for rejection",
        variant: "destructive",
      });
      return;
    }
    rejectMutation.mutate({ orgId: selectedOrg.id, reason: rejectionReason });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "manual_review":
        return (
          <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700">
            <AlertCircle className="w-3 h-3 mr-1" />
            Manual Review
          </Badge>
        );
      case "pending":
        return (
          <Badge variant="outline" className="bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700">
            <Clock className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getRiskScoreColor = (score?: number) => {
    if (!score) return "text-gray-500 dark:text-gray-400";
    if (score >= 85) return "text-green-600 dark:text-green-400";
    if (score >= 70) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-6">Business Approval Queue</h1>
        <div className="text-center py-12">
          <div className="text-muted-foreground">Loading pending approvals...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Business Approval Queue</h1>
        <p className="text-muted-foreground">
          Review and approve business registration applications
        </p>
      </div>

      {!organizations || organizations.length === 0 ? (
        <Card className="p-12 text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-500" />
          <h3 className="text-lg font-semibold mb-2">All Caught Up!</h3>
          <p className="text-muted-foreground">
            There are no pending applications at this time.
          </p>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>License & Tax ID</TableHead>
                <TableHead>Risk Score</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Submitted</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id} data-testid={`row-org-${org.id}`}>
                  <TableCell className="font-medium">
                    <div>
                      <div className="font-semibold" data-testid={`text-org-name-${org.id}`}>
                        {org.name}
                      </div>
                      <div className="text-sm text-muted-foreground truncate max-w-xs">
                        {org.businessAddress}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div data-testid={`text-org-email-${org.id}`}>{org.email}</div>
                      <div className="text-muted-foreground">{org.phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div>License: {org.businessLicense}</div>
                      <div className="text-muted-foreground">Tax ID: {org.taxId}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className={`font-semibold ${getRiskScoreColor(org.latestLog?.metadata?.riskScore)}`}>
                      {org.latestLog?.metadata?.riskScore || "N/A"}
                    </div>
                    {org.latestLog?.notes && (
                      <div className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                        {org.latestLog.notes}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(org.verificationStatus)}</TableCell>
                  <TableCell className="text-sm">
                    {format(new Date(org.createdAt), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-2 justify-end">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleApprove(org)}
                        disabled={approveMutation.isPending}
                        data-testid={`button-approve-${org.id}`}
                      >
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleRejectClick(org)}
                        disabled={rejectMutation.isPending}
                        data-testid={`button-reject-${org.id}`}
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent data-testid="dialog-reject">
          <DialogHeader>
            <DialogTitle>Reject Business Application</DialogTitle>
            <DialogDescription>
              Please provide a reason for rejecting {selectedOrg?.name}'s application.
              This message will be logged for audit purposes.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={4}
              data-testid="input-rejection-reason"
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRejectDialogOpen(false);
                setRejectionReason("");
              }}
              data-testid="button-cancel-reject"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleRejectConfirm}
              disabled={rejectMutation.isPending || !rejectionReason.trim()}
              data-testid="button-confirm-reject"
            >
              {rejectMutation.isPending ? "Rejecting..." : "Confirm Rejection"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
