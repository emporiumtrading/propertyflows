import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Building2, Home, CreditCard, Users, CheckCircle2, ArrowRight, ArrowLeft, PartyPopper } from "lucide-react";
import { insertPropertySchema, insertUnitSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

type OnboardingStep = 'welcome' | 'add_property' | 'add_units' | 'setup_payments' | 'invite_team' | 'complete';

interface OnboardingProgress {
  id: string;
  userId: string;
  currentStep: OnboardingStep;
  completedSteps: OnboardingStep[];
  skipped: boolean;
  completed: boolean;
  completedAt: Date | null;
}

const propertyFormSchema = insertPropertySchema.pick({
  name: true,
  address: true,
  city: true,
  state: true,
  zipCode: true,
  propertyType: true,
  totalUnits: true,
});

const unitFormSchema = insertUnitSchema.pick({
  unitNumber: true,
  bedrooms: true,
  bathrooms: true,
  squareFeet: true,
  monthlyRent: true,
});

const inviteFormSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(['tenant', 'landlord', 'vendor']),
});

export function OnboardingWizard() {
  const [,navigate] = useLocation();
  const { toast } = useToast();
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);

  const { data: progress, isLoading } = useQuery<OnboardingProgress & { createdPropertyId?: string }>({
    queryKey: ['/api/onboarding'],
  });

  useEffect(() => {
    if (progress?.createdPropertyId) {
      setCreatedPropertyId(progress.createdPropertyId);
    }
  }, [progress]);

  const updateProgressMutation = useMutation({
    mutationFn: async (data: Partial<OnboardingProgress>) =>
      apiRequest('/api/onboarding', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/onboarding'] });
    },
  });

  const createPropertyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof propertyFormSchema>) =>
      apiRequest('/api/properties', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: (data: any) => {
      setCreatedPropertyId(data.id);
      toast({
        title: "Property created!",
        description: "Your property has been added successfully.",
      });
      goToNextStep();
    },
  });

  const createUnitMutation = useMutation({
    mutationFn: async (data: z.infer<typeof unitFormSchema> & { propertyId: string }) =>
      apiRequest('/api/units', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Unit added!",
        description: "Your unit has been added to the property.",
      });
    },
  });

  const sendInviteMutation = useMutation({
    mutationFn: async (data: z.infer<typeof inviteFormSchema>) =>
      apiRequest('/api/invitations', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Invitation sent!",
        description: "An invitation email has been sent.",
      });
    },
  });

  const currentStep = progress?.currentStep || 'welcome';
  const completedSteps = progress?.completedSteps || [];

  const steps: { id: OnboardingStep; title: string; description: string }[] = [
    { id: 'welcome', title: 'Welcome', description: 'Get started with PropertyFlows' },
    { id: 'add_property', title: 'Add Property', description: 'Add your first property' },
    { id: 'add_units', title: 'Add Units', description: 'Create units in your property' },
    { id: 'setup_payments', title: 'Setup Payments', description: 'Configure payment processing' },
    { id: 'invite_team', title: 'Invite Team', description: 'Invite tenants and staff' },
    { id: 'complete', title: 'Complete', description: 'You\'re all set!' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);
  const progressPercent = ((currentStepIndex + 1) / steps.length) * 100;

  const goToNextStep = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      const nextStep = steps[nextIndex].id;
      updateProgressMutation.mutate({
        currentStep: nextStep,
        completedSteps: [...completedSteps, currentStep],
      });
    }
  };

  const goToPreviousStep = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      updateProgressMutation.mutate({
        currentStep: steps[prevIndex].id,
      });
    }
  };

  const skipOnboarding = () => {
    updateProgressMutation.mutate({
      skipped: true,
      completed: true,
    });
    navigate('/');
  };

  const completeOnboarding = () => {
    updateProgressMutation.mutate({
      currentStep: 'complete',
      completed: true,
      completedSteps: [...completedSteps, currentStep],
    });
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  if (progress?.completed && !progress?.skipped) {
    return null;
  }

  return (
    <div className="min-h-screen bg-muted/30 p-6 flex items-center justify-center">
      <Card className="w-full max-w-3xl">
        <CardHeader>
          <div className="flex items-center justify-between mb-4">
            <CardTitle className="text-2xl">PropertyFlows Setup</CardTitle>
            <Button variant="ghost" size="sm" onClick={skipOnboarding} data-testid="button-skip-onboarding">
              Skip for now
            </Button>
          </div>
          <Progress value={progressPercent} className="mb-2" data-testid="progress-onboarding" />
          <CardDescription>
            Step {currentStepIndex + 1} of {steps.length}: {steps[currentStepIndex].description}
          </CardDescription>
        </CardHeader>

        <CardContent className="min-h-[400px]">
          {currentStep === 'welcome' && <WelcomeStep onNext={goToNextStep} />}
          {currentStep === 'add_property' && (
            <AddPropertyStep 
              onNext={goToNextStep} 
              mutation={createPropertyMutation}
            />
          )}
          {currentStep === 'add_units' && (
            <AddUnitsStep 
              onNext={goToNextStep}
              propertyId={createdPropertyId}
              mutation={createUnitMutation}
            />
          )}
          {currentStep === 'setup_payments' && <SetupPaymentsStep onNext={goToNextStep} />}
          {currentStep === 'invite_team' && (
            <InviteTeamStep 
              onNext={completeOnboarding}
              mutation={sendInviteMutation}
            />
          )}
          {currentStep === 'complete' && <CompleteStep onFinish={() => navigate('/')} />}
        </CardContent>

        <CardFooter className="flex justify-between">
          <Button
            variant="outline"
            onClick={goToPreviousStep}
            disabled={currentStepIndex === 0 || currentStep === 'complete'}
            data-testid="button-previous-step"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <div className="flex gap-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`w-2 h-2 rounded-full ${
                  index <= currentStepIndex ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
                data-testid={`step-indicator-${index}`}
              />
            ))}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 py-8">
      <div className="p-4 bg-primary/10 rounded-full">
        <Building2 className="w-12 h-12 text-primary" />
      </div>
      <div>
        <h2 className="text-3xl font-bold mb-2">Welcome to PropertyFlows!</h2>
        <p className="text-muted-foreground max-w-md">
          Let's get you set up in just 5 minutes. We'll walk you through adding your first property,
          creating units, and inviting your team.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-4 w-full max-w-md text-left">
        <div className="p-4 border rounded-lg">
          <CheckCircle2 className="w-6 h-6 text-green-500 mb-2" />
          <h3 className="font-semibold">Easy Setup</h3>
          <p className="text-sm text-muted-foreground">Quick and intuitive onboarding</p>
        </div>
        <div className="p-4 border rounded-lg">
          <CheckCircle2 className="w-6 h-6 text-green-500 mb-2" />
          <h3 className="font-semibold">Powerful Tools</h3>
          <p className="text-sm text-muted-foreground">AI-powered property management</p>
        </div>
      </div>
      <Button size="lg" onClick={onNext} className="w-full max-w-md" data-testid="button-get-started">
        Get Started
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}

function AddPropertyStep({ onNext, mutation }: { onNext: () => void; mutation: any }) {
  const form = useForm({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      name: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      propertyType: "residential_multi_family" as const,
      totalUnits: 1,
    },
  });

  const onSubmit = (data: z.infer<typeof propertyFormSchema>) => {
    mutation.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Home className="w-8 h-8 text-primary" />
        <div>
          <h3 className="text-xl font-semibold">Add Your First Property</h3>
          <p className="text-sm text-muted-foreground">Enter the details of your property</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Property Name</FormLabel>
                <FormControl>
                  <Input placeholder="Sunset Apartments" {...field} data-testid="input-property-name" />
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
                <FormLabel>Street Address</FormLabel>
                <FormControl>
                  <Input placeholder="123 Main St" {...field} data-testid="input-property-address" />
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
                    <Input placeholder="San Francisco" {...field} data-testid="input-property-city" />
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
                    <Input placeholder="CA" {...field} data-testid="input-property-state" />
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
                    <Input placeholder="94102" {...field} data-testid="input-property-zip" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="propertyType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Property Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-property-type">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="residential_multi_family">Multi-Family Residential</SelectItem>
                      <SelectItem value="residential_single_family">Single-Family Residential</SelectItem>
                      <SelectItem value="commercial">Commercial</SelectItem>
                      <SelectItem value="mixed_use">Mixed Use</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="totalUnits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Total Units</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      data-testid="input-total-units"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={mutation.isPending}
            data-testid="button-create-property"
          >
            {mutation.isPending ? "Creating..." : "Create Property"}
          </Button>
        </form>
      </Form>
    </div>
  );
}

function AddUnitsStep({ onNext, propertyId, mutation }: { onNext: () => void; propertyId: string | null; mutation: any }) {
  const [unitsAdded, setUnitsAdded] = useState(0);
  const form = useForm({
    resolver: zodResolver(unitFormSchema),
    defaultValues: {
      unitNumber: "",
      bedrooms: 1,
      bathrooms: "1",
      squareFeet: 800,
      monthlyRent: "1500",
    },
  });

  const onSubmit = (data: z.infer<typeof unitFormSchema>) => {
    if (!propertyId) return;
    mutation.mutate({ ...data, propertyId }, {
      onSuccess: () => {
        setUnitsAdded(prev => prev + 1);
        form.reset();
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Building2 className="w-8 h-8 text-primary" />
          <div>
            <h3 className="text-xl font-semibold">Add Units to Your Property</h3>
            <p className="text-sm text-muted-foreground">Create at least one unit to continue</p>
          </div>
        </div>
        <div className="text-sm font-medium">
          {unitsAdded} unit{unitsAdded !== 1 ? 's' : ''} added
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="unitNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Unit Number</FormLabel>
                  <FormControl>
                    <Input placeholder="101" {...field} data-testid="input-unit-number" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="monthlyRent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Monthly Rent</FormLabel>
                  <FormControl>
                    <Input placeholder="1500" {...field} data-testid="input-monthly-rent" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="bedrooms"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bedrooms</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      data-testid="input-bedrooms"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="squareFeet"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Square Feet</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                      data-testid="input-square-feet"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              variant="outline"
              disabled={mutation.isPending || !propertyId}
              className="flex-1"
              data-testid="button-add-another-unit"
            >
              {mutation.isPending ? "Adding..." : "Add Unit"}
            </Button>
            <Button
              type="button"
              onClick={onNext}
              disabled={unitsAdded === 0}
              className="flex-1"
              data-testid="button-continue-to-payments"
            >
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function SetupPaymentsStep({ onNext }: { onNext: () => void }) {
  const [setupLater, setSetupLater] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CreditCard className="w-8 h-8 text-primary" />
        <div>
          <h3 className="text-xl font-semibold">Setup Payment Processing</h3>
          <p className="text-sm text-muted-foreground">Connect Stripe to accept rent payments</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="p-6 border rounded-lg space-y-4">
          <h4 className="font-semibold">Stripe Connect</h4>
          <p className="text-sm text-muted-foreground">
            Accept ACH (free), debit cards (2.9% + $0.30), and credit cards (2.9% + $0.30).
            Get instant payouts with Stripe Connect.
          </p>
          <div className="flex gap-2">
            <Button className="flex-1" onClick={() => window.location.href = '/payouts'} data-testid="button-connect-stripe">
              Connect Stripe Now
            </Button>
            <Button variant="outline" onClick={() => setSetupLater(true)} data-testid="button-setup-later">
              Setup Later
            </Button>
          </div>
        </div>

        {setupLater && (
          <Button className="w-full" onClick={onNext} data-testid="button-skip-payments">
            Continue Without Payment Setup
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

function InviteTeamStep({ onNext, mutation }: { onNext: () => void; mutation: any }) {
  const [invitesSent, setInvitesSent] = useState(0);
  const form = useForm({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      role: "tenant" as const,
    },
  });

  const onSubmit = (data: z.infer<typeof inviteFormSchema>) => {
    mutation.mutate(data, {
      onSuccess: () => {
        setInvitesSent(prev => prev + 1);
        form.reset();
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Users className="w-8 h-8 text-primary" />
          <div>
            <h3 className="text-xl font-semibold">Invite Your Team</h3>
            <p className="text-sm text-muted-foreground">Invite tenants, landlords, or vendors</p>
          </div>
        </div>
        <div className="text-sm font-medium">
          {invitesSent} invitation{invitesSent !== 1 ? 's' : ''} sent
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <Input placeholder="tenant@example.com" {...field} data-testid="input-invite-email" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-invite-role">
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="tenant">Tenant</SelectItem>
                      <SelectItem value="landlord">Landlord</SelectItem>
                      <SelectItem value="vendor">Vendor</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex gap-2">
            <Button
              type="submit"
              variant="outline"
              disabled={mutation.isPending}
              className="flex-1"
              data-testid="button-send-invitation"
            >
              {mutation.isPending ? "Sending..." : "Send Invitation"}
            </Button>
            <Button
              type="button"
              onClick={onNext}
              className="flex-1"
              data-testid="button-finish-onboarding"
            >
              Finish Setup
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}

function CompleteStep({ onFinish }: { onFinish: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-6 py-8">
      <div className="p-4 bg-green-500/10 rounded-full">
        <PartyPopper className="w-12 h-12 text-green-500" />
      </div>
      <div>
        <h2 className="text-3xl font-bold mb-2">You're All Set!</h2>
        <p className="text-muted-foreground max-w-md">
          Congratulations! Your PropertyFlows account is ready. Start managing your properties with ease.
        </p>
      </div>
      <div className="grid grid-cols-3 gap-4 w-full max-w-2xl text-left">
        <div className="p-4 border rounded-lg">
          <Building2 className="w-6 h-6 text-primary mb-2" />
          <h4 className="font-semibold text-sm">Properties</h4>
          <p className="text-xs text-muted-foreground">Manage all properties</p>
        </div>
        <div className="p-4 border rounded-lg">
          <Users className="w-6 h-6 text-primary mb-2" />
          <h4 className="font-semibold text-sm">Tenants</h4>
          <p className="text-xs text-muted-foreground">Track tenant info</p>
        </div>
        <div className="p-4 border rounded-lg">
          <CreditCard className="w-6 h-6 text-primary mb-2" />
          <h4 className="font-semibold text-sm">Payments</h4>
          <p className="text-xs text-muted-foreground">Collect rent online</p>
        </div>
      </div>
      <Button size="lg" onClick={onFinish} className="w-full max-w-md" data-testid="button-go-to-dashboard">
        Go to Dashboard
        <ArrowRight className="w-4 h-4 ml-2" />
      </Button>
    </div>
  );
}
