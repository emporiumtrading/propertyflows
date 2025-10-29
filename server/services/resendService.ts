import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  try {
    if (process.env.RESEND_API_KEY) {
      return {
        apiKey: process.env.RESEND_API_KEY,
        fromEmail: 'noreply@propertyflows.co'
      };
    }

    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    const xReplitToken = process.env.REPL_IDENTITY 
      ? 'repl ' + process.env.REPL_IDENTITY 
      : process.env.WEB_REPL_RENEWAL 
      ? 'depl ' + process.env.WEB_REPL_RENEWAL 
      : null;

    if (!xReplitToken) {
      throw new Error('RESEND_API_KEY not found and X_REPLIT_TOKEN not available for connector');
    }

    const response = await fetch(
      'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
      {
        headers: {
          'Accept': 'application/json',
          'X_REPLIT_TOKEN': xReplitToken
        }
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch Resend credentials: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    connectionSettings = data.items?.[0];

    if (!connectionSettings || (!connectionSettings.settings.api_key)) {
      throw new Error('Resend not connected');
    }
    return {
      apiKey: connectionSettings.settings.api_key, 
      fromEmail: connectionSettings.settings.from_email
    };
  } catch (error: any) {
    console.error('[Resend] Failed to get credentials:', {
      error: error?.message,
    });
    throw error;
  }
}

export async function getUncachableResendClient() {
  const { apiKey, fromEmail } = await getCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail || 'noreply@propertyflows.co'
  };
}

export async function sendInvitationEmail(
  recipientEmail: string,
  recipientRole: string,
  inviteToken: string,
  inviterName?: string
) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const inviteUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/accept-invite/${inviteToken}`;
    
    const roleDisplayName = recipientRole.charAt(0).toUpperCase() + recipientRole.slice(1);
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: `You've been invited to PropertyFlows as a ${roleDisplayName}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">PropertyFlows</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Property Management Platform</p>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0;">You've Been Invited!</h2>
              
              <p style="color: #4b5563; font-size: 16px;">
                ${inviterName ? `<strong>${inviterName}</strong> has` : 'You have been'} invited you to join PropertyFlows as a <strong>${roleDisplayName}</strong>.
              </p>
              
              <p style="color: #4b5563; font-size: 16px;">
                PropertyFlows is a comprehensive property management platform with transparent pricing, online rent payments, maintenance tracking, and more.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${inviteUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 14px 32px; 
                          text-decoration: none; 
                          border-radius: 6px; 
                          font-weight: 600;
                          display: inline-block;
                          font-size: 16px;">
                  Accept Invitation
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color: #667eea; font-size: 14px; word-break: break-all; background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
                ${inviteUrl}
              </p>
              
              <p style="color: #9ca3af; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      throw error;
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    throw error;
  }
}

export async function sendLeaseSignatureRequest(
  tenantEmail: string,
  tenantName: string,
  propertyAddress: string,
  unitNumber: string,
  leaseId: string
) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const signatureUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/sign-lease/${leaseId}`;
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: tenantEmail,
      subject: `Lease Agreement Ready for Signature - ${propertyAddress}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">PropertyFlows</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">Property Management Platform</p>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <h2 style="color: #1f2937; margin-top: 0;">📝 Lease Agreement Ready for Signature</h2>
              
              <p style="color: #4b5563; font-size: 16px;">
                Hello <strong>${tenantName}</strong>,
              </p>
              
              <p style="color: #4b5563; font-size: 16px;">
                Your lease agreement is ready for review and electronic signature.
              </p>
              
              <div style="background: white; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #374151;">
                  <strong>Property:</strong> ${propertyAddress}
                </p>
                <p style="margin: 10px 0 0 0; color: #374151;">
                  <strong>Unit:</strong> ${unitNumber}
                </p>
              </div>
              
              <p style="color: #4b5563; font-size: 16px;">
                Please review the lease agreement carefully and sign electronically to complete the process.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${signatureUrl}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 14px 32px; 
                          text-decoration: none; 
                          border-radius: 6px; 
                          font-weight: 600;
                          display: inline-block;
                          font-size: 16px;">
                  Review and Sign Lease
                </a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Or copy and paste this link into your browser:
              </p>
              <p style="color: #667eea; font-size: 14px; word-break: break-all; background: white; padding: 12px; border-radius: 6px; border: 1px solid #e5e7eb;">
                ${signatureUrl}
              </p>
              
              <p style="color: #9ca3af; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                This is a secure electronic signature request. By clicking the link above, you will be able to review your lease agreement and provide your electronic signature.
              </p>
              
              <p style="color: #9ca3af; font-size: 12px; margin-top: 10px;">
                If you have any questions about this lease, please contact your property manager.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      throw error;
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send lease signature request email:', error);
    throw error;
  }
}

export async function sendBusinessApprovedEmail(
  recipientEmail: string,
  companyName: string,
  planName: string
) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const loginUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/login`;
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: `Welcome to PropertyFlows - Business Verified!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">🎉 Business Verified!</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="color: #4b5563; font-size: 16px;">
                Great news! Your business <strong>${companyName}</strong> has been verified and approved.
              </p>
              
              <div style="background: white; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #374151;">
                  <strong>Plan:</strong> ${planName}
                </p>
                <p style="margin: 10px 0 0 0; color: #374151;">
                  <strong>Free Trial:</strong> 14 days
                </p>
              </div>
              
              <p style="color: #4b5563; font-size: 16px;">
                Log in now to activate your 14-day free trial and start managing your properties with PropertyFlows!
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${loginUrl}" 
                   style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                          color: white; 
                          padding: 14px 32px; 
                          text-decoration: none; 
                          border-radius: 6px; 
                          font-weight: 600;
                          display: inline-block;
                          font-size: 16px;">
                  Activate Free Trial
                </a>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      throw error;
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send business approved email:', error);
    throw error;
  }
}

export async function sendBusinessRejectedEmail(
  recipientEmail: string,
  companyName: string,
  rejectionReason: string
) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: `PropertyFlows Business Verification Update`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">Verification Update</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="color: #4b5563; font-size: 16px;">
                Thank you for your interest in PropertyFlows. After reviewing your business registration for <strong>${companyName}</strong>, we were unable to verify your business at this time.
              </p>
              
              <div style="background: #fee2e2; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #991b1b;">
                  <strong>Reason:</strong> ${rejectionReason}
                </p>
              </div>
              
              <p style="color: #4b5563; font-size: 16px;">
                If you believe this was an error or would like to resubmit with updated information, please contact our support team.
              </p>
              
              <p style="color: #9ca3af; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                Contact us at support@propertyflows.co
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      throw error;
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send business rejected email:', error);
    throw error;
  }
}

export async function sendTrialEndingReminderEmail(
  recipientEmail: string,
  companyName: string,
  daysRemaining: number,
  trialEndDate: string
) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const billingUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/billing`;
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: `Your PropertyFlows Trial Ends in ${daysRemaining} Day${daysRemaining !== 1 ? 's' : ''}`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">⏰ Trial Ending Soon</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="color: #4b5563; font-size: 16px;">
                Hi ${companyName},
              </p>
              
              <p style="color: #4b5563; font-size: 16px;">
                Your 14-day free trial will end in <strong>${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}</strong> on <strong>${trialEndDate}</strong>.
              </p>
              
              <div style="background: #fef3c7; padding: 20px; border-left: 4px solid #f59e0b; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #92400e;">
                  Don't lose access to your property management data! Add a payment method to continue after your trial ends.
                </p>
              </div>
              
              <p style="color: #4b5563; font-size: 16px;">
                Your subscription will automatically convert to a paid plan after the trial. You can update your payment method or cancel anytime from your billing settings.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${billingUrl}" 
                   style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); 
                          color: white; 
                          padding: 14px 32px; 
                          text-decoration: none; 
                          border-radius: 6px; 
                          font-weight: 600;
                          display: inline-block;
                          font-size: 16px;">
                  Add Payment Method
                </a>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      throw error;
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send trial ending reminder email:', error);
    throw error;
  }
}

export async function sendPaymentFailedEmail(
  recipientEmail: string,
  companyName: string,
  amount: number,
  retryDate: string,
  gracePeriodEnd: string
) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const billingUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/billing`;
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: `Payment Failed - Action Required`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">❌ Payment Failed</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="color: #4b5563; font-size: 16px;">
                Hi ${companyName},
              </p>
              
              <p style="color: #4b5563; font-size: 16px;">
                We were unable to process your payment of <strong>$${(amount / 100).toFixed(2)}</strong>.
              </p>
              
              <div style="background: #fee2e2; padding: 20px; border-left: 4px solid #ef4444; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #991b1b;">
                  <strong>Next Retry:</strong> ${retryDate}
                </p>
                <p style="margin: 10px 0 0 0; color: #991b1b;">
                  <strong>Grace Period Ends:</strong> ${gracePeriodEnd}
                </p>
              </div>
              
              <p style="color: #4b5563; font-size: 16px;">
                To avoid service interruption, please update your payment method. We'll automatically retry your payment, but updating your payment details now ensures uninterrupted service.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${billingUrl}" 
                   style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); 
                          color: white; 
                          padding: 14px 32px; 
                          text-decoration: none; 
                          border-radius: 6px; 
                          font-weight: 600;
                          display: inline-block;
                          font-size: 16px;">
                  Update Payment Method
                </a>
              </div>
              
              <p style="color: #9ca3af; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                If payment is not received by ${gracePeriodEnd}, your account will be suspended.
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      throw error;
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send payment failed email:', error);
    throw error;
  }
}

export async function sendAccountSuspendedEmail(
  recipientEmail: string,
  companyName: string,
  outstandingAmount: number
) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    const billingUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/billing`;
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: `Account Suspended - Immediate Action Required`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">⚠️ Account Suspended</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="color: #4b5563; font-size: 16px;">
                Hi ${companyName},
              </p>
              
              <p style="color: #4b5563; font-size: 16px;">
                Your PropertyFlows account has been suspended due to payment issues. Your data is safe, but you currently have limited access to the platform.
              </p>
              
              <div style="background: #fee2e2; padding: 20px; border-left: 4px solid #dc2626; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #991b1b;">
                  <strong>Outstanding Balance:</strong> $${(outstandingAmount / 100).toFixed(2)}
                </p>
              </div>
              
              <p style="color: #4b5563; font-size: 16px;">
                To restore full access, please update your payment method and settle your outstanding balance.
              </p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${billingUrl}" 
                   style="background: linear-gradient(135deg, #dc2626 0%, #991b1b 100%); 
                          color: white; 
                          padding: 14px 32px; 
                          text-decoration: none; 
                          border-radius: 6px; 
                          font-weight: 600;
                          display: inline-block;
                          font-size: 16px;">
                  Restore Account Access
                </a>
              </div>
              
              <p style="color: #9ca3af; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                Need help? Contact support@propertyflows.co
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      throw error;
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send account suspended email:', error);
    throw error;
  }
}

export async function sendPaymentSuccessEmail(
  recipientEmail: string,
  companyName: string,
  amount: number,
  invoiceUrl: string
) {
  try {
    const { client, fromEmail } = await getUncachableResendClient();
    
    const { data, error } = await client.emails.send({
      from: fromEmail,
      to: recipientEmail,
      subject: `Payment Received - Thank You!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">✅ Payment Received</h1>
            </div>
            
            <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
              <p style="color: #4b5563; font-size: 16px;">
                Hi ${companyName},
              </p>
              
              <p style="color: #4b5563; font-size: 16px;">
                Thank you! We've successfully received your payment of <strong>$${(amount / 100).toFixed(2)}</strong>.
              </p>
              
              <div style="background: #d1fae5; padding: 20px; border-left: 4px solid #10b981; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; color: #065f46;">
                  Your account is active and all services are available.
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invoiceUrl}" 
                   style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); 
                          color: white; 
                          padding: 14px 32px; 
                          text-decoration: none; 
                          border-radius: 6px; 
                          font-weight: 600;
                          display: inline-block;
                          font-size: 16px;">
                  View Invoice
                </a>
              </div>
              
              <p style="color: #9ca3af; font-size: 13px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                Questions? Contact support@propertyflows.co
              </p>
            </div>
          </body>
        </html>
      `,
    });

    if (error) {
      console.error('Resend email error:', error);
      throw error;
    }

    return { success: true, messageId: data?.id };
  } catch (error) {
    console.error('Failed to send payment success email:', error);
    throw error;
  }
}
