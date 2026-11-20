import { CardNetwork, CARD_NETWORKS } from "./constants";

/**
 * Validate a 16-digit card number using the Luhn Algorithm (Mod 10)
 */
export function validateCardNumber(pan: string): boolean {
  const digits = pan.replace(/\D/g, "");
  if (digits.length < 13 || digits.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = digits.length - 1; i >= 0; i--) {
    let digit = parseInt(digits.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

/**
 * Generate a valid 16-digit card number using Luhn check digit
 */
export function generateCardNumber(network: CardNetwork = CARD_NETWORKS.VISA): string {
  // Visa BIN: 4532, Mastercard BIN: 5324
  let prefix = network === CARD_NETWORKS.VISA ? "4532" : "5324";

  // Generate 11 random digits
  for (let i = 0; i < 11; i++) {
    prefix += Math.floor(Math.random() * 10).toString();
  }

  // Calculate check digit (Luhn)
  let sum = 0;
  let shouldDouble = true;

  for (let i = prefix.length - 1; i >= 0; i--) {
    let digit = parseInt(prefix.charAt(i), 10);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }

  const checkDigit = (10 - (sum % 10)) % 10;
  return prefix + checkDigit.toString();
}

/**
 * Generate a 3-digit CVV
 */
export function generateCVV(): string {
  return Math.floor(100 + Math.random() * 900).toString();
}

/**
 * Mask 16-digit card number to display as •••• •••• •••• 1234
 */
export function maskCardNumber(pan: string): string {
  const clean = pan.replace(/\D/g, "");
  if (clean.length < 4) return pan;
  const last4 = clean.slice(-4);
  return `•••• •••• •••• ${last4}`;
}

/**
 * Format 16-digit card number with standard spaces (4532 1234 5678 9012)
 */
export function formatCardNumber(pan: string): string {
  const clean = pan.replace(/\D/g, "");
  return clean.replace(/(\d{4})/g, "$1 ").trim();
}
