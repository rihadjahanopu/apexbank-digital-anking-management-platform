import { NextResponse } from "next/server";
import { connectToDatabase } from "@/lib/db";
import { requireAuth } from "@/lib/auth";
import { AuditLog } from "@/models/AuditLog";
import { KYC_DOCUMENT_TYPES, KYC_STATUS } from "@/lib/constants";

export async function POST(req: Request) {
  try {
    await connectToDatabase();
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const body = await req.json();
    const { docType, docNumber, docUrl } = body;

    if (!docType || !Object.values(KYC_DOCUMENT_TYPES).includes(docType)) {
      return NextResponse.json(
        { success: false, error: "Invalid document type." },
        { status: 400 }
      );
    }

    if (!docNumber || !docUrl) {
      return NextResponse.json(
        { success: false, error: "Document number and scan image are required." },
        { status: 400 }
      );
    }

    // Check if document of this type already submitted
    const existingIndex = user.kycDocuments.findIndex(
      (d) => d.docType === docType
    );

    if (existingIndex >= 0) {
      // Update existing if not approved
      if (user.kycDocuments[existingIndex].status === KYC_STATUS.APPROVED) {
        return NextResponse.json(
          {
            success: false,
            error: "This document type is already verified and approved.",
          },
          { status: 400 }
        );
      }
      user.kycDocuments[existingIndex].docNumber = docNumber;
      user.kycDocuments[existingIndex].docUrl = docUrl;
      user.kycDocuments[existingIndex].status = KYC_STATUS.PENDING;
      user.kycDocuments[existingIndex].submittedAt = new Date();
      user.kycDocuments[existingIndex].remarks = undefined;
    } else {
      user.kycDocuments.push({
        docType,
        docNumber,
        docUrl,
        status: KYC_STATUS.PENDING,
        submittedAt: new Date(),
      });
    }

    await user.save();

    await AuditLog.create({
      userId: user._id,
      userRole: user.role,
      action: "KYC_DOCUMENT_SUBMITTED",
      category: "CUSTOMER",
      details: { docType, docNumber },
    });

    return NextResponse.json({
      success: true,
      message: `${docType.replace("_", " ")} submitted successfully for compliance verification!`,
      kycDocuments: user.kycDocuments,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to submit KYC document";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
