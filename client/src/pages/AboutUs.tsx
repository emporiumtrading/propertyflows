import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Building2, Target, Users, Heart } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/">
            <a className="text-2xl font-bold text-primary" data-testid="link-home">PropertyFlows</a>
          </Link>
          <Button 
              size="sm" 
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-get-started"
            >
              Get Started
            </Button>
        </div>
      </nav>

      <section className="px-4 py-16 max-w-5xl mx-auto">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center" data-testid="heading-about">
          About PropertyFlows
        </h1>
        <p className="text-xl text-muted-foreground text-center mb-12">
          We're building the future of property management software
        </p>

        <div className="grid md:grid-cols-2 gap-12 mb-16">
          <div data-testid="section-mission">
            <Target className="w-12 h-12 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-4">Our Mission</h2>
            <p className="text-muted-foreground">
              To democratize property management by providing transparent, affordable, and powerful tools
              that put tenants first while empowering property managers and owners.
            </p>
          </div>
          <div data-testid="section-vision">
            <Building2 className="w-12 h-12 text-primary mb-4" />
            <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
            <p className="text-muted-foreground">
              A world where property management is simple, transparent, and fair for everyone involved—
              from property managers to tenants.
            </p>
          </div>
        </div>

        <div className="bg-muted/30 rounded-lg p-8 mb-12" data-testid="section-values">
          <h2 className="text-2xl font-bold mb-6 text-center">Our Values</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <Users className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Tenant-First</h3>
              <p className="text-sm text-muted-foreground">Better tenant experience leads to better outcomes for everyone</p>
            </div>
            <div className="text-center">
              <Heart className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Transparency</h3>
              <p className="text-sm text-muted-foreground">No hidden fees, clear pricing, honest communication</p>
            </div>
            <div className="text-center">
              <Building2 className="w-10 h-10 text-primary mx-auto mb-3" />
              <h3 className="font-semibold mb-2">Innovation</h3>
              <p className="text-sm text-muted-foreground">Leveraging AI and automation to solve real problems</p>
            </div>
          </div>
        </div>

        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4" data-testid="heading-cta">Join Us</h2>
          <p className="text-muted-foreground mb-6">
            We're always looking for talented people who share our vision
          </p>
          <div className="flex gap-4 justify-center">
            <Button asChild data-testid="button-careers">
              <Link href="/careers">View Careers</Link>
            </Button>
            <Button variant="outline" asChild data-testid="button-contact">
              <Link href="/contact">Contact Us</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
