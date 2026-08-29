/**
 * RBAC definitions — shared by server (enforcement) and client (UI affordances).
 * The client copy is convenience only; every sensitive operation re-checks
 * the permission server-side.
 */

export const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "STORE_MANAGER",
  "SALES_STAFF",
  "INVENTORY_MANAGER",
  "PRESCRIPTION_STAFF",
  "ANALYST",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export const ROLE_LABELS: Record<AdminRole, string> = {
  SUPER_ADMIN: "Super Admin",
  STORE_MANAGER: "Store Manager",
  SALES_STAFF: "Sales Staff",
  INVENTORY_MANAGER: "Inventory Manager",
  PRESCRIPTION_STAFF: "Prescription Staff",
  ANALYST: "Analyst",
};

export const PERMISSIONS = [
  "dashboard.view",
  "products.view",
  "products.create",
  "products.edit",
  "products.archive",
  "orders.view",
  "orders.manage",
  "orders.cancel",
  "orders.refund",
  "customers.view",
  "inventory.view",
  "inventory.manage",
  "prescriptions.view",
  "prescriptions.verify",
  "prescriptions.reject",
  "lenses.view",
  "lenses.manage",
  "analytics.view",
  "discounts.view",
  "discounts.manage",
  "staff.view",
  "staff.manage",
  "settings.view",
  "settings.manage",
  "activity.view",
  "security.view",
  "security.manage",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

const ALL: Permission[] = [...PERMISSIONS];

export const ROLE_PERMISSIONS: Record<AdminRole, Permission[]> = {
  SUPER_ADMIN: ALL,
  STORE_MANAGER: [
    "dashboard.view",
    "products.view",
    "products.create",
    "products.edit",
    "products.archive",
    "orders.view",
    "orders.manage",
    "orders.cancel",
    "customers.view",
    "inventory.view",
    "inventory.manage",
    "prescriptions.view",
    "lenses.view",
    "lenses.manage",
    "analytics.view",
    "discounts.view",
    "discounts.manage",
    "staff.view",
    "settings.view",
    "activity.view",
  ],
  SALES_STAFF: [
    "dashboard.view",
    "products.view",
    "orders.view",
    "orders.manage",
    "customers.view",
    "prescriptions.view",
  ],
  INVENTORY_MANAGER: [
    "dashboard.view",
    "products.view",
    "products.edit",
    "inventory.view",
    "inventory.manage",
    "lenses.view",
    "activity.view",
  ],
  PRESCRIPTION_STAFF: [
    "dashboard.view",
    "orders.view",
    "prescriptions.view",
    "prescriptions.verify",
    "prescriptions.reject",
    "customers.view",
  ],
  ANALYST: ["dashboard.view", "analytics.view", "products.view", "orders.view"],
};

/** Operations that always require a fresh MFA / password confirmation. */
export const CRITICAL_PERMISSIONS: Permission[] = [
  "orders.refund",
  "staff.manage",
  "security.manage",
  "settings.manage",
];

export function permissionsForRole(role: string): Permission[] {
  return ROLE_PERMISSIONS[role as AdminRole] ?? [];
}

export function roleHasPermission(role: string, permission: Permission): boolean {
  return permissionsForRole(role).includes(permission);
}

export function hasPermission(
  permissions: readonly string[] | undefined,
  permission: Permission,
): boolean {
  return !!permissions?.includes(permission);
}
