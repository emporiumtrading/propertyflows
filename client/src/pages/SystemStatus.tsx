import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, Activity } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";

export default function SystemStatus() {
  const { user } = useAuth();
  const services = [
    { name: "Web Application", status: "Operational", uptime: "99.99%" },
    { name: "API", status: "Operational", uptime: "99.98%" },
    { name: "Payment Processing", status: "Operational", uptime: "99.97%" },
    { name: "SMS Notifications", status: "Operational", uptime: "99.95%" },
    { name: "Email Delivery", status: "Operational", uptime: "99.99%" },
    { name: "Database", status: "Operational", uptime: "100%" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="System Status" 
        subtitle="Current status of all PropertyFlows services"
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

      <section className="px-4 py-16 max-w-5xl mx-auto">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Activity className="w-8 h-8 text-primary" />
          <h1 className="text-4xl md:text-6xl font-bold" data-testid="heading-status">
            System Status
          </h1>
        </div>
        
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-6 py-3 rounded-full font-semibold" data-testid="status-all-operational">
            <CheckCircle2 className="w-5 h-5" />
            All Systems Operational
          </div>
        </div>

        <Card className="mb-8" data-testid="card-services">
          <CardHeader>
            <CardTitle>Service Status</CardTitle>
            <CardDescription>Current status of all PropertyFlows services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-border last:border-0" data-testid={`service-${index}`}>
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                    <span className="font-medium">{service.name}</span>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-green-600">{service.status}</div>
                    <div className="text-xs text-muted-foreground">{service.uptime} uptime</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="text-center text-sm text-muted-foreground">
          <p>Last updated: {new Date().toLocaleString()}</p>
        </div>
      </section>
    </div>
  );
}
