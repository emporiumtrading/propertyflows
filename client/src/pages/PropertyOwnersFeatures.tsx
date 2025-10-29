import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, DollarSign, FileText, BarChart3, Eye, Bell, Smartphone, Clock, Shield, CreditCard, PieChart, Briefcase } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";

export default function PropertyOwnersFeatures() {
  const { user } = useAuth();
  const features = [
    {
      icon: BarChart3,
      title: "Real-Time Performance Dashboard",
      description: "Track rental income, expenses, occupancy rates, and NOI (Net Operating Income) with interactive charts and reports.",
    },
    {
      icon: DollarSign,
      title: "Instant Payouts",
      description: "Request instant transfers via Stripe Connect and receive rental income directly to your bank account within minutes.",
    },
    {
      icon: Eye,
      title: "Complete Visibility",
      description: "Monitor all property activities, maintenance requests, lease expirations, and tenant communications in real-time.",
    },
    {
      icon: FileText,
      title: "Document Management",
      description: "Access leases, inspection reports, financial statements, and tax documents anytime, anywhere.",
    },
    {
      icon: PieChart,
      title: "Expense Tracking",
      description: "Categorize expenses, attach receipts, and generate tax-ready reports with QuickBooks integration.",
    },
    {
      icon: CreditCard,
      title: "Automated Rent Collection",
      description: "Set up automatic rent collection with ACH, debit, or credit card payments and reduce late payments.",
    },
    {
      icon: Bell,
      title: "Smart Notifications",
      description: "Receive SMS and email alerts for rent payments, maintenance issues, lease renewals, and important property events.",
    },
    {
      icon: Briefcase,
      title: "Portfolio Management",
      description: "Manage multiple properties across different locations with consolidated reporting and analytics.",
    },
    {
      icon: Shield,
      title: "Tenant Screening",
      description: "Review comprehensive background checks, credit reports, and income verification for prospective tenants.",
    },
    {
      icon: TrendingUp,
      title: "ROI Analysis",
      description: "Track cash-on-cash returns, cap rates, and property appreciation with built-in investment calculators.",
    },
    {
      icon: Clock,
      title: "Maintenance Transparency",
      description: "Monitor work orders from request to completion with photo documentation and vendor invoices.",
    },
    {
      icon: Smartphone,
      title: "Mobile App Access",
      description: "Manage your properties from anywhere with full-featured mobile apps for iOS and Android.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Property Owner Features" 
        subtitle="Complete visibility and control over your investments"
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
      <section className="px-4 py-16 bg-gradient-to-b from-green-50 to-background dark:from-green-950/20">
        <div className="max-w-5xl mx-auto text-center">
          <TrendingUp className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="heading-property-owners">
            Features for Property Owners
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8" data-testid="text-description">
            Complete visibility and control over your real estate investments with transparent reporting and instant payouts.
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              size="lg" 
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-start-trial"
            >
              Start Free Trial
            </Button>
            <Button size="lg" variant="outline" asChild data-testid="button-view-pricing">
              <Link href="/pricing">View Pricing</Link>
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
                  <Icon className="w-10 h-10 text-green-600 dark:text-green-400 mb-4" />
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
            Maximize Your Investment Returns
          </h2>
          <p className="text-muted-foreground mb-8">
            Get the insights and control you need to make better investment decisions
          </p>
          <Button size="lg" asChild data-testid="button-cta-start">
            <Link href="/">Start Free Trial</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
