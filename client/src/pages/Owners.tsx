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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Search, Mail, User, Building2, DollarSign, Trash2, Plus, FileText, BarChart3 } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { User as OwnerUser, Property, Payment, Lease, Unit } from "@shared/schema";
import { insertPropertySchema, type InsertProperty } from "@shared/schema";

const createOwnerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  companyName: z.string().optional(),
  taxId: z.string().optional(),
});

const editOwnerSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  companyName: z.string().optional(),
  taxId: z.string().optional(),
});

type CreateOwnerForm = z.infer<typeof createOwnerSchema>;
type EditOwnerForm = z.infer<typeof editOwnerSchema>;

export default function Owners() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedOwner, setSelectedOwner] = useState<OwnerUser | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [createPropertyDialogOpen, setCreatePropertyDialogOpen] = useState(false);
  const { toast } = useToast();

  const createForm = useForm<CreateOwnerForm>({
    resolver: zodResolver(createOwnerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      companyName: "",
      taxId: "",
    },
  });

  const editForm = useForm<EditOwnerForm>({
    resolver: zodResolver(editOwnerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      companyName: "",
      taxId: "",
    },
  });

  const propertyForm = useForm<InsertProperty>({
    resolver: zodResolver(insertPropertySchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      propertyType: "residential_multi_family",
      totalUnits: 0,
      managerId: selectedOwner?.id,
    },
  });

  const { data: owners = [], isLoading } = useQuery<OwnerUser[]>({
    queryKey: ["/api/users", "landlord"],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.append("role", "landlord");
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

  const { data: ownerProperties = [], isLoading: propertiesLoading } = useQuery<Property[]>({
    queryKey: ["/api/properties", selectedOwner?.id],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedOwner?.id) params.append("ownerId", selectedOwner.id);
      const queryString = params.toString();
      const url = queryString ? `/api/properties?${queryString}` : "/api/properties";
      
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
      return await res.json();
    },
    enabled: !!selectedOwner,
  });

  const { data: allUnits = [] } = useQuery<Unit[]>({
    queryKey: ["/api/units"],
    enabled: !!selectedOwner && ownerProperties.length > 0,
  });

  const { data: ownerLeases = [], isLoading: leasesLoading } = useQuery<Lease[]>({
    queryKey: ["/api/leases", selectedOwner?.id, "owner"],
    queryFn: async () => {
      if (!selectedOwner || ownerProperties.length === 0) return [];
      
      const res = await fetch("/api/leases", { credentials: "include" });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`${res.status}: ${text || res.statusText}`);
      }
      const allLeases = await res.json();
      const ownerUnitIds = allUnits
        .filter(unit => ownerProperties.some(prop => prop.id === unit.propertyId))
        .map(unit => unit.id);
      
      return allLeases.filter((lease: Lease) => ownerUnitIds.includes(lease.unitId));
    },
    enabled: !!selectedOwner && ownerProperties.length > 0 && allUnits.length > 0,
  });

  const createOwnerMutation = useMutation({
    mutationFn: (data: CreateOwnerForm) =>
      apiRequest("POST", "/api/users", { ...data, role: "landlord" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Success", description: "Property owner created successfully" });
      setCreateDialogOpen(false);
      createForm.reset();
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to create property owner",
        variant: "destructive" 
      });
    },
  });

  const updateOwnerMutation = useMutation({
    mutationFn: (data: { id: string; updates: Partial<OwnerUser> }) =>
      apiRequest("PATCH", `/api/users/${data.id}`, data.updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Success", description: "Property owner updated successfully" });
      setEditDialogOpen(false);
      if (selectedOwner) {
        setSelectedOwner({ ...selectedOwner, ...editForm.getValues() });
      }
    },
    onError: () => {
      toast({ 
        title: "Error", 
        description: "Failed to update property owner",
        variant: "destructive" 
      });
    },
  });

  const deleteOwnerMutation = useMutation({
    mutationFn: (id: string) => apiRequest("DELETE", `/api/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({ title: "Success", description: "Property owner deleted successfully" });
      setDeleteDialogOpen(false);
      setSelectedOwner(null);
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to delete property owner",
        variant: "destructive" 
      });
    },
  });

  const createPropertyMutation = useMutation({
    mutationFn: (data: InsertProperty) => apiRequest("POST", "/api/properties", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      toast({ title: "Success", description: "Property created successfully" });
      setCreatePropertyDialogOpen(false);
      propertyForm.reset();
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to create property",
        variant: "destructive" 
      });
    },
  });

  const handleCreateProperty = (data: InsertProperty) => {
    createPropertyMutation.mutate({ ...data, managerId: selectedOwner?.id });
  };

  const handleCreateOwner = (data: CreateOwnerForm) => {
    createOwnerMutation.mutate(data);
  };

  const handleEditOwner = (data: EditOwnerForm) => {
    if (!selectedOwner) return;
    updateOwnerMutation.mutate({ id: selectedOwner.id, updates: data });
  };

  const handleDeleteOwner = () => {
    if (!selectedOwner) return;
    deleteOwnerMutation.mutate(selectedOwner.id);
  };

  const openEditDialog = (owner: OwnerUser) => {
    setSelectedOwner(owner);
    editForm.reset({
      firstName: owner.firstName || "",
      lastName: owner.lastName || "",
      email: owner.email || "",
      phone: owner.phone || "",
      address: owner.address || "",
      city: owner.city || "",
      state: owner.state || "",
      zipCode: owner.zipCode || "",
      companyName: owner.companyName || "",
      taxId: owner.taxId || "",
    });
    setEditDialogOpen(true);
  };

  const openDeleteDialog = (owner: OwnerUser) => {
    setSelectedOwner(owner);
    setDeleteDialogOpen(true);
  };

  const filteredOwners = owners.filter((owner) =>
    `${owner.firstName} ${owner.lastName} ${owner.email}`
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Property Owners" subtitle="Manage landlords and property owners" user={user} />
          <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
            <p className="text-muted-foreground" data-testid="text-loading">Loading owners...</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <PageTutorial pagePath="/owners" />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Property Owners" subtitle="Manage landlords and property owners" user={user} />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search"
                />
              </div>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-owner">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Owner
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Property Owner</DialogTitle>
                    <DialogDescription>Add a new property owner/landlord to the system</DialogDescription>
                  </DialogHeader>
                  <Form {...createForm}>
                    <form onSubmit={createForm.handleSubmit(handleCreateOwner)} className="space-y-4">
                      <FormField
                        control={createForm.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-create-first-name" />
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
                              <Input {...field} data-testid="input-create-last-name" />
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
                              <Input type="email" {...field} data-testid="input-create-email" />
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
                            <FormLabel>Phone</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="(555) 123-4567" data-testid="input-create-phone" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="123 Main Street" data-testid="input-create-address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={createForm.control}
                          name="city"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>City</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-create-city" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="state"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>State</FormLabel>
                              <FormControl>
                                <Input {...field} placeholder="CA" data-testid="input-create-state" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={createForm.control}
                          name="zipCode"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Zip Code</FormLabel>
                              <FormControl>
                                <Input {...field} data-testid="input-create-zip" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={createForm.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="ABC Property Management" data-testid="input-create-company" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={createForm.control}
                        name="taxId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax ID / EIN (Optional)</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="12-3456789" data-testid="input-create-tax-id" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <DialogFooter>
                        <Button type="submit" data-testid="button-submit-create">
                          Create Owner
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-1">
                <div className="p-4 border-b">
                  <h3 className="font-semibold">Property Owners ({filteredOwners.length})</h3>
                </div>
                <div className="divide-y max-h-[600px] overflow-y-auto">
                  {filteredOwners.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p data-testid="text-no-owners">No property owners found</p>
                    </div>
                  ) : (
                    filteredOwners.map((owner) => (
                      <div
                        key={owner.id}
                        onClick={() => setSelectedOwner(owner)}
                        className={`p-4 cursor-pointer hover:bg-muted/50 transition-colors ${
                          selectedOwner?.id === owner.id ? "bg-primary/10" : ""
                        }`}
                        data-testid={`card-owner-${owner.id}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium" data-testid={`text-name-${owner.id}`}>
                                {owner.firstName} {owner.lastName}
                              </p>
                              {owner.invitationStatus === 'pending' && (
                                <Badge variant="secondary" className="text-xs">
                                  Pending
                                </Badge>
                              )}
                              {owner.invitationStatus === 'accepted' && (
                                <Badge variant="default" className="text-xs">
                                  Active
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                              <Mail className="h-3 w-3" />
                              {owner.email}
                            </p>
                          </div>
                          <User className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card className="lg:col-span-2">
                {selectedOwner ? (
                  <>
                    <div className="p-4 border-b flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold" data-testid="text-selected-name">
                            {selectedOwner.firstName} {selectedOwner.lastName}
                          </h3>
                          {selectedOwner.invitationStatus === 'pending' && (
                            <Badge variant="secondary">
                              Invitation Pending
                            </Badge>
                          )}
                          {selectedOwner.invitationStatus === 'accepted' && (
                            <Badge variant="default">
                              Active
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground" data-testid="text-selected-email">
                          {selectedOwner.email}
                        </p>
                        {selectedOwner.invitationStatus === 'pending' && (
                          <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                            Awaiting owner to accept invitation. You can still manage their properties.
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openEditDialog(selectedOwner)}
                          data-testid="button-edit-profile"
                        >
                          Edit Profile
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => openDeleteDialog(selectedOwner)}
                          data-testid="button-delete-owner"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <Tabs defaultValue="overview" className="flex-1">
                      <TabsList className="w-full justify-start border-b rounded-none px-4">
                        <TabsTrigger value="overview" className="gap-2" data-testid="tab-overview">
                          <BarChart3 className="h-4 w-4" />
                          Overview
                        </TabsTrigger>
                        <TabsTrigger value="properties" className="gap-2" data-testid="tab-properties">
                          <Building2 className="h-4 w-4" />
                          Properties ({ownerProperties.length})
                        </TabsTrigger>
                        <TabsTrigger value="leases" className="gap-2" data-testid="tab-leases">
                          <FileText className="h-4 w-4" />
                          Leases ({ownerLeases.length})
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="overview" className="p-4 space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <Card className="p-4">
                            <div className="text-sm text-muted-foreground">Total Properties</div>
                            <div className="text-2xl font-bold mt-1">{ownerProperties.length}</div>
                          </Card>
                          <Card className="p-4">
                            <div className="text-sm text-muted-foreground">Active Leases</div>
                            <div className="text-2xl font-bold mt-1">
                              {ownerLeases.filter(l => l.status === 'active').length}
                            </div>
                          </Card>
                          <Card className="p-4">
                            <div className="text-sm text-muted-foreground">Total Units</div>
                            <div className="text-2xl font-bold mt-1">
                              {ownerProperties.reduce((sum, p) => sum + p.totalUnits, 0)}
                            </div>
                          </Card>
                          <Card className="p-4">
                            <div className="text-sm text-muted-foreground">Occupancy Rate</div>
                            <div className="text-2xl font-bold mt-1">
                              {ownerProperties.length > 0 
                                ? Math.round((ownerLeases.filter(l => l.status === 'active').length / 
                                    ownerProperties.reduce((sum, p) => sum + p.totalUnits, 0)) * 100)
                                : 0}%
                            </div>
                          </Card>
                        </div>

                        <Card className="p-4">
                          <h4 className="font-semibold mb-2">Owner Information</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Name:</span>
                              <span className="font-medium">{selectedOwner.firstName} {selectedOwner.lastName}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Email:</span>
                              <span className="font-medium">{selectedOwner.email}</span>
                            </div>
                            {selectedOwner.phone && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Phone:</span>
                                <span className="font-medium">{selectedOwner.phone}</span>
                              </div>
                            )}
                            {selectedOwner.address && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Address:</span>
                                <span className="font-medium">
                                  {selectedOwner.address}
                                  {(selectedOwner.city || selectedOwner.state || selectedOwner.zipCode) && (
                                    <>, {selectedOwner.city}{selectedOwner.state && `, ${selectedOwner.state}`} {selectedOwner.zipCode}</>
                                  )}
                                </span>
                              </div>
                            )}
                            {selectedOwner.companyName && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Company:</span>
                                <span className="font-medium">{selectedOwner.companyName}</span>
                              </div>
                            )}
                            {selectedOwner.taxId && (
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Tax ID:</span>
                                <span className="font-medium">{selectedOwner.taxId}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-muted-foreground">Member Since:</span>
                              <span className="font-medium">
                                {selectedOwner.createdAt ? new Date(selectedOwner.createdAt).toLocaleDateString() : 'N/A'}
                              </span>
                            </div>
                          </div>
                        </Card>
                      </TabsContent>

                      <TabsContent value="properties" className="p-4 space-y-4">
                        <div className="flex justify-between items-center mb-4">
                          <h4 className="font-semibold">Properties</h4>
                          <Button
                            onClick={() => setCreatePropertyDialogOpen(true)}
                            size="sm"
                            data-testid="button-add-property-owner"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Add Property
                          </Button>
                        </div>
                        {propertiesLoading ? (
                          <p className="text-muted-foreground">Loading properties...</p>
                        ) : ownerProperties.length === 0 ? (
                          <p className="text-muted-foreground" data-testid="text-no-properties">
                            No properties owned
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {ownerProperties.map((property) => (
                              <Card key={property.id} className="p-4" data-testid={`card-property-${property.id}`}>
                                <div className="flex items-start justify-between">
                                  <div>
                                    <p className="font-medium">{property.name}</p>
                                    <p className="text-sm text-muted-foreground">{property.address}</p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {property.city}, {property.state} {property.zipCode}
                                    </p>
                                  </div>
                                  <Badge variant="outline">
                                    {property.propertyType}
                                  </Badge>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </TabsContent>

                      <TabsContent value="leases" className="p-4 space-y-4">
                        {leasesLoading ? (
                          <p className="text-muted-foreground">Loading leases...</p>
                        ) : ownerLeases.length === 0 ? (
                          <p className="text-muted-foreground" data-testid="text-no-leases">
                            No leases found
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {ownerLeases.map((lease) => (
                              <Card key={lease.id} className="p-4" data-testid={`card-lease-${lease.id}`}>
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium">
                                        {(() => {
                                          const unit = allUnits.find(u => u.id === lease.unitId);
                                          const property = ownerProperties.find(p => p.id === unit?.propertyId);
                                          return property ? `${property.name} - Unit ${unit?.unitNumber}` : 'Unknown Property';
                                        })()}
                                      </p>
                                      <Badge
                                        variant={
                                          lease.status === "active"
                                            ? "default"
                                            : lease.status === "pending_signature"
                                            ? "secondary"
                                            : "outline"
                                        }
                                      >
                                        {lease.status.replace('_', ' ')}
                                      </Badge>
                                    </div>
                                    <p className="text-sm text-muted-foreground mt-1">
                                      ${parseFloat(lease.monthlyRent).toFixed(2)}/month
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-1">
                                      {new Date(lease.startDate).toLocaleDateString()} - {new Date(lease.endDate).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                              </Card>
                            ))}
                          </div>
                        )}
                      </TabsContent>
                    </Tabs>
                  </>
                ) : (
                  <div className="p-8 text-center text-muted-foreground">
                    <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p data-testid="text-select-owner">Select a property owner to view details</p>
                  </div>
                )}
              </Card>
            </div>
          </div>

          {/* Edit Dialog */}
          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Property Owner</DialogTitle>
              </DialogHeader>
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(handleEditOwner)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="firstName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>First Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-first-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="lastName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Last Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-edit-last-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input type="email" {...field} data-testid="input-edit-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="(555) 123-4567" data-testid="input-edit-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="123 Main Street" data-testid="input-edit-address" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={editForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-edit-city" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="CA" data-testid="input-edit-state" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={editForm.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Zip Code</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-edit-zip" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={editForm.control}
                    name="companyName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="ABC Property Management" data-testid="input-edit-company" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={editForm.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax ID / EIN (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="12-3456789" data-testid="input-edit-tax-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button type="submit" data-testid="button-submit-edit">
                      Save Changes
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Property Owner</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete this property owner? This action cannot be undone.
                  All associated data will be removed.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteOwner}
                  className="bg-destructive hover:bg-destructive/90"
                  data-testid="button-confirm-delete"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          {/* Create Property Dialog */}
          <Dialog open={createPropertyDialogOpen} onOpenChange={setCreatePropertyDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add Property for {selectedOwner?.firstName} {selectedOwner?.lastName}</DialogTitle>
                <DialogDescription>
                  Create a new property and assign it to this owner.
                </DialogDescription>
              </DialogHeader>
              <Form {...propertyForm}>
                <form onSubmit={propertyForm.handleSubmit(handleCreateProperty)} className="space-y-4">
                  <FormField
                    control={propertyForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="Sunset Apartments" data-testid="input-property-name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={propertyForm.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main St" data-testid="input-property-address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={propertyForm.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input placeholder="San Francisco" data-testid="input-property-city" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={propertyForm.control}
                      name="state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>State *</FormLabel>
                          <FormControl>
                            <Input placeholder="CA" maxLength={2} data-testid="input-property-state" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={propertyForm.control}
                      name="zipCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ZIP Code *</FormLabel>
                          <FormControl>
                            <Input placeholder="94102" data-testid="input-property-zipCode" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={propertyForm.control}
                    name="propertyType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Property Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-property-type">
                              <SelectValue placeholder="Select property type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="residential_multi_family">Residential Multi-Family</SelectItem>
                            <SelectItem value="residential_single_family">Residential Single-Family</SelectItem>
                            <SelectItem value="commercial">Commercial</SelectItem>
                            <SelectItem value="mixed_use">Mixed Use</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={propertyForm.control}
                    name="totalUnits"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Total Units *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            placeholder="10"
                            data-testid="input-property-totalUnits"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCreatePropertyDialogOpen(false)}
                      data-testid="button-cancel-property"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={createPropertyMutation.isPending}
                      data-testid="button-submit-property"
                    >
                      {createPropertyMutation.isPending ? "Creating..." : "Create Property"}
                    </Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
