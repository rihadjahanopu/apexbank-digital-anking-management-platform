import { v2 as cloudinary } from "cloudinary";

// Initialize Cloudinary with environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export { cloudinary };

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
  format?: string;
  bytes?: number;
  width?: number;
  height?: number;
  resourceType?: string;
}

export interface UploadOptions {
  folder?: string;
  publicId?: string;
  resourceType?: "image" | "raw" | "auto" | "video";
  transformation?: Record<string, unknown>[];
}

/**
 * Uploads a file (Buffer or Base64 Data URL) to Cloudinary.
 *
 * Automatically places files into an organized subfolder inside 'apex-bank/'.
 */
export async function uploadToCloudinary(
  file: Buffer | string,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const targetFolder = options.folder ? `apex-bank/${options.folder}` : "apex-bank";

  // If input is a Base64 string or remote URL
  if (typeof file === "string") {
    const result = await cloudinary.uploader.upload(file, {
      folder: targetFolder,
      public_id: options.publicId,
      resource_type: options.resourceType || "auto",
      transformation: options.transformation,
    });

    return {
      secureUrl: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      bytes: result.bytes,
      width: result.width,
      height: result.height,
      resourceType: result.resource_type,
    };
  }

  // If input is a raw Buffer (e.g. from multipart FormData)
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: targetFolder,
        public_id: options.publicId,
        resource_type: options.resourceType || "auto",
        transformation: options.transformation,
      },
      (error, result) => {
        if (error || !result) {
          reject(error || new Error("Cloudinary upload failed with empty result."));
        } else {
          resolve({
            secureUrl: result.secure_url,
            publicId: result.public_id,
            format: result.format,
            bytes: result.bytes,
            width: result.width,
            height: result.height,
            resourceType: result.resource_type,
          });
        }
      }
    );

    uploadStream.end(file);
  });
}

/**
 * Deletes an asset from Cloudinary by its public ID.
 */
export async function deleteFromCloudinary(
  publicId: string,
  resourceType: "image" | "raw" | "video" = "image"
): Promise<{ result: string }> {
  return await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType,
  });
}
