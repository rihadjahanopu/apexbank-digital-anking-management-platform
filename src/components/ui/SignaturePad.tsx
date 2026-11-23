"use client";

import React, { useRef, useState, useEffect } from "react";
import { Pen, Trash2, Check, Type } from "lucide-react";
import { Button } from "./Button";

interface SignaturePadProps {
  onSignatureChange: (dataUrl: string | null) => void;
  legalName?: string;
}

export function SignaturePad({
  onSignatureChange,
  legalName = "",
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawingRef = useRef(false);
  const hasDrawnRef = useRef(false);

  const [hasSignature, setHasSignature] = useState(false);
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typedName, setTypedName] = useState(legalName);

  useEffect(() => {
    if (legalName) {
      setTypedName((prev) => prev || legalName);
    }
  }, [legalName]);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    isDrawingRef.current = true;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.strokeStyle = "#0284c7"; // Cyan / Blue
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawingRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    hasDrawnRef.current = true;
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    const canvas = canvasRef.current;

    if (canvas && hasDrawnRef.current) {
      setHasSignature(true);
      const dataUrl = canvas.toDataURL("image/png");
      onSignatureChange(dataUrl);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    hasDrawnRef.current = false;
    isDrawingRef.current = false;
    setHasSignature(false);
    onSignatureChange(null);
  };

  const applyTypedSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.font = "italic 32px 'Brush Script MT', 'Dancing Script', cursive, sans-serif";
    ctx.fillStyle = "#0284c7";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(typedName || "Authorized Signatory", canvas.width / 2, canvas.height / 2);

    hasDrawnRef.current = true;
    setHasSignature(true);
    onSignatureChange(canvas.toDataURL("image/png"));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Pen className="h-3.5 w-3.5 text-cyan-500" />
          Digital Signature Verification
        </label>
        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => setMode("draw")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              mode === "draw"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Draw Stylus
          </button>
          <button
            type="button"
            onClick={() => setMode("type")}
            className={`px-2.5 py-1 rounded-md font-medium transition-all ${
              mode === "type"
                ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            }`}
          >
            Type Script
          </button>
        </div>
      </div>

      {mode === "draw" ? (
        <div className="relative border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50/50 dark:bg-slate-900/50 hover:border-cyan-500/50 transition-colors">
          <canvas
            ref={canvasRef}
            width={520}
            height={140}
            className="w-full h-[140px] cursor-crosshair touch-none"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
          {!hasSignature && (
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center text-xs text-slate-400 select-none">
              Sign with mouse, stylus, or touch screen here
            </div>
          )}
          <div className="absolute bottom-2 right-2 flex items-center gap-2">
            {hasSignature && (
              <span className="text-[10px] text-emerald-500 flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/20">
                <Check className="h-3 w-3" /> Captured
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearCanvas}
              className="h-7 px-2 text-xs text-slate-400 hover:text-rose-500"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={typedName}
              onChange={(e) => setTypedName(e.target.value)}
              placeholder="Enter legal name to generate signature"
              className="flex-1 px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 focus:outline-hidden focus:ring-2 focus:ring-cyan-500"
            />
            <Button
              type="button"
              variant="secondary"
              onClick={applyTypedSignature}
              leftIcon={<Type className="h-4 w-4" />}
            >
              Generate Script
            </Button>
          </div>
          <div className="relative border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-950 p-4 text-center">
            <canvas
              ref={canvasRef}
              width={520}
              height={100}
              className="w-full h-[100px]"
            />
          </div>
        </div>
      )}
      <p className="text-[11px] text-slate-500 dark:text-slate-400">
        By providing an electronic signature, the applicant certifies the validity
        of provided KYC documents and depository terms under banking compliance regulations.
      </p>
    </div>
  );
}
