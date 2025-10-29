-- Integration Categories
INSERT INTO integration_categories (id, name, slug, description, icon, sort_order) VALUES
  (gen_random_uuid(), 'Payments', 'payments', 'Payment processing and financial services', 'DollarSign', 1),
  (gen_random_uuid(), 'Accounting', 'accounting', 'Accounting and financial management systems', 'Calculator', 2),
  (gen_random_uuid(), 'Communications', 'communications', 'SMS, email, and messaging services', 'MessageSquare', 3),
  (gen_random_uuid(), 'Marketing', 'marketing', 'Listing syndication and advertising', 'Megaphone', 4),
  (gen_random_uuid(), 'Screening', 'screening', 'Background checks and tenant screening', 'UserCheck', 5),
  (gen_random_uuid(), 'AI & Automation', 'ai-automation', 'AI-powered services and automation', 'Brain', 6),
  (gen_random_uuid(), 'Legal', 'legal', 'E-signature and legal compliance', 'FileText', 7)
ON CONFLICT DO NOTHING;

-- Get category IDs for integration insertion
DO $$
DECLARE
  payments_cat_id uuid;
  accounting_cat_id uuid;
  comms_cat_id uuid;
  marketing_cat_id uuid;
  screening_cat_id uuid;
  ai_cat_id uuid;
  legal_cat_id uuid;
BEGIN
  SELECT id INTO payments_cat_id FROM integration_categories WHERE slug = 'payments';
  SELECT id INTO accounting_cat_id FROM integration_categories WHERE slug = 'accounting';
  SELECT id INTO comms_cat_id FROM integration_categories WHERE slug = 'communications';
  SELECT id INTO marketing_cat_id FROM integration_categories WHERE slug = 'marketing';
  SELECT id INTO screening_cat_id FROM integration_categories WHERE slug = 'screening';
  SELECT id INTO ai_cat_id FROM integration_categories WHERE slug = 'ai-automation';
  SELECT id INTO legal_cat_id FROM integration_categories WHERE slug = 'legal';

  -- Integrations
  INSERT INTO integrations (id, name, slug, category_id, description, long_description, status, requires_auth, auth_type, is_popular, install_count, rating) VALUES
    (gen_random_uuid(), 'Stripe', 'stripe', payments_cat_id, 
     'Secure payment processing for ACH, debit, and credit card transactions',
     'Process rent payments, security deposits, and fees with Stripe. Supports ACH, debit cards, credit cards, and digital wallets. Features instant payouts via Stripe Connect.',
     'active', true, 'oauth', true, 1250, 4.8),
    
    (gen_random_uuid(), 'QuickBooks Online', 'quickbooks', accounting_cat_id,
     'Sync transactions and financials directly to QuickBooks',
     'Automatically sync rent payments, expenses, and transactions to QuickBooks Online. Features customizable account mappings and automated reconciliation.',
     'active', true, 'oauth', true, 980, 4.6),
    
    (gen_random_uuid(), 'Twilio', 'twilio', comms_cat_id,
     'SMS notifications for rent reminders and maintenance updates',
     'Send automated SMS notifications for rent reminders, maintenance updates, lease renewals, and delinquency workflows. Includes two-way messaging support.',
     'active', true, 'api_key', true, 750, 4.7),
    
    (gen_random_uuid(), 'OpenAI', 'openai', ai_cat_id,
     'AI-powered maintenance triage and Fair Housing compliance',
     'Leverage GPT-4 for intelligent maintenance request triage, Fair Housing compliance checks, lease renewal predictions, and move-in/out photo damage analysis.',
     'active', true, 'api_key', true, 650, 4.9),
    
    (gen_random_uuid(), 'Zillow Rental Manager', 'zillow', marketing_cat_id,
     'Syndicate listings to Zillow, Trulia, and HotPads',
     'Automatically publish and sync your property listings to Zillow, Trulia, HotPads, and other major rental platforms. Includes lead tracking and application management.',
     'beta', true, 'oauth', true, 420, 4.5),
    
    (gen_random_uuid(), 'TransUnion SmartMove', 'transunion-smartmove', screening_cat_id,
     'Comprehensive tenant screening and background checks',
     'Run credit checks, criminal background checks, and eviction history reports. Includes income verification and fraud detection.',
     'active', true, 'api_key', false, 380, 4.4),
    
    (gen_random_uuid(), 'DocuSign', 'docusign', legal_cat_id,
     'E-signature solution for leases and legal documents',
     'Send, sign, and manage lease agreements digitally with legally binding e-signatures. Features audit trails and compliance tracking.',
     'active', true, 'oauth', true, 520, 4.7),
    
    (gen_random_uuid(), 'Apartments.com', 'apartments-com', marketing_cat_id,
     'List properties on Apartments.com network',
     'Syndicate listings to Apartments.com, Rent.com, and ApartmentGuide.com. Track leads and manage applications from a single dashboard.',
     'active', true, 'api_key', false, 340, 4.3),
    
    (gen_random_uuid(), 'Plaid', 'plaid', payments_cat_id,
     'Bank account verification for ACH payments',
     'Verify tenant bank accounts instantly for secure ACH rent payments. Reduces payment failures and fraud.',
     'active', true, 'api_key', false, 290, 4.6),
    
    (gen_random_uuid(), 'RentSpree', 'rentspree', screening_cat_id,
     'Tenant screening and application processing',
     'Streamline tenant applications with credit checks, background screening, and income verification. Applicant-pays option available.',
     'active', true, 'oauth', false, 210, 4.2)
  ON CONFLICT DO NOTHING;
END $$;
