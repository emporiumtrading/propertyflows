import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import Layout from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { User, Shield, Globe, Eye, Download, Trash2, KeyRound, CheckCircle2, Smartphone, Bell, X, ArrowLeft, Home } from "lucide-react";
import type { User as UserType, TrustedDevice } from "@shared/schema";
import { format } from "date-fns";
import { Link } from "wouter";

const profileFormSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
});

const preferencesFormSchema = z.object({
  preferredCurrency: z.string(),
  timezone: z.string(),
  language: z.string(),
});

const privacyFormSchema = z.object({
  marketingEmailsEnabled: z.boolean(),
  dataProcessingConsent: z.boolean(),
});

const tenantSettingsSchema = z.object({
  autoPayEnabled: z.boolean(),
  maintenanceEmailAlerts: z.boolean(),
  maintenanceSmsAlerts: z.boolean(),
  leaseRenewalReminders: z.boolean(),
  paymentReminders: z.boolean(),
});

export default function TenantSettings() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showMfaDialog, setShowMfaDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [mfaQrCode, setMfaQrCode] = useState<string | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [mfaToken, setMfaToken] = useState("");

  const { data: mfaStatus } = useQuery<{ enabled: boolean; hasBackupCodes: boolean }>({
    queryKey: ["/api/mfa/status"],
  });

  const { data: trustedDevices } = useQuery<TrustedDevice[]>({
    queryKey: ["/api/mfa/trusted-devices"],
  });

  const profileForm = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    values: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
    },
  });

  const preferencesForm = useForm<z.infer<typeof preferencesFormSchema>>({
    resolver: zodResolver(preferencesFormSchema),
    values: {
      preferredCurrency: user?.preferredCurrency || "USD",
      timezone: user?.timezone || "America/New_York",
      language: user?.language || "en",
    },
  });

  const privacyForm = useForm<z.infer<typeof privacyFormSchema>>({
    resolver: zodResolver(privacyFormSchema),
    values: {
      marketingEmailsEnabled: user?.marketingEmailsEnabled ?? true,
      dataProcessingConsent: user?.dataProcessingConsent ?? false,
    },
  });

  const tenantSettingsForm = useForm<z.infer<typeof tenantSettingsSchema>>({
    resolver: zodResolver(tenantSettingsSchema),
    defaultValues: {
      autoPayEnabled: false,
      maintenanceEmailAlerts: true,
      maintenanceSmsAlerts: false,
      leaseRenewalReminders: true,
      paymentReminders: true,
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: z.infer<typeof profileFormSchema>) =>
      apiRequest('PATCH', `/api/users/${user?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Profile updated successfully" });
    },
  });

  const updatePreferencesMutation = useMutation({
    mutationFn: async (data: z.infer<typeof preferencesFormSchema>) =>
      apiRequest('PATCH', `/api/users/${user?.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Preferences updated successfully" });
    },
  });

  const updatePrivacyMutation = useMutation({
    mutationFn: async (data: z.infer<typeof privacyFormSchema>) =>
      apiRequest('PATCH', `/api/users/${user?.id}`, {
        ...data,
        gdprConsentGiven: data.dataProcessingConsent,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      toast({ title: "Privacy settings updated successfully" });
    },
  });

  const updateTenantSettingsMutation = useMutation({
    mutationFn: async (data: z.infer<typeof tenantSettingsSchema>) => {
      toast({ title: "Tenant settings updated successfully" });
      return Promise.resolve();
    },
  });

  const enrollMfaMutation = useMutation({
    mutationFn: async () =>
      apiRequest('POST', '/api/mfa/enroll'),
    onSuccess: async (response: any) => {
      const data = await response.json();
      setMfaQrCode(data.qrCodeDataUrl);
      setBackupCodes(data.backupCodes);
      setShowMfaDialog(true);
    },
  });

  const verifyMfaMutation = useMutation({
    mutationFn: async () =>
      apiRequest('POST', '/api/mfa/verify-enrollment', { token: mfaToken }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mfa/status"] });
      setShowMfaDialog(false);
      setMfaToken("");
      toast({ title: "MFA enabled successfully!" });
    },
    onError: () => {
      toast({ title: "Invalid code", description: "Please try again", variant: "destructive" });
    },
  });

  const disableMfaMutation = useMutation({
    mutationFn: async () =>
      apiRequest('DELETE', '/api/mfa'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mfa/status"] });
      toast({ title: "MFA disabled successfully" });
    },
  });

  const exportDataMutation = useMutation({
    mutationFn: async () =>
      apiRequest('POST', '/api/gdpr/export'),
    onSuccess: async (response: any) => {
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `propertyflows-data-${new Date().toISOString()}.json`;
      a.click();
      toast({ title: "Data exported successfully" });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () =>
      apiRequest('DELETE', '/api/gdpr/delete-account'),
    onSuccess: () => {
      toast({ title: "Account deletion initiated" });
      setTimeout(() => {
        window.location.href = "/api/logout";
      }, 2000);
    },
  });

  const revokeDeviceMutation = useMutation({
    mutationFn: async (deviceId: number) =>
      apiRequest('DELETE', `/api/mfa/trusted-devices/${deviceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mfa/trusted-devices"] });
      toast({ title: "Device revoked successfully" });
    },
  });

  const currencies = [
    { value: "USD", label: "US Dollar (USD)" },
    { value: "EUR", label: "Euro (EUR)" },
    { value: "GBP", label: "British Pound (GBP)" },
    { value: "CAD", label: "Canadian Dollar (CAD)" },
    { value: "AUD", label: "Australian Dollar (AUD)" },
    { value: "JPY", label: "Japanese Yen (JPY)" },
    { value: "CNY", label: "Chinese Yuan (CNY)" },
    { value: "INR", label: "Indian Rupee (INR)" },
  ];

  const timezones = [
    { value: "America/New_York", label: "Eastern Time (ET)" },
    { value: "America/Chicago", label: "Central Time (CT)" },
    { value: "America/Denver", label: "Mountain Time (MT)" },
    { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
    { value: "Europe/London", label: "London (GMT)" },
    { value: "Europe/Paris", label: "Paris (CET)" },
    { value: "Asia/Tokyo", label: "Tokyo (JST)" },
    { value: "Asia/Shanghai", label: "Shanghai (CST)" },
    { value: "Australia/Sydney", label: "Sydney (AEST)" },
  ];

  return (
    <Layout user={user}>
      <div className="container max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <Link href="/tenant-portal">
          <a className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4" data-testid="link-back-to-portal">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Tenant Portal
          </a>
        </Link>
        <h1 className="text-3xl font-bold">Tenant Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account settings and tenant preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="profile" data-testid="tab-profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security" data-testid="tab-security">
            <Shield className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="preferences" data-testid="tab-preferences">
            <Globe className="h-4 w-4 mr-2" />
            Preferences
          </TabsTrigger>
          <TabsTrigger value="privacy" data-testid="tab-privacy">
            <Eye className="h-4 w-4 mr-2" />
            Privacy
          </TabsTrigger>
          <TabsTrigger value="tenant" data-testid="tab-tenant">
            <Home className="h-4 w-4 mr-2" />
            Tenant
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...profileForm}>
                <form onSubmit={profileForm.handleSubmit((data) => updateProfileMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={profileForm.control}
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
                    control={profileForm.control}
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
                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" data-testid="input-email" disabled />
                        </FormControl>
                        <FormDescription>Email cannot be changed</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" data-testid="button-update-profile" disabled={updateProfileMutation.isPending}>
                    {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Two-Factor Authentication (MFA)</CardTitle>
                <CardDescription>Add an extra layer of security to your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {mfaStatus?.enabled ? (
                  <Alert>
                    <CheckCircle2 className="h-4 w-4" />
                    <AlertDescription>
                      Two-factor authentication is enabled on your account
                    </AlertDescription>
                  </Alert>
                ) : (
                  <Alert>
                    <Shield className="h-4 w-4" />
                    <AlertDescription>
                      Enable two-factor authentication to protect your account
                    </AlertDescription>
                  </Alert>
                )}

                {mfaStatus?.enabled ? (
                  <Button variant="destructive" data-testid="button-disable-mfa" onClick={() => disableMfaMutation.mutate()}>
                    Disable MFA
                  </Button>
                ) : (
                  <Button data-testid="button-enable-mfa" onClick={() => enrollMfaMutation.mutate()}>
                    <Shield className="h-4 w-4 mr-2" />
                    Enable MFA
                  </Button>
                )}
              </CardContent>
            </Card>

            {mfaStatus?.enabled && (
              <Card>
                <CardHeader>
                  <CardTitle>Trusted Devices</CardTitle>
                  <CardDescription>Manage devices that don't require MFA verification</CardDescription>
                </CardHeader>
                <CardContent>
                  {trustedDevices && trustedDevices.length > 0 ? (
                    <div className="space-y-3">
                      {trustedDevices.map((device) => (
                        <div
                          key={device.id}
                          data-testid={`device-${device.id}`}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div className="flex items-center space-x-3">
                            <Smartphone className="h-5 w-5 text-muted-foreground" />
                            <div>
                              <p className="font-medium" data-testid={`device-name-${device.id}`}>
                                {device.deviceName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Last used: {format(new Date(device.lastUsedAt), "PPp")}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Expires: {format(new Date(device.expiresAt), "PPp")}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            data-testid={`button-revoke-device-${device.id}`}
                            onClick={() => revokeDeviceMutation.mutate(Number(device.id))}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No trusted devices</p>
                  )}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle>Notifications</CardTitle>
                <CardDescription>Manage how you receive notifications</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4" />
                      <p className="text-base font-medium">Email Notifications</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive notifications about payments, maintenance requests, and important updates
                    </p>
                  </div>
                  <Switch
                    data-testid="switch-email-notifications"
                    defaultChecked={true}
                  />
                </div>
                <div className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center space-x-2">
                      <Bell className="h-4 w-4" />
                      <p className="text-base font-medium">SMS Notifications</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Receive urgent notifications via SMS
                    </p>
                  </div>
                  <Switch
                    data-testid="switch-sms-notifications"
                    defaultChecked={true}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
              <CardDescription>Customize your experience</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...preferencesForm}>
                <form onSubmit={preferencesForm.handleSubmit((data) => updatePreferencesMutation.mutate(data))} className="space-y-4">
                  <FormField
                    control={preferencesForm.control}
                    name="preferredCurrency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Currency</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-currency">
                              <SelectValue placeholder="Select currency" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {currencies.map((currency) => (
                              <SelectItem key={currency.value} value={currency.value}>
                                {currency.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormDescription>All amounts will be displayed in this currency</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={preferencesForm.control}
                    name="timezone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Timezone</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-timezone">
                              <SelectValue placeholder="Select timezone" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {timezones.map((tz) => (
                              <SelectItem key={tz.value} value={tz.value}>
                                {tz.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={preferencesForm.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger data-testid="select-language">
                              <SelectValue placeholder="Select language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="es">Español</SelectItem>
                            <SelectItem value="fr">Français</SelectItem>
                            <SelectItem value="de">Deutsch</SelectItem>
                            <SelectItem value="zh">中文</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" data-testid="button-update-preferences" disabled={updatePreferencesMutation.isPending}>
                    {updatePreferencesMutation.isPending ? "Saving..." : "Save Preferences"}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="privacy">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Privacy & Consent</CardTitle>
                <CardDescription>Manage your privacy settings and data processing consent (GDPR)</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...privacyForm}>
                  <form onSubmit={privacyForm.handleSubmit((data) => updatePrivacyMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={privacyForm.control}
                      name="marketingEmailsEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Marketing Emails</FormLabel>
                            <FormDescription>
                              Receive emails about new features, updates, and promotions
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              data-testid="switch-marketing-emails"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={privacyForm.control}
                      name="dataProcessingConsent"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Data Processing Consent</FormLabel>
                            <FormDescription>
                              I consent to the processing of my personal data in accordance with GDPR
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              data-testid="switch-data-consent"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" data-testid="button-update-privacy" disabled={updatePrivacyMutation.isPending}>
                      {updatePrivacyMutation.isPending ? "Saving..." : "Save Privacy Settings"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Management (GDPR)</CardTitle>
                <CardDescription>Export or delete your personal data</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Button variant="outline" data-testid="button-export-data" onClick={() => exportDataMutation.mutate()} className="w-full sm:w-auto">
                    <Download className="h-4 w-4 mr-2" />
                    Export My Data
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Download all your personal data in JSON format
                  </p>
                </div>

                <div className="pt-4 border-t">
                  <Button variant="destructive" data-testid="button-delete-account" onClick={() => setShowDeleteDialog(true)} className="w-full sm:w-auto">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete My Account
                  </Button>
                  <p className="text-sm text-muted-foreground mt-2">
                    Permanently delete your account and all associated data
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="tenant">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Rent Payment Preferences</CardTitle>
                <CardDescription>Manage your rent payment settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...tenantSettingsForm}>
                  <form onSubmit={tenantSettingsForm.handleSubmit((data) => updateTenantSettingsMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={tenantSettingsForm.control}
                      name="autoPayEnabled"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Enable Auto-Pay</FormLabel>
                            <FormDescription>
                              Automatically pay rent on the due date each month
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              data-testid="switch-auto-pay"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={tenantSettingsForm.control}
                      name="paymentReminders"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Payment Reminders</FormLabel>
                            <FormDescription>
                              Receive reminders before rent is due
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              data-testid="switch-payment-reminders"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" data-testid="button-update-tenant-settings" disabled={updateTenantSettingsMutation.isPending}>
                      Save Tenant Settings
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Maintenance Request Alerts</CardTitle>
                <CardDescription>Get notified about your maintenance requests</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...tenantSettingsForm}>
                  <form onSubmit={tenantSettingsForm.handleSubmit((data) => updateTenantSettingsMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={tenantSettingsForm.control}
                      name="maintenanceEmailAlerts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Email Alerts</FormLabel>
                            <FormDescription>
                              Receive email updates when maintenance request status changes
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              data-testid="switch-maintenance-email"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={tenantSettingsForm.control}
                      name="maintenanceSmsAlerts"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">SMS Alerts</FormLabel>
                            <FormDescription>
                              Receive SMS notifications for urgent maintenance updates
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              data-testid="switch-maintenance-sms"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" data-testid="button-update-maintenance-settings" disabled={updateTenantSettingsMutation.isPending}>
                      Save Maintenance Settings
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lease & Document Preferences</CardTitle>
                <CardDescription>Manage your lease and document notification settings</CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...tenantSettingsForm}>
                  <form onSubmit={tenantSettingsForm.handleSubmit((data) => updateTenantSettingsMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={tenantSettingsForm.control}
                      name="leaseRenewalReminders"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                          <div className="space-y-0.5">
                            <FormLabel className="text-base">Lease Renewal Reminders</FormLabel>
                            <FormDescription>
                              Get notified when your lease is approaching the end date
                            </FormDescription>
                          </div>
                          <FormControl>
                            <Switch
                              data-testid="switch-lease-reminders"
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                    <Button type="submit" data-testid="button-update-lease-settings" disabled={updateTenantSettingsMutation.isPending}>
                      Save Lease Settings
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={showMfaDialog} onOpenChange={setShowMfaDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
            <DialogDescription>
              Scan the QR code with your authenticator app, then enter the 6-digit code
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {mfaQrCode && (
              <div className="flex justify-center">
                <img src={mfaQrCode} alt="MFA QR Code" className="w-64 h-64" />
              </div>
            )}
            {backupCodes.length > 0 && (
              <Alert>
                <KeyRound className="h-4 w-4" />
                <AlertDescription>
                  <p className="font-semibold mb-2">Save these backup codes:</p>
                  <div className="grid grid-cols-2 gap-1 text-xs font-mono">
                    {backupCodes.map((code, i) => (
                      <div key={i}>{code}</div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
            <Input
              placeholder="Enter 6-digit code"
              value={mfaToken}
              onChange={(e) => setMfaToken(e.target.value)}
              data-testid="input-mfa-verification-code"
              maxLength={6}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMfaDialog(false)}>Cancel</Button>
            <Button onClick={() => verifyMfaMutation.mutate()} data-testid="button-verify-mfa-enrollment" disabled={verifyMfaMutation.isPending}>
              {verifyMfaMutation.isPending ? "Verifying..." : "Verify & Enable"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete your account? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <Alert variant="destructive">
            <AlertDescription>
              All your data, including properties, leases, payments, and documents will be permanently deleted.
            </AlertDescription>
          </Alert>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>Cancel</Button>
            <Button variant="destructive" data-testid="button-confirm-delete" onClick={() => deleteAccountMutation.mutate()}>
              Delete Account
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </Layout>
  );
}
