import { Link, useLocation } from "wouter";
import { Building2, DollarSign, FileText, Wrench, Home, TrendingUp, Wallet, LogOut, Settings, Grid3x3 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function OwnerSidebar() {
  const [location] = useLocation();

  const menuItems = [
    { href: "/owner-portal", label: "Dashboard", icon: Home, testId: "nav-owner-dashboard" },
    { href: "/owner-portal/properties", label: "My Properties", icon: Building2, testId: "nav-owner-properties" },
    { href: "/owner-portal/units", label: "My Units", icon: Grid3x3, testId: "nav-owner-units" },
    { href: "/owner-portal/payments", label: "Payments", icon: DollarSign, testId: "nav-owner-payments" },
    { href: "/owner-portal/leases", label: "Leases", icon: FileText, testId: "nav-owner-leases" },
    { href: "/owner-portal/maintenance", label: "Maintenance", icon: Wrench, testId: "nav-owner-maintenance" },
    { href: "/owner-portal/reports", label: "Financial Reports", icon: TrendingUp, testId: "nav-owner-reports" },
    { href: "/payouts", label: "Payouts", icon: Wallet, testId: "nav-owner-payouts" },
    { href: "/owner-portal/settings", label: "Settings", icon: Settings, testId: "nav-owner-settings" },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <Link href="/">
          <a className="flex items-center gap-2" data-testid="link-home">
            <Building2 className="h-6 w-6 text-primary" />
            <span className="font-semibold text-lg">PropertyFlows</span>
          </a>
        </Link>
        <p className="text-xs text-muted-foreground mt-1">Owner Portal</p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
                data-testid={item.testId}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        <a
          href="/api/logout"
          className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          data-testid="link-logout"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </a>
      </div>
    </aside>
  );
}
