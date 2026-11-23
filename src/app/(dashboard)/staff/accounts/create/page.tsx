"use client";

import React, { useState, useMemo, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Building2,
  DollarSign,
  ShieldCheck,
  User,
  Briefcase,
  Users,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  FileCheck2,
  Sparkles,
  CreditCard,
  Download,
  Wallet,
  Smartphone,
  Lock,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Button,
  Input,
  Select,
  Badge,
  Modal,
} from "@/components/ui";
import { DocumentOcrScanner, ExtractedOcrData } from "@/components/ocr/DocumentOcrScanner";
import { SignaturePad } from "@/components/ui/SignaturePad";
import { useGetCustomersQuery } from "@/redux/api/customersApi";
import { useCreateAccountMutation } from "@/redux/api/accountsApi";
import { useAppSelector } from "@/redux/hooks";
import { ROLES, ACCOUNT_TYPES, AccountType } from "@/lib/constants";
import { generateAccountCertificatePDF } from "@/lib/certificate";

const STEPS = [
  { id: 1, title: "Account Tier", desc: "Category & Currency", icon: Building2 },
  { id: 2, title: "OCR Scanner", desc: "Identity Document", icon: ShieldCheck },
  { id: 3, title: "Personal Profile", desc: "Applicant Details", icon: User },
  { id: 4, title: "Employment", desc: "Source of Wealth", icon: Briefcase },
  { id: 5, title: "Nominee & Services", desc: "Beneficiary Setup", icon: Users },
  { id: 6, title: "Review & Sign", desc: "Digital E-Signature", icon: FileCheck2 },
];

export default function SmartOpenBankAccountPage() {
  const router = useRouter();
  const currentUser = useAppSelector((state) => state.auth.user);
  const isCustomer = currentUser?.role === ROLES.CUSTOMER;

  const { data: customersData, isLoading: isLoadingCustomers } =
    useGetCustomersQuery({ limit: 150 }, { skip: isCustomer });
  const [createAccountMutation, { isLoading: isCreating }] =
    useCreateAccountMutation();

  const customers = useMemo(
    () => customersData?.customers || [],
    [customersData?.customers]
  );

  // Active Wizard Step
  const [currentStep, setCurrentStep] = useState(1);

  // Form State
  const [isOnboardingNewCustomer, setIsOnboardingNewCustomer] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState("");

  // Step 1: Account Specs
  const [accountType, setAccountType] = useState<AccountType>(ACCOUNT_TYPES.SAVINGS);
  const [currency, setCurrency] = useState("USD");
  const [branchName, setBranchName] = useState("Main Financial Center Branch");
  const [initialDeposit, setInitialDeposit] = useState<number | string>(500);
  const [dailyTransferLimit, setDailyTransferLimit] = useState<number | string>(25000);

  // Step 2: OCR State
  const [ocrKycSnapshot, setOcrKycSnapshot] = useState<{
    docType: string;
    docNumber: string;
    verifiedViaOcr: boolean;
    ocrConfidence: number;
    docFrontUrl?: string;
  } | null>(null);

  // Step 3: Personal Info (or New Customer fields)
  const [personalInfo, setPersonalInfo] = useState({
    name: "",
    email: "",
    phone: "",
    nationalId: "",
    dateOfBirth: "1995-05-14",
    gender: "Male",
    maritalStatus: "Single",
    fatherName: "",
    motherName: "",
    address: "",
    city: "Dhaka",
    postalCode: "1230",
    country: "Bangladesh",
    tempPassword: "CustomerTemp2026!",
  });

  // Step 4: Employment & Wealth
  const [employment, setEmployment] = useState({
    occupation: "Software Engineer",
    employerName: "Apex Global Technologies",
    monthlyIncome: 6500,
    sourceOfFunds: "Salary & Professional Compensation",
    taxId: "TIN-8891-4402-91",
  });

  // Step 5: Nominee & Services
  const [nominee, setNominee] = useState({
    name: "Shahanara Begum",
    relation: "Mother",
    phone: "+880 1711-002233",
    nationalId: "1968269150000041",
    sharePercent: 100,
    address: "Same as Account Holder",
  });

  const [services, setServices] = useState({
    debitCardRequested: true,
    chequeBookRequested: false,
    smsAlerts: true,
    eStatement: true,
  });

  // Step 6: Digital Signature & Legal
  const [signatureUrl, setSignatureUrl] = useState<string | null>(null);
  const [agreedToAml, setAgreedToAml] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  // Success Modal State
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false);
  const [createdCredentials, setCreatedCredentials] = useState<{
    accountNumber: string;
    iban: string;
    routingNumber: string;
    swiftBic: string;
    currency: string;
    accountType: string;
    holderName: string;
    holderEmail: string;
    branchName: string;
    initialDeposit: number;
  } | null>(null);

  // Pre-fill if customer is opening for themselves or default first customer for staff
  const [prevCustomerUserId, setPrevCustomerUserId] = useState<string | null>(null);
  const currentUserId = isCustomer ? currentUser?._id || "" : "";
  if (currentUserId && prevCustomerUserId !== currentUserId) {
    setPrevCustomerUserId(currentUserId);
    if (!selectedUserId) {
      setSelectedUserId(currentUserId);
    }
    setPersonalInfo((prev) => ({
      ...prev,
      name: currentUser?.name || prev.name,
      email: currentUser?.email || prev.email,
      phone: currentUser?.phone || prev.phone,
      nationalId: currentUser?.nationalId || prev.nationalId,
      address: currentUser?.address || prev.address,
    }));
  }

  const [hasStaffInitialized, setHasStaffInitialized] = useState(false);
  if (!isCustomer && !hasStaffInitialized && customers.length > 0) {
    setHasStaffInitialized(true);
    const firstCustomer = customers[0];
    if (!selectedUserId) {
      setSelectedUserId(firstCustomer._id);
    }
    setPersonalInfo((prev) => ({
      ...prev,
      name: firstCustomer.name || prev.name,
      email: firstCustomer.email || prev.email,
      phone: firstCustomer.phone || prev.phone,
      nationalId: firstCustomer.nationalId || prev.nationalId,
      address: firstCustomer.address || prev.address,
    }));
  }

  const handleSignatureChange = useCallback((sig: string | null) => {
    setSignatureUrl(sig);
  }, []);

  // When staff selects an existing customer, auto-populate known fields
  const handleCustomerSelect = (id: string) => {
    setSelectedUserId(id);
    const c = customers.find((cust) => cust._id === id);
    if (c) {
      setPersonalInfo((prev) => ({
        ...prev,
        name: c.name || prev.name,
        email: c.email || prev.email,
        phone: c.phone || prev.phone,
        nationalId: c.nationalId || prev.nationalId,
        address: c.address || prev.address,
      }));
    }
  };

  // Handle OCR auto-fill
  const handleApplyOcrData = (data: ExtractedOcrData, docUrl: string) => {
    setOcrKycSnapshot({
      docType: "NATIONAL_ID",
      docNumber: data.docNumber,
      verifiedViaOcr: true,
      ocrConfidence: data.confidence,
      docFrontUrl: docUrl,
    });

    setPersonalInfo((prev) => ({
      ...prev,
      name: data.fullName || prev.name,
      nationalId: data.docNumber || prev.nationalId,
      dateOfBirth: data.dateOfBirth || prev.dateOfBirth,
      gender: data.gender || prev.gender,
      fatherName: data.fatherName || prev.fatherName,
      motherName: data.motherName || prev.motherName,
      address: data.address || prev.address,
    }));

    if (data.taxId) {
      setEmployment((prev) => ({ ...prev, taxId: data.taxId || prev.taxId }));
    }

    // Advance to personal info step to view auto-filled data
    setCurrentStep(3);
  };

  // Demo auto-fill helper for instant testing
  const handleFillDemoData = () => {
    setPersonalInfo({
      name: "Marcus Brody",
      email: `marcus.brody.${Date.now().toString().slice(-4)}@example.com`,
      phone: "+1 (555) 234-8899",
      nationalId: "NID-9921-4820-91",
      dateOfBirth: "1994-06-20",
      gender: "Male",
      maritalStatus: "Married",
      fatherName: "Arthur Brody",
      motherName: "Eleanor Brody",
      address: "450 Wall Street, Financial District",
      city: "New York",
      postalCode: "10005",
      country: "United States",
      tempPassword: "CustomerTemp2026!",
    });
    setEmployment({
      occupation: "Senior Investment Analyst",
      employerName: "Manhattan Capital Group",
      monthlyIncome: 12500,
      sourceOfFunds: "Employment Salary & Advisory Fees",
      taxId: "TIN-4491-0029",
    });
    setNominee({
      name: "Victoria Brody",
      relation: "Spouse",
      phone: "+1 (555) 234-8890",
      nationalId: "NID-8812-3921-10",
      sharePercent: 100,
      address: "450 Wall Street, New York, NY",
    });
    setAgreedToAml(true);
    setAgreedToTerms(true);
    toast.success("Demo banking profile data populated!");
  };

  // Submit Application
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreedToTerms || !agreedToAml) {
      toast.error("Please accept the regulatory AML and banking depository agreements.");
      return;
    }

    try {
      const payload = {
        userId: isCustomer ? currentUser?._id : (isOnboardingNewCustomer ? undefined : selectedUserId),
        isNewCustomer: !isCustomer && isOnboardingNewCustomer,
        newCustomerData: isOnboardingNewCustomer
          ? {
              name: personalInfo.name,
              email: personalInfo.email,
              phone: personalInfo.phone,
              nationalId: personalInfo.nationalId,
              address: `${personalInfo.address}, ${personalInfo.city}`,
              password: personalInfo.tempPassword,
            }
          : undefined,
        accountType,
        currency,
        branchName,
        initialDeposit: parseFloat(initialDeposit.toString()) || 0,
        dailyTransferLimit: parseFloat(dailyTransferLimit.toString()) || 10000,
        minimumBalance: accountType === ACCOUNT_TYPES.BUSINESS ? 500 : 50,
        nominee,
        employmentInfo: {
          occupation: employment.occupation,
          employerName: employment.employerName,
          monthlyIncome: Number(employment.monthlyIncome) || 0,
          sourceOfFunds: employment.sourceOfFunds,
          taxId: employment.taxId,
        },
        services,
        signatureUrl: signatureUrl || undefined,
        kycSnapshot: ocrKycSnapshot || undefined,
      };

      const res = await createAccountMutation(payload).unwrap();

      toast.success(res.message || "Depository account issued successfully!");

      const creds = (res as unknown as { credentials?: typeof createdCredentials }).credentials || {
        accountNumber: res.account.accountNumber,
        iban: res.account.iban || `US79AGBK026007491${res.account.accountNumber}`,
        routingNumber: res.account.routingNumber || "026007491",
        swiftBic: res.account.swiftBic || "AGBKUS33",
        currency: res.account.currency || "USD",
        accountType: res.account.accountType,
        holderName: personalInfo.name || "Valued Account Holder",
        holderEmail: personalInfo.email,
        branchName,
        initialDeposit: parseFloat(initialDeposit.toString()) || 0,
      };

      setCreatedCredentials(creds);
      setIsSuccessModalOpen(true);
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Account opening failed. Please review your inputs.");
    }
  };

  return (
    <DashboardLayout
      allowedRoles={[ROLES.ADMIN, ROLES.STAFF, ROLES.CUSTOMER]}
    >
      <div className="max-w-4xl mx-auto space-y-6 pb-12">
        {/* Header Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-linear-to-tr from-cyan-600 to-blue-600 text-white shadow-md">
                <Building2 className="h-4 w-4" />
              </span>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                {isCustomer
                  ? currentUser?.hasAccount === false
                    ? "Open Your Bank Account & Initial Deposit"
                    : "Open Additional Bank Account"
                  : "Open Depository Account & KYC Suite"}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isCustomer && currentUser?.hasAccount === false
                ? "Complete your verification, set your deposit amount, and activate your personal digital banking dashboard."
                : "Enterprise depository provisioning with optical character recognition (OCR), AML screening, and biometric certification."}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleFillDemoData}
              leftIcon={<Sparkles className="h-3.5 w-3.5 text-amber-500" />}
              className="text-xs border-dashed"
            >
              Fill Demo Data
            </Button>
          </div>
        </div>

        {/* Onboarding Welcome Notice for Customers Opening Their First Account */}
        {isCustomer && currentUser?.hasAccount === false && (
          <div className="rounded-2xl border border-indigo-200 bg-indigo-50/70 p-4 dark:border-indigo-900/60 dark:bg-indigo-950/30 flex items-start gap-3.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-xs">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-indigo-950 dark:text-indigo-200">
                Welcome to ApexBank! Complete Your Account Opening
              </h3>
              <p className="text-xs text-indigo-800 dark:text-indigo-300 mt-1 leading-relaxed">
                To access your customer dashboard, virtual debit cards, and transfers, please fill out your depository preferences below, verify your identity via smart OCR, and make your opening deposit.
              </p>
            </div>
          </div>
        )}

        {/* Stepper Navigation Bar */}
        <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800 bg-white/90 dark:bg-slate-900/90 p-3 shadow-xs">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
            {STEPS.map((step) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isPast = currentStep > step.id;

              return (
                <button
                  key={step.id}
                  type="button"
                  onClick={() => setCurrentStep(step.id)}
                  className={`flex flex-col items-center sm:items-start text-left p-2.5 rounded-xl transition-all ${
                    isActive
                      ? "bg-cyan-50 dark:bg-cyan-950/60 border border-cyan-500/30 text-cyan-700 dark:text-cyan-300 shadow-xs"
                      : isPast
                      ? "text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                      : "text-slate-400 opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs font-semibold ${
                        isActive
                          ? "bg-cyan-600 text-white"
                          : isPast
                          ? "bg-emerald-500 text-white"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                      }`}
                    >
                      {isPast ? <CheckCircle2 className="h-3.5 w-3.5" /> : step.id}
                    </span>
                    <Icon className="h-3.5 w-3.5 hidden sm:block" />
                  </div>
                  <div className="text-xs font-semibold truncate w-full">{step.title}</div>
                  <div className="text-[10px] text-slate-400 truncate w-full hidden sm:block">
                    {step.desc}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Main Application Form Container */}
        <form onSubmit={handleSubmit}>
          {/* STEP 1: Account Classification & Banking Specifications */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Step 1: Select Depository Vault Tier</CardTitle>
                    <CardDescription>
                      Choose the depository tier, base currency, and initial funding limits.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    Step 1 of 6
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Account Type Card Radio Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                  <div
                    onClick={() => setAccountType(ACCOUNT_TYPES.SAVINGS)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      accountType === ACCOUNT_TYPES.SAVINGS
                        ? "border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/30 ring-2 ring-cyan-500/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Savings Depository
                      </span>
                      <Badge variant="success" className="text-[10px]">
                        4.5% APY
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Standard personal high-yield interest vault with flexible daily withdrawals and card access.
                    </p>
                    <div className="mt-3 text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
                      Min Opening Balance: $50
                    </div>
                  </div>

                  <div
                    onClick={() => setAccountType(ACCOUNT_TYPES.CURRENT)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      accountType === ACCOUNT_TYPES.CURRENT
                        ? "border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/30 ring-2 ring-cyan-500/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Platinum Checking
                      </span>
                      <Badge variant="info" className="text-[10px]">
                        Zero Surcharge
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Day-to-day liquidity checking account with unlimited domestic transfers and cheque facility.
                    </p>
                    <div className="mt-3 text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
                      Min Opening Balance: $100
                    </div>
                  </div>

                  <div
                    onClick={() => setAccountType(ACCOUNT_TYPES.BUSINESS)}
                    className={`cursor-pointer rounded-xl border p-4 transition-all ${
                      accountType === ACCOUNT_TYPES.BUSINESS
                        ? "border-cyan-500 bg-cyan-50/40 dark:bg-cyan-950/30 ring-2 ring-cyan-500/20"
                        : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                        Commercial Vault
                      </span>
                      <Badge variant="primary" className="text-[10px]">
                        Enterprise
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Corporate treasury depository with higher transfer ceilings, multi-signatory support, and payroll.
                    </p>
                    <div className="mt-3 text-[11px] font-mono text-cyan-600 dark:text-cyan-400">
                      Min Opening Balance: $500
                    </div>
                  </div>
                </div>

                {/* Currency & Branch Specs */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Depository Currency"
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    options={[
                      { value: "USD", label: "USD ($) — United States Dollar" },
                      { value: "EUR", label: "EUR (€) — European Single Currency" },
                      { value: "GBP", label: "GBP (£) — British Pound Sterling" },
                    ]}
                  />

                  <Select
                    label="Originating Branch Jurisdiction"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    options={[
                      { value: "Main Financial Center Branch", label: "Main Financial Center (HQ)" },
                      { value: "Downtown Tech Valley Branch", label: "Downtown Tech Valley Branch" },
                      { value: "Metropolitan Central Treasury", label: "Metropolitan Central Treasury" },
                    ]}
                  />
                </div>

                {/* Initial Deposit & Daily Transfer Limit */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Initial Opening Deposit ($)"
                    type="number"
                    leftIcon={<DollarSign className="h-4 w-4" />}
                    value={initialDeposit}
                    onChange={(e) => setInitialDeposit(e.target.value)}
                    min={0}
                    required
                    helperText="Opening funds are instantly credited upon activation"
                  />

                  <Input
                    label="Daily Transfer Limit ($)"
                    type="number"
                    leftIcon={<DollarSign className="h-4 w-4" />}
                    value={dailyTransferLimit}
                    onChange={(e) => setDailyTransferLimit(e.target.value)}
                    min={500}
                    required
                    helperText="Adjustable at any time from account security settings"
                  />
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(2)}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Proceed to OCR Document Scanner
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 2: Smart OCR & Document Scanner */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <DocumentOcrScanner onApplyData={handleApplyOcrData} />

              <div className="flex justify-between items-center pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setCurrentStep(1)}
                  leftIcon={<ArrowLeft className="h-4 w-4" />}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  onClick={() => setCurrentStep(3)}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  Skip or Continue to Profile
                </Button>
              </div>
            </div>
          )}

          {/* STEP 3: Personal Information & Customer Target */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Step 3: Account Holder & Personal Profile</CardTitle>
                    <CardDescription>
                      Assign to an existing customer or onboard a new verified customer profile.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    Step 3 of 6
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Staff-Only: Choose Existing Customer vs Onboard New */}
                {!isCustomer && (
                  <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 bg-slate-50 dark:bg-slate-900/60 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        Customer Target Assignment:
                      </span>
                      <div className="inline-flex rounded-lg bg-slate-200 dark:bg-slate-800 p-0.5 text-xs">
                        <button
                          type="button"
                          onClick={() => setIsOnboardingNewCustomer(false)}
                          className={`px-3 py-1 rounded-md font-medium transition-all ${
                            !isOnboardingNewCustomer
                              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                              : "text-slate-500"
                          }`}
                        >
                          Existing Customer
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsOnboardingNewCustomer(true)}
                          className={`px-3 py-1 rounded-md font-medium transition-all ${
                            isOnboardingNewCustomer
                              ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                              : "text-slate-500"
                          }`}
                        >
                          + Onboard New Customer
                        </button>
                      </div>
                    </div>

                    {!isOnboardingNewCustomer ? (
                      <Select
                        label="Select Registered Bank Customer"
                        value={selectedUserId}
                        onChange={(e) => handleCustomerSelect(e.target.value)}
                        options={customers.map((c) => ({
                          value: c._id,
                          label: `${c.name} — ${c.email} (${c.phone || "No phone"})`,
                        }))}
                      />
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        <Input
                          label="Initial Temporary Password"
                          type="password"
                          leftIcon={<Lock className="h-4 w-4" />}
                          value={personalInfo.tempPassword}
                          onChange={(e) =>
                            setPersonalInfo({ ...personalInfo, tempPassword: e.target.value })
                          }
                          helperText="Customer can reset this on first sign-in"
                        />
                        <div className="flex items-center text-xs text-slate-500 pt-6">
                          Customer profile will be automatically created and KYC-verified.
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Personal Information Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Full Legal Name"
                    value={personalInfo.name}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, name: e.target.value })
                    }
                    placeholder="e.g. Arif Hasan Chowdhury"
                    required
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    value={personalInfo.email}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, email: e.target.value })
                    }
                    placeholder="e.g. arif.hasan@example.com"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Input
                    label="Mobile Phone"
                    value={personalInfo.phone}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, phone: e.target.value })
                    }
                    placeholder="+880 1711-000000"
                  />

                  <Input
                    label="National ID / Passport No"
                    value={personalInfo.nationalId}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, nationalId: e.target.value })
                    }
                    placeholder="1995269150000089"
                    required
                  />

                  <Input
                    label="Date of Birth"
                    type="date"
                    value={personalInfo.dateOfBirth}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, dateOfBirth: e.target.value })
                    }
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Gender"
                    value={personalInfo.gender}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, gender: e.target.value })
                    }
                    options={[
                      { value: "Male", label: "Male" },
                      { value: "Female", label: "Female" },
                      { value: "Other", label: "Other / Prefer not to say" },
                    ]}
                  />

                  <Select
                    label="Marital Status"
                    value={personalInfo.maritalStatus}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, maritalStatus: e.target.value })
                    }
                    options={[
                      { value: "Single", label: "Single" },
                      { value: "Married", label: "Married" },
                      { value: "Divorced", label: "Divorced" },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Father's Full Name"
                    value={personalInfo.fatherName}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, fatherName: e.target.value })
                    }
                    placeholder="e.g. Md Anwar Hossain"
                  />

                  <Input
                    label="Mother's Full Name"
                    value={personalInfo.motherName}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, motherName: e.target.value })
                    }
                    placeholder="e.g. Shahanara Begum"
                  />
                </div>

                <div className="space-y-4 pt-2">
                  <Input
                    label="Residential Street Address"
                    value={personalInfo.address}
                    onChange={(e) =>
                      setPersonalInfo({ ...personalInfo, address: e.target.value })
                    }
                    placeholder="House 34, Road 11, Sector 4, Uttara"
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                      label="City / District"
                      value={personalInfo.city}
                      onChange={(e) =>
                        setPersonalInfo({ ...personalInfo, city: e.target.value })
                      }
                      placeholder="Dhaka"
                    />
                    <Input
                      label="Postal / Zip Code"
                      value={personalInfo.postalCode}
                      onChange={(e) =>
                        setPersonalInfo({ ...personalInfo, postalCode: e.target.value })
                      }
                      placeholder="1230"
                    />
                    <Input
                      label="Country of Residence"
                      value={personalInfo.country}
                      onChange={(e) =>
                        setPersonalInfo({ ...personalInfo, country: e.target.value })
                      }
                      placeholder="Bangladesh"
                    />
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => {
                      if (!personalInfo.name || !personalInfo.email) {
                        toast.error("Full Name and Email Address are required.");
                        return;
                      }
                      setCurrentStep(4);
                    }}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Proceed to Employment & Funds
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 4: Employment Background & Source of Wealth */}
          {currentStep === 4 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Step 4: Employment & Source of Funds</CardTitle>
                    <CardDescription>
                      Compliance information regarding the applicant&apos;s financial activity and taxation.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    Step 4 of 6
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Select
                    label="Primary Occupation / Status"
                    value={employment.occupation}
                    onChange={(e) =>
                      setEmployment({ ...employment, occupation: e.target.value })
                    }
                    options={[
                      { value: "Software Engineer", label: "Software Engineer / IT Professional" },
                      { value: "Corporate Executive", label: "Corporate Executive / Management" },
                      { value: "Business Owner", label: "Business Owner / Entrepreneur" },
                      { value: "Medical Doctor", label: "Medical Doctor / Healthcare Professional" },
                      { value: "Civil Servant", label: "Government / Civil Servant" },
                      { value: "Freelancer", label: "Professional Freelancer / Consultant" },
                      { value: "Student", label: "Student / Trainee" },
                      { value: "Retired", label: "Retired" },
                    ]}
                  />

                  <Input
                    label="Employer or Business Name"
                    value={employment.employerName}
                    onChange={(e) =>
                      setEmployment({ ...employment, employerName: e.target.value })
                    }
                    placeholder="e.g. Apex Global Technologies"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Monthly Income Range ($ USD)"
                    type="number"
                    leftIcon={<DollarSign className="h-4 w-4" />}
                    value={employment.monthlyIncome}
                    onChange={(e) =>
                      setEmployment({
                        ...employment,
                        monthlyIncome: parseFloat(e.target.value) || 0,
                      })
                    }
                    min={0}
                  />

                  <Input
                    label="Taxpayer Identification No (TIN / SSN)"
                    value={employment.taxId}
                    onChange={(e) =>
                      setEmployment({ ...employment, taxId: e.target.value })
                    }
                    placeholder="e.g. TIN-8891-4402-91"
                  />
                </div>

                <Select
                  label="Primary Source of Account Funds"
                  value={employment.sourceOfFunds}
                  onChange={(e) =>
                    setEmployment({ ...employment, sourceOfFunds: e.target.value })
                  }
                  options={[
                    { value: "Salary & Professional Compensation", label: "Salary & Employment Income" },
                    { value: "Business Profits & Dividends", label: "Business Profits & Dividends" },
                    { value: "Investment Returns & Trading", label: "Investment Returns & Capital Gains" },
                    { value: "Personal Savings & Inheritance", label: "Personal Savings & Family Inheritance" },
                  ]}
                />

                <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(3)}
                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(5)}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Proceed to Nominee & Services
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 5: Nominee / Beneficiary & Banking Services */}
          {currentStep === 5 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Step 5: Account Beneficiary (Nominee) & Add-ons</CardTitle>
                    <CardDescription>
                      Designate the legally recognized nominee and configure card/cheque privileges.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    Step 5 of 6
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Nominee Designation (100% Account Proceeds)
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Nominee Full Legal Name"
                      value={nominee.name}
                      onChange={(e) =>
                        setNominee({ ...nominee, name: e.target.value })
                      }
                      placeholder="e.g. Shahanara Begum"
                      required
                    />

                    <Select
                      label="Relationship to Account Holder"
                      value={nominee.relation}
                      onChange={(e) =>
                        setNominee({ ...nominee, relation: e.target.value })
                      }
                      options={[
                        { value: "Spouse", label: "Spouse" },
                        { value: "Mother", label: "Mother" },
                        { value: "Father", label: "Father" },
                        { value: "Child", label: "Son / Daughter" },
                        { value: "Sibling", label: "Brother / Sister" },
                        { value: "Legal Guardian", label: "Legal Guardian" },
                      ]}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input
                      label="Nominee National ID / Passport"
                      value={nominee.nationalId}
                      onChange={(e) =>
                        setNominee({ ...nominee, nationalId: e.target.value })
                      }
                      placeholder="1968269150000041"
                    />

                    <Input
                      label="Nominee Phone Number"
                      value={nominee.phone}
                      onChange={(e) =>
                        setNominee({ ...nominee, phone: e.target.value })
                      }
                      placeholder="+880 1711-002233"
                    />
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Banking Channels & Features
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <input
                        type="checkbox"
                        checked={services.debitCardRequested}
                        onChange={(e) =>
                          setServices({ ...services, debitCardRequested: e.target.checked })
                        }
                        className="h-4 w-4 rounded text-cyan-600 focus:ring-cyan-500"
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5 text-cyan-500" />
                          Issue International Debit Card
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Instant virtual card + physical contactless card
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <input
                        type="checkbox"
                        checked={services.chequeBookRequested}
                        onChange={(e) =>
                          setServices({ ...services, chequeBookRequested: e.target.checked })
                        }
                        className="h-4 w-4 rounded text-cyan-600 focus:ring-cyan-500"
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <FileCheck2 className="h-3.5 w-3.5 text-indigo-500" />
                          Order Cheque Book (25 Leaves)
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Dispatched to verified residential address
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <input
                        type="checkbox"
                        checked={services.smsAlerts}
                        onChange={(e) =>
                          setServices({ ...services, smsAlerts: e.target.checked })
                        }
                        className="h-4 w-4 rounded text-cyan-600 focus:ring-cyan-500"
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Smartphone className="h-3.5 w-3.5 text-emerald-500" />
                          Real-time SMS Transaction Alerts
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Instant security notices on deposits & transfers
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                      <input
                        type="checkbox"
                        checked={services.eStatement}
                        onChange={(e) =>
                          setServices({ ...services, eStatement: e.target.checked })
                        }
                        className="h-4 w-4 rounded text-cyan-600 focus:ring-cyan-500"
                      />
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <Wallet className="h-3.5 w-3.5 text-amber-500" />
                          Monthly Digital E-Statements
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Encrypted PDF sent to registered email
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="flex justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(4)}
                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                  >
                    Back
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setCurrentStep(6)}
                    rightIcon={<ArrowRight className="h-4 w-4" />}
                  >
                    Proceed to Digital Signature & Review
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* STEP 6: Review, Digital Signature & Final Issuance */}
          {currentStep === 6 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Step 6: Review Application & Sign Electronically</CardTitle>
                    <CardDescription>
                      Review complete depository specs, execute the digital signature, and activate the account.
                    </CardDescription>
                  </div>
                  <Badge variant="outline" className="font-mono text-xs">
                    Final Step
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Summary Table Card */}
                <div className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider">
                      Application Summary
                    </span>
                    {ocrKycSnapshot?.verifiedViaOcr && (
                      <Badge variant="success" className="text-[10px]">
                        ✓ Optical OCR Verified ({ocrKycSnapshot.ocrConfidence.toFixed(1)}%)
                      </Badge>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Account Tier</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {accountType} Vault
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Base Currency</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {currency}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Opening Deposit</span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                        ${Number(initialDeposit).toLocaleString()} {currency}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Daily Limit</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">
                        ${Number(dailyTransferLimit).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-200/60 dark:border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Account Holder</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {personalInfo.name} ({personalInfo.email})
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Nominee (Beneficiary)</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {nominee.name} ({nominee.relation}) — 100% Share
                      </span>
                    </div>
                  </div>
                </div>

                {/* Digital Signature Pad */}
                <SignaturePad
                  legalName={personalInfo.name}
                  onSignatureChange={handleSignatureChange}
                />

                {/* Regulatory Checkboxes */}
                <div className="space-y-3 pt-2">
                  <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToAml}
                      onChange={(e) => setAgreedToAml(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span>
                      I certify that the funds deposited into this account are of legitimate origin under Anti-Money Laundering (AML) and Counter-Terrorism Financing (CTF) standards.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => setAgreedToTerms(e.target.checked)}
                      className="mt-0.5 h-4 w-4 rounded text-cyan-600 focus:ring-cyan-500"
                    />
                    <span>
                      I have read, understood, and accept the Depository Terms, Fee Schedule, and electronic disclosures governing this banking relationship.
                    </span>
                  </label>
                </div>

                {/* Form Actions */}
                <div className="flex justify-between items-center pt-4 border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setCurrentStep(5)}
                    leftIcon={<ArrowLeft className="h-4 w-4" />}
                  >
                    Back
                  </Button>

                  <Button
                    type="submit"
                    size="lg"
                    isLoading={isCreating || isLoadingCustomers}
                    className="bg-linear-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-md px-6"
                    leftIcon={<CheckCircle2 className="h-5 w-5" />}
                  >
                    Generate & Activate Depository Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </form>

        {/* ACCOUNT OPENING SUCCESS & CERTIFICATE MODAL */}
        <Modal
          isOpen={isSuccessModalOpen}
          onClose={() => {
            setIsSuccessModalOpen(false);
            router.push(isCustomer ? "/customer/dashboard" : "/staff/accounts");
          }}
          title={
            isCustomer
              ? "Application Submitted for Staff Review!"
              : "Account Successfully Activated!"
          }
          maxWidth="lg"
        >
          {createdCredentials && (
            <div className="space-y-6 text-center sm:text-left">
              {isCustomer ? (
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/30 text-amber-900 dark:text-amber-200">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-500 text-white shadow-md shrink-0">
                    <Clock className="h-7 w-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold">
                      Application Submitted & Queued for Staff Verification
                    </h4>
                    <p className="text-xs text-amber-700 dark:text-amber-300">
                      Your identity credentials and opening deposit of ${createdCredentials.initialDeposit} {createdCredentials.currency} have been logged. A bank officer will review and activate your depository vault shortly.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shrink-0">
                    <CheckCircle2 className="h-7 w-7" />
                  </div>
                  <div>
                    <h4 className="text-base font-bold">
                      Official Depository Vault Provisioned
                    </h4>
                    <p className="text-xs text-emerald-700 dark:text-emerald-300">
                      The bank account is live, funded, and ready for immediate transactions, cards, and wire transfers.
                    </p>
                  </div>
                </div>
              )}

              {/* Credentials Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Account Number
                  </span>
                  <p className="font-mono text-base font-bold text-cyan-600 dark:text-cyan-400">
                    #{createdCredentials.accountNumber}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    International IBAN
                  </span>
                  <p className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {createdCredentials.iban}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    SWIFT / BIC Identifier
                  </span>
                  <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {createdCredentials.swiftBic}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Routing Transit Number (ABA)
                  </span>
                  <p className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {createdCredentials.routingNumber}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Account Holder Name
                  </span>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">
                    {createdCredentials.holderName}
                  </p>
                </div>

                <div>
                  <span className="text-[10px] text-slate-400 uppercase font-semibold">
                    Opening Credited Balance
                  </span>
                  <p className="font-semibold text-emerald-600 dark:text-emerald-400 font-mono">
                    ${createdCredentials.initialDeposit.toLocaleString()} {createdCredentials.currency}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  type="button"
                  variant="primary"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm"
                  onClick={() => {
                    generateAccountCertificatePDF({
                      accountNumber: createdCredentials.accountNumber,
                      iban: createdCredentials.iban,
                      routingNumber: createdCredentials.routingNumber,
                      swiftBic: createdCredentials.swiftBic,
                      accountType: createdCredentials.accountType,
                      currency: createdCredentials.currency,
                      holderName: createdCredentials.holderName,
                      holderEmail: createdCredentials.holderEmail,
                      branchName: createdCredentials.branchName,
                      initialDeposit: createdCredentials.initialDeposit,
                      verifiedViaOcr: !!ocrKycSnapshot?.verifiedViaOcr,
                      status: isCustomer ? "PENDING" : "ACTIVE",
                    });
                    toast.success("Account Opening Certificate PDF generated!");
                  }}
                  leftIcon={<Download className="h-4 w-4" />}
                >
                  Download Official Certificate (PDF)
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm font-semibold"
                  onClick={() => {
                    setIsSuccessModalOpen(false);
                    router.push(isCustomer ? "/customer/dashboard" : "/staff/accounts");
                  }}
                  rightIcon={<ArrowRight className="h-4 w-4" />}
                >
                  {isCustomer ? "Proceed to Banking Dashboard" : "View Accounts Overview"}
                </Button>
              </div>
            </div>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
