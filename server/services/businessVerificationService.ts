import logger from '../logger';

export interface VerificationResult {
  status: 'approved' | 'manual_review' | 'rejected';
  riskScore: number;
  reasons: string[];
  metadata?: Record<string, any>;
}

export async function verifyBusinessLicense(
  businessLicense: string,
  businessName: string,
  state?: string
): Promise<{ valid: boolean; confidence: number; details: string }> {
  const licensePattern = /^[A-Z0-9\-]{5,20}$/i;
  const isValidFormat = licensePattern.test(businessLicense);

  if (!isValidFormat) {
    return {
      valid: false,
      confidence: 0,
      details: 'Invalid license number format',
    };
  }

  return {
    valid: true,
    confidence: 70,
    details: 'License format appears valid. Manual verification recommended.',
  };
}

export async function verifyTaxId(taxId: string): Promise<{ valid: boolean; confidence: number }> {
  const einPattern = /^[0-9]{2}-?[0-9]{7}$/;
  const isValidFormat = einPattern.test(taxId);

  if (!isValidFormat) {
    return {
      valid: false,
      confidence: 0,
    };
  }

  return {
    valid: true,
    confidence: 80,
  };
}

export async function calculateRiskScore(data: {
  businessName: string;
  businessLicense: string;
  taxId: string;
  businessAddress: string;
  businessEmail: string;
  businessPhone: string;
}): Promise<VerificationResult> {
  let score = 100;
  const reasons: string[] = [];
  const metadata: Record<string, any> = {};

  const licenseCheck = await verifyBusinessLicense(data.businessLicense, data.businessName);
  metadata.licenseCheck = licenseCheck;
  
  if (!licenseCheck.valid) {
    score -= 30;
    reasons.push('Invalid business license format');
  } else {
    score = Math.min(score, licenseCheck.confidence + 20);
  }

  const taxIdCheck = await verifyTaxId(data.taxId);
  metadata.taxIdCheck = taxIdCheck;
  
  if (!taxIdCheck.valid) {
    score -= 25;
    reasons.push('Invalid Tax ID format');
  } else {
    score = Math.min(score, taxIdCheck.confidence + 15);
  }

  if (data.businessAddress.length < 20) {
    score -= 10;
    reasons.push('Incomplete business address');
  }

  if (data.businessName.length < 3) {
    score -= 15;
    reasons.push('Business name too short');
  }

  let status: 'approved' | 'manual_review' | 'rejected';
  if (score >= 85) {
    status = 'approved';
    reasons.push('All verification checks passed');
  } else if (score >= 50) {
    status = 'manual_review';
    reasons.push('Requires manual review by admin');
  } else {
    status = 'rejected';
    reasons.push('Failed verification checks');
  }

  logger.info(`Business verification completed: ${status}, score: ${score}`, {
    businessName: data.businessName,
    score,
    status,
  });

  return {
    status,
    riskScore: score,
    reasons,
    metadata,
  };
}
