import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Building2, Shield, CheckCircle2, Sparkles } from "lucide-react";
import { useState } from "react";

const registerBusinessSchema = z.object({
  businessName: z.string().min(2, "Business name must be at least 2 characters"),
  businessEmail: z.string().email("Invalid email address"),
  businessPhone: z.string().min(10, "Phone number must be at least 10 digits"),
  businessAddress: z.string().min(10, "Address must be at least 10 characters"),
  businessLicense: z.string().min(5, "Business license number is required"),
  taxId: z.string().min(9, "Tax ID (EIN) is required"),
  contactName: z.string().min(2, "Contact name is required"),
  website: z.string().url("Invalid website URL").optional().or(z.literal("")),
});

type RegisterBusinessForm = z.infer<typeof registerBusinessSchema>;

export default function RegisterBusiness() {
  const { toast } = useToast();
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'approved' | 'manual_review' | null>(null);
  const [organizationId, setOrganizationId] = useState<string | null>(null);

  const form = useForm<RegisterBusinessForm>({
    resolver: zodResolver(registerBusinessSchema),
    defaultValues: {
      businessName: "",
      businessEmail: "",
      businessPhone: "",
      businessAddress: "",
      businessLicense: "",
      taxId: "",
      contactName: "",
      website: "",
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterBusinessForm) => {
      const response = await apiRequest("POST", "/api/organizations/register", data);
      return response.json();
    },
    onSuccess: (data: any) => {
      setRegistrationComplete(true);
      setVerificationStatus(data.verificationStatus);
      setOrganizationId(data.organization?.id || null);
      
      if (data.verificationStatus === 'approved') {
        toast({
          title: "Registration Approved! 🎉",
          description: "Your business has been verified. You can now start your trial.",
        });
      } else if (data.verificationStatus === 'manual_review') {
        toast({
          title: "Under Review",
          description: "Your application is being manually reviewed. We'll contact you within 24-48 hours.",
        });
      } else {
        toast({
          title: "Registration Submitted",
          description: "Your business registration is pending verification.",
        });
      }
    },
    onError: (error: any) => {
      let description = "Please check your information and try again.";
      
      if (error.message) {
        const match = error.message.match(/400: ({.*})/);
        if (match) {
          try {
            const errorData = JSON.parse(match[1]);
            description = errorData.message || errorData.details?.join(', ') || description;
          } catch {
            description = error.message;
          }
        } else {
          description = error.message;
        }
      }
      
      toast({
        title: "Registration Failed",
        description,
        variant: "destructive",
      });
    },
  });

  const activateTrialMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) throw new Error("Organization ID not found");
      const response = await apiRequest("POST", `/api/organizations/${organizationId}/activate-trial`, {
        planType: 'starter',
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Trial Activated! 🎉",
        description: "Your 14-day free trial has started. Redirecting to login...",
      });
      setTimeout(() => {
        window.location.href = '/api/login';
      }, 2000);
    },
    onError: (error: any) => {
      toast({
        title: "Activation Failed",
        description: error.message || "Failed to activate trial. Please try again or contact support.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterBusinessForm) => {
    registerMutation.mutate(data);
  };

  if (registrationComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardHeader className="text-center">
            {verificationStatus === 'approved' ? (
              <>
                <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <CardTitle className="text-3xl">Business Verified! 🎉</CardTitle>
                <CardDescription className="text-lg">
                  Congratulations! Your business has been verified and approved.
                </CardDescription>
              </>
            ) : verificationStatus === 'manual_review' ? (
              <>
                <Shield className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                <CardTitle className="text-3xl">Under Review</CardTitle>
                <CardDescription className="text-lg">
                  Your application requires manual verification by our team.
                </CardDescription>
              </>
            ) : (
              <>
                <Shield className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                <CardTitle className="text-3xl">Registration Submitted</CardTitle>
                <CardDescription className="text-lg">
                  We're verifying your business information.
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">What happens next?</h3>
              <ul className="space-y-2 text-sm">
                {verificationStatus === 'approved' ? (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Your business has been verified</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>You can now activate your trial and start using PropertyFlows</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span>Check your email for next steps</span>
                    </li>
                  </>
                ) : (
                  <>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>We'll verify your business license and tax ID</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>You'll receive an email within 24-48 hours</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                      <span>Once approved, you can start your free trial</span>
                    </li>
                  </>
                )}
              </ul>
            </div>
            
            <div className="flex gap-3 justify-center pt-4">
              {verificationStatus === 'approved' && organizationId ? (
                <>
                  <Button 
                    onClick={() => activateTrialMutation.mutate()}
                    disabled={activateTrialMutation.isPending}
                    className="flex items-center gap-2"
                    data-testid="button-activate-trial"
                  >
                    <Sparkles className="w-4 h-4" />
                    {activateTrialMutation.isPending ? "Activating..." : "Activate 14-Day Free Trial"}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => window.location.href = '/'} 
                    data-testid="button-return-home"
                  >
                    Return to Home
                  </Button>
                </>
              ) : (
                <Button 
                  onClick={() => window.location.href = '/'} 
                  data-testid="button-return-home"
                >
                  Return to Home
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3 mb-2">
            <Building2 className="w-8 h-8 text-primary" />
            <CardTitle className="text-3xl">Register Your Business</CardTitle>
          </div>
          <CardDescription className="text-base">
            Join PropertyFlows to streamline your property management operations.
            Complete verification to unlock your 14-day free trial.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Business Information</h3>
                
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="ABC Property Management LLC" {...field} data-testid="input-business-name" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="businessEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Email *</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="contact@business.com" {...field} data-testid="input-business-email" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="businessPhone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Phone *</FormLabel>
                        <FormControl>
                          <Input placeholder="+1 (555) 123-4567" {...field} data-testid="input-business-phone" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="businessAddress"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Address *</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="123 Main Street, Suite 100, City, State, ZIP" 
                          {...field} 
                          data-testid="input-business-address"
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Verification Details</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="businessLicense"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business License Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="BL-123456789" {...field} data-testid="input-business-license" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="taxId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tax ID (EIN) *</FormLabel>
                        <FormControl>
                          <Input placeholder="12-3456789" {...field} data-testid="input-tax-id" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Contact Information</h3>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="contactName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Primary Contact Name *</FormLabel>
                        <FormControl>
                          <Input placeholder="John Doe" {...field} data-testid="input-contact-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://www.business.com" {...field} data-testid="input-website" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg">
                <div className="flex gap-2">
                  <Shield className="w-5 h-5 text-amber-600 dark:text-amber-500 flex-shrink-0" />
                  <div className="text-sm">
                    <p className="font-semibold text-amber-900 dark:text-amber-100">Verification Process</p>
                    <p className="text-amber-800 dark:text-amber-200">
                      We verify all businesses to maintain platform integrity. Your information will be validated
                      against public business records. Most applications are approved within 24-48 hours.
                    </p>
                  </div>
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                size="lg"
                disabled={registerMutation.isPending}
                data-testid="button-submit-registration"
              >
                {registerMutation.isPending ? "Submitting..." : "Submit Registration"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
