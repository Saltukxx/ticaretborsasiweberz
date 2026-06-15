import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import type { Config } from "../../config.js";
import type { AccessTokenPayload, AdminRole } from "./auth.types.js";

export function hashToken(raw: string): string {
  return crypto.createHash("sha256").update(raw, "utf8").digest("hex");
}

export function signAccessToken(
  config: Config,
  adminId: string,
  role: AdminRole,
): string {
  const payload: AccessTokenPayload = {
    sub: adminId,
    role,
    typ: "access",
  };
  return jwt.sign(payload, config.jwtSecret, {
    algorithm: "HS256",
    expiresIn: config.jwtAccessTtl,
  });
}

export function verifyAccessToken(
  config: Config,
  token: string,
): AccessTokenPayload {
  const decoded = jwt.verify(token, config.jwtSecret, {
    algorithms: ["HS256"],
  });
  if (
    typeof decoded !== "object" ||
    decoded === null ||
    !("sub" in decoded) ||
    !("role" in decoded) ||
    !("typ" in decoded) ||
    decoded.typ !== "access"
  ) {
    throw new Error("INVALID_TOKEN");
  }
  const sub = (decoded as { sub: unknown }).sub;
  const role = (decoded as { role: unknown }).role;
  if (typeof sub !== "string" || (role !== "super_admin" && role !== "editor")) {
    throw new Error("INVALID_TOKEN");
  }
  return { sub, role, typ: "access" };
}

export function randomRefreshToken(): { raw: string; hash: string } {
  const raw = crypto.randomBytes(64).toString("base64url");
  return { raw, hash: hashToken(raw) };
}
