import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { connectToDatabase } from "./db";
import { User, IUserDocument } from "@/models/User";
import { UserRole, USER_STATUS } from "./constants";

const JWT_SECRET =
  process.env.JWT_SECRET || "apex_digital_banking_super_secret_jwt_key_2026";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
}

/**
 * Signs a JWT token with user claims.
 */
export function signToken(payload: TokenPayload): string {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN as any });
}

/**
 * Verifies a JWT token and returns the decoded payload.
 */
export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}

/**
 * Hashes a plaintext password using bcrypt.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

/**
 * Compares plaintext password against a bcrypt hash.
 */
export async function comparePassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Extracts and verifies the authenticated user from the Request headers or cookies.
 */
export async function getUserFromRequest(
  req: Request
): Promise<IUserDocument | null> {
  await connectToDatabase();

  let token: string | undefined;

  // 1. Try Authorization header (Bearer token)
  const authHeader = req.headers.get("authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    token = authHeader.split(" ")[1];
  }

  // 2. Try cookie
  if (!token) {
    try {
      const cookieStore = await cookies();
      token = cookieStore.get("auth_token")?.value;
    } catch {
      // Ignore if called outside server request context
    }
  }

  if (!token) {
    return null;
  }

  const payload = verifyToken(token);
  if (!payload || !payload.userId) {
    return null;
  }

  const user = await User.findById(payload.userId);
  if (!user || user.status !== USER_STATUS.ACTIVE) {
    return null;
  }

  return user;
}

/**
 * Server-side Route Authorization Helper
 * Validates user authentication and enforces role permissions.
 */
export async function requireAuth(
  req: Request,
  allowedRoles?: UserRole[]
): Promise<{ user: IUserDocument | null; errorResponse?: Response }> {
  const user = await getUserFromRequest(req);

  if (!user) {
    return {
      user: null,
      errorResponse: Response.json(
        {
          success: false,
          error: "Unauthorized: Please log in to access this resource.",
        },
        { status: 401 }
      ),
    };
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return {
      user: null,
      errorResponse: Response.json(
        {
          success: false,
          error: "Forbidden: You do not have permission to perform this action.",
        },
        { status: 403 }
      ),
    };
  }

  return { user };
}
