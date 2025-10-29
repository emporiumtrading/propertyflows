import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Building2, Users, FileText, Wrench, CreditCard, BarChart3, UserCheck, Home, Briefcase, UserPlus, Clipboard, Shield, Calendar, AlertCircle, Activity, Database, Store, Wallet, Package, Settings, UserCog, Hammer, Menu, X, DollarSign, Building } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { User } from "@shared/schema";
import logoImage from "@assets/ChatGPT Image Oct 1, 2025 at 09_25_47 PM_1759371980374.png";
import { Sheet, SheetContent, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth() as { user: User | undefined };
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { path: "/", icon: Home, label: "Dashboard" },
    { path: "/properties", icon: Building2, label: "Properties" },
    { path: "/owners", icon: UserCog, label: "Owners" },
    { path: "/tenants", icon: Users, label: "Tenants" },
    { path: "/leases", icon: FileText, label: "Leases" },
    { path: "/maintenance", icon: Wrench, label: "Maintenance" },
    { path: "/payments", icon: CreditCard, label: "Payments" },
    ...(user?.role === 'admin' || user?.role === 'property_manager' || user?.role === 'landlord' ? [
      { path: "/delinquency-dashboard", icon: Activity, label: "Delinquency" },
      { path: "/delinquency-playbooks", icon: AlertCircle, label: "Playbooks" }
    ] : []),
    { path: "/accounting", icon: BarChart3, label: "Accounting" },
    { path: "/screening", icon: UserCheck, label: "Screening" },
    { path: "/turnboard", icon: Clipboard, label: "Turnboard" },
    { path: "/compliance", icon: Shield, label: "Compliance" },
    ...(user?.role === 'property_manager' || user?.role === 'admin' ? [
      { path: "/vendors", icon: Hammer, label: "Vendors" },
      { path: "/integrations", icon: Package, label: "Integrations" },
      { path: "/data-management", icon: Database, label: "Data Import" },
      { path: "/invite-users", icon: UserPlus, label: "Invite Users" }
    ] : []),
    { path: "/settings", icon: Settings, label: "Settings" },
  ];

  const superAdminItems = user?.role === 'admin' ? [
    { path: "/admin/subscription-plans", icon: DollarSign, label: "Subscription Plans" },
    { path: "/admin/organizations", icon: Building, label: "Organizations" },
  ] : [];

  if (user?.role === 'tenant') {
    const tenantNav = [
      { path: "/tenant-portal", icon: Home, label: "Dashboard" },
      { path: "/tenant-portal/lease", icon: FileText, label: "My Lease" },
      { path: "/tenant-portal/payments", icon: CreditCard, label: "Payments" },
      { path: "/tenant-portal/maintenance", icon: Wrench, label: "Maintenance" },
      { path: "/tenant-portal/documents", icon: Briefcase, label: "Documents" },
      { path: "/tenant-portal/settings", icon: Settings, label: "Settings" },
    ];

    const NavItems = ({ useMobileClose = false }) => (
      <>
        {tenantNav.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          const linkContent = (
            <Link href={item.path} key={item.path}>
              <span 
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </span>
            </Link>
          );
          
          return useMobileClose ? (
            <SheetClose asChild key={item.path}>
              {linkContent}
            </SheetClose>
          ) : linkContent;
        })}
      </>
    );

    const SidebarContent = ({ isMobile = false }) => (
      <>
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <img src={logoImage} alt="PropertyFlows" className="h-12 w-auto" />
          </div>
          <p className="text-xs text-muted-foreground">Tenant Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItems useMobileClose={isMobile} />
        </nav>
        <div className="p-4 border-t border-border space-y-3">
          <div className="px-3 py-2 bg-muted/50 rounded-md" data-testid="user-profile-section">
            <div className="text-sm font-medium text-foreground" data-testid="user-name">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs text-muted-foreground" data-testid="user-email">
              {user?.email}
            </div>
            <div className="text-xs font-medium text-primary mt-1" data-testid="user-role">
              Tenant
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/api/logout'} 
            className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors text-muted-foreground"
            data-testid="button-logout"
          >
            Logout
          </button>
        </div>
      </>
    );

    return (
      <>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50" data-testid="button-mobile-menu" aria-label="Open navigation menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              <SidebarContent isMobile={true} />
            </div>
          </SheetContent>
        </Sheet>
        <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col">
          <SidebarContent isMobile={false} />
        </aside>
      </>
    );
  }

  if (user?.role === 'landlord') {
    const landlordNav = [
      { path: "/owner-portal", icon: Home, label: "Dashboard" },
      { path: "/owner-portal/properties", icon: Building2, label: "My Properties" },
      { path: "/owner-portal/payments", icon: CreditCard, label: "Payments" },
      { path: "/owner-portal/leases", icon: FileText, label: "Leases" },
      { path: "/owner-portal/maintenance", icon: Wrench, label: "Maintenance" },
      { path: "/owner-portal/reports", icon: BarChart3, label: "Financial Reports" },
      { path: "/payouts", icon: Wallet, label: "Payouts" },
      { path: "/owner-portal/settings", icon: Settings, label: "Settings" },
    ];
    
    const NavItems = ({ useMobileClose = false }) => (
      <>
        {landlordNav.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          const linkContent = (
            <Link href={item.path} key={item.path}>
              <span 
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </span>
            </Link>
          );
          
          return useMobileClose ? (
            <SheetClose asChild key={item.path}>
              {linkContent}
            </SheetClose>
          ) : linkContent;
        })}
      </>
    );

    const SidebarContent = ({ isMobile = false }) => (
      <>
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <img src={logoImage} alt="PropertyFlows" className="h-12 w-auto" />
          </div>
          <p className="text-xs text-muted-foreground">Owner Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItems useMobileClose={isMobile} />
        </nav>
        <div className="p-4 border-t border-border space-y-3">
          <div className="px-3 py-2 bg-muted/50 rounded-md" data-testid="user-profile-section">
            <div className="text-sm font-medium text-foreground" data-testid="user-name">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs text-muted-foreground" data-testid="user-email">
              {user?.email}
            </div>
            <div className="text-xs font-medium text-primary mt-1" data-testid="user-role">
              Property Owner
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/api/logout'} 
            className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors text-muted-foreground"
            data-testid="button-logout"
          >
            Logout
          </button>
        </div>
      </>
    );

    return (
      <>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50" data-testid="button-mobile-menu" aria-label="Open navigation menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              <SidebarContent isMobile={true} />
            </div>
          </SheetContent>
        </Sheet>
        <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col">
          <SidebarContent isMobile={false} />
        </aside>
      </>
    );
  }

  if (user?.role === 'vendor') {
    const vendorNav = [
      { path: "/vendor-portal", icon: Home, label: "Dashboard" },
      { path: "/vendor-portal/jobs", icon: Wrench, label: "My Jobs" },
      { path: "/vendor-portal/bids", icon: CreditCard, label: "My Bids" },
      { path: "/vendor-portal/completed", icon: UserCheck, label: "Completed Work" },
      { path: "/vendor-portal/finance", icon: Wallet, label: "Finance" },
      { path: "/vendor-portal/settings", icon: Settings, label: "Settings" },
    ];

    const NavItems = ({ useMobileClose = false }) => (
      <>
        {vendorNav.map((item) => {
          const isActive = location === item.path;
          const Icon = item.icon;
          const linkContent = (
            <Link href={item.path} key={item.path}>
              <span 
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                  isActive ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </span>
            </Link>
          );
          
          return useMobileClose ? (
            <SheetClose asChild key={item.path}>
              {linkContent}
            </SheetClose>
          ) : linkContent;
        })}
      </>
    );

    const SidebarContent = ({ isMobile = false }) => (
      <>
        <div className="p-6 border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <img src={logoImage} alt="PropertyFlows" className="h-12 w-auto" />
          </div>
          <p className="text-xs text-muted-foreground">Vendor Portal</p>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <NavItems useMobileClose={isMobile} />
        </nav>
        <div className="p-4 border-t border-border space-y-3">
          <div className="px-3 py-2 bg-muted/50 rounded-md" data-testid="user-profile-section">
            <div className="text-sm font-medium text-foreground" data-testid="user-name">
              {user?.firstName} {user?.lastName}
            </div>
            <div className="text-xs text-muted-foreground" data-testid="user-email">
              {user?.email}
            </div>
            <div className="text-xs font-medium text-primary mt-1" data-testid="user-role">
              Vendor
            </div>
          </div>
          <button 
            onClick={() => window.location.href = '/api/logout'} 
            className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors text-muted-foreground"
            data-testid="button-logout"
          >
            Logout
          </button>
        </div>
      </>
    );

    return (
      <>
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50" data-testid="button-mobile-menu" aria-label="Open navigation menu">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <div className="flex flex-col h-full">
              <SidebarContent isMobile={true} />
            </div>
          </SheetContent>
        </Sheet>
        <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col">
          <SidebarContent isMobile={false} />
        </aside>
      </>
    );
  }

  const NavItems = ({ useMobileClose = false }) => (
    <>
      {navItems.map((item) => {
        const isActive = location === item.path;
        const Icon = item.icon;
        const linkContent = (
          <Link href={item.path} key={item.path}>
            <span
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-foreground hover:bg-muted"
              }`}
              data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </span>
          </Link>
        );
        
        return useMobileClose ? (
          <SheetClose asChild key={item.path}>
            {linkContent}
          </SheetClose>
        ) : linkContent;
      })}

      {superAdminItems.length > 0 && (
        <>
          <div className="px-3 pt-4 pb-2">
            <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Super Admin
            </div>
          </div>
          {superAdminItems.map((item) => {
            const isActive = location === item.path;
            const Icon = item.icon;
            const linkContent = (
              <Link href={item.path} key={item.path}>
                <span
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors cursor-pointer ${
                    isActive
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted"
                  }`}
                  data-testid={`nav-${item.label.toLowerCase().replace(' ', '-')}`}
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </span>
              </Link>
            );
            
            return useMobileClose ? (
              <SheetClose asChild key={item.path}>
                {linkContent}
              </SheetClose>
            ) : linkContent;
          })}
        </>
      )}
    </>
  );

  const SidebarContent = ({ isMobile = false }) => (
    <>
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3 mb-1">
          <img src={logoImage} alt="PropertyFlows" className="h-8 w-auto" />
        </div>
        <p className="text-xs text-muted-foreground">
          {user?.role === 'admin' ? 'System Administrator' : 'Property Management'}
        </p>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-4">
        <div className="space-y-1">
          <NavItems useMobileClose={isMobile} />
        </div>
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        <div className="px-3 py-2 bg-muted/50 rounded-md" data-testid="user-profile-section">
          <div className="text-sm font-medium text-foreground" data-testid="user-name">
            {user?.firstName} {user?.lastName}
          </div>
          <div className="text-xs text-muted-foreground" data-testid="user-email">
            {user?.email}
          </div>
          <div className="text-xs font-medium text-primary mt-1" data-testid="user-role">
            {user?.role === 'admin' && 'Administrator'}
            {user?.role === 'property_manager' && 'Property Manager'}
            {user?.role === 'landlord' && 'Property Owner'}
            {user?.role === 'tenant' && 'Tenant'}
            {user?.role === 'vendor' && 'Vendor'}
          </div>
        </div>
        <button 
          onClick={() => window.location.href = '/api/logout'} 
          className="w-full text-left px-3 py-2 rounded-md hover:bg-muted transition-colors text-muted-foreground"
          data-testid="button-logout"
        >
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="md:hidden fixed top-4 left-4 z-50" data-testid="button-mobile-menu" aria-label="Open navigation menu">
            <Menu className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <div className="flex flex-col h-full">
            <SidebarContent isMobile={true} />
          </div>
        </SheetContent>
      </Sheet>
      <aside className="w-64 bg-card border-r border-border hidden md:flex flex-col">
        <SidebarContent isMobile={false} />
      </aside>
    </>
  );
}
