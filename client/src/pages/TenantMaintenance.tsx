import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wrench, Plus, X, Image as ImageIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import TenantSidebar from "@/components/TenantSidebar";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import FileUpload from "@/components/FileUpload";
import type { MaintenanceRequest, User, Lease } from "@shared/schema";

const maintenanceFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  priority: z.enum(["low", "medium", "high", "urgent"]),
});

export default function TenantMaintenance() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedPhotos, setSelectedPhotos] = useState<File[]>([]);
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false);

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

  const { data: maintenanceRequests = [], isLoading } = useQuery<MaintenanceRequest[]>({
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

  const form = useForm<z.infer<typeof maintenanceFormSchema>>({
    resolver: zodResolver(maintenanceFormSchema),
    defaultValues: {
      title: "",
      description: "",
      priority: "medium",
    },
  });

  const createRequestMutation = useMutation({
    mutationFn: async (data: z.infer<typeof maintenanceFormSchema>) => {
      if (!activeLease?.unitId) {
        throw new Error("No active lease found");
      }

      let photoUrls: string[] = [];
      
      if (selectedPhotos.length > 0) {
        setIsUploadingPhotos(true);
        const formData = new FormData();
        selectedPhotos.forEach(photo => {
          formData.append('photos', photo);
        });

        const uploadResponse = await fetch('/api/maintenance/upload-photos', {
          method: 'POST',
          body: formData,
          credentials: 'include',
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload photos");
        }

        const uploadData = await uploadResponse.json();
        photoUrls = uploadData.photoUrls;
        setIsUploadingPhotos(false);
      }

      return await apiRequest("POST", "/api/maintenance", {
        ...data,
        unitId: activeLease.unitId,
        status: "open",
        photoUrls: photoUrls.length > 0 ? photoUrls : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/maintenance", user?.id] });
      setIsDialogOpen(false);
      form.reset();
      setSelectedPhotos([]);
      setIsUploadingPhotos(false);
      toast({
        title: "Request Submitted",
        description: "Your maintenance request has been created successfully.",
      });
    },
    onError: (error: any) => {
      setIsUploadingPhotos(false);
      toast({
        title: "Error",
        description: error.message || "Failed to submit request. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePhotoUpload = (files: File[]) => {
    if (selectedPhotos.length + files.length > 5) {
      toast({
        title: "Too many photos",
        description: "You can upload a maximum of 5 photos per request.",
        variant: "destructive",
      });
      return;
    }
    setSelectedPhotos([...selectedPhotos, ...files]);
  };

  const removePhoto = (index: number) => {
    setSelectedPhotos(selectedPhotos.filter((_, i) => i !== index));
  };

  const onSubmit = (values: z.infer<typeof maintenanceFormSchema>) => {
    createRequestMutation.mutate(values);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      open: "bg-orange-500",
      assigned: "bg-indigo-500",
      in_progress: "bg-blue-500",
      completed: "bg-green-500",
      cancelled: "bg-gray-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: "bg-red-600",
      high: "bg-orange-500",
      medium: "bg-yellow-500",
      low: "bg-blue-500",
    };
    return colors[priority as keyof typeof colors] || "bg-gray-500";
  };

  const openRequests = maintenanceRequests.filter(r => r.status === 'open' || r.status === 'assigned' || r.status === 'in_progress');
  const completedRequests = maintenanceRequests.filter(r => r.status === 'completed');
  const urgentRequests = maintenanceRequests.filter(r => r.priority === 'urgent' && r.status !== 'completed');

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <TenantSidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground" data-testid="text-loading">Loading maintenance requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <TenantSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="Maintenance" 
          subtitle="Submit and track maintenance requests"
          user={user}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <Card data-testid="card-open-requests">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Open Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{openRequests.length}</div>
                <p className="text-sm text-muted-foreground mt-1">In progress</p>
              </CardContent>
            </Card>

            <Card data-testid="card-completed-requests">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{completedRequests.length}</div>
                <p className="text-sm text-muted-foreground mt-1">Resolved</p>
              </CardContent>
            </Card>

            <Card data-testid="card-urgent-requests">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Urgent</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-500">{urgentRequests.length}</div>
                <p className="text-sm text-muted-foreground mt-1">High priority</p>
              </CardContent>
            </Card>

            <Card data-testid="card-submit-request">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" data-testid="button-submit-request" disabled={!activeLease}>
                      <Plus className="w-4 h-4 mr-2" />
                      New Request
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Submit Maintenance Request</DialogTitle>
                      <DialogDescription>
                        Describe the maintenance issue and we'll get it resolved quickly.
                      </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                          control={form.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Title</FormLabel>
                              <FormControl>
                                <Input 
                                  placeholder="e.g., Leaking faucet in kitchen" 
                                  {...field} 
                                  data-testid="input-title"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="description"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Description</FormLabel>
                              <FormControl>
                                <Textarea 
                                  placeholder="Provide details about the issue..." 
                                  {...field} 
                                  data-testid="input-description"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="priority"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Priority</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-priority">
                                    <SelectValue placeholder="Select priority" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="low">Low</SelectItem>
                                  <SelectItem value="medium">Medium</SelectItem>
                                  <SelectItem value="high">High</SelectItem>
                                  <SelectItem value="urgent">Urgent</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        
                        <FormItem>
                          <FormLabel>Photos (Optional)</FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              <FileUpload 
                                onUpload={handlePhotoUpload}
                                accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.webp'] }}
                                maxFiles={5}
                              />
                              {selectedPhotos.length > 0 && (
                                <div className="grid grid-cols-2 gap-2">
                                  {selectedPhotos.map((photo, index) => (
                                    <div key={index} className="relative group">
                                      <div className="aspect-square rounded-lg bg-muted flex items-center justify-center overflow-hidden">
                                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                                        <span className="absolute bottom-1 left-1 text-xs bg-background/80 px-2 py-0.5 rounded">
                                          {photo.name.length > 15 ? `${photo.name.substring(0, 15)}...` : photo.name}
                                        </span>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="destructive"
                                        size="icon"
                                        className="absolute -top-2 -right-2 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={() => removePhoto(index)}
                                        data-testid={`button-remove-photo-${index}`}
                                      >
                                        <X className="h-4 w-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <p className="text-xs text-muted-foreground">
                                Upload photos to help us understand the issue better. Maximum 5 photos.
                              </p>
                            </div>
                          </FormControl>
                        </FormItem>

                        <Button 
                          type="submit" 
                          className="w-full" 
                          disabled={createRequestMutation.isPending || isUploadingPhotos}
                          data-testid="button-submit-form"
                        >
                          {isUploadingPhotos ? "Uploading photos..." : createRequestMutation.isPending ? "Submitting..." : "Submit Request"}
                        </Button>
                      </form>
                    </Form>
                  </DialogContent>
                </Dialog>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wrench className="h-5 w-5" />
                All Maintenance Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {maintenanceRequests.length === 0 ? (
                <p className="text-muted-foreground text-sm text-center py-8" data-testid="text-no-requests">No maintenance requests yet</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Title</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Priority</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Completed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {maintenanceRequests.map((request) => (
                        <TableRow key={request.id} data-testid={`maintenance-row-${request.id}`}>
                          <TableCell className="font-medium" data-testid={`text-maintenance-title-${request.id}`}>
                            {request.title}
                          </TableCell>
                          <TableCell className="max-w-xs truncate" data-testid={`text-maintenance-description-${request.id}`}>
                            {request.description}
                          </TableCell>
                          <TableCell>
                            <Badge className={getPriorityBadge(request.priority)} data-testid={`badge-maintenance-priority-${request.id}`}>
                              {request.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusBadge(request.status)} data-testid={`badge-maintenance-status-${request.id}`}>
                              {request.status}
                            </Badge>
                          </TableCell>
                          <TableCell data-testid={`text-maintenance-created-${request.id}`}>
                            {request.createdAt ? new Date(request.createdAt).toLocaleDateString() : 'N/A'}
                          </TableCell>
                          <TableCell data-testid={`text-maintenance-completed-${request.id}`}>
                            {request.completedAt ? new Date(request.completedAt).toLocaleDateString() : 'N/A'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
      </div>
    </div>
  );
}
