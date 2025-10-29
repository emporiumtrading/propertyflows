import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Book, HelpCircle, Video, FileText } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";

export default function HelpCenter() {
  const { user } = useAuth();
  const categories = [
    { icon: Book, title: "Getting Started", description: "Learn the basics of PropertyFlows", count: "12 articles", link: "#getting-started", isHash: true },
    { icon: HelpCircle, title: "Common Questions", description: "Frequently asked questions", count: "25 articles", link: "#faq", isHash: true },
    { icon: Video, title: "Video Tutorials", description: "Step-by-step video guides for all user types", count: "20+ videos", link: "/tutorials", isHash: false },
    { icon: FileText, title: "Documentation", description: "Complete platform documentation", count: "50+ guides", link: "/documentation", isHash: false },
  ];

  const gettingStartedArticles = [
    { title: "Creating Your First Property", content: "Learn how to add a property to your PropertyFlows account, including adding units, setting rent amounts, and uploading property documents." },
    { title: "Inviting Tenants", content: "Send secure invitation links to tenants, allowing them to create their accounts and access their tenant portal." },
    { title: "Setting Up Payment Methods", content: "Configure ACH, debit card, and credit card payment options for your tenants to pay rent online." },
    { title: "Creating Leases", content: "Generate digital leases with e-signature support, set lease terms, and automate renewals." },
  ];

  const faqItems = [
    { q: "How much does PropertyFlows cost?", a: "PropertyFlows offers transparent pricing starting at $99/month for up to 10 units. Payment processing fees are $0.50 for ACH, 2.9% + $0.30 for debit cards, and 3.5% + $0.30 for credit cards." },
    { q: "Can tenants pay rent with credit cards?", a: "Yes! Tenants can pay rent using ACH (bank transfer), debit cards, or credit cards. All fees are disclosed upfront with no hidden charges." },
    { q: "How does the AI maintenance triage work?", a: "Our AI analyzes maintenance requests to classify urgency, estimate costs, suggest self-service solutions, and automatically route requests to appropriate vendors." },
    { q: "Is my data secure?", a: "Absolutely. We use bank-level encryption (AES-256), secure authentication via Replit Auth, and maintain SOC 2 Type II compliance." },
    { q: "Can I integrate with QuickBooks?", a: "Yes! PropertyFlows offers direct QuickBooks Online integration with automatic transaction syncing and account mapping." },
    { q: "How do instant payouts work?", a: "Property owners can request instant payouts via Stripe Connect, receiving funds immediately instead of waiting for standard ACH transfers." },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header 
        title="Help Center" 
        subtitle="Find answers and get support"
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
        <h1 className="text-4xl md:text-6xl font-bold mb-6 text-center" data-testid="heading-help">
          Help Center
        </h1>
        <p className="text-xl text-muted-foreground text-center mb-12">
          Find answers and get support
        </p>

        <div className="grid md:grid-cols-2 gap-6 mb-16">
          {categories.map((category, index) => {
            const Icon = category.icon;
            const cardContent = (
              <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow" data-testid={`category-${index}`}>
                <CardHeader>
                  <Icon className="w-10 h-10 text-primary mb-3" />
                  <CardTitle>{category.title}</CardTitle>
                  <CardDescription>{category.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{category.count}</p>
                </CardContent>
              </Card>
            );

            if (category.isHash) {
              return (
                <a key={index} href={category.link}>
                  {cardContent}
                </a>
              );
            } else {
              return (
                <Link key={index} href={category.link}>
                  {cardContent}
                </Link>
              );
            }
          })}
        </div>

        {/* Getting Started Section */}
        <div id="getting-started" className="mb-16 scroll-mt-20">
          <h2 className="text-3xl font-bold mb-6" data-testid="heading-getting-started">
            Getting Started
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {gettingStartedArticles.map((article, index) => (
              <Card key={index} data-testid={`getting-started-${index}`}>
                <CardHeader>
                  <CardTitle className="text-lg">{article.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{article.content}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div id="faq" className="mb-16 scroll-mt-20">
          <h2 className="text-3xl font-bold mb-6" data-testid="heading-faq">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="w-full">
            {faqItems.map((item, index) => (
              <AccordionItem key={index} value={`item-${index}`} data-testid={`faq-${index}`}>
                <AccordionTrigger className="text-left">{item.q}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {item.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        <div className="text-center bg-muted/30 rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-4" data-testid="heading-contact-support">Can't find what you're looking for?</h2>
          <p className="text-muted-foreground mb-6">Our support team is here to help</p>
          <div className="flex gap-4 justify-center">
            <Button asChild data-testid="button-contact">
              <Link href="/contact">Contact Support</Link>
            </Button>
            <Button variant="outline" asChild data-testid="button-documentation">
              <Link href="/documentation">View Documentation</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
