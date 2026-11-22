"use client";

import React from "react";
import { AccountClosuresReviewView } from "@/components/accounts/AccountClosuresReviewView";
import { ROLES } from "@/lib/constants";

export default function AdminAccountClosuresPage() {
  return (
    <AccountClosuresReviewView
      allowedRoles={[ROLES.ADMIN]}
      pageTitle="Depository Account Closures"
    />
  );
}
