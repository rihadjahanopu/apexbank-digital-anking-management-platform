"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Wallet,
  ArrowLeftRight,
  ArrowDownToLine,
  ArrowUpFromLine,
  Landmark,
  ShieldAlert,
  Settings,
  History,
  UserCheck,
  UserPlus,
  PlusCircle,
  FileCheck,
  X,
  LogOut,
  UserCog,
  CreditCard,
  ShieldCheck,
  QrCode,
  Smartphone,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { UserRole, ROLES } from "@/lib/constants";
import { useLogoutMutation } from "@/redux/api/authApi";
import { useAppDispatch } from "@/redux/hooks";
import { logout } from "@/redux/slices/authSlice";
import { Badge } from "@/components/ui";

interface SidebarProps {
  role?: UserRole;
  userName?: string;
  userAvatarUrl?: string;
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role = ROLES.CUSTOMER,
  userName,
  userAvatarUrl,
  isOpen,
  onClose,
}) => {
  const pathname = usePathname();
  const router = useRouter();
  const dispatch = useAppDispatch();
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

  const adminNavItems: NavItem[] = [
    {
      label: "Overview",
      href: "/admin/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      label: "Customers",
      href: "/admin/customers",
      icon: <Users className="h-4 w-4" />,
    },
    {
      label: "Bank Accounts",
      href: "/admin/accounts",
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      label: "Cards Oversight",
      href: "/admin/cards",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      label: "Card Requests",
      href: "/admin/card-requests",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      label: "Account Closures",
      href: "/admin/account-closures",
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      label: "KYC Compliance",
      href: "/admin/kyc",
      icon: <FileCheck className="h-4 w-4" />,
    },
    {
      label: "Transactions",
      href: "/admin/transactions",
      icon: <ArrowLeftRight className="h-4 w-4" />,
    },
    {
      label: "Deposits",
      href: "/admin/deposits",
      icon: <ArrowDownToLine className="h-4 w-4" />,
    },
    {
      label: "Withdrawals",
      href: "/admin/withdrawals",
      icon: <ArrowUpFromLine className="h-4 w-4" />,
    },
    {
      label: "Loan Portfolio",
      href: "/admin/loans",
      icon: <Landmark className="h-4 w-4" />,
    },
    {
      label: "Fraud & Alerts",
      href: "/admin/suspicious",
      icon: <ShieldAlert className="h-4 w-4" />,
      badge: "Watch",
    },
    {
      label: "Staff Officers",
      href: "/admin/staff",
      icon: <UserCog className="h-4 w-4" />,
    },
    {
      label: "Banking Rules",
      href: "/admin/settings",
      icon: <Settings className="h-4 w-4" />,
    },
    {
      label: "Audit Trail",
      href: "/admin/audit-logs",
      icon: <History className="h-4 w-4" />,
    },
  ];

  const staffNavItems: NavItem[] = [
    {
      label: "Staff Desk",
      href: "/staff/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      label: "New Customer",
      href: "/staff/customers/register",
      icon: <UserPlus className="h-4 w-4" />,
    },
    {
      label: "Verify KYC",
      href: "/staff/customers",
      icon: <UserCheck className="h-4 w-4" />,
    },
    {
      label: "Issue Account",
      href: "/staff/accounts/create",
      icon: <PlusCircle className="h-4 w-4" />,
    },
    {
      label: "Accounts List",
      href: "/staff/accounts",
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      label: "Customer Cards",
      href: "/staff/cards",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      label: "Card Requests",
      href: "/staff/card-requests",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      label: "Account Closures",
      href: "/staff/account-closures",
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      label: "PIN Reset Desk",
      href: "/staff/pin-resets",
      icon: <KeyRound className="h-4 w-4" />,
    },
    {
      label: "KYC Review",
      href: "/staff/kyc",
      icon: <FileCheck className="h-4 w-4" />,
    },
    {
      label: "Ledger",
      href: "/staff/transactions",
      icon: <ArrowLeftRight className="h-4 w-4" />,
    },
    {
      label: "Review Deposits",
      href: "/staff/deposits",
      icon: <ArrowDownToLine className="h-4 w-4" />,
    },
    {
      label: "Review Withdrawals",
      href: "/staff/withdrawals",
      icon: <ArrowUpFromLine className="h-4 w-4" />,
    },
    {
      label: "Loan Assessment",
      href: "/staff/loans",
      icon: <FileCheck className="h-4 w-4" />,
    },
  ];

  const customerNavItems: NavItem[] = [
    {
      label: "My Financials",
      href: "/customer/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      label: "Open Bank Account",
      href: "/customer/accounts/open",
      icon: <PlusCircle className="h-4 w-4" />,
    },
    {
      label: "My Accounts",
      href: "/customer/accounts",
      icon: <Wallet className="h-4 w-4" />,
    },
    {
      label: "Virtual Cards",
      href: "/customer/cards",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      label: "Identity KYC",
      href: "/customer/kyc",
      icon: <ShieldCheck className="h-4 w-4" />,
    },
    {
      label: "Send Money",
      href: "/customer/transfer",
      icon: <ArrowLeftRight className="h-4 w-4" />,
    },
    {
      label: "Bangla QR Pay",
      href: "/customer/bangla-qr",
      icon: <QrCode className="h-4 w-4" />,
      badge: "BD QR",
    },
    {
      label: "Mobile Recharge",
      href: "/customer/recharge",
      icon: <Smartphone className="h-4 w-4" />,
    },
    {
      label: "Deposit Request",
      href: "/customer/deposit",
      icon: <ArrowDownToLine className="h-4 w-4" />,
    },
    {
      label: "Withdraw Request",
      href: "/customer/withdraw",
      icon: <ArrowUpFromLine className="h-4 w-4" />,
    },
    {
      label: "Statement",
      href: "/customer/transactions",
      icon: <History className="h-4 w-4" />,
    },
    {
      label: "Loans & Credit",
      href: "/customer/loans",
      icon: <Landmark className="h-4 w-4" />,
    },
  ];

  const currentNavItems =
    role === ROLES.ADMIN
      ? adminNavItems
      : role === ROLES.STAFF
      ? staffNavItems
      : customerNavItems;

  const roleLabel =
    role === ROLES.ADMIN
      ? "Admin Core"
      : role === ROLES.STAFF
      ? "Staff Desk"
      : "Customer";

  const roleBadgeVariant =
    role === ROLES.ADMIN
      ? "primary"
      : role === ROLES.STAFF
      ? "info"
      : "success";

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/70 backdrop-blur-xs lg:hidden transition-opacity"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Container - Fixed/Sticky on Desktop, Slide-over on Mobile */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 max-w-[85vw] flex-col border-r border-slate-200/80 bg-white transition-transform duration-300 ease-in-out dark:border-slate-800/80 dark:bg-slate-900 lg:sticky lg:top-0 lg:z-30 lg:h-screen lg:w-64 lg:shrink-0 lg:translate-x-0",
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        {/* Brand Header */}
        <div className="flex h-16 items-center justify-between px-5 border-b border-slate-200/80 dark:border-slate-800/80 shrink-0">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-linear-to-tr from-emerald-600 to-teal-400 text-slate-950 shadow-sm shadow-emerald-500/20">
              <Landmark className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-base font-bold tracking-tight text-slate-900 dark:text-white leading-none">
                Apex<span className="text-emerald-500 dark:text-emerald-400">Bank</span>
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium mt-1">
                Digital Reserve
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* User Role Tag */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            {userAvatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={userAvatarUrl}
                alt={userName || "User"}
                className="h-8 w-8 rounded-lg object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-linear-to-tr from-emerald-600 to-teal-500 text-xs font-bold text-slate-950 shrink-0">
                {userName?.charAt(0).toUpperCase() || "U"}
              </div>
            )}
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[110px]">
                {userName || "Authenticated"}
              </span>
              <span className="text-[10px] text-slate-400 capitalize">Active Session</span>
            </div>
          </div>
          <Badge variant={roleBadgeVariant} size="sm" dot>
            {roleLabel}
          </Badge>
        </div>

        {/* Nav Items - Independent Scroll inside Sidebar */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1 min-h-0">
          {currentNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/admin/dashboard" &&
                item.href !== "/staff/dashboard" &&
                item.href !== "/customer/dashboard" &&
                pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => {
                  if (window.innerWidth < 1024) onClose();
                }}
                className={cn(
                  "flex items-center justify-between rounded-xl px-3 py-2 text-xs font-medium transition-all duration-150",
                  isActive
                    ? "bg-linear-to-r from-emerald-600 to-teal-600 text-white shadow-xs font-semibold shadow-emerald-600/20"
                    : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                )}
              >
                <div className="flex items-center gap-3">
                  <span className={cn(isActive ? "text-white" : "text-slate-400")}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={cn(
                      "rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-slate-200/80 dark:border-slate-800/80 space-y-1 shrink-0">
          <Link
            href="/profile"
            onClick={() => {
              if (window.innerWidth < 1024) onClose();
            }}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
          >
            <Settings className="h-4 w-4 text-slate-400" />
            <span>Profile & Security</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/40 transition-colors"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
};
