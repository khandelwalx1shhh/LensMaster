/**
 * Admin security core — SERVER ONLY.
 *
 * Owns password hashing (Argon2id), session issuance/validation, brute-force
 * controls, adaptive challenges, CSRF, RBAC enforcement and audit/security
 * logging. Nothing in here may be imported from client code.
 */
import { argon2id, argon2Verify } from "hash-wasm";
import {
  getCookie,
  setCookie,
  deleteCookie,
  getRequestHeader,
  getRequestIP,
} from "@tanstack/react-start/server";
import { createServiceClient } from "@/lib/supabase-service.server";
import { permissionsForRole, type Permission } from "./permissions";

export const SESSION_COOKIE = "lm_admin_session";
export const CSRF_COOKIE = "lm_admin_csrf";
const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // absolute
const IDLE_TTL_MS = 60 * 60 * 1000; // idle timeout
const ATTEMPT_WINDOW_MIN = 15;
const ACCOUNT_LOCK_THRESHOLD = 10;
const ACCOUNT_LOCK_MINUTES = 15;
const IP_THRESHOLD = 25;
const CHALLENGE_THRESHOLD = 5;

type AnyClient = ReturnType<typeof createServiceClient>;

export function db(): AnyClient {
  return createServiceClient();
}

/* ------------------------------------------------------------------ crypto */

const enc = new TextEncoder();

export function randomToken(bytes = 32): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return Array.from(buf, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", enc.encode(value));
  return Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
}

export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return argon2id({
    password,
    salt,
    parallelism: 1,
    iterations: 3,
    memorySize: 19456,
    hashLength: 32,
    outputType: "encoded",
  });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    return await argon2Verify({ password, hash });
  } catch {
    return false;
  }
}

async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
}

function appSecret(): string {
  const s = process.env["SESSION_SECRET"];
  if (!s) throw new Error("ADMIN_SECURITY_UNAVAILABLE");
  return s;
}

/* ------------------------------------------------------------- request info */

export function requestIp(): string {
  try {
    return getRequestIP({ xForwardedFor: true }) ?? "unknown";
  } catch {
    return "unknown";
  }
}

export function requestUserAgent(): string {
  try {
    return (getRequestHeader("user-agent") ?? "").slice(0, 400);
  } catch {
    return "";
  }
}

export function deviceLabel(ua: string): string {
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /Chrome\//.test(ua)
      ? "Chrome"
      : /Safari\//.test(ua)
        ? "Safari"
        : /Firefox\//.test(ua)
          ? "Firefox"
          : "Browser";
  const os = /Android/.test(ua)
    ? "Android"
    : /iPhone|iPad/.test(ua)
      ? "iOS"
      : /Mac OS X/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "Unknown OS";
  return `${browser} · ${os}`;
}

/* ----------------------------------------------------------------- logging */

export async function logSecurityEvent(input: {
  adminUserId?: string | null;
  actorEmail?: string | null;
  event: string;
  result?: string;
  severity?: "info" | "warning" | "critical";
  resource?: string | null;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db()
      .from("admin_security_events")
      .insert({
        admin_user_id: input.adminUserId ?? null,
        actor_email: input.actorEmail ?? null,
        event: input.event,
        result: input.result ?? "success",
        severity: input.severity ?? "info",
        resource: input.resource ?? null,
        metadata: (input.metadata ?? {}) as never,
        ip: requestIp(),
        user_agent: requestUserAgent(),
      });
  } catch (e) {
    console.error("[admin-security] event log failed", e);
  }
}

export async function logAudit(input: {
  adminUserId?: string | null;
  actorEmail?: string | null;
  action: string;
  module: string;
  entityType?: string | null;
  entityId?: string | null;
  entityLabel?: string | null;
  previous?: unknown;
  next?: unknown;
}): Promise<void> {
  try {
    await db()
      .from("admin_audit_log")
      .insert({
        admin_user_id: input.adminUserId ?? null,
        actor_email: input.actorEmail ?? null,
        action: input.action,
        module: input.module,
        entity_type: input.entityType ?? null,
        entity_id: input.entityId ?? null,
        entity_label: input.entityLabel ?? null,
        previous_value: (input.previous ?? null) as never,
        new_value: (input.next ?? null) as never,
        ip: requestIp(),
      });
  } catch (e) {
    console.error("[admin-security] audit log failed", e);
  }
}

/* ----------------------------------------------------------- brute force */

function windowStart(): string {
  return new Date(Date.now() - ATTEMPT_WINDOW_MIN * 60_000).toISOString();
}

export async function recordAttempt(
  emailNormalized: string | null,
  success: boolean,
  reason: string,
): Promise<void> {
  try {
    await db().from("admin_login_attempts").insert({
      email_normalized: emailNormalized,
      ip: requestIp(),
      success,
      reason,
      user_agent: requestUserAgent(),
    });
  } catch (e) {
    console.error("[admin-security] attempt log failed", e);
  }
}

export async function recentFailures(emailNormalized: string | null): Promise<{
  byAccount: number;
  byIp: number;
}> {
  const client = db();
  const since = windowStart();
  const ip = requestIp();
  const [acct, byIp] = await Promise.all([
    emailNormalized
      ? client
          .from("admin_login_attempts")
          .select("id", { count: "exact", head: true })
          .eq("email_normalized", emailNormalized)
          .eq("success", false)
          .gte("created_at", since)
      : Promise.resolve({ count: 0 }),
    client
      .from("admin_login_attempts")
      .select("id", { count: "exact", head: true })
      .eq("ip", ip)
      .eq("success", false)
      .gte("created_at", since),
  ]);
  return { byAccount: acct.count ?? 0, byIp: byIp.count ?? 0 };
}

/** Progressive delay: kicks in from the 5th failure, capped so requests never hang. */
export async function progressiveDelay(failures: number): Promise<void> {
  if (failures < CHALLENGE_THRESHOLD) return;
  const ms = Math.min(2 ** (failures - CHALLENGE_THRESHOLD) * 400, 3000);
  await new Promise((r) => setTimeout(r, ms));
}

export const CHALLENGE_AFTER = CHALLENGE_THRESHOLD;
export const IP_BLOCK_AFTER = IP_THRESHOLD;
export const LOCK_AFTER = ACCOUNT_LOCK_THRESHOLD;
export const LOCK_MINUTES = ACCOUNT_LOCK_MINUTES;

/* ------------------------------------------------- adaptive bot challenge */

export interface Challenge {
  token: string;
  question: string;
}

/** Server-issued arithmetic challenge; the answer never leaves the server unsigned. */
export async function issueChallenge(): Promise<Challenge> {
  const a = 2 + Math.floor(Math.random() * 8);
  const b = 2 + Math.floor(Math.random() * 8);
  const answer = String(a + b);
  const exp = Date.now() + 5 * 60_000;
  const payload = `${exp}.${await sha256Hex(answer + appSecret())}`;
  const sig = await hmacHex(appSecret(), payload);
  return { token: `${payload}.${sig}`, question: `What is ${a} + ${b}?` };
}

export async function verifyChallenge(token: string, answer: string): Promise<boolean> {
  const parts = (token || "").split(".");
  if (parts.length !== 3) return false;
  const [exp, answerHash, sig] = parts as [string, string, string];
  const expected = await hmacHex(appSecret(), `${exp}.${answerHash}`);
  if (!timingSafeEqualHex(sig, expected)) return false;
  if (Number(exp) < Date.now()) return false;
  const given = await sha256Hex((answer || "").trim() + appSecret());
  return timingSafeEqualHex(given, answerHash);
}

/* ----------------------------------------------------------------- session */

export interface AdminSessionContext {
  userId: string;
  email: string;
  name: string;
  role: string;
  status: string;
  mfaEnabled: boolean;
  mfaRequired: boolean;
  mustChangePassword: boolean;
  permissions: Permission[];
  sessionId: string;
  mfaVerified: boolean;
  csrfToken: string;
}

export async function createSession(
  adminUserId: string,
  mfaVerified: boolean,
): Promise<{ csrfToken: string }> {
  const token = randomToken();
  const csrfToken = randomToken(24);
  const ua = requestUserAgent();
  await db()
    .from("admin_sessions")
    .insert({
      admin_user_id: adminUserId,
      token_hash: await sha256Hex(token),
      csrf_token_hash: await sha256Hex(csrfToken),
      mfa_verified: mfaVerified,
      ip: requestIp(),
      user_agent: ua,
      device_label: deviceLabel(ua),
      expires_at: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
    });

  // In production (HTTPS preview), use SameSite=None + Secure so the session
  // survives inside the embedded preview iframe (cross-site context).
  // In dev (localhost HTTP), Secure cookies are rejected by the browser, so
  // fall back to SameSite=Lax + no Secure.
  const isDev = process.env.NODE_ENV !== "production";
  const cookieOpts = isDev
    ? { httpOnly: true, secure: false, sameSite: "lax" as const, path: "/", maxAge: Math.floor(SESSION_TTL_MS / 1000) }
    : { httpOnly: true, secure: true, sameSite: "none" as const, path: "/", maxAge: Math.floor(SESSION_TTL_MS / 1000) };

  setCookie(SESSION_COOKIE, token, cookieOpts);
  // Double-submit CSRF cookie: readable by the admin UI, verified server-side
  // against the hash stored on the session row.
  setCookie(CSRF_COOKIE, csrfToken, { ...cookieOpts, httpOnly: false });
  return { csrfToken };
}

export async function destroyCurrentSession(): Promise<void> {
  const token = getCookie(SESSION_COOKIE);
  if (token) {
    await db()
      .from("admin_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("token_hash", await sha256Hex(token));
  }
  deleteCookie(SESSION_COOKIE, { path: "/" });
  deleteCookie(CSRF_COOKIE, { path: "/" });
}

/** Loads and validates the current admin session. Returns null when invalid. */
export async function getAdminContext(): Promise<AdminSessionContext | null> {
  let token: string | undefined;
  try {
    token = getCookie(SESSION_COOKIE);
  } catch {
    return null;
  }
  if (!token) return null;

  const client = db();
  const { data: session } = await client
    .from("admin_sessions")
    .select("*")
    .eq("token_hash", await sha256Hex(token))
    .maybeSingle();

  if (!session || session.revoked_at) return null;
  const now = Date.now();
  if (new Date(session.expires_at).getTime() < now) return null;
  if (now - new Date(session.last_active_at).getTime() > IDLE_TTL_MS) {
    await client
      .from("admin_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", session.id);
    return null;
  }

  const { data: user } = await client
    .from("admin_users")
    .select("*")
    .eq("id", session.admin_user_id)
    .maybeSingle();

  if (!user || user.status !== "ACTIVE") return null;
  if (user.locked_until && new Date(user.locked_until).getTime() > now) return null;

  await client
    .from("admin_sessions")
    .update({ last_active_at: new Date().toISOString() })
    .eq("id", session.id);

  return {
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    mfaEnabled: user.mfa_enabled,
    mfaRequired: user.mfa_required,
    mustChangePassword: user.must_change_password,
    permissions: permissionsForRole(user.role),
    sessionId: session.id,
    mfaVerified: session.mfa_verified,
    csrfToken: "",
  };
}

export class AdminAuthError extends Error {
  code: "UNAUTHORIZED" | "FORBIDDEN" | "MFA_REQUIRED";
  constructor(code: "UNAUTHORIZED" | "FORBIDDEN" | "MFA_REQUIRED") {
    super(code);
    this.code = code;
  }
}

/**
 * The single authorization gate for every admin server function.
 * Throws AdminAuthError; callers must not downgrade this to a UI check.
 */
export async function requireAdmin(permission?: Permission): Promise<AdminSessionContext> {
  const ctx = await getAdminContext();
  if (!ctx) throw new AdminAuthError("UNAUTHORIZED");
  if (ctx.mfaEnabled && !ctx.mfaVerified) throw new AdminAuthError("MFA_REQUIRED");
  if (permission && !ctx.permissions.includes(permission)) {
    await logSecurityEvent({
      adminUserId: ctx.userId,
      actorEmail: ctx.email,
      event: "authorization.denied",
      result: "denied",
      severity: "warning",
      resource: permission,
    });
    throw new AdminAuthError("FORBIDDEN");
  }
  return ctx;
}

/** CSRF double-submit check for state-changing operations. */
export async function requireCsrf(ctx: AdminSessionContext, csrfToken: string): Promise<void> {
  const { data } = await db()
    .from("admin_sessions")
    .select("csrf_token_hash")
    .eq("id", ctx.sessionId)
    .maybeSingle();
  const given = await sha256Hex(csrfToken || "");
  if (!data || !timingSafeEqualHex(given, data.csrf_token_hash)) {
    await logSecurityEvent({
      adminUserId: ctx.userId,
      actorEmail: ctx.email,
      event: "csrf.rejected",
      result: "denied",
      severity: "warning",
    });
    throw new AdminAuthError("FORBIDDEN");
  }
}

/* -------------------------------------------------------- password policy */

const COMMON_PASSWORDS = new Set([
  "password",
  "password1",
  "password123",
  "12345678",
  "123456789",
  "qwerty123",
  "letmein123",
  "admin1234",
  "welcome123",
  "iloveyou123",
  "lensmaster",
  "lensmaster123",
]);

export function validatePasswordStrength(
  password: string,
  email?: string,
): { ok: true } | { ok: false; message: string } {
  if (typeof password !== "string" || password.length < 12)
    return { ok: false, message: "Password must be at least 12 characters." };
  if (password.length > 200) return { ok: false, message: "Password is too long." };
  const lower = password.toLowerCase();
  if (COMMON_PASSWORDS.has(lower))
    return { ok: false, message: "That password is too common. Choose something unique." };
  if (email && lower.includes(email.split("@")[0]!.toLowerCase()))
    return { ok: false, message: "Password must not contain your email name." };
  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^A-Za-z0-9]/].filter((r) => r.test(password)).length;
  if (classes < 3)
    return {
      ok: false,
      message: "Use a mix of upper case, lower case, numbers or symbols.",
    };
  return { ok: true };
}

export function normalizeEmail(email: string): string {
  return String(email || "")
    .trim()
    .toLowerCase()
    .slice(0, 254);
}

/* --------------------------------------------------------------- bootstrap */

/**
 * Creates the first SUPER_ADMIN from server-side env when no admin exists.
 * Idempotent and never exposes the credential.
 */
export async function ensureBootstrapAdmin(): Promise<void> {
  const email = process.env["ADMIN_BOOTSTRAP_EMAIL"];
  const password = process.env["ADMIN_PASSWORD"];
  if (!email || !password) return;

  const client = db();
  const { count } = await client
    .from("admin_users")
    .select("id", { count: "exact", head: true });
  if ((count ?? 0) > 0) return;

  await client.from("admin_users").insert({
    email: email.trim(),
    email_normalized: normalizeEmail(email),
    name: "Owner",
    password_hash: await hashPassword(password),
    role: "SUPER_ADMIN",
    status: "ACTIVE",
    must_change_password: true,
  });
  await logSecurityEvent({
    actorEmail: email,
    event: "admin.bootstrap_created",
    severity: "critical",
  });
}
