"use client";

import React, { useState } from "react";
import {
  Wifi,
  Copy,
  Check,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";
import { ICard } from "@/types";
import { CARD_STATUS, CARD_NETWORKS } from "@/lib/constants";
import { formatCardNumber } from "@/lib/cards";
import { Badge } from "@/components/ui/Badge";

interface VirtualCardProps {
  card: ICard;
  revealedData?: { cardNumber: string; cvv: string } | null;
  onRevealClick?: () => void;
  onHideClick?: () => void;
}

export const VirtualCard: React.FC<VirtualCardProps> = ({
  card,
  revealedData,
  onRevealClick,
  onHideClick,
}) => {
  const [copied, setCopied] = useState(false);
  const isFrozen = card.status === CARD_STATUS.FROZEN;
  const isBlocked = card.status === CARD_STATUS.BLOCKED;

  const isRevealed = !!revealedData;
  const displayNumber = isRevealed
    ? formatCardNumber(revealedData.cardNumber)
    : card.maskedCardNumber;
  const displayCvv = isRevealed ? revealedData.cvv : "•••";

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    const panToCopy = isRevealed ? revealedData.cardNumber : card.cardNumber || card.maskedCardNumber;
    navigator.clipboard.writeText(panToCopy.replace(/\s+/g, ""));
    setCopied(true);
    toast.success("Card number copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const isVisa = card.network === CARD_NETWORKS.VISA;

  return (
    <div className="relative group w-full max-w-[380px] h-[230px] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 transform hover:scale-[1.02]">
      {/* Background with Metallic / Deep Navy Gradient */}
      <div
        className={`absolute inset-0 bg-gradient-to-br ${
          isFrozen
            ? "from-slate-700 via-slate-800 to-slate-950 grayscale"
            : isBlocked
            ? "from-rose-950 via-slate-900 to-slate-950"
            : isVisa
            ? "from-indigo-900 via-slate-900 to-blue-950 border border-indigo-500/20"
            : "from-amber-900 via-zinc-900 to-stone-950 border border-amber-500/20"
        } transition-all duration-500`}
      />

      {/* Futuristic Mesh / Geometric Overlay */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />

      {/* Decorative Glow Orb */}
      <div
        className={`absolute -top-12 -right-12 w-40 h-40 rounded-full blur-3xl opacity-30 ${
          isVisa ? "bg-cyan-500" : "bg-amber-500"
        }`}
      />

      {/* Card Content Overlay */}
      <div className="relative z-10 p-6 flex flex-col justify-between h-full text-white">
        {/* Top Row: Bank Brand + Status + NFC */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm tracking-widest text-slate-100 uppercase">
              Apex<span className="text-indigo-400">Bank</span>
            </span>
            <span className="text-[10px] tracking-wider uppercase px-1.5 py-0.5 rounded bg-white/10 text-slate-300 font-mono">
              {card.cardType}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {isFrozen && (
              <Badge variant="warning" size="sm">
                FROZEN
              </Badge>
            )}
            {isBlocked && (
              <Badge variant="danger" size="sm">
                BLOCKED
              </Badge>
            )}
            {!isFrozen && !isBlocked && (
              <Badge variant="success" size="sm" dot>
                ACTIVE
              </Badge>
            )}
            <Wifi className="h-4 w-4 text-slate-400 rotate-90" />
          </div>
        </div>

        {/* EMV Chip and Reveal Controls */}
        <div className="flex items-center justify-between my-1">
          {/* EMV Chip graphic */}
          <div className="w-10 h-7 rounded bg-gradient-to-tr from-amber-300 via-amber-400 to-yellow-200 border border-amber-500 shadow-inner flex flex-col justify-between p-1 opacity-90">
            <div className="w-full h-[1px] bg-amber-600/60" />
            <div className="w-full h-[1px] bg-amber-600/60" />
          </div>

          {/* Reveal details button */}
          <button
            type="button"
            onClick={isRevealed ? onHideClick : onRevealClick}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-xs text-slate-200 backdrop-blur-md transition-colors"
          >
            {isRevealed ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span className="text-[11px]">Hide</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5" />
                <span className="text-[11px]">Reveal Details</span>
              </>
            )}
          </button>
        </div>

        {/* 16-Digit Card Number */}
        <div className="flex items-center justify-between">
          <p className="font-mono text-lg font-semibold tracking-wider text-slate-100 drop-shadow">
            {displayNumber}
          </p>
          <button
            type="button"
            onClick={handleCopy}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition-colors"
            title="Copy Card Number"
          >
            {copied ? (
              <Check className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>

        {/* Bottom Row: Expiry, CVV & Network Logo */}
        <div className="flex items-end justify-between pt-1">
          <div className="space-y-0.5">
            <p className="text-[9px] uppercase tracking-wider text-slate-400">
              Valid Thru
            </p>
            <p className="font-mono text-xs font-semibold text-slate-200">
              {String(card.expiryMonth).padStart(2, "0")}/{String(card.expiryYear).slice(-2)}
            </p>
          </div>

          <div className="space-y-0.5">
            <p className="text-[9px] uppercase tracking-wider text-slate-400">
              CVV
            </p>
            <p className="font-mono text-xs font-semibold text-slate-200">
              {displayCvv}
            </p>
          </div>

          {/* Network Logo */}
          <div className="flex items-center">
            {isVisa ? (
              <span className="font-black italic text-xl tracking-tighter text-white drop-shadow">
                VISA
              </span>
            ) : (
              <div className="flex -space-x-2.5">
                <div className="w-6 h-6 rounded-full bg-rose-500 opacity-90 shadow-sm" />
                <div className="w-6 h-6 rounded-full bg-amber-400 opacity-90 shadow-sm" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
