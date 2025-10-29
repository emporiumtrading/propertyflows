import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, CheckCircle, XCircle, DollarSign, Users, Building2, Edit, Trash2 } from "lucide-react";
import type { SubscriptionPlan } from "@shared/schema";

const planFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  displayName: z.string().min(1, "Display name is required"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0, "Price must be at least 0"),
  billingInterval: z.enum(['monthly', 'annual']),
  trialDays: z.coerce.number().int().min(0).max(365, "Trial days must be between 0 and 365"),
  isActive: z.boolean(),
  maxProperties: z.coerce.number().int().min(1).max(10000, "Must be between 1 and 10,000"),
  maxUnits: z.coerce.number().int().min(1).max(100000, "Must be between 1 and 100,000"),
  maxTenants: z.coerce.number().int().min(1).max(100000, "Must be between 1 and 100,000"),
  maxPropertyManagers: z.coerce.number().int().min(1).max(1000, "Must be between 1 and 1,000"),
  maxOwners: z.coerce.number().int().min(1).max(10000, "Must be between 1 and 10,000"),
  maxVendors: z.coerce.number().int().min(1).max(10000, "Must be between 1 and 10,000"),
  maxStorage: z.coerce.number().int().min(1).max(1099511627776, "Storage must be at least 1 byte"),
  aiMaintenance: z.boolean(),
  fairHousing: z.boolean(),
  bulkImport: z.boolean(),
  quickbooksSync: z.boolean(),
  advancedReporting: z.boolean(),
  whiteLabel: z.boolean(),
  apiAccess: z.boolean(),
  prioritySupport: z.boolean(),
});

type PlanFormData = z.infer<typeof planFormSchema>;

export default function SubscriptionPlans() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);

  const { data: plans, isLoading } = useQuery<SubscriptionPlan[]>({
    queryKey: ['/api/admin/subscription-plans'],
  });

  const form = useForm<PlanFormData>({
    resolver: zodResolver(planFormSchema),
    defaultValues: {
      name: "",
      displayName: "",
      description: "",
      price: "0",
      billingInterval: "monthly",
      trialDays: "14",
      isActive: true,
      maxProperties: "5",
      maxUnits: "50",
      maxTenants: "100",
      maxPropertyManagers: "1",
      maxOwners: "5",
      maxVendors: "10",
      maxStorage: "5368709120",
      aiMaintenance: false,
      fairHousing: false,
      bulkImport: false,
      quickbooksSync: false,
      advancedReporting: false,
      whiteLabel: false,
      apiAccess: false,
      prioritySupport: false,
    },
  });

  const seedMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/admin/subscription-plans/seed', {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to seed plans');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscription-plans'] });
      toast({
        title: "Success",
        description: "Default subscription plans seeded successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to seed plans",
        variant: "destructive",
      });
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: PlanFormData) => {
      const planData = {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        price: data.price,
        billingInterval: data.billingInterval,
        trialDays: data.trialDays,
        isActive: data.isActive,
        features: {
          maxProperties: data.maxProperties,
          maxUnits: data.maxUnits,
          maxTenants: data.maxTenants,
          maxPropertyManagers: data.maxPropertyManagers,
          maxOwners: data.maxOwners,
          maxVendors: data.maxVendors,
          maxStorage: data.maxStorage,
          features: {
            aiMaintenance: data.aiMaintenance,
            fairHousing: data.fairHousing,
            bulkImport: data.bulkImport,
            quickbooksSync: data.quickbooksSync,
            advancedReporting: data.advancedReporting,
            whiteLabel: data.whiteLabel,
            apiAccess: data.apiAccess,
            prioritySupport: data.prioritySupport,
          },
        },
      };
      return apiRequest('POST', '/api/admin/subscription-plans', planData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscription-plans'] });
      setIsDialogOpen(false);
      form.reset();
      toast({
        title: "Success",
        description: "Subscription plan created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create plan",
        variant: "destructive",
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: PlanFormData }) => {
      const planData = {
        name: data.name,
        displayName: data.displayName,
        description: data.description,
        price: data.price,
        billingInterval: data.billingInterval,
        trialDays: data.trialDays,
        isActive: data.isActive,
        features: {
          maxProperties: data.maxProperties,
          maxUnits: data.maxUnits,
          maxTenants: data.maxTenants,
          maxPropertyManagers: data.maxPropertyManagers,
          maxOwners: data.maxOwners,
          maxVendors: data.maxVendors,
          maxStorage: data.maxStorage,
          features: {
            aiMaintenance: data.aiMaintenance,
            fairHousing: data.fairHousing,
            bulkImport: data.bulkImport,
            quickbooksSync: data.quickbooksSync,
            advancedReporting: data.advancedReporting,
            whiteLabel: data.whiteLabel,
            apiAccess: data.apiAccess,
            prioritySupport: data.prioritySupport,
          },
        },
      };
      return apiRequest('PUT', `/api/admin/subscription-plans/${id}`, planData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscription-plans'] });
      setIsDialogOpen(false);
      setEditingPlan(null);
      form.reset();
      toast({
        title: "Success",
        description: "Subscription plan updated successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update plan",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/admin/subscription-plans/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/subscription-plans'] });
      toast({
        title: "Success",
        description: "Subscription plan deleted successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete plan",
        variant: "destructive",
      });
    },
  });

  const handleCreate = () => {
    setEditingPlan(null);
    form.reset();
    setIsDialogOpen(true);
  };

  const handleEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    form.reset({
      name: plan.name,
      displayName: plan.displayName,
      description: plan.description || "",
      price: plan.price.toString(),
      billingInterval: plan.billingInterval as 'monthly' | 'annual',
      trialDays: plan.trialDays.toString(),
      isActive: plan.isActive,
      maxProperties: plan.features.maxProperties.toString(),
      maxUnits: plan.features.maxUnits.toString(),
      maxTenants: plan.features.maxTenants.toString(),
      maxPropertyManagers: plan.features.maxPropertyManagers.toString(),
      maxOwners: plan.features.maxOwners.toString(),
      maxVendors: plan.features.maxVendors.toString(),
      maxStorage: plan.features.maxStorage.toString(),
      aiMaintenance: plan.features.features.aiMaintenance,
      fairHousing: plan.features.features.fairHousing,
      bulkImport: plan.features.features.bulkImport,
      quickbooksSync: plan.features.features.quickbooksSync,
      advancedReporting: plan.features.features.advancedReporting,
      whiteLabel: plan.features.features.whiteLabel,
      apiAccess: plan.features.features.apiAccess,
      prioritySupport: plan.features.features.prioritySupport,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this subscription plan?')) {
      deleteMutation.mutate(id);
    }
  };

  const onSubmit = (data: PlanFormData) => {
    if (editingPlan) {
      updateMutation.mutate({ id: editingPlan.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  if (user?.role !== 'admin') {
    return (
      <Layout>
        <Alert variant="destructive">
          <AlertDescription>Access denied. Admin privileges required.</AlertDescription>
        </Alert>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold" data-testid="text-page-title">Subscription Plans</h1>
            <p className="text-muted-foreground mt-1">
              Manage subscription plans and pricing tiers for your platform
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => seedMutation.mutate()}
              disabled={seedMutation.isPending}
              variant="outline"
              data-testid="button-seed-plans"
            >
              Seed Default Plans
            </Button>
            <Button
              onClick={handleCreate}
              data-testid="button-create-plan"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Plan
            </Button>
          </div>
        </div>

        {isLoading ? (
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-64 w-full" />
            </CardContent>
          </Card>
        ) : !plans || plans.length === 0 ? (
          <Card>
            <CardContent className="p-12 text-center">
              <DollarSign className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No subscription plans yet</h3>
              <p className="text-muted-foreground mb-4">
                Get started by seeding default plans
              </p>
              <Button onClick={() => seedMutation.mutate()} data-testid="button-seed-empty">
                Seed Default Plans
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>Active Plans</CardTitle>
              <CardDescription>
                {plans.length} subscription {plans.length === 1 ? 'plan' : 'plans'} configured
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan Name</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Limits</TableHead>
                    <TableHead>Key Features</TableHead>
                    <TableHead>Trial</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plans.map((plan) => (
                    <TableRow key={plan.id} data-testid={`row-plan-${plan.id}`}>
                      <TableCell>
                        <div>
                          <div className="font-semibold" data-testid={`text-plan-name-${plan.id}`}>
                            {plan.displayName}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {plan.description}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          <span className="font-semibold" data-testid={`text-plan-price-${plan.id}`}>
                            {plan.price}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            /{plan.billingInterval}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {plan.features.maxProperties} properties
                          </div>
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {plan.features.maxUnits} units
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {plan.features.maxTenants} tenants
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {plan.features.features.aiMaintenance && (
                            <Badge variant="secondary" className="text-xs">AI</Badge>
                          )}
                          {plan.features.features.advancedReporting && (
                            <Badge variant="secondary" className="text-xs">Reports</Badge>
                          )}
                          {plan.features.features.apiAccess && (
                            <Badge variant="secondary" className="text-xs">API</Badge>
                          )}
                          {plan.features.features.prioritySupport && (
                            <Badge variant="secondary" className="text-xs">Priority</Badge>
                          )}
                          {plan.features.features.quickbooksSync && (
                            <Badge variant="secondary" className="text-xs">QuickBooks</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm" data-testid={`text-plan-trial-${plan.id}`}>
                          {plan.trialDays} days
                        </span>
                      </TableCell>
                      <TableCell>
                        {plan.isActive ? (
                          <Badge variant="default" className="flex items-center gap-1 w-fit">
                            <CheckCircle className="w-3 h-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
                            <XCircle className="w-3 h-3" />
                            Inactive
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEdit(plan)}
                            data-testid={`button-edit-${plan.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(plan.id)}
                            data-testid={`button-delete-${plan.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingPlan ? 'Edit Subscription Plan' : 'Create Subscription Plan'}
              </DialogTitle>
              <DialogDescription>
                {editingPlan 
                  ? 'Update the subscription plan details below'
                  : 'Create a new subscription plan with custom pricing and features'}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Plan Name (Internal)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="starter" data-testid="input-plan-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="displayName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Display Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Starter Plan" data-testid="input-display-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Perfect for small property managers" rows={2} data-testid="input-description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="price"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($)</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" step="0.01" placeholder="49.00" data-testid="input-price" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="billingInterval"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Billing Interval</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-billing-interval">
                              <SelectValue placeholder="Select interval" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="annual">Annual</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="trialDays"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Trial Days</FormLabel>
                        <FormControl>
                          <Input {...field} type="number" placeholder="14" data-testid="input-trial-days" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Usage Limits</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="maxProperties"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Properties</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="5" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="maxUnits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Units</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="maxTenants"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Tenants</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="100" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="maxPropertyManagers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Property Managers</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="1" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="maxOwners"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Owners</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="5" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="maxVendors"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Vendors</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" placeholder="10" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold">Features</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="aiMaintenance"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>AI Maintenance</FormLabel>
                            <FormDescription className="text-xs">
                              AI-powered maintenance triage
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="fairHousing"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Fair Housing AI</FormLabel>
                            <FormDescription className="text-xs">
                              Compliance checking
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="bulkImport"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Bulk Import</FormLabel>
                            <FormDescription className="text-xs">
                              CSV/Excel data import
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="quickbooksSync"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>QuickBooks Sync</FormLabel>
                            <FormDescription className="text-xs">
                              Accounting integration
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="advancedReporting"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Advanced Reporting</FormLabel>
                            <FormDescription className="text-xs">
                              Analytics dashboard
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="whiteLabel"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>White Label</FormLabel>
                            <FormDescription className="text-xs">
                              Custom branding
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="apiAccess"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>API Access</FormLabel>
                            <FormDescription className="text-xs">
                              REST API integration
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="prioritySupport"
                      render={({ field }) => (
                        <FormItem className="flex items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Priority Support</FormLabel>
                            <FormDescription className="text-xs">
                              24/7 premium support
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex items-center gap-2">
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <FormLabel className="!mt-0">Active (visible to users)</FormLabel>
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsDialogOpen(false)}
                    data-testid="button-cancel-plan"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    data-testid="button-save-plan"
                  >
                    {editingPlan ? 'Update Plan' : 'Create Plan'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
