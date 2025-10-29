import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { PageTutorial } from "@/components/PageTutorial";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Mail, Phone, User, FileText, Wrench, DollarSign, Trash2, XCircle, AlertTriangle, Plus, UserPlus } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User as TenantUser, Lease, Payment, MaintenanceRequest, Screening } from "@shared/schema";

const editProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

type EditProfileForm = z.infer<typeof editProfileSchema>;

const createTenantSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
});

type CreateTenantForm = z.infer<typeof createTenantSchema>;

export default function Tenants() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTenant, setSelectedTenant] = useState<TenantUser | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const { toast } = useToast();

  const form = useForm<EditProfileForm>({
    resolver: zodResolver(editProfileSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
    },
  });

  const createForm = useForm<CreateTenantForm>({
    resolver: zodResolver(createTenantSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
    },
  });

  const { data: tenants = [], isLoading } = useQuery<TenantUser[]>({
    queryKey: ["/api/users", "tenant"],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("role", "tenant");
      const url = `/api/users?${params.toString()}`;
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
      return await res.json();
    },
    enabled: true,
  });

  const { data: tenantLeases = [], isLoading: leasesLoading } = useQuery<Lease[]>({
    queryKey: ["/api/leases", selectedTenant?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedTenant?.id) params.append("tenantId", selectedTenant.id);
      const queryString = params.toString();
      const url = queryString ? `/api/leases?${queryString}` : "/api/leases";
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!selectedTenant,
  });

  const { data: tenantPayments = [], isLoading: paymentsLoading } = useQuery<Payment[]>({
    queryKey: ["/api/payments", selectedTenant?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedTenant?.id) params.append("tenantId", selectedTenant.id);
      const queryString = params.toString();
      const url = queryString ? `/api/payments?${queryString}` : "/api/payments";
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!selectedTenant,
  });

  const { data: tenantMaintenance = [], isLoading: maintenanceLoading } = useQuery<MaintenanceRequest[]>({
    queryKey: ["/api/maintenance", selectedTenant?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedTenant?.id) params.append("tenantId", selectedTenant.id);
      const queryString = params.toString();
      const url = queryString ? `/api/maintenance?${queryString}` : "/api/maintenance";
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!selectedTenant,
  });

  const { data: tenantScreenings = [], isLoading: screeningsLoading } = useQuery<Screening[]>({
    queryKey: ["/api/screenings", selectedTenant?.id],
    queryFn: async () => {
      const res = await fetch("/api/screenings", { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
      const allScreenings = await res.json() as Screening[];
      return allScreenings.filter(s => s.applicantId === selectedTenant?.id);
    },
    enabled: !!selectedTenant,
  });

  const createTenantMutation = useMutation({
    mutationFn: async (data: CreateTenantForm) => {
      const tenantResponse = await apiRequest("POST", "/api/users", { ...data, role: "tenant" });
      const newTenant = await tenantResponse.json() as TenantUser;
      
      await apiRequest("POST", "/api/screenings", {
        applicantId: newTenant.id,
        status: "pending",
      });
      
      return newTenant;
    },
    onSuccess: (newTenant: TenantUser) => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users?role=tenant"] });
      queryClient.invalidateQueries({ queryKey: ["/api/screenings"] });
      toast({
        title: "Tenant created",
        description: `${newTenant.firstName} ${newTenant.lastName} has been created with pending screening approval.`,
      });
      setCreateDialogOpen(false);
      createForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create tenant",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<TenantUser> }) =>
      apiRequest("PATCH", `/api/users/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Success", description: "Tenant profile updated successfully" });
      setEditDialogOpen(false);
      if (selectedTenant) {
        setSelectedTenant({ ...selectedTenant, ...form.getValues() });
      }
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to update tenant profile",
        variant: "destructive" 
      });
    },
  });

  const deleteTenantMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Success", description: "Tenant deleted successfully" });
      setDeleteDialogOpen(false);
      setSelectedTenant(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to delete tenant",
        variant: "destructive" 
      });
    },
  });

  const terminateLeaseMutation = useMutation({
    mutationFn: (leaseId: string) =>
      apiRequest("PATCH", `/api/leases/${leaseId}`, { status: "terminated" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/leases"] });
      toast({ title: "Success", description: "Lease terminated successfully" });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to terminate lease",
        variant: "destructive" 
      });
    },
  });

  const filteredTenants = tenants.filter((tenant) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      (tenant.firstName?.toLowerCase().includes(searchLower) || false) ||
      (tenant.lastName?.toLowerCase().includes(searchLower) || false) ||
      (tenant.email?.toLowerCase().includes(searchLower) || false)
    );
  });

  const handleEditProfile = (data: EditProfileForm) => {
    if (selectedTenant) {
      updateUserMutation.mutate({
        id: selectedTenant.id,
        updates: data,
      });
    }
  };

  const openEditDialog = () => {
    if (selectedTenant) {
      form.reset({
        firstName: selectedTenant.firstName || "",
        lastName: selectedTenant.lastName || "",
        email: selectedTenant.email || "",
      });
      setEditDialogOpen(true);
    }
  };

  const handleDeleteTenant = () => {
    if (selectedTenant) {
      deleteTenantMutation.mutate(selectedTenant.id);
    }
  };

  const handleTerminateLease = (leaseId: string) => {
    terminateLeaseMutation.mutate(leaseId);
  };

  const handleCreateTenant = (data: CreateTenantForm) => {
    createTenantMutation.mutate(data);
  };

  const calculateDelinquency = () => {
    if (!tenantPayments || tenantPayments.length === 0) return null;
    
    const overduePayments = tenantPayments.filter(payment => {
      if (payment.status === 'completed') return false;
      if (!payment.dueDate) return false;
      
      const dueDate = new Date(payment.dueDate);
      const today = new Date();
      return dueDate < today;
    });

    if (overduePayments.length === 0) return null;

    const oldestOverdue = overduePayments.reduce((oldest, payment) => {
      const paymentDate = new Date(payment.dueDate!);
      const oldestDate = new Date(oldest.dueDate!);
      return paymentDate < oldestDate ? payment : oldest;
    });

    const daysOverdue = Math.floor(
      (new Date().getTime() - new Date(oldestOverdue.dueDate!).getTime()) / (1000 * 60 * 60 * 24)
    );

    return {
      count: overduePayments.length,
      daysOverdue,
      totalAmount: overduePayments.reduce((sum, p) => sum + parseFloat(p.amount), 0)
    };
  };

  const delinquency = calculateDelinquency();

  const getStatusBadge = (status: string) => {
    const colors = {
      active: "bg-green-500",
      pending: "bg-yellow-500",
      pending_signature: "bg-yellow-500",
      expired: "bg-red-500",
      terminated: "bg-red-500",
      completed: "bg-blue-500",
      open: "bg-orange-500",
      assigned: "bg-indigo-500",
      in_progress: "bg-purple-500",
      cancelled: "bg-gray-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <PageTutorial pagePath="/tenants" />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Tenants" subtitle="Manage tenant information" user={user} />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Search Bar */}
            <Card className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="input-search-tenants"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Tenants List */}
              <Card className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Tenants ({filteredTenants.length})</h3>
                  <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                      <Button size="sm" data-testid="button-create-tenant">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Create Tenant
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Tenant</DialogTitle>
                        <DialogDescription>
                          Create a new tenant applicant. A screening request with pending approval will be automatically created.
                        </DialogDescription>
                      </DialogHeader>
                      <Form {...createForm}>
                        <form onSubmit={createForm.handleSubmit(handleCreateTenant)} className="space-y-4">
                          <FormField
                            control={createForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-firstname" placeholder="John" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-lastname" placeholder="Doe" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input {...field} type="email" data-testid="input-email" placeholder="john.doe@example.com" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={createForm.control}
                            name="phone"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Phone (Optional)</FormLabel>
                                <FormControl>
                                  <Input {...field} data-testid="input-phone" placeholder="+1 (555) 123-4567" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <DialogFooter>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => setCreateDialogOpen(false)}
                              data-testid="button-cancel"
                            >
                              Cancel
                            </Button>
                            <Button
                              type="submit"
                              disabled={createTenantMutation.isPending}
                              data-testid="button-submit"
                            >
                              {createTenantMutation.isPending ? "Creating..." : "Create Tenant"}
                            </Button>
                          </DialogFooter>
                        </form>
                      </Form>
                    </DialogContent>
                  </Dialog>
                </div>
                <div className="space-y-2 max-h-[600px] overflow-y-auto">
                  {isLoading ? (
                    <p className="text-muted-foreground text-sm">Loading tenants...</p>
                  ) : filteredTenants.length === 0 ? (
                    <p className="text-muted-foreground text-sm">No tenants found</p>
                  ) : (
                    filteredTenants.map((tenant) => (
                      <div
                        key={tenant.id}
                        data-testid={`tenant-item-${tenant.id}`}
                        onClick={() => setSelectedTenant(tenant)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          selectedTenant?.id === tenant.id
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted hover:bg-muted/80"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium" data-testid={`text-tenant-name-${tenant.id}`}>
                              {tenant.firstName} {tenant.lastName}
                            </p>
                            <p className="text-sm opacity-80" data-testid={`text-tenant-email-${tenant.id}`}>
                              {tenant.email}
                            </p>
                          </div>
                          <User className="h-5 w-5 opacity-50" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              {/* Tenant Details */}
              <Card className="p-4">
                {selectedTenant ? (
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold">Tenant Details</h3>
                        {delinquency && (
                          <Badge className="bg-red-500" data-testid="badge-delinquent">
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            Delinquent ({delinquency.daysOverdue}d)
                          </Badge>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                          <DialogTrigger asChild>
                            <Button onClick={openEditDialog} size="sm" variant="outline" data-testid="button-edit-tenant">
                              Edit Profile
                            </Button>
                          </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Edit Tenant Profile</DialogTitle>
                          </DialogHeader>
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleEditProfile)} className="space-y-4">
                              <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>First Name</FormLabel>
                                    <FormControl>
                                      <Input data-testid="input-edit-firstname" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                      <Input data-testid="input-edit-lastname" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                      <Input data-testid="input-edit-email" type="email" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <DialogFooter>
                                <Button
                                  data-testid="button-save-tenant"
                                  type="submit"
                                  disabled={updateUserMutation.isPending}
                                >
                                  {updateUserMutation.isPending ? "Saving..." : "Save Changes"}
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                        <Button 
                          onClick={() => setDeleteDialogOpen(true)} 
                          size="sm" 
                          variant="destructive"
                          data-testid="button-delete-tenant"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium" data-testid="text-detail-name">
                            {selectedTenant.firstName} {selectedTenant.lastName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Mail className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm" data-testid="text-detail-email">{selectedTenant.email}</span>
                        </div>
                        {tenantScreenings.length > 0 && (
                          <div className="flex items-center gap-2 mt-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">Screening Status:</span>
                            <Badge 
                              className={`${getStatusBadge(tenantScreenings[0].status)} text-white`}
                              data-testid="badge-screening-status"
                            >
                              {tenantScreenings[0].status.replace('_', ' ')}
                            </Badge>
                          </div>
                        )}
                      </div>

                      <Tabs defaultValue="leases" className="mt-6">
                        <TabsList className="grid w-full grid-cols-3">
                          <TabsTrigger value="leases" data-testid="tab-leases">
                            <FileText className="h-4 w-4 mr-2" />
                            Leases
                          </TabsTrigger>
                          <TabsTrigger value="payments" data-testid="tab-payments">
                            <DollarSign className="h-4 w-4 mr-2" />
                            Payments
                          </TabsTrigger>
                          <TabsTrigger value="maintenance" data-testid="tab-maintenance">
                            <Wrench className="h-4 w-4 mr-2" />
                            Maintenance
                          </TabsTrigger>
                        </TabsList>

                        <TabsContent value="leases" className="mt-4">
                          <div className="space-y-2">
                            {leasesLoading ? (
                              <p className="text-sm text-muted-foreground">Loading leases...</p>
                            ) : tenantLeases.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No active leases</p>
                            ) : (
                              tenantLeases.map((lease) => (
                                <div key={lease.id} className="p-3 bg-muted rounded-lg" data-testid={`card-lease-${lease.id}`}>
                                  <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                      <p className="font-medium">Unit: {lease.unitId}</p>
                                      <p className="text-sm text-muted-foreground">
                                        ${lease.monthlyRent}/mo
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge className={getStatusBadge(lease.status)} data-testid={`badge-lease-status-${lease.id}`}>
                                        {lease.status}
                                      </Badge>
                                      {lease.status === 'active' && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => handleTerminateLease(lease.id)}
                                          disabled={terminateLeaseMutation.isPending}
                                          data-testid={`button-terminate-lease-${lease.id}`}
                                        >
                                          <XCircle className="h-4 w-4" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="payments" className="mt-4">
                          <div className="space-y-2">
                            {paymentsLoading ? (
                              <p className="text-sm text-muted-foreground">Loading payments...</p>
                            ) : tenantPayments.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No payment history</p>
                            ) : (
                              tenantPayments.slice(0, 5).map((payment) => (
                                <div key={payment.id} className="p-3 bg-muted rounded-lg" data-testid={`row-payment-${payment.id}`}>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium">${payment.amount}</p>
                                      <p className="text-sm text-muted-foreground">
                                        {new Date(payment.dueDate).toLocaleDateString()}
                                      </p>
                                    </div>
                                    <Badge className={getStatusBadge(payment.status)} data-testid={`badge-payment-status-${payment.id}`}>
                                      {payment.status}
                                    </Badge>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </TabsContent>

                        <TabsContent value="maintenance" className="mt-4">
                          <div className="space-y-2">
                            {maintenanceLoading ? (
                              <p className="text-sm text-muted-foreground">Loading maintenance...</p>
                            ) : tenantMaintenance.length === 0 ? (
                              <p className="text-sm text-muted-foreground">No maintenance requests</p>
                            ) : (
                              tenantMaintenance.slice(0, 5).map((request) => (
                                <div key={request.id} className="p-3 bg-muted rounded-lg" data-testid={`card-maintenance-${request.id}`}>
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="font-medium">{request.title}</p>
                                      <p className="text-sm text-muted-foreground">
                                        Priority: {request.priority}
                                      </p>
                                    </div>
                                    <Badge className={getStatusBadge(request.status)} data-testid={`badge-maintenance-status-${request.id}`}>
                                      {request.status}
                                    </Badge>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <User className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                    <p className="text-muted-foreground">Select a tenant to view details</p>
                  </div>
                )}
              </Card>
            </div>
          </div>
        </main>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this tenant? This action cannot be undone.
              {selectedTenant && tenantLeases.some(l => l.status === 'active') && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This tenant has active leases. Please terminate all leases before deleting.
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTenant}
              disabled={deleteTenantMutation.isPending}
              data-testid="button-confirm-delete"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTenantMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
