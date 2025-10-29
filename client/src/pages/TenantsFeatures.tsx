import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CreditCard, Wrench, MessageSquare, FileText, Calendar, Smartphone, Clock, DollarSign, Shield, Bell, CheckCircle } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";

export default function TenantsFeatures() {
  const { user } = useAuth();
  const features = [
    {
      icon: CreditCard,
      title: "Easy Online Payments",
      description: "Pay rent via ACH, debit, or credit card with transparent fees. Set up autopay and never miss a payment.",
    },
    {
      icon: DollarSign,
      title: "Flexible Payment Plans",
      description: "Split rent into installments with weekly, biweekly, or monthly payment schedules (2-12 payments).",
    },
    {
      icon: Wrench,
      title: "Maintenance Requests",
      description: "Submit work orders with photos, track progress in real-time, and communicate directly with vendors.",
    },
    {
      icon: MessageSquare,
      title: "SMS Notifications",
      description: "Get text alerts for rent due dates, maintenance updates, lease renewals, and important announcements.",
    },
    {
      icon: FileText,
      title: "Digital Lease Access",
      description: "View your lease, addenda, and rental history anytime. E-sign lease renewals with one click.",
    },
    {
      icon: Calendar,
      title: "Payment History",
      description: "Access complete payment records, receipts, and downloadable statements for tax purposes.",
    },
    {
      icon: Smartphone,
      title: "Mobile-First Experience",
      description: "Manage everything from your phone with our tenant-optimized mobile interface.",
    },
    {
      icon: Clock,
      title: "24/7 Access",
      description: "Access your tenant portal anytime to make payments, submit requests, or view documents.",
    },
    {
      icon: Shield,
      title: "Secure Portal",
      description: "Bank-level encryption protects your personal information and payment details.",
    },
    {
      icon: Bell,
      title: "Customizable Alerts",
      description: "Choose how and when you want to receive notifications about rent, maintenance, and lease events.",
    },
    {
      icon: CheckCircle,
      title: "Application Tracking",
      description: "Track your rental application status and screening results in real-time.",
    },
    {
      icon: Users,
      title: "Roommate Management",
      description: "Split rent payments among roommates and track individual payment contributions.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Tenant Features" 
        subtitle="A user-friendly portal for renting made simple"
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
      <section className="px-4 py-16 bg-gradient-to-b from-purple-50 to-background dark:from-purple-950/20">
        <div className="max-w-5xl mx-auto text-center">
          <Users className="w-16 h-16 text-purple-600 dark:text-purple-400 mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="heading-tenants">
            Features for Tenants
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8" data-testid="text-description">
            A user-friendly portal designed to make renting simple, transparent, and stress-free.
          </p>
          <div className="flex gap-4 justify-center">
            <Button size="lg" asChild data-testid="button-find-rental">
              <Link href="/marketplace">Find a Rental</Link>
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-tenant-login"
            >
              Tenant Login
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
                  <Icon className="w-10 h-10 text-purple-600 dark:text-purple-400 mb-4" />
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
            Experience Renting Made Easy
          </h2>
          <p className="text-muted-foreground mb-8">
            Find your next home and enjoy a transparent, hassle-free rental experience
          </p>
          <Button size="lg" asChild data-testid="button-cta-browse">
            <Link href="/marketplace">Browse Available Units</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
