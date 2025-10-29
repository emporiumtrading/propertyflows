import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileCheck, Upload } from "lucide-react";
import VendorSidebar from "@/components/VendorSidebar";
import Header from "@/components/Header";

export default function VendorCompletedWork() {
  const { user } = useAuth();
  const { data: completionDocs = [], isLoading } = useQuery({
    queryKey: ['/api/work-completion-docs'],
  });

  const maintenanceJobs = (completionDocs as any[]).filter((doc: any) => doc.jobType === 'maintenance');
  const turnTasks = (completionDocs as any[]).filter((doc: any) => doc.jobType === 'turn');

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <VendorSidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground" data-testid="text-loading">Loading completed work...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <VendorSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Completed Work" 
          subtitle="View all your completed jobs and documentation"
          user={user}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <Card data-testid="card-total-completed">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{(completionDocs as any[]).length}</div>
                <p className="text-sm text-muted-foreground mt-1">Jobs finished</p>
              </CardContent>
            </Card>

            <Card data-testid="card-maintenance-completed">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Maintenance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{maintenanceJobs.length}</div>
                <p className="text-sm text-muted-foreground mt-1">Requests completed</p>
              </CardContent>
            </Card>

            <Card data-testid="card-turn-completed">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Turn Tasks</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{turnTasks.length}</div>
                <p className="text-sm text-muted-foreground mt-1">Tasks completed</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileCheck className="h-5 w-5" />
                Completed Jobs
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(completionDocs as any[]).length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8" data-testid="text-no-completed">No completed work yet</p>
              ) : (
                <div className="space-y-4">
                  {(completionDocs as any[]).map((doc: any) => (
                    <Card key={doc.id} data-testid={`card-completion-${doc.id}`}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{doc.jobType === 'maintenance' ? 'Maintenance' : 'Turn Task'} Completed</CardTitle>
                            <CardDescription>Submitted {new Date(doc.submittedAt).toLocaleDateString()}</CardDescription>
                          </div>
                          <Badge className="bg-green-500" data-testid={`badge-completion-status-${doc.id}`}>Completed</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {doc.notes && (
                          <p className="text-sm mb-2" data-testid={`text-completion-notes-${doc.id}`}>{doc.notes}</p>
                        )}
                        {doc.invoiceUrl && (
                          <a 
                            href={doc.invoiceUrl} 
                            target="_blank" 
                            rel="noopener noreferrer" 
                            className="text-sm text-blue-500 hover:underline flex items-center gap-1"
                            data-testid={`link-invoice-${doc.id}`}
                          >
                            <Upload className="h-4 w-4" />
                            View Invoice
                          </a>
                        )}
                        {doc.photoUrls && doc.photoUrls.length > 0 && (
                          <p className="text-sm text-muted-foreground mt-2" data-testid={`text-photo-count-${doc.id}`}>
                            {doc.photoUrls.length} photo{doc.photoUrls.length > 1 ? 's' : ''} attached
                          </p>
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
