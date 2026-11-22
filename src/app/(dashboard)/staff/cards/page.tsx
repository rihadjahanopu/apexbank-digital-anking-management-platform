"use client";

import React, { useState } from "react";
import { CreditCard, Search } from "lucide-react";
import { toast } from "sonner";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  Badge,
  Button,
  Input,
  Select,
  EmptyState,
} from "@/components/ui";
import {
  useGetAllCardsQuery,
  useUpdateCardStatusMutation,
} from "@/redux/api/cardsApi";
import { ROLES, CARD_STATUS, CARD_NETWORKS, CardStatus } from "@/lib/constants";
import { formatCurrency } from "@/lib/money";
import { ICard, IUser, IBankAccount } from "@/types";

export default function StaffCardsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [networkFilter, setNetworkFilter] = useState("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useGetAllCardsQuery({
    search,
    status: statusFilter,
    network: networkFilter,
    page,
    limit: 15,
  });

  const [updateStatusMutation] = useUpdateCardStatusMutation();

  const cards = data?.cards || [];

  const handleStatusChange = async (cardId: string, newStatus: string) => {
    try {
      const res = await updateStatusMutation({
        id: cardId,
        status: newStatus as CardStatus,
        reason: "Branch Staff Operational Action",
      }).unwrap();
      toast.success(res.message);
    } catch (err: unknown) {
      const apiErr = err as { data?: { error?: string } };
      toast.error(apiErr.data?.error || "Status update failed");
    }
  };

  return (
    <DashboardLayout allowedRoles={[ROLES.STAFF, ROLES.ADMIN]}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Customer Card Registry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Search, inspect, and apply security freezes on customer payment cards.
          </p>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                placeholder="Search masked PAN or cardholder..."
                leftIcon={<Search className="h-4 w-4" />}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />

              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "ALL", label: "All Statuses" },
                  { value: CARD_STATUS.ACTIVE, label: "Active Cards" },
                  { value: CARD_STATUS.FROZEN, label: "Frozen Cards" },
                  { value: CARD_STATUS.BLOCKED, label: "Blocked Cards" },
                ]}
              />

              <Select
                value={networkFilter}
                onChange={(e) => {
                  setNetworkFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: "ALL", label: "All Networks" },
                  { value: CARD_NETWORKS.VISA, label: "Visa" },
                  { value: CARD_NETWORKS.MASTERCARD, label: "Mastercard" },
                ]}
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Loading cards...
              </div>
            ) : cards.length === 0 ? (
              <EmptyState
                icon={<CreditCard className="h-8 w-8 text-indigo-500" />}
                title="No payment cards found"
                description="No issued cards match your search parameters."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Card Number</TableHead>
                    <TableHead>Cardholder</TableHead>
                    <TableHead>Account</TableHead>
                    <TableHead>Network</TableHead>
                    <TableHead>Expiry</TableHead>
                    <TableHead>Daily Limit</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cards.map((c: ICard) => {
                    const user = c.userId as IUser;
                    const account = c.accountId as IBankAccount;
                    return (
                      <TableRow key={c._id}>
                        <TableCell className="font-mono font-semibold text-xs text-slate-900 dark:text-slate-100">
                          {c.maskedCardNumber}
                        </TableCell>
                        <TableCell className="text-xs">
                          <p className="font-medium text-slate-900 dark:text-slate-100">
                            {user?.name || "Customer"}
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {user?.email}
                          </p>
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-500">
                          {account?.accountNumber || "N/A"}
                        </TableCell>
                        <TableCell className="text-xs font-bold text-slate-600 dark:text-slate-300">
                          {c.network}
                        </TableCell>
                        <TableCell className="text-xs font-mono text-slate-500">
                          {String(c.expiryMonth).padStart(2, "0")}/
                          {String(c.expiryYear).slice(-2)}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-indigo-500">
                          {formatCurrency(c.dailyOnlineLimit)}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              c.status === CARD_STATUS.ACTIVE
                                ? "success"
                                : c.status === CARD_STATUS.FROZEN
                                ? "warning"
                                : "danger"
                            }
                            size="sm"
                            dot
                          >
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {c.status === CARD_STATUS.ACTIVE ? (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() =>
                                  handleStatusChange(c._id, CARD_STATUS.FROZEN)
                                }
                              >
                                Freeze
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="primary"
                                onClick={() =>
                                  handleStatusChange(c._id, CARD_STATUS.ACTIVE)
                                }
                              >
                                Unfreeze
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
