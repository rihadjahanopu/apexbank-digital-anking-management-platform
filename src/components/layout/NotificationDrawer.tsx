"use client";

import React from "react";
import { X, Bell, CheckCheck } from "lucide-react";
import { cn, formatDateTime } from "@/lib/utils";
import { INotification } from "@/types";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: INotification[];
  onMarkAllAsRead?: () => void;
  onMarkAsRead?: (id: string) => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="relative z-50 flex h-full w-full max-w-sm flex-col border-l border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-5 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Banking Notifications
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {onMarkAllAsRead && (
              <button
                onClick={onMarkAllAsRead}
                title="Mark all as read"
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <CheckCheck className="h-4 w-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="flex h-48 flex-col items-center justify-center text-center text-xs text-slate-400">
              <Bell className="h-8 w-8 stroke-[1.2] text-slate-300 dark:text-slate-700 mb-2" />
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                onClick={() => onMarkAsRead && onMarkAsRead(n._id)}
                className={cn(
                  "cursor-pointer rounded-xl border p-3.5 transition-all",
                  n.isRead
                    ? "border-slate-100 bg-white text-slate-600 dark:border-slate-800/80 dark:bg-slate-900/60 dark:text-slate-400"
                    : "border-indigo-100 bg-indigo-50/50 text-slate-900 shadow-xs dark:border-indigo-950/80 dark:bg-indigo-950/30 dark:text-slate-100"
                )}
              >
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-xs font-semibold leading-tight">
                    {n.title}
                  </h4>
                  {!n.isRead && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                  )}
                </div>
                <p className="mt-1 text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                  {n.message}
                </p>
                <span className="mt-2 block text-[10px] text-slate-400">
                  {formatDateTime(n.createdAt)}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
