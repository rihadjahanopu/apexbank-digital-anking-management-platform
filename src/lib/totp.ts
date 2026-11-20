import { generateSecret, generateURI, verifySync } from "otplib";

/**
 * Generate a new base32 secret for TOTP
 */
export function generateTotpSecret(): string {
  return generateSecret();
}

/**
 * Generate an otpauth:// URI for QR code generation
 */
export function generateTotpUri(
  label: string,
  issuer: string,
  secret: string
): string {
  return generateURI({ label, issuer, secret });
}

/**
 * Verify a 6-digit TOTP token against a secret
 */
export function verifyTotp(token: string, secret: string): boolean {
  try {
    const result = verifySync({ token, secret });
    return !!result?.valid;
  } catch {
    return false;
  }
}
