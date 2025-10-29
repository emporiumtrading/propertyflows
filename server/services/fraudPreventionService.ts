const DISPOSABLE_EMAIL_DOMAINS = [
  'tempmail.com', 'throwaway.email', '10minutemail.com', 'guerrillamail.com',
  'mailinator.com', 'maildrop.cc', 'temp-mail.org', 'getnada.com', 'sharklasers.com',
];

export interface FraudCheckResult {
  passed: boolean;
  score: number;
  flags: string[];
  details: {
    emailValid: boolean;
    phoneValid: boolean;
    disposableEmail: boolean;
  };
}

export async function performFraudChecks(data: {
  businessEmail: string;
  businessPhone: string;
}): Promise<FraudCheckResult> {
  const flags: string[] = [];
  let score = 100;

  const emailDomain = data.businessEmail.split('@')[1]?.toLowerCase();
  const isDisposableEmail = DISPOSABLE_EMAIL_DOMAINS.includes(emailDomain);

  if (isDisposableEmail) {
    flags.push('Disposable email detected');
    score = 0;
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.businessEmail);
  if (!emailValid) {
    flags.push('Invalid email format');
    score -= 20;
  }

  const phoneDigits = data.businessPhone.replace(/\D/g, '');
  const phoneValid = phoneDigits.length >= 10 && phoneDigits.length <= 15;
  if (!phoneValid) {
    flags.push('Invalid phone number');
    score -= 15;
  }

  const freeEmailDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com'];
  if (freeEmailDomains.includes(emailDomain)) {
    flags.push('Free email provider (consider business email)');
    score -= 10;
  }

  return {
    passed: score >= 50,
    score: Math.max(0, score),
    flags,
    details: {
      emailValid,
      phoneValid,
      disposableEmail: isDisposableEmail,
    },
  };
}
