import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { User } from "@/models/User";
import { AuditLog } from "@/models/AuditLog";
import { ROLES, KYC_STATUS } from "@/lib/constants";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = await requireAuth(req, [ROLES.ADMIN, ROLES.STAFF]);
    if (errorResponse || !authUser) return errorResponse;

    const { id: customerUserId } = await params;

    const body = await req.json();
    const { docId, status, remarks } = body;

    if (!docId || !status || !Object.values(KYC_STATUS).includes(status)) {
      return NextResponse.json(
        { success: false, error: "Valid docId and status are required." },
        { status: 400 }
      );
    }

    const user = await User.findById(customerUserId);
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Customer not found." },
        { status: 404 }
      );
    }

    const doc = user.kycDocuments.find(
      (d) => d._id?.toString() === docId || (d as unknown as { id: string }).id === docId
    );

    if (!doc) {
      return NextResponse.json(
        { success: false, error: "Specified KYC document not found." },
        { status: 404 }
      );
    }

    doc.status = status;
    doc.reviewedAt = new Date();
    doc.reviewedBy = new mongoose.Types.ObjectId(authUser._id.toString());
    if (remarks) doc.remarks = remarks;

    // Check if customer now qualifies for full verified status
    // Rule: At least one approved government identity document
    const hasApprovedGovId = user.kycDocuments.some(
      (d) =>
        d.status === KYC_STATUS.APPROVED &&
        (d.docType === "NATIONAL_ID" || d.docType === "PASSPORT" || d.docType === "DRIVING_LICENSE")
    );

    user.isVerified = hasApprovedGovId;
    await user.save();

    await AuditLog.create({
      userId: authUser._id,
      userRole: authUser.role,
      action: `KYC_DOCUMENT_${status}`,
      category: "CUSTOMER",
      details: {
        customerUserId: user._id,
        docType: doc.docType,
        status,
        remarks,
        customerNowVerified: user.isVerified,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Document has been marked as ${status}. Customer verification status: ${
        user.isVerified ? "VERIFIED" : "PENDING"
      }`,
      user: {
        _id: user._id,
        name: user.name,
        isVerified: user.isVerified,
        kycDocuments: user.kycDocuments,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to review KYC";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
