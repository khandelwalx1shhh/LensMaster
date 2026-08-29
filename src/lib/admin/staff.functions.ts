/**
 * Staff management, security log and activity audit server functions.
 * Sensitive mutations require permission + CSRF + password re-authentication.
 */
import { createServerFn } from "@tanstack/react-start";
import * as sec from "./security.server";
import { ADMIN_ROLES } from "./permissions";
import type { Database } from "@/integrations/supabase/types";

type StaffUpdate = Database["public"]["Tables"]["admin_users"]["Update"];

function isRole(value: unknown): value is (typeof ADMIN_ROLES)[number] {
  return typeof value === "string" && (ADMIN_ROLES as readonly string[]).includes(value);
}

export const listStaff = createServerFn({ method: "POST" }).handler(async () => {
  await sec.requireAdmin("staff.view");
  const { data } = await sec
    .db()
    .from("admin_users")
    .select(
      "id, email, name, role, status, mfa_enabled, mfa_required, last_login_at, locked_until, created_at",
    )
    .order("created_at", { ascending: true });
  return data ?? [];
});

export const createStaff = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      email: string;
      name: string;
      role: string;
      password: string;
      requireMfa?: boolean;
      confirmPassword: string;
      csrfToken: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const ctx = await sec.requireAdmin("staff.manage");
    await sec.requireCsrf(ctx, data?.csrfToken ?? "");

    const client = sec.db();
    const { data: me } = await client
      .from("admin_users")
      .select("password_hash")
      .eq("id", ctx.userId)
      .maybeSingle();
    if (!me || !(await sec.verifyPassword(data.confirmPassword ?? "", me.password_hash)))
      return { ok: false as const, message: "Re-authentication failed." };

    if (!isRole(data.role)) return { ok: false as const, message: "Invalid role." };
    if (data.role === "SUPER_ADMIN" && ctx.role !== "SUPER_ADMIN")
      return { ok: false as const, message: "Only a Super Admin can create a Super Admin." };

    const email = sec.normalizeEmail(data.email ?? "");
    if (!/^[^@\s]+@[^@\s.]+\.[^@\s]+$/.test(email))
      return { ok: false as const, message: "Enter a valid email address." };
    const name = String(data.name ?? "").trim().slice(0, 120);
    if (name.length < 2) return { ok: false as const, message: "Enter the staff member's name." };

    const strength = sec.validatePasswordStrength(data.password ?? "", email);
    if (!strength.ok) return { ok: false as const, message: strength.message };

    const { error } = await client.from("admin_users").insert({
      email: data.email.trim(),
      email_normalized: email,
      name,
      role: data.role,
      password_hash: await sec.hashPassword(data.password),
      must_change_password: true,
      mfa_required: !!data.requireMfa,
    });
    if (error)
      return { ok: false as const, message: "An account with that email already exists." };

    await sec.logSecurityEvent({
      adminUserId: ctx.userId,
      actorEmail: ctx.email,
      event: "staff.created",
      severity: "critical",
      resource: email,
      metadata: { role: data.role },
    });
    await sec.logAudit({
      adminUserId: ctx.userId,
      actorEmail: ctx.email,
      action: "Staff created",
      module: "staff",
      entityType: "admin_user",
      entityLabel: email,
      next: { role: data.role },
    });
    return { ok: true as const };
  });

export const updateStaff = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      id: string;
      role?: string;
      status?: string;
      requireMfa?: boolean;
      confirmPassword: string;
      csrfToken: string;
    }) => input,
  )
  .handler(async ({ data }) => {
    const ctx = await sec.requireAdmin("staff.manage");
    await sec.requireCsrf(ctx, data?.csrfToken ?? "");

    const client = sec.db();
    const { data: me } = await client
      .from("admin_users")
      .select("password_hash")
      .eq("id", ctx.userId)
      .maybeSingle();
    if (!me || !(await sec.verifyPassword(data.confirmPassword ?? "", me.password_hash)))
      return { ok: false as const, message: "Re-authentication failed." };

    if (data.id === ctx.userId && (data.role || data.status))
      return { ok: false as const, message: "You cannot change your own role or status." };

    const { data: target } = await client
      .from("admin_users")
      .select("id, email, role, status, mfa_required")
      .eq("id", data.id)
      .maybeSingle();
    if (!target) return { ok: false as const, message: "Staff member not found." };

    if (
      (target.role === "SUPER_ADMIN" || data.role === "SUPER_ADMIN") &&
      ctx.role !== "SUPER_ADMIN"
    )
      return { ok: false as const, message: "Only a Super Admin can manage Super Admins." };

    if (target.role === "SUPER_ADMIN" && (data.role !== "SUPER_ADMIN" || data.status !== "ACTIVE")) {
      const { count } = await client
        .from("admin_users")
        .select("id", { count: "exact", head: true })
        .eq("role", "SUPER_ADMIN")
        .eq("status", "ACTIVE");
      if ((count ?? 0) <= 1)
        return { ok: false as const, message: "At least one active Super Admin is required." };
    }

    const update: StaffUpdate = {};
    if (data.role !== undefined) {
      if (!isRole(data.role)) return { ok: false as const, message: "Invalid role." };
      update.role = data.role;
    }
    if (data.status !== undefined) {
      if (!["ACTIVE", "LOCKED", "DISABLED"].includes(data.status))
        return { ok: false as const, message: "Invalid status." };
      update.status = data.status;
      if (data.status === "ACTIVE") {
        update.locked_until = null;
        update.failed_login_count = 0;
      }
    }
    if (data.requireMfa !== undefined) update.mfa_required = !!data.requireMfa;
    if (Object.keys(update).length === 0) return { ok: true as const };

    await client.from("admin_users").update(update).eq("id", target.id);

    if (update.status && update.status !== "ACTIVE") {
      await client
        .from("admin_sessions")
        .update({ revoked_at: new Date().toISOString() })
        .eq("admin_user_id", target.id)
        .is("revoked_at", null);
    }

    await sec.logSecurityEvent({
      adminUserId: ctx.userId,
      actorEmail: ctx.email,
      event: "staff.updated",
      severity: "critical",
      resource: target.email,
      metadata: update as Record<string, unknown>,
    });
    await sec.logAudit({
      adminUserId: ctx.userId,
      actorEmail: ctx.email,
      action: "Staff updated",
      module: "staff",
      entityType: "admin_user",
      entityId: target.id,
      entityLabel: target.email,
      previous: { role: target.role, status: target.status, mfa_required: target.mfa_required },
      next: update,
    });
    return { ok: true as const };
  });

export const revokeStaffSessions = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string; csrfToken: string }) => input)
  .handler(async ({ data }) => {
    const ctx = await sec.requireAdmin("staff.manage");
    await sec.requireCsrf(ctx, data?.csrfToken ?? "");
    await sec
      .db()
      .from("admin_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("admin_user_id", data.id)
      .is("revoked_at", null);
    await sec.logSecurityEvent({
      adminUserId: ctx.userId,
      actorEmail: ctx.email,
      event: "staff.sessions_revoked",
      severity: "warning",
      resource: data.id,
    });
    return { ok: true as const };
  });

/** Issues a one-time reset link a Super Admin can hand to a staff member. */
export const issueResetLink = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string; confirmPassword: string; csrfToken: string }) => input)
  .handler(async ({ data }) => {
    const ctx = await sec.requireAdmin("staff.manage");
    await sec.requireCsrf(ctx, data?.csrfToken ?? "");
    const client = sec.db();
    const { data: me } = await client
      .from("admin_users")
      .select("password_hash")
      .eq("id", ctx.userId)
      .maybeSingle();
    if (!me || !(await sec.verifyPassword(data.confirmPassword ?? "", me.password_hash)))
      return { ok: false as const, message: "Re-authentication failed." };

    const token = sec.randomToken();
    await client.from("admin_password_resets").insert({
      admin_user_id: data.id,
      token_hash: await sec.sha256Hex(token),
      expires_at: new Date(Date.now() + 60 * 60_000).toISOString(),
    });
    await sec.logSecurityEvent({
      adminUserId: ctx.userId,
      actorEmail: ctx.email,
      event: "password.reset_issued",
      severity: "warning",
      resource: data.id,
    });
    return { ok: true as const, path: `/admin/reset-password?token=${token}` };
  });

export const requestPasswordReset = createServerFn({ method: "POST" })
  .inputValidator((input: { email: string }) => input)
  .handler(async ({ data }) => {
    const email = sec.normalizeEmail(data?.email ?? "");
    const client = sec.db();
    const { data: user } = await client
      .from("admin_users")
      .select("id, status")
      .eq("email_normalized", email)
      .maybeSingle();

    if (user && user.status !== "DISABLED") {
      const { count } = await client
        .from("admin_password_resets")
        .select("id", { count: "exact", head: true })
        .eq("admin_user_id", user.id)
        .gte("created_at", new Date(Date.now() - 15 * 60_000).toISOString());
      if ((count ?? 0) < 3) {
        const token = sec.randomToken();
        await client.from("admin_password_resets").insert({
          admin_user_id: user.id,
          token_hash: await sec.sha256Hex(token),
          expires_at: new Date(Date.now() + 60 * 60_000).toISOString(),
        });
      }
      await sec.logSecurityEvent({
        adminUserId: user.id,
        actorEmail: email,
        event: "password.reset_requested",
        severity: "warning",
      });
    }
    // Always identical response — no account enumeration.
    return { ok: true as const };
  });

export const resetPassword = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; newPassword: string }) => input)
  .handler(async ({ data }) => {
    const client = sec.db();
    const tokenHash = await sec.sha256Hex(String(data?.token ?? ""));
    const { data: reset } = await client
      .from("admin_password_resets")
      .select("id, admin_user_id, expires_at, used_at")
      .eq("token_hash", tokenHash)
      .maybeSingle();

    if (!reset || reset.used_at || new Date(reset.expires_at).getTime() < Date.now())
      return { ok: false as const, message: "This reset link is invalid or has expired." };

    const strength = sec.validatePasswordStrength(data.newPassword ?? "");
    if (!strength.ok) return { ok: false as const, message: strength.message };

    await client
      .from("admin_users")
      .update({
        password_hash: await sec.hashPassword(data.newPassword),
        must_change_password: false,
        password_changed_at: new Date().toISOString(),
        failed_login_count: 0,
        locked_until: null,
        status: "ACTIVE",
      })
      .eq("id", reset.admin_user_id);
    await client
      .from("admin_password_resets")
      .update({ used_at: new Date().toISOString() })
      .eq("id", reset.id);
    await client
      .from("admin_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("admin_user_id", reset.admin_user_id)
      .is("revoked_at", null);

    await sec.logSecurityEvent({
      adminUserId: reset.admin_user_id,
      event: "password.reset_completed",
      severity: "critical",
    });
    return { ok: true as const };
  });

/* ------------------------------------------------------------------ logs */

export const listSecurityEvents = createServerFn({ method: "POST" })
  .inputValidator((input: { severity?: string; search?: string } | undefined) => input ?? {})
  .handler(async ({ data }) => {
    await sec.requireAdmin("security.view");
    let query = sec
      .db()
      .from("admin_security_events")
      .select("id, actor_email, event, result, severity, ip, resource, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.severity && ["info", "warning", "critical"].includes(data.severity))
      query = query.eq("severity", data.severity);
    const { data: rows } = await query;
    const search = (data.search ?? "").trim().toLowerCase();
    const list = rows ?? [];
    return search
      ? list.filter((r) =>
          `${r.actor_email ?? ""} ${r.event} ${r.resource ?? ""}`.toLowerCase().includes(search),
        )
      : list;
  });

export const listActivity = createServerFn({ method: "POST" })
  .inputValidator((input: { module?: string; search?: string } | undefined) => input ?? {})
  .handler(async ({ data }) => {
    await sec.requireAdmin("activity.view");
    let query = sec
      .db()
      .from("admin_audit_log")
      .select(
        "id, actor_email, action, module, entity_type, entity_label, previous_value, new_value, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (data.module) query = query.eq("module", data.module);
    const { data: rows } = await query;
    const search = (data.search ?? "").trim().toLowerCase();
    const list = rows ?? [];
    return search
      ? list.filter((r) =>
          `${r.actor_email ?? ""} ${r.action} ${r.entity_label ?? ""}`
            .toLowerCase()
            .includes(search),
        )
      : list;
  });
