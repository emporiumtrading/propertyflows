import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Wrench, DollarSign, FileCheck, Calendar } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import VendorSidebar from "@/components/VendorSidebar";
import Header from "@/components/Header";

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

export default function VendorJobs() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [bidDialogOpen, setBidDialogOpen] = useState(false);
  const [completionDialogOpen, setCompletionDialogOpen] = useState(false);

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['/api/vendor-jobs'],
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
      const response = await fetch('/api/vendor-bids', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to submit bid');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-bids'] });
      setBidDialogOpen(false);
      bidForm.reset();
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
      const response = await fetch('/api/work-completion-docs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to submit completion docs');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/work-completion-docs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/vendor-jobs'] });
      setCompletionDialogOpen(false);
      completionForm.reset();
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
    const colors: Record<string, string> = {
      open: 'bg-yellow-500',
      in_progress: 'bg-blue-500',
      completed: 'bg-green-500',
      pending: 'bg-orange-500',
    };
    return colors[status] || 'bg-gray-500';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      urgent: 'bg-red-500',
      high: 'bg-orange-500',
      medium: 'bg-yellow-500',
      low: 'bg-green-500',
    };
    return colors[priority] || 'bg-gray-500';
  };

  if (isLoading) {
    return (
      <div className="flex h-screen overflow-hidden">
        <VendorSidebar />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground" data-testid="text-loading">Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <VendorSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          title="My Jobs" 
          subtitle="View and manage your assigned work orders"
          user={user}
        />

        <main className="flex-1 overflow-y-auto p-6 bg-muted/30">
          {(jobs as any[]).length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Wrench className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground" data-testid="text-no-jobs">No jobs assigned yet</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {(jobs as any[]).map((job: any) => (
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
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
