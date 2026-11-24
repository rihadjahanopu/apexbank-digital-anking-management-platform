import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { uploadToCloudinary } from "@/lib/cloudinary";

// Max file size allowed: 10 MB
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export async function POST(req: Request) {
  try {
    // 1. Enforce authentication
    const { user, errorResponse } = await requireAuth(req);
    if (errorResponse || !user) return errorResponse;

    const contentType = req.headers.get("content-type") || "";

    let fileBufferOrDataUrl: Buffer | string | null = null;
    let targetFolder = "general";
    let resourceType: "image" | "raw" | "auto" = "auto";

    // 2. Handle multipart/form-data
    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file");
      const folderParam = formData.get("folder");

      if (folderParam && typeof folderParam === "string") {
        targetFolder = folderParam.replace(/[^a-zA-Z0-9_-]/g, "");
      }

      if (!file || !(file instanceof Blob)) {
        return NextResponse.json(
          { success: false, error: "No file provided in form data." },
          { status: 400 }
        );
      }

      if (file.size > MAX_FILE_SIZE_BYTES) {
        return NextResponse.json(
          { success: false, error: "File exceeds maximum allowed size of 10MB." },
          { status: 400 }
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      fileBufferOrDataUrl = Buffer.from(arrayBuffer);

      // If it's a PDF or non-image document, set resourceType to auto or raw
      if (file.type === "application/pdf") {
        resourceType = "auto";
      } else if (file.type.startsWith("image/")) {
        resourceType = "image";
      }
    }
    // 3. Handle JSON with base64 Data URL
    else if (contentType.includes("application/json")) {
      const body = await req.json();
      const { file, folder } = body;

      if (!file || typeof file !== "string") {
        return NextResponse.json(
          { success: false, error: "Invalid file data. Expected base64 string." },
          { status: 400 }
        );
      }

      if (folder && typeof folder === "string") {
        targetFolder = folder.replace(/[^a-zA-Z0-9_-]/g, "");
      }

      fileBufferOrDataUrl = file;
    } else {
      return NextResponse.json(
        {
          success: false,
          error: "Unsupported Content-Type. Please use multipart/form-data or application/json.",
        },
        { status: 415 }
      );
    }

    if (!fileBufferOrDataUrl) {
      return NextResponse.json(
        { success: false, error: "No file payload received." },
        { status: 400 }
      );
    }

    // 4. Upload to Cloudinary under the authenticated user namespace
    const result = await uploadToCloudinary(fileBufferOrDataUrl, {
      folder: targetFolder,
      resourceType,
    });

    return NextResponse.json({
      success: true,
      message: "File uploaded successfully to cloud storage.",
      url: result.secureUrl,
      publicId: result.publicId,
      format: result.format,
      bytes: result.bytes,
    });
  } catch (error: unknown) {
    console.error("Cloudinary upload route error:", error);
    const message = error instanceof Error ? error.message : "Failed to upload file to cloud";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
