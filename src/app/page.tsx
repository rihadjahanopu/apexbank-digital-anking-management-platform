"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import {
  Building2,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Wallet,
  Users,
  Lock,
  Zap,
  CheckCircle2,
  Sparkles,
  Globe2,
  CreditCard,
  ArrowDownLeft,
  ChevronDown,
  ChevronUp,
  Landmark,
  ShieldAlert,
  Award,
  Smartphone,
  Cpu,
  BadgeCheck,
  Menu,
  X,
  Activity,
  Clock,
  ScanLine,
  RefreshCw,
  Coins,
  Scale,
  Check,
  FileCheck2,
} from "lucide-react";
import { useAppSelector } from "@/redux/hooks";

// Metal Card Tiers
type CardTier = "emerald" | "obsidian" | "platinum";

interface CardTierConfig {
  name: string;
  badge: string;
  material: string;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
  chipColor: string;
  cashback: string;
  atmFree: string;
  perks: string[];
}

const CARD_TIERS: Record<CardTier, CardTierConfig> = {
  emerald: {
    name: "Apex Emerald Reserve",
    badge: "Most Popular",
    material: "Solid 18g Recycled Forest Steel & Ceramic",
    bgGradient: "bg-linear-to-br from-emerald-900 via-teal-950 to-slate-950",
    borderColor: "border-emerald-400/40",
    textColor: "text-emerald-100",
    accentColor: "text-emerald-400",
    chipColor: "from-amber-300 via-yellow-400 to-amber-500",
    cashback: "2.5% Unlimited Cashback",
    atmFree: "Free Global ATM Withdrawals (up to $2,000/mo)",
    perks: [
      "Zero foreign transaction spread",
      "5.40% APY High-Yield Vault Access",
      "Smart OCR Auto-Provisioning",
      "Comprehensive Worldwide Travel Insurance",
    ],
  },
  obsidian: {
    name: "Apex Obsidian Titanium",
    badge: "Ultra Exclusive",
    material: "Heavy 22g Precision Laser-Etched Black Titanium",
    bgGradient: "bg-linear-to-br from-neutral-900 via-neutral-950 to-emerald-950",
    borderColor: "border-neutral-500/40",
    textColor: "text-neutral-100",
    accentColor: "text-neutral-300",
    chipColor: "from-slate-200 via-slate-300 to-slate-400",
    cashback: "4.0% Unlimited Cashback",
    atmFree: "Unlimited Free Worldwide ATM Access",
    perks: [
      "Dedicated 24/7 Private Wealth Banker",
      "Lombard Credit Lines up to $5,000,000",
      "LoungeKey Priority Airport Access (1,400+ VIP Lounges)",
      "Zero FX Markup on 42 Currencies",
    ],
  },
  platinum: {
    name: "Apex Champagne Platinum",
    badge: "Private Wealth",
    material: "Mirror-Polished White Ceramic & Palladium",
    bgGradient: "bg-linear-to-br from-stone-900 via-amber-950/60 to-emerald-950",
    borderColor: "border-amber-400/40",
    textColor: "text-amber-100",
    accentColor: "text-amber-400",
    chipColor: "from-amber-200 via-yellow-300 to-amber-400",
    cashback: "3.2% Unlimited Cashback",
    atmFree: "Free Global ATM Withdrawals (up to $5,000/mo)",
    perks: [
      "Bespoke Family Office Multi-Entity Accounts",
      "Priority SWIFT Atomic Wire Processing",
      "Luxury Concierge & Event Access Worldwide",
      "Direct Gold Bullion & Foreign Currency Custody",
    ],
  },
};

// Exchange rates for live converter
const FX_RATES: Record<string, { rate: number; symbol: string; name: string; flag: string }> = {
  EUR: { rate: 0.9242, symbol: "€", name: "Euro", flag: "🇪🇺" },
  GBP: { rate: 0.7894, symbol: "£", name: "British Pound", flag: "🇬🇧" },
  CHF: { rate: 0.8841, symbol: "CHF", name: "Swiss Franc", flag: "🇨🇭" },
  BDT: { rate: 121.5, symbol: "৳", name: "Bangladeshi Taka", flag: "🇧🇩" },
  JPY: { rate: 154.3, symbol: "¥", name: "Japanese Yen", flag: "🇯🇵" },
  CAD: { rate: 1.382, symbol: "C$", name: "Canadian Dollar", flag: "🇨🇦" },
};

export default function HomePage() {
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  // Card showcase state
  const [selectedCardTier, setSelectedCardTier] = useState<CardTier>("emerald");
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  // FX Converter state
  const [fxAmountUSD, setFxAmountUSD] = useState<number>(2500);
  const [targetCurrency, setTargetCurrency] = useState<string>("EUR");

  // Savings Yield Calculator state
  const [depositAmount, setDepositAmount] = useState<number>(25000);
  const [tenureYears, setTenureYears] = useState<number>(2);
  const apyRate = 0.054; // 5.40%

  // Banking Suite tab state
  const [activeTab, setActiveTab] = useState<"personal" | "business" | "wealth">("personal");

  // FAQ accordion state
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  // Mobile menu open state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Calculated compound savings
  const calculatedSavings = useMemo(() => {
    // A = P * (1 + r/12)^(12 * t)
    const months = tenureYears * 12;
    const monthlyRate = apyRate / 12;
    const finalAmount = depositAmount * Math.pow(1 + monthlyRate, months);
    const totalInterest = finalAmount - depositAmount;
    const monthlyAveragePayout = totalInterest / months;

    // Traditional bank comparison (0.02% APY)
    const traditionalFinal = depositAmount * Math.pow(1 + 0.0002 / 12, months);
    const traditionalInterest = traditionalFinal - depositAmount;
    const difference = totalInterest - traditionalInterest;

    return {
      finalAmount,
      totalInterest,
      monthlyAveragePayout,
      difference,
      multiplier: traditionalInterest > 0 ? (totalInterest / traditionalInterest).toFixed(0) : "270",
    };
  }, [depositAmount, tenureYears]);

  // Converted FX amount
  const convertedFX = useMemo(() => {
    const rateInfo = FX_RATES[targetCurrency] || FX_RATES.EUR;
    const converted = fxAmountUSD * rateInfo.rate;
    return {
      converted,
      rate: rateInfo.rate,
      symbol: rateInfo.symbol,
      flag: rateInfo.flag,
      name: rateInfo.name,
      savingsUSD: (fxAmountUSD * 0.035).toFixed(2),
    };
  }, [fxAmountUSD, targetCurrency]);

  // Target Dashboard Link
  const dashboardLink = useMemo(() => {
    if (!user) return "/login";
    if (user.role === "ADMIN") return "/admin/dashboard";
    if (user.role === "STAFF") return "/staff/dashboard";
    return "/customer/dashboard";
  }, [user]);

  const activeCard = CARD_TIERS[selectedCardTier];

  return (
    <div className="min-h-screen bg-[#020b08] text-slate-100 selection:bg-emerald-500 selection:text-white font-sans overflow-x-hidden relative">
      {/* Dynamic Ambient Background Gradients (Glassy Forest Theme) */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        {/* Top-center Emerald Aurora Glow */}
        <div className="absolute -top-[20%] left-1/2 -translate-x-1/2 w-[900px] h-[650px] bg-emerald-600/15 rounded-full blur-[140px] animate-pulse-emerald" />
        {/* Left deep teal glow */}
        <div className="absolute top-[35%] -left-[10%] w-[600px] h-[600px] bg-teal-800/10 rounded-full blur-[160px]" />
        {/* Right emerald/mint light */}
        <div className="absolute top-[65%] -right-[10%] w-[700px] h-[700px] bg-emerald-500/10 rounded-full blur-[180px]" />
        {/* Grid pattern overlay with very subtle opacity */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(rgba(52, 211, 153, 0.8) 1px, transparent 1px)`,
            backgroundSize: "32px 32px",
          }}
        />
      </div>

      {/* Institutional Top Trust Bar */}
      <div className="border-b border-emerald-950/80 bg-[#03150e]/90 text-[11px] text-emerald-400/80 py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 font-medium">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping inline-block" />
              SWIFT Global Settlement: ONLINE (99.999% SLA)
            </span>
            <span className="hidden sm:inline text-emerald-900">•</span>
            <span className="hidden sm:inline text-slate-400">
              Institution Code: <span className="font-mono text-emerald-300">APEX-US-33</span>
            </span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span className="hidden md:inline flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Member FDIC & Regulated Commercial Bank
            </span>
            <span className="text-emerald-300 font-mono">24/7 Concierge Desk</span>
          </div>
        </div>
      </div>

      {/* Floating Glass Forest Navigation Header */}
      <header className="sticky top-0 z-50 w-full glass-forest-nav">
        <div className="max-w-7xl mx-auto flex h-20 items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-linear-to-tr from-emerald-600 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/25 border border-emerald-300/30 group-hover:scale-105 transition-transform">
              <Landmark className="h-6 w-6 text-slate-950" />
              <div className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-emerald-400 border-2 border-[#020b08]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold tracking-tight text-white group-hover:text-emerald-300 transition-colors">
                  Apex<span className="text-emerald-400">Bank</span>
                </span>
                <span className="rounded-full bg-emerald-950 border border-emerald-500/30 px-2 py-0.5 text-[9px] font-semibold text-emerald-300 uppercase tracking-wider">
                  Reserve
                </span>
              </div>
              <p className="text-[10px] text-emerald-400/60 tracking-wider uppercase font-mono">
                International Digital Banking
              </p>
            </div>
          </Link>

          {/* Real Commercial Bank Navigation Links */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a
              href="#accounts"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              Accounts & Vaults
            </a>
            <a
              href="#cards"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              Titanium Cards
            </a>
            <a
              href="#transfers"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              FX & Wires
            </a>
            <a
              href="#calculator"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              Yield Calculator
              <span className="rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] px-1.5 py-0.2 font-mono border border-emerald-400/30">
                5.40%
              </span>
            </a>
            <a
              href="#security"
              className="hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              Security
            </a>
          </nav>

          {/* Action Area */}
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Link href={dashboardLink}>
                <button className="flex items-center gap-2 rounded-xl bg-linear-to-r from-emerald-500 via-teal-500 to-emerald-600 px-4 py-2.5 text-xs font-semibold text-slate-950 shadow-lg shadow-emerald-500/20 hover:brightness-110 active:scale-95 transition-all">
                  <Activity className="h-4 w-4" />
                  <span>Enter Dashboard ({user?.role})</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </Link>
            ) : (
              <>
                <Link href="/login">
                  <button className="rounded-xl border border-emerald-500/30 bg-emerald-950/40 px-4 py-2 text-xs font-medium text-emerald-200 hover:bg-emerald-900/60 hover:text-white transition-all backdrop-blur-md">
                    Sign In
                  </button>
                </Link>
                <Link href="/register">
                  <button className="relative group overflow-hidden rounded-xl bg-linear-to-r from-emerald-500 to-teal-400 px-4 py-2 text-xs font-semibold text-slate-950 shadow-lg shadow-emerald-500/25 hover:shadow-emerald-500/40 hover:scale-[1.02] active:scale-98 transition-all">
                    <span className="relative z-10 flex items-center gap-1.5">
                      Open Bank Account
                      <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                    </span>
                    <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
                  </button>
                </Link>
              </>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl border border-emerald-500/20 bg-emerald-950/40 text-emerald-300"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden glass-forest-card border-x-0 border-t border-emerald-500/20 px-6 py-6 space-y-4">
            <nav className="flex flex-col space-y-3 text-sm font-medium">
              <a
                href="#accounts"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-200 hover:text-emerald-400 py-1"
              >
                Accounts & Vaults (5.40% APY)
              </a>
              <a
                href="#cards"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-200 hover:text-emerald-400 py-1"
              >
                Obsidian Titanium Cards
              </a>
              <a
                href="#transfers"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-200 hover:text-emerald-400 py-1"
              >
                Zero-Markup Global Transfers
              </a>
              <a
                href="#calculator"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-200 hover:text-emerald-400 py-1"
              >
                Interactive Yield Calculator
              </a>
              <a
                href="#security"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-200 hover:text-emerald-400 py-1"
              >
                Security & FDIC Protection
              </a>
            </nav>
            <div className="pt-4 border-t border-emerald-900/40 flex flex-col gap-2">
              <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full py-2.5 rounded-xl border border-emerald-500/30 text-sm font-medium text-emerald-300">
                  Online Banking Sign In
                </button>
              </Link>
              <Link href="/register" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full py-2.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-400 text-slate-950 font-semibold text-sm">
                  Open Account with Smart OCR
                </button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Live Financial Rates Marquee Ticker */}
      <section className="border-b border-emerald-950/80 bg-[#03150e]/60 backdrop-blur-md overflow-hidden py-2.5">
        <div className="animate-marquee flex items-center gap-10 whitespace-nowrap text-xs font-mono">
          <div className="flex items-center gap-2 text-emerald-400">
            <span className="text-slate-400">HIGH-YIELD VAULT APY:</span>
            <span className="font-bold">5.40% GUARANTEED</span>
            <TrendingUp className="h-3.5 w-3.5" />
          </div>
          <span className="text-emerald-900">|</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">USD/EUR:</span>
            <span className="text-emerald-300 font-semibold">0.9242</span>
            <span className="text-emerald-400 text-[10px]">+0.14%</span>
          </div>
          <span className="text-emerald-900">|</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">USD/GBP:</span>
            <span className="text-emerald-300 font-semibold">0.7894</span>
            <span className="text-emerald-400 text-[10px]">+0.09%</span>
          </div>
          <span className="text-emerald-900">|</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">GOLD/USD:</span>
            <span className="text-amber-300 font-semibold">$2,718.40</span>
            <span className="text-emerald-400 text-[10px]">+0.82%</span>
          </div>
          <span className="text-emerald-900">|</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">SWIFT ATOMIC WIRE SPEED:</span>
            <span className="text-teal-300 font-semibold">&lt; 1.4 SECONDS</span>
          </div>
          <span className="text-emerald-900">|</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">USD/BDT:</span>
            <span className="text-emerald-300 font-semibold">121.50</span>
            <span className="text-emerald-400 text-[10px]">+0.05%</span>
          </div>
          <span className="text-emerald-900">|</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">DEPOSIT INSURANCE:</span>
            <span className="text-emerald-300 font-semibold">FDIC $250,000 PER DEPOSITOR</span>
          </div>
          <span className="text-emerald-900">|</span>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">CROSS-BORDER FX SPREAD:</span>
            <span className="text-teal-300 font-semibold">0.00% ZERO MARKUP</span>
          </div>
        </div>
      </section>

      {/* Hero Section: Majestic Sovereign Digital Banking */}
      <section className="relative pt-12 pb-24 md:pt-20 md:pb-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Column: Authentic Commercial Banking Narrative */}
            <div className="lg:col-span-7 space-y-6 text-left">
              {/* Trust Badge */}
              <div className="inline-flex items-center gap-2.5 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-4 py-1.5 text-xs font-medium text-emerald-300 backdrop-blur-xl">
                <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Next-Gen Private Reserve & Institutional Banking</span>
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              </div>

              {/* Grand Headline */}
              <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
                Sovereign Wealth. <br />
                <span className="bg-linear-to-r from-emerald-300 via-teal-300 to-emerald-500 bg-clip-text text-transparent">
                  Borderless Precision.
                </span>
              </h1>

              {/* Real Bank Subtitle */}
              <p className="text-base sm:text-xl text-slate-300 font-normal leading-relaxed max-w-2xl">
                Experience the world’s premier digital banking ecosystem. Safeguard capital in
                FDIC-insured vaults earning <strong className="text-emerald-300 font-semibold">5.40% APY</strong>,
                settle cross-border transactions at pure interbank rates, and command your wealth with
                laser-engraved obsidian titanium cards.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-4">
                <Link href={isAuthenticated ? dashboardLink : "/register"}>
                  <button className="group relative flex items-center gap-3 rounded-2xl bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-600 px-7 py-4 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:scale-[1.02] active:scale-98 transition-all">
                    <ScanLine className="h-5 w-5 text-slate-950" />
                    <span>{isAuthenticated ? "Go to Live Portal" : "Open Account in 3 Mins"}</span>
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </Link>

                <a href="#calculator">
                  <button className="flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-950/40 px-6 py-4 text-sm font-semibold text-emerald-200 hover:bg-emerald-900/60 hover:text-white transition-all backdrop-blur-xl">
                    <Coins className="h-4 w-4 text-emerald-400" />
                    <span>Calculate 5.40% Yield</span>
                  </button>
                </a>
              </div>

              {/* Fast Security Checkpoints */}
              <div className="pt-2 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>Smart OCR Automated ID Scan</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>FIDO2 Passkeys & Biometric Login</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                  <span>No Foreign Exchange Markup</span>
                </div>
              </div>

              {/* 4 Financial Confidence Metrics */}
              <div className="pt-6 grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-emerald-950/80">
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                    $48.2B+
                  </div>
                  <div className="text-xs text-emerald-400/80 font-medium mt-0.5">
                    Assets Safeguarded
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-emerald-300 font-mono">
                    5.40%
                  </div>
                  <div className="text-xs text-emerald-400/80 font-medium mt-0.5">
                    Guaranteed APY Yield
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-teal-300 font-mono">
                    &lt; 1.4s
                  </div>
                  <div className="text-xs text-emerald-400/80 font-medium mt-0.5">
                    Atomic Wire Clearance
                  </div>
                </div>
                <div>
                  <div className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                    180+
                  </div>
                  <div className="text-xs text-emerald-400/80 font-medium mt-0.5">
                    Global Jurisdictions
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column: 3D Interactive Metal Bank Card & Live Banking Stream */}
            <div className="lg:col-span-5 relative flex flex-col items-center">
              {/* Card Tier Switcher Selector */}
              <div className="mb-6 flex items-center p-1 rounded-2xl glass-forest-pill border border-emerald-500/20 text-xs">
                {(["emerald", "obsidian", "platinum"] as CardTier[]).map((tier) => (
                  <button
                    key={tier}
                    onClick={() => {
                      setSelectedCardTier(tier);
                      setIsCardFlipped(false);
                    }}
                    className={`px-3.5 py-1.5 rounded-xl font-medium transition-all capitalize ${
                      selectedCardTier === tier
                        ? "bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {tier}
                  </button>
                ))}
              </div>

              {/* 3D Flippable Bank Card Container */}
              <div className="w-full max-w-sm sm:max-w-md perspective-1000 relative">
                {/* Floating Activity Alert #1 (Incoming Wire) */}
                <div className="absolute -top-6 -left-4 sm:-left-8 z-20 animate-float">
                  <div className="glass-forest-card rounded-2xl px-3.5 py-2.5 flex items-center gap-3 border border-emerald-400/30 shadow-xl backdrop-blur-2xl">
                    <div className="h-8 w-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                      <ArrowDownLeft className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-emerald-400/80 uppercase tracking-wider font-mono">
                        Incoming Wire • Zurich
                      </div>
                      <div className="text-xs font-bold text-white font-mono">+$35,000.00 USD</div>
                    </div>
                  </div>
                </div>

                {/* Floating Activity Alert #2 (Yield Payout) */}
                <div className="absolute -bottom-8 -right-4 sm:-right-6 z-20 animate-float-reverse">
                  <div className="glass-forest-card rounded-2xl px-3.5 py-2.5 flex items-center gap-3 border border-emerald-400/30 shadow-xl backdrop-blur-2xl">
                    <div className="h-8 w-8 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-[10px] text-teal-400/80 uppercase tracking-wider font-mono">
                        Vault Payout (5.40% APY)
                      </div>
                      <div className="text-xs font-bold text-emerald-300 font-mono">
                        +$521.80 Monthly
                      </div>
                    </div>
                  </div>
                </div>

                {/* The Physical Card Itself */}
                <div
                  onClick={() => setIsCardFlipped(!isCardFlipped)}
                  className={`w-full aspect-85/54 rounded-3xl p-6 sm:p-7 cursor-pointer transition-all duration-700 transform-style-3d shadow-2xl relative select-none ${
                    activeCard.bgGradient
                  } border ${activeCard.borderColor} ${
                    isCardFlipped ? "rotate-y-180" : "hover:scale-[1.02]"
                  }`}
                  style={{
                    boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 35px -5px rgba(16, 185, 129, 0.2)",
                  }}
                >
                  {/* FRONT OF CARD */}
                  <div className="absolute inset-0 p-6 sm:p-7 flex flex-col justify-between backface-hidden rounded-3xl overflow-hidden">
                    {/* Metallic Shimmer Overlay */}
                    <div className="absolute inset-0 bg-linear-to-tr from-white/0 via-white/5 to-white/0 opacity-60 pointer-events-none" />

                    {/* Top Header: Chip, Contactless, Apex Logo */}
                    <div className="flex items-center justify-between relative z-10">
                      <div className="flex items-center gap-3">
                        {/* Realistic Gold EMV Chip */}
                        <div
                          className={`w-11 h-8 rounded-lg bg-linear-to-br ${activeCard.chipColor} border border-amber-200/50 shadow-inner flex flex-col justify-around p-1`}
                        >
                          <div className="h-px bg-amber-800/40 w-full" />
                          <div className="h-px bg-amber-800/40 w-full" />
                        </div>
                        {/* Contactless Wave */}
                        <div className="text-white/60">
                          <Zap className="h-5 w-5 rotate-45" />
                        </div>
                      </div>

                      {/* Apex Reserve Brand Mark */}
                      <div className="text-right">
                        <div className="text-sm font-bold tracking-wider text-white">APEX RESERVE</div>
                        <div className="text-[9px] uppercase tracking-widest text-emerald-400 font-mono">
                          WORLD ELITE
                        </div>
                      </div>
                    </div>

                    {/* Middle: Embossed Masked Card Number */}
                    <div className="relative z-10 my-auto">
                      <div className="font-mono text-lg sm:text-xl tracking-[0.25em] text-white/95 font-semibold drop-shadow-md">
                        4929 •••• •••• 8829
                      </div>
                    </div>

                    {/* Bottom: Cardholder, Expiry, VISA/Mastercard Hologram */}
                    <div className="flex items-end justify-between relative z-10 pt-2">
                      <div>
                        <div className="text-[8px] uppercase tracking-widest text-white/50 font-mono">
                          CARDHOLDER
                        </div>
                        <div className="font-mono text-xs sm:text-sm font-semibold tracking-wider text-white">
                          {user?.name?.toUpperCase() || "RIHAD AL-ISLAM / PRIVATE CLIENT"}
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="text-[8px] uppercase tracking-widest text-white/50 font-mono">
                          EXPIRES
                        </div>
                        <div className="font-mono text-xs font-semibold text-white">11/31</div>
                      </div>

                      {/* Holographic Circles Symbol */}
                      <div className="flex -space-x-3 items-center">
                        <div className="w-7 h-7 rounded-full bg-red-500/80 backdrop-blur-xs border border-white/20" />
                        <div className="w-7 h-7 rounded-full bg-amber-400/80 backdrop-blur-xs border border-white/20" />
                      </div>
                    </div>
                  </div>

                  {/* BACK OF CARD */}
                  <div className="absolute inset-0 flex flex-col justify-between backface-hidden rotate-y-180 rounded-3xl overflow-hidden bg-slate-950 border border-emerald-500/20">
                    {/* Top Magnetic Stripe */}
                    <div className="w-full h-12 bg-neutral-900 mt-6 border-y border-neutral-800" />

                    {/* Middle: Signature Strip & CVV */}
                    <div className="px-6 space-y-2">
                      <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono">
                        <span>24/7 INTERNATIONAL CONCIERGE: +1 (800) 555-APEX</span>
                        <span>MEMBER FDIC</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="h-9 flex-1 bg-neutral-200 rounded-md flex items-center px-3 font-serif italic text-neutral-800 text-xs">
                          {user?.name || "Rihad Al-Islam"}
                        </div>
                        <div className="h-9 w-14 bg-white rounded-md flex items-center justify-center font-mono font-bold text-slate-950 text-sm tracking-widest border border-slate-300">
                          742
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Legal Disclaimers & Chip Spec */}
                    <div className="p-6 pt-0 text-[8px] text-slate-500 font-mono leading-tight">
                      This card is the property of Apex International Bank Ltd. Issued pursuant to license
                      by Mastercard World Elite. Use governed by Private Banking Client Agreement.
                    </div>
                  </div>
                </div>

                {/* Flip Card Action Button */}
                <div className="mt-4 flex items-center justify-between text-xs text-slate-400 px-2">
                  <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                    <BadgeCheck className="h-4 w-4" />
                    {activeCard.material}
                  </span>
                  <button
                    onClick={() => setIsCardFlipped(!isCardFlipped)}
                    className="flex items-center gap-1 text-slate-300 hover:text-white underline underline-offset-4 font-mono text-[11px]"
                  >
                    <RefreshCw className="h-3 w-3" />
                    {isCardFlipped ? "Show Front" : "Tap to Flip Card (CVV)"}
                  </button>
                </div>
              </div>

              {/* Card Perks Bullet Summary */}
              <div className="mt-6 w-full max-w-sm sm:max-w-md glass-forest-card rounded-2xl p-4 text-xs space-y-2">
                <div className="flex items-center justify-between font-semibold text-white pb-1 border-b border-emerald-900/40">
                  <span className="text-emerald-300">{activeCard.name}</span>
                  <span className="text-teal-300">{activeCard.cashback}</span>
                </div>
                <div className="text-slate-300 flex items-center gap-2">
                  <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  <span>{activeCard.atmFree}</span>
                </div>
                {activeCard.perks.slice(0, 2).map((perk, i) => (
                  <div key={i} className="text-slate-400 flex items-center gap-2">
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                    <span>{perk}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FinTech Tool 1: Real-Time Interbank FX Currency Converter */}
      <section id="transfers" className="py-20 border-t border-emerald-950/80 bg-[#03150e]/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
            <div className="inline-flex items-center gap-2 rounded-full border border-teal-500/30 bg-teal-950/40 px-3.5 py-1 text-xs font-semibold text-teal-300">
              <Globe2 className="h-3.5 w-3.5" />
              <span>Zero-Markup International Settlement Engine</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Pure Interbank Exchange. <br />
              <span className="text-emerald-400">Zero Hidden Spreads.</span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              Traditional high-street banks inflate exchange rates by 3% to 5%. Apex Bank executes
              every cross-border conversion at the exact live wholesale interbank rate.
            </p>
          </div>

          {/* Interactive Converter Box */}
          <div className="max-w-4xl mx-auto glass-forest-card rounded-3xl p-6 sm:p-10 border border-emerald-500/25 shadow-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Input: You Send */}
              <div className="space-y-4">
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400">
                  You Send (Source Currency)
                </label>
                <div className="flex items-center rounded-2xl bg-[#020e09] border border-emerald-500/30 p-3 sm:p-4 focus-within:border-emerald-400 transition-colors">
                  <span className="text-lg font-bold text-emerald-400 font-mono pr-2">$</span>
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={fxAmountUSD}
                    onChange={(e) => setFxAmountUSD(Math.max(1, Number(e.target.value)))}
                    className="w-full bg-transparent text-xl sm:text-2xl font-bold font-mono text-white outline-hidden"
                  />
                  <div className="flex items-center gap-2 pl-3 border-l border-emerald-900/60 font-semibold text-sm text-slate-200">
                    <span>🇺🇸</span>
                    <span>USD</span>
                  </div>
                </div>

                {/* Target Currency Selector */}
                <label className="block text-xs font-mono uppercase tracking-wider text-slate-400 pt-2">
                  Recipient Receives
                </label>
                <div className="flex items-center rounded-2xl bg-[#020e09] border border-emerald-500/30 p-3 sm:p-4">
                  <span className="text-lg font-bold text-teal-400 font-mono pr-2">
                    {convertedFX.symbol}
                  </span>
                  <div className="w-full text-xl sm:text-2xl font-bold font-mono text-emerald-300">
                    {convertedFX.converted.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                  <select
                    value={targetCurrency}
                    onChange={(e) => setTargetCurrency(e.target.value)}
                    className="bg-[#041a12] border border-emerald-500/30 rounded-xl px-2.5 py-1.5 text-xs font-semibold text-emerald-200 outline-hidden cursor-pointer"
                  >
                    {Object.entries(FX_RATES).map(([code, info]) => (
                      <option key={code} value={code}>
                        {info.flag} {code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conversion Breakdown & Real Savings */}
              <div className="glass-forest-pill rounded-2xl p-6 border border-emerald-400/20 space-y-4">
                <div className="flex items-center justify-between text-xs pb-3 border-b border-emerald-900/40">
                  <span className="text-slate-400">Live Wholesale Rate</span>
                  <span className="font-mono font-semibold text-emerald-300">
                    1 USD = {convertedFX.rate} {targetCurrency}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pb-3 border-b border-emerald-900/40">
                  <span className="text-slate-400">Apex Transfer Fee</span>
                  <span className="font-mono font-bold text-teal-300">0.00 USD (FREE)</span>
                </div>

                <div className="flex items-center justify-between text-xs pb-3 border-b border-emerald-900/40">
                  <span className="text-slate-400">Estimated Delivery Time</span>
                  <span className="font-mono font-semibold text-white flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-emerald-400" />
                    Instant (Under 2 Seconds)
                  </span>
                </div>

                {/* Savings Callout */}
                <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/30 p-3 flex items-center justify-between">
                  <div className="text-xs text-slate-300">
                    Estimated savings vs. retail bank markup:
                  </div>
                  <div className="text-sm font-bold text-emerald-300 font-mono">
                    +${convertedFX.savingsUSD} USD
                  </div>
                </div>

                <Link href={isAuthenticated ? "/customer/transfer" : "/register"}>
                  <button className="w-full mt-2 py-3 rounded-xl bg-linear-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-2">
                    <span>Send {targetCurrency} at Interbank Rate</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FinTech Tool 2: Interactive Compound Yield & Wealth Vault Calculator */}
      <section id="calculator" className="py-20 border-t border-emerald-950/80 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-4 py-1 text-xs font-semibold text-emerald-300">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>High-Yield Wealth Vaults (5.40% Guaranteed APY)</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Compound Interest at <br />
              <span className="text-emerald-400">Institutional Velocity.</span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              While legacy institutions offer 0.02% interest, Apex Vaults pass institutional
              treasury yields directly to account holders, credited monthly with FDIC backing.
            </p>
          </div>

          <div className="max-w-4xl mx-auto glass-forest-card rounded-3xl p-6 sm:p-10 border border-emerald-500/25 shadow-2xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              {/* Sliders on Left */}
              <div className="lg:col-span-7 space-y-8">
                {/* Deposit Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono uppercase text-slate-400">
                      Initial Capital Deposit
                    </span>
                    <span className="text-xl font-bold font-mono text-white">
                      ${depositAmount.toLocaleString()} USD
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="250000"
                    step="1000"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(Number(e.target.value))}
                    className="w-full accent-emerald-400 h-2 bg-emerald-950 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>$1,000</span>
                    <span>$100,000</span>
                    <span>$250,000 (FDIC Max)</span>
                  </div>
                </div>

                {/* Duration Slider */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-mono uppercase text-slate-400">
                      Vault Term Duration
                    </span>
                    <span className="text-xl font-bold font-mono text-emerald-300">
                      {tenureYears} {tenureYears === 1 ? "Year" : "Years"} ({tenureYears * 12} Months)
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={tenureYears}
                    onChange={(e) => setTenureYears(Number(e.target.value))}
                    className="w-full accent-emerald-400 h-2 bg-emerald-950 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
                    <span>1 Year</span>
                    <span>2 Years</span>
                    <span>3 Years</span>
                    <span>5 Years</span>
                  </div>
                </div>

                {/* Comparative Metric Bar */}
                <div className="glass-forest-pill rounded-2xl p-4 border border-emerald-500/20 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-slate-400">Yield Multiplier vs. Average Retail Bank:</div>
                    <div className="text-lg font-bold text-emerald-300 font-mono">
                      {calculatedSavings.multiplier}x Higher Returns
                    </div>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold font-mono">
                    5.4%
                  </div>
                </div>
              </div>

              {/* Yield Output on Right */}
              <div className="lg:col-span-5 rounded-2xl bg-[#020e09] border border-emerald-500/30 p-6 space-y-5 text-left">
                <div className="text-xs font-mono uppercase text-emerald-400/80">
                  Projected Maturity Portfolio
                </div>

                <div>
                  <div className="text-xs text-slate-400">Total Interest Earned</div>
                  <div className="text-3xl font-extrabold text-emerald-300 font-mono">
                    +$
                    {calculatedSavings.totalInterest.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-emerald-900/60">
                  <div className="text-xs text-slate-400">Average Monthly Cash Payout</div>
                  <div className="text-xl font-bold text-white font-mono">
                    +$
                    {calculatedSavings.monthlyAveragePayout.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>

                <div className="pt-3 border-t border-emerald-900/60">
                  <div className="text-xs text-slate-400">Total Balance at Maturity</div>
                  <div className="text-2xl font-bold text-teal-200 font-mono">
                    $
                    {calculatedSavings.finalAmount.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </div>
                </div>

                <Link href={isAuthenticated ? "/customer/deposit" : "/register"}>
                  <button className="w-full mt-2 py-3 rounded-xl bg-linear-to-r from-emerald-500 to-teal-400 text-slate-950 font-bold text-xs uppercase tracking-wider hover:brightness-110 transition-all flex items-center justify-center gap-2">
                    <span>Lock In 5.40% APY Vault</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tri-Tier Banking Suites: Personal, Business, Wealth */}
      <section id="accounts" className="py-20 border-t border-emerald-950/80 bg-[#03150e]/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-12">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Bespoke Financial Architecture.
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              Engineered for individuals, high-growth commercial enterprises, and sovereign family offices.
            </p>

            {/* Tab Controls */}
            <div className="inline-flex p-1.5 rounded-2xl glass-forest-pill border border-emerald-500/20 mt-4">
              <button
                onClick={() => setActiveTab("personal")}
                className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "personal"
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Personal Banking
              </button>
              <button
                onClick={() => setActiveTab("business")}
                className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "business"
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Business & Treasury
              </button>
              <button
                onClick={() => setActiveTab("wealth")}
                className={`px-5 py-2 rounded-xl text-xs font-semibold transition-all ${
                  activeTab === "wealth"
                    ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Private Wealth & Reserve
              </button>
            </div>
          </div>

          {/* Tab Content Display */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {activeTab === "personal" && (
              <>
                <div className="glass-forest-card rounded-3xl p-7 border border-emerald-500/20 space-y-4 hover:border-emerald-400/40 transition-all">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Wallet className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Everyday Checking & Vaults</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Zero monthly maintenance fees. Automated spare change round-ups into 5.40% APY
                    vaults. Instant peer-to-peer transfers with zero clearing delays.
                  </p>
                  <ul className="space-y-2 pt-2 text-xs text-slate-400">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Instant Smart OCR Verification</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Apple Pay & Google Wallet Ready</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Multi-Currency IBANs in 40+ Jurisdictions</span>
                    </li>
                  </ul>
                </div>

                <div className="glass-forest-card rounded-3xl p-7 border border-emerald-500/20 space-y-4 hover:border-emerald-400/40 transition-all">
                  <div className="h-12 w-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                    <CreditCard className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Metal & Virtual Cards</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Solid laser-engraved 18g metal cards with 2.5% unlimited cashback. Disposable
                    virtual cards that self-terminate after single online transactions.
                  </p>
                  <ul className="space-y-2 pt-2 text-xs text-slate-400">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>1-Tap Instant Card Freeze</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Zero Foreign Exchange Surcharge</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Real-Time Biometric Fraud Alerts</span>
                    </li>
                  </ul>
                </div>

                <div className="glass-forest-card rounded-3xl p-7 border border-emerald-500/20 space-y-4 hover:border-emerald-400/40 transition-all">
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Personal Credit & Loans</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Pre-approved low-interest lines of credit. Transparent amortized repayment
                    schedules with zero early payoff penalties.
                  </p>
                  <ul className="space-y-2 pt-2 text-xs text-slate-400">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Sub-5-minute loan assessment</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Fixed APR starting at 5.85%</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Automated monthly debit scheduling</span>
                    </li>
                  </ul>
                </div>
              </>
            )}

            {activeTab === "business" && (
              <>
                <div className="glass-forest-card rounded-3xl p-7 border border-emerald-500/20 space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Building2 className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Commercial Treasury</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Multi-entity accounts, sweeping cash management, automated yield maximization on
                    idle corporate reserves up to $10,000,000.
                  </p>
                  <ul className="space-y-2 pt-2 text-xs text-slate-400">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Dual-Signature Signoff Workflows</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Automated Global Vendor Payouts</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>ERP & QuickBooks Direct Sync</span>
                    </li>
                  </ul>
                </div>

                <div className="glass-forest-card rounded-3xl p-7 border border-emerald-500/20 space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                    <Users className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Corporate Cards & Spend</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Issue physical titanium cards and unlimited virtual cards to employees with
                    granular category spend limits and receipt upload capture.
                  </p>
                  <ul className="space-y-2 pt-2 text-xs text-slate-400">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Dynamic Merchant Category Locking</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Zero Liability Corporate Protection</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Real-time Expense Audit Trail</span>
                    </li>
                  </ul>
                </div>

                <div className="glass-forest-card rounded-3xl p-7 border border-emerald-500/20 space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Cpu className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Banking APIs & Webhooks</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Programmable banking infrastructure. Create virtual accounts, initiate bulk
                    transfers, and trigger webhooks directly from your codebase.
                  </p>
                  <ul className="space-y-2 pt-2 text-xs text-slate-400">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>REST & GraphQL Core Banking API</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Sandboxed Developer Simulation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Cryptographic HMAC Webhook Signing</span>
                    </li>
                  </ul>
                </div>
              </>
            )}

            {activeTab === "wealth" && (
              <>
                <div className="glass-forest-card rounded-3xl p-7 border border-emerald-500/20 space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <Award className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Dedicated Private Banker</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Direct direct-line access to a senior Swiss-trained private wealth manager. Bespoke
                    portfolio structuring and intergenerational trust preservation.
                  </p>
                  <ul className="space-y-2 pt-2 text-xs text-slate-400">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Bespoke Liquidity Facilities</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Tax-Efficient Offshore Custody</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Cross-Border Succession Planning</span>
                    </li>
                  </ul>
                </div>

                <div className="glass-forest-card rounded-3xl p-7 border border-emerald-500/20 space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                    <Coins className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">Lombard Asset Credit</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Borrow against existing diversified assets without liquidating positions or
                    triggering capital gains events. Access liquidity within 24 hours.
                  </p>
                  <ul className="space-y-2 pt-2 text-xs text-slate-400">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Credit limits up to $15,000,000</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Competitive SOFR-pegged margins</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>No rigid amortization schedules</span>
                    </li>
                  </ul>
                </div>

                <div className="glass-forest-card rounded-3xl p-7 border border-emerald-500/20 space-y-4">
                  <div className="h-12 w-12 rounded-2xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-white">VIP Concierge & Privileges</h3>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    24/7 bespoke lifestyle concierge. Private aviation charters, sold-out global gala
                    access, and dedicated VIP airport escort services.
                  </p>
                  <ul className="space-y-2 pt-2 text-xs text-slate-400">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>LoungeKey VIP Worldwide Access</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Complimentary Luxury Travel Insurance</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-emerald-400" />
                      <span>Dedicated Global Emergency Evacuation</span>
                    </li>
                  </ul>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Side-by-Side Comparison: Apex Bank vs. Traditional Banks */}
      <section className="py-20 border-t border-emerald-950/80 bg-[#020e09]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Why the World is Switching to Apex.
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              See how legacy retail banks compare to our next-generation digital architecture.
            </p>
          </div>

          <div className="max-w-4xl mx-auto glass-forest-card rounded-3xl overflow-hidden border border-emerald-500/30">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-emerald-900/60 bg-emerald-950/50 text-xs font-mono uppercase">
                    <th className="py-4 px-6 text-slate-300">Feature</th>
                    <th className="py-4 px-6 text-emerald-300 font-bold bg-emerald-900/30">
                      Apex Bank
                    </th>
                    <th className="py-4 px-6 text-slate-400">Traditional Banks (Chase, BoA, HSBC)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-emerald-950/80 text-xs">
                  <tr>
                    <td className="py-4 px-6 font-semibold text-white">Savings Vault Yield</td>
                    <td className="py-4 px-6 font-bold text-emerald-300 font-mono bg-emerald-900/20">
                      5.40% APY (Credited Monthly)
                    </td>
                    <td className="py-4 px-6 text-slate-400 font-mono">0.01% - 0.05% APY</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-semibold text-white">Account Opening Speed</td>
                    <td className="py-4 px-6 font-bold text-emerald-300 bg-emerald-900/20">
                      3 Minutes (AI OCR Scanner)
                    </td>
                    <td className="py-4 px-6 text-slate-400">5-7 Business Days + Branch Visit</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-semibold text-white">Cross-Border FX Markup</td>
                    <td className="py-4 px-6 font-bold text-teal-300 font-mono bg-emerald-900/20">
                      0.00% (Pure Interbank Rate)
                    </td>
                    <td className="py-4 px-6 text-rose-400/90 font-mono">3.00% to 5.00% Hidden Spread</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-semibold text-white">International Wire Fee</td>
                    <td className="py-4 px-6 font-bold text-teal-300 font-mono bg-emerald-900/20">
                      $0.00 (Instant Atomic Settlement)
                    </td>
                    <td className="py-4 px-6 text-rose-400/90 font-mono">$35 - $50 Wire Fee + 3 Days</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-semibold text-white">Titanium Metal Card</td>
                    <td className="py-4 px-6 font-bold text-emerald-300 bg-emerald-900/20">
                      Complimentary 18g Solid Metal
                    </td>
                    <td className="py-4 px-6 text-slate-400">$550+ Annual Fee Required</td>
                  </tr>
                  <tr>
                    <td className="py-4 px-6 font-semibold text-white">Authentication & Defense</td>
                    <td className="py-4 px-6 font-bold text-emerald-300 bg-emerald-900/20">
                      FIDO2 Passkeys & AI Fraud Radar
                    </td>
                    <td className="py-4 px-6 text-slate-400">Vulnerable SMS OTPs & Passwords</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* Institutional Security & Defense Architecture */}
      <section id="security" className="py-20 border-t border-emerald-950/80 bg-[#03150e]/40 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-950/60 px-4 py-1 text-xs font-semibold text-emerald-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              <span>Zero-Trust Cryptographic Infrastructure</span>
            </div>
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Bank-Grade Security. <br />
              <span className="text-emerald-400">Zero Compromises.</span>
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              Engineered with atomic database consistency, hardware-level authentication, and
              24/7 AI-powered anomaly radar.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-forest-card rounded-2xl p-6 border border-emerald-500/20 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Lock className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">Biometric Passkey Authentication</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Hardware-backed WebAuthn credentials eliminate phishing vectors and password leaks
                completely. Sign in instantly via Touch ID, Face ID, or YubiKey.
              </p>
            </div>

            <div className="glass-forest-card rounded-2xl p-6 border border-emerald-500/20 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <Scale className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">Atomic Double-Entry Ledger</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                ACID transactional guarantees prevent fractional rounding discrepancies or double-spend
                anomalies across millions of real-time transactions.
              </p>
            </div>

            <div className="glass-forest-card rounded-2xl p-6 border border-emerald-500/20 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <ShieldAlert className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">Real-Time AI Anomaly Radar</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Heuristic machine learning scans geolocation, velocity, and behavior patterns to halt
                fraudulent attempts in sub-second latency before funds clear.
              </p>
            </div>

            <div className="glass-forest-card rounded-2xl p-6 border border-emerald-500/20 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Building2 className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">Segregated FDIC-Insured Custody</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Client capital is strictly segregated in tier-1 clearing institutions with statutory
                insurance protection up to $250,000 per individual depositor.
              </p>
            </div>

            <div className="glass-forest-card rounded-2xl p-6 border border-emerald-500/20 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center">
                <FileCheck2 className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">Smart OCR Document Verification</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Optical Character Recognition instantly verifies national identity cards, passports,
                and tax documents, pairing biometric match with compliance audits.
              </p>
            </div>

            <div className="glass-forest-card rounded-2xl p-6 border border-emerald-500/20 space-y-3">
              <div className="h-10 w-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Smartphone className="h-5 w-5" />
              </div>
              <h4 className="text-base font-bold text-white">Instant Card Kill-Switch</h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                Lost your card? Freeze physical cards, re-generate virtual card numbers, or toggle
                ATM and online purchase channels instantly from the portal.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Verified Client Testimonials */}
      <section className="py-20 border-t border-emerald-950/80 bg-[#020c08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-14">
            <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
              Trusted by 250,000+ Account Holders.
            </h2>
            <p className="text-slate-300 text-sm sm:text-base">
              From global venture-backed startups to private family offices.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="glass-forest-card rounded-3xl p-7 border border-emerald-500/20 space-y-4">
              <div className="flex text-amber-400 gap-1 text-sm">★★★★★</div>
              <p className="text-xs text-slate-200 leading-relaxed italic">
                “Migrating our commercial treasury to Apex saved our European subsidiaries over
                $140,000 in FX spreads in Q3 alone. The dual-signature approval system gives our board
                complete peace of mind.”
              </p>
              <div className="pt-2 border-t border-emerald-900/40 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-xs">
                  MV
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Marcus Vance</div>
                  <div className="text-[10px] text-emerald-400">Chief Financial Officer, Aethel Labs</div>
                </div>
              </div>
            </div>

            <div className="glass-forest-card rounded-3xl p-7 border border-emerald-500/20 space-y-4">
              <div className="flex text-amber-400 gap-1 text-sm">★★★★★</div>
              <p className="text-xs text-slate-200 leading-relaxed italic">
                “The smart OCR onboarding took literally 3 minutes on my phone. My account was
                provisioned without visiting a branch, and the 18g titanium card feels like an absolute
                masterpiece.”
              </p>
              <div className="pt-2 border-t border-emerald-900/40 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-teal-700 text-white font-bold flex items-center justify-center text-xs">
                  ER
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Elena Rostova</div>
                  <div className="text-[10px] text-emerald-400">Tech Founder & Angel Investor</div>
                </div>
              </div>
            </div>

            <div className="glass-forest-card rounded-3xl p-7 border border-emerald-500/20 space-y-4">
              <div className="flex text-amber-400 gap-1 text-sm">★★★★★</div>
              <p className="text-xs text-slate-200 leading-relaxed italic">
                “The 5.40% APY vault with monthly compound interest credited right on time has
                consistently beaten any high-yield cash account I’ve held in Zurich or London.”
              </p>
              <div className="pt-2 border-t border-emerald-900/40 flex items-center gap-3">
                <div className="h-9 w-9 rounded-full bg-amber-700 text-white font-bold flex items-center justify-center text-xs">
                  DK
                </div>
                <div>
                  <div className="text-xs font-bold text-white">David K.</div>
                  <div className="text-[10px] text-emerald-400">Private Wealth Client</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Frequently Asked Questions (Accordion) */}
      <section className="py-20 border-t border-emerald-950/80 bg-[#03150e]/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-3 mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              Frequently Asked Questions.
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm">
              Clear answers regarding account provisioning, deposit security, and cards.
            </p>
          </div>

          <div className="space-y-4">
            {[
              {
                q: "How fast can I open an account with Smart OCR verification?",
                a: "You can complete your entire application in under 3 minutes directly from your smartphone or desktop. Our automated OCR scanner extracts your details from your passport or national ID card, verifies your digital signature, and routes your account for final Staff officer approval.",
              },
              {
                q: "Are my deposits protected and insured?",
                a: "Yes. Apex Bank holds full commercial banking licenses with statutory deposit insurance. In eligible jurisdictions, individual account balances are insured up to $250,000 (FDIC equivalent). Client reserves are segregated and held in tier-1 central clearing facilities.",
              },
              {
                q: "How does the 5.40% APY High-Yield Vault generate returns?",
                a: "Apex Bank routes vault reserves directly into sovereign short-term treasury bills and institutional repo agreements, eliminating the retail banking middleman markup and crediting compound yield directly to your balance every 30 days.",
              },
              {
                q: "Can I issue both physical metal cards and disposable virtual cards?",
                a: "Yes. Every verified account includes access to instant virtual cards ready for Apple Pay / Google Wallet, as well as the option to receive a physical laser-engraved 18g titanium card delivered to your global address within 3-5 business days.",
              },
              {
                q: "How does the Staff Review & Account Activation workflow work?",
                a: "To safeguard against fraud, all newly self-opened customer accounts undergo compliance verification by our Bank Staff desk. Once approved, your escrow deposit is immediately released, and your full transaction privileges are unlocked.",
              },
            ].map((faq, idx) => (
              <div
                key={idx}
                className="glass-forest-card rounded-2xl border border-emerald-500/20 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between text-sm font-semibold text-white hover:text-emerald-300 transition-colors"
                >
                  <span>{faq.q}</span>
                  {openFaq === idx ? (
                    <ChevronUp className="h-4 w-4 text-emerald-400 shrink-0" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
                  )}
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-xs text-slate-300 leading-relaxed border-t border-emerald-950/80 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grand Finale Emerald Forest Glass CTA */}
      <section className="py-24 border-t border-emerald-950/80 relative overflow-hidden">
        {/* Glow backdrop */}
        <div className="absolute inset-0 bg-radial from-emerald-600/15 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="glass-forest-card rounded-3xl p-10 sm:p-16 border border-emerald-400/30 shadow-2xl relative overflow-hidden">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-950/60 px-4 py-1.5 text-xs font-semibold text-emerald-300 mb-6">
              <Sparkles className="h-4 w-4 text-emerald-400" />
              <span>Instant Digital Onboarding • Zero Paperwork</span>
            </div>

            <h2 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight leading-tight max-w-3xl mx-auto">
              Step Into the Future of <br />
              <span className="bg-linear-to-r from-emerald-300 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                Private Sovereign Banking.
              </span>
            </h2>

            <p className="mt-4 text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
              Open your verified account in under 3 minutes with instant OCR ID scanning.
              No minimum balance requirements. Full multi-currency privileges unlocked.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <Link href={isAuthenticated ? dashboardLink : "/register"}>
                <button className="flex items-center gap-2 rounded-2xl bg-linear-to-r from-emerald-500 via-teal-400 to-emerald-600 px-8 py-4 text-sm font-bold text-slate-950 shadow-xl shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all">
                  <span>{isAuthenticated ? "Open Dashboard" : "Open Your Bank Account"}</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
              <Link href="/login">
                <button className="rounded-2xl border border-emerald-500/30 bg-emerald-950/40 px-7 py-4 text-sm font-semibold text-emerald-200 hover:bg-emerald-900/60 transition-all">
                  Existing Client Sign In
                </button>
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-[11px] text-slate-400 font-mono">
              <span>✓ Member FDIC Insured</span>
              <span>✓ 256-Bit Military Encryption</span>
              <span>✓ Instant OCR Auto-Fill</span>
              <span>✓ 24/7 Sovereign Support</span>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Authentic Commercial Banking Footer */}
      <footer className="border-t border-emerald-950/90 bg-[#010805] text-slate-400 text-xs py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {/* Top Directory Grid */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Brand column */}
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-tr from-emerald-600 to-teal-400 text-slate-950 font-bold">
                  <Landmark className="h-5 w-5" />
                </div>
                <span className="text-lg font-bold text-white tracking-tight">
                  Apex<span className="text-emerald-400">Bank</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                Apex International Bank Ltd. is a licensed commercial digital banking institution
                providing high-precision treasury, wealth vaults, and atomic settlement systems.
              </p>
              <div className="font-mono text-[11px] text-emerald-400/80 space-y-1">
                <div>SWIFT / BIC: <span className="text-white">APEXUS33XXX</span></div>
                <div>ROUTING / FEDWIRE: <span className="text-white">026009593</span></div>
                <div>LEI CODE: <span className="text-white">5493001KJTIIGC8Y1R12</span></div>
              </div>
            </div>

            {/* Consumer Banking */}
            <div className="space-y-3">
              <div className="font-semibold text-white uppercase tracking-wider text-[11px] font-mono">
                Consumer Banking
              </div>
              <ul className="space-y-2 text-xs">
                <li><a href="#accounts" className="hover:text-emerald-400 transition-colors">Everyday Checking</a></li>
                <li><a href="#calculator" className="hover:text-emerald-400 transition-colors">High-Yield Vaults (5.40%)</a></li>
                <li><a href="#cards" className="hover:text-emerald-400 transition-colors">Titanium Obsidian Cards</a></li>
                <li><a href="#transfers" className="hover:text-emerald-400 transition-colors">Zero-Markup FX Transfers</a></li>
                <li><Link href="/register" className="hover:text-emerald-400 transition-colors">Smart OCR Onboarding</Link></li>
              </ul>
            </div>

            {/* Commercial & Wealth */}
            <div className="space-y-3">
              <div className="font-semibold text-white uppercase tracking-wider text-[11px] font-mono">
                Corporate & Wealth
              </div>
              <ul className="space-y-2 text-xs">
                <li><a href="#accounts" className="hover:text-emerald-400 transition-colors">Corporate Treasury</a></li>
                <li><a href="#accounts" className="hover:text-emerald-400 transition-colors">Dual-Signature Approvals</a></li>
                <li><a href="#accounts" className="hover:text-emerald-400 transition-colors">Lombard Credit Lines</a></li>
                <li><a href="#accounts" className="hover:text-emerald-400 transition-colors">Private Wealth Advisory</a></li>
                <li><a href="#security" className="hover:text-emerald-400 transition-colors">Institutional APIs</a></li>
              </ul>
            </div>

            {/* Global Hubs */}
            <div className="space-y-3">
              <div className="font-semibold text-white uppercase tracking-wider text-[11px] font-mono">
                Global Operations
              </div>
              <ul className="space-y-2 text-xs">
                <li className="flex items-center gap-1.5"><span className="text-emerald-400">●</span> New York (Wall St)</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-400">●</span> London (Canary Wharf)</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-400">●</span> Zurich (Bahnhofstrasse)</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-400">●</span> Singapore (Marina Bay)</li>
                <li className="flex items-center gap-1.5"><span className="text-emerald-400">●</span> Dhaka (Gulshan Ave)</li>
              </ul>
            </div>
          </div>

          {/* Legal Regulatory Notice */}
          <div className="pt-8 border-t border-emerald-950/80 text-[10px] text-slate-500 leading-relaxed space-y-2">
            <p>
              <strong>Regulatory Notice & Deposit Insurance:</strong> Apex Bank International Ltd. is
              authorized and regulated by the Prudential Financial Authority. Banking services are
              provided in partnership with Apex Federal Clearing N.A., Member FDIC. Deposits are insured
              up to statutory coverage limits ($250,000 USD) per qualifying account holder. Investment and
              asset custody products are subject to market volatility.
            </p>
            <p>
              © 2026 Apex Bank Systems. Built to tier-1 commercial banking and atomic ledger standards.
              All trademarks and service marks are the property of their respective holders.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
