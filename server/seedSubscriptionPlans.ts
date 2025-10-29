import { db } from "./db";
import { subscriptionPlans } from "@shared/schema";
import { eq } from "drizzle-orm";

export const defaultPlans = [
  {
    name: "starter",
    displayName: "Starter",
    description: "Perfect for small property managers getting started with digital management",
    price: "49.00",
    billingInterval: "monthly" as const,
    trialDays: 14,
    isActive: true,
    stripePriceId: null,
    stripeProductId: null,
    features: {
      maxProperties: 5,
      maxUnits: 50,
      maxTenants: 100,
      maxPropertyManagers: 1,
      maxOwners: 5,
      maxVendors: 10,
      maxStorage: 5368709120,
      features: {
        aiMaintenance: false,
        fairHousing: false,
        bulkImport: false,
        quickbooksSync: false,
        advancedReporting: false,
        whiteLabel: false,
        apiAccess: false,
        prioritySupport: false,
        smsNotifications: true,
        eSignatures: true,
        multiCurrency: false,
        vendorPortal: true,
        ownerPortal: true,
      },
    },
  },
  {
    name: "professional",
    displayName: "Professional",
    description: "Advanced features and AI tools for growing property management businesses",
    price: "149.00",
    billingInterval: "monthly" as const,
    trialDays: 14,
    isActive: true,
    stripePriceId: null,
    stripeProductId: null,
    features: {
      maxProperties: 25,
      maxUnits: 500,
      maxTenants: 1000,
      maxPropertyManagers: 5,
      maxOwners: -1,
      maxVendors: -1,
      maxStorage: 53687091200,
      features: {
        aiMaintenance: true,
        fairHousing: true,
        bulkImport: true,
        quickbooksSync: true,
        advancedReporting: true,
        whiteLabel: false,
        apiAccess: false,
        prioritySupport: false,
        smsNotifications: true,
        eSignatures: true,
        multiCurrency: true,
        vendorPortal: true,
        ownerPortal: true,
      },
    },
  },
  {
    name: "enterprise",
    displayName: "Enterprise",
    description: "Unlimited resources, white label, API access, and dedicated support for large operations",
    price: "499.00",
    billingInterval: "monthly" as const,
    trialDays: 30,
    isActive: true,
    stripePriceId: null,
    stripeProductId: null,
    features: {
      maxProperties: -1,
      maxUnits: -1,
      maxTenants: -1,
      maxPropertyManagers: -1,
      maxOwners: -1,
      maxVendors: -1,
      maxStorage: -1,
      features: {
        aiMaintenance: true,
        fairHousing: true,
        bulkImport: true,
        quickbooksSync: true,
        advancedReporting: true,
        whiteLabel: true,
        apiAccess: true,
        prioritySupport: true,
        smsNotifications: true,
        eSignatures: true,
        multiCurrency: true,
        vendorPortal: true,
        ownerPortal: true,
      },
    },
  },
];

export async function seedSubscriptionPlans() {
  console.log("🌱 Seeding subscription plans...");

  for (const plan of defaultPlans) {
    const existing = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.name, plan.name))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(subscriptionPlans).values(plan);
      console.log(`✓ Created ${plan.displayName} plan`);
    } else {
      console.log(`⊙ ${plan.displayName} plan already exists`);
    }
  }

  console.log("✓ Subscription plans seeded successfully");
}
