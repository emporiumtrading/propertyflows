interface StatsCardProps {
  title: string;
  value: string;
  icon: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  testId?: string;
}

export default function StatsCard({ title, value, icon, trend, testId }: StatsCardProps) {
  return (
    <div className="bg-card rounded-lg border border-border p-6 card-hover" data-testid={testId}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-3xl font-bold mt-2 font-mono" data-testid={`${testId}-value`}>{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center bg-${icon === 'building' ? 'primary' : icon === 'chart-line' ? 'chart-5' : icon === 'dollar-sign' ? 'secondary' : 'accent'}/10`}>
          <i className={`fas fa-${icon} text-xl`} />
        </div>
      </div>
      {trend && (
        <div className="flex items-center gap-2 text-sm">
          <span className={`flex items-center gap-1 font-medium ${trend.isPositive ? 'text-chart-5' : 'text-destructive'}`}>
            <i className={`fas fa-arrow-${trend.isPositive ? 'up' : 'down'} text-xs`} />
            <span>{trend.value}</span>
          </span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
      )}
    </div>
  );
}
