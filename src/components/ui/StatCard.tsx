import React from "react";
import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "./Card";

export interface StatCardProps {
  title: string;
  value: string | number;
  change?: number; // e.g., +12.5 or -3.2
  changePeriod?: string; // e.g. "vs last month"
  icon: React.ReactNode;
  subtitle?: string;
  iconBgColor?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changePeriod = "vs last month",
  icon,
  subtitle,
  iconBgColor = "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400",
  className,
}) => {
  const isPositive = typeof change === "number" && change > 0;
  const isNegative = typeof change === "number" && change < 0;
  const isNeutral = typeof change === "number" && change === 0;

  return (
    <Card className={cn("p-6 hover:shadow-md transition-shadow", className)}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
          {title}
        </p>
        <div
          className={cn(
            "flex h-11 w-11 items-center justify-center rounded-xl",
            iconBgColor
          )}
        >
          {icon}
        </div>
      </div>

      <div className="mt-4">
        <h4 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
          {value}
        </h4>

        <div className="mt-2 flex items-center gap-2">
          {typeof change === "number" && (
            <span
              className={cn(
                "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold",
                isPositive &&
                  "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400",
                isNegative &&
                  "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400",
                isNeutral &&
                  "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400"
              )}
            >
              {isPositive && <ArrowUpRight className="h-3.5 w-3.5" />}
              {isNegative && <ArrowDownRight className="h-3.5 w-3.5" />}
              {isNeutral && <Minus className="h-3.5 w-3.5" />}
              {Math.abs(change)}%
            </span>
          )}

          {(changePeriod || subtitle) && (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {subtitle || changePeriod}
            </span>
          )}
        </div>
      </div>
    </Card>
  );
};
