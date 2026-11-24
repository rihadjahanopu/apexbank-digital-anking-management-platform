/**
 * Bangladesh Mobile Recharge & Airtime Engine (মোবাইল রিচার্জ)
 * Supports Grameenphone, Banglalink, Robi, Airtel, and Teletalk
 */

export type MobileOperatorId = "GP" | "BL" | "ROBI" | "AIRTEL" | "TELETALK";
export type ConnectionType = "PREPAID" | "POSTPAID" | "SKITTO";

export interface MobileOperator {
  id: MobileOperatorId;
  name: string;
  bengaliName: string;
  prefixes: string[];
  brandColor: string;
  bgGradient: string;
  logoBg: string;
  supportsSkitto?: boolean;
}

export interface RechargePack {
  id: string;
  operatorId: MobileOperatorId;
  title: string;
  validity: string;
  data?: string;
  minutes?: string;
  sms?: string;
  price: number;
  badge?: string;
  category: "internet" | "minute" | "combo";
}

export const BANGLADESH_OPERATORS: Record<MobileOperatorId, MobileOperator> = {
  GP: {
    id: "GP",
    name: "Grameenphone",
    bengaliName: "গ্রামীণফোন",
    prefixes: ["017", "013"],
    brandColor: "#00A9E0",
    bgGradient: "from-sky-600 to-blue-700",
    logoBg: "bg-sky-500",
    supportsSkitto: true,
  },
  BL: {
    id: "BL",
    name: "Banglalink",
    bengaliName: "বাংলালিংক",
    prefixes: ["019", "014"],
    brandColor: "#FF6600",
    bgGradient: "from-orange-600 to-amber-700",
    logoBg: "bg-orange-500",
  },
  ROBI: {
    id: "ROBI",
    name: "Robi Axiata",
    bengaliName: "রবি",
    prefixes: ["018"],
    brandColor: "#EE1D23",
    bgGradient: "from-red-600 to-rose-700",
    logoBg: "bg-red-500",
  },
  AIRTEL: {
    id: "AIRTEL",
    name: "Airtel Bangladesh",
    bengaliName: "এয়ারটেল",
    prefixes: ["016"],
    brandColor: "#ED1C24",
    bgGradient: "from-rose-600 to-red-800",
    logoBg: "bg-rose-500",
  },
  TELETALK: {
    id: "TELETALK",
    name: "Teletalk Bangladesh",
    bengaliName: "টেলিটক",
    prefixes: ["015"],
    brandColor: "#58B947",
    bgGradient: "from-emerald-600 to-green-700",
    logoBg: "bg-emerald-500",
  },
};

/**
 * Auto-detects the Bangladeshi telecom operator from phone number prefix
 */
export function detectOperator(phone: string): MobileOperatorId | null {
  const clean = phone.replace(/[^0-9]/g, "");
  // Normalize 8801... to 01...
  let normalized = clean;
  if (normalized.startsWith("8801")) {
    normalized = normalized.slice(2);
  }

  if (normalized.length < 3) return null;
  const prefix = normalized.slice(0, 3);

  for (const op of Object.values(BANGLADESH_OPERATORS)) {
    if (op.prefixes.includes(prefix)) {
      return op.id;
    }
  }

  return null;
}

/**
 * Validates Bangladeshi mobile phone number
 * Format: 013XXXXXXXX to 019XXXXXXXX (11 digits)
 */
export function validateBDPhoneNumber(phone: string): { isValid: boolean; normalized: string; error?: string } {
  const clean = phone.replace(/[^0-9]/g, "");
  let normalized = clean;
  if (normalized.startsWith("8801")) {
    normalized = normalized.slice(2);
  }

  if (!normalized.startsWith("01")) {
    return { isValid: false, normalized, error: "Number must start with 01" };
  }

  if (normalized.length !== 11) {
    return { isValid: false, normalized, error: `Number must be 11 digits (current: ${normalized.length})` };
  }

  const validPrefixes = ["013", "014", "015", "016", "017", "018", "019"];
  if (!validPrefixes.includes(normalized.slice(0, 3))) {
    return { isValid: false, normalized, error: "Invalid operator prefix in Bangladesh" };
  }

  return { isValid: true, normalized };
}

// Quick amount presets in BDT
export const RECHARGE_QUICK_AMOUNTS = [20, 50, 100, 200, 500, 1000];

// Popular Bangladeshi Data & Minute Bundles
export const POPULAR_RECHARGE_PACKS: RechargePack[] = [
  // Grameenphone
  {
    id: "gp-net-1",
    operatorId: "GP",
    title: "5 GB Internet",
    validity: "7 Days",
    data: "5 GB",
    price: 114,
    badge: "Hot Deal",
    category: "internet",
  },
  {
    id: "gp-net-2",
    operatorId: "GP",
    title: "15 GB Monthly Internet",
    validity: "30 Days",
    data: "15 GB",
    price: 399,
    badge: "Popular",
    category: "internet",
  },
  {
    id: "gp-voice-1",
    operatorId: "GP",
    title: "320 Minutes Any-Net",
    validity: "30 Days",
    minutes: "320 Mins",
    price: 247,
    category: "minute",
  },
  {
    id: "gp-combo-1",
    operatorId: "GP",
    title: "20 GB + 450 Minutes",
    validity: "30 Days",
    data: "20 GB",
    minutes: "450 Mins",
    sms: "100 SMS",
    price: 598,
    badge: "Best Value",
    category: "combo",
  },

  // Banglalink
  {
    id: "bl-net-1",
    operatorId: "BL",
    title: "6 GB 4G Internet",
    validity: "7 Days",
    data: "6 GB",
    price: 108,
    badge: "Best Seller",
    category: "internet",
  },
  {
    id: "bl-net-2",
    operatorId: "BL",
    title: "25 GB Monthly Internet",
    validity: "30 Days",
    data: "25 GB",
    price: 498,
    badge: "Popular",
    category: "internet",
  },
  {
    id: "bl-voice-1",
    operatorId: "BL",
    title: "500 Minutes Any-Net",
    validity: "30 Days",
    minutes: "500 Mins",
    price: 337,
    category: "minute",
  },
  {
    id: "bl-combo-1",
    operatorId: "BL",
    title: "30 GB + 600 Minutes Combo",
    validity: "30 Days",
    data: "30 GB",
    minutes: "600 Mins",
    price: 649,
    badge: "Mega Pack",
    category: "combo",
  },

  // Robi
  {
    id: "robi-net-1",
    operatorId: "ROBI",
    title: "7 GB Internet",
    validity: "7 Days",
    data: "7 GB",
    price: 129,
    category: "internet",
  },
  {
    id: "robi-net-2",
    operatorId: "ROBI",
    title: "30 GB 4.5G Internet",
    validity: "30 Days",
    data: "30 GB",
    price: 499,
    badge: "Super Saver",
    category: "internet",
  },
  {
    id: "robi-voice-1",
    operatorId: "ROBI",
    title: "400 Minutes Any-Net",
    validity: "30 Days",
    minutes: "400 Mins",
    price: 279,
    category: "minute",
  },
  {
    id: "robi-combo-1",
    operatorId: "ROBI",
    title: "25 GB + 500 Mins Combo",
    validity: "30 Days",
    data: "25 GB",
    minutes: "500 Mins",
    price: 599,
    badge: "Top Choice",
    category: "combo",
  },

  // Airtel
  {
    id: "airtel-net-1",
    operatorId: "AIRTEL",
    title: "8 GB Data Pack",
    validity: "7 Days",
    data: "8 GB",
    price: 119,
    category: "internet",
  },
  {
    id: "airtel-combo-1",
    operatorId: "AIRTEL",
    title: "15 GB + 300 Mins",
    validity: "30 Days",
    data: "15 GB",
    minutes: "300 Mins",
    price: 399,
    badge: "Student Pack",
    category: "combo",
  },

  // Teletalk
  {
    id: "teletalk-net-1",
    operatorId: "TELETALK",
    title: "10 GB Bornomala / Agami",
    validity: "15 Days",
    data: "10 GB",
    price: 98,
    badge: "State Special",
    category: "internet",
  },
  {
    id: "teletalk-voice-1",
    operatorId: "TELETALK",
    title: "300 Minutes",
    validity: "30 Days",
    minutes: "300 Mins",
    price: 149,
    category: "minute",
  },
];
