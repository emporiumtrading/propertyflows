import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { PageTutorial } from "@/components/PageTutorial";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, AlertCircle, Trash2, Eye, CheckCircle, XCircle, Download } from "lucide-react";
import { insertScreeningSchema, type Screening, type Property, type User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";

type ScreeningFormData = {
  applicantId: string;
  propertyId?: string;
  unitId?: string;
  status: string;
  creditScore?: number;
  backgroundCheckResult?: string;
  evictionHistory?: boolean;
  incomeVerified?: boolean;
  notes?: string;
};

type NewApplicantFormData = {
  email: string;
  firstName: string;
  lastName: string;
};

export default function ScreeningPage() {
  const { user } = useAuth();
  const [propertyFilter, setPropertyFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedScreening, setSelectedScreening] = useState<Screening | null>(null);
  const [showNewApplicantForm, setShowNewApplicantForm] = useState(false);
  const { toast } = useToast();

  const userLoading = false;
  const userError = false;

  const { data: properties = [], isLoading: propertiesLoading, isError: propertiesError } = useQuery<Property[]>({
    queryKey: ["/api/properties"],
    enabled: !!user?.id,
  });

  const { data: applicants = [], isLoading: applicantsLoading } = useQuery<User[]>({
    queryKey: ["/api/users?role=tenant"],
    enabled: !!user?.id,
  });

  const { data: screenings = [], isLoading: screeningsLoading, isError: screeningsError } = useQuery<Screening[]>({
    queryKey: ["/api/screenings"],
    enabled: !!user?.id,
  });

  const createForm = useForm<ScreeningFormData>({
    resolver: zodResolver(insertScreeningSchema.extend({
      propertyId: insertScreeningSchema.shape.propertyId.optional(),
      creditScore: insertScreeningSchema.shape.creditScore.optional(),
      backgroundCheckResult: insertScreeningSchema.shape.backgroundCheckResult.optional(),
      evictionHistory: insertScreeningSchema.shape.evictionHistory.optional(),
      incomeVerified: insertScreeningSchema.shape.incomeVerified.optional(),
      notes: insertScreeningSchema.shape.notes.optional(),
    })),
    defaultValues: {
      status: "pending",
      evictionHistory: false,
      incomeVerified: false,
    },
  });

  const editForm = useForm<ScreeningFormData>({
    resolver: zodResolver(insertScreeningSchema.partial().extend({
      creditScore: insertScreeningSchema.shape.creditScore.optional(),
      backgroundCheckResult: insertScreeningSchema.shape.backgroundCheckResult.optional(),
      evictionHistory: insertScreeningSchema.shape.evictionHistory.optional(),
      incomeVerified: insertScreeningSchema.shape.incomeVerified.optional(),
      notes: insertScreeningSchema.shape.notes.optional(),
    })),
  });

  const newApplicantForm = useForm<NewApplicantFormData>({
    defaultValues: {
      email: "",
      firstName: "",
      lastName: "",
    },
  });

  if (userLoading || propertiesLoading || applicantsLoading || screeningsLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Tenant Screening" subtitle="Background and credit checks" user={user} />
          <main className="flex-1 overflow-y-auto p-6 bg-muted/30 flex items-center justify-center">
            <p className="text-muted-foreground" data-testid="text-loading">Loading screening data...</p>
          </main>
        </div>
      </div>
    );
  }

  if (userError) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Tenant Screening" subtitle="Background and credit checks" user={user} />
          <main className="flex-1 overflow-y-auto p-6 bg-muted/30 flex items-center justify-center">
            <p className="text-destructive" data-testid="text-error">Failed to load user information</p>
          </main>
        </div>
      </div>
    );
  }

  // Apply filters and sort by date descending
  const filteredScreenings = screenings
    .filter((s) => {
      if (propertyFilter !== "all" && s.propertyId !== propertyFilter) return false;
      if (statusFilter !== "all" && s.status !== statusFilter) return false;
      return true;
    })
    .sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

  const handleCreateApplicant = async (data: NewApplicantFormData) => {
    try {
      const response = await apiRequest("POST", "/api/users", { ...data, role: "tenant" });
      const newUser = await response.json();
      
      await queryClient.invalidateQueries({ queryKey: ["/api/users?role=tenant"] });
      await queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      
      createForm.setValue("applicantId", newUser.id);
      setShowNewApplicantForm(false);
      newApplicantForm.reset();
      
      toast({
        title: "Success",
        description: `Applicant ${data.firstName} ${data.lastName} created successfully`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create applicant",
        variant: "destructive",
      });
    }
  };

  const handleCreateScreening = async (data: ScreeningFormData) => {
    try {
      await apiRequest("POST", "/api/screenings", data);
      
      queryClient.invalidateQueries({ queryKey: ["/api/screenings"] });
      setCreateDialogOpen(false);
      setShowNewApplicantForm(false);
      createForm.reset();
      toast({
        title: "Success",
        description: "Screening application created successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create screening application",
        variant: "destructive",
      });
    }
  };

  const handleUpdateScreening = async (data: ScreeningFormData) => {
    if (!selectedScreening) return;
    
    try {
      await apiRequest("PATCH", `/api/screenings/${selectedScreening.id}`, data);
      
      queryClient.invalidateQueries({ queryKey: ["/api/screenings"] });
      setEditDialogOpen(false);
      setSelectedScreening(null);
      editForm.reset();
      toast({
        title: "Success",
        description: "Screening updated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update screening",
        variant: "destructive",
      });
    }
  };

  const handleDeleteScreening = async () => {
    if (!selectedScreening) return;
    
    try {
      await apiRequest("DELETE", `/api/screenings/${selectedScreening.id}`);
      
      queryClient.invalidateQueries({ queryKey: ["/api/screenings"] });
      setDeleteDialogOpen(false);
      setSelectedScreening(null);
      toast({
        title: "Success",
        description: "Screening deleted successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete screening",
        variant: "destructive",
      });
    }
  };

  const handleQuickStatusChange = async (screening: Screening, newStatus: string) => {
    try {
      await apiRequest("PATCH", `/api/screenings/${screening.id}`, { status: newStatus });
      
      queryClient.invalidateQueries({ queryKey: ["/api/screenings"] });
      toast({
        title: "Success",
        description: `Screening ${newStatus}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update screening status",
        variant: "destructive",
      });
    }
  };

  const handleExportReport = (screening: Screening) => {
    const applicant = applicants.find(a => a.id === screening.applicantId);
    const property = properties.find(p => p.id === screening.propertyId);
    
    const report = `
TENANT SCREENING REPORT
========================

Applicant: ${applicant ? `${applicant.firstName} ${applicant.lastName}` : 'N/A'}
Email: ${applicant?.email || 'N/A'}
Property: ${property?.name || 'N/A'}
Status: ${screening.status}

SCREENING RESULTS
-----------------
Credit Score: ${screening.creditScore || 'N/A'}
Background Check: ${screening.backgroundCheckResult || 'N/A'}
Eviction History: ${screening.evictionHistory ? 'Yes' : 'No'}
Income Verified: ${screening.incomeVerified ? 'Yes' : 'No'}

Notes: ${screening.notes || 'None'}

Date Created: ${new Date(screening.createdAt!).toLocaleString()}
    `.trim();
    
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `screening-${screening.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Success",
      description: "Report downloaded successfully",
    });
  };

  const openEditDialog = (screening: Screening) => {
    setSelectedScreening(screening);
    editForm.reset({
      status: screening.status,
      creditScore: screening.creditScore || undefined,
      backgroundCheckResult: screening.backgroundCheckResult || undefined,
      evictionHistory: screening.evictionHistory || false,
      incomeVerified: screening.incomeVerified || false,
      notes: screening.notes || undefined,
    });
    setEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      pending: "bg-yellow-500",
      in_progress: "bg-blue-500",
      completed: "bg-purple-500",
      approved: "bg-green-500",
      denied: "bg-red-500",
    };
    return colors[status as keyof typeof colors] || "bg-gray-500";
  };

  return (
    <div className="flex h-screen overflow-hidden">
      <PageTutorial pagePath="/screening" />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Tenant Screening" subtitle="Background and credit checks" />
        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Header with Create Button */}
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold" data-testid="heading-screenings">Screening Applications</h2>
              <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-screening">
                    <Plus className="h-4 w-4 mr-2" />
                    New Application
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create Screening Application</DialogTitle>
                    <DialogDescription>Submit a new tenant screening application</DialogDescription>
                  </DialogHeader>
                  {!showNewApplicantForm ? (
                    <Form {...createForm}>
                      <form onSubmit={createForm.handleSubmit(handleCreateScreening)} className="space-y-4">
                        <FormField
                          control={createForm.control}
                          name="applicantId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Applicant</FormLabel>
                              <div className="flex gap-2">
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger data-testid="select-applicant" className="flex-1">
                                      <SelectValue placeholder="Select applicant" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {applicants.map((applicant) => (
                                      <SelectItem key={applicant.id} value={applicant.id}>
                                        {applicant.firstName} {applicant.lastName} ({applicant.email})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Button
                                  type="button"
                                  variant="outline"
                                  onClick={() => setShowNewApplicantForm(true)}
                                  data-testid="button-add-new-applicant"
                                >
                                  <Plus className="h-4 w-4 mr-1" />
                                  New
                                </Button>
                              </div>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                          <FormField
                          control={createForm.control}
                          name="propertyId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Property (Optional)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger data-testid="select-property">
                                    <SelectValue placeholder="Select property" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {properties.map((property) => (
                                    <SelectItem key={property.id} value={property.id}>
                                      {property.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={createForm.control}
                          name="notes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Notes</FormLabel>
                              <FormControl>
                                <Textarea
                                  placeholder="Add any additional notes..."
                                  {...field}
                                  data-testid="textarea-notes"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <Button type="submit" data-testid="button-submit-create">
                          Create Application
                        </Button>
                      </form>
                    </Form>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold">New Applicant</h3>
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => setShowNewApplicantForm(false)}
                          data-testid="button-back-to-selection"
                        >
                          Back to Selection
                        </Button>
                      </div>
                      <Form {...newApplicantForm}>
                        <form onSubmit={newApplicantForm.handleSubmit(handleCreateApplicant)} className="space-y-4">
                          <FormField
                            control={newApplicantForm.control}
                            name="firstName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="John"
                                    data-testid="input-first-name"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={newApplicantForm.control}
                            name="lastName"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="Doe"
                                    data-testid="input-last-name"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={newApplicantForm.control}
                            name="email"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Email</FormLabel>
                                <FormControl>
                                  <Input
                                    type="email"
                                    placeholder="john.doe@example.com"
                                    data-testid="input-email"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <Button type="submit" data-testid="button-create-applicant">
                            Create Applicant
                          </Button>
                        </form>
                      </Form>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            </div>

            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle data-testid="heading-filters">Filters</CardTitle>
              </CardHeader>
              <CardContent>
                {propertiesError && (
                  <div className="mb-4 p-3 bg-destructive/10 border border-destructive rounded-md">
                    <p className="text-sm text-destructive" data-testid="text-properties-filter-error">
                      Failed to load properties for filtering
                    </p>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select value={propertyFilter} onValueChange={setPropertyFilter} disabled={propertiesError}>
                    <SelectTrigger data-testid="select-property-filter">
                      <SelectValue placeholder={propertiesError ? "Error loading properties" : "All Properties"} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Properties</SelectItem>
                      {properties.map((property) => (
                        <SelectItem key={property.id} value={property.id}>
                          {property.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger data-testid="select-status-filter">
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="denied">Denied</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Applications List */}
            <Card>
              <CardHeader>
                <CardTitle data-testid="heading-applications">Applications</CardTitle>
                <CardDescription>Review and manage screening applications</CardDescription>
              </CardHeader>
              <CardContent>
                {screeningsError ? (
                  <p className="text-destructive text-sm" data-testid="text-screenings-error">Failed to load screenings</p>
                ) : filteredScreenings.length === 0 ? (
                  <p className="text-muted-foreground text-sm" data-testid="text-no-screenings">No screening applications found</p>
                ) : (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Applicant</TableHead>
                          <TableHead>Property</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Credit Score</TableHead>
                          <TableHead>Background Check</TableHead>
                          <TableHead>Eviction History</TableHead>
                          <TableHead>Income Verified</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredScreenings.map((screening) => {
                          const applicant = applicants.find(t => t.id === screening.applicantId);
                          const property = properties.find(p => p.id === screening.propertyId);
                          
                          return (
                            <TableRow key={screening.id} data-testid={`screening-row-${screening.id}`}>
                              <TableCell data-testid={`text-applicant-${screening.id}`}>
                                {applicant ? `${applicant.firstName} ${applicant.lastName}` : screening.applicantId.substring(0, 8)}
                              </TableCell>
                              <TableCell data-testid={`text-property-${screening.id}`}>
                                {property?.name || screening.propertyId?.substring(0, 8) || 'N/A'}
                              </TableCell>
                              <TableCell>
                                <Badge className={getStatusBadge(screening.status)} data-testid={`badge-status-${screening.id}`}>
                                  {screening.status}
                                </Badge>
                              </TableCell>
                              <TableCell data-testid={`text-credit-score-${screening.id}`}>
                                {screening.creditScore || '-'}
                              </TableCell>
                              <TableCell className="max-w-xs truncate" data-testid={`text-background-${screening.id}`}>
                                {screening.backgroundCheckResult || '-'}
                              </TableCell>
                              <TableCell data-testid={`text-eviction-${screening.id}`}>
                                {screening.evictionHistory ? 'Yes' : 'No'}
                              </TableCell>
                              <TableCell data-testid={`text-income-${screening.id}`}>
                                {screening.incomeVerified ? 'Yes' : 'No'}
                              </TableCell>
                              <TableCell data-testid={`text-created-${screening.id}`}>
                                {new Date(screening.createdAt!).toLocaleDateString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedScreening(screening);
                                      setViewDialogOpen(true);
                                    }}
                                    data-testid={`button-view-${screening.id}`}
                                    title="View Details"
                                  >
                                    <Eye className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => openEditDialog(screening)}
                                    data-testid={`button-edit-${screening.id}`}
                                    title="Edit"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  {screening.status !== 'approved' && screening.status !== 'denied' && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleQuickStatusChange(screening, 'approved')}
                                        data-testid={`button-approve-${screening.id}`}
                                        title="Approve"
                                      >
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleQuickStatusChange(screening, 'denied')}
                                        data-testid={`button-deny-${screening.id}`}
                                        title="Deny"
                                      >
                                        <XCircle className="h-4 w-4 text-red-600" />
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleExportReport(screening)}
                                    data-testid={`button-export-${screening.id}`}
                                    title="Export Report"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      setSelectedScreening(screening);
                                      setDeleteDialogOpen(true);
                                    }}
                                    data-testid={`button-delete-${screening.id}`}
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Edit Dialog */}
            <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Update Screening</DialogTitle>
                  <DialogDescription>Update screening results and status</DialogDescription>
                </DialogHeader>
                <Form {...editForm}>
                  <form onSubmit={editForm.handleSubmit(handleUpdateScreening)} className="space-y-4">
                    <FormField
                      control={editForm.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-edit-status">
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="pending">Pending</SelectItem>
                              <SelectItem value="in_progress">In Progress</SelectItem>
                              <SelectItem value="completed">Completed</SelectItem>
                              <SelectItem value="approved">Approved</SelectItem>
                              <SelectItem value="denied">Denied</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="creditScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Credit Score</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter credit score"
                              {...field}
                              value={field.value || ''}
                              onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                              data-testid="input-credit-score"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="backgroundCheckResult"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Background Check Result</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Enter background check results..."
                              {...field}
                              data-testid="textarea-background-check"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="evictionHistory"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-eviction-history"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Eviction History</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="incomeVerified"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              data-testid="checkbox-income-verified"
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Income Verified</FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Notes</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add any additional notes..."
                              {...field}
                              data-testid="textarea-edit-notes"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" data-testid="button-submit-update">
                      Update Screening
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>

            {/* View Details Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Screening Details</DialogTitle>
                </DialogHeader>
                {selectedScreening && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Applicant</label>
                        <p className="text-sm mt-1">
                          {applicants.find(a => a.id === selectedScreening.applicantId)
                            ? `${applicants.find(a => a.id === selectedScreening.applicantId)?.firstName} ${applicants.find(a => a.id === selectedScreening.applicantId)?.lastName}`
                            : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Email</label>
                        <p className="text-sm mt-1">
                          {applicants.find(a => a.id === selectedScreening.applicantId)?.email || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Property</label>
                        <p className="text-sm mt-1">
                          {properties.find(p => p.id === selectedScreening.propertyId)?.name || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Status</label>
                        <div className="mt-1">
                          <Badge className={getStatusBadge(selectedScreening.status)}>
                            {selectedScreening.status}
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Credit Score</label>
                        <p className="text-sm mt-1">{selectedScreening.creditScore || 'Not provided'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Eviction History</label>
                        <p className="text-sm mt-1">{selectedScreening.evictionHistory ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Income Verified</label>
                        <p className="text-sm mt-1">{selectedScreening.incomeVerified ? 'Yes' : 'No'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Created</label>
                        <p className="text-sm mt-1">{new Date(selectedScreening.createdAt!).toLocaleString()}</p>
                      </div>
                      <div className="col-span-2">
                        <label className="text-sm font-medium text-muted-foreground">Background Check Result</label>
                        <p className="text-sm mt-1 whitespace-pre-wrap">
                          {selectedScreening.backgroundCheckResult || 'No results available'}
                        </p>
                      </div>
                      {selectedScreening.notes && (
                        <div className="col-span-2">
                          <label className="text-sm font-medium text-muted-foreground">Notes</label>
                          <p className="text-sm mt-1 whitespace-pre-wrap">{selectedScreening.notes}</p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => handleExportReport(selectedScreening)}
                        data-testid="button-view-export"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Export Report
                      </Button>
                    </div>
                  </div>
                )}
              </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Screening</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this screening application? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                {selectedScreening && (
                  <div className="space-y-2">
                    <p className="text-sm">
                      <strong>Applicant:</strong>{' '}
                      {applicants.find(a => a.id === selectedScreening.applicantId)
                        ? `${applicants.find(a => a.id === selectedScreening.applicantId)?.firstName} ${applicants.find(a => a.id === selectedScreening.applicantId)?.lastName}`
                        : 'N/A'}
                    </p>
                    <p className="text-sm">
                      <strong>Property:</strong>{' '}
                      {properties.find(p => p.id === selectedScreening.propertyId)?.name || 'N/A'}
                    </p>
                    <p className="text-sm">
                      <strong>Status:</strong> {selectedScreening.status}
                    </p>
                  </div>
                )}
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                    data-testid="button-cancel-delete"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDeleteScreening}
                    data-testid="button-confirm-delete"
                  >
                    Delete Screening
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </main>
      </div>
    </div>
  );
}
