import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";

export default function Pricing() {
  const plans = [
    {
      name: "Starter",
      price: "$99",
      period: "/month",
      description: "Perfect for individual landlords",
      features: [
        "Up to 10 units",
        "Online rent collection (ACH, card)",
        "Maintenance tracking",
        "Tenant portal",
        "Owner portal",
        "Basic reporting",
        "Email support",
      ],
    },
    {
      name: "Professional",
      price: "$249",
      period: "/month",
      description: "For growing property managers",
      popular: true,
      features: [
        "Up to 50 units",
        "Everything in Starter",
        "AI-powered maintenance triage",
        "Fair Housing compliance",
        "SMS notifications",
        "QuickBooks integration",
        "Delinquency automation",
        "Priority support",
      ],
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "",
      description: "For large portfolios",
      features: [
        "Unlimited units",
        "Everything in Professional",
        "Listing syndication",
        "Custom integrations",
        "White-label option",
        "Dedicated account manager",
        "24/7 phone support",
        "SLA guarantees",
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/">
            <a className="text-2xl font-bold text-primary" data-testid="link-home">
              PropertyFlows
            </a>
          </Link>
          <div className="flex gap-4">
            <Link href="/features">
              <a className="text-sm text-muted-foreground hover:text-foreground" data-testid="link-features">
                Features
              </a>
            </Link>
            <Button 
              size="sm" 
              onClick={() => window.location.href = '/api/login'}
              data-testid="button-get-started"
            >
              Get Started
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="px-4 py-16 bg-gradient-to-b from-background to-muted/20">
        <div className="max-w-5xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6" data-testid="heading-pricing">
            Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8" data-testid="text-pricing-description">
            No hidden fees. No surprises. Choose the plan that fits your portfolio.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="px-4 py-16 max-w-7xl mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.popular ? "border-primary shadow-lg" : ""}
              data-testid={`card-plan-${plan.name.toLowerCase()}`}
            >
              {plan.popular && (
                <div className="bg-primary text-primary-foreground text-center py-2 text-sm font-semibold">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold" data-testid={`text-price-${plan.name.toLowerCase()}`}>
                    {plan.price}
                  </span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2" data-testid={`feature-${plan.name.toLowerCase()}-${index}`}>
                      <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className="w-full"
                  variant={plan.popular ? "default" : "outline"}
                  onClick={() => plan.price === "Custom" ? window.location.href = '/contact' : window.location.href = '/api/login'}
                  data-testid={`button-select-${plan.name.toLowerCase()}`}
                >
                  {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Payment Processing Fees */}
      <section className="px-4 py-16 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center" data-testid="heading-payment-fees">
            Payment Processing Fees
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card data-testid="card-ach-fees">
              <CardHeader>
                <CardTitle>ACH/Bank Transfer</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-2">$0.50</p>
                <p className="text-sm text-muted-foreground">per transaction</p>
              </CardContent>
            </Card>
            <Card data-testid="card-debit-fees">
              <CardHeader>
                <CardTitle>Debit Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-2">2.9%</p>
                <p className="text-sm text-muted-foreground">+ $0.30 per transaction</p>
              </CardContent>
            </Card>
            <Card data-testid="card-credit-fees">
              <CardHeader>
                <CardTitle>Credit Card</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold mb-2">3.5%</p>
                <p className="text-sm text-muted-foreground">+ $0.30 per transaction</p>
              </CardContent>
            </Card>
          </div>
          <p className="text-center text-sm text-muted-foreground mt-6">
            All fees are passed directly from Stripe. PropertyFlows doesn't mark up payment processing.
          </p>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        <h2 className="text-3xl font-bold mb-8 text-center" data-testid="heading-faq">
          Frequently Asked Questions
        </h2>
        <div className="space-y-6">
          <div data-testid="faq-trial">
            <h3 className="font-semibold mb-2">Is there a free trial?</h3>
            <p className="text-muted-foreground">Yes! All plans include a 14-day free trial. No credit card required.</p>
          </div>
          <div data-testid="faq-cancel">
            <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
            <p className="text-muted-foreground">
              Absolutely. Cancel anytime with no penalties. Your data is always yours.
            </p>
          </div>
          <div data-testid="faq-upgrade">
            <h3 className="font-semibold mb-2">Can I upgrade or downgrade my plan?</h3>
            <p className="text-muted-foreground">
              Yes, you can change plans at any time. Prorated refunds and charges apply.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-4 py-16 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4" data-testid="heading-cta">
            Ready to Get Started?
          </h2>
          <p className="mb-8 text-primary-foreground/80">
            Start your 14-day free trial today. No credit card required.
          </p>
          <Button 
            size="lg" 
            variant="secondary" 
            onClick={() => window.location.href = '/api/login'}
            data-testid="button-cta-trial"
          >
            Start Free Trial
          </Button>
        </div>
      </section>
    </div>
  );
}
