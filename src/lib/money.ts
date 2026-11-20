/**
 * Safe Financial Mathematics Utilities
 * Prevents IEEE 754 floating-point rounding errors by performing calculations
 * using integer cents (or basis points) and precise conversions.
 */

/**
 * Converts a dollar amount (e.g. 10.50) to integer cents (1050).
 */
export function dollarsToCents(amount: number | string): number {
  const numeric = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numeric)) {
    throw new Error(`Invalid monetary amount: ${amount}`);
  }
  return Math.round(numeric * 100);
}

/**
 * Converts integer cents (e.g. 1050) back to dollar number (10.50).
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Safely adds two monetary amounts avoiding floating-point drift.
 */
export function safeAdd(a: number, b: number): number {
  return centsToDollars(dollarsToCents(a) + dollarsToCents(b));
}

/**
 * Safely subtracts amount b from amount a avoiding floating-point drift.
 */
export function safeSubtract(a: number, b: number): number {
  return centsToDollars(dollarsToCents(a) - dollarsToCents(b));
}

/**
 * Safely multiplies a monetary amount by a percentage or factor.
 * E.g., safeMultiply(100, 0.05) => 5.00
 */
export function safeMultiply(amount: number, factor: number): number {
  const cents = dollarsToCents(amount);
  return centsToDollars(Math.round(cents * factor));
}

/**
 * Formats a monetary amount into standard localized currency string (e.g., "$1,250.00").
 */
export function formatCurrency(
  amount: number | string | null | undefined,
  currency = "USD",
  locale = "en-US"
): string {
  if (amount === null || amount === undefined || amount === "") {
    return "$0.00";
  }
  const numeric = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numeric)) return "$0.00";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

/**
 * Formats a raw number into a clean formatted string without currency symbol (e.g., "1,250.00").
 */
export function formatAmount(
  amount: number | string | null | undefined,
  locale = "en-US"
): string {
  if (amount === null || amount === undefined || amount === "") {
    return "0.00";
  }
  const numeric = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(numeric)) return "0.00";

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numeric);
}

/**
 * Validates whether an amount is a valid positive banking amount.
 */
export function isValidBankingAmount(amount: number): boolean {
  return (
    typeof amount === "number" &&
    !isNaN(amount) &&
    isFinite(amount) &&
    amount > 0 &&
    Number.isInteger(Math.round(amount * 100))
  );
}
