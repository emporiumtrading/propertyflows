import { TutorialStep } from "@/components/InteractiveTutorial";

export interface PageTutorial {
  key: string;
  title: string;
  steps: TutorialStep[];
}

export const ADMIN_PM_TUTORIALS: Record<string, PageTutorial> = {
  dashboard: {
    key: "dashboard",
    title: "Dashboard Overview",
    steps: [
      {
        target: "stat-total-properties",
        title: "Track Your Properties",
        description: "Monitor your total properties portfolio. This KPI card shows growth trends and total count.",
        position: "bottom",
        action: "Click to view detailed property information",
      },
      {
        target: "stat-total-units",
        title: "Monitor Unit Occupancy",
        description: "Track total units and occupancy rates. Maintaining 90%+ occupancy maximizes revenue.",
        position: "bottom",
        action: "Aim for high occupancy to optimize performance",
      },
      {
        target: "stat-monthly-revenue",
        title: "Revenue Tracking",
        description: "View total monthly rental income. Updates in real-time as payments are processed.",
        position: "bottom",
        action: "Monitor revenue trends month-over-month",
      },
      {
        target: "stat-open-maintenance",
        title: "Maintenance Queue",
        description: "Track open maintenance requests. Quick response times improve tenant satisfaction.",
        position: "bottom",
        action: "Click to manage and assign requests",
      },
      {
        target: "button-add-property",
        title: "Add Properties",
        description: "Start building your portfolio by adding properties to PropertyFlows.",
        position: "left",
        action: "Click to open the Add Property form",
      },
    ],
  },
  properties: {
    key: "properties",
    title: "Properties Management",
    steps: [
      {
        target: "button-add-property",
        title: "Add New Property",
        description: "Add properties to your portfolio. Include address, type, and unit count.",
        position: "bottom",
        action: "Click to open the property creation form",
      },
      {
        target: "input-search",
        title: "Search Properties",
        description: "Quickly find properties by name, address, or property type.",
        position: "bottom",
        action: "Try searching for a specific property",
      },
      {
        target: "nav-properties",
        title: "Property List",
        description: "View all your properties with key metrics, occupancy rates, and quick actions.",
        position: "right",
        action: "Click on any property to view detailed information",
      },
    ],
  },
  owners: {
    key: "owners",
    title: "Owner Management",
    steps: [
      {
        target: "button-add-owner",
        title: "Add Property Owners",
        description: "Invite property owners to the platform. They'll receive email invitations to access their portal.",
        position: "bottom",
        action: "Click to send owner invitations",
      },
      {
        target: "nav-owners",
        title: "Owner List",
        description: "View all property owners, their portfolio details, and communication history.",
        position: "right",
        action: "Manage owner relationships and permissions",
      },
    ],
  },
  tenants: {
    key: "tenants",
    title: "Tenant Management",
    steps: [
      {
        target: "button-add-tenant",
        title: "Add Tenants",
        description: "Invite tenants to the platform. They can pay rent, submit requests, and access documents.",
        position: "bottom",
        action: "Click to create tenant invitations",
      },
      {
        target: "input-search",
        title: "Search Tenants",
        description: "Find tenants by name, email, unit number, or property.",
        position: "bottom",
        action: "Search across all tenant records",
      },
      {
        target: "nav-tenants",
        title: "Tenant Directory",
        description: "View tenant details, lease status, payment history, and communication records.",
        position: "right",
        action: "Click on tenants to see their full profile",
      },
    ],
  },
  leases: {
    key: "leases",
    title: "Lease Management",
    steps: [
      {
        target: "button-create-lease",
        title: "Create New Lease",
        description: "Generate leases with customizable terms, rent amounts, and e-signature support.",
        position: "bottom",
        action: "Click to start the lease creation wizard",
      },
      {
        target: "nav-leases",
        title: "Active Leases",
        description: "Monitor all lease agreements, expiration dates, and renewal status.",
        position: "right",
        action: "Track lease lifecycle from signing to renewal",
      },
    ],
  },
  maintenance: {
    key: "maintenance",
    title: "Maintenance Requests",
    steps: [
      {
        target: "button-create-request",
        title: "Create Request",
        description: "Log maintenance requests manually or receive them from tenants through their portal.",
        position: "bottom",
        action: "Click to create a new maintenance request",
      },
      {
        target: "nav-maintenance",
        title: "Request Queue",
        description: "View all requests by priority, status, and assigned vendor. AI helps triage urgency.",
        position: "right",
        action: "Assign vendors and track completion",
      },
    ],
  },
  payments: {
    key: "payments",
    title: "Payment Processing",
    steps: [
      {
        target: "nav-payments",
        title: "Payment Dashboard",
        description: "Track all rent payments, ACH transfers, and credit card transactions in real-time.",
        position: "right",
        action: "Monitor payment status and reconcile accounts",
      },
      {
        target: "button-payment-plans",
        title: "Payment Plans",
        description: "Set up flexible payment plans for tenants experiencing financial hardship.",
        position: "bottom",
        action: "Click to create custom payment arrangements",
      },
    ],
  },
  delinquencyDashboard: {
    key: "delinquency-dashboard",
    title: "Delinquency Dashboard",
    steps: [
      {
        target: "nav-delinquency",
        title: "Delinquency Overview",
        description: "Track late payments, aging reports, and automated collection workflows.",
        position: "right",
        action: "Monitor delinquent accounts by age bracket",
      },
    ],
  },
  delinquencyPlaybooks: {
    key: "delinquency-playbooks",
    title: "Delinquency Playbooks",
    steps: [
      {
        target: "button-create-playbook",
        title: "Create Playbook",
        description: "Build automated workflows for late payment notifications, escalation, and legal action.",
        position: "bottom",
        action: "Design step-by-step collection procedures",
      },
    ],
  },
  accounting: {
    key: "accounting",
    title: "Accounting & Financials",
    steps: [
      {
        target: "nav-accounting",
        title: "Chart of Accounts",
        description: "Full double-entry bookkeeping with customizable account structure.",
        position: "right",
        action: "View journal entries and financial statements",
      },
      {
        target: "button-quickbooks-sync",
        title: "QuickBooks Integration",
        description: "Sync transactions automatically to QuickBooks Online for seamless accounting.",
        position: "bottom",
        action: "Click to connect your QuickBooks account",
      },
    ],
  },
  screening: {
    key: "screening",
    title: "Tenant Screening",
    steps: [
      {
        target: "button-new-screening",
        title: "Run Background Check",
        description: "Screen prospective tenants with credit, criminal, and eviction history reports.",
        position: "bottom",
        action: "Click to initiate screening process",
      },
      {
        target: "nav-screening",
        title: "Screening Results",
        description: "Review applicant reports and make informed leasing decisions with AI recommendations.",
        position: "right",
        action: "Filter by approval status and risk score",
      },
    ],
  },
  turnboard: {
    key: "turnboard",
    title: "Field Operations Turnboard",
    steps: [
      {
        target: "nav-turnboard",
        title: "Kanban Board",
        description: "Manage unit turns, make-ready tasks, and field operations in a visual workflow.",
        position: "right",
        action: "Drag tasks between To Do, In Progress, and Complete",
      },
      {
        target: "button-add-task",
        title: "Create Task",
        description: "Add cleaning, repair, and inspection tasks with photos and vendor assignments.",
        position: "bottom",
        action: "Track move-out to move-in timeline",
      },
    ],
  },
  compliance: {
    key: "compliance",
    title: "Fair Housing Compliance",
    steps: [
      {
        target: "nav-compliance",
        title: "Compliance Dashboard",
        description: "AI-powered Fair Housing compliance monitoring for all communications and decisions.",
        position: "right",
        action: "Review flagged communications and training",
      },
    ],
  },
  vendors: {
    key: "vendors",
    title: "Vendor Management",
    steps: [
      {
        target: "button-invite-vendor",
        title: "Invite Vendors",
        description: "Add contractors, plumbers, electricians, and other service providers to your network.",
        position: "bottom",
        action: "Click to send vendor portal invitations",
      },
      {
        target: "nav-vendors",
        title: "Vendor Directory",
        description: "View vendor profiles, specialties, ratings, and work history.",
        position: "right",
        action: "Assign jobs and track vendor performance",
      },
    ],
  },
  integrations: {
    key: "integrations",
    title: "Platform Integrations",
    steps: [
      {
        target: "nav-integrations",
        title: "Connected Services",
        description: "Manage integrations with Stripe, QuickBooks, Twilio, DocuSign, and more.",
        position: "right",
        action: "Connect external services for automation",
      },
    ],
  },
  dataManagement: {
    key: "data-management",
    title: "Bulk Data Import",
    steps: [
      {
        target: "button-upload-csv",
        title: "Upload CSV/Excel",
        description: "Import properties, units, tenants, leases, and transactions from spreadsheets.",
        position: "bottom",
        action: "Click to start the import wizard",
      },
      {
        target: "nav-import-history",
        title: "Import History",
        description: "Review past imports, validation errors, and data normalization logs.",
        position: "right",
        action: "Track import success and rollback if needed",
      },
    ],
  },
  inviteUsers: {
    key: "invite-users",
    title: "User Invitations",
    steps: [
      {
        target: "button-send-invite",
        title: "Invite Users",
        description: "Send email invitations to property managers, owners, tenants, and vendors.",
        position: "bottom",
        action: "Select role and enter email address",
      },
    ],
  },
  settings: {
    key: "settings",
    title: "Account Settings",
    steps: [
      {
        target: "nav-settings",
        title: "Global Settings",
        description: "Configure timezone, currency, notifications, and multi-factor authentication.",
        position: "right",
        action: "Customize your PropertyFlows experience",
      },
    ],
  },
};

export const OWNER_TUTORIALS: Record<string, PageTutorial> = {
  ownerPortal: {
    key: "owner-portal",
    title: "Owner Portal Dashboard",
    steps: [
      {
        target: "stat-properties",
        title: "Your Properties",
        description: "View all properties you own with occupancy and revenue metrics.",
        position: "bottom",
        action: "Monitor your real estate portfolio",
      },
      {
        target: "stat-revenue",
        title: "Monthly Income",
        description: "Track rental income collected across all your properties.",
        position: "bottom",
        action: "View revenue trends and forecasts",
      },
      {
        target: "nav-owner-portal",
        title: "Portal Navigation",
        description: "Access properties, payments, reports, and settings from the sidebar.",
        position: "right",
        action: "Explore all owner portal features",
      },
    ],
  },
  ownerProperties: {
    key: "owner-properties",
    title: "My Properties",
    steps: [
      {
        target: "nav-my-properties",
        title: "Property List",
        description: "View detailed information about each property you own.",
        position: "right",
        action: "Click on properties to see unit details",
      },
    ],
  },
  ownerPayments: {
    key: "owner-payments",
    title: "Payment History",
    steps: [
      {
        target: "nav-payments",
        title: "Payment Records",
        description: "See all rent payments received from your tenants with transaction details.",
        position: "right",
        action: "Download statements for tax purposes",
      },
    ],
  },
  ownerLeases: {
    key: "owner-leases",
    title: "Lease Agreements",
    steps: [
      {
        target: "nav-leases",
        title: "Active Leases",
        description: "Review lease agreements for your properties with renewal status.",
        position: "right",
        action: "Monitor lease expirations and renewals",
      },
    ],
  },
  ownerMaintenance: {
    key: "owner-maintenance",
    title: "Maintenance Requests",
    steps: [
      {
        target: "nav-maintenance",
        title: "Request Status",
        description: "Track maintenance requests for your properties and vendor assignments.",
        position: "right",
        action: "Stay informed on property upkeep",
      },
    ],
  },
  ownerReports: {
    key: "owner-reports",
    title: "Financial Reports",
    steps: [
      {
        target: "nav-reports",
        title: "Financial Statements",
        description: "Access income statements, cash flow reports, and tax documentation.",
        position: "right",
        action: "Generate custom reports by date range",
      },
    ],
  },
  payouts: {
    key: "payouts",
    title: "Payout Dashboard",
    steps: [
      {
        target: "nav-payouts",
        title: "Stripe Payouts",
        description: "View scheduled payouts and transfer history to your bank account.",
        position: "right",
        action: "Track when you'll receive rental income",
      },
    ],
  },
  ownerSettings: {
    key: "owner-settings",
    title: "Owner Settings",
    steps: [
      {
        target: "nav-settings",
        title: "Account Preferences",
        description: "Update your profile, notification preferences, and security settings.",
        position: "right",
        action: "Customize your portal experience",
      },
    ],
  },
};

export const TENANT_TUTORIALS: Record<string, PageTutorial> = {
  tenantPortal: {
    key: "tenant-portal",
    title: "Tenant Portal Dashboard",
    steps: [
      {
        target: "stat-rent-due",
        title: "Rent Due",
        description: "View your current rent balance and upcoming payment due date.",
        position: "bottom",
        action: "Click to make a payment",
      },
      {
        target: "stat-lease-expires",
        title: "Lease Expiration",
        description: "See when your current lease expires and renewal options.",
        position: "bottom",
        action: "Plan ahead for lease renewal",
      },
      {
        target: "button-pay-rent",
        title: "Pay Rent Online",
        description: "Pay your rent securely with ACH (free) or credit/debit card.",
        position: "bottom",
        action: "Click to make a payment now",
      },
      {
        target: "button-submit-maintenance",
        title: "Submit Requests",
        description: "Report maintenance issues directly to your property manager.",
        position: "bottom",
        action: "Upload photos and describe the issue",
      },
    ],
  },
  tenantLease: {
    key: "tenant-lease",
    title: "My Lease Agreement",
    steps: [
      {
        target: "nav-lease",
        title: "Lease Document",
        description: "View your signed lease agreement with all terms and conditions.",
        position: "right",
        action: "Download a copy for your records",
      },
    ],
  },
  tenantPayments: {
    key: "tenant-payments",
    title: "Payment History",
    steps: [
      {
        target: "button-make-payment",
        title: "Make Payment",
        description: "Pay your rent using bank account (ACH) or card. ACH is free, cards have a small fee.",
        position: "bottom",
        action: "Click to start payment process",
      },
      {
        target: "nav-payment-history",
        title: "Payment Records",
        description: "View all past payments with receipts and transaction IDs.",
        position: "right",
        action: "Download receipts for proof of payment",
      },
    ],
  },
  tenantMaintenance: {
    key: "tenant-maintenance",
    title: "Maintenance Requests",
    steps: [
      {
        target: "button-new-request",
        title: "Create Request",
        description: "Submit a maintenance request with photos and detailed description.",
        position: "bottom",
        action: "Click to report an issue",
      },
      {
        target: "nav-requests",
        title: "Request Status",
        description: "Track your maintenance requests from submission to completion.",
        position: "right",
        action: "View vendor assignments and completion dates",
      },
    ],
  },
  tenantDocuments: {
    key: "tenant-documents",
    title: "Documents & Files",
    steps: [
      {
        target: "nav-documents",
        title: "Document Library",
        description: "Access important documents like lease agreements, move-in checklists, and notices.",
        position: "right",
        action: "Download or view documents anytime",
      },
    ],
  },
  tenantSettings: {
    key: "tenant-settings",
    title: "Tenant Settings",
    steps: [
      {
        target: "nav-settings",
        title: "Account Settings",
        description: "Update your contact information and notification preferences.",
        position: "right",
        action: "Keep your info current for communications",
      },
    ],
  },
};

export const VENDOR_TUTORIALS: Record<string, PageTutorial> = {
  vendorPortal: {
    key: "vendor-portal",
    title: "Vendor Portal Dashboard",
    steps: [
      {
        target: "stat-active-jobs",
        title: "Active Jobs",
        description: "View all maintenance jobs currently assigned to you.",
        position: "bottom",
        action: "Track job progress and deadlines",
      },
      {
        target: "stat-pending-bids",
        title: "Pending Bids",
        description: "See job opportunities you can bid on for new work.",
        position: "bottom",
        action: "Submit competitive bids to win jobs",
      },
      {
        target: "stat-earnings",
        title: "Total Earnings",
        description: "Track your total earnings from completed jobs.",
        position: "bottom",
        action: "View payout history and pending payments",
      },
      {
        target: "nav-vendor",
        title: "Vendor Navigation",
        description: "Access jobs, bids, completed work, and finance dashboard from the sidebar.",
        position: "right",
        action: "Explore all vendor features",
      },
    ],
  },
  vendorJobs: {
    key: "vendor-jobs",
    title: "My Jobs",
    steps: [
      {
        target: "nav-jobs",
        title: "Active Jobs",
        description: "View all assigned maintenance jobs with property locations and task details.",
        position: "right",
        action: "Click on jobs to update status and upload completion photos",
      },
      {
        target: "button-update-status",
        title: "Update Job Status",
        description: "Mark jobs as In Progress or Complete with before/after photos.",
        position: "bottom",
        action: "Document your work for payment approval",
      },
    ],
  },
  vendorBids: {
    key: "vendor-bids",
    title: "Bidding Opportunities",
    steps: [
      {
        target: "nav-bids",
        title: "Available Jobs",
        description: "Browse maintenance jobs open for bidding from property managers.",
        position: "right",
        action: "Submit bids with pricing and timeline",
      },
      {
        target: "button-submit-bid",
        title: "Submit Bid",
        description: "Enter your price quote and estimated completion time to win jobs.",
        position: "bottom",
        action: "Competitive bids increase your chances",
      },
    ],
  },
  vendorCompleted: {
    key: "vendor-completed",
    title: "Completed Work",
    steps: [
      {
        target: "nav-completed",
        title: "Work History",
        description: "View all jobs you've completed with photos and customer ratings.",
        position: "right",
        action: "Build your reputation with quality work",
      },
    ],
  },
  vendorFinance: {
    key: "vendor-finance",
    title: "Finance Dashboard",
    steps: [
      {
        target: "button-setup-stripe",
        title: "Setup Stripe Connect",
        description: "Connect your bank account via Stripe to receive payments for completed jobs.",
        position: "bottom",
        action: "Click to start Stripe onboarding",
      },
      {
        target: "nav-finance",
        title: "Payout History",
        description: "Track all payouts and pending payments from completed work.",
        position: "right",
        action: "View transaction history and tax documentation",
      },
    ],
  },
  vendorSettings: {
    key: "vendor-settings",
    title: "Vendor Settings",
    steps: [
      {
        target: "nav-settings",
        title: "Profile Settings",
        description: "Update your business info, service areas, and specialties.",
        position: "right",
        action: "Keep your profile current to attract jobs",
      },
    ],
  },
};

export function getTutorialForPage(route: string, role?: string): PageTutorial | null {
  const cleanRoute = route.replace(/\//g, "").replace(/-/g, "");
  
  if (role === 'tenant') {
    const tenantKey = Object.keys(TENANT_TUTORIALS).find(
      key => key.toLowerCase().includes(cleanRoute.toLowerCase())
    );
    return tenantKey ? TENANT_TUTORIALS[tenantKey] : null;
  }
  
  if (role === 'landlord') {
    const ownerKey = Object.keys(OWNER_TUTORIALS).find(
      key => key.toLowerCase().includes(cleanRoute.toLowerCase())
    );
    return ownerKey ? OWNER_TUTORIALS[ownerKey] : null;
  }
  
  if (role === 'vendor') {
    const vendorKey = Object.keys(VENDOR_TUTORIALS).find(
      key => key.toLowerCase().includes(cleanRoute.toLowerCase())
    );
    return vendorKey ? VENDOR_TUTORIALS[vendorKey] : null;
  }
  
  const adminKey = Object.keys(ADMIN_PM_TUTORIALS).find(
    key => key.toLowerCase().includes(cleanRoute.toLowerCase())
  );
  return adminKey ? ADMIN_PM_TUTORIALS[adminKey] : null;
}

export function getAllTutorialsForRole(role?: string): PageTutorial[] {
  switch (role) {
    case 'tenant':
      return Object.values(TENANT_TUTORIALS);
    case 'landlord':
      return Object.values(OWNER_TUTORIALS);
    case 'vendor':
      return Object.values(VENDOR_TUTORIALS);
    case 'admin':
    case 'property_manager':
      return Object.values(ADMIN_PM_TUTORIALS);
    default:
      return [];
  }
}
