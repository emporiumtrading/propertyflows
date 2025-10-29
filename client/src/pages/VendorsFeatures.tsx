import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wrench, Briefcase, DollarSign, Camera, FileText, Bell, Smartphone, Calendar, TrendingUp, CheckCircle, MapPin, Clock } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";

export default function VendorsFeatures() {
  const { user } = useAuth();
  const features = [
    {
      icon: Briefcase,
      title: "Job Assignment Dashboard",
      description: "View all assigned work orders in one place with priority levels, due dates, and property locations.",
    },
    {
      icon: DollarSign,
      title: "Bid Submission System",
      description: "Submit competitive bids for maintenance projects with detailed cost breakdowns and estimated timelines.",
    },
    {
      icon: Camera,
      title: "Photo Documentation",
      description: "Upload before/after photos, progress updates, and damage documentation directly to work orders.",
    },
    {
      icon: FileText,
      title: "Invoice Management",
      description: "Submit invoices with line-item details, attach receipts, and track payment status in real-time.",
    },
    {
      icon: CheckCircle,
      title: "Work Completion Workflow",
      description: "Mark jobs complete with notes, photos, and invoices. Get instant notifications when approved.",
    },
    {
      icon: Bell,
      title: "Real-Time Notifications",
      description: "Receive SMS and email alerts for new job assignments, bid approvals, and payment confirmations.",
    },
    {
      icon: MapPin,
      title: "Property Access Details",
      description: "Get property addresses, access instructions, tenant contact info, and parking details for each job.",
    },
    {
      icon: Calendar,
      title: "Schedule Management",
      description: "View upcoming jobs, set availability, and coordinate with property managers on timing.",
    },
    {
      icon: TrendingUp,
      title: "Performance Tracking",
      description: "Track completed jobs, average response times, and customer ratings to build your reputation.",
    },
    {
      icon: Smartphone,
      title: "Mobile-Optimized",
      description: "Access your vendor dashboard from any device with full functionality on mobile.",
    },
    {
      icon: DollarSign,
      title: "Fast Payments",
      description: "Get paid quickly via ACH transfer once work is approved. No more chasing checks.",
    },
    {
      icon: Clock,
      title: "24/7 Portal Access",
      description: "Submit bids, update job status, and upload invoices anytime, even after business hours.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Vendor Features" 
        subtitle="Streamlined job management and faster payments"
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

      {/* Hero */}
      <section className="px-4 py-16 bg-gradient-to-b from-orange-50 to-background dark:from-orange-950/20">
        <div className="max-w-5xl mx-auto text-center">
          <Wrench className="w-16 h-16 text-orange-600 dark:text-orange-400 mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="heading-vendors">
            Features for Vendors
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8" data-testid="text-description">
            Streamlined job management, faster payments, and tools to grow your maintenance business.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-join-network"
            >
              Join Vendor Network
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-vendor-login"
            >
              Vendor Login
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="px-4 py-16 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card key={feature.title} data-testid={`feature-${feature.title.toLowerCase().replace(/\s+/g, '-')}`}>
                <CardHeader>
                  <Icon className="w-10 h-10 text-orange-600 dark:text-orange-400 mb-4" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4" data-testid="heading-cta">
            Grow Your Maintenance Business
          </h2>
          <p className="text-muted-foreground mb-8">
            Join our vendor network and get access to steady work from property managers
          </p>
          <Button size="lg" asChild data-testid="button-cta-join">
            <Link href="/">Join Vendor Network</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
