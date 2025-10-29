import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail(to: string, subject: string, html: string) {
  try {
    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"PropertyFlows" <noreply@propertyflows.co>',
      to,
      subject,
      html,
    });
    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

export async function sendPaymentConfirmation(to: string, amount: number, date: Date) {
  const html = `
    <h2>Payment Confirmation</h2>
    <p>Your payment of $${amount.toFixed(2)} has been received on ${date.toLocaleDateString()}.</p>
    <p>Thank you for your payment!</p>
  `;
  return sendEmail(to, 'Payment Confirmation', html);
}

export async function sendMaintenanceRequestNotification(to: string, requestDetails: any) {
  const html = `
    <h2>New Maintenance Request</h2>
    <p><strong>Unit:</strong> ${requestDetails.unitNumber}</p>
    <p><strong>Issue:</strong> ${requestDetails.title}</p>
    <p><strong>Priority:</strong> ${requestDetails.priority}</p>
    <p><strong>Description:</strong> ${requestDetails.description}</p>
  `;
  return sendEmail(to, 'New Maintenance Request', html);
}

export async function sendLeaseRenewalReminder(to: string, leaseDetails: any) {
  const html = `
    <h2>Lease Renewal Reminder</h2>
    <p>Your lease for Unit ${leaseDetails.unitNumber} expires on ${new Date(leaseDetails.endDate).toLocaleDateString()}.</p>
    <p>Please contact us to discuss renewal options.</p>
  `;
  return sendEmail(to, 'Lease Renewal Reminder', html);
}
