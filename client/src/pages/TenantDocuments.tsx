import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Eye } from "lucide-react";
import TenantSidebar from "@/components/TenantSidebar";
import Header from "@/components/Header";
import type { Lease, User } from "@shared/schema";

export default function TenantDocuments() {
  const { user } = useAuth();

  const { data: leases = [], isLoading } = useQuery<Lease[]>({
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
  const allLeases = leases;

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground" data-testid="text-loading">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <TenantSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Documents" 
          subtitle="Access your lease agreements and important documents"
          user={user}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card data-testid="card-total-documents">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Documents</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{allLeases.filter(l => l.documentUrl).length}</div>
                <p className="text-sm text-muted-foreground mt-1">Available documents</p>
              </CardContent>
            </Card>

            <Card data-testid="card-active-lease-doc">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Lease</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{activeLease && activeLease.documentUrl ? '1' : '0'}</div>
                <p className="text-sm text-muted-foreground mt-1">Current agreement</p>
              </CardContent>
            </Card>

            <Card data-testid="card-lease-history">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Lease History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{allLeases.length}</div>
                <p className="text-sm text-muted-foreground mt-1">All leases</p>
              </CardContent>
            </Card>
          </div>

          {activeLease && activeLease.documentUrl && (
            <Card className="mb-6" data-testid="card-current-lease">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Current Lease Agreement
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-lg">
                      <FileText className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium" data-testid="text-lease-title">Lease Agreement</p>
                      <p className="text-sm text-muted-foreground">
                        Valid from {new Date(activeLease.startDate).toLocaleDateString()} to {new Date(activeLease.endDate).toLocaleDateString()}
                      </p>
                      <Badge className="mt-2" data-testid="badge-lease-status">{activeLease.status}</Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <a 
                      href={activeLease.documentUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="sm" data-testid="button-view-lease">
                        <Eye className="h-4 w-4 mr-2" />
                        View
                      </Button>
                    </a>
                    <a 
                      href={activeLease.documentUrl} 
                      download
                    >
                      <Button variant="outline" size="sm" data-testid="button-download-lease">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card data-testid="card-all-documents">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                All Documents
              </CardTitle>
            </CardHeader>
            <CardContent>
              {allLeases.filter(l => l.documentUrl).length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8" data-testid="text-no-documents">No documents available</p>
              ) : (
                <div className="space-y-3">
                  {allLeases.filter(l => l.documentUrl).map((lease) => (
                    <div 
                      key={lease.id} 
                      className="flex items-center justify-between p-4 bg-muted rounded-lg"
                      data-testid={`document-item-${lease.id}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-lg">
                          <FileText className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium" data-testid={`text-document-title-${lease.id}`}>
                            Lease Agreement - {lease.unitId}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}
                          </p>
                          <Badge className="mt-2" data-testid={`badge-document-status-${lease.id}`}>
                            {lease.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <a 
                          href={lease.documentUrl!} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <Button variant="outline" size="sm" data-testid={`button-view-document-${lease.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Button>
                        </a>
                        <a 
                          href={lease.documentUrl!} 
                          download
                        >
                          <Button variant="outline" size="sm" data-testid={`button-download-document-${lease.id}`}>
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </a>
                      </div>
                    </div>
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
