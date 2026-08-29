# Plan: Shift Admin Panel to Shopify Backend

## Goal
Make Shopify the single source of truth for all commerce data (products, orders, customers) in the admin panel. Admin authentication, RBAC, MFA, and audit logging stay in the Cloud database — only commerce data moves to Shopify.

## What stays in Supabase (Cloud DB)
- `admin_users`, `admin_sessions`, `admin_security_events`, `admin_audit_log`, `admin_password_resets`, `admin_login_attempts` — admin auth infrastructure
- `prescriptions` — custom Rx data linked to Shopify order IDs (Shopify has no native prescription concept)

## What moves to Shopify Admin API
- Products (list, view, create, update, delete)
- Orders (list, view, update fulfillment status)
- Dashboard stats (product count, order count, revenue, recent orders)
- Customers

---

## Step 1: Create Shopify Admin API client
**File:** `src/lib/shopify-admin.server.ts` (server-only)

A server-only module that calls the Shopify Admin GraphQL API using `SHOPIFY_ACCESS_TOKEN`:
- `adminApiRequest(query, variables)` — base fetch helper with error handling
- Product queries: list products with variants/images/inventory, get by ID
- Order queries: list orders with line items/customer/shipping/fulfillment, get by ID
- Customer queries: count customers
- Product mutations: create, update, delete
- Order mutations: update fulfillment status, add tags/notes

Uses `SHOPIFY_STORE_PERMANENT_DOMAIN` (already in `shopify.ts`) and `SHOPIFY_ACCESS_TOKEN` secret.

## Step 2: Rewrite admin server functions
**File:** `src/lib/admin.functions.ts`

Replace Supabase commerce queries with Shopify Admin API calls:

- `getAdminStats` → Shopify product count + order count + recent orders (last 5)
- `getAdminProducts` → Shopify products with variants, images, inventory, status
- `getAdminOrders` → Shopify orders with line items, customer, shipping address, fulfillment, payment
- `updateOrderStatus` → Shopify fulfillment mutation (create fulfillment / cancel fulfillment) + order tags/notes
- **New:** `createProduct` → Shopify product create mutation
- **New:** `updateProduct` → Shopify product update mutation
- **New:** `deleteProduct` → Shopify product delete mutation

All functions still call `requireAdmin()` first — admin auth stays unchanged.

## Step 3: Update admin types
**File:** `src/lib/admin-orders.types.ts`

Replace Supabase row types with Shopify-compatible types:
- `AdminOrderRow` → Shopify order shape (id, name/order number, displayFinancialStatus, fulfillmentStatus, line items, shipping address, customer, createdAt, processedAt)
- `AdminOrderItem` → Shopify line item shape (title, variant title, quantity, price)
- `AdminProductRow` → new type for Shopify product (id, title, handle, status, productType, vendor, variants, images, inventory)
- Keep `FULFILLMENT_STAGES` mapping for Shopify → internal status labels

## Step 4: Update admin UI components

### `src/routes/admin/products.tsx`
- Display Shopify products: thumbnail, title, type/vendor, price, inventory, status
- Add "Add Product" button → opens create dialog (title, description, type, price, tags)
- Add row actions: Edit (update title/price/tags), Delete (with confirmation)
- Show variant count and inventory per product

### `src/routes/admin/orders.tsx`
- Display Shopify orders: order number, date, customer, items, total, fulfillment, payment
- Order detail dialog: shipping address, line items, payment info
- Update fulfillment status via Shopify API (fulfill → mark as shipped/delivered)
- Prescription display: fetch from Supabase `prescriptions` table matched by Shopify order name/ID

### `src/routes/admin/dashboard.tsx`
- Stats from Shopify: product count, order count, revenue (paid orders total)
- Recent orders from Shopify

## Step 5: Sync orders to Shopify on checkout
**Files:** `src/routes/api/razorpay/verify.ts`, `src/lib/supabase-service.server.ts`

When Razorpay payment is verified:
- Create a Shopify order via Admin API (`orderCreate` mutation) with line items, customer, shipping address, payment marker
- Store the Shopify order GID/name in the Supabase order row for cross-referencing
- Store prescription data as Shopify order metafields so it travels with the order
- Keep Supabase order row as a local record (for Razorpay reconciliation) but the admin panel reads from Shopify

## Step 6: Verify
- Admin products page shows all 9 Shopify products
- Admin orders page shows Shopify orders (including new ones from checkout)
- Dashboard stats reflect Shopify data
- Create/update/delete product works via admin
- Order fulfillment status updates sync to Shopify
- Full checkout flow: cart → Razorpay → order appears in both Shopify admin and the custom admin panel
