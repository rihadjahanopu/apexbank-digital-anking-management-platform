"use client";

import React from "react";
import { CardRequestsReviewView } from "@/components/cards/CardRequestsReviewView";
import { ROLES } from "@/lib/constants";

export default function AdminCardRequestsPage() {
  return (
    <CardRequestsReviewView
      allowedRoles={[ROLES.ADMIN]}
      pageTitle="Card Requests Oversight"
    />
  );
}
