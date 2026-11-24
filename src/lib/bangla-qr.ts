/**
 * Bangladesh Bank "Bangla QR" (বাংলা কিউআর) Standard Engine
 * Conforms to EMVCo Merchant-Presented Mode (MPM) Specifications
 * Regulated by Payment Systems Department (PSD), Bangladesh Bank
 */

export interface BanglaQRData {
  pointOfInitiation: "11" | "12"; // 11 = Static (Customer enters amount), 12 = Dynamic (Pre-encoded amount)
  merchantId: string;
  merchantName: string;
  merchantCity?: string;
  mcc?: string; // Merchant Category Code (e.g. 5411 = Supermarket, 5812 = Restaurant)
  currency?: string; // 050 = BDT
  amount?: number;
  billNumber?: string;
  storeLabel?: string;
  terminalLabel?: string;
  purpose?: string;
}

export interface BanglaQRPayload {
  isValid: boolean;
  rawString: string;
  isBanglaQR: boolean;
  pointOfInitiation: "11" | "12";
  merchantId: string;
  merchantName: string;
  merchantCity: string;
  mcc: string;
  mccCategory: string;
  currency: string;
  currencySymbol: string;
  amount: number | null;
  billNumber?: string;
  storeLabel?: string;
  terminalLabel?: string;
  crcValid: boolean;
}

// Common Merchant Category Code (MCC) definitions in Bangladesh
export const BANGLA_QR_MCC_MAP: Record<string, string> = {
  "5411": "Supermarkets & Grocery",
  "5812": "Restaurants & Dining",
  "5814": "Fast Food & Cafes",
  "5912": "Pharmacies & Healthcare",
  "5651": "Clothing & Apparel",
  "5999": "Retail & General Merchant",
  "4814": "Telecommunication Services",
  "4111": "Public Transportation",
  "4722": "Travel Agencies & Airlines",
  "8220": "Colleges & Universities",
  "8062": "Hospitals & Medical Centers",
  "6012": "Financial Institutions (P2P Transfer)",
};

/**
 * Calculates 16-bit CRC checksum (CRC-CCITT with polynomial 0x1021 and initial value 0xFFFF)
 * Required by EMVCo Tag 63.
 */
export function calculateCRC16(str: string): string {
  let crc = 0xffff;
  for (let i = 0; i < str.length; i++) {
    const code = str.charCodeAt(i);
    crc ^= code << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = ((crc << 1) ^ 0x1021) & 0xffff;
      } else {
        crc = (crc << 1) & 0xffff;
      }
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

/**
 * Formats a single EMVCo TLV (Tag-Length-Value) chunk
 */
function formatTLV(tag: string, value: string): string {
  const len = value.length.toString().padStart(2, "0");
  return `${tag}${len}${value}`;
}

/**
 * Encodes Bangla QR data into a standardized EMVCo payload string
 */
export function encodeBanglaQR(data: BanglaQRData): string {
  let payload = "";

  // Tag 00: Payload Format Indicator (01)
  payload += formatTLV("00", "01");

  // Tag 01: Point of Initiation Method (11: Static, 12: Dynamic)
  payload += formatTLV("01", data.pointOfInitiation);

  // Tag 26: Merchant Account Information (Bangladesh Bank NPSB / ApexBank Scheme)
  // Sub-tags: 00 = Reverse Domain / Scheme, 01 = Merchant Account Number
  const subTag00 = formatTLV("00", "BD.BB.NPSB.BANGLAQR");
  const subTag01 = formatTLV("01", data.merchantId);
  payload += formatTLV("26", `${subTag00}${subTag01}`);

  // Tag 52: Merchant Category Code (default 5411)
  payload += formatTLV("52", data.mcc || "5411");

  // Tag 53: Transaction Currency (050 = BDT)
  payload += formatTLV("53", data.currency || "050");

  // Tag 54: Transaction Amount (included for dynamic QR)
  if (data.amount && data.amount > 0) {
    payload += formatTLV("54", data.amount.toFixed(2));
  }

  // Tag 58: Country Code (BD = Bangladesh)
  payload += formatTLV("58", "BD");

  // Tag 59: Merchant Name
  const cleanName = data.merchantName.slice(0, 25).toUpperCase();
  payload += formatTLV("59", cleanName);

  // Tag 60: Merchant City
  const cleanCity = (data.merchantCity || "DHAKA").slice(0, 15).toUpperCase();
  payload += formatTLV("60", cleanCity);

  // Tag 62: Additional Data Field Template (optional bill, store, terminal)
  let sub62 = "";
  if (data.billNumber) sub62 += formatTLV("01", data.billNumber);
  if (data.storeLabel) sub62 += formatTLV("03", data.storeLabel);
  if (data.terminalLabel) sub62 += formatTLV("07", data.terminalLabel);
  if (data.purpose) sub62 += formatTLV("08", data.purpose);
  if (sub62) {
    payload += formatTLV("62", sub62);
  }

  // Tag 63: CRC (Checksum)
  const toChecksum = `${payload}6304`;
  const checksum = calculateCRC16(toChecksum);

  return `${payload}6304${checksum}`;
}

/**
 * Decodes a raw scanned string (EMVCo TLV or Interoperable JSON) into BanglaQRPayload
 */
export function decodeBanglaQR(rawString: string): BanglaQRPayload {
  const trimmed = rawString.trim();

  // 1. Check if it is a JSON fallback format
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    try {
      const parsed = JSON.parse(trimmed);
      return {
        isValid: true,
        rawString: trimmed,
        isBanglaQR: true,
        pointOfInitiation: parsed.amount ? "12" : "11",
        merchantId: parsed.merchantId || parsed.accountNumber || "APEX-M-001",
        merchantName: parsed.merchantName || parsed.name || "APEX MERCHANT",
        merchantCity: parsed.city || "Dhaka",
        mcc: parsed.mcc || "5411",
        mccCategory: BANGLA_QR_MCC_MAP[parsed.mcc || "5411"] || "General Merchant",
        currency: "050",
        currencySymbol: "৳",
        amount: parsed.amount ? Number(parsed.amount) : null,
        billNumber: parsed.billNumber,
        storeLabel: parsed.storeLabel,
        terminalLabel: parsed.terminalLabel,
        crcValid: true,
      };
    } catch {
      // Fall through to TLV parser
    }
  }

  // 2. Standard EMVCo TLV parser
  if (!trimmed.startsWith("000201")) {
    return {
      isValid: false,
      rawString: trimmed,
      isBanglaQR: false,
      pointOfInitiation: "11",
      merchantId: "",
      merchantName: "Unknown Merchant",
      merchantCity: "Bangladesh",
      mcc: "5411",
      mccCategory: "Unrecognized QR Standard",
      currency: "050",
      currencySymbol: "৳",
      amount: null,
      crcValid: false,
    };
  }

  const tags: Record<string, string> = {};
  let cursor = 0;

  try {
    while (cursor < trimmed.length) {
      const tag = trimmed.slice(cursor, cursor + 2);
      const lenStr = trimmed.slice(cursor + 2, cursor + 4);
      const len = parseInt(lenStr, 10);
      if (isNaN(len)) break;

      const val = trimmed.slice(cursor + 4, cursor + 4 + len);
      tags[tag] = val;
      cursor += 4 + len;
    }
  } catch {
    // Parser error
  }

  // Verify CRC if Tag 63 exists
  let crcValid = false;
  const crcIndex = trimmed.indexOf("6304");
  if (crcIndex !== -1) {
    const dataPart = trimmed.slice(0, crcIndex + 4);
    const expectedCrc = trimmed.slice(crcIndex + 4, crcIndex + 8).toUpperCase();
    const calculated = calculateCRC16(dataPart);
    crcValid = expectedCrc === calculated;
  }

  // Extract merchant ID from Tag 26 (sub-tags)
  let merchantId = "NPSB-APEX-001";
  if (tags["26"]) {
    const tag26 = tags["26"];
    const sub01Idx = tag26.indexOf("01");
    if (sub01Idx !== -1) {
      const subLen = parseInt(tag26.slice(sub01Idx + 2, sub01Idx + 4), 10);
      if (!isNaN(subLen)) {
        merchantId = tag26.slice(sub01Idx + 4, sub01Idx + 4 + subLen);
      }
    } else {
      merchantId = tag26;
    }
  }

  const mcc = tags["52"] || "5411";
  const amountStr = tags["54"];
  const amount = amountStr ? parseFloat(amountStr) : null;

  return {
    isValid: true,
    rawString: trimmed,
    isBanglaQR: true,
    pointOfInitiation: (tags["01"] as "11" | "12") || "11",
    merchantId,
    merchantName: tags["59"] || "SHWAPNO SUPERSTORE",
    merchantCity: tags["60"] || "DHAKA",
    mcc,
    mccCategory: BANGLA_QR_MCC_MAP[mcc] || "Retail Merchant",
    currency: tags["53"] || "050",
    currencySymbol: "৳",
    amount: amount !== null && !isNaN(amount) ? amount : null,
    crcValid,
  };
}

/**
 * Realistic Bangladeshi Merchant & P2P Presets for Instant UI Testing & Demonstration
 */
export const SAMPLE_BANGLA_QRS = [
  {
    id: "shwapno",
    name: "Shwapno Superstore (স্বপ্ন সুপারস্টোর)",
    city: "Gulshan-2, Dhaka",
    mcc: "5411",
    category: "Supermarket & Grocery",
    amount: 1450.0,
    pointOfInitiation: "12" as const,
    billNumber: "SHW-2026-891",
    merchantId: "NPSB-SHWAPNO-088",
    logoText: "স্বপ্ন",
  },
  {
    id: "aarong",
    name: "Aarong Lifestyle (আড়ং)",
    city: "Uttara, Dhaka",
    mcc: "5651",
    category: "Clothing & Fashion",
    amount: 3820.0,
    pointOfInitiation: "12" as const,
    billNumber: "ARN-88219",
    merchantId: "NPSB-AARONG-019",
    logoText: "আড়ং",
  },
  {
    id: "sultans_dine",
    name: "Sultan's Dine (সুলতান'স ডাইন)",
    city: "Dhanmondi, Dhaka",
    mcc: "5812",
    category: "Restaurant & Kacchi",
    amount: 850.0,
    pointOfInitiation: "12" as const,
    billNumber: "SLT-KACCHI-04",
    merchantId: "NPSB-SULTAN-11",
    logoText: "সুলতান",
  },
  {
    id: "star_cineplex",
    name: "Star Cineplex (স্টার সিনেপ্লেক্স)",
    city: "Bashundhara City, Dhaka",
    mcc: "5814",
    category: "Entertainment & Cinema",
    amount: 450.0,
    pointOfInitiation: "12" as const,
    billNumber: "STR-CNPX-99",
    merchantId: "NPSB-STAR-34",
    logoText: "STAR",
  },
  {
    id: "labaid",
    name: "Labaid Diagnostic (ল্যাবএইড ডায়াগনস্টিক)",
    city: "Dhanmondi, Dhaka",
    mcc: "5912",
    category: "Healthcare & Pharmacy",
    amount: 2200.0,
    pointOfInitiation: "12" as const,
    billNumber: "LBD-TEST-771",
    merchantId: "NPSB-LABAID-09",
    logoText: "LABAID",
  },
  {
    id: "p2p_personal",
    name: "Apex P2P Personal Account",
    city: "Dhaka",
    mcc: "6012",
    category: "Personal Account (Static QR)",
    amount: undefined, // Customer enters any amount
    pointOfInitiation: "11" as const,
    billNumber: undefined,
    merchantId: "APEX-P2P-882901",
    logoText: "P2P",
  },
];
