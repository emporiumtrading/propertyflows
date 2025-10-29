import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";

export default function TermsOfService() {
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
          <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
          <h1 className="text-4xl md:text-6xl font-bold mb-4" data-testid="heading-terms">
            Terms of Service
          </h1>
          <p className="text-muted-foreground">Last updated: October 2, 2025</p>
        </div>

        <h2>1. Acceptance of Terms</h2>
        <p>
          By accessing and using PropertyFlows, you accept and agree to be bound by these Terms of Service.
          If you do not agree to these terms, please do not use our service.
        </p>

        <h2>2. Description of Service</h2>
        <p>
          PropertyFlows provides a cloud-based property management platform that includes features for rent collection,
          maintenance tracking, lease management, tenant screening, and related services.
        </p>

        <h2>3. User Accounts</h2>
        <p>To use PropertyFlows, you must:</p>
        <ul>
          <li>Be at least 18 years old</li>
          <li>Provide accurate and complete registration information</li>
          <li>Maintain the security of your account credentials</li>
          <li>Accept responsibility for all activities under your account</li>
        </ul>

        <h2>4. Acceptable Use</h2>
        <p>You agree not to:</p>
        <ul>
          <li>Violate any laws or regulations</li>
          <li>Infringe on intellectual property rights</li>
          <li>Transmit malware or harmful code</li>
          <li>Attempt to gain unauthorized access to our systems</li>
          <li>Use the service for fraudulent purposes</li>
        </ul>

        <h2>5. Payment Terms</h2>
        <p>
          Subscription fees are billed monthly or annually as selected. Payment processing fees apply to tenant
          rent payments as disclosed on our pricing page. All fees are non-refundable except as required by law.
        </p>

        <h2>6. Data Ownership</h2>
        <p>
          You retain ownership of all data you input into PropertyFlows. We claim no ownership rights to your content.
          You grant us a license to use your data solely to provide our services.
        </p>

        <h2>7. Service Availability</h2>
        <p>
          While we strive for 99.9% uptime, we do not guarantee uninterrupted access to our service. We reserve the
          right to modify or discontinue features with reasonable notice.
        </p>

        <h2>8. Limitation of Liability</h2>
        <p>
          PropertyFlows is provided "as is" without warranties. We are not liable for indirect, incidental, or
          consequential damages arising from your use of our service.
        </p>

        <h2>9. Termination</h2>
        <p>
          You may cancel your account at any time. We may suspend or terminate accounts that violate these terms.
          Upon termination, you may export your data within 30 days.
        </p>

        <h2>10. Changes to Terms</h2>
        <p>
          We may update these terms from time to time. Continued use of PropertyFlows after changes constitutes
          acceptance of the new terms.
        </p>

        <h2>11. Contact Information</h2>
        <p>
          For questions about these Terms of Service, contact us at{" "}
          <a href="mailto:legal@propertyflows.co">legal@propertyflows.co</a>
        </p>
      </section>
    </div>
  );
}
