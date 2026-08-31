/** Shared row shapes for the admin panel — Shopify-backed. */

export interface AdminPrescription {
  product_type: string;
  right_sph: number | null;
  right_cyl: number | null;
  right_axis: number | null;
  right_add: number | null;
  left_sph: number | null;
  left_cyl: number | null;
  left_axis: number | null;
  left_add: number | null;
  pd: number | null;
  pd_type: string | null;
  right_pd: number | null;
  left_pd: number | null;
  photo_url: string | null;
  notes: string | null;
}

export interface AdminProductVariant {
  id: string;
  title: string;
  price: string;
  compareAtPrice: string | null;
  inventoryQuantity: number | null;
}

export interface AdminProductRow {
  id: string;
  title: string;
  handle: string;
  description: string;
  productType: string;
  vendor: string;
  status: string;
  tags: string[];
  price: string;
  totalInventory: number;
  image: string | null;
  variants: AdminProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface AdminOrderItem {
  id: string;
  title: string;
  variantTitle: string | null;
  quantity: number;
  price: number;
  prescription: AdminPrescription | null;
}

export interface AdminOrderRow {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  fulfillmentStatus: string;
  financialStatus: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  address1: string;
  address2: string | null;
  city: string;
  state: string;
  pincode: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  lineItems: AdminOrderItem[];
  tags: string[];
  note: string | null;
  createdAt: string;
  updatedAt: string;
  processedAt: string;
}

/** Ordered fulfillment stages used by the admin timeline. */
export const FULFILLMENT_STAGES = [
  "pending",
  "processing",
  "ready",
  "shipped",
  "delivered",
] as const;

export type FulfillmentStage = (typeof FULFILLMENT_STAGES)[number];
