import React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "rectangular" | "circular";
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = "rectangular",
  ...props
}) => {
  const variantStyles = {
    text: "h-4 w-full rounded-md",
    rectangular: "h-12 w-full rounded-xl",
    circular: "h-10 w-10 rounded-full",
  };

  return (
    <div
      className={cn(
        "animate-pulse bg-slate-200/80 dark:bg-slate-800/80",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
};
