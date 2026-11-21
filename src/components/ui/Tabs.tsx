"use client";

import React, { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

interface TabsContextType {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextType | undefined>(undefined);

export interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({
  defaultValue,
  value,
  onValueChange,
  children,
  className,
}) => {
  const [activeTabState, setActiveTabState] = useState(defaultValue);
  const activeTab = value !== undefined ? value : activeTabState;

  const handleTabChange = (val: string) => {
    if (value === undefined) {
      setActiveTabState(val);
    }
    if (onValueChange) {
      onValueChange(val);
    }
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab: handleTabChange }}>
      <div className={cn("w-full space-y-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
};

export const TabsList = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "inline-flex h-11 items-center justify-start rounded-xl bg-slate-100 p-1 text-slate-500 dark:bg-slate-800/80 dark:text-slate-400",
      className
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export interface TabsTriggerProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  value: string;
}

export const TabsTrigger = React.forwardRef<
  HTMLButtonElement,
  TabsTriggerProps
>(({ className, value, children, ...props }, ref) => {
  const context = useContext(TabsContext);
  if (!context) throw new Error("TabsTrigger must be used within Tabs");

  const isActive = context.activeTab === value;

  return (
    <button
      ref={ref}
      type="button"
      onClick={() => context.setActiveTab(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-1.5 text-xs font-semibold ring-offset-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-white text-slate-900 shadow-xs dark:bg-slate-900 dark:text-slate-100 font-bold"
          : "hover:text-slate-700 dark:hover:text-slate-200",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});
TabsTrigger.displayName = "TabsTrigger";

export interface TabsContentProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const TabsContent = React.forwardRef<HTMLDivElement, TabsContentProps>(
  ({ className, value, children, ...props }, ref) => {
    const context = useContext(TabsContext);
    if (!context) throw new Error("TabsContent must be used within Tabs");

    if (context.activeTab !== value) return null;

    return (
      <div
        ref={ref}
        className={cn(
          "ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 animate-in fade-in-50 duration-150",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
TabsContent.displayName = "TabsContent";
