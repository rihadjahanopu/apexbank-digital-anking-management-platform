"use client";

import React, { useState } from "react";
import {
  CreditCard,
  Plus,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Globe,
  ShoppingBag,
  Store,
  DollarSign,
  Sliders,
  Trash2,
  Send,
} from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Button,
  Input,
  Select,
  Modal,
  Badge,
  EmptyState,
} from "@/components/ui";
import { VirtualCard } from "@/components/cards/VirtualCard";
import {
  useGetMyCardsQuery,
  useIssueCardMutation,
  useUpdateCardStatusMutation,
  useUpdateCardControlsMutation,
  useChangeCardPinMutation,
  useGetMyCardRequestsQuery,
  useRequestCardActionMutation,
} from "@/redux/api/cardsApi";
import { useGetMyAccountsQuery } from "@/redux/api/accountsApi";
import {
  ROLES,
  CARD_STATUS,
  CARD_NETWORKS,
  CARD_TYPES,
  CARD_REQUEST_TYPES,
  REQUEST_STATUS,
  ACCOUNT_STATUS,
  CardNetwork,
  CardType,
} from "@/lib/constants";
import { formatCurrency } from "@/lib/money";
import { formatDate } from "@/lib/utils";
import { ICard, IBankAccount } from "@/types";

export default function CustomerCardsPage() {
  const { data: cardsData, isLoading: isLoadingCards } = useGetMyCardsQuery();
  const { data: accountsData } = useGetMyAccountsQuery();

  const [issueCardMutation, { isLoading: isIssuing }] = useIssueCardMutation();
  const [updateStatusMutation, { isLoading: isUpdatingStatus }] =
    useUpdateCardStatusMutation();
  const [updateControlsMutation, { isLoading: isUpdatingControls }] =
    useUpdateCardControlsMutation();
  const [changePinMutation, { isLoading: isChangingPin }] =
    useChangeCardPinMutation();
  const { data: requestsData } = useGetMyCardRequestsQuery();
  const [requestCardMutation, { isLoading: isSubmittingRequest }] =
    useRequestCardActionMutation();
  const cardRequests = requestsData?.data || [];

  const cards = cardsData?.cards || [];
  const accounts = (accountsData?.accounts || []).filter(
    (a) => a.status === ACCOUNT_STATUS.ACTIVE
  );

  const [selectedCardId, setSelectedCardId] = useState<string>("");
  const activeCard: ICard | undefined =
    cards.find((c) => c._id === selectedCardId) || cards[0];

  // Reveal Credentials State
  const [revealModalOpen, setRevealModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [revealedCredentials, setRevealedCredentials] = useState<{
    [cardId: string]: { cardNumber: string; cvv: string };
  }>({});
  const [isVerifyingReveal, setIsVerifyingReveal] = useState(false);

  // Issue Card Modal State (Instant Virtual)
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [newCardNetwork, setNewCardNetwork] = useState<CardNetwork>(
    CARD_NETWORKS.VISA
  );
  const newCardType: CardType = CARD_TYPES.VIRTUAL;
  const [newCardPin, setNewCardPin] = useState("1234");

  // Formal Card Issue Request Modal State
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [reqAccountId, setReqAccountId] = useState("");
  const [reqNetwork, setReqNetwork] = useState<CardNetwork>(CARD_NETWORKS.VISA);
  const [reqType, setReqType] = useState<CardType>(CARD_TYPES.VIRTUAL);
  const [reqReason, setReqReason] = useState("");

  // Card Cancellation Request Modal State
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  // Change PIN Modal State
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");

  // Local Controls State for active card
  const [onlineLimit, setOnlineLimit] = useState<number>(2500);
  const [atmLimit, setAtmLimit] = useState<number>(1000);
  const [posLimit, setPosLimit] = useState<number>(3000);
  const [isOnlineEnabled, setIsOnlineEnabled] = useState(true);
  const [isAtmEnabled, setIsAtmEnabled] = useState(true);
  const [isPosEnabled, setIsPosEnabled] = useState(true);
  const [isInternationalEnabled, setIsInternationalEnabled] = useState(false);

  // Sync controls when active card changes
  const effectiveOnlineLimit = activeCard?.dailyOnlineLimit ?? onlineLimit;
  const effectiveAtmLimit = activeCard?.dailyAtmLimit ?? atmLimit;
  const effectivePosLimit = activeCard?.dailyPosLimit ?? posLimit;
  const effectiveOnlineEnabled = activeCard?.isOnlineEnabled ?? isOnlineEnabled;
  const effectiveAtmEnabled = activeCard?.isAtmEnabled ?? isAtmEnabled;
  const effectivePosEnabled = activeCard?.isPosEnabled ?? isPosEnabled;
  const effectiveInternationalEnabled =
    activeCard?.isInternationalEnabled ?? isInternationalEnabled;

  const handleToggleFreeze = async (card: ICard) => {
    const newStatus =
      card.status === CARD_STATUS.FROZEN
        ? CARD_STATUS.ACTIVE
        : CARD_STATUS.FROZEN;
    try {
      const res = await updateStatusMutation({
        id: card._id,
        status: newStatus,
        reason: "Customer initiated card security toggle",
      }).unwrap();
      toast.success(res.message);
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to update card status");
    }
  };

  const handleRevealSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCard || !pinInput) return;

    try {
      setIsVerifyingReveal(true);
      const res = await fetch(
        `/api/cards/${activeCard._id}?reveal=true&pin=${encodeURIComponent(
          pinInput
        )}`
      );
      const data = await res.json();

      if (data.success && data.card.cardNumber) {
        setRevealedCredentials((prev) => ({
          ...prev,
          [activeCard._id]: {
            cardNumber: data.card.cardNumber,
            cvv: data.card.cvv,
          },
        }));
        setRevealModalOpen(false);
        setPinInput("");
        toast.success("Card credentials decrypted successfully.");
      } else {
        toast.error(data.error || "Incorrect Card PIN.");
      }
    } catch {
      toast.error("Failed to verify PIN");
    } finally {
      setIsVerifyingReveal(false);
    }
  };

  const handleSaveControls = async () => {
    if (!activeCard) return;
    try {
      const res = await updateControlsMutation({
        id: activeCard._id,
        dailyOnlineLimit: onlineLimit,
        dailyAtmLimit: atmLimit,
        dailyPosLimit: posLimit,
        isOnlineEnabled,
        isAtmEnabled,
        isPosEnabled,
        isInternationalEnabled,
      }).unwrap();
      toast.success(res.message || "Card controls saved successfully!");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to save card controls.");
    }
  };

  const handleIssueCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const accountId = selectedAccountId || accounts[0]?._id;
    if (!accountId) {
      toast.error("Please select a depository account.");
      return;
    }

    try {
      const res = await issueCardMutation({
        accountId,
        network: newCardNetwork,
        cardType: newCardType,
        pin: newCardPin,
      }).unwrap();

      toast.success(res.message);
      setIsIssueModalOpen(false);
      if (res.card) {
        setSelectedCardId(res.card._id);
        if (res.card.cardNumber && res.card.cvv) {
          setRevealedCredentials((prev) => ({
            ...prev,
            [res.card._id]: {
              cardNumber: res.card.cardNumber,
              cvv: res.card.cvv as string,
            },
          }));
        }
      }
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to issue card.");
    }
  };

  const handleChangePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCard) return;

    try {
      const res = await changePinMutation({
        id: activeCard._id,
        currentPin,
        newPin,
      }).unwrap();

      toast.success(res.message);
      setIsPinModalOpen(false);
      setCurrentPin("");
      setNewPin("");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to change PIN.");
    }
  };

  const handleCardRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetAcc = reqAccountId || accounts[0]?._id;
    if (!targetAcc) {
      toast.error("Please select a depository account.");
      return;
    }
    if (!reqReason.trim()) {
      toast.error("Please provide a reason for the card request.");
      return;
    }

    try {
      const res = await requestCardMutation({
        accountId: targetAcc,
        requestType: CARD_REQUEST_TYPES.ISSUE,
        network: reqNetwork,
        cardType: reqType,
        reason: reqReason.trim(),
      }).unwrap();

      toast.success(res.message);
      setIsRequestModalOpen(false);
      setReqReason("");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to submit card request.");
    }
  };

  const handleCardCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCard) return;
    if (!cancelReason.trim()) {
      toast.error("Please provide a cancellation reason.");
      return;
    }

    try {
      const accId =
        typeof activeCard.accountId === "object"
          ? (activeCard.accountId as IBankAccount)._id
          : (activeCard.accountId as string);

      const res = await requestCardMutation({
        accountId: accId,
        cardId: activeCard._id,
        requestType: CARD_REQUEST_TYPES.REMOVE,
        reason: cancelReason.trim(),
      }).unwrap();

      toast.success(res.message);
      setIsCancelModalOpen(false);
      setCancelReason("");
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Failed to submit card cancellation request.");
    }
  };

  return (
    <DashboardLayout allowedRoles={[ROLES.CUSTOMER, ROLES.ADMIN, ROLES.STAFF]}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Card Management Center
              </h1>
              <Badge variant="primary" dot>
                EMVCo & PCI Protected
              </Badge>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Issue virtual debit cards, control spending limits, and manage fraud freeze protections.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Send className="h-4 w-4" />}
              onClick={() => {
                setReqReason("");
                setIsRequestModalOpen(true);
              }}
            >
              Request Card
            </Button>
            <Button
              size="sm"
              leftIcon={<Plus className="h-4 w-4" />}
              onClick={() => setIsIssueModalOpen(true)}
            >
              Instant Virtual Card
            </Button>
          </div>
        </div>

        {isLoadingCards ? (
          <div className="py-12 text-center text-xs text-slate-400">
            Loading secure card portfolios...
          </div>
        ) : cards.length === 0 ? (
          <EmptyState
            icon={<CreditCard className="h-8 w-8 text-indigo-500" />}
            title="No payment cards issued"
            description="You currently have no active virtual or debit cards attached to your checking accounts."
            actionLabel="Issue Your First Virtual Card"
            onAction={() => setIsIssueModalOpen(true)}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Virtual Cards Display & Selector */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Your Digital Cards ({cards.length})
                </p>

                {/* Main Card Graphic */}
                {activeCard && (
                  <div className="flex justify-center">
                    <VirtualCard
                      card={activeCard}
                      revealedData={revealedCredentials[activeCard._id]}
                      onRevealClick={() => setRevealModalOpen(true)}
                      onHideClick={() =>
                        setRevealedCredentials((prev) => {
                          const updated = { ...prev };
                          delete updated[activeCard._id];
                          return updated;
                        })
                      }
                    />
                  </div>
                )}
              </div>

              {/* Card Switcher List (if multiple) */}
              {cards.length > 1 && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-slate-600 dark:text-slate-300">
                    Switch Card:
                  </p>
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {cards.map((c) => (
                      <button
                        key={c._id}
                        type="button"
                        onClick={() => setSelectedCardId(c._id)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-mono transition-all border ${
                          activeCard?._id === c._id
                            ? "bg-indigo-600/10 border-indigo-500 text-indigo-400 font-bold"
                            : "bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-400 hover:border-slate-700"
                        }`}
                      >
                        <CreditCard className="h-3.5 w-3.5" />
                        <span>{c.maskedCardNumber.slice(-8)}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Actions Panel */}
              {activeCard && (
                <Card>
                  <CardHeader className="py-3 px-4">
                    <CardTitle className="text-xs uppercase tracking-wider text-slate-400">
                      Quick Security Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0 space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                      <Button
                        variant={
                          activeCard.status === CARD_STATUS.FROZEN
                            ? "primary"
                            : "outline"
                        }
                        size="sm"
                        isLoading={isUpdatingStatus}
                        leftIcon={
                          activeCard.status === CARD_STATUS.FROZEN ? (
                            <Unlock className="h-3.5 w-3.5" />
                          ) : (
                            <Lock className="h-3.5 w-3.5" />
                          )
                        }
                        onClick={() => handleToggleFreeze(activeCard)}
                      >
                        {activeCard.status === CARD_STATUS.FROZEN
                          ? "Unfreeze Card"
                          : "Freeze Card"}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        leftIcon={<KeyRound className="h-3.5 w-3.5" />}
                        onClick={() => setIsPinModalOpen(true)}
                      >
                        Change PIN
                      </Button>
                    </div>

                    <Button
                      variant="danger"
                      size="sm"
                      className="w-full"
                      leftIcon={<Trash2 className="h-3.5 w-3.5" />}
                      disabled={activeCard.status === CARD_STATUS.BLOCKED}
                      onClick={() => {
                        setCancelReason("");
                        setIsCancelModalOpen(true);
                      }}
                    >
                      {activeCard.status === CARD_STATUS.BLOCKED
                        ? "Card Already Blocked"
                        : "Request Card Cancellation"}
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Column: Card Controls & Channel Toggles */}
            {activeCard && (
              <div className="lg:col-span-7 space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Channel Security & Controls</CardTitle>
                        <CardDescription>
                          Individually toggle transactional channels and adjust daily spending caps.
                        </CardDescription>
                      </div>
                      <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Channel Toggles Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Online Shopping */}
                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <ShoppingBag className="h-4 w-4 text-indigo-400" />
                          <div>
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              Online Payments
                            </p>
                            <p className="text-[10px] text-slate-400">
                              E-commerce web & app checkouts
                            </p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={effectiveOnlineEnabled}
                          onChange={(e) => setIsOnlineEnabled(e.target.checked)}
                          className="toggle h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      {/* In-Store POS Swipes */}
                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Store className="h-4 w-4 text-emerald-400" />
                          <div>
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              In-Store POS
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Physical store contactless & chip
                            </p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={effectivePosEnabled}
                          onChange={(e) => setIsPosEnabled(e.target.checked)}
                          className="toggle h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      {/* ATM Cash Withdrawals */}
                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <DollarSign className="h-4 w-4 text-amber-400" />
                          <div>
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              ATM Withdrawals
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Cash disbursement at ATMs
                            </p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={effectiveAtmEnabled}
                          onChange={(e) => setIsAtmEnabled(e.target.checked)}
                          className="toggle h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                        />
                      </div>

                      {/* International Cross-Border */}
                      <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <Globe className="h-4 w-4 text-purple-400" />
                          <div>
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                              International Usage
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Foreign currency cross-border
                            </p>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={effectiveInternationalEnabled}
                          onChange={(e) =>
                            setIsInternationalEnabled(e.target.checked)
                          }
                          className="toggle h-4 w-4 rounded accent-indigo-600 cursor-pointer"
                        />
                      </div>
                    </div>

                    {/* Daily Spending Limit Sliders */}
                    <div className="space-y-4 pt-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          Daily Channel Limits
                        </p>
                        <Sliders className="h-4 w-4 text-slate-400" />
                      </div>

                      {/* Online Limit */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-300">
                            Daily Online Checkout Cap:
                          </span>
                          <span className="font-bold text-indigo-500">
                            {formatCurrency(effectiveOnlineLimit)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="100"
                          max="10000"
                          step="100"
                          value={effectiveOnlineLimit}
                          onChange={(e) => setOnlineLimit(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                        />
                      </div>

                      {/* POS Limit */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-300">
                            Daily POS Terminal Cap:
                          </span>
                          <span className="font-bold text-emerald-500">
                            {formatCurrency(effectivePosLimit)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="100"
                          max="10000"
                          step="100"
                          value={effectivePosLimit}
                          onChange={(e) => setPosLimit(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                        />
                      </div>

                      {/* ATM Limit */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-300">
                            Daily ATM Cash Cap:
                          </span>
                          <span className="font-bold text-amber-500">
                            {formatCurrency(effectiveAtmLimit)}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="100"
                          max="5000"
                          step="100"
                          value={effectiveAtmLimit}
                          onChange={(e) => setAtmLimit(Number(e.target.value))}
                          className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex justify-end">
                      <Button
                        size="sm"
                        isLoading={isUpdatingControls}
                        onClick={handleSaveControls}
                      >
                        Save Card Controls
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        {/* Modal: Reveal Full Card Credentials */}
        <Modal
          isOpen={revealModalOpen}
          onClose={() => {
            setRevealModalOpen(false);
            setPinInput("");
          }}
          title="Authenticate Card Credentials"
          description="Enter your 4-digit card PIN to decrypt your 16-digit PAN and CVV security code."
        >
          <form onSubmit={handleRevealSubmit} className="space-y-4 pt-2">
            <Input
              label="Card PIN"
              type="password"
              maxLength={4}
              placeholder="••••"
              value={pinInput}
              onChange={(e) => setPinInput(e.target.value)}
              required
              autoFocus
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setRevealModalOpen(false)}
              >
                Cancel
              </Button>
              <Button size="sm" type="submit" isLoading={isVerifyingReveal}>
                Decrypt & Reveal
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Issue New Virtual Card */}
        <Modal
          isOpen={isIssueModalOpen}
          onClose={() => setIsIssueModalOpen(false)}
          title="Issue New Virtual Card"
          description="Generate a secure virtual debit card instantly linked to your checking or savings account."
        >
          <form onSubmit={handleIssueCardSubmit} className="space-y-4 pt-2">
            <Select
              label="Linked Depository Account"
              value={selectedAccountId || accounts[0]?._id || ""}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              options={accounts.map((a) => ({
                value: a._id,
                label: `${a.accountType} (${a.accountNumber}) — Avail: ${formatCurrency(
                  a.availableBalance
                )}`,
              }))}
            />

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Card Network
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setNewCardNetwork(CARD_NETWORKS.VISA)}
                  className={`p-3 rounded-xl border text-center font-bold text-sm transition-all ${
                    newCardNetwork === CARD_NETWORKS.VISA
                      ? "bg-indigo-600/10 border-indigo-500 text-indigo-500 ring-2 ring-indigo-500/20"
                      : "border-slate-200 dark:border-slate-800 text-slate-400"
                  }`}
                >
                  VISA
                </button>
                <button
                  type="button"
                  onClick={() => setNewCardNetwork(CARD_NETWORKS.MASTERCARD)}
                  className={`p-3 rounded-xl border text-center font-bold text-sm transition-all ${
                    newCardNetwork === CARD_NETWORKS.MASTERCARD
                      ? "bg-amber-600/10 border-amber-500 text-amber-500 ring-2 ring-amber-500/20"
                      : "border-slate-200 dark:border-slate-800 text-slate-400"
                  }`}
                >
                  Mastercard
                </button>
              </div>
            </div>

            <Input
              label="Set 4-Digit Card PIN"
              type="password"
              maxLength={4}
              value={newCardPin}
              onChange={(e) => setNewCardPin(e.target.value)}
              placeholder="e.g. 1234"
              required
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsIssueModalOpen(false)}
              >
                Cancel
              </Button>
              <Button size="sm" type="submit" isLoading={isIssuing}>
                Generate Virtual Card
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Change Card PIN */}
        <Modal
          isOpen={isPinModalOpen}
          onClose={() => setIsPinModalOpen(false)}
          title="Change Card PIN"
          description="Update your 4-digit card authorization security PIN."
        >
          <form onSubmit={handleChangePinSubmit} className="space-y-4 pt-2">
            <Input
              label="Current PIN"
              type="password"
              maxLength={4}
              placeholder="••••"
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              required
            />

            <Input
              label="New 4-Digit PIN"
              type="password"
              maxLength={4}
              placeholder="••••"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              required
            />

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsPinModalOpen(false)}
              >
                Cancel
              </Button>
              <Button size="sm" type="submit" isLoading={isChangingPin}>
                Update PIN
              </Button>
            </div>
          </form>
        </Modal>

        {/* Card Requests History Tracker */}
        <div className="space-y-4 pt-6 border-t border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100">
                Card Service Requests History
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track pending and approved requests for card issuance and cancellation.
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              leftIcon={<Send className="h-4 w-4" />}
              onClick={() => {
                setReqReason("");
                setIsRequestModalOpen(true);
              }}
            >
              New Request
            </Button>
          </div>

          <Card>
            <CardContent className="p-0">
              {cardRequests.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No card service requests submitted yet.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Type</TableHead>
                      <TableHead>Linked Account</TableHead>
                      <TableHead>Details</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cardRequests.map((req) => {
                      const account = req.accountId as IBankAccount;
                      const targetCard = req.cardId as ICard | undefined;
                      const issuedCard = req.issuedCardId as ICard | undefined;

                      return (
                        <TableRow key={req._id}>
                          <TableCell>
                            <Badge
                              variant={
                                req.requestType === CARD_REQUEST_TYPES.ISSUE
                                  ? "primary"
                                  : "danger"
                              }
                              size="sm"
                            >
                              {req.requestType === CARD_REQUEST_TYPES.ISSUE
                                ? "ISSUE"
                                : "REMOVE"}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-xs">
                            {account?.accountNumber || "N/A"}
                          </TableCell>
                          <TableCell className="text-xs">
                            {req.requestType === CARD_REQUEST_TYPES.ISSUE ? (
                              <span>
                                {req.network} {req.cardType}
                                {issuedCard && (
                                  <span className="block font-mono text-[10px] text-emerald-500 font-bold">
                                    Card: {issuedCard.maskedCardNumber}
                                  </span>
                                )}
                              </span>
                            ) : (
                              <span className="font-mono text-rose-500">
                                {targetCard?.maskedCardNumber || "Card"}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-xs max-w-[200px] truncate" title={req.reason}>
                            {req.reason}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                req.status === REQUEST_STATUS.APPROVED
                                  ? "success"
                                  : req.status === REQUEST_STATUS.REJECTED
                                  ? "danger"
                                  : "warning"
                              }
                              size="sm"
                              dot
                            >
                              {req.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-slate-400">
                            {formatDate(req.createdAt)}
                          </TableCell>
                          <TableCell className="text-xs text-slate-500">
                            {req.adminRemarks || "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Modal: Formal Card Issue Request */}
        <Modal
          isOpen={isRequestModalOpen}
          onClose={() => setIsRequestModalOpen(false)}
          title="Submit Card Issuance Request"
          description="Request a new banking card. Your application will be reviewed and approved by Bank Staff."
        >
          <form onSubmit={handleCardRequestSubmit} className="space-y-4 pt-2">
            <Select
              label="Select Depository Account"
              value={reqAccountId || accounts[0]?._id || ""}
              onChange={(e) => setReqAccountId(e.target.value)}
              options={accounts.map((a) => ({
                value: a._id,
                label: `${a.accountType} (${a.accountNumber}) — Bal: ${formatCurrency(
                  a.balance
                )}`,
              }))}
            />

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Card Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {[CARD_TYPES.VIRTUAL, CARD_TYPES.DEBIT, CARD_TYPES.CREDIT].map(
                  (type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setReqType(type)}
                      className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                        reqType === type
                          ? "bg-indigo-600/10 border-indigo-500 text-indigo-500 ring-2 ring-indigo-500/20"
                          : "border-slate-200 dark:border-slate-800 text-slate-400"
                      }`}
                    >
                      {type}
                    </button>
                  )
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Card Network
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => setReqNetwork(CARD_NETWORKS.VISA)}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                    reqNetwork === CARD_NETWORKS.VISA
                      ? "bg-indigo-600/10 border-indigo-500 text-indigo-500 ring-2 ring-indigo-500/20"
                      : "border-slate-200 dark:border-slate-800 text-slate-400"
                  }`}
                >
                  VISA
                </button>
                <button
                  type="button"
                  onClick={() => setReqNetwork(CARD_NETWORKS.MASTERCARD)}
                  className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all ${
                    reqNetwork === CARD_NETWORKS.MASTERCARD
                      ? "bg-amber-600/10 border-amber-500 text-amber-500 ring-2 ring-amber-500/20"
                      : "border-slate-200 dark:border-slate-800 text-slate-400"
                  }`}
                >
                  Mastercard
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Purpose / Reason for Card
              </label>
              <textarea
                rows={3}
                value={reqReason}
                onChange={(e) => setReqReason(e.target.value)}
                placeholder="e.g. Primary card for overseas online subscriptions and travel."
                required
                className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRequestModalOpen(false)}
              >
                Cancel
              </Button>
              <Button size="sm" type="submit" isLoading={isSubmittingRequest}>
                Submit Card Request
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal: Card Cancellation / Removal Request */}
        <Modal
          isOpen={isCancelModalOpen}
          onClose={() => setIsCancelModalOpen(false)}
          title="Request Card Cancellation"
          description="Submit a formal request to permanently block and cancel your card."
        >
          {activeCard && (
            <form onSubmit={handleCardCancelSubmit} className="space-y-4 pt-2">
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-3 bg-slate-50 dark:bg-slate-900/40 text-xs space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Card Number:</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                    {activeCard.maskedCardNumber}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Network & Type:</span>
                  <span className="font-semibold">
                    {activeCard.network} {activeCard.cardType}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Reason for Cancellation
                </label>
                <div className="space-y-2 mb-2">
                  {[
                    "Card lost or stolen",
                    "Suspected fraudulent transactions",
                    "Card damaged / chipped",
                    "No longer require this card",
                  ].map((quickReason) => (
                    <button
                      key={quickReason}
                      type="button"
                      onClick={() => setCancelReason(quickReason)}
                      className={`w-full text-left p-2 rounded-lg text-xs border transition-all ${
                        cancelReason === quickReason
                          ? "bg-rose-500/10 border-rose-500 text-rose-500 font-semibold"
                          : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300"
                      }`}
                    >
                      {quickReason}
                    </button>
                  ))}
                </div>
                <textarea
                  rows={2}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Or enter custom reason..."
                  required
                  className="w-full text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-2.5 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCancelModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  type="submit"
                  isLoading={isSubmittingRequest}
                >
                  Submit Cancellation Request
                </Button>
              </div>
            </form>
          )}
        </Modal>
      </div>
    </DashboardLayout>
  );
}
