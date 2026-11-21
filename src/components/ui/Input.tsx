import React, { forwardRef, useId } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      disabled,
      id: customId,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const id = customId || generatedId;

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300"
          >
            {label}
          </label>
        )}

        <div className="relative flex items-center">
          {leftIcon && (
            <div className="pointer-events-none absolute left-3 flex items-center justify-center text-slate-400">
              {leftIcon}
            </div>
          )}

          <input
            id={id}
            type={type}
            ref={ref}
            disabled={disabled}
            className={cn(
              "w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 placeholder-slate-400 shadow-sm transition-all duration-150 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:opacity-75 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500 dark:focus:border-indigo-400 dark:disabled:bg-slate-800/60",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              error &&
                "border-rose-500 focus:border-rose-500 focus:ring-rose-500/20 dark:border-rose-500 dark:focus:border-rose-500",
              className
            )}
            {...props}
          />

          {rightIcon && (
            <div className="absolute right-3 flex items-center justify-center text-slate-400">
              {rightIcon}
            </div>
          )}
        </div>

        {error ? (
          <p className="text-xs text-rose-500 dark:text-rose-400 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 dark:text-slate-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Input.displayName = "Input";
