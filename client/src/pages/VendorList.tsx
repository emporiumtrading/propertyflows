import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { PageTutorial } from "@/components/PageTutorial";
import { Edit, Building2, Mail, Phone, MapPin, Briefcase, FileText, Upload, Trash2, Download } from "lucide-react";

const editVendorSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
});

export default function VendorList() {
  const { toast } = useToast();
  const [selectedVendor, setSelectedVendor] = useState<any>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>([]);
  const [uploadingDocument, setUploadingDocument] = useState(false);

  const { data: vendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: ['/api/vendors'],
  });

  const { data: properties = [], isLoading: propertiesLoading } = useQuery({
    queryKey: ['/api/properties'],
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['/api/property-vendor-assignments'],
  });

  const { data: vendorDocuments = [] } = useQuery({
    queryKey: ['/api/vendor-documents', selectedVendor?.id],
    enabled: !!selectedVendor && editDialogOpen,
  });

  const form = useForm<z.infer<typeof editVendorSchema>>({
    resolver: zodResolver(editVendorSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      companyName: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
    },
  });

  const updateVendorMutation = useMutation({
    mutationFn: async ({ vendorId, data }: { vendorId: string; data: z.infer<typeof editVendorSchema> }) => {
      return apiRequest('PATCH', `/api/users/${vendorId}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendors'] });
      setEditDialogOpen(false);
      setSelectedVendor(null);
      toast({
        title: 'Vendor Updated',
        description: 'Vendor information has been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update vendor. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const assignPropertiesMutation = useMutation({
    mutationFn: async ({ vendorId, propertyIds }: { vendorId: string; propertyIds: string[] }) => {
      const currentAssignments = assignments.filter((a: any) => a.vendorId === vendorId);
      const currentPropertyIds = currentAssignments.map((a: any) => a.propertyId);
      
      const toAdd = propertyIds.filter(id => !currentPropertyIds.includes(id));
      const toRemove = currentPropertyIds.filter((id: string) => !propertyIds.includes(id));

      const promises = [];
      
      for (const propertyId of toAdd) {
        promises.push(
          apiRequest('POST', '/api/property-vendor-assignments', { propertyId, vendorId })
        );
      }
      
      for (const propertyId of toRemove) {
        const assignment = currentAssignments.find((a: any) => a.propertyId === propertyId);
        if (assignment) {
          promises.push(
            apiRequest('DELETE', `/api/property-vendor-assignments/${assignment.id}`)
          );
        }
      }

      return Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/property-vendor-assignments'] });
      toast({
        title: 'Properties Updated',
        description: 'Vendor property assignments have been updated successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update property assignments. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async ({ vendorId, file, documentType }: { vendorId: string; file: File; documentType: string }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('vendorId', vendorId);
      formData.append('documentType', documentType);

      const response = await fetch('/api/vendor-documents', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-documents', selectedVendor?.id] });
      setUploadingDocument(false);
      toast({
        title: 'Document Uploaded',
        description: 'Vendor document has been uploaded successfully.',
      });
    },
    onError: () => {
      setUploadingDocument(false);
      toast({
        title: 'Error',
        description: 'Failed to upload document. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (documentId: string) => {
      return apiRequest('DELETE', `/api/vendor-documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-documents', selectedVendor?.id] });
      toast({
        title: 'Document Deleted',
        description: 'Vendor document has been deleted successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete document. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !selectedVendor) return;
    
    const file = event.target.files[0];
    setUploadingDocument(true);
    uploadDocumentMutation.mutate({ vendorId: selectedVendor.id, file, documentType: 'general' });
  };

  const openEditDialog = (vendor: any) => {
    setSelectedVendor(vendor);
    form.reset({
      firstName: vendor.firstName || '',
      lastName: vendor.lastName || '',
      email: vendor.email || '',
      phone: vendor.phone || '',
      companyName: vendor.companyName || '',
      address: vendor.address || '',
      city: vendor.city || '',
      state: vendor.state || '',
      zipCode: vendor.zipCode || '',
    });
    
    const vendorPropertyIds = assignments
      .filter((a: any) => a.vendorId === vendor.id)
      .map((a: any) => a.propertyId);
    setSelectedPropertyIds(vendorPropertyIds);
    
    setEditDialogOpen(true);
  };

  const onSubmit = (values: z.infer<typeof editVendorSchema>) => {
    if (!selectedVendor) return;
    updateVendorMutation.mutate({ vendorId: selectedVendor.id, data: values });
  };

  const handleSavePropertyAssignments = () => {
    if (!selectedVendor) return;
    assignPropertiesMutation.mutate({
      vendorId: selectedVendor.id,
      propertyIds: selectedPropertyIds,
    });
  };

  const toggleProperty = (propertyId: string) => {
    setSelectedPropertyIds(prev =>
      prev.includes(propertyId)
        ? prev.filter(id => id !== propertyId)
        : [...prev, propertyId]
    );
  };

  const getAssignedPropertiesCount = (vendorId: string) => {
    return assignments.filter((a: any) => a.vendorId === vendorId).length;
  };

  if (vendorsLoading || propertiesLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Header title="Vendor Management" />
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground" data-testid="text-loading">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <PageTutorial pagePath="/vendors" />
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title="Vendor Management" />
        <main className="flex-1 overflow-y-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="text-vendors-title">Vendors</CardTitle>
              <CardDescription>Manage vendor information and property assignments</CardDescription>
            </CardHeader>
            <CardContent>
              {vendors.length === 0 ? (
                <div className="text-center py-12">
                  <Briefcase className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground" data-testid="text-no-vendors">
                    No vendors registered yet. Send an invitation to add a vendor.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Company</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Properties</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vendors.map((vendor: any) => (
                      <TableRow key={vendor.id} data-testid={`row-vendor-${vendor.id}`}>
                        <TableCell className="font-medium" data-testid={`text-vendor-name-${vendor.id}`}>
                          {vendor.firstName} {vendor.lastName}
                        </TableCell>
                        <TableCell data-testid={`text-vendor-company-${vendor.id}`}>
                          {vendor.companyName || 'N/A'}
                        </TableCell>
                        <TableCell data-testid={`text-vendor-email-${vendor.id}`}>
                          {vendor.email}
                        </TableCell>
                        <TableCell data-testid={`text-vendor-phone-${vendor.id}`}>
                          {vendor.phone || 'N/A'}
                        </TableCell>
                        <TableCell data-testid={`text-vendor-properties-${vendor.id}`}>
                          <Badge variant="secondary">
                            {getAssignedPropertiesCount(vendor.id)} {getAssignedPropertiesCount(vendor.id) === 1 ? 'property' : 'properties'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(vendor)}
                            data-testid={`button-edit-vendor-${vendor.id}`}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-vendor">
              <DialogHeader>
                <DialogTitle>Edit Vendor</DialogTitle>
                <DialogDescription>
                  Update vendor information and manage property assignments
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="firstName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>First Name</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-first-name" />
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
                              <Input {...field} data-testid="input-last-name" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="companyName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Company Name</FormLabel>
                          <FormControl>
                            <Input {...field} data-testid="input-company-name" />
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
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              <Input {...field} type="email" disabled data-testid="input-email" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone</FormLabel>
                          <FormControl>
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-muted-foreground" />
                              <Input {...field} data-testid="input-phone" />
                            </div>
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
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 text-muted-foreground" />
                              <Input {...field} data-testid="input-address" />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="city"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>City</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-city" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="state"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>State</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-state" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="zipCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>ZIP Code</FormLabel>
                            <FormControl>
                              <Input {...field} data-testid="input-zip" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end">
                      <Button type="submit" disabled={updateVendorMutation.isPending} data-testid="button-save-vendor">
                        {updateVendorMutation.isPending ? 'Saving...' : 'Save Vendor Info'}
                      </Button>
                    </div>
                  </form>
                </Form>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5" />
                    Property Assignments
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select which properties this vendor should be assigned to
                  </p>

                  {properties.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8" data-testid="text-no-properties">
                      No properties available
                    </p>
                  ) : (
                    <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-4">
                      {properties.map((property: any) => (
                        <div
                          key={property.id}
                          className="flex items-center space-x-3 p-2 hover:bg-accent rounded-md"
                          data-testid={`property-checkbox-${property.id}`}
                        >
                          <Checkbox
                            id={property.id}
                            checked={selectedPropertyIds.includes(property.id)}
                            onCheckedChange={() => toggleProperty(property.id)}
                            data-testid={`checkbox-property-${property.id}`}
                          />
                          <label
                            htmlFor={property.id}
                            className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                          >
                            {property.name}
                            <span className="text-muted-foreground ml-2">
                              ({property.address}, {property.city})
                            </span>
                          </label>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex justify-end gap-2 mt-4">
                    <Button
                      type="button"
                      onClick={handleSavePropertyAssignments}
                      disabled={assignPropertiesMutation.isPending}
                      data-testid="button-save-assignments"
                    >
                      {assignPropertiesMutation.isPending ? 'Saving...' : 'Save Property Assignments'}
                    </Button>
                  </div>
                </div>

                <div className="border-t pt-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    Vendor Documents
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Upload and manage documents for this vendor (certificates, insurance, contracts, etc.)
                  </p>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        onChange={handleFileUpload}
                        disabled={uploadingDocument}
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        data-testid="input-document-upload"
                      />
                      {uploadingDocument && (
                        <span className="text-sm text-muted-foreground">Uploading...</span>
                      )}
                    </div>

                    {vendorDocuments && vendorDocuments.length > 0 ? (
                      <div className="border rounded-lg divide-y">
                        {vendorDocuments.map((doc: any) => (
                          <div
                            key={doc.id}
                            className="flex items-center justify-between p-3 hover:bg-accent"
                            data-testid={`document-${doc.id}`}
                          >
                            <div className="flex items-center gap-3 flex-1">
                              <FileText className="h-5 w-5 text-muted-foreground" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate" data-testid={`text-document-name-${doc.id}`}>
                                  {doc.fileName}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : 'Unknown size'} •{' '}
                                  {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : 'Unknown date'}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(doc.fileUrl, '_blank')}
                                data-testid={`button-download-${doc.id}`}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteDocumentMutation.mutate(doc.id)}
                                disabled={deleteDocumentMutation.isPending}
                                data-testid={`button-delete-${doc.id}`}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground py-8 border rounded-lg" data-testid="text-no-documents">
                        No documents uploaded yet
                      </p>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setEditDialogOpen(false)}
                      data-testid="button-cancel"
                    >
                      Close
                    </Button>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
}
