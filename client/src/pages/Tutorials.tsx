import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { BookOpen, Building2, TrendingUp, Users, Wrench, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";

export default function Tutorials() {
  const { user } = useAuth();
  const tutorials = {
    propertyManagers: [
      {
        title: "Getting Started with PropertyFlows",
        duration: "10 minutes",
        description: "Complete walkthrough of setting up your property management account, adding properties and units",
        steps: [
          "Navigate to the Properties page from the sidebar",
          "Click 'Add Property' button in the top right",
          "Enter property name (e.g., 'Sunset Apartments') and full address",
          "Save the property and you'll be redirected to the property details page",
          "Click 'Add Unit' to create your first unit",
          "Fill in unit number, rent amount, and unit type (bedroom count)",
          "Repeat for all units in your property",
          "Your property is now ready for tenants!"
        ],
      },
      {
        title: "Managing Tenants & Leases",
        duration: "8 minutes",
        description: "Learn how to invite tenants, create leases, and manage renewals",
        steps: [
          "Go to the Tenants page from the sidebar",
          "Click 'Invite Tenant' and enter their email address",
          "The tenant will receive an invitation link to create their account",
          "Once they've registered, go to the Leases page",
          "Click 'Create Lease' to start a new lease agreement",
          "Select the unit and tenant from the dropdowns",
          "Enter rent amount, security deposit, and lease start/end dates",
          "Add any special terms or conditions in the notes field",
          "Click 'Send for E-Signature' to get the lease signed digitally",
          "Track lease status from the Leases dashboard"
        ],
      },
      {
        title: "Maintenance Workflow & AI Triage",
        duration: "12 minutes",
        description: "Master the maintenance request system, AI-powered triage, and vendor management",
        steps: [
          "Access the Maintenance page to view all requests",
          "New requests are automatically analyzed by AI for urgency and cost",
          "Review the AI classification (Routine, Urgent, or Emergency)",
          "Check the AI-estimated cost range for budgeting",
          "Decide whether to assign to a vendor or handle in-house",
          "Use the vendor assignment dropdown to select a qualified vendor",
          "Vendors will receive notifications and can submit bids",
          "Review vendor bids in the request details",
          "Approve a bid and the vendor receives work authorization",
          "Track progress and mark complete when work is done"
        ],
      },
      {
        title: "Payment Processing & Collections",
        duration: "9 minutes",
        description: "Set up payment methods, process rent, and manage delinquency workflows",
        steps: [
          "Navigate to the Payments page to view all transactions",
          "Your Stripe integration is automatically configured for ACH and cards",
          "Tenants can pay through their portal with transparent fees shown",
          "Set up payment plans for tenants who need installments",
          "Configure delinquency playbooks for automated late rent handling",
          "The system automatically sends reminders 3 days before due date",
          "Late payments trigger escalating actions (reminder, notice, fee)",
          "View payment history and filter by status or tenant",
          "Export payment reports for accounting purposes",
          "Track overall collection rates on the dashboard"
        ],
      },
      {
        title: "QuickBooks Integration",
        duration: "7 minutes",
        description: "Connect QuickBooks, map accounts, and sync transactions automatically",
        steps: [
          "Go to the Integrations page from the sidebar",
          "Find QuickBooks in the accounting section",
          "Click 'Connect QuickBooks' to start OAuth authorization",
          "Sign in to your QuickBooks account and grant access",
          "You'll be redirected back to PropertyFlows",
          "Map your PropertyFlows accounts to QuickBooks accounts",
          "Configure which transaction types to sync automatically",
          "Click 'Start Sync' to push your rental data to QuickBooks",
          "Future transactions will sync automatically",
          "View sync status and logs in the integration settings"
        ],
      },
      {
        title: "Data Import & Export",
        duration: "8 minutes",
        description: "Bulk import properties, units, tenants, and leases from CSV/Excel files",
        steps: [
          "Navigate to Data Management from the sidebar",
          "Select the import type (Properties, Units, Tenants, or Leases)",
          "Click 'Download Template' to get the correct CSV format",
          "Open the template in Excel or Google Sheets",
          "Fill in your data following the column headers",
          "Save the file as CSV format",
          "Upload your CSV file using the drag-and-drop zone",
          "Review validation results - green checkmarks are good, red X's need fixing",
          "Fix any errors shown in the validation report",
          "Click 'Import Records' to complete the bulk import",
          "Your data is now in PropertyFlows!"
        ],
      },
      {
        title: "Listing Syndication Setup",
        duration: "10 minutes",
        description: "Configure Zillow, Trulia, and HotPads syndication for vacant units",
        steps: [
          "Go to the Units page and find a vacant unit",
          "Click on the unit to view details",
          "Scroll to the 'Listing Syndication' section",
          "Toggle on the platforms you want (Zillow, Trulia, HotPads)",
          "Upload high-quality photos of the unit",
          "Write a compelling description highlighting amenities",
          "Set showing preferences and contact information",
          "Click 'Preview Listing' to see how it will appear",
          "Click 'Publish to Selected Platforms' to go live",
          "Your listing will appear on all selected sites within 24 hours",
          "Track views and inquiries from the syndication dashboard"
        ],
      },
    ],
    propertyOwners: [
      {
        title: "Owner Portal Overview",
        duration: "6 minutes",
        description: "Navigate your owner portal and understand key features available to you",
        steps: [
          "Log in to your owner portal at PropertyFlows",
          "The dashboard shows your complete portfolio at a glance",
          "View total properties, units, occupancy rate, and income",
          "Check the monthly income chart for financial trends",
          "Review the property performance table for each asset",
          "See upcoming lease renewals to plan ahead",
          "Access financial reports from the sidebar menu",
          "Use quick actions to navigate to key features",
          "Your property manager handles day-to-day operations",
          "You maintain full visibility into everything"
        ],
      },
      {
        title: "Viewing Financial Reports",
        duration: "8 minutes",
        description: "Access income statements, expense reports, and property performance metrics",
        steps: [
          "Navigate to the Accounting page from sidebar",
          "Click on 'Financial Statements' tab",
          "Select report type: Income Statement, Balance Sheet, or Cash Flow",
          "Choose your date range (Last Month, Last Quarter, Last Year, Custom)",
          "View detailed revenue breakdown by property",
          "Analyze expense categories in the pie chart",
          "Compare period-over-period performance",
          "Click 'Export to PDF' for printable reports",
          "Click 'Export to Excel' for detailed analysis",
          "Schedule automated monthly report emails"
        ],
      },
      {
        title: "Instant Payouts with Stripe",
        duration: "5 minutes",
        description: "Set up Stripe Connect and request instant payouts of your rental income",
        steps: [
          "Go to the Payout Dashboard from the sidebar",
          "Click 'Connect Stripe Account' to begin setup",
          "Fill in your business information in the Stripe form",
          "Enter your bank account details for payouts",
          "Complete identity verification (ID upload)",
          "Wait for Stripe to verify your account (usually 1-2 business days)",
          "Once verified, you'll see your available balance",
          "Click 'Request Instant Payout' to get funds immediately",
          "Standard payout is free (1-2 days)",
          "Instant payout has a small fee but arrives in minutes"
        ],
      },
      {
        title: "Understanding Your Dashboard",
        duration: "7 minutes",
        description: "Monitor occupancy rates, rental income trends, and upcoming lease renewals",
        steps: [
          "Your dashboard is the first page you see after login",
          "Top KPI cards show: Properties, Units, Occupancy, Monthly Revenue",
          "The occupancy gauge shows percentage of occupied units",
          "Income trend chart displays last 12 months of rental income",
          "Green upward arrows indicate growth, red downward show decline",
          "Upcoming renewals section shows leases expiring soon",
          "Property ROI cards calculate your return on investment",
          "Maintenance cost tracking keeps expenses in check",
          "Click on any metric to drill down into details",
          "Use date filters to customize reporting periods"
        ],
      },
    ],
    tenants: [
      {
        title: "Tenant Portal Basics",
        duration: "5 minutes",
        description: "Learn how to navigate your tenant portal and access important features",
        steps: [
          "Log in to your tenant portal using the invitation link",
          "Your dashboard shows lease details, rent due, and quick actions",
          "View your current lease information including rent amount and lease dates",
          "Click 'Pay Rent' to make your monthly payment",
          "Submit maintenance requests directly from your portal",
          "Access and download your signed lease PDF anytime",
          "Update your contact information in profile settings",
          "Configure notification preferences for rent reminders",
          "All communication with your landlord happens here",
          "Check your payment history and receipts"
        ],
      },
      {
        title: "Paying Rent Online",
        duration: "7 minutes",
        description: "Complete guide to paying rent via ACH, debit, or credit card, plus setting up payment plans",
        steps: [
          "Click 'Pay Rent' from your tenant dashboard",
          "You'll see the amount due and due date prominently displayed",
          "Choose your payment method: ACH (free), Debit Card (low fee), or Credit Card",
          "For ACH: Enter your bank routing and account numbers",
          "For cards: Enter card number, expiration, and CVV",
          "All fees are shown upfront before you confirm",
          "ACH is free, debit card is 2.9% + $0.30, credit card is 3.5% + $0.30",
          "Need to split payment? Toggle 'Payment Plan' to pay in installments",
          "Review your payment details and click 'Pay Now'",
          "You'll get instant confirmation and email receipt",
          "Auto-pay option available to never miss a payment"
        ],
      },
      {
        title: "Submitting Maintenance Requests",
        duration: "6 minutes",
        description: "How to submit maintenance requests, upload photos, and track request status",
        steps: [
          "Click 'Submit Maintenance Request' from your dashboard",
          "Select the issue category (Plumbing, HVAC, Electrical, Appliance, etc)",
          "Choose urgency level: Routine, Urgent, or Emergency",
          "Write a clear description of the problem",
          "Upload photos showing the issue (very helpful for faster resolution)",
          "Add your availability for repairs if needed",
          "Click 'Submit Request' to send to your property manager",
          "You'll receive SMS and email updates as status changes",
          "Track request status: Submitted → Assigned → In Progress → Complete",
          "View request history and communicate with vendor if needed",
          "Rate the service after completion"
        ],
      },
      {
        title: "Finding & Applying for Rentals",
        duration: "8 minutes",
        description: "Browse the marketplace, filter properties, and submit screening applications",
        steps: [
          "Visit the public marketplace (no login required initially)",
          "Use filters: Location, Price Range, Bedrooms, Bathrooms, Pet-Friendly",
          "Browse available listings with photos and amenities",
          "Click on a listing to see full details and photo gallery",
          "Check amenities: Parking, Pool, Gym, Laundry, Pet Policy",
          "View exact address and map location",
          "Click 'Apply Now' to start your application",
          "Create your tenant account if you haven't already",
          "Fill in the screening application: Employment, Income, References",
          "Upload required documents (ID, pay stubs, references)",
          "Pay application fee if required",
          "Track application status: Submitted → Under Review → Approved/Denied",
          "Once approved, you'll receive a lease to sign"
        ],
      },
      {
        title: "Setting Up SMS Notifications",
        duration: "4 minutes",
        description: "Configure SMS preferences for rent reminders, maintenance updates, and announcements",
        steps: [
          "Go to your Settings from the tenant portal sidebar",
          "Click on 'Notification Preferences'",
          "Toggle 'Enable SMS Notifications' to ON",
          "Enter your mobile phone number",
          "Select which notifications you want via SMS:",
          "  - Rent payment reminders (recommended)",
          "  - Maintenance request updates",
          "  - Property announcements",
          "  - Lease renewal notices",
          "Customize timing: Get reminders 3, 5, or 7 days before rent is due",
          "Save your preferences",
          "You'll receive a confirmation SMS to verify your number",
          "You can update or disable SMS anytime"
        ],
      },
    ],
    vendors: [
      {
        title: "Vendor Dashboard Overview",
        duration: "6 minutes",
        description: "Navigate your vendor dashboard and understand job assignment workflows",
        steps: [
          "Log in to your vendor portal",
          "Your dashboard shows available jobs, active jobs, and completed work",
          "Filter jobs by service category matching your expertise",
          "View job cards with property address, issue description, and budget",
          "Click on a job to see full details including photos",
          "Check property access instructions and contact information",
          "Your profile displays your ratings and completed job count",
          "Track your earnings and payment status",
          "Update your service categories and availability",
          "Set your service radius to receive relevant jobs"
        ],
      },
      {
        title: "Submitting Bids",
        duration: "5 minutes",
        description: "Learn how to review job requests and submit competitive bids",
        steps: [
          "Browse available jobs in your service area",
          "Click on a job to review full details and requirements",
          "Review any photos uploaded by the tenant or property manager",
          "Click 'Submit Bid' to propose your price",
          "Enter your bid amount (labor + materials)",
          "Provide estimated timeline (hours or days)",
          "Write a brief description of your approach",
          "Add any questions or clarifications needed",
          "Submit your bid for property manager review",
          "You'll be notified if your bid is accepted",
          "Multiple vendors may bid - competitive pricing helps",
          "Once accepted, the job moves to your active jobs"
        ],
      },
      {
        title: "Completing Work & Getting Paid",
        duration: "7 minutes",
        description: "Mark jobs complete, upload photos and invoices, and receive payment",
        steps: [
          "Navigate to your active jobs tab",
          "Click on the job you've completed",
          "Click 'Mark as Complete'",
          "Upload before and after photos of the work",
          "Upload your itemized invoice (PDF or image)",
          "Add work completion notes describing what was done",
          "Submit for property manager approval",
          "Property manager reviews and approves payment",
          "You'll receive payment via your preferred method",
          "Payment typically processes within 2-3 business days",
          "View payment history and download tax documents",
          "Request reviews from satisfied property managers"
        ],
      },
      {
        title: "Managing Multiple Jobs",
        duration: "6 minutes",
        description: "Organize your job queue, prioritize urgent requests, and track completion status",
        steps: [
          "Use the jobs dashboard to see all work at a glance",
          "Filter by status: Available, Bid Submitted, Active, Complete",
          "Sort by priority: Emergency jobs show with red badge",
          "Create a work schedule by clicking jobs and marking 'scheduled dates'",
          "Set reminders for upcoming jobs",
          "Track time spent on each job for accurate future bidding",
          "Use the calendar view to manage scheduling conflicts",
          "Update job status as you progress (Started, In Progress, Waiting)",
          "Communicate with property managers through job comments",
          "Set your availability calendar to control job flow"
        ],
      },
      {
        title: "Building Your Vendor Profile",
        duration: "5 minutes",
        description: "Add service categories, certifications, and portfolio photos to attract more jobs",
        steps: [
          "Go to your vendor profile settings",
          "Add all service categories you offer (Plumbing, HVAC, Electrical, etc)",
          "Upload certifications and licenses (increases trust)",
          "Add your business insurance information",
          "Upload portfolio photos of past work",
          "Write a professional bio highlighting your experience",
          "Set your hourly rate ranges for each service type",
          "Add your service radius in miles",
          "Include your availability schedule",
          "Request reviews from property managers you've worked with",
          "A complete profile gets 3x more job assignments"
        ],
      },
    ],
  };

  const renderTutorialCard = (tutorial: any, index: number, role: string) => (
    <Card key={index} data-testid={`tutorial-${role}-${index}`} className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <BookOpen className="w-10 h-10 text-primary mb-3" />
          <span className="text-xs text-muted-foreground font-medium bg-primary/10 px-2 py-1 rounded">{tutorial.duration}</span>
        </div>
        <CardTitle className="text-lg">{tutorial.title}</CardTitle>
        <CardDescription>{tutorial.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="steps" className="border-none">
            <AccordionTrigger className="text-sm font-medium hover:no-underline" data-testid={`button-show-steps-${role}-${index}`}>
              Show Step-by-Step Instructions
            </AccordionTrigger>
            <AccordionContent>
              <ol className="space-y-3 mt-2">
                {tutorial.steps.map((step: string, stepIndex: number) => (
                  <li key={stepIndex} className="flex gap-3 text-sm">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-medium text-xs">
                      {stepIndex + 1}
                    </span>
                    <span className="text-muted-foreground flex-1 leading-relaxed">{step}</span>
                  </li>
                ))}
              </ol>
              <div className="mt-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg flex items-start gap-2">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-green-900 dark:text-green-100">
                  <strong>Tip:</strong> Follow these steps in order for the best results. Need help? Contact support anytime.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Step-by-Step Tutorials" 
        subtitle="Detailed written guides for every type of user"
        user={user}
        action={
          !user && (
            <Button 
              size="sm" 
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-get-started"
            >
              Get Started
            </Button>
          )
        }
      />

      <section className="px-4 py-16 max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="heading-tutorials">
            Step-by-Step Tutorials
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-4">
            Detailed written guides for every type of user
          </p>
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-2xl mx-auto mb-6">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>📚 Text-Based Tutorials:</strong> Click "Show Step-by-Step Instructions" on any tutorial below to see detailed written guides. Perfect for following along at your own pace!
            </p>
          </div>
        </div>

        <Tabs defaultValue="property-managers" className="w-full">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-8" data-testid="tabs-list">
            <TabsTrigger value="property-managers" data-testid="tab-property-managers">
              <Building2 className="w-4 h-4 mr-2" />
              Property Managers
            </TabsTrigger>
            <TabsTrigger value="property-owners" data-testid="tab-property-owners">
              <TrendingUp className="w-4 h-4 mr-2" />
              Property Owners
            </TabsTrigger>
            <TabsTrigger value="tenants" data-testid="tab-tenants">
              <Users className="w-4 h-4 mr-2" />
              Tenants
            </TabsTrigger>
            <TabsTrigger value="vendors" data-testid="tab-vendors">
              <Wrench className="w-4 h-4 mr-2" />
              Vendors
            </TabsTrigger>
          </TabsList>

          <TabsContent value="property-managers" data-testid="content-property-managers">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Property Manager Tutorials</h2>
              <p className="text-muted-foreground">
                Comprehensive guides covering all aspects of property management in PropertyFlows
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tutorials.propertyManagers.map((tutorial, index) => 
                renderTutorialCard(tutorial, index, 'property-managers')
              )}
            </div>
          </TabsContent>

          <TabsContent value="property-owners" data-testid="content-property-owners">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Property Owner Tutorials</h2>
              <p className="text-muted-foreground">
                Learn how to maximize returns and monitor your real estate investments
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tutorials.propertyOwners.map((tutorial, index) => 
                renderTutorialCard(tutorial, index, 'property-owners')
              )}
            </div>
          </TabsContent>

          <TabsContent value="tenants" data-testid="content-tenants">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Tenant Tutorials</h2>
              <p className="text-muted-foreground">
                Everything you need to know about using your tenant portal
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tutorials.tenants.map((tutorial, index) => 
                renderTutorialCard(tutorial, index, 'tenants')
              )}
            </div>
          </TabsContent>

          <TabsContent value="vendors" data-testid="content-vendors">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Vendor Tutorials</h2>
              <p className="text-muted-foreground">
                Master the vendor platform and grow your maintenance business
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tutorials.vendors.map((tutorial, index) => 
                renderTutorialCard(tutorial, index, 'vendors')
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-16 bg-muted/30 rounded-lg p-8 text-center">
          <h3 className="text-2xl font-bold mb-4" data-testid="heading-need-help">
            Need More Help?
          </h3>
          <p className="text-muted-foreground mb-6">
            Can't find what you're looking for? Our support team is ready to assist you.
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button asChild data-testid="button-contact-support">
              <Link href="/contact">Contact Support</Link>
            </Button>
            <Button variant="outline" asChild data-testid="button-documentation">
              <Link href="/documentation">View Documentation</Link>
            </Button>
            <Button variant="outline" asChild data-testid="button-help-center">
              <Link href="/help">Help Center</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
