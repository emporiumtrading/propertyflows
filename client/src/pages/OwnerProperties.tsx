import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Building2, Users, DollarSign, AlertCircle, Plus, Pencil, Trash2 } from "lucide-react";
import { Link } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import OwnerSidebar from "@/components/OwnerSidebar";
import Header from "@/components/Header";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Property, Unit } from "@shared/schema";

const propertyFormSchema = z.object({
  name: z.string().min(1, "Property name is required"),
  address: z.string().min(1, "Address is required"),
});

export default function OwnerProperties() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  const { data: properties = [], isLoading, isError } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
  });

  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ["/api/units"],
  });

  const form = useForm<z.infer<typeof propertyFormSchema>>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      name: "",
      address: "",
    },
  });

  const createPropertyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof propertyFormSchema>) => {
      return await apiRequest("POST", "/api/properties", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Property Created",
        description: "Your property has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create property. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePropertyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof propertyFormSchema>) => {
      if (!selectedProperty) throw new Error("No property selected");
      return await apiRequest("PATCH", `/api/properties/${selectedProperty.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setEditDialogOpen(false);
      setSelectedProperty(null);
      form.reset();
      toast({
        title: "Property Updated",
        description: "Your property has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update property. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deletePropertyMutation = useMutation({
    mutationFn: async (propertyId: string) => {
      return await apiRequest("DELETE", `/api/properties/${propertyId}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/properties"] });
      setDeleteDialogOpen(false);
      setSelectedProperty(null);
      toast({
        title: "Property Deleted",
        description: "Your property has been removed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete property. Please try again.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (values: z.infer<typeof propertyFormSchema>) => {
    createPropertyMutation.mutate(values);
  };

  const onEdit = (values: z.infer<typeof propertyFormSchema>) => {
    updatePropertyMutation.mutate(values);
  };

  const handleEditClick = (property: Property) => {
    setSelectedProperty(property);
    form.reset({
      name: property.name,
      address: property.address,
    });
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (property: Property) => {
    setSelectedProperty(property);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (selectedProperty) {
      deletePropertyMutation.mutate(selectedProperty.id);
    }
  };

  const getUnitsForProperty = (propertyId: string) => {
    return units.filter(u => u.propertyId === propertyId);
  };

  const getOccupiedUnits = (propertyId: string) => {
    return units.filter(u => u.propertyId === propertyId && u.status === 'occupied').length;
  };

  const getTotalUnits = (propertyId: string) => {
    return units.filter(u => u.propertyId === propertyId).length;
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <OwnerSidebar />
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <OwnerSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="My Properties" subtitle="View and manage your properties" user={user} />
        
        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex justify-end">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-add-property">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Property
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Property</DialogTitle>
                    <DialogDescription>
                      Add a new property to your portfolio
                    </DialogDescription>
                  </DialogHeader>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Property Name</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., Sunset Apartments" {...field} data-testid="input-property-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="address"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Address</FormLabel>
                            <FormControl>
                              <Input placeholder="e.g., 123 Main St, City, State" {...field} data-testid="input-property-address" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button 
                        type="submit" 
                        className="w-full" 
                        disabled={createPropertyMutation.isPending}
                        data-testid="button-submit-property"
                      >
                        {createPropertyMutation.isPending ? "Creating..." : "Create Property"}
                      </Button>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
            {isError ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-4">
                    <AlertCircle className="h-8 w-8 mx-auto text-destructive mb-2" />
                    <p className="text-sm text-destructive" data-testid="text-error">Failed to load properties</p>
                  </div>
                </CardContent>
              </Card>
            ) : properties.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2" data-testid="heading-no-properties">No Properties Yet</h3>
                    <p className="text-muted-foreground" data-testid="text-no-properties">
                      You haven't added any properties yet. Contact your property manager to get started.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map((property) => {
                  const totalUnits = getTotalUnits(property.id);
                  const occupiedUnits = getOccupiedUnits(property.id);
                  const occupancyRate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

                  return (
                    <Card key={property.id} data-testid={`card-property-${property.id}`}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="flex items-center gap-2">
                              <Building2 className="h-5 w-5" />
                              <span data-testid={`text-property-name-${property.id}`}>{property.name}</span>
                            </CardTitle>
                            <CardDescription data-testid={`text-property-address-${property.id}`}>
                              {property.address}
                            </CardDescription>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0"
                              onClick={() => handleEditClick(property)}
                              data-testid={`button-edit-property-${property.id}`}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteClick(property)}
                              data-testid={`button-delete-property-${property.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Total Units</span>
                          <span className="font-medium" data-testid={`text-total-units-${property.id}`}>{totalUnits}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Occupied</span>
                          <span className="font-medium" data-testid={`text-occupied-units-${property.id}`}>{occupiedUnits}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">Occupancy Rate</span>
                          <Badge variant={occupancyRate >= 90 ? "default" : "secondary"} data-testid={`badge-occupancy-${property.id}`}>
                            {occupancyRate}%
                          </Badge>
                        </div>
                        <Link href={`/properties/${property.id}`}>
                          <a className="text-sm text-primary hover:underline inline-block mt-2" data-testid={`link-view-details-${property.id}`}>
                            View Details →
                          </a>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Property</DialogTitle>
                  <DialogDescription>
                    Update your property information
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onEdit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Property Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Sunset Apartments" {...field} data-testid="input-edit-property-name" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="address"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Address</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., 123 Main St, City, State" {...field} data-testid="input-edit-property-address" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button 
                      type="submit" 
                      className="w-full" 
                      disabled={updatePropertyMutation.isPending}
                      data-testid="button-submit-edit-property"
                    >
                      {updatePropertyMutation.isPending ? "Updating..." : "Update Property"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Property</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete "{selectedProperty?.name}"? This action cannot be undone.
                    {getTotalUnits(selectedProperty?.id || "") > 0 && (
                      <p className="mt-2 text-destructive font-medium">
                        Warning: This property has {getTotalUnits(selectedProperty?.id || "")} units. Deleting it may affect related data.
                      </p>
                    )}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel data-testid="button-cancel-delete">Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={confirmDelete}
                    className="bg-destructive hover:bg-destructive/90"
                    disabled={deletePropertyMutation.isPending}
                    data-testid="button-confirm-delete"
                  >
                    {deletePropertyMutation.isPending ? "Deleting..." : "Delete Property"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </main>
      </div>
    </div>
  );
}
