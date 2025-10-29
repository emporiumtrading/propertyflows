import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AIChatbot } from "@/components/AIChatbot";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Dashboard from "@/pages/Dashboard";
import Properties from "@/pages/Properties";
import PropertyDetails from "@/pages/PropertyDetails";
import Owners from "@/pages/Owners";
import Tenants from "@/pages/Tenants";
import TenantPortal from "@/pages/TenantPortal";
import TenantPayments from "@/pages/TenantPayments";
import TenantLease from "@/pages/TenantLease";
import TenantMaintenance from "@/pages/TenantMaintenance";
import TenantDocuments from "@/pages/TenantDocuments";
import OwnerPortal from "@/pages/OwnerPortal";
import PropertyManagerPortal from "@/pages/PropertyManagerPortal";
import OwnerProperties from "@/pages/OwnerProperties";
import OwnerUnits from "@/pages/OwnerUnits";
import OwnerPayments from "@/pages/OwnerPayments";
import OwnerLeases from "@/pages/OwnerLeases";
import OwnerMaintenance from "@/pages/OwnerMaintenance";
import OwnerReports from "@/pages/OwnerReports";
import Leases from "@/pages/Leases";
import Maintenance from "@/pages/Maintenance";
import Payments from "@/pages/Payments";
import PaymentCheckout from "@/pages/PaymentCheckout";
import PaymentPlans from "@/pages/PaymentPlans";
import DelinquencyPlaybooks from "@/pages/DelinquencyPlaybooks";
import DelinquencyDashboard from "@/pages/DelinquencyDashboard";
import Accounting from "@/pages/Accounting";
import Screening from "@/pages/Screening";
import AcceptInvite from "@/pages/AcceptInvite";
import InviteUsers from "@/pages/InviteUsers";
import Turnboard from "@/pages/Turnboard";
import ComplianceTools from "@/pages/ComplianceTools";
import VendorDashboard from "@/pages/VendorDashboard";
import VendorPortal from "@/pages/VendorPortal";
import VendorJobs from "@/pages/VendorJobs";
import VendorBids from "@/pages/VendorBids";
import VendorCompletedWork from "@/pages/VendorCompletedWork";
import VendorFinance from "@/pages/VendorFinance";
import VendorList from "@/pages/VendorList";
import DataManagement from "@/pages/DataManagement";
import DataImport from "@/pages/DataImport";
import TenantMarketplace from "@/pages/TenantMarketplace";
import PayoutDashboard from "@/pages/PayoutDashboard";
import Features from "@/pages/Features";
import PropertyManagersFeatures from "@/pages/PropertyManagersFeatures";
import PropertyOwnersFeatures from "@/pages/PropertyOwnersFeatures";
import TenantsFeatures from "@/pages/TenantsFeatures";
import VendorsFeatures from "@/pages/VendorsFeatures";
import SyndicatesFeatures from "@/pages/SyndicatesFeatures";
import Pricing from "@/pages/Pricing";
import Integrations from "@/pages/Integrations";
import AboutUs from "@/pages/AboutUs";
import Careers from "@/pages/Careers";
import Blog from "@/pages/Blog";
import Contact from "@/pages/Contact";
import HelpCenter from "@/pages/HelpCenter";
import Documentation from "@/pages/Documentation";
import APIReference from "@/pages/APIReference";
import SystemStatus from "@/pages/SystemStatus";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import TermsOfService from "@/pages/TermsOfService";
import Security from "@/pages/Security";
import Tutorials from "@/pages/Tutorials";
import { OnboardingWizard } from "@/components/OnboardingWizard";
import { MfaVerify } from "@/pages/MfaVerify";
import Settings from "@/pages/Settings";
import TenantSettings from "@/pages/TenantSettings";
import OwnerSettings from "@/pages/OwnerSettings";
import VendorSettings from "@/pages/VendorSettings";
import SignLease from "@/pages/SignLease";
import SalesDeck from "@/pages/SalesDeck";
import PitchDeck from "@/pages/PitchDeck";
import FeaturesDeck from "@/pages/FeaturesDeck";
import ProductDeck from "@/pages/ProductDeck";
import SubscriptionPlans from "@/pages/SubscriptionPlans";
import Organizations from "@/pages/Organizations";
import AdminApprovalQueue from "@/pages/AdminApprovalQueue";
import RegisterBusiness from "@/pages/RegisterBusiness";

function ProtectedRoute({ component: Component }: { component: any }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = '/api/login';
    return null;
  }

  return <Component />;
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" aria-label="Loading"/>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/">
        {isAuthenticated ? <Dashboard /> : <Landing />}
      </Route>
      <Route path="/dashboard">
        <ProtectedRoute component={Dashboard} />
      </Route>
      <Route path="/properties" component={() => <ProtectedRoute component={Properties} />} />
      <Route path="/properties/:id" component={() => <ProtectedRoute component={PropertyDetails} />} />
      <Route path="/owners" component={() => <ProtectedRoute component={Owners} />} />
      <Route path="/tenants" component={() => <ProtectedRoute component={Tenants} />} />
      <Route path="/tenant-portal" component={() => <ProtectedRoute component={TenantPortal} />} />
      <Route path="/tenant-portal/payments" component={() => <ProtectedRoute component={TenantPayments} />} />
      <Route path="/tenant-portal/lease" component={() => <ProtectedRoute component={TenantLease} />} />
      <Route path="/tenant-portal/maintenance" component={() => <ProtectedRoute component={TenantMaintenance} />} />
      <Route path="/tenant-portal/documents" component={() => <ProtectedRoute component={TenantDocuments} />} />
      <Route path="/owner-portal" component={() => <ProtectedRoute component={OwnerPortal} />} />
      <Route path="/owner-portal/properties" component={() => <ProtectedRoute component={OwnerProperties} />} />
      <Route path="/owner-portal/units" component={() => <ProtectedRoute component={OwnerUnits} />} />
      <Route path="/owner-portal/payments" component={() => <ProtectedRoute component={OwnerPayments} />} />
      <Route path="/owner-portal/leases" component={() => <ProtectedRoute component={OwnerLeases} />} />
      <Route path="/owner-portal/maintenance" component={() => <ProtectedRoute component={OwnerMaintenance} />} />
      <Route path="/owner-portal/reports" component={() => <ProtectedRoute component={OwnerReports} />} />
      <Route path="/property-manager-portal" component={() => <ProtectedRoute component={PropertyManagerPortal} />} />
      <Route path="/leases" component={() => <ProtectedRoute component={Leases} />} />
      <Route path="/maintenance" component={() => <ProtectedRoute component={Maintenance} />} />
      <Route path="/payments" component={() => <ProtectedRoute component={Payments} />} />
      <Route path="/payments/checkout" component={() => <ProtectedRoute component={PaymentCheckout} />} />
      <Route path="/payment-plans" component={() => <ProtectedRoute component={PaymentPlans} />} />
      <Route path="/delinquency-playbooks" component={() => <ProtectedRoute component={DelinquencyPlaybooks} />} />
      <Route path="/delinquency-dashboard" component={() => <ProtectedRoute component={DelinquencyDashboard} />} />
      <Route path="/accounting" component={() => <ProtectedRoute component={Accounting} />} />
      <Route path="/screening" component={() => <ProtectedRoute component={Screening} />} />
      <Route path="/turnboard" component={() => <ProtectedRoute component={Turnboard} />} />
      <Route path="/compliance" component={() => <ProtectedRoute component={ComplianceTools} />} />
      <Route path="/integrations" component={() => <ProtectedRoute component={Integrations} />} />
      <Route path="/vendor-dashboard" component={() => <ProtectedRoute component={VendorDashboard} />} />
      <Route path="/vendor-portal" component={() => <ProtectedRoute component={VendorPortal} />} />
      <Route path="/vendor-portal/jobs" component={() => <ProtectedRoute component={VendorJobs} />} />
      <Route path="/vendor-portal/bids" component={() => <ProtectedRoute component={VendorBids} />} />
      <Route path="/vendor-portal/completed" component={() => <ProtectedRoute component={VendorCompletedWork} />} />
      <Route path="/vendor-portal/finance" component={() => <ProtectedRoute component={VendorFinance} />} />
      <Route path="/vendors" component={() => <ProtectedRoute component={VendorList} />} />
      <Route path="/data-management" component={() => <ProtectedRoute component={DataManagement} />} />
      <Route path="/data-import" component={() => <ProtectedRoute component={DataImport} />} />
      <Route path="/marketplace" component={TenantMarketplace} />
      <Route path="/payouts" component={() => <ProtectedRoute component={PayoutDashboard} />} />
      <Route path="/invite-users" component={() => <ProtectedRoute component={InviteUsers} />} />
      <Route path="/accept-invite/:token" component={AcceptInvite} />
      <Route path="/sign-lease/:id" component={() => <ProtectedRoute component={SignLease} />} />
      <Route path="/onboarding" component={() => <ProtectedRoute component={OnboardingWizard} />} />
      <Route path="/mfa-verify" component={MfaVerify} />
      <Route path="/settings" component={() => <ProtectedRoute component={Settings} />} />
      <Route path="/tenant-portal/settings" component={() => <ProtectedRoute component={TenantSettings} />} />
      <Route path="/owner-portal/settings" component={() => <ProtectedRoute component={OwnerSettings} />} />
      <Route path="/vendor-portal/settings" component={() => <ProtectedRoute component={VendorSettings} />} />
      
      {/* Super Admin Pages */}
      <Route path="/admin/subscription-plans" component={() => <ProtectedRoute component={SubscriptionPlans} />} />
      <Route path="/admin/organizations" component={() => <ProtectedRoute component={Organizations} />} />
      <Route path="/admin/approval-queue" component={() => <ProtectedRoute component={AdminApprovalQueue} />} />
      
      {/* Public Pages */}
      <Route path="/register" component={RegisterBusiness} />
      <Route path="/sales-deck" component={SalesDeck} />
      <Route path="/pitch-deck" component={PitchDeck} />
      <Route path="/features-deck" component={FeaturesDeck} />
      <Route path="/product-deck" component={ProductDeck} />
      <Route path="/features" component={Features} />
      <Route path="/features/property-managers" component={PropertyManagersFeatures} />
      <Route path="/features/property-owners" component={PropertyOwnersFeatures} />
      <Route path="/features/tenants" component={TenantsFeatures} />
      <Route path="/features/vendors" component={VendorsFeatures} />
      <Route path="/features/syndicates" component={SyndicatesFeatures} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/about" component={AboutUs} />
      <Route path="/careers" component={Careers} />
      <Route path="/blog" component={Blog} />
      <Route path="/contact" component={Contact} />
      <Route path="/help" component={HelpCenter} />
      <Route path="/tutorials" component={Tutorials} />
      <Route path="/documentation" component={Documentation} />
      <Route path="/api-reference" component={APIReference} />
      <Route path="/system-status" component={SystemStatus} />
      <Route path="/privacy" component={PrivacyPolicy} />
      <Route path="/terms" component={TermsOfService} />
      <Route path="/security" component={Security} />
      
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { isAuthenticated } = useAuth();
  
  return (
    <>
      <Router />
      <Toaster />
      {isAuthenticated && <AIChatbot />}
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContent />
    </QueryClientProvider>
  );
}

export default App;
