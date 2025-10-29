interface MaintenanceCardProps {
  request: {
    id: string;
    title: string;
    description: string;
    priority: string;
    status: string;
    createdAt: string;
  };
}

export default function MaintenanceCard({ request }: MaintenanceCardProps) {
  const priorityColors = {
    urgent: "destructive",
    high: "warning",
    medium: "primary",
    low: "muted",
  };

  const priorityColor = priorityColors[request.priority as keyof typeof priorityColors] || "muted";

  return (
    <div className={`border-l-4 border-${priorityColor} bg-card rounded-r-lg p-4 border border-border`}>
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium" data-testid={`text-maintenance-title-${request.id}`}>{request.title}</p>
          <p className="text-xs text-muted-foreground mt-1" data-testid={`text-maintenance-description-${request.id}`}>
            {request.description.length > 100 ? `${request.description.substring(0, 100)}...` : request.description}
          </p>
        </div>
        <span className={`bg-${priorityColor}/10 text-${priorityColor} text-xs font-medium px-2 py-1 rounded-full`} data-testid={`badge-priority-${request.id}`}>
          {request.priority}
        </span>
      </div>
      
      <div className="flex items-center gap-2 mt-3">
        <button className="flex-1 bg-primary text-primary-foreground px-3 py-1.5 rounded text-xs font-medium hover:opacity-90" data-testid={`button-assign-vendor-${request.id}`}>
          Assign Vendor
        </button>
        <button className="px-3 py-1.5 border border-border rounded text-xs font-medium hover:bg-muted" data-testid={`button-view-details-${request.id}`}>
          View
        </button>
      </div>
    </div>
  );
}
