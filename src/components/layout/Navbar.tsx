"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Menu,
  Bell,
  User,
  Shield,
  KeyRound,
  LogOut,
} from "lucide-react";
import { Dropdown } from "@/components/ui/Dropdown";
import { Badge } from "@/components/ui/Badge";
import { IUser } from "@/types";
import { ROLES } from "@/lib/constants";
import { useLogoutMutation } from "@/redux/api/authApi";
import { useAppDispatch } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";

interface NavbarProps {
  user: IUser | null;
  unreadCount?: number;
  onOpenSidebar: () => void;
  onOpenNotifications: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  unreadCount = 0,
  onOpenSidebar,
  onOpenNotifications,
}) => {
  const dispatch = useAppDispatch();
  const router = useRouter();
  const [logoutMutation] = useLogoutMutation();

  const handleLogout = async () => {
    try {
      await logoutMutation().unwrap();
    } catch {
      // Ignore
    } finally {
      dispatch(logout());
      router.push("/login");
    }
  };

  const roleLabel =
    user?.role === ROLES.ADMIN
      ? "Admin"
      : user?.role === ROLES.STAFF
      ? "Staff"
      : "Customer";

  const dropdownItems = [
    {
      label: "Profile Settings",
      icon: <User className="h-3.5 w-3.5" />,
      onClick: () => {
        router.push("/profile");
      },
    },
    {
      label: "Transaction PIN",
      icon: <KeyRound className="h-3.5 w-3.5" />,
      onClick: () => {
        router.push("/profile#pin");
      },
    },
    {
      label: "Sign Out",
      icon: <LogOut className="h-3.5 w-3.5" />,
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-md dark:border-slate-800/80 dark:bg-slate-900/80 sm:px-6">
      {/* Left: Mobile Toggle */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenSidebar}
          type="button"
          className="rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 lg:hidden"
          aria-label="Open sidebar"
        >
          <Menu className="h-5 w-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Digital Banking Desk
          </span>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <Badge
            variant={
              user?.role === ROLES.ADMIN
                ? "primary"
                : user?.role === ROLES.STAFF
                ? "info"
                : "success"
            }
            size="sm"
            dot
          >
            {roleLabel} Console
          </Badge>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-3">
        {/* Notification Bell */}
        <button
          onClick={onOpenNotifications}
          type="button"
          className="relative rounded-xl p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-white dark:ring-slate-900">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>

        {/* User Profile Pill */}
        {user ? (
          <Dropdown
            trigger={
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200/80 bg-slate-50/80 p-1.5 pr-3 hover:bg-slate-100/80 dark:border-slate-800 dark:bg-slate-800/60 dark:hover:bg-slate-800 transition-colors select-none">
                {user.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="h-7 w-7 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
                  />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-linear-to-tr from-emerald-600 to-teal-500 text-xs font-bold text-slate-950 shrink-0">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[10px] text-slate-400 capitalize leading-tight">
                    {user.role.toLowerCase()}
                  </span>
                </div>
              </div>
            }
            items={dropdownItems}
          />
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-1.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 px-3 py-1.5 text-xs font-bold text-slate-950 shadow-xs"
          >
            <Shield className="h-3.5 w-3.5" />
            Sign In
          </Link>
        )}
      </div>
    </header>
  );
};
