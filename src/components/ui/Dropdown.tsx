"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

export interface DropdownItem {
  label: React.ReactNode;
  icon?: React.ReactNode;
  onClick: () => void;
  danger?: boolean;
  disabled?: boolean;
}

export interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: "left" | "right";
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  trigger,
  items,
  align = "right",
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const calculatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const menuWidth = 208; // w-52
    const itemHeight = 36;
    const estimatedMenuHeight = items.length * itemHeight + 16;

    // Check space below vs above
    const spaceBelow = window.innerHeight - rect.bottom;
    const shouldOpenUpwards =
      spaceBelow < estimatedMenuHeight && rect.top > estimatedMenuHeight;

    const top = shouldOpenUpwards
      ? Math.max(8, rect.top - estimatedMenuHeight - 4)
      : Math.min(window.innerHeight - estimatedMenuHeight - 8, rect.bottom + 4);

    const left =
      align === "right"
        ? Math.max(8, rect.right - menuWidth)
        : Math.min(window.innerWidth - menuWidth - 8, rect.left);

    setCoords({ top, left });
  }, [align, items.length]);

  const toggleDropdown = () => {
    if (!isOpen) {
      calculatePosition();
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    const handleScrollOrResize = () => {
      setIsOpen(false);
    };

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    window.addEventListener("scroll", handleScrollOrResize, true);
    window.addEventListener("resize", handleScrollOrResize);
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("scroll", handleScrollOrResize, true);
      window.removeEventListener("resize", handleScrollOrResize);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <>
      <div
        ref={triggerRef}
        onClick={toggleDropdown}
        className="cursor-pointer inline-block"
      >
        {trigger}
      </div>

      {isOpen &&
        coords &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: "fixed",
              top: `${coords.top}px`,
              left: `${coords.left}px`,
            }}
            className={cn(
              "z-[9999] w-52 rounded-xl border border-slate-200 bg-white p-1.5 shadow-2xl ring-1 ring-black/10 focus:outline-none dark:border-slate-800 dark:bg-slate-900 animate-in fade-in-0 zoom-in-95 duration-100",
              className
            )}
          >
            {items.map((item, index) => (
              <button
                key={index}
                type="button"
                disabled={item.disabled}
                onClick={() => {
                  item.onClick();
                  setIsOpen(false);
                }}
                className={cn(
                  "group flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors text-left",
                  item.danger
                    ? "text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40"
                    : "text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800",
                  item.disabled && "pointer-events-none opacity-50"
                )}
              >
                {item.icon && (
                  <span className="text-slate-400 group-hover:text-current shrink-0">
                    {item.icon}
                  </span>
                )}
                <span className="truncate">{item.label}</span>
              </button>
            ))}
          </div>,
          document.body
        )}
    </>
  );
};
