import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "warning" | "success";
}

export default function StatCard({ title, value, icon, subtitle, trend, variant = "default" }: StatCardProps) {
  const variantColors = {
    default: "bg-primary/10 text-primary",
    warning: "bg-accent/10 text-accent",
    success: "bg-secondary/10 text-secondary",
  };

  return (
    <div className="bg-card rounded-lg border border-border p-6 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-secondary" />
      
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${variantColors[variant]}`}>
          {icon}
        </div>
      </div>
      
      {trend && (
        <div className="flex items-center gap-2 text-sm">
          {trend.isPositive ? (
            <TrendingUp className="w-4 h-4 text-green-600" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-600" />
          )}
          <span className={trend.isPositive ? "text-green-600" : "text-red-600"}>
            {trend.value}%
          </span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
      )}
      
      {subtitle && <p className="text-sm text-muted-foreground mt-2">{subtitle}</p>}
    </div>
  );
}
