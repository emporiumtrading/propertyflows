import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Paperclip, ExternalLink } from "lucide-react";
import VendorSidebar from "@/components/VendorSidebar";
import Header from "@/components/Header";

export default function VendorBids() {
  const { user } = useAuth();
  const { data: bids = [], isLoading } = useQuery({
    queryKey: ['/api/vendor-bids'],
  });

  const pendingBids = (bids as any[]).filter((b: any) => b.status === 'pending');
  const acceptedBids = (bids as any[]).filter((b: any) => b.status === 'accepted');
  const rejectedBids = (bids as any[]).filter((b: any) => b.status === 'rejected');

  const totalBidAmount = (bids as any[]).reduce((sum: number, b: any) => sum + parseFloat(b.bidAmount || '0'), 0);
  const acceptedTotal = acceptedBids.reduce((sum: number, b: any) => sum + parseFloat(b.bidAmount || '0'), 0);

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <VendorSidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground" data-testid="text-loading">Loading bids...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <VendorSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="My Bids" 
          subtitle="Track your bid submissions and acceptance status"
          user={user}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card data-testid="card-total-bids">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Bids</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{(bids as any[]).length}</div>
                <p className="text-sm text-muted-foreground mt-1">Submitted</p>
              </CardContent>
            </Card>

            <Card data-testid="card-pending-bids">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-500">{pendingBids.length}</div>
                <p className="text-sm text-muted-foreground mt-1">Awaiting response</p>
              </CardContent>
            </Card>

            <Card data-testid="card-accepted-bids">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Accepted</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-500">{acceptedBids.length}</div>
                <p className="text-sm text-muted-foreground mt-1">Won bids</p>
              </CardContent>
            </Card>

            <Card data-testid="card-accepted-value">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Accepted Value</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">${acceptedTotal.toFixed(2)}</div>
                <p className="text-sm text-muted-foreground mt-1">Total earnings</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                All Bids
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(bids as any[]).length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8" data-testid="text-no-bids">No bids submitted yet</p>
              ) : (
                <div className="space-y-4">
                  {(bids as any[]).map((bid: any) => (
                    <Card key={bid.id} data-testid={`card-bid-${bid.id}`}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-xl">${bid.bidAmount}</CardTitle>
                            <CardDescription>
                              {bid.jobType === 'maintenance' ? 'Maintenance Request' : 'Turn Task'} • {bid.estimatedDays ? `${bid.estimatedDays} days` : 'No timeline'}
                            </CardDescription>
                          </div>
                          <Badge 
                            className={
                              bid.status === 'pending' ? 'bg-yellow-500' : 
                              bid.status === 'accepted' ? 'bg-green-500' : 
                              'bg-red-500'
                            }
                            data-testid={`badge-bid-status-${bid.id}`}
                          >
                            {bid.status}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {bid.notes && (
                          <p className="text-sm text-muted-foreground" data-testid={`text-bid-notes-${bid.id}`}>{bid.notes}</p>
                        )}
                        {bid.attachmentUrls && bid.attachmentUrls.length > 0 && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-2 text-sm font-medium">
                              <Paperclip className="h-4 w-4" />
                              Attachments ({bid.attachmentUrls.length})
                            </div>
                            <div className="grid gap-2">
                              {bid.attachmentUrls.map((url: string, index: number) => (
                                <Button
                                  key={index}
                                  variant="outline"
                                  size="sm"
                                  className="justify-start"
                                  asChild
                                  data-testid={`button-attachment-${bid.id}-${index}`}
                                >
                                  <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                    <ExternalLink className="h-4 w-4" />
                                    Attachment {index + 1}
                                  </a>
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
