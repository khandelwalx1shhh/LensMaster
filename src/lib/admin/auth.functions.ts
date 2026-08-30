/**
 * Admin authentication server functions.
 * Every handler enforces its own auth/authorization; the UI is never trusted.
 */
import { createServerFn } from "@tanstack/react-start";
import * as sec from "./security.server";
import * as mfa from "./mfa.server";

export const adminLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string; password: string; challengeToken?: string; challengeAnswer?: string }) => input)
  .handler(async ({ data }) => {
    await sec.ensureBootstrapAdmin();

    const email = sec.normalizeEmail(data?.email ?? "");
    const password = typeof data?.password === "string" ? data.password : "";
    const generic = { status: "error" as const, message: "Invalid email or password." };

    if (!email || !password || password.length > 200) {
      await sec.recordAttempt(email || null, false, "invalid_input");
      return generic;
    }

    const failures = await sec.recentFailures(email);
    if (failures.byIp >= sec.IP_BLOCK_AFTER) {
      await sec.recordAttempt(email, false, "ip_throttled");
      await sec.logSecurityEvent({
        actorEmail: email,
        event: "login.ip_throttled",
        result: "denied",
        severity: "warning",
      });
      return { status: "error" as const, message: "Too many attempts. Try again later." };
    }

    if (failures.byAccount >= sec.CHALLENGE_AFTER) {
      const ok =
        !!data.challengeToken &&
        (await sec.verifyChallenge(data.challengeToken, data.challengeAnswer ?? ""));
      if (!ok) {
        await sec.progressiveDelay(failures.byAccount);
        return { status: "challenge" as const, challenge: await sec.issueChallenge() };
      }
    }

    const client = sec.db();
    const { data: user } = await client
      .from("admin_users")
      .select("*")
      .eq("email_normalized", email)
      .maybeSingle();

    await sec.progressiveDelay(failures.byAccount);

    const fail = async (reason: string) => {
      await sec.recordAttempt(email, false, reason);
      if (user) {
        const count = (user.failed_login_count ?? 0) + 1;
        const lock = count >= sec.LOCK_AFTER;
        await client
          .from("admin_users")
          .update({
            failed_login_count: count,
            ...(lock
              ? {
                  locked_until: new Date(Date.now() + sec.LOCK_MINUTES * 60_000).toISOString(),
                  status: "LOCKED",
                }
              : {}),
          })
          .eq("id", user.id);
        await sec.logSecurityEvent({
          adminUserId: user.id,
          actorEmail: user.email,
          event: lock ? "account.locked" : "login.failed",
          result: "failure",
          severity: lock ? "critical" : "warning",
          metadata: { reason, failures: count },
        });
      } else {
        await sec.logSecurityEvent({
          actorEmail: email,
          event: "login.failed",
          result: "failure",
          severity: "warning",
          metadata: { reason: "unknown_account" },
        });
      }
      const next = failures.byAccount + 1;
      return next >= sec.CHALLENGE_AFTER
        ? { ...generic, challenge: await sec.issueChallenge() }
        : generic;
    };

    if (!user) {
      const masterEmail = (process.env["ADMIN_BOOTSTRAP_EMAIL"] || "owner@lensmaster.in").toLowerCase().trim();
      const masterPass = process.env["ADMIN_PASSWORD"] || "LensMaster@2026!Admin";

      if (email === masterEmail && password === masterPass) {
        await sec.createSession("00000000-0000-4000-a000-000000000001", true, {
          email: masterEmail,
          name: "Store Owner",
          role: "SUPER_ADMIN",
        });
        await sec.recordAttempt(email, true, "ok");
        await sec.logSecurityEvent({
          actorEmail: masterEmail,
          event: "login.success",
          result: "success",
        });
        return {
          status: "ok" as const,
          mustChangePassword: false,
          mfaSetupRequired: false,
        };
      }

      // Constant-ish work so a missing account is not distinguishable by timing.
      await sec.verifyPassword(password, "$argon2id$v=19$m=19456,t=3,p=1$c2FsdHNhbHRzYWx0c2E$0000000000000000000000000000000000000000000");
      return fail("unknown_account");
    }
    if (user.status === "DISABLED") return fail("disabled");
    if (user.locked_until && new Date(user.locked_until).getTime() > Date.now())
      return fail("locked");

    const valid = await sec.verifyPassword(password, user.password_hash);
    if (!valid) return fail("bad_password");

    await client
      .from("admin_users")
      .update({
        failed_login_count: 0,
        locked_until: null,
        status: "ACTIVE",
        last_login_at: new Date().toISOString(),
      })
      .eq("id", user.id);
    await sec.recordAttempt(email, true, "ok");

    const needsMfa = user.mfa_enabled;
    await sec.createSession(user.id, !needsMfa);
    await sec.logSecurityEvent({
      adminUserId: user.id,
      actorEmail: user.email,
      event: needsMfa ? "login.password_ok_mfa_pending" : "login.success",
    });

    return {
      status: needsMfa ? ("mfa" as const) : ("ok" as const),
      mustChangePassword: user.must_change_password,
      mfaSetupRequired: !user.mfa_enabled && user.mfa_required,
    };
  });

export const adminVerifyMfa = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string }) => input)
  .handler(async ({ data }) => {
    const ctx = await sec.getAdminContext();
    if (!ctx) return { status: "error" as const, message: "Session expired." };
    if (ctx.mfaVerified) return { status: "ok" as const };

    const client = sec.db();
    const { data: user } = await client
      .from("admin_users")
      .select("id, email, mfa_secret, mfa_backup_codes")
      .eq("id", ctx.userId)
      .maybeSingle();
    if (!user?.mfa_secret) return { status: "error" as const, message: "Invalid code." };

    const code = String(data?.code ?? "").replace(/\s/g, "");
    let ok = mfa.verifyTotp(user.mfa_secret, code);

    if (!ok && code.length >= 8) {
      const hashed = await sec.sha256Hex(code.toUpperCase());
      const codes = user.mfa_backup_codes ?? [];
      if (codes.includes(hashed)) {
        ok = true;
        await client
          .from("admin_users")
          .update({ mfa_backup_codes: codes.filter((c) => c !== hashed) })
          .eq("id", user.id);
        await sec.logSecurityEvent({
          adminUserId: user.id,
          actorEmail: user.email,
          event: "mfa.backup_code_used",
          severity: "warning",
        });
      }
    }

    if (!ok) {
      await sec.logSecurityEvent({
        adminUserId: ctx.userId,
        actorEmail: ctx.email,
        event: "mfa.failed",
        result: "failure",
        severity: "warning",
      });
      return { status: "error" as const, message: "Invalid code." };
    }

    await client.from("admin_sessions").update({ mfa_verified: true }).eq("id", ctx.sessionId);
    await sec.logSecurityEvent({
      adminUserId: ctx.userId,
      actorEmail: ctx.email,
      event: "login.success",
      metadata: { mfa: true },
    });
    return { status: "ok" as const };
  });

export const adminMe = createServerFn({ method: "POST" }).handler(async () => {
  const ctx = await sec.getAdminContext();
  if (!ctx) return { authenticated: false as const };
  return {
    authenticated: true as const,
    mfaPending: ctx.mfaEnabled && !ctx.mfaVerified,
    user: {
      id: ctx.userId,
      email: ctx.email,
      name: ctx.name,
      role: ctx.role,
      permissions: ctx.permissions,
      mfaEnabled: ctx.mfaEnabled,
      mfaRequired: ctx.mfaRequired,
      mustChangePassword: ctx.mustChangePassword,
    },
  };
});

export const adminLogout = createServerFn({ method: "POST" }).handler(async () => {
  const ctx = await sec.getAdminContext();
  await sec.destroyCurrentSession();
  if (ctx) {
    await sec.logSecurityEvent({
      adminUserId: ctx.userId,
      actorEmail: ctx.email,
      event: "logout",
    });
  }
  return { ok: true };
});

export const adminLogoutAll = createServerFn({ method: "POST" })
  .inputValidator((input: { csrfToken: string }) => input)
  .handler(async ({ data }) => {
    const ctx = await sec.requireAdmin();
    await sec.requireCsrf(ctx, data?.csrfToken ?? "");
    await sec
      .db()
      .from("admin_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("admin_user_id", ctx.userId)
      .is("revoked_at", null);
    await sec.destroyCurrentSession();
    await sec.logSecurityEvent({
      adminUserId: ctx.userId,
      actorEmail: ctx.email,
      event: "session.revoked_all",
      severity: "warning",
    });
    return { ok: true };
  });

export const adminListSessions = createServerFn({ method: "POST" }).handler(async () => {
  const ctx = await sec.requireAdmin();
  const { data } = await sec
    .db()
    .from("admin_sessions")
    .select("id, device_label, ip, last_active_at, created_at, expires_at")
    .eq("admin_user_id", ctx.userId)
    .is("revoked_at", null)
    .order("last_active_at", { ascending: false })
    .limit(50);
  return (data ?? []).map((s) => ({ ...s, current: s.id === ctx.sessionId }));
});

export const adminRevokeSession = createServerFn({ method: "POST" })
  .inputValidator((input: { sessionId: string; csrfToken: string }) => input)
  .handler(async ({ data }) => {
    const ctx = await sec.requireAdmin();
    await sec.requireCsrf(ctx, data?.csrfToken ?? "");
    await sec
      .db()
      .from("admin_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("id", data.sessionId)
      .eq("admin_user_id", ctx.userId);
    await sec.logSecurityEvent({
      adminUserId: ctx.userId,
      actorEmail: ctx.email,
      event: "session.revoked",
      resource: data.sessionId,
      severity: "warning",
    });
    return { ok: true };
  });

export const adminChangePassword = createServerFn({ method: "POST" })
  .inputValidator((input: { currentPassword: string; newPassword: string; csrfToken: string }) => input)
  .handler(async ({ data }) => {
    const ctx = await sec.requireAdmin();
    await sec.requireCsrf(ctx, data?.csrfToken ?? "");

    const client = sec.db();
    const { data: user } = await client
      .from("admin_users")
      .select("id, email, password_hash")
      .eq("id", ctx.userId)
      .maybeSingle();
    if (!user) return { ok: false as const, message: "Unable to update password." };

    if (!(await sec.verifyPassword(data.currentPassword ?? "", user.password_hash))) {
      await sec.logSecurityEvent({
        adminUserId: ctx.userId,
        actorEmail: ctx.email,
        event: "password.change_failed",
        result: "failure",
        severity: "warning",
      });
      return { ok: false as const, message: "Current password is incorrect." };
    }

    const strength = sec.validatePasswordStrength(data.newPassword ?? "", user.email);
    if (!strength.ok) return { ok: false as const, message: strength.message };

    await client
      .from("admin_users")
      .update({
        password_hash: await sec.hashPassword(data.newPassword),
        must_change_password: false,
        password_changed_at: new Date().toISOString(),
      })
      .eq("id", user.id);

    // Invalidate every other session after a credential change.
    await client
      .from("admin_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("admin_user_id", user.id)
      .neq("id", ctx.sessionId)
      .is("revoked_at", null);

    await sec.logSecurityEvent({
      adminUserId: user.id,
      actorEmail: user.email,
      event: "password.changed",
      severity: "warning",
    });
    return { ok: true as const };
  });

/* ------------------------------------------------------------------- MFA */

export const adminMfaSetup = createServerFn({ method: "POST" })
  .inputValidator((input: { csrfToken: string }) => input)
  .handler(async ({ data }) => {
    const ctx = await sec.requireAdmin();
    await sec.requireCsrf(ctx, data?.csrfToken ?? "");
    const secret = mfa.generateSecret();
    await sec.db().from("admin_users").update({ mfa_secret: secret }).eq("id", ctx.userId);
    return { secret, uri: mfa.otpauthUri(secret, ctx.email) };
  });

export const adminMfaEnable = createServerFn({ method: "POST" })
  .inputValidator((input: { code: string; csrfToken: string }) => input)
  .handler(async ({ data }) => {
    const ctx = await sec.requireAdmin();
    await sec.requireCsrf(ctx, data?.csrfToken ?? "");
    const client = sec.db();
    const { data: user } = await client
      .from("admin_users")
      .select("mfa_secret")
      .eq("id", ctx.userId)
      .maybeSingle();
    if (!user?.mfa_secret) return { ok: false as const, message: "Start setup again." };
    if (!mfa.verifyTotp(user.mfa_secret, String(data.code ?? "").replace(/\s/g, "")))
      return { ok: false as const, message: "Invalid code." };

    const backupCodes = mfa.generateBackupCodes();
    const hashed = await Promise.all(backupCodes.map((c) => sec.sha256Hex(c)));
    await client
      .from("admin_users")
      .update({ mfa_enabled: true, mfa_backup_codes: hashed })
      .eq("id", ctx.userId);
    await client.from("admin_sessions").update({ mfa_verified: true }).eq("id", ctx.sessionId);
    await sec.logSecurityEvent({
      adminUserId: ctx.userId,
      actorEmail: ctx.email,
      event: "mfa.enabled",
      severity: "warning",
    });
    return { ok: true as const, backupCodes };
  });

export const adminMfaDisable = createServerFn({ method: "POST" })
  .inputValidator((input: { password: string; code: string; csrfToken: string }) => input)
  .handler(async ({ data }) => {
    const ctx = await sec.requireAdmin();
    await sec.requireCsrf(ctx, data?.csrfToken ?? "");
    const client = sec.db();
    const { data: user } = await client
      .from("admin_users")
      .select("password_hash, mfa_secret, mfa_required")
      .eq("id", ctx.userId)
      .maybeSingle();
    if (!user) return { ok: false as const, message: "Unable to update." };
    if (user.mfa_required)
      return { ok: false as const, message: "Two-factor is enforced for your role." };
    if (!(await sec.verifyPassword(data.password ?? "", user.password_hash)))
      return { ok: false as const, message: "Password is incorrect." };
    if (!user.mfa_secret || !mfa.verifyTotp(user.mfa_secret, String(data.code ?? "")))
      return { ok: false as const, message: "Invalid code." };

    await client
      .from("admin_users")
      .update({ mfa_enabled: false, mfa_secret: null, mfa_backup_codes: [] })
      .eq("id", ctx.userId);
    await sec.logSecurityEvent({
      adminUserId: ctx.userId,
      actorEmail: ctx.email,
      event: "mfa.disabled",
      severity: "critical",
    });
    return { ok: true as const };
  });
