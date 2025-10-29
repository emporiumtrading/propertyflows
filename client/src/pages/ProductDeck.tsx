import { useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import { 
  Rocket, Target, Code, Database, Cloud, Lock, 
  Zap, TrendingUp, Users, Globe, CheckCircle, ArrowRight,
  Brain, Layers, GitBranch, Shield, BarChart3, Sparkles, Download,
  Building2, Package, Presentation
} from "lucide-react";
import html2pdf from "html2pdf.js";
import pptxgen from "pptxgenjs";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/Header";

export default function ProductDeck() {
  const { user } = useAuth();
  const contentRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = () => {
    if (!contentRef.current) return;

    const options = {
      margin: 0.5,
      filename: 'PropertyFlows-Product-Deck.pdf',
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' as const }
    };

    html2pdf().set(options).from(contentRef.current).save();
  };

  const handleDownloadPPTX = () => {
    const pres = new pptxgen();

    // Cover
    const cover = pres.addSlide();
    cover.background = { fill: "0891B2" };
    cover.addText("PropertyFlows", { x: 0.5, y: 2.0, w: 9, h: 1.5, fontSize: 60, bold: true, color: "FFFFFF", align: "center" });
    cover.addText("Product Deck", { x: 0.5, y: 3.5, w: 9, h: 0.8, fontSize: 36, color: "FFFFFF", align: "center" });

    // Vision
    const vision = pres.addSlide();
    vision.addText("Product Vision", { x: 0.5, y: 0.5, w: 9, h: 0.6, fontSize: 32, bold: true, color: "2563EB" });
    vision.addText("Building the operating system for modern property management", { x: 0.5, y: 1.3, w: 9, h: 0.4, fontSize: 16, color: "475569" });
    const principles = ["AI-First Architecture", "Unified Platform", "Stakeholder-Centric Design"];
    principles.forEach((p, i) => {
      vision.addText("• " + p, { x: 1.5, y: 2.5 + (i * 0.7), w: 7, h: 0.6, fontSize: 14, color: "1F2937" });
    });

    // Tech Stack
    const tech = pres.addSlide();
    tech.addText("Technical Architecture", { x: 0.5, y: 0.5, w: 9, h: 0.6, fontSize: 32, bold: true, color: "16A34A" });
    const stack = ["Frontend: React, TypeScript, Tailwind CSS", "Backend: Node.js, Express, TypeScript", "Database: PostgreSQL with Drizzle ORM", "Security: MFA/2FA, GDPR, RBAC"];
    stack.forEach((s, i) => {
      tech.addText("• " + s, { x: 1, y: 1.5 + (i * 0.7), w: 8, h: 0.6, fontSize: 12, color: "475569" });
    });

    // Integrations
    const integrations = pres.addSlide();
    integrations.addText("Production Integrations", { x: 0.5, y: 0.5, w: 9, h: 0.6, fontSize: 32, bold: true, color: "F59E0B" });
    const integ = ["Stripe - Payments + Connect payouts", "QuickBooks - OAuth + transaction sync", "OpenAI GPT-4 - AI automation", "Twilio - SMS/WhatsApp messaging"];
    integ.forEach((i, idx) => {
      integrations.addText("• " + i, { x: 1.5, y: 2.0 + (idx * 0.8), w: 7, h: 0.7, fontSize: 14, color: "1F2937" });
    });

    // Conclusion
    const conclusion = pres.addSlide();
    conclusion.background = { fill: "0891B2" };
    conclusion.addText("Built for the Future", { x: 0.5, y: 2.0, w: 9, h: 0.8, fontSize: 48, bold: true, color: "FFFFFF", align: "center" });
    conclusion.addText("Modern Stack • AI-Powered • Enterprise-Ready", { x: 1, y: 3.0, w: 8, h: 0.6, fontSize: 20, color: "FFFFFF", align: "center" });

    pres.writeFile({ fileName: "PropertyFlows-Product-Deck.pptx" });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <Header 
        title="Product Deck" 
        subtitle="PropertyFlows Product Strategy"
        user={user}
      />
      <div className="container mx-auto px-4 py-12 max-w-6xl" ref={contentRef}>
        <div className="flex justify-end gap-2 mb-4">
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
        <div className="min-h-[600px] flex flex-col items-center justify-center text-center mb-16 bg-gradient-to-br from-cyan-600 to-indigo-600 rounded-3xl p-12 text-white">
          <Badge className="mb-6 bg-white text-cyan-600" data-testid="badge-product-deck">Product Strategy</Badge>
          <h1 className="text-6xl font-bold mb-6" data-testid="heading-product-deck">
            PropertyFlows
          </h1>
          <p className="text-3xl mb-8 font-light">
            Product Deck
          </p>
          <p className="text-xl max-w-2xl mb-12 opacity-90">
            Product vision, technical architecture, and strategic roadmap for the future of property management
          </p>
          <div className="flex items-center gap-3 text-sm opacity-75">
            <Rocket className="h-5 w-5" />
            <span>Building the Operating System for Modern Property Management</span>
          </div>
        </div>

        {/* INTRO PAGE */}
        <Card className="mb-12" data-testid="card-intro">
          <CardHeader>
            <CardTitle className="text-3xl">Product Philosophy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <p className="text-lg text-muted-foreground">
              PropertyFlows is built on the belief that property management software should be intelligent, integrated, and intuitive. We're not just digitizing paperwork—we're reimagining how technology can transform every aspect of property operations.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-cyan-100 dark:bg-cyan-900 rounded-lg flex items-center justify-center">
                  <Brain className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
                </div>
                <h3 className="font-semibold">AI-First Architecture</h3>
                <p className="text-sm text-muted-foreground">
                  Intelligence baked into every feature, from maintenance triage to Fair Housing compliance
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="w-12 h-12 bg-indigo-100 dark:bg-indigo-900 rounded-lg flex items-center justify-center">
                  <Layers className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="font-semibold">Unified Platform</h3>
                <p className="text-sm text-muted-foreground">
                  One system for properties, accounting, payments, communications, and operations
                </p>
              </div>
              
              <div className="space-y-2">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-semibold">Stakeholder-Centric</h3>
                <p className="text-sm text-muted-foreground">
                  Dedicated experiences for managers, owners, tenants, and vendors with role-based access
                </p>
              </div>
            </div>

            <div className="pt-4">
              <h3 className="font-semibold text-lg mb-3">Core Principles</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-cyan-600 mt-0.5 shrink-0" />
                  <span><strong>Automate the repetitive:</strong> AI handles triage, classification, and compliance checks</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-cyan-600 mt-0.5 shrink-0" />
                  <span><strong>Integrate by default:</strong> Stripe, QuickBooks, Twilio, OpenAI built-in from day one</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-cyan-600 mt-0.5 shrink-0" />
                  <span><strong>Transparent always:</strong> No hidden fees, clear pricing, upfront cost disclosure</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="h-5 w-5 text-cyan-600 mt-0.5 shrink-0" />
                  <span><strong>Secure by design:</strong> MFA/2FA, GDPR, audit logs, role-based access control</span>
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-8">
          {/* Product Vision */}
          <Card data-testid="card-vision">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-3xl">
                <Rocket className="h-8 w-8 text-blue-600" />
                Product Vision
              </CardTitle>
              <CardDescription>Building the operating system for modern property management</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-lg leading-relaxed text-muted-foreground">
                <p className="mb-4">
                  PropertyFlows reimagines property management software for the AI era. We're building more than tools—we're creating an intelligent platform that anticipates needs, automates tedious work, and delivers exceptional experiences for every stakeholder.
                </p>
                <p>
                  Our vision: <strong className="text-foreground">Every property manager should have a 24/7 AI copilot that handles routine tasks, provides intelligent insights, and enables them to focus on what humans do best—building relationships and making strategic decisions.</strong>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Technical Architecture */}
          <Card data-testid="card-architecture">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-3xl">
                <Code className="h-8 w-8 text-green-600" />
                Technical Architecture
              </CardTitle>
              <CardDescription>Production-ready stack with modern technologies</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Globe className="h-5 w-5 text-blue-600" />
                    Frontend Stack
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span><strong>Framework:</strong> React 18 with TypeScript</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span><strong>Build Tool:</strong> Vite for fast development</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span><strong>Styling:</strong> Tailwind CSS + shadcn/ui</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span><strong>State:</strong> TanStack Query v5</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span><strong>Routing:</strong> Wouter for SPA navigation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span><strong>Forms:</strong> React Hook Form + Zod validation</span>
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Database className="h-5 w-5 text-purple-600" />
                    Backend Stack
                  </h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span><strong>Runtime:</strong> Node.js with Express</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span><strong>Language:</strong> TypeScript for type safety</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span><strong>Database:</strong> PostgreSQL (Neon)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span><strong>ORM:</strong> Drizzle for type-safe queries</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span><strong>Auth:</strong> Replit Auth (OIDC)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span><strong>Storage:</strong> Replit Object Storage (GCS)</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-600" />
                  Security & Compliance
                </h3>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>MFA/2FA with TOTP and backup codes</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Content Security Policy (CSP)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>HTTP Strict Transport Security (HSTS)</span>
                    </li>
                  </ul>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>GDPR compliance features</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Role-based access control (RBAC)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span>Comprehensive audit logging</span>
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integrations */}
          <Card data-testid="card-integrations">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-3xl">
                <Package className="h-8 w-8 text-orange-600" />
                Production Integrations
              </CardTitle>
              <CardDescription>Live connections with industry-leading platforms</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
                      </svg>
                      Stripe
                    </h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Payment processing (ACH, cards)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Stripe Connect for instant payouts</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Payment intent management</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Webhook event processing</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      QuickBooks Online
                    </h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>OAuth2 authentication flow</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Account mapping system</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Transaction sync (journal entries)</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Double-entry bookkeeping</span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      OpenAI GPT-4
                    </h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Maintenance request triage</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Fair Housing compliance checks</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Lease renewal predictions</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Document generation</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                      <Zap className="h-5 w-5" />
                      Twilio
                    </h3>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>SMS messaging for notifications</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>WhatsApp messaging support</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Webhook receiver for incoming msgs</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
                        <span>Automated rent/maintenance alerts</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Model */}
          <Card data-testid="card-data-model">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-3xl">
                <Database className="h-8 w-8 text-indigo-600" />
                Data Architecture
              </CardTitle>
              <CardDescription>Comprehensive schema supporting all operations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Core Entities</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Users (5 roles: admin, manager, landlord, tenant, vendor)</li>
                    <li>• Properties & Units</li>
                    <li>• Leases</li>
                    <li>• Maintenance Requests</li>
                    <li>• Payments & Payment Plans</li>
                  </ul>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Accounting</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Chart of Accounts</li>
                    <li>• Journal Entries</li>
                    <li>• Journal Entry Lines</li>
                    <li>• Bank Accounts</li>
                    <li>• Transactions</li>
                  </ul>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Operations</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Vendor Bids</li>
                    <li>• Work Completion Docs</li>
                    <li>• Turn Tasks (Turnboard)</li>
                    <li>• Delinquency Playbooks</li>
                    <li>• Screening Applications</li>
                  </ul>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">AI & Automation</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• AI Triage Results</li>
                    <li>• Lease Renewal Predictions</li>
                    <li>• Unit Inspections</li>
                    <li>• AI Audit Logs</li>
                    <li>• AI Artifacts</li>
                  </ul>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Security</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• MFA Settings</li>
                    <li>• Trusted Devices</li>
                    <li>• Audit Logs</li>
                    <li>• E-Signature Logs</li>
                    <li>• Sessions</li>
                  </ul>
                </div>
                
                <div className="bg-muted/50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Integrations</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• QuickBooks Connections</li>
                    <li>• Account Mappings</li>
                    <li>• Integration Connections</li>
                    <li>• Payouts (Stripe Connect)</li>
                    <li>• Onboarding Progress</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Key Metrics */}
          <Card data-testid="card-metrics">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-3xl">
                <BarChart3 className="h-8 w-8 text-cyan-600" />
                Platform Capabilities
              </CardTitle>
              <CardDescription>Production-ready system with comprehensive features</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">40+</div>
                  <div className="text-sm text-muted-foreground">Database Tables</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600 mb-2">5</div>
                  <div className="text-sm text-muted-foreground">User Roles</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600 mb-2">4</div>
                  <div className="text-sm text-muted-foreground">Live Integrations</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600 mb-2">25+</div>
                  <div className="text-sm text-muted-foreground">Core Features</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* CONCLUSION PAGE */}
        <Card className="mt-12 bg-gradient-to-br from-cyan-50 to-indigo-50 dark:from-cyan-950 dark:to-indigo-950 border-2" data-testid="card-conclusion">
          <CardContent className="pt-6 space-y-8">
            <div className="text-center">
              <h2 className="text-4xl font-bold mb-4">Built for the Future</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                PropertyFlows combines modern architecture, AI innovation, and enterprise integrations
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-cyan-600 text-white rounded-full flex items-center justify-center mx-auto">
                  <Code className="h-8 w-8" />
                </div>
                <h3 className="font-semibold">Modern Stack</h3>
                <p className="text-sm text-muted-foreground">React, TypeScript, PostgreSQL, Node.js</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-indigo-600 text-white rounded-full flex items-center justify-center mx-auto">
                  <Brain className="h-8 w-8" />
                </div>
                <h3 className="font-semibold">AI-Powered</h3>
                <p className="text-sm text-muted-foreground">GPT-4 automation across operations</p>
              </div>
              <div className="text-center space-y-2">
                <div className="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center mx-auto">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="font-semibold">Enterprise-Ready</h3>
                <p className="text-sm text-muted-foreground">Security, compliance, integrations</p>
              </div>
            </div>

            <div className="text-center space-y-6 pt-6">
              <h3 className="text-2xl font-bold">Ready to See PropertyFlows in Action?</h3>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Explore our platform's technical capabilities and see how modern architecture powers exceptional property management
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/contact">
                  <Button size="lg" data-testid="button-schedule-demo">
                    Schedule a Demo
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/features-deck">
                  <Button size="lg" variant="outline" data-testid="button-view-features">
                    View Features Deck
                  </Button>
                </Link>
              </div>
              <div className="pt-6 border-t">
                <p className="text-sm text-muted-foreground">
                  Technical questions? Reach out at tech@propertyflows.com
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
