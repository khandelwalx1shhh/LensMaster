# Replace Shopify with a Custom Admin Panel & Backend

## Goal
Move Lens Master off Shopify entirely. Products, inventory, orders, customers, and prescriptions will live in Lovable Cloud. You will manage everything through a protected `/admin` panel.

## What we will build

### 1. Database schema (Lovable Cloud migrations)
- `products` — title, handle, description, category, tags, brand, frame shape, material, gender, colors, images, base price, status.
- `product_variants` — variant title, SKU, price, inventory quantity, options (size/color/lens type), linked to product.
- `categories` — Sunglasses, Optical Frames, Blue Cut Glasses, Contact Lenses (Clear/Color/Solutions/Accessories), Kids.
- `orders` — customer details, address, payment status, Razorpay order/payment IDs, total, delivery fee, timestamps.
- `order_items` — line items with variant snapshot, quantity, prescription JSON, lens type.
- `prescriptions` — stored per order item (SPH, CYL, AXIS, ADD, PD for right/left, photo URL, product type).
- `customers` — phone (primary), name, email, addresses JSON, created from checkout/OTP login.
- `admins` — single-owner gate; only your account can access `/admin`.

### 2. Security & access
- Row Level Security (RLS) on every table.
- `authenticated` users can read public products and manage their own orders.
- `service_role` server functions handle checkout, order creation, and admin writes.
- `/admin` routes protected by a pathless `_admin` layout that checks the `admins` table.

### 3. Admin panel (`/admin`)
- `/admin/login` — email/password or magic-link sign-in for the owner only.
- `/admin/dashboard` — order count, revenue, low-stock alerts.
- `/admin/products` — list, add, edit, delete products with variant management.
- `/admin/orders` — view orders, update payment/shipping status, download prescription photos.
- `/admin/customers` — view customer list and order history.

### 4. Storefront refactor
- Replace Shopify GraphQL calls with Supabase queries.
- `/shop` reads from `products`/`product_variants` with the same filters (shape, material, gender, price, category, sort).
- `/product/$handle` reads from the database.
- Cart store syncs order intent locally; checkout creates an `orders` row in `pending` status before Razorpay.
- Razorpay order creation uses database-verified prices.
- After successful Razorpay payment, mark order `paid` and clear the cart.

### 5. Prescription & lens flow
- Keep the existing 3-step lens wizard.
- Save prescription data into `prescriptions` linked to the order item.
- Support photo upload to a storage bucket.

### 6. Images
- Create a private `product-images` storage bucket.
- Admin upload stores images in Cloud storage; storefront reads public URLs.
- Seed initial images from existing local assets.

### 7. Seed data
- Migration inserts the 5 demo products (Skyline Aviator, Sovereign Wayfarer, Atelier Round, Meridian Rimless, Focus Blue Cut) with variants and categories so the store is never empty.

### 8. Razorpay & checkout
- Keep Razorpay test keys already stored as secrets.
- `/api/razorpay/order` creates Razorpay order from verified database totals.
- `/api/razorpay/verify` verifies signature, then updates order status.
- `/order-status` reads the real order from the database.

### 9. Cleanup
- Remove Shopify integration code (`src/lib/shopify.ts`, demo-products fallback logic).
- Remove Paytm integration files (now unused).
- Update CSP in `src/server.ts` if any new domains are needed.

## Outcome
You get a fully independent e-commerce backend with your own product catalogue, order management, and prescription records — no Shopify dependency.

## Notes
- This is a large refactor; we will build it in stages (schema → admin → storefront switch → payments finalization).
- After go-live, you can add staff roles later if needed; the first version is owner-only.
