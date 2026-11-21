"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";
import { NotificationDrawer } from "./NotificationDrawer";
import { useGetMeQuery } from "@/redux/api/authApi";
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
} from "@/redux/api/notificationsApi";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { updateUser } from "@/redux/slices/authSlice";
import { UserRole } from "@/lib/constants";
import { Loader2 } from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  allowedRoles,
}) => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { data: meData, isLoading, isError } = useGetMeQuery();
  const { data: notifData } = useGetNotificationsQuery();
  const [markReadMutation] = useMarkNotificationReadMutation();
  const [markAllReadMutation] = useMarkAllNotificationsReadMutation();

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Sync me data into Redux auth state
  useEffect(() => {
    if (meData?.success && meData.user) {
      dispatch(updateUser(meData.user));
    }
  }, [meData, dispatch]);

  // Auth & role check
  useEffect(() => {
    if (!isLoading) {
      if (isError || (!user && !meData?.user)) {
        router.push("/login");
        return;
      }

      const activeUser = user || meData?.user;
      if (activeUser && allowedRoles && allowedRoles.length > 0) {
        if (!allowedRoles.includes(activeUser.role)) {
          if (activeUser.role === "ADMIN") router.push("/admin/dashboard");
          else if (activeUser.role === "STAFF") router.push("/staff/dashboard");
          else router.push("/customer/dashboard");
        }
      }
    }
  }, [isLoading, isError, user, meData, allowedRoles, router]);

  const activeUser = user || meData?.user;

  if (isLoading || (!activeUser && !isError)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-xs font-semibold text-slate-500">
            Verifying Banking Session...
          </p>
        </div>
      </div>
    );
  }

  const notifications = notifData?.notifications || [];
  const unreadCount = notifData?.unreadCount || 0;

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
      {/* Sidebar */}
      <Sidebar
        role={activeUser?.role}
        userName={activeUser?.name}
        userAvatarUrl={activeUser?.avatarUrl}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Container */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          user={activeUser || null}
          unreadCount={unreadCount}
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenNotifications={() => setIsNotificationsOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={isNotificationsOpen}
        onClose={() => setIsNotificationsOpen(false)}
        notifications={notifications}
        onMarkAsRead={(id) => markReadMutation(id)}
        onMarkAllAsRead={() => markAllReadMutation()}
      />
    </div>
  );
};
