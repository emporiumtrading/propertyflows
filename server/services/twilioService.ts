import twilio from 'twilio';

let twilioClient: ReturnType<typeof twilio> | null = null;

function getTwilioClient() {
  if (!twilioClient && process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
      twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
    } catch (error: any) {
      console.error('[Twilio] Failed to initialize client:', {
        error: error?.message,
      });
      return null;
    }
  }
  return twilioClient;
}

export async function sendSMS(to: string, message: string): Promise<boolean> {
  const client = getTwilioClient();
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  
  if (!client || !fromNumber) {
    console.warn('Twilio not configured - SMS unavailable');
    return false;
  }

  try {
    await client.messages.create({
      body: message,
      from: fromNumber,
      to: to,
    });
    return true;
  } catch (error) {
    console.error('Error sending SMS:', error);
    return false;
  }
}

export async function sendWhatsApp(to: string, message: string): Promise<boolean> {
  const client = getTwilioClient();
  const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER;
  
  if (!client || !fromNumber) {
    console.warn('Twilio WhatsApp not configured');
    return false;
  }

  try {
    await client.messages.create({
      body: message,
      from: `whatsapp:${fromNumber}`,
      to: `whatsapp:${to}`,
    });
    return true;
  } catch (error) {
    console.error('Error sending WhatsApp message:', error);
    return false;
  }
}

export async function sendRentReminder(
  phoneNumber: string,
  tenantName: string,
  amount: number,
  dueDate: string,
  paymentLink: string
): Promise<boolean> {
  const message = `Hi ${tenantName}! Your rent of $${amount.toFixed(2)} is due on ${dueDate}. Pay securely: ${paymentLink}`;
  return await sendSMS(phoneNumber, message);
}

export async function sendMaintenanceUpdate(
  phoneNumber: string,
  tenantName: string,
  requestId: string,
  status: string,
  message?: string
): Promise<boolean> {
  const smsText = `Hi ${tenantName}, your maintenance request #${requestId} status: ${status}${message ? `. ${message}` : ''}`;
  return await sendSMS(phoneNumber, smsText);
}

export async function sendLeaseRenewalNotice(
  phoneNumber: string,
  tenantName: string,
  expiryDate: string,
  renewalLink: string
): Promise<boolean> {
  const message = `Hi ${tenantName}! Your lease expires on ${expiryDate}. Renew online: ${renewalLink}`;
  return await sendSMS(phoneNumber, message);
}

export function processTwilioWebhook(body: any): {
  from: string;
  to: string;
  message: string;
  type: 'sms' | 'whatsapp';
} | null {
  try {
    if (!body || !body.From || !body.To || !body.Body) {
      console.error('[Twilio] Invalid webhook payload - missing required fields');
      return null;
    }
    
    return {
      from: body.From,
      to: body.To,
      message: body.Body,
      type: body.From.startsWith('whatsapp:') ? 'whatsapp' : 'sms',
    };
  } catch (error: any) {
    console.error('[Twilio] Error processing webhook:', {
      error: error?.message,
    });
    return null;
  }
}
