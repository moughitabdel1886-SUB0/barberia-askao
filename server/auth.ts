import { createHash, randomBytes, scrypt, timingSafeEqual, type ScryptOptions } from "node:crypto";
import { and, count, eq, gt, lt } from "drizzle-orm";
import type { Request } from "express";
import { adminSessions, adminUsers } from "../drizzle/schema";
import { getDb } from "./db";

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scrypt(password, salt, keylen, options, (error, derivedKey) => {
      if (error) reject(error);
      else resolve(derivedKey);
    });
  });
}

export const ADMIN_COOKIE = "askao_admin";
export const ADMIN_TOKEN_HEADER = "x-admin-token";
export const CSRF_HEADER = "x-askao-csrf";
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;

export type AdminPublic = {
  id: number;
  email: string;
  name: string;
};

/* -------------------------------------------------------------------------- */
/*                                 Passwords                                  */
/* -------------------------------------------------------------------------- */

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scryptAsync(password.normalize("NFKC"), salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: 64 * 1024 * 1024,
  });

  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  try {
    const [scheme, n, r, p, saltHex, hashHex] = stored.split("$");
    if (scheme !== "scrypt" || !saltHex || !hashHex) return false;

    const expected = Buffer.from(hashHex, "hex");
    const derived = await scryptAsync(password.normalize("NFKC"), Buffer.from(saltHex, "hex"), expected.length, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: 64 * 1024 * 1024,
    });

    return derived.length === expected.length && timingSafeEqual(derived, expected);
  } catch {
    return false;
  }
}

export function validatePassword(password: string): string | null {
  if (typeof password !== "string") return "La contraseña no es válida.";
  if (password.length < 10) return "La contraseña debe tener al menos 10 caracteres.";
  if (password.length > 200) return "La contraseña es demasiado larga.";
  return null;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/* -------------------------------------------------------------------------- */
/*                                  Sessions                                  */
/* -------------------------------------------------------------------------- */

function sessionId(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(adminId: number): Promise<{ token: string; expiresAt: Date }> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db.insert(adminSessions).values({ id: sessionId(token), adminId, expiresAt });

  // Opportunistic cleanup of expired sessions.
  await db.delete(adminSessions).where(lt(adminSessions.expiresAt, new Date()));

  return { token, expiresAt };
}

export async function getSessionAdmin(token: string | undefined | null): Promise<AdminPublic | null> {
  if (!token || token.length < 20 || token.length > 200) return null;

  const db = await getDb();
  if (!db) return null;

  const rows = await db
    .select({
      id: adminUsers.id,
      email: adminUsers.email,
      name: adminUsers.name,
    })
    .from(adminSessions)
    .innerJoin(adminUsers, eq(adminSessions.adminId, adminUsers.id))
    .where(and(eq(adminSessions.id, sessionId(token)), gt(adminSessions.expiresAt, new Date())))
    .limit(1);

  return rows[0] ?? null;
}

export function readAdminToken(req: Request): string | undefined {
  const header = req.headers[ADMIN_TOKEN_HEADER];
  if (typeof header === "string" && header.trim()) return header.trim();

  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;

  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (name === ADMIN_COOKIE) {
      try {
        return decodeURIComponent(rest.join("="));
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

export async function getRequestAdmin(req: Request): Promise<AdminPublic | null> {
  return getSessionAdmin(readAdminToken(req));
}

export async function revokeSession(token: string | undefined): Promise<void> {
  if (!token) return;
  const db = await getDb();
  if (!db) return;
  await db.delete(adminSessions).where(eq(adminSessions.id, sessionId(token)));
}

export async function revokeAllSessions(adminId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.delete(adminSessions).where(eq(adminSessions.adminId, adminId));
}

/* -------------------------------------------------------------------------- */
/*                                   Accounts                                 */
/* -------------------------------------------------------------------------- */

export async function countAdmins(): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db.select({ value: count() }).from(adminUsers);
  return Number(row?.value ?? 0);
}

export async function findAdminByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const rows = await db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, normalizeEmail(email)))
    .limit(1);
  return rows[0];
}

export async function createAdmin(input: {
  email: string;
  password: string;
  name?: string;
}): Promise<AdminPublic> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const email = normalizeEmail(input.email);
  const passwordHash = await hashPassword(input.password);

  try {
    const result = await db.insert(adminUsers).values({
      email,
      passwordHash,
      name: input.name?.trim() || "Barbería Askao",
    });

    const id = Number((result as unknown as [{ insertId: number }])[0]?.insertId);
    if (!id) throw new Error("Admin insert failed");

    return { id, email, name: input.name?.trim() || "Barbería Askao" };
  } catch (error) {
    if (String(error).includes("Duplicate")) {
      throw new Error("Ya existe una cuenta con ese email.");
    }
    throw error;
  }
}

export async function authenticate(email: string, password: string): Promise<AdminPublic | null> {
  const admin = await findAdminByEmail(email);
  if (!admin) {
    // Keep a comparable timing profile when the email does not exist.
    await verifyPassword(password, "scrypt$16384$8$1$00000000000000000000000000000000$" + "0".repeat(128));
    return null;
  }

  const ok = await verifyPassword(password, admin.passwordHash);
  if (!ok) return null;

  const db = await getDb();
  if (db) {
    await db.update(adminUsers).set({ lastLoginAt: new Date() }).where(eq(adminUsers.id, admin.id));
  }

  return { id: admin.id, email: admin.email, name: admin.name };
}

export async function updatePassword(adminId: number, currentPassword: string, nextPassword: string): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const [admin] = await db.select().from(adminUsers).where(eq(adminUsers.id, adminId)).limit(1);
  if (!admin) return false;
  if (!(await verifyPassword(currentPassword, admin.passwordHash))) return false;

  const passwordHash = await hashPassword(nextPassword);
  await db.update(adminUsers).set({ passwordHash }).where(eq(adminUsers.id, adminId));
  await revokeAllSessions(adminId);
  return true;
}

/** Optional production seeding: only creates an account when none exists. */
export async function seedAdminFromEnv(): Promise<void> {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return;
  if (validatePassword(password)) return;
  if ((await countAdmins()) > 0) return;

  await createAdmin({ email, password });
  console.log(`[auth] Admin inicial creado para ${normalizeEmail(email)}`);
}

/* -------------------------------------------------------------------------- */
/*                              First-run setup                               */
/* -------------------------------------------------------------------------- */

/**
 * The public setup form must not let the first visitor claim the business
 * account. The owner either seeds an account with ADMIN_EMAIL/ADMIN_PASSWORD,
 * sets ADMIN_SETUP_TOKEN, or reads the random token from the server logs.
 */
const SETUP_TOKEN =
  process.env.ADMIN_SETUP_TOKEN?.trim() || randomBytes(18).toString("base64url");

export function verifySetupToken(value: string): boolean {
  const actual = value.trim();
  if (!actual || actual.length !== SETUP_TOKEN.length) return false;
  return timingSafeEqual(Buffer.from(actual), Buffer.from(SETUP_TOKEN));
}

export function getSetupTokenForLog(): string {
  return SETUP_TOKEN;
}
