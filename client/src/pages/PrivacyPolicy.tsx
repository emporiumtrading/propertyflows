import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Shield } from "lucide-react";

export default function PrivacyPolicy() {
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

      <section className="px-4 py-16 max-w-4xl mx-auto prose prose-slate dark:prose-invert">
        <div className="text-center not-prose mb-12">
          <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl md:text-6xl font-bold mb-4" data-testid="heading-privacy">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground">Last updated: October 2, 2025</p>
        </div>

        <h2>Introduction</h2>
        <p>
          PropertyFlows ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains
          how we collect, use, disclose, and safeguard your information when you use our property management platform.
        </p>

        <h2>Information We Collect</h2>
        <h3>Personal Information</h3>
        <p>We collect information that you provide directly to us, including:</p>
        <ul>
          <li>Name, email address, phone number</li>
          <li>Property and unit information</li>
          <li>Payment and banking information</li>
          <li>Lease agreements and documents</li>
          <li>Communication preferences</li>
        </ul>

        <h3>Automatically Collected Information</h3>
        <p>We automatically collect certain information when you use our platform:</p>
        <ul>
          <li>Log data and usage information</li>
          <li>Device and browser information</li>
          <li>IP address and location data</li>
          <li>Cookies and similar tracking technologies</li>
        </ul>

        <h2>How We Use Your Information</h2>
        <p>We use the information we collect to:</p>
        <ul>
          <li>Provide and maintain our services</li>
          <li>Process payments and transactions</li>
          <li>Send notifications and communications</li>
          <li>Improve and optimize our platform</li>
          <li>Comply with legal obligations</li>
        </ul>

        <h2>Information Sharing</h2>
        <p>We do not sell your personal information. We may share information with:</p>
        <ul>
          <li>Service providers (Stripe, Twilio, QuickBooks)</li>
          <li>Legal authorities when required by law</li>
          <li>Other users as necessary for platform functionality</li>
        </ul>

        <h2>Data Security</h2>
        <p>
          We implement industry-standard security measures including encryption, secure servers, and regular security audits
          to protect your information.
        </p>

        <h2>Your Rights</h2>
        <p>You have the right to:</p>
        <ul>
          <li>Access your personal information</li>
          <li>Correct inaccurate data</li>
          <li>Request deletion of your data</li>
          <li>Opt-out of marketing communications</li>
          <li>Export your data</li>
        </ul>

        <h2>Contact Us</h2>
        <p>
          If you have questions about this Privacy Policy, please contact us at{" "}
          <a href="mailto:privacy@propertyflows.co">privacy@propertyflows.co</a>
        </p>
      </section>
    </div>
  );
}
