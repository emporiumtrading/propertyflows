import { Link, useLocation } from "wouter";
import { Home, Wrench, DollarSign, FileCheck, MessageSquare, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export default function VendorSidebar() {
  const [location] = useLocation();

  const navItems = [
    { href: "/vendor-portal", icon: Home, label: "Dashboard", testId: "nav-vendor-dashboard" },
    { href: "/vendor-portal/jobs", icon: Wrench, label: "My Jobs", testId: "nav-vendor-jobs" },
    { href: "/vendor-portal/bids", icon: DollarSign, label: "My Bids", testId: "nav-vendor-bids" },
    { href: "/vendor-portal/completed", icon: FileCheck, label: "Completed Work", testId: "nav-vendor-completed" },
    { href: "/vendor-portal/finance", icon: DollarSign, label: "Finance", testId: "nav-vendor-finance" },
    { href: "/vendor-portal/settings", icon: Settings, label: "Settings", testId: "nav-vendor-settings" },
  ];

  return (
    <aside className="w-64 bg-card border-r border-border flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-2xl font-bold text-primary" data-testid="text-vendor-sidebar-logo">
          PropertyFlows
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Vendor Portal</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.href;

          return (
            <Link key={item.href} href={item.href}>
              <a
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  "hover:bg-muted",
                  isActive && "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
                data-testid={item.testId}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
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
