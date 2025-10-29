import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wrench, ClipboardList, FileCheck, DollarSign, Calendar, Upload, Paperclip, X } from 'lucide-react';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { ObjectUploader } from '@/components/ObjectUploader';
import type { UploadResult } from '@uppy/core';

const bidFormSchema = z.object({
  bidAmount: z.string().min(1, 'Bid amount is required'),
  estimatedDays: z.string().optional(),
  notes: z.string().optional(),
});

const completionFormSchema = z.object({
  notes: z.string().optional(),
  photoUrls: z.array(z.string()).optional(),
  invoiceUrl: z.string().optional(),
});

export default function VendorDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);
  const [bidAttachments, setBidAttachments] = useState<string[]>([]);
  const [completionPhotos, setCompletionPhotos] = useState<string[]>([]);

  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/vendor-jobs'],
  });

  const { data: bids = [], isLoading: bidsLoading } = useQuery({
    queryKey: ['/api/vendor-bids'],
  });

  const { data: completionDocs = [], isLoading: docsLoading } = useQuery({
    queryKey: ['/api/work-completion-docs'],
  });

  const bidForm = useForm<z.infer<typeof bidFormSchema>>({
    resolver: zodResolver(bidFormSchema),
    defaultValues: {
      bidAmount: '',
      estimatedDays: '',
      notes: '',
    },
  });

  const completionForm = useForm<z.infer<typeof completionFormSchema>>({
    resolver: zodResolver(completionFormSchema),
    defaultValues: {
      notes: '',
      photoUrls: [],
      invoiceUrl: '',
    },
  });

  const createBidMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/vendor-bids', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          attachmentUrls: bidAttachments,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-bids'] });
      setBidDialogOpen(false);
      bidForm.reset();
      setBidAttachments([]);
      toast({
        title: 'Bid Submitted',
        description: 'Your bid has been submitted successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to submit bid. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const submitCompletionMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/work-completion-docs', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          photoUrls: completionPhotos,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-completion-docs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-jobs'] });
      setCompletionDialogOpen(false);
      completionForm.reset();
      setCompletionPhotos([]);
      toast({
        title: 'Work Completed',
        description: 'Your completion documentation has been submitted.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to submit completion docs. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const onBidSubmit = (values: z.infer<typeof bidFormSchema>) => {
    if (!selectedJob) return;
    
    createBidMutation.mutate({
      jobType: selectedJob.jobType,
      jobId: selectedJob.id,
      bidAmount: values.bidAmount,
      estimatedDays: values.estimatedDays ? parseInt(values.estimatedDays) : undefined,
      notes: values.notes,
    });
  };

  const onCompletionSubmit = (values: z.infer<typeof completionFormSchema>) => {
    if (!selectedJob) return;
    
    submitCompletionMutation.mutate({
      jobType: selectedJob.jobType,
      jobId: selectedJob.id,
      notes: values.notes,
      photoUrls: values.photoUrls || [],
      invoiceUrl: values.invoiceUrl,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-yellow-500';
      case 'in_progress': return 'bg-blue-500';
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2" data-testid="text-vendor-dashboard-title">Vendor Dashboard</h1>
          <p className="text-muted-foreground">Manage your assigned jobs, bids, and completed work</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
              <Wrench className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-active-jobs-count">
                {jobs.filter((j: any) => j.status === 'in_progress' || j.status === 'open').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Bids</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-pending-bids-count">
                {bids.filter((b: any) => b.status === 'pending').length}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Jobs</CardTitle>
              <FileCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-completed-jobs-count">
                {completionDocs.length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="jobs" className="space-y-4">
          <TabsList>
            <TabsTrigger value="jobs" data-testid="tab-jobs">Assigned Jobs</TabsTrigger>
            <TabsTrigger value="bids" data-testid="tab-bids">My Bids</TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">Completed Work</TabsTrigger>
          </TabsList>

          <TabsContent value="jobs" className="space-y-4">
            {jobsLoading ? (
              <div className="text-center py-8">Loading jobs...</div>
            ) : jobs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No jobs assigned yet
                </CardContent>
              </Card>
            ) : (
              jobs.map((job: any) => (
                <Card key={job.id} data-testid={`card-job-${job.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{job.title}</CardTitle>
                        <CardDescription className="mt-2">{job.description || job.notes}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={getStatusColor(job.status)}>{job.status}</Badge>
                        {job.priority && (
                          <Badge className={getPriorityColor(job.priority)}>{job.priority}</Badge>
                        )}
                        <Badge variant="outline">{job.jobType === 'maintenance' ? 'Maintenance' : 'Turn Task'}</Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        {job.estimatedCost && (
                          <p className="text-sm"><span className="font-medium">Estimated Cost:</span> ${job.estimatedCost}</p>
                        )}
                        {job.dueDate && (
                          <p className="text-sm flex items-center gap-2 mt-1">
                            <Calendar className="h-4 w-4" />
                            Due: {new Date(job.dueDate).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <div className="flex justify-end gap-2">
                        <Dialog open={bidDialogOpen && selectedJob?.id === job.id} onOpenChange={(open) => {
                          setBidDialogOpen(open);
                          if (open) setSelectedJob(job);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" data-testid={`button-submit-bid-${job.id}`}>
                              <DollarSign className="h-4 w-4 mr-2" />
                              Submit Bid
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Submit Bid</DialogTitle>
                              <DialogDescription>Enter your bid details for this job</DialogDescription>
                            </DialogHeader>
                            <Form {...bidForm}>
                              <form onSubmit={bidForm.handleSubmit(onBidSubmit)} className="space-y-4">
                                <FormField
                                  control={bidForm.control}
                                  name="bidAmount"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Bid Amount ($)</FormLabel>
                                      <FormControl>
                                        <Input type="number" step="0.01" placeholder="1500.00" data-testid="input-bid-amount" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={bidForm.control}
                                  name="estimatedDays"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Estimated Days</FormLabel>
                                      <FormControl>
                                        <Input type="number" placeholder="3" data-testid="input-estimated-days" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <FormField
                                  control={bidForm.control}
                                  name="notes"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Notes (Optional)</FormLabel>
                                      <FormControl>
                                        <Textarea placeholder="Additional details about your bid..." data-testid="textarea-bid-notes" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                
                                <div>
                                  <FormLabel className="block mb-2">Attachments (Optional)</FormLabel>
                                  <ObjectUploader
                                    maxNumberOfFiles={5}
                                    maxFileSize={10485760}
                                    onGetUploadParameters={async () => {
                                      const response = await apiRequest('/api/objects/upload', {
                                        method: 'POST',
                                      });
                                      return {
                                        method: 'PUT' as const,
                                        url: response.uploadURL,
                                      };
                                    }}
                                    onComplete={(result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
                                      const newUrls = result.successful.map((file) => file.uploadURL);
                                      setBidAttachments((prev) => [...prev, ...newUrls]);
                                      toast({
                                        title: 'Files Uploaded',
                                        description: `${result.successful.length} file(s) uploaded successfully.`,
                                      });
                                    }}
                                    buttonClassName="w-full"
                                  >
                                    <Paperclip className="h-4 w-4 mr-2" />
                                    Upload Files (Proposals, Estimates, Certificates)
                                  </ObjectUploader>
                                  
                                  {bidAttachments.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                      <p className="text-sm text-muted-foreground">
                                        {bidAttachments.length} file(s) attached
                                      </p>
                                      <div className="space-y-1">
                                        {bidAttachments.map((url, index) => (
                                          <div
                                            key={index}
                                            className="flex items-center justify-between bg-muted px-3 py-2 rounded-md"
                                            data-testid={`attachment-item-${index}`}
                                          >
                                            <span className="text-sm truncate flex-1">
                                              Attachment {index + 1}
                                            </span>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                setBidAttachments((prev) =>
                                                  prev.filter((_, i) => i !== index)
                                                );
                                              }}
                                              data-testid={`button-remove-attachment-${index}`}
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex justify-end gap-2">
                                  <Button type="button" variant="outline" onClick={() => setBidDialogOpen(false)} data-testid="button-cancel-bid">
                                    Cancel
                                  </Button>
                                  <Button type="submit" disabled={createBidMutation.isPending} data-testid="button-confirm-bid">
                                    {createBidMutation.isPending ? 'Submitting...' : 'Submit Bid'}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={completionDialogOpen && selectedJob?.id === job.id} onOpenChange={(open) => {
                          setCompletionDialogOpen(open);
                          if (open) setSelectedJob(job);
                        }}>
                          <DialogTrigger asChild>
                            <Button size="sm" data-testid={`button-mark-complete-${job.id}`}>
                              <FileCheck className="h-4 w-4 mr-2" />
                              Mark Complete
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Submit Completion Documentation</DialogTitle>
                              <DialogDescription>Upload photos and invoice for completed work</DialogDescription>
                            </DialogHeader>
                            <Form {...completionForm}>
                              <form onSubmit={completionForm.handleSubmit(onCompletionSubmit)} className="space-y-4">
                                <FormField
                                  control={completionForm.control}
                                  name="notes"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Work Summary</FormLabel>
                                      <FormControl>
                                        <Textarea placeholder="Describe the work completed..." data-testid="textarea-completion-notes" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div>
                                  <FormLabel className="block mb-2">Completion Photos</FormLabel>
                                  <ObjectUploader
                                    maxNumberOfFiles={10}
                                    maxFileSize={10485760}
                                    onGetUploadParameters={async () => {
                                      const response = await apiRequest('/api/objects/upload', {
                                        method: 'POST',
                                      });
                                      return {
                                        method: 'PUT' as const,
                                        url: response.uploadURL,
                                      };
                                    }}
                                    onComplete={(result: UploadResult<Record<string, unknown>, Record<string, unknown>>) => {
                                      const newUrls = result.successful.map((file) => file.uploadURL);
                                      setCompletionPhotos((prev) => [...prev, ...newUrls]);
                                      toast({
                                        title: 'Photos Uploaded',
                                        description: `${result.successful.length} photo(s) uploaded successfully.`,
                                      });
                                    }}
                                    buttonClassName="w-full"
                                  >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload Completion Photos (Before/After, Repairs, etc.)
                                  </ObjectUploader>
                                  
                                  {completionPhotos.length > 0 && (
                                    <div className="mt-3 space-y-2">
                                      <p className="text-sm text-muted-foreground">
                                        {completionPhotos.length} photo(s) attached
                                      </p>
                                      <div className="space-y-1">
                                        {completionPhotos.map((url, index) => (
                                          <div
                                            key={index}
                                            className="flex items-center justify-between bg-muted px-3 py-2 rounded-md"
                                            data-testid={`completion-photo-${index}`}
                                          >
                                            <span className="text-sm truncate flex-1">
                                              Photo {index + 1}
                                            </span>
                                            <Button
                                              type="button"
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => {
                                                setCompletionPhotos((prev) =>
                                                  prev.filter((_, i) => i !== index)
                                                );
                                              }}
                                              data-testid={`button-remove-photo-${index}`}
                                            >
                                              <X className="h-4 w-4" />
                                            </Button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                <FormField
                                  control={completionForm.control}
                                  name="invoiceUrl"
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Invoice URL (Optional)</FormLabel>
                                      <FormControl>
                                        <Input placeholder="https://..." data-testid="input-invoice-url" {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />
                                <div className="flex justify-end gap-2">
                                  <Button type="button" variant="outline" onClick={() => setCompletionDialogOpen(false)} data-testid="button-cancel-completion">
                                    Cancel
                                  </Button>
                                  <Button type="submit" disabled={submitCompletionMutation.isPending} data-testid="button-confirm-completion">
                                    {submitCompletionMutation.isPending ? 'Submitting...' : 'Submit'}
                                  </Button>
                                </div>
                              </form>
                            </Form>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="bids" className="space-y-4">
            {bidsLoading ? (
              <div className="text-center py-8">Loading bids...</div>
            ) : bids.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No bids submitted yet
                </CardContent>
              </Card>
            ) : (
              bids.map((bid: any) => (
                <Card key={bid.id} data-testid={`card-bid-${bid.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>${bid.bidAmount}</CardTitle>
                        <CardDescription>
                          {bid.jobType === 'maintenance' ? 'Maintenance Request' : 'Turn Task'} • {bid.estimatedDays ? `${bid.estimatedDays} days` : 'No timeline'}
                        </CardDescription>
                      </div>
                      <Badge className={bid.status === 'pending' ? 'bg-yellow-500' : bid.status === 'accepted' ? 'bg-green-500' : 'bg-red-500'}>
                        {bid.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  {(bid.notes || (bid.attachments && bid.attachments.length > 0)) && (
                    <CardContent className="space-y-3">
                      {bid.notes && <p className="text-sm text-muted-foreground">{bid.notes}</p>}
                      
                      {bid.attachments && bid.attachments.length > 0 && (
                        <div>
                          <p className="text-sm font-medium mb-2 flex items-center gap-2">
                            <Paperclip className="h-4 w-4" />
                            Attachments ({bid.attachments.length})
                          </p>
                          <div className="space-y-1">
                            {bid.attachments.map((url: string, index: number) => (
                              <a
                                key={index}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-700 hover:underline"
                                data-testid={`link-attachment-${index}`}
                              >
                                <Paperclip className="h-3 w-3" />
                                Attachment {index + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="completed" className="space-y-4">
            {docsLoading ? (
              <div className="text-center py-8">Loading completed work...</div>
            ) : completionDocs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  No completed work yet
                </CardContent>
              </Card>
            ) : (
              completionDocs.map((doc: any) => (
                <Card key={doc.id} data-testid={`card-completion-${doc.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{doc.jobType === 'maintenance' ? 'Maintenance' : 'Turn Task'} Completed</CardTitle>
                        <CardDescription>Submitted {new Date(doc.submittedAt).toLocaleDateString()}</CardDescription>
                      </div>
                      <Badge className="bg-green-500">Completed</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {doc.notes && <p className="text-sm mb-2">{doc.notes}</p>}
                    {doc.invoiceUrl && (
                      <a href={doc.invoiceUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-500 hover:underline flex items-center gap-1">
                        <Upload className="h-4 w-4" />
                        View Invoice
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
