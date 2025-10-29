import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Code, Key, Book, Webhook } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";

export default function APIReference() {
  const { user } = useAuth();
  const endpoints = [
    { method: "GET", path: "/api/properties", description: "List all properties" },
    { method: "POST", path: "/api/properties", description: "Create a new property" },
    { method: "GET", path: "/api/units", description: "List all units" },
    { method: "POST", path: "/api/payments", description: "Process a payment" },
    { method: "POST", path: "/api/maintenance", description: "Create maintenance request" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="API Reference" 
        subtitle="Developer documentation for PropertyFlows API"
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
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center" data-testid="heading-api">
          API Reference
        </h1>
        <p className="text-xl text-muted-foreground text-center mb-12">
          Developer documentation for PropertyFlows API
        </p>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card data-testid="card-authentication">
            <CardHeader>
              <Key className="w-10 h-10 text-primary mb-3" />
              <CardTitle>Authentication</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>API keys and OAuth 2.0 authentication</CardDescription>
            </CardContent>
          </Card>
          <Card data-testid="card-endpoints">
            <CardHeader>
              <Code className="w-10 h-10 text-primary mb-3" />
              <CardTitle>Endpoints</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Complete REST API endpoint documentation</CardDescription>
            </CardContent>
          </Card>
          <Card data-testid="card-webhooks">
            <CardHeader>
              <Webhook className="w-10 h-10 text-primary mb-3" />
              <CardTitle>Webhooks</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Event-driven integrations and notifications</CardDescription>
            </CardContent>
          </Card>
        </div>

        <h2 className="text-3xl font-bold mb-6" data-testid="heading-example-endpoints">Example Endpoints</h2>
        <div className="space-y-3 mb-12">
          {endpoints.map((endpoint, index) => (
            <div key={index} className="bg-muted/30 rounded-lg p-4 font-mono text-sm" data-testid={`endpoint-${index}`}>
              <span className={`font-bold mr-4 ${endpoint.method === 'GET' ? 'text-blue-600' : 'text-green-600'}`}>
                {endpoint.method}
              </span>
              <span className="text-muted-foreground">{endpoint.path}</span>
              <p className="text-xs text-muted-foreground mt-2 font-sans">{endpoint.description}</p>
            </div>
          ))}
        </div>

        <div className="text-center bg-primary text-primary-foreground rounded-lg p-8">
          <Book className="w-12 h-12 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-4">Need API Access?</h3>
          <p className="mb-6 text-primary-foreground/80">
            API access is available for Enterprise customers
          </p>
          <Button size="lg" variant="secondary" asChild data-testid="button-contact-sales">
            <Link href="/contact">Contact Sales</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
