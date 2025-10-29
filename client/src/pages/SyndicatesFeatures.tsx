import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, TrendingUp, BarChart3, Target, Zap, Users, MapPin, Eye, Bell, Smartphone, FileText, DollarSign } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";

export default function SyndicatesFeatures() {
  const { user } = useAuth();
  const features = [
    {
      icon: Globe,
      title: "Multi-Platform Syndication",
      description: "Automatically syndicate listings to Zillow, Trulia, HotPads, and other major rental platforms from one dashboard.",
    },
    {
      icon: Target,
      title: "Lead Generation",
      description: "Capture leads from multiple sources, track inquiries, and convert prospects into qualified applicants.",
    },
    {
      icon: BarChart3,
      title: "Performance Analytics",
      description: "Track listing views, click-through rates, lead sources, and conversion metrics across all platforms.",
    },
    {
      icon: Zap,
      title: "Instant Publishing",
      description: "Publish new listings to all connected platforms instantly with one-click syndication.",
    },
    {
      icon: Eye,
      title: "Listing Optimization",
      description: "AI-powered suggestions for photos, descriptions, and pricing to maximize listing visibility and inquiries.",
    },
    {
      icon: MapPin,
      title: "Geographic Targeting",
      description: "Target specific neighborhoods, cities, or regions with custom listing distribution strategies.",
    },
    {
      icon: Users,
      title: "Applicant Tracking",
      description: "Manage leads from initial inquiry through screening and lease signing in one unified system.",
    },
    {
      icon: Bell,
      title: "Lead Notifications",
      description: "Get instant SMS and email alerts when new leads come in from any syndicated platform.",
    },
    {
      icon: TrendingUp,
      title: "Market Insights",
      description: "Compare your listings to market rates, analyze competitor pricing, and optimize rental rates.",
    },
    {
      icon: FileText,
      title: "Automated Descriptions",
      description: "Generate SEO-optimized listing descriptions with AI that highlight key features and amenities.",
    },
    {
      icon: Smartphone,
      title: "Mobile Management",
      description: "Update listings, respond to leads, and track performance from your mobile device.",
    },
    {
      icon: DollarSign,
      title: "Cost-Effective",
      description: "No per-listing fees. Unlimited syndication included with your PropertyFlows subscription.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Listing Syndication Features" 
        subtitle="Maximize visibility with multi-platform syndication"
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
      <section className="px-4 py-16 bg-gradient-to-b from-pink-50 to-background dark:from-pink-950/20">
        <div className="max-w-5xl mx-auto text-center">
          <Globe className="w-16 h-16 text-pink-600 dark:text-pink-400 mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="heading-syndicates">
            Listing Syndication Features
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8" data-testid="text-description">
            Maximize your property visibility with automated multi-platform listing syndication and lead management.
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
                  <Icon className="w-10 h-10 text-pink-600 dark:text-pink-400 mb-4" />
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

      {/* Supported Platforms */}
      <section className="px-4 py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center" data-testid="heading-platforms">
            Supported Platforms
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
            {["Zillow", "Trulia", "HotPads", "Apartments.com"].map((platform) => (
              <div key={platform} className="bg-background border border-border rounded-lg p-6 text-center" data-testid={`platform-${platform.toLowerCase()}`}>
                <p className="font-semibold">{platform}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4" data-testid="heading-cta">
              Fill Vacancies Faster
            </h3>
            <p className="text-muted-foreground mb-8">
              Syndicate your listings to the platforms where renters are searching
            </p>
            <Button size="lg" asChild data-testid="button-cta-start">
              <Link href="/">Start Syndicating</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
