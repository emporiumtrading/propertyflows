import { storage } from '../storage.js';
import { sendSMS } from './twilioService.js';
import type { DelinquencyPlaybook, Payment, DelinquencyAction } from '@shared/schema';

interface PlaybookReminderInterval {
  days: number;
  actionType: string;
  messageTemplate: string;
}

function calculateDaysOverdue(dueDate: Date): number {
  const today = new Date();
  const due = new Date(dueDate);
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function interpolateMessage(template: string, data: {
  tenantName: string;
  amount: string;
  daysOverdue: number;
  dueDate: string;
  propertyName?: string;
}): string {
  return template
    .replace(/{tenantName}/g, data.tenantName)
    .replace(/{amount}/g, data.amount)
    .replace(/{daysOverdue}/g, data.daysOverdue.toString())
    .replace(/{dueDate}/g, data.dueDate)
    .replace(/{propertyName}/g, data.propertyName || '');
}

export async function processDelinquentPayments(): Promise<{
  processed: number;
  actionsSent: number;
  errors: string[];
}> {
  const results = {
    processed: 0,
    actionsSent: 0,
    errors: [] as string[],
  };

  try {
    const allPayments = await storage.getPayments({});
    const now = new Date();
    
    const overduePayments = allPayments.filter(p => {
      if (p.status !== 'pending') return false;
      if (!p.dueDate) return false;
      
      const dueDate = new Date(p.dueDate);
      if (isNaN(dueDate.getTime())) return false;
      
      return dueDate < now;
    });

    console.log(`[Delinquency] Found ${overduePayments.length} overdue payments`);

    for (const payment of overduePayments) {
      try {
        const actionsCreated = await processDelinquentPayment(payment);
        results.processed++;
        results.actionsSent += actionsCreated;
      } catch (error) {
        const errorMsg = `Failed to process payment ${payment.id}: ${error}`;
        console.error(`[Delinquency] ${errorMsg}`);
        results.errors.push(errorMsg);
      }
    }

    console.log(`[Delinquency] Completed: ${results.processed} payments processed, ${results.actionsSent} actions sent`);

    return results;
  } catch (error) {
    console.error('[Delinquency] Fatal error in processDelinquentPayments:', error);
    throw error;
  }
}

async function processDelinquentPayment(payment: Payment): Promise<number> {
  let actionsCreated = 0;
  
  const lease = await storage.getLease(payment.leaseId);
  if (!lease) {
    console.warn(`[Delinquency] Lease ${payment.leaseId} not found for payment ${payment.id}`);
    return actionsCreated;
  }

  const unit = await storage.getUnit(lease.unitId);
  if (!unit) {
    console.warn(`[Delinquency] Unit ${lease.unitId} not found for lease ${lease.id}`);
    return actionsCreated;
  }

  const property = await storage.getProperty(unit.propertyId);
  if (!property) {
    console.warn(`[Delinquency] Property ${unit.propertyId} not found for unit ${unit.id}`);
    return actionsCreated;
  }

  const propertyPlaybooks = await storage.getDelinquencyPlaybooks({
    propertyId: property.id,
    isActive: true,
  });
  
  const globalPlaybooks = await storage.getDelinquencyPlaybooks({
    propertyId: undefined,
    isActive: true,
  });

  const playbooks = [...propertyPlaybooks, ...globalPlaybooks];

  if (playbooks.length === 0) {
    console.log(`[Delinquency] No active playbooks for property ${property.id}`);
    return actionsCreated;
  }

  const daysOverdue = calculateDaysOverdue(new Date(payment.dueDate!));

  if (daysOverdue < 1) {
    return actionsCreated;
  }

  for (const playbook of playbooks) {
    try {
      actionsCreated += await executePlaybookActions(playbook, payment, lease.tenantId, daysOverdue, {
        tenantName: '', 
        propertyName: property.name,
        amount: payment.amount,
        dueDate: payment.dueDate!,
      });
    } catch (error: any) {
      console.error(`[Delinquency] Error executing playbook ${playbook.id} for payment ${payment.id}:`, {
        error: error?.message,
        playbook: playbook.name,
      });
      throw error;
    }
  }
  
  return actionsCreated;
}

async function executePlaybookActions(
  playbook: DelinquencyPlaybook,
  payment: Payment,
  tenantId: string,
  daysOverdue: number,
  context: {
    tenantName: string;
    propertyName: string;
    amount: string;
    dueDate: string;
  }
): Promise<number> {
  let actionsCreated = 0;
  
  if (daysOverdue < playbook.gracePeriodDays) {
    return actionsCreated;
  }

  const tenant = await storage.getUser(tenantId);
  if (!tenant) {
    console.warn(`[Delinquency] Tenant ${tenantId} not found`);
    return actionsCreated;
  }

  const tenantName = `${tenant.firstName || ''} ${tenant.lastName || ''}`.trim() || tenant.email || 'Tenant';

  const intervals = playbook.reminderIntervals as PlaybookReminderInterval[];
  if (!Array.isArray(intervals)) {
    console.warn(`[Delinquency] Invalid reminderIntervals format for playbook ${playbook.id}`);
    return actionsCreated;
  }

  for (const interval of intervals) {
    if (daysOverdue >= interval.days) {
      const existingActions = await storage.getDelinquencyActions({
        paymentId: payment.id,
        playbookId: playbook.id,
      });

      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentAction = existingActions.find(
        a => a.daysOverdue === interval.days && 
             a.actionType === interval.actionType &&
             a.createdAt && 
             new Date(a.createdAt) > twentyFourHoursAgo
      );

      if (recentAction) {
        continue;
      }

      const message = interpolateMessage(interval.messageTemplate, {
        ...context,
        tenantName,
        daysOverdue,
      });

      let actionStatus: 'sent' | 'failed' = 'sent';
      let sentAt: Date | undefined = undefined;
      let deliveredAt: Date | undefined = undefined;

      const smsPrefs = await storage.getSmsPreferences(tenant.id);
      if (smsPrefs?.phoneNumber && smsPrefs.optedIn && smsPrefs.rentReminders) {
        try {
          await sendSMS(smsPrefs.phoneNumber, message);
          actionStatus = 'sent';
          sentAt = new Date();
          deliveredAt = new Date();
        } catch (error) {
          console.error(`[Delinquency] Failed to send SMS to ${smsPrefs.phoneNumber}:`, error);
          actionStatus = 'failed';
        }
      } else {
        console.log(`[Delinquency] Tenant ${tenant.id} has no phone number or has not opted in to SMS rent reminders`);
        actionStatus = 'failed';
      }

      await storage.createDelinquencyAction({
        paymentId: payment.id,
        playbookId: playbook.id,
        tenantId: tenant.id,
        daysOverdue: interval.days,
        actionType: interval.actionType,
        messageTemplate: interval.messageTemplate,
        messageSent: message,
        status: actionStatus,
        sentAt,
        deliveredAt,
      });

      if (actionStatus === 'sent') {
        actionsCreated++;
      }
      console.log(`[Delinquency] Created ${actionStatus} action for payment ${payment.id}, ${daysOverdue} days overdue`);
    }
  }
  
  return actionsCreated;
}

export async function runDelinquencyCheck(): Promise<void> {
  console.log('[Delinquency] Starting delinquency check...');
  const startTime = Date.now();
  
  const results = await processDelinquentPayments();
  
  const duration = Date.now() - startTime;
  console.log(
    `[Delinquency] Check completed in ${duration}ms - ` +
    `Processed: ${results.processed}, Actions: ${results.actionsSent}, Errors: ${results.errors.length}`
  );

  if (results.errors.length > 0) {
    console.error('[Delinquency] Errors:', results.errors);
  }
}
