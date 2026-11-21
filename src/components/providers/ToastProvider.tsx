"use client";

import { Toaster } from "sonner";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        classNames: {
          toast:
            "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 shadow-xl rounded-xl p-4 font-sans text-sm",
          description: "text-slate-500 dark:text-slate-400 text-xs",
          actionButton: "bg-indigo-600 hover:bg-indigo-700 text-white text-xs px-3 py-1.5 rounded-lg font-medium",
          cancelButton: "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs px-3 py-1.5 rounded-lg",
          success: "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-950",
          error: "text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-950",
          warning: "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-950",
          info: "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-950",
        },
      }}
    />
  );
}
