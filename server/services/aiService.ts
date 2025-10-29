import OpenAI from 'openai';
import type { User } from '@shared/schema';
import { storage } from '../storage';

let openai: OpenAI | null = null;

function getOpenAIClient() {
  if (!openai && process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }
  return openai;
}

export interface ChatbotContext {
  userRole: string;
  userId: string;
  availableData: {
    properties?: any[];
    units?: any[];
    leases?: any[];
    payments?: any[];
    maintenanceRequests?: any[];
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  message: string;
  tokensUsed?: number;
  cost?: number;
}

const ROLE_SYSTEM_PROMPTS: Record<string, string> = {
  admin: `You are PropertyFlows AI Assistant for platform administrators. You have full access to system-wide data and can help with:
- Platform analytics and metrics
- User management and support
- System configuration
- Troubleshooting issues
- Feature usage insights
- Performance optimization

Provide clear, actionable guidance. Refer to specific data when available. Be professional and efficient.`,

  property_manager: `You are PropertyFlows AI Assistant for property managers. You can help with:
- Managing properties, units, and leases
- Tenant communication and support
- Maintenance request triage and coordination
- Payment tracking and collections
- Screening applicants
- Generating reports and insights
- Lease renewals and terminations

Be proactive in suggesting improvements and identifying issues. Use data-driven insights.`,

  landlord: `You are PropertyFlows AI Assistant for property owners. You can help with:
- Property performance insights
- Financial analytics and forecasting
- Rent optimization recommendations
- Occupancy tracking
- Maintenance cost analysis
- Investment decisions
- Tax and accounting questions

Focus on ROI, financial health, and strategic recommendations. Be concise and data-focused.`,

  tenant: `You are PropertyFlows AI Assistant for tenants. You can help with:
- Viewing lease details and payment history
- Submitting and tracking maintenance requests
- Understanding rent payments and charges
- Lease renewal questions
- Property rules and policies
- Payment plan options

Be friendly, helpful, and clear. Explain processes simply. Prioritize tenant experience.`,

  vendor: `You are PropertyFlows AI Assistant for vendors. You can help with:
- Viewing assigned jobs and work orders
- Submitting bids for maintenance requests
- Uploading work completion documentation
- Tracking payment status
- Understanding job requirements
- Communication with property managers

Be clear about requirements and deadlines. Help optimize work efficiency.`
};

export async function chatWithAssistant(
  user: User,
  userMessage: string,
  previousMessages: ChatMessage[]
): Promise<ChatResponse> {
  const client = getOpenAIClient();
  
  if (!client) {
    throw new Error('OpenAI API key not configured');
  }

  const context: ChatbotContext = {
    userRole: user.role || 'property_manager',
    userId: user.id,
    availableData: {
      properties: [],
      units: [],
      leases: [],
      payments: [],
      maintenanceRequests: [],
    }
  };

  const systemPrompt = ROLE_SYSTEM_PROMPTS[context.userRole] || ROLE_SYSTEM_PROMPTS.property_manager;
  
  const contextMessage = buildContextMessage(context);

  const messages: ChatMessage[] = [
    ...previousMessages.map(m => ({ role: m.role, content: m.content })),
    { role: 'user' as const, content: userMessage }
  ];

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "system", content: contextMessage },
        ...messages
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const responseMessage = completion.choices[0].message.content || "I'm sorry, I couldn't generate a response.";
    const tokensUsed = completion.usage?.total_tokens;
    const cost = tokensUsed ? calculateCost(tokensUsed, "gpt-4o-mini") : undefined;

    await logAiUsage({
      userId: user.id,
      action: 'chatbot_message',
      prompt: userMessage,
      response: responseMessage,
      tokensUsed,
      cost,
    });

    return {
      message: responseMessage,
      tokensUsed,
      cost,
    };
  } catch (error) {
    console.error('Error in chatbot:', error);
    throw new Error('Failed to generate response');
  }
}

function buildContextMessage(context: ChatbotContext): string {
  const parts: string[] = ['Current context:'];

  if (context.availableData.properties && context.availableData.properties.length > 0) {
    parts.push(`\nProperties: ${context.availableData.properties.length} total`);
  }

  if (context.availableData.units && context.availableData.units.length > 0) {
    const occupied = context.availableData.units.filter(u => u.status === 'occupied').length;
    const vacant = context.availableData.units.filter(u => u.status === 'vacant').length;
    parts.push(`\nUnits: ${context.availableData.units.length} total (${occupied} occupied, ${vacant} vacant)`);
  }

  if (context.availableData.leases && context.availableData.leases.length > 0) {
    const active = context.availableData.leases.filter(l => l.status === 'active').length;
    parts.push(`\nLeases: ${context.availableData.leases.length} total (${active} active)`);
  }

  if (context.availableData.payments && context.availableData.payments.length > 0) {
    const pending = context.availableData.payments.filter(p => p.status === 'pending').length;
    parts.push(`\nPayments: ${context.availableData.payments.length} total (${pending} pending)`);
  }

  if (context.availableData.maintenanceRequests && context.availableData.maintenanceRequests.length > 0) {
    const open = context.availableData.maintenanceRequests.filter(m => m.status === 'open').length;
    parts.push(`\nMaintenance Requests: ${context.availableData.maintenanceRequests.length} total (${open} open)`);
  }

  return parts.join('');
}

function calculateCost(tokens: number, model: string): number {
  const pricing: Record<string, { input: number; output: number }> = {
    'gpt-4o': { input: 0.0025, output: 0.01 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-4': { input: 0.03, output: 0.06 },
  };

  const modelPricing = pricing[model] || pricing['gpt-4o-mini'];
  const avgCost = (modelPricing.input + modelPricing.output) / 2;
  
  return (tokens / 1000) * avgCost;
}

async function logAiUsage(data: {
  userId: string;
  action: string;
  prompt?: string;
  response?: string;
  tokensUsed?: number;
  cost?: number;
  entityType?: string;
  entityId?: string;
}) {
  try {
    await storage.createAiAuditLog({
      userId: data.userId,
      action: data.action,
      entityType: data.entityType,
      entityId: data.entityId,
      prompt: data.prompt,
      response: data.response,
      metadata: null,
      tokensUsed: data.tokensUsed,
      cost: data.cost?.toString(),
    });
  } catch (error) {
    console.error('Failed to log AI usage:', error);
  }
}

export async function generateSmartReply(
  originalMessage: string,
  conversationHistory: ChatMessage[],
  context: ChatbotContext
): Promise<string> {
  const client = getOpenAIClient();
  
  if (!client) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: `You are a professional property management communication assistant. Generate a helpful, friendly, and professional reply to tenant/owner messages. Be concise but warm. Address their concerns directly.`
        },
        ...conversationHistory.slice(-5),
        {
          role: "user",
          content: `Generate a professional reply to this message: "${originalMessage}"`
        }
      ],
      temperature: 0.7,
      max_tokens: 300,
    });

    const reply = completion.choices[0].message.content || '';
    
    await logAiUsage({
      userId: context.userId,
      action: 'smart_reply_generation',
      prompt: originalMessage,
      response: reply,
      tokensUsed: completion.usage?.total_tokens,
      cost: completion.usage?.total_tokens ? calculateCost(completion.usage.total_tokens, 'gpt-4o-mini') : undefined,
    });

    return reply;
  } catch (error) {
    console.error('Error generating smart reply:', error);
    throw new Error('Failed to generate reply');
  }
}

export async function summarizeConversation(
  messages: ChatMessage[],
  userId: string
): Promise<string> {
  const client = getOpenAIClient();
  
  if (!client) {
    throw new Error('OpenAI API key not configured');
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "Summarize this conversation concisely. Highlight key points, decisions, and action items. Keep it under 150 words."
        },
        {
          role: "user",
          content: `Summarize this conversation:\n\n${messages.map(m => `${m.role}: ${m.content}`).join('\n\n')}`
        }
      ],
      temperature: 0.3,
      max_tokens: 250,
    });

    const summary = completion.choices[0].message.content || '';
    
    await logAiUsage({
      userId,
      action: 'conversation_summary',
      response: summary,
      tokensUsed: completion.usage?.total_tokens,
      cost: completion.usage?.total_tokens ? calculateCost(completion.usage.total_tokens, 'gpt-4o-mini') : undefined,
    });

    return summary;
  } catch (error) {
    console.error('Error summarizing conversation:', error);
    throw new Error('Failed to summarize conversation');
  }
}

export const aiService = {
  chatWithAssistant,
  generateSmartReply,
  summarizeConversation,
};
