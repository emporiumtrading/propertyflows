import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Building2, Users, DollarSign, TrendingUp, Shield, Zap, 
  CheckCircle, ArrowRight, Target, Award, Clock, BarChart3, Download,
  Brain, FileText, Wrench, CreditCard, Lock, Globe, Sparkles, Presentation, AlertCircle
} from "lucide-react";
import html2pdf from "html2pdf.js";
import pptxgen from "pptxgenjs";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";

export default function SalesDeck() {
  const { user } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);

  const handleDownloadTXT = () => {
    const content = `
PROPERTYFLOWS - SALES DECK
AI-Powered Property Management Platform
========================================

WHY PROPERTYFLOWS?
------------------

REPLACE 5+ SYSTEMS, SAVE $6,480/YEAR

Old Stack (Monthly Costs):
- Property management software: $250/mo
- Accounting software: $100/mo
- Payment processing platform: $80/mo
- Maintenance ticketing: $60/mo
- Tenant screening: $50/mo
TOTAL: $540/month ($6,480/year)

PropertyFlows (Monthly Costs):
- Platform access: $0/month
- All features: Included
- Unlimited properties: Included
- AI automation: Included
- Pay only per transaction: ACH $0.50

ANNUAL SAVINGS: $6,480+


THE HIDDEN COSTS OF OUTDATED SYSTEMS
-------------------------------------

❌ TIME WASTED ON MANUAL WORK
- 10+ hours/week manually entering data across systems
- Copying maintenance requests to spreadsheets
- Reconciling payments between platforms
- Chasing vendors for updates via phone/email
Cost: $25,000+/year in staff time

❌ REVENUE LEAKAGE
- Late rent collection due to poor payment UX
- Maintenance cost overruns (no estimates upfront)
- Vacancy time from slow application processing
- Compliance fines from missed deadlines
Cost: 5-10% of gross revenue

❌ POOR TENANT EXPERIENCE
- No online payment options (checks/money orders)
- Maintenance request black hole (no updates)
- Can't track lease renewal or payment history
- Multiple phone calls for simple questions
Result: Higher turnover, lower renewals


PROPERTYFLOWS SOLUTIONS
-----------------------

✓ AUTOMATED OPERATIONS
- AI triages maintenance requests instantly
- Automatic payment reconciliation & accounting sync
- Vendor portal for self-service bid submission
- SMS auto-updates for rent, maintenance, leases
Savings: 80% reduction in manual data entry

✓ REVENUE PROTECTION
- Online rent payments with auto-pay (95%+ on-time)
- AI cost estimates before work starts
- Digital applications process in 24 hours
- Automatic compliance tracking & alerts
Impact: 15-20% improvement in NOI

✓ TENANT DELIGHT
- Self-service portal for payments, requests, documents
- Real-time maintenance status with photos
- Payment history, lease docs, all in one place
- 24/7 AI chatbot for instant answers
Result: 40% higher renewal rates


KEY FEATURES
------------

FOR PROPERTY MANAGERS:
- Multi-property dashboard
- Automated rent collection (ACH, card)
- Maintenance workflow with AI triage
- Vendor management & bidding
- Lease management & renewals
- Financial reporting & QuickBooks sync
- Tenant screening & applications
- Document management & e-signatures

FOR LANDLORDS/OWNERS:
- Real-time financial dashboards
- Property performance analytics
- Instant payouts via Stripe Connect
- Maintenance oversight & approval
- Tenant communication portal
- Compliance tracking & alerts

FOR TENANTS:
- Online rent payments (auto-pay available)
- Maintenance request tracking
- Document access (leases, receipts)
- AI chatbot for instant support
- Renewal & payment history

FOR VENDORS:
- Job assignment notifications
- Bid submission with file attachments
- Work documentation & photos
- Payment tracking


AI-POWERED OPERATIONS
---------------------

- Maintenance Triage: Instantly categorize and route requests
- Fair Housing Compliance: Real-time screening analysis
- Lease Renewal Predictions: Proactive tenant retention
- Move-in/Move-out Analysis: Automated photo damage assessment
- Document Copilot: AI-powered lease & document assistance
- 24/7 Chatbot: Instant answers for all user roles


INTEGRATIONS
------------

✓ Stripe: Payments & instant payouts
✓ OpenAI: AI-powered automation
✓ Twilio: SMS notifications
✓ Resend: Email delivery
✓ QuickBooks Online: Accounting sync
✓ Replit Auth: Secure authentication
✓ Object Storage: File management


TRANSPARENT PRICING
-------------------

Zero Platform Fees
- No monthly subscription costs
- No per-property fees
- No per-user fees

Pay Only Per Transaction
- ACH payments: $0.50 per transaction
- Debit card: 2.9% + $0.30
- Credit card: 2.9% + $0.30

Example Cost Breakdown (100 units):
- Average: 100 ACH transactions/month
- Cost: $50/month vs $540/month (old stack)
- Annual savings: $5,880


SECURITY & COMPLIANCE
---------------------

- Enterprise-grade security (HSTS, CSP)
- Role-based access control
- Multi-factor authentication (TOTP)
- Audit logging & e-signatures
- GDPR compliant
- Rate limiting & DDoS protection


GET STARTED
-----------

Ready to transform your property management?

Schedule a demo today: [Contact Us]
Visit: https://propertyflows.replit.app

Questions? Our team is here to help.


© ${new Date().getFullYear()} PropertyFlows - AI-Powered Property Management Platform
`;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'PropertyFlows-Sales-Deck.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = () => {
    if (!contentRef.current) return;

    const options = {
      margin: 0.5,
      filename: 'PropertyFlows-Sales-Deck.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
    };

    html2pdf().set(options).from(contentRef.current).save();
  };

  const handleDownloadPPTX = () => {
    const pres = new pptxgen();
    pres.layout = "LAYOUT_WIDE";

    // Cover Slide with visual design
    const cover = pres.addSlide();
    cover.background = { fill: "4F46E5" };
    cover.addShape(pres.ShapeType.rect, { x: 0, y: 5.5, w: "100%", h: 2, fill: { color: "6366F1", transparency: 30 }});
    cover.addText("PropertyFlows", { x: 1, y: 2.0, w: 11.33, h: 1.2, fontSize: 66, bold: true, color: "FFFFFF", align: "center", shadow: { type: "outer", blur: 8, offset: 3, angle: 45, color: "000000", opacity: 0.4 }});
    cover.addShape(pres.ShapeType.rect, { x: 3.5, y: 3.4, w: 6.33, h: 0.08, fill: { color: "FFFFFF" }});
    cover.addText("Sales Presentation", { x: 1, y: 3.8, w: 11.33, h: 0.7, fontSize: 32, color: "FFFFFF", align: "center" });
    cover.addShape(pres.ShapeType.rect, { x: 2, y: 4.8, w: 9.33, h: 0.7, fill: { color: "6366F1", transparency: 30 }, line: { color: "FFFFFF", width: 1 }});
    cover.addText("AI-Powered Property Management Platform", { x: 2, y: 4.9, w: 9.33, h: 0.5, fontSize: 18, color: "FFFFFF", align: "center" });

    // ROI Slide with cost comparison
    const roi = pres.addSlide();
    roi.background = { fill: "F0FDF4" };
    roi.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.8, fill: { color: "16A34A" }});
    roi.addText("Return on Investment", { x: 0.5, y: 0.15, w: 12.33, h: 0.5, fontSize: 36, bold: true, color: "FFFFFF" });

    // Old stack column
    roi.addShape(pres.ShapeType.rect, { x: 0.5, y: 1.2, w: 5.8, h: 3.8, fill: { color: "FEF2F2" }, line: { color: "DC2626", width: 2 }});
    roi.addText("❌ Old Stack (Monthly)", { x: 0.7, y: 1.4, w: 5.4, h: 0.4, fontSize: 18, bold: true, color: "DC2626" });
    const oldCosts = [
      { item: "Property software", cost: "$250" },
      { item: "Accounting", cost: "$100" },
      { item: "Payment platform", cost: "$80" },
      { item: "Maintenance", cost: "$60" },
      { item: "Screening", cost: "$50" }
    ];
    oldCosts.forEach((c, i) => {
      roi.addText(c.item, { x: 1, y: 2.0 + (i * 0.45), w: 3.5, h: 0.35, fontSize: 12, color: "1F2937" });
      roi.addText(c.cost, { x: 4.7, y: 2.0 + (i * 0.45), w: 1.3, h: 0.35, fontSize: 12, bold: true, color: "DC2626", align: "right" });
    });
    roi.addShape(pres.ShapeType.rect, { x: 1, y: 4.3, w: 4.8, h: 0.02, fill: { color: "DC2626" }});
    roi.addText("Total: $540/mo", { x: 1, y: 4.4, w: 4.8, h: 0.4, fontSize: 14, bold: true, color: "DC2626", align: "right" });

    // PropertyFlows column
    roi.addShape(pres.ShapeType.rect, { x: 7.03, y: 1.2, w: 5.8, h: 3.8, fill: { color: "F0FDF4" }, line: { color: "16A34A", width: 2 }});
    roi.addText("✓ PropertyFlows", { x: 7.23, y: 1.4, w: 5.4, h: 0.4, fontSize: 18, bold: true, color: "16A34A" });
    const newBenefits = [
      { item: "Platform access", cost: "$0/mo" },
      { item: "All features", cost: "✓" },
      { item: "Unlimited properties", cost: "✓" },
      { item: "AI automation", cost: "✓" },
      { item: "Pay per transaction", cost: "$0.50" }
    ];
    newBenefits.forEach((b, i) => {
      roi.addText(b.item, { x: 7.53, y: 2.0 + (i * 0.45), w: 3.5, h: 0.35, fontSize: 12, color: "1F2937" });
      roi.addText(b.cost, { x: 11.3, y: 2.0 + (i * 0.45), w: 1.3, h: 0.35, fontSize: 12, bold: true, color: "16A34A", align: "right" });
    });
    roi.addShape(pres.ShapeType.rect, { x: 7.53, y: 4.3, w: 4.8, h: 0.02, fill: { color: "16A34A" }});
    roi.addText("Savings: $540/mo", { x: 7.53, y: 4.4, w: 4.8, h: 0.4, fontSize: 14, bold: true, color: "16A34A", align: "right" });

    // Annual savings callout
    roi.addShape(pres.ShapeType.rect, { x: 3, y: 5.4, w: 7.33, h: 0.9, fill: { color: "FFFFFF" }, line: { color: "16A34A", width: 3 }});
    roi.addText("Annual Savings: $6,480+", { x: 3.2, y: 5.6, w: 6.93, h: 0.5, fontSize: 28, bold: true, color: "16A34A", align: "center" });

    // Pain Points slide
    const painPointsSlide = pres.addSlide();
    painPointsSlide.background = { fill: "FFFBEB" };
    painPointsSlide.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.8, fill: { color: "EA580C" }});
    painPointsSlide.addText("The Hidden Costs of Outdated Systems", { x: 0.5, y: 0.15, w: 12.33, h: 0.5, fontSize: 32, bold: true, color: "FFFFFF" });

    const painList = [
      { title: "⏱️ Time Wasted", desc: "10+ hrs/week on manual data entry", cost: "$25K+/yr" },
      { title: "💸 Revenue Leakage", desc: "Late payments, cost overruns, vacancies", cost: "5-10% revenue" },
      { title: "😞 Poor Tenant UX", desc: "No self-service, slow responses", cost: "High turnover" }
    ];

    painList.forEach((p, i) => {
      const y = 1.3 + (i * 1.5);
      painPointsSlide.addShape(pres.ShapeType.rect, { x: 1, y, w: 11.33, h: 1.2, fill: { color: "FEF2F2" }, line: { color: "DC2626", width: 2 }});
      painPointsSlide.addText(p.title, { x: 1.3, y: y + 0.15, w: 5, h: 0.35, fontSize: 16, bold: true, color: "DC2626" });
      painPointsSlide.addText(p.desc, { x: 1.3, y: y + 0.55, w: 7, h: 0.3, fontSize: 13, color: "4B5563" });
      painPointsSlide.addText("Cost: " + p.cost, { x: 9, y: y + 0.4, w: 3, h: 0.4, fontSize: 13, bold: true, color: "7F1D1D", align: "right" });
    });

    // Value Proposition with visual boxes
    const value = pres.addSlide();
    value.background = { fill: "F9FAFB" };
    value.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.8, fill: { color: "1E3A8A" }});
    value.addText("What PropertyFlows Delivers", { x: 0.5, y: 0.15, w: 12.33, h: 0.5, fontSize: 36, bold: true, color: "FFFFFF" });
    
    value.addShape(pres.ShapeType.rect, { x: 0.5, y: 1.2, w: 5.8, h: 3.5, fill: { color: "FEF2F2" }, line: { color: "DC2626", width: 2 }});
    value.addText("❌ Outdated Platforms", { x: 0.7, y: 1.4, w: 5.4, h: 0.4, fontSize: 20, bold: true, color: "DC2626" });
    const problems = ["Fragmented tools across 5+ systems", "Manual processes everywhere", "Poor tenant experience", "No AI capabilities"];
    problems.forEach((p, i) => {
      value.addText("• " + p, { x: 1, y: 2.0 + (i * 0.5), w: 5, h: 0.4, fontSize: 14, color: "7F1D1D" });
    });

    value.addShape(pres.ShapeType.rect, { x: 7.03, y: 1.2, w: 5.8, h: 3.5, fill: { color: "F0FDF4" }, line: { color: "16A34A", width: 2 }});
    value.addText("✓ PropertyFlows Platform", { x: 7.23, y: 1.4, w: 5.4, h: 0.4, fontSize: 20, bold: true, color: "16A34A" });
    const solutions = ["All-in-one unified platform", "AI-powered automation", "Stakeholder-centric portals", "Enterprise accounting built-in"];
    solutions.forEach((s, i) => {
      value.addText("• " + s, { x: 7.53, y: 2.0 + (i * 0.5), w: 5, h: 0.4, fontSize: 14, color: "14532D" });
    });

    // Features with colored cards
    const features = pres.addSlide();
    features.background = { fill: "FFFFFF" };
    features.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.8, fill: { color: "2563EB" }});
    features.addText("Platform Features", { x: 0.5, y: 0.15, w: 12.33, h: 0.5, fontSize: 36, bold: true, color: "FFFFFF" });

    const featuresList = [
      { emoji: "🏢", title: "Property Management", desc: "Multi-property portfolios, unit tracking", color: "DBEAFE" },
      { emoji: "📄", title: "Digital Leases", desc: "E-signatures, document storage", color: "FEF3C7" },
      { emoji: "💳", title: "Rent Collection", desc: "ACH, debit, credit with payment plans", color: "D1FAE5" },
      { emoji: "🤖", title: "AI Maintenance", desc: "GPT-4 triage, cost estimation", color: "F3E8FF" },
      { emoji: "📊", title: "Enterprise Accounting", desc: "Double-entry, P&L, Balance Sheet", color: "FCE7F3" },
      { emoji: "🔒", title: "Security & Compliance", desc: "MFA/2FA, GDPR, RBAC", color: "FEE2E2" }
    ];

    featuresList.forEach((f, i) => {
      const row = Math.floor(i / 3);
      const col = i % 3;
      const x = 0.5 + (col * 4.28);
      const y = 1.2 + (row * 1.9);
      
      features.addShape(pres.ShapeType.rect, { x, y, w: 4.0, h: 1.6, fill: { color: f.color }, line: { color: "9CA3AF", width: 1 }});
      features.addText(f.emoji, { x: x + 1.6, y: y + 0.15, w: 0.8, h: 0.6, fontSize: 36, align: "center" });
      features.addText(f.title, { x: x + 0.2, y: y + 0.8, w: 3.6, h: 0.35, fontSize: 15, bold: true, color: "1F2937", align: "center" });
      features.addText(f.desc, { x: x + 0.2, y: y + 1.2, w: 3.6, h: 0.3, fontSize: 11, color: "4B5563", align: "center" });
    });

    // Integrations with logos/badges
    const integrations = pres.addSlide();
    integrations.background = { fill: "F9FAFB" };
    integrations.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.8, fill: { color: "7C3AED" }});
    integrations.addText("Production-Ready Integrations", { x: 0.5, y: 0.15, w: 12.33, h: 0.5, fontSize: 36, bold: true, color: "FFFFFF" });

    const integrationsList = [
      { emoji: "💳", name: "Stripe", desc: "Payments & Connect payouts", color: "EDE9FE" },
      { emoji: "📗", name: "QuickBooks", desc: "OAuth2 & transaction sync", color: "DBEAFE" },
      { emoji: "🧠", name: "OpenAI GPT-4", desc: "AI automation engine", color: "D1FAE5" },
      { emoji: "📱", name: "Twilio", desc: "SMS & WhatsApp messaging", color: "FEF3C7" }
    ];

    integrationsList.forEach((int, i) => {
      const row = Math.floor(i / 2);
      const col = i % 2;
      const x = 1.5 + (col * 5.67);
      const y = 1.5 + (row * 1.8);

      integrations.addShape(pres.ShapeType.rect, { x, y, w: 4.67, h: 1.4, fill: { color: int.color }, line: { color: "9CA3AF", width: 1 }});
      integrations.addText(int.emoji, { x: x + 0.2, y: y + 0.3, w: 0.8, h: 0.8, fontSize: 36 });
      integrations.addText(int.name, { x: x + 1.1, y: y + 0.25, w: 3.4, h: 0.4, fontSize: 18, bold: true, color: "1F2937" });
      integrations.addText(int.desc, { x: x + 1.1, y: y + 0.75, w: 3.4, h: 0.5, fontSize: 13, color: "4B5563" });
    });

    // Pricing with visual cards
    const pricing = pres.addSlide();
    pricing.background = { fill: "FFFFFF" };
    pricing.addShape(pres.ShapeType.rect, { x: 0, y: 0, w: "100%", h: 0.8, fill: { color: "16A34A" }});
    pricing.addText("Transparent Pricing", { x: 0.5, y: 0.15, w: 12.33, h: 0.5, fontSize: 36, bold: true, color: "FFFFFF" });

    const pricingTiers = [
      { method: "ACH", price: "$0.50", detail: "per transaction", color: "DBEAFE" },
      { method: "Debit Card", price: "2.4%", detail: "+ $0.30 per transaction", color: "FEF3C7" },
      { method: "Credit Card", price: "2.9%", detail: "+ $0.30 per transaction", color: "FCE7F3" }
    ];

    pricingTiers.forEach((tier, i) => {
      const x = 1.5 + (i * 3.78);
      pricing.addShape(pres.ShapeType.rect, { x, y: 1.5, w: 3.2, h: 2.8, fill: { color: tier.color }, line: { color: "16A34A", width: 2 }});
      pricing.addText(tier.method, { x, y: 1.8, w: 3.2, h: 0.4, fontSize: 18, bold: true, color: "1F2937", align: "center" });
      pricing.addShape(pres.ShapeType.rect, { x: x + 0.4, y: 2.4, w: 2.4, h: 1, fill: { color: "FFFFFF" }});
      pricing.addText(tier.price, { x: x + 0.4, y: 2.5, w: 2.4, h: 0.8, fontSize: 36, bold: true, color: "16A34A", align: "center" });
      pricing.addText(tier.detail, { x, y: 3.6, w: 3.2, h: 0.4, fontSize: 11, color: "4B5563", align: "center" });
    });
    pricing.addText("All fees shown upfront • Instant payouts via Stripe Connect", { x: 1, y: 5.0, w: 11.33, h: 0.4, fontSize: 14, color: "475569", align: "center", italic: true });

    // Conclusion with CTA
    const conclusion = pres.addSlide();
    conclusion.background = { fill: "4F46E5" };
    conclusion.addShape(pres.ShapeType.rect, { x: 2, y: 1.8, w: 9.33, h: 2.4, fill: { color: "6366F1", transparency: 20 }, line: { color: "FFFFFF", width: 2 }});
    conclusion.addText("Thank You", { x: 2.2, y: 2.1, w: 8.93, h: 0.7, fontSize: 48, bold: true, color: "FFFFFF", align: "center" });
    conclusion.addText("PropertyFlows delivers everything you need", { x: 2.2, y: 2.9, w: 8.93, h: 0.5, fontSize: 20, color: "FFFFFF", align: "center" });
    conclusion.addShape(pres.ShapeType.rect, { x: 4.5, y: 3.8, w: 4.33, h: 0.6, fill: { color: "FFFFFF" }, line: { color: "FFFFFF", width: 0 }});
    conclusion.addText("Schedule a Demo Today", { x: 4.5, y: 3.85, w: 4.33, h: 0.5, fontSize: 22, bold: true, color: "4F46E5", align: "center" });
    conclusion.addText("sales@propertyflows.com", { x: 2, y: 4.7, w: 9.33, h: 0.4, fontSize: 18, color: "FFFFFF", align: "center" });

    pres.writeFile({ fileName: "PropertyFlows-Sales-Deck.pptx" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header 
        title="Sales Deck" 
        subtitle="PropertyFlows Sales Presentation"
        user={user}
      />
      <div className="container mx-auto px-4 py-12 max-w-6xl" ref={contentRef}>
        <div className="flex justify-end gap-2 mb-4">
          <Button onClick={handleDownloadTXT} variant="outline" data-testid="button-download-txt">
            <FileText className="h-4 w-4 mr-2" />
            Download Text
          </Button>
          <Button onClick={handleDownloadPDF} variant="outline" data-testid="button-download-pdf">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </Button>
          <Button onClick={handleDownloadPPTX} variant="outline" data-testid="button-download-pptx">
            <Presentation className="h-4 w-4 mr-2" />
            Download PowerPoint
          </Button>
        </div>

        {/* COVER PAGE */}
        <div className="min-h-[600px] flex flex-col items-center justify-center text-center mb-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-12 text-white">
          <Badge className="mb-6 bg-white text-blue-600" data-testid="badge-sales-deck">Sales Presentation</Badge>
          <h1 className="text-6xl font-bold mb-6" data-testid="heading-sales-deck">
            PropertyFlows
          </h1>
          <p className="text-3xl mb-8 font-light">
            Sales Deck
          </p>
          <p className="text-xl max-w-2xl mb-12 opacity-90">
            Complete property management platform with AI automation, enterprise accounting, and dedicated portals for every stakeholder
          </p>
          <div className="flex items-center gap-3 text-sm opacity-75">
            <Sparkles className="h-5 w-5" />
            <span>Modern Property Management Software</span>
          </div>
        </div>

        {/* INTRO PAGE */}
        <Card className="mb-12" data-testid="card-intro">
          <CardHeader>
            <CardTitle className="text-3xl">About This Presentation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-3">What You'll Learn</h3>
              <p className="text-muted-foreground mb-4">
                This sales deck provides a comprehensive overview of PropertyFlows, a modern property management platform designed to streamline operations, reduce costs, and improve tenant satisfaction.
              </p>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <span>Platform capabilities and how PropertyFlows solves property management challenges</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <span>Key features including AI automation, enterprise accounting, and stakeholder portals</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <span>Production-ready integrations with Stripe, QuickBooks, OpenAI, and Twilio</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 shrink-0" />
                  <span>Transparent pricing structure with no hidden fees</span>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-lg mb-3">Who This Is For</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <Building2 className="h-8 w-8 text-blue-600 mb-2" />
                  <h4 className="font-semibold mb-1">Property Managers</h4>
                  <p className="text-sm text-muted-foreground">Managing multi-unit properties and portfolios</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <Users className="h-8 w-8 text-green-600 mb-2" />
                  <h4 className="font-semibold mb-1">Landlords</h4>
                  <p className="text-sm text-muted-foreground">Individual property owners seeking efficiency</p>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <TrendingUp className="h-8 w-8 text-purple-600 mb-2" />
                  <h4 className="font-semibold mb-1">Real Estate Investors</h4>
                  <p className="text-sm text-muted-foreground">Growing portfolios with professional tools</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* ROI & Cost Savings */}
          <Card className="border-2 border-green-200 dark:border-green-800" data-testid="card-roi">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-3xl">
                <TrendingUp className="h-8 w-8 text-green-600" />
                Return on Investment
              </CardTitle>
              <CardDescription>Real cost savings for your property management business</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-green-50 dark:bg-green-950 p-6 rounded-lg">
                <h3 className="font-semibold text-xl mb-4 text-green-900 dark:text-green-100">Replace 5+ Systems with One Platform</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-red-700 dark:text-red-400 mb-3">Old Stack (Monthly Cost)</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span>Property management software</span>
                        <span className="font-semibold">$250</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Accounting software</span>
                        <span className="font-semibold">$100</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Payment processing platform</span>
                        <span className="font-semibold">$80</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Maintenance ticketing</span>
                        <span className="font-semibold">$60</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Tenant screening service</span>
                        <span className="font-semibold">$50</span>
                      </li>
                      <li className="flex justify-between border-t pt-2 font-bold text-base">
                        <span>Total Monthly Cost</span>
                        <span className="text-red-600 dark:text-red-400">$540</span>
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold text-green-700 dark:text-green-400 mb-3">PropertyFlows</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex justify-between">
                        <span>Platform access</span>
                        <span className="font-semibold">$0/month</span>
                      </li>
                      <li className="flex justify-between">
                        <span>All features included</span>
                        <span className="font-semibold">✓</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Unlimited properties & units</span>
                        <span className="font-semibold">✓</span>
                      </li>
                      <li className="flex justify-between">
                        <span>AI automation</span>
                        <span className="font-semibold">✓</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Pay only per transaction</span>
                        <span className="font-semibold">ACH $0.50</span>
                      </li>
                      <li className="flex justify-between border-t pt-2 font-bold text-base">
                        <span>Monthly Savings</span>
                        <span className="text-green-600 dark:text-green-400">$540+</span>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-white dark:bg-gray-900 rounded-lg border-2 border-green-500">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold">Annual Savings:</span>
                    <span className="text-3xl font-bold text-green-600 dark:text-green-400">$6,480</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">Plus time saved from unified platform = more properties managed with same team</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pain Points & Solutions */}
          <Card className="border-2 border-orange-200 dark:border-orange-800" data-testid="card-pain-points">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-3xl">
                <AlertCircle className="h-8 w-8 text-orange-600" />
                The Hidden Costs of Outdated Systems
              </CardTitle>
              <CardDescription>Real problems property managers face daily</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-red-600 dark:text-red-400">❌ Daily Pain Points</h3>
                    
                    <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Clock className="h-5 w-5" />
                        Time Wasted on Manual Work
                      </h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• 10+ hours/week manually entering data across systems</li>
                        <li>• Copying maintenance requests to spreadsheets</li>
                        <li>• Reconciling payments between platforms</li>
                        <li>• Chasing vendors for updates via phone/email</li>
                      </ul>
                      <p className="mt-2 text-xs font-semibold text-red-700 dark:text-red-400">Cost: $25,000+/year in staff time</p>
                    </div>

                    <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Revenue Leakage
                      </h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Late rent collection due to poor payment UX</li>
                        <li>• Maintenance cost overruns (no estimates upfront)</li>
                        <li>• Vacancy time from slow application processing</li>
                        <li>• Compliance fines from missed deadlines</li>
                      </ul>
                      <p className="mt-2 text-xs font-semibold text-red-700 dark:text-red-400">Cost: 5-10% of gross revenue</p>
                    </div>

                    <div className="bg-red-50 dark:bg-red-950 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Poor Tenant Experience
                      </h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• No online payment options (checks/money orders)</li>
                        <li>• Maintenance request black hole (no updates)</li>
                        <li>• Can't track lease renewal or payment history</li>
                        <li>• Multiple phone calls for simple questions</li>
                      </ul>
                      <p className="mt-2 text-xs font-semibold text-red-700 dark:text-red-400">Result: Higher turnover, lower renewals</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg text-green-600 dark:text-green-400">✓ PropertyFlows Solutions</h3>
                    
                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Zap className="h-5 w-5" />
                        Automated Operations
                      </h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• AI triages maintenance requests instantly</li>
                        <li>• Automatic payment reconciliation & accounting sync</li>
                        <li>• Vendor portal for self-service bid submission</li>
                        <li>• SMS auto-updates for rent, maintenance, leases</li>
                      </ul>
                      <p className="mt-2 text-xs font-semibold text-green-700 dark:text-green-400">Savings: 80% reduction in manual data entry</p>
                    </div>

                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <BarChart3 className="h-5 w-5" />
                        Revenue Protection
                      </h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Online rent payments with auto-pay (95%+ on-time)</li>
                        <li>• AI cost estimates before work starts</li>
                        <li>• Digital applications process in 24 hours</li>
                        <li>• Automatic compliance tracking & alerts</li>
                      </ul>
                      <p className="mt-2 text-xs font-semibold text-green-700 dark:text-green-400">Impact: 15-20% improvement in NOI</p>
                    </div>

                    <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <Award className="h-5 w-5" />
                        Tenant Delight
                      </h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Self-service portal for payments, requests, documents</li>
                        <li>• Real-time maintenance status with photos</li>
                        <li>• Payment history, lease docs, all in one place</li>
                        <li>• 24/7 AI chatbot for instant answers</li>
                      </ul>
                      <p className="mt-2 text-xs font-semibold text-green-700 dark:text-green-400">Result: 40% higher renewal rates</p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Core Value Proposition */}
          <Card data-testid="card-value-proposition">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-3xl">
                <Target className="h-8 w-8 text-blue-600" />
                What PropertyFlows Delivers
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-red-600">Outdated Platforms</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">✗</span>
                      <span>Separate systems for accounting, payments, and operations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">✗</span>
                      <span>Manual maintenance triage and vendor coordination</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">✗</span>
                      <span>Limited tenant self-service capabilities</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-red-500 mt-1">✗</span>
                      <span>No AI assistance for Fair Housing or compliance</span>
                    </li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-green-600">PropertyFlows Platform</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <span>Unified platform: properties, leases, payments, accounting in one system</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <span>AI-powered maintenance triage, cost estimation, and Fair Housing checks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <span>Dedicated portals for tenants, owners, vendors, and managers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                      <span>Enterprise-grade double-entry accounting with QuickBooks sync</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Features */}
          <Card data-testid="card-features">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-3xl">
                <Zap className="h-8 w-8 text-yellow-600" />
                Platform Features
              </CardTitle>
              <CardDescription>Built-in capabilities that replace multiple tools</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                    <Building2 className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="font-semibold">Property & Unit Management</h3>
                  <p className="text-sm text-muted-foreground">Multi-property portfolios with unit-level tracking, photos, amenities, and status management</p>
                </div>

                <div className="space-y-2">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                    <FileText className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="font-semibold">Digital Lease Management</h3>
                  <p className="text-sm text-muted-foreground">E-signature support, lease renewal tracking, and document storage with full audit logging</p>
                </div>

                <div className="space-y-2">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                    <CreditCard className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-semibold">Online Rent Collection</h3>
                  <p className="text-sm text-muted-foreground">ACH ($0.50), Debit (2.4% + $0.30), Credit (2.9% + $0.30) with payment plans and auto-pay</p>
                </div>

                <div className="space-y-2">
                  <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900 rounded-lg flex items-center justify-center">
                    <Wrench className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                  </div>
                  <h3 className="font-semibold">AI Maintenance Triage</h3>
                  <p className="text-sm text-muted-foreground">GPT-4 analyzes requests for urgency, category, cost estimates, and suggests self-service steps</p>
                </div>

                <div className="space-y-2">
                  <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                    <BarChart3 className="h-6 w-6 text-red-600 dark:text-red-400" />
                  </div>
                  <h3 className="font-semibold">Enterprise Accounting</h3>
                  <p className="text-sm text-muted-foreground">Double-entry bookkeeping, Chart of Accounts, Journal Entries, P&L, Balance Sheet, Cash Flow statements</p>
                </div>

                <div className="space-y-2">
                  <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                    <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                  </div>
                  <h3 className="font-semibold">Vendor Management</h3>
                  <p className="text-sm text-muted-foreground">Vendor portal for job bidding, work completion documentation, and payment tracking</p>
                </div>

                <div className="space-y-2">
                  <div className="w-12 h-12 bg-pink-100 dark:bg-pink-900 rounded-lg flex items-center justify-center">
                    <Brain className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                  </div>
                  <h3 className="font-semibold">Fair Housing Compliance</h3>
                  <p className="text-sm text-muted-foreground">AI automatically checks listings and communications for discriminatory language</p>
                </div>

                <div className="space-y-2">
                  <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-lg flex items-center justify-center">
                    <Globe className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                  </div>
                  <h3 className="font-semibold">Public Marketplace</h3>
                  <p className="text-sm text-muted-foreground">Tenant-facing marketplace for browsing available units and submitting applications</p>
                </div>

                <div className="space-y-2">
                  <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                    <Lock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <h3 className="font-semibold">Security & Compliance</h3>
                  <p className="text-sm text-muted-foreground">MFA/2FA, GDPR compliance, audit logging, CSP, HSTS, and role-based access control</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integrations */}
          <Card data-testid="card-integrations">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-3xl">
                <Award className="h-8 w-8 text-purple-600" />
                Production-Ready Integrations
              </CardTitle>
              <CardDescription>Live integrations with leading platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-blue-600" />
                    Stripe
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Full payment processing (ACH, cards), Stripe Connect for instant landlord payouts, transparent fee structure
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-green-600" />
                    QuickBooks Online
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    OAuth2 authentication, account mapping, transaction sync, automated double-entry journal entries
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Brain className="h-5 w-5 text-purple-600" />
                    OpenAI GPT-4
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Maintenance triage, Fair Housing compliance, lease renewal predictions, damage assessment, document generation
                  </p>
                </div>

                <div className="space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Zap className="h-5 w-5 text-orange-600" />
                    Twilio
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    SMS & WhatsApp messaging for rent reminders, maintenance updates, lease renewals with webhook support
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card data-testid="card-pricing">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-3xl">
                <DollarSign className="h-8 w-8 text-green-600" />
                Transparent Pricing
              </CardTitle>
              <CardDescription>Pay-as-you-grow with no hidden fees</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid md:grid-cols-3 gap-4">
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">ACH Payments</div>
                    <div className="text-2xl font-bold">$0.50</div>
                    <div className="text-xs text-muted-foreground">per transaction</div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Debit Cards</div>
                    <div className="text-2xl font-bold">2.4%</div>
                    <div className="text-xs text-muted-foreground">+ $0.30 per transaction</div>
                  </div>
                  <div className="bg-muted/50 p-4 rounded-lg">
                    <div className="text-sm text-muted-foreground mb-1">Credit Cards</div>
                    <div className="text-2xl font-bold">2.9%</div>
                    <div className="text-xs text-muted-foreground">+ $0.30 per transaction</div>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  All fees shown upfront. Instant payouts via Stripe Connect. No monthly platform fees.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* CONCLUSION PAGE */}
          <Card className="mt-12 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950 border-2" data-testid="card-conclusion">
            <CardContent className="pt-6 space-y-8">
              <div className="text-center">
                <h2 className="text-4xl font-bold mb-4">Thank You</h2>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                  PropertyFlows delivers everything you need to manage properties efficiently
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto">
                    <Building2 className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold">Unified Platform</h3>
                  <p className="text-sm text-muted-foreground">One system for all property management needs</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center mx-auto">
                    <Brain className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold">AI-Powered</h3>
                  <p className="text-sm text-muted-foreground">GPT-4 automation for operations and compliance</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="w-16 h-16 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto">
                    <Shield className="h-8 w-8" />
                  </div>
                  <h3 className="font-semibold">Enterprise-Ready</h3>
                  <p className="text-sm text-muted-foreground">Security, compliance, and integrations built-in</p>
                </div>
              </div>

              <div className="text-center space-y-6 pt-6">
                <h3 className="text-2xl font-bold">Ready to Get Started?</h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Join property managers using PropertyFlows to automate operations, reduce costs, and deliver exceptional tenant experiences
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/pricing">
                    <Button size="lg" data-testid="button-view-pricing">
                      View Pricing
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/contact">
                    <Button size="lg" variant="outline" data-testid="button-contact-sales">
                      Contact Sales
                    </Button>
                  </Link>
                </div>
                <div className="pt-6 border-t">
                  <p className="text-sm text-muted-foreground">
                    Questions? Reach out to our sales team at sales@propertyflows.com
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
