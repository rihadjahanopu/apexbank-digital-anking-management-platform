"use client";

import React from "react";
import { CardRequestsReviewView } from "@/components/cards/CardRequestsReviewView";
import { ROLES } from "@/lib/constants";

export default function StaffCardRequestsPage() {
  return (
    <CardRequestsReviewView
      allowedRoles={[ROLES.STAFF, ROLES.ADMIN]}
      pageTitle="Customer Card Requests Desk"
    />
  );
}
