import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email};
}

export async function getUncachableResendClient() {
  const credentials = await getCredentials();
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: connectionSettings.settings.from_email
  };
}

export async function sendOwnerInvitation(
  ownerEmail: string,
  ownerName: string,
  invitationToken: string
) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const invitationUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/accept-invitation?token=${invitationToken}`;
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: [ownerEmail],
      subject: 'Welcome to PropertyFlows - Complete Your Account Setup',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Welcome to PropertyFlows</title>
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to PropertyFlows</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="font-size: 16px; margin-bottom: 20px;">Hello ${ownerName},</p>
              
              <p style="font-size: 16px; margin-bottom: 20px;">
                You've been added as a property owner on PropertyFlows! We're excited to help you manage your properties efficiently.
              </p>
              
              <p style="font-size: 16px; margin-bottom: 30px;">
                To complete your account setup and start managing your properties, please click the button below:
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invitationUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 14px 30px; 
                          text-decoration: none; 
                          border-radius: 6px; 
                          font-weight: 600;
                          display: inline-block;
                          font-size: 16px;">
                  Accept Invitation & Setup Account
                </a>
              </div>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                Or copy and paste this link into your browser:<br>
                <a href="${invitationUrl}" style="color: #667eea; word-break: break-all;">${invitationUrl}</a>
              </p>
              
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
              
              <p style="font-size: 14px; color: #6b7280; margin-bottom: 10px;">
                <strong>What's Next?</strong>
              </p>
              <ul style="font-size: 14px; color: #6b7280; margin-bottom: 20px;">
                <li>Complete your profile information</li>
                <li>View and manage your properties</li>
                <li>Track leases and tenants</li>
                <li>Monitor rental income and expenses</li>
              </ul>
              
              <p style="font-size: 14px; color: #6b7280;">
                If you have any questions, please don't hesitate to reach out to your property manager.
              </p>
              
              <p style="font-size: 14px; color: #6b7280; margin-top: 30px;">
                Best regards,<br>
                <strong>The PropertyFlows Team</strong>
              </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #9ca3af;">
              <p>This invitation was sent to ${ownerEmail}</p>
              <p>© ${new Date().getFullYear()} PropertyFlows. All rights reserved.</p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Failed to send invitation email:', error);
      throw new Error(`Failed to send invitation: ${error.message}`);
    }

    console.log('Invitation email sent successfully:', data);
    return data;
  } catch (error) {
    console.error('Error sending owner invitation:', error);
    throw error;
  }
}
