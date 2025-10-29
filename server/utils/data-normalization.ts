import { z } from 'zod';

// Phone number normalization - converts various formats to E.164
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `+1${cleaned}`;
  } else if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+${cleaned}`;
  } else if (cleaned.length > 0) {
    return `+${cleaned}`;
  }
  
  return null;
}

// Email normalization - lowercase and trim
export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  
  const trimmed = email.trim().toLowerCase();
  
  const emailSchema = z.string().email();
  const result = emailSchema.safeParse(trimmed);
  
  return result.success ? trimmed : null;
}

// Name normalization - title case and trim
export function normalizeName(name: string | null | undefined): string | null {
  if (!name) return null;
  
  return name
    .trim()
    .split(/\s+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Address normalization - standardize common abbreviations
export function normalizeAddress(address: string | null | undefined): string | null {
  if (!address) return null;
  
  const addressMap: Record<string, string> = {
    'street': 'St',
    'st': 'St',
    'st.': 'St',
    'avenue': 'Ave',
    'ave': 'Ave',
    'ave.': 'Ave',
    'road': 'Rd',
    'rd': 'Rd',
    'rd.': 'Rd',
    'boulevard': 'Blvd',
    'blvd': 'Blvd',
    'blvd.': 'Blvd',
    'drive': 'Dr',
    'dr': 'Dr',
    'dr.': 'Dr',
    'lane': 'Ln',
    'ln': 'Ln',
    'ln.': 'Ln',
    'court': 'Ct',
    'ct': 'Ct',
    'ct.': 'Ct',
    'apartment': 'Apt',
    'apt': 'Apt',
    'apt.': 'Apt',
    'suite': 'Ste',
    'ste': 'Ste',
    'ste.': 'Ste',
    'unit': 'Unit',
    'north': 'N',
    'south': 'S',
    'east': 'E',
    'west': 'W',
  };
  
  let normalized = address.trim();
  
  for (const [long, short] of Object.entries(addressMap)) {
    const regex = new RegExp(`\\b${long}\\b`, 'gi');
    normalized = normalized.replace(regex, short);
  }
  
  return normalized;
}

// State normalization - convert full names to abbreviations
export function normalizeState(state: string | null | undefined): string | null {
  if (!state) return null;
  
  const stateMap: Record<string, string> = {
    'alabama': 'AL', 'alaska': 'AK', 'arizona': 'AZ', 'arkansas': 'AR',
    'california': 'CA', 'colorado': 'CO', 'connecticut': 'CT', 'delaware': 'DE',
    'florida': 'FL', 'georgia': 'GA', 'hawaii': 'HI', 'idaho': 'ID',
    'illinois': 'IL', 'indiana': 'IN', 'iowa': 'IA', 'kansas': 'KS',
    'kentucky': 'KY', 'louisiana': 'LA', 'maine': 'ME', 'maryland': 'MD',
    'massachusetts': 'MA', 'michigan': 'MI', 'minnesota': 'MN', 'mississippi': 'MS',
    'missouri': 'MO', 'montana': 'MT', 'nebraska': 'NE', 'nevada': 'NV',
    'new hampshire': 'NH', 'new jersey': 'NJ', 'new mexico': 'NM', 'new york': 'NY',
    'north carolina': 'NC', 'north dakota': 'ND', 'ohio': 'OH', 'oklahoma': 'OK',
    'oregon': 'OR', 'pennsylvania': 'PA', 'rhode island': 'RI', 'south carolina': 'SC',
    'south dakota': 'SD', 'tennessee': 'TN', 'texas': 'TX', 'utah': 'UT',
    'vermont': 'VT', 'virginia': 'VA', 'washington': 'WA', 'west virginia': 'WV',
    'wisconsin': 'WI', 'wyoming': 'WY',
  };
  
  const normalized = state.trim().toLowerCase();
  
  if (stateMap[normalized]) {
    return stateMap[normalized];
  }
  
  const upper = state.trim().toUpperCase();
  if (upper.length === 2 && Object.values(stateMap).includes(upper)) {
    return upper;
  }
  
  return state.trim();
}

// ZIP code normalization - standardize to 5 or 9 digit format
export function normalizeZipCode(zip: string | null | undefined): string | null {
  if (!zip) return null;
  
  const cleaned = zip.replace(/\D/g, '');
  
  if (cleaned.length === 5) {
    return cleaned;
  } else if (cleaned.length === 9) {
    return `${cleaned.slice(0, 5)}-${cleaned.slice(5)}`;
  }
  
  return zip.trim();
}

// Currency normalization - remove symbols and parse to number
export function normalizeCurrency(amount: string | number | null | undefined): number | null {
  if (amount === null || amount === undefined || amount === '') return null;
  
  if (typeof amount === 'number') return amount;
  
  const cleaned = amount.replace(/[$,\s]/g, '');
  const parsed = parseFloat(cleaned);
  
  return isNaN(parsed) ? null : parsed;
}

// Date normalization - convert various formats to ISO string
export function normalizeDate(date: string | Date | null | undefined): string | null {
  if (!date) return null;
  
  if (date instanceof Date) {
    return date.toISOString();
  }
  
  const parsed = new Date(date);
  
  if (isNaN(parsed.getTime())) return null;
  
  return parsed.toISOString();
}

// Boolean normalization - handle various truthy/falsy strings
export function normalizeBoolean(value: string | boolean | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  
  if (typeof value === 'boolean') return value;
  
  const normalized = value.toString().trim().toLowerCase();
  
  return ['true', 'yes', 'y', '1', 'active', 'enabled'].includes(normalized);
}

// Status normalization - map various status strings to our enum values
export function normalizeStatus(
  status: string | null | undefined,
  type: 'unit' | 'lease' | 'maintenance'
): string | null {
  if (!status) return null;
  
  const normalized = status.trim().toLowerCase();
  
  if (type === 'unit') {
    const unitStatusMap: Record<string, string> = {
      'available': 'vacant',
      'vacant': 'vacant',
      'empty': 'vacant',
      'occupied': 'occupied',
      'rented': 'occupied',
      'leased': 'occupied',
      'maintenance': 'maintenance',
      'under repair': 'maintenance',
      'repair': 'maintenance',
    };
    return unitStatusMap[normalized] || 'vacant';
  }
  
  if (type === 'lease') {
    const leaseStatusMap: Record<string, string> = {
      'active': 'active',
      'current': 'active',
      'notice': 'notice',
      'notice given': 'notice',
      'expired': 'expired',
      'past': 'expired',
      'terminated': 'expired',
    };
    return leaseStatusMap[normalized] || 'active';
  }
  
  if (type === 'maintenance') {
    const maintenanceStatusMap: Record<string, string> = {
      'open': 'open',
      'new': 'open',
      'assigned': 'assigned',
      'in progress': 'in_progress',
      'in-progress': 'in_progress',
      'working': 'in_progress',
      'completed': 'completed',
      'resolved': 'completed',
      'closed': 'completed',
    };
    return maintenanceStatusMap[normalized] || 'open';
  }
  
  return null;
}

// Priority normalization for maintenance requests
export function normalizePriority(priority: string | null | undefined): string {
  if (!priority) return 'medium';
  
  const normalized = priority.trim().toLowerCase();
  
  const priorityMap: Record<string, string> = {
    'urgent': 'urgent',
    'emergency': 'urgent',
    'critical': 'urgent',
    'high': 'high',
    'medium': 'medium',
    'normal': 'medium',
    'low': 'low',
  };
  
  return priorityMap[normalized] || 'medium';
}

// Unit type normalization
export function normalizeUnitType(type: string | null | undefined): string {
  if (!type) return 'apartment';
  
  const normalized = type.trim().toLowerCase();
  
  const typeMap: Record<string, string> = {
    'apartment': 'apartment',
    'apt': 'apartment',
    'condo': 'condo',
    'condominium': 'condo',
    'house': 'house',
    'single family': 'house',
    'townhouse': 'townhouse',
    'townhome': 'townhouse',
    'duplex': 'duplex',
  };
  
  return typeMap[normalized] || 'apartment';
}

// Property type normalization
export function normalizePropertyType(type: string | null | undefined): string {
  if (!type) return 'residential';
  
  const normalized = type.trim().toLowerCase();
  
  const typeMap: Record<string, string> = {
    'residential': 'residential',
    'commercial': 'commercial',
    'mixed use': 'mixed_use',
    'mixed-use': 'mixed_use',
    'industrial': 'industrial',
  };
  
  return typeMap[normalized] || 'residential';
}
