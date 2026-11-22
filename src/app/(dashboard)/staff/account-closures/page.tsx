"use client";

import React from "react";
import { AccountClosuresReviewView } from "@/components/accounts/AccountClosuresReviewView";
import { ROLES } from "@/lib/constants";

export default function StaffAccountClosuresPage() {
  return (
    <AccountClosuresReviewView
      allowedRoles={[ROLES.STAFF, ROLES.ADMIN]}
      pageTitle="Account Closure Review Queue"
    />
  );
}
