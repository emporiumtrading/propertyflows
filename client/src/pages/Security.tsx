import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Lock, Eye, Database, FileCheck, Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";

export default function Security() {
  const { user } = useAuth();
  const features = [
    {
      icon: Lock,
      title: "Bank-Level Encryption",
      description: "All data is encrypted in transit (TLS 1.3) and at rest (AES-256) using industry-standard protocols.",
    },
    {
      icon: Shield,
      title: "Secure Authentication",
      description: "OAuth 2.0 authentication with Replit Auth, ensuring secure user access and session management.",
    },
    {
      icon: Database,
      title: "Database Security",
      description: "PostgreSQL databases hosted on Neon with automated backups and point-in-time recovery.",
    },
    {
      icon: Eye,
      title: "Access Controls",
      description: "Role-based access control (RBAC) ensures users only see data relevant to their permissions.",
    },
    {
      icon: FileCheck,
      title: "Audit Logging",
      description: "Comprehensive audit trails track all system actions for compliance and security monitoring.",
    },
    {
      icon: Bell,
      title: "Security Monitoring",
      description: "24/7 monitoring for suspicious activity, with automated alerting and incident response.",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Security & Data Protection" 
        subtitle="Your data security is our top priority"
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

      <section className="px-4 py-16 max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <Shield className="w-16 h-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="heading-security">
            Security & Data Protection
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Your data security is our top priority. We implement industry-leading security measures to protect
            your information.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} data-testid={`feature-${index}`}>
                <CardHeader>
                  <Icon className="w-10 h-10 text-primary mb-3" />
                  <CardTitle>{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription>{feature.description}</CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <div className="bg-muted/30 rounded-lg p-8 mb-12">
          <h2 className="text-3xl font-bold mb-6 text-center" data-testid="heading-compliance">
            Compliance & Certifications
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div data-testid="compliance-soc2">
              <h3 className="font-semibold mb-2">SOC 2 Type II</h3>
              <p className="text-sm text-muted-foreground">Security and privacy compliance</p>
            </div>
            <div data-testid="compliance-gdpr">
              <h3 className="font-semibold mb-2">GDPR Compliant</h3>
              <p className="text-sm text-muted-foreground">European data protection standards</p>
            </div>
            <div data-testid="compliance-fairhousing">
              <h3 className="font-semibold mb-2">Fair Housing</h3>
              <p className="text-sm text-muted-foreground">AI-powered compliance checks</p>
            </div>
          </div>
        </div>

        <div className="bg-primary text-primary-foreground rounded-lg p-8 text-center">
          <h2 className="text-3xl font-bold mb-4" data-testid="heading-vulnerability">
            Vulnerability Disclosure
          </h2>
          <p className="mb-6 text-primary-foreground/80">
            Found a security issue? We appreciate responsible disclosure.
          </p>
          <Button size="lg" variant="secondary" asChild data-testid="button-report">
            <a href="mailto:security@propertyflows.co">Report a Vulnerability</a>
          </Button>
        </div>
      </section>
    </div>
  );
}
