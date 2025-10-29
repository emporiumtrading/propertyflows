import { authenticator } from 'otplib';
import qrcode from 'qrcode';
import crypto from 'crypto';

authenticator.options = { 
  window: 1
};

export interface MfaEnrollmentData {
  secret: string;
  qrCodeDataUrl: string;
  backupCodes: string[];
}

export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export async function generateQrCodeUrl(
  secret: string,
  email: string,
  issuer: string = 'PropertyFlows'
): Promise<string> {
  const otpauthUrl = authenticator.keyuri(email, issuer, secret);
  const qrCodeDataUrl = await qrcode.toDataURL(otpauthUrl);
  return qrCodeDataUrl;
}

export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase();
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}`);
  }
  return codes;
}

export function hashBackupCode(code: string): string {
  const normalized = code.trim().toUpperCase().replace(/[^A-F0-9]/g, '');
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

export function hashBackupCodes(codes: string[]): string[] {
  return codes.map(code => hashBackupCode(code));
}

export function verifyTotpToken(secret: string, token: string): boolean {
  try {
    return authenticator.verify({ token, secret });
  } catch (error) {
    console.error('TOTP verification error:', error);
    return false;
  }
}

export function verifyBackupCode(
  code: string,
  hashedBackupCodes: string[]
): { valid: boolean; remainingCodes: string[] } {
  const codeHash = hashBackupCode(code);
  
  const index = hashedBackupCodes.indexOf(codeHash);
  
  if (index === -1) {
    return { valid: false, remainingCodes: hashedBackupCodes };
  }
  
  const remainingCodes = hashedBackupCodes.filter((_, i) => i !== index);
  return { valid: true, remainingCodes };
}

export async function enrollMfa(email: string): Promise<MfaEnrollmentData> {
  const secret = generateTotpSecret();
  const qrCodeDataUrl = await generateQrCodeUrl(secret, email);
  const backupCodes = generateBackupCodes();
  
  return {
    secret,
    qrCodeDataUrl,
    backupCodes,
  };
}

export function generateDeviceFingerprint(userAgent: string, ipAddress: string): string {
  const data = `${userAgent}|${ipAddress}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

export const mfaService = {
  generateTotpSecret,
  generateQrCodeUrl,
  generateBackupCodes,
  hashBackupCode,
  hashBackupCodes,
  verifyTotpToken,
  verifyBackupCode,
  enrollMfa,
  generateDeviceFingerprint,
};
