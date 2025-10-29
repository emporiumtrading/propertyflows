import OpenAI from 'openai';

let openai: OpenAI | null = null;

function getOpenAIClient() {
  if (!openai && process.env.OPENAI_API_KEY) {
    try {
      openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    } catch (error: any) {
      console.error('[OpenAI] Failed to initialize client:', {
        error: error?.message,
      });
      return null;
    }
  }
  return openai;
}

export interface MaintenanceTriageResult {
  urgencyLevel: 'low' | 'medium' | 'high' | 'emergency';
  category: string;
  rootCause: string;
  suggestedActions: string[];
  estimatedCost: number;
  selfServiceSteps: string[];
}

export async function triageMaintenanceRequest(
  description: string,
  priority: string
): Promise<MaintenanceTriageResult | null> {
  const client = getOpenAIClient();
  
  if (!client) {
    console.warn('OpenAI API key not configured - AI triage unavailable');
    return null;
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are an expert property maintenance triage assistant. Analyze maintenance requests and provide structured recommendations. Return JSON only with these fields:
{
  "urgencyLevel": "low" | "medium" | "high" | "emergency",
  "category": "plumbing" | "electrical" | "hvac" | "appliance" | "structural" | "cosmetic" | "pest" | "other",
  "rootCause": "brief explanation of likely root cause",
  "suggestedActions": ["action 1", "action 2"],
  "estimatedCost": numeric value in USD,
  "selfServiceSteps": ["step 1 tenant can try", "step 2"] or empty array if none
}`
        },
        {
          role: "user",
          content: `Maintenance Request - Priority: ${priority}\nDescription: ${description}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return result as MaintenanceTriageResult;
  } catch (error) {
    console.error('Error in AI maintenance triage:', error);
    return null;
  }
}

export async function checkFairHousingCompliance(text: string): Promise<{
  compliant: boolean;
  issues: string[];
  suggestions: string[];
}> {
  const client = getOpenAIClient();
  
  if (!client) {
    console.warn('OpenAI API key not configured - Fair Housing checker unavailable');
    return { compliant: true, issues: [], suggestions: [] };
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a Fair Housing Act compliance expert. Analyze property listing text for discriminatory language or violations. Return JSON only:
{
  "compliant": boolean,
  "issues": ["specific problematic phrase or word"],
  "suggestions": ["recommended replacement text"]
}

Flag these violations:
- Race, color, national origin discrimination
- Religious discrimination
- Familial status (e.g., "no children", "adults only" unless 55+ housing)
- Sex/gender discrimination
- Disability discrimination (e.g., "must be able to climb stairs")
- Source of income discrimination (depends on jurisdiction)

Allow: specific occupancy limits (e.g., "2 occupants maximum" for 1BR), 55+ senior housing, service animal policies.`
        },
        {
          role: "user",
          content: text
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return result;
  } catch (error) {
    console.error('Error in Fair Housing compliance check:', error);
    return { compliant: true, issues: [], suggestions: [] };
  }
}

export async function generateLeaseAddendum(
  type: 'pet' | 'parking' | 'sublease' | 'maintenance' | 'custom',
  details: Record<string, any>
): Promise<string | null> {
  const client = getOpenAIClient();
  
  if (!client) {
    console.warn('OpenAI API key not configured - Document generation unavailable');
    return null;
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a legal document drafting assistant for residential leases. Generate clear, professional lease addendums following standard legal formatting. Use plain language while maintaining legal precision.`
        },
        {
          role: "user",
          content: `Generate a ${type} addendum with these details: ${JSON.stringify(details)}`
        }
      ],
      temperature: 0.3,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error('Error generating lease addendum:', error);
    return null;
  }
}

export interface LeaseRenewalPrediction {
  churnRisk: 'low' | 'medium' | 'high' | 'critical';
  churnProbability: number;
  riskFactors: string[];
  recommendedIncentives: Array<{
    type: string;
    description: string;
    estimatedCost: number;
  }>;
  suggestedRenewalTerms: {
    rentAdjustment: number;
    termLength: number;
    specialTerms: string[];
  };
  aiReasoning: string;
}

export async function predictLeaseRenewal(leaseData: {
  monthlyRent: string;
  daysUntilExpiry: number;
  tenantDuration: number;
  paymentHistory: { onTime: number; late: number; missed: number };
  maintenanceRequests: number;
  marketRentComparison: string;
}): Promise<LeaseRenewalPrediction | null> {
  const client = getOpenAIClient();
  
  if (!client) {
    console.warn('OpenAI API key not configured - Lease renewal prediction unavailable');
    return null;
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a property management AI assistant specializing in tenant churn prediction and retention strategies. Analyze lease data and predict renewal likelihood. Return JSON only:
{
  "churnRisk": "low" | "medium" | "high" | "critical",
  "churnProbability": 0-100 percentage,
  "riskFactors": ["specific factors indicating churn risk"],
  "recommendedIncentives": [
    {
      "type": "rent_discount" | "waived_fee" | "upgrade" | "gift_card" | "flexible_terms",
      "description": "specific incentive details",
      "estimatedCost": numeric USD value
    }
  ],
  "suggestedRenewalTerms": {
    "rentAdjustment": percentage change (can be negative for discount),
    "termLength": months (6, 12, 18, or 24),
    "specialTerms": ["any special lease terms to offer"]
  },
  "aiReasoning": "brief explanation of prediction and recommendations"
}

Consider:
- Payment history (on-time vs late) is a strong indicator
- Long tenancy = lower churn risk
- Market rent comparison affects renewal sensitivity
- Maintenance request frequency can indicate satisfaction/dissatisfaction
- Days until expiry affects urgency of outreach`
        },
        {
          role: "user",
          content: `Lease Data:
- Monthly Rent: $${leaseData.monthlyRent}
- Days Until Expiry: ${leaseData.daysUntilExpiry}
- Tenant Duration: ${leaseData.tenantDuration} months
- Payment History: ${leaseData.paymentHistory.onTime} on-time, ${leaseData.paymentHistory.late} late, ${leaseData.paymentHistory.missed} missed
- Maintenance Requests: ${leaseData.maintenanceRequests}
- Market Comparison: ${leaseData.marketRentComparison}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.4,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return result as LeaseRenewalPrediction;
  } catch (error) {
    console.error('Error predicting lease renewal:', error);
    return null;
  }
}

export interface MoveInOutAnalysis {
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor' | 'damaged';
  damagesSummary: string;
  detectedDamages: Array<{
    location: string;
    damageType: string;
    severity: 'none' | 'minor' | 'moderate' | 'major' | 'severe';
    description: string;
    estimatedRepairCost: number;
  }>;
  totalEstimatedCost: number;
  recommendations: string[];
  tenantLiability: number;
}

export async function analyzeMoveInOutPhotos(
  photoUrls: string[],
  inspectionType: 'move_in' | 'move_out',
  moveInPhotos?: string[]
): Promise<MoveInOutAnalysis | null> {
  const client = getOpenAIClient();
  
  if (!client) {
    console.warn('OpenAI API key not configured - Photo analysis unavailable');
    return null;
  }

  try {
    const imageContent = photoUrls.map(url => ({
      type: "image_url" as const,
      image_url: { url }
    }));

    let systemPrompt = '';
    let userPrompt = '';

    if (inspectionType === 'move_in' || !moveInPhotos) {
      systemPrompt = `You are a professional property inspector analyzing move-in photos. Document the current condition of the unit. Return JSON only:
{
  "overallCondition": "excellent" | "good" | "fair" | "poor" | "damaged",
  "damagesSummary": "brief summary of overall condition",
  "detectedDamages": [
    {
      "location": "specific area (e.g., kitchen, living room wall, bathroom floor)",
      "damageType": "scratch" | "dent" | "stain" | "crack" | "missing" | "broken" | "wear" | "other",
      "severity": "none" | "minor" | "moderate" | "major" | "severe",
      "description": "detailed description",
      "estimatedRepairCost": numeric USD value
    }
  ],
  "totalEstimatedCost": sum of all repair costs,
  "recommendations": ["action items for landlord/tenant"],
  "tenantLiability": 0 for move-in
}`;
      userPrompt = 'Analyze these move-in photos and document any pre-existing damage or conditions.';
    } else {
      const moveInImageContent = moveInPhotos.map(url => ({
        type: "image_url" as const,
        image_url: { url }
      }));

      systemPrompt = `You are a professional property inspector comparing move-in vs move-out photos. Identify NEW damages that occurred during tenancy. Return JSON only with the same structure as move-in, but ONLY include damages that are new (not present in move-in photos). Set tenantLiability to the cost of new damages attributable to tenant beyond normal wear and tear.`;
      userPrompt = 'First images are MOVE-IN (baseline), last images are MOVE-OUT (current). Compare and identify NEW damages only.';
      
      imageContent.unshift(...moveInImageContent);
    }

    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: [
            { type: "text", text: userPrompt },
            ...imageContent
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 2000,
    });

    const result = JSON.parse(completion.choices[0].message.content || '{}');
    return result as MoveInOutAnalysis;
  } catch (error) {
    console.error('Error analyzing move-in/out photos:', error);
    return null;
  }
}

export interface GeneratedLeaseDocument {
  content: string;
  wordCount: number;
}

export async function generateLeaseDocument(leaseData: {
  propertyAddress: string;
  unitNumber: string;
  landlordName: string;
  tenantName: string;
  startDate: string;
  endDate: string;
  monthlyRent: string;
  securityDeposit: string;
  stateJurisdiction?: string;
}): Promise<GeneratedLeaseDocument | null> {
  const client = getOpenAIClient();
  
  if (!client) {
    console.warn('OpenAI API key not configured - Lease document generation unavailable');
    return null;
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional legal document assistant specializing in residential lease agreements. Generate comprehensive, legally sound lease documents following standard formatting and including all necessary clauses for residential tenancy.

Include these sections:
1. Parties and Property Information
2. Lease Term and Rent
3. Security Deposit Terms
4. Use of Premises
5. Maintenance and Repairs
6. Utilities and Services
7. Rules and Regulations
8. Entry and Inspection
9. Termination and Renewal
10. Legal Compliance
11. Signatures

Use clear, professional language. Include standard legal protections for both landlord and tenant. Format as a proper legal document with numbered sections. Include blanks for signatures and dates.`
        },
        {
          role: "user",
          content: `Generate a residential lease agreement with these details:

Property Address: ${leaseData.propertyAddress}
Unit Number: ${leaseData.unitNumber}
Landlord: ${leaseData.landlordName}
Tenant: ${leaseData.tenantName}
Lease Start Date: ${leaseData.startDate}
Lease End Date: ${leaseData.endDate}
Monthly Rent: $${leaseData.monthlyRent}
Security Deposit: $${leaseData.securityDeposit}
${leaseData.stateJurisdiction ? `State Jurisdiction: ${leaseData.stateJurisdiction}` : ''}

Please generate a complete, professional residential lease agreement.`
        }
      ],
      temperature: 0.3,
      max_tokens: 4000,
    });

    const content = completion.choices[0].message.content || '';
    const wordCount = content.split(/\s+/).length;

    return {
      content,
      wordCount
    };
  } catch (error) {
    console.error('Error generating lease document:', error);
    return null;
  }
}
