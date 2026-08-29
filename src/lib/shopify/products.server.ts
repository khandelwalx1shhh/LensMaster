/** Shopify product / collection / search reads — server only. */
import { shopifyGraphQL } from "./client.server";

const PRODUCT_FIELDS = `
  id
  title
  handle
  description
  descriptionHtml
  vendor
  productType
  status
  tags
  totalInventory
  onlineStoreUrl
  priceRangeV2 { minVariantPrice { amount currencyCode } maxVariantPrice { amount currencyCode } }
  featuredImage { url altText }
  images(first: 10) { edges { node { url altText } } }
  options { name values }
  metafields(first: 20, namespace: "lensmaster") { edges { node { key value } } }
  variants(first: 25) {
    edges {
      node {
        id
        title
        sku
        price
        compareAtPrice
        availableForSale
        inventoryQuantity
        inventoryPolicy
        inventoryItem { tracked }
        selectedOptions { name value }
      }
    }
  }
  createdAt
  updatedAt
`;

export interface ShopifyAdminProduct {
  id: string;
  title: string;
  handle: string;
  description: string;
  descriptionHtml?: string;
  vendor: string;
  productType: string;
  status: string;
  tags: string[];
  totalInventory: number | null;
  priceRangeV2: { minVariantPrice: { amount: string; currencyCode: string } };
  featuredImage: { url: string; altText: string | null } | null;
  images: { edges: Array<{ node: { url: string; altText: string | null } }> };
  options: Array<{ name: string; values: string[] }>;
  metafields: { edges: Array<{ node: { key: string; value: string } }> };
  variants: {
    edges: Array<{
      node: {
        id: string;
        title: string;
        sku: string | null;
        price: string;
        compareAtPrice: string | null;
        availableForSale: boolean;
        inventoryQuantity: number | null;
        inventoryPolicy: string;
        inventoryItem: { tracked: boolean } | null;
        selectedOptions: Array<{ name: string; value: string }>;
      };
    }>;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProductPage {
  products: ShopifyAdminProduct[];
  pageInfo: { hasNextPage: boolean; endCursor: string | null };
}

const LIST_QUERY = `
  query LmProducts($first: Int!, $after: String, $query: String) {
    products(first: $first, after: $after, query: $query, sortKey: UPDATED_AT, reverse: true) {
      edges { cursor node { ${PRODUCT_FIELDS} } }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

/** Paginated product list. `first` is clamped to a sane maximum. */
export async function listProducts(opts: {
  first?: number;
  after?: string | null;
  query?: string | null;
} = {}): Promise<ProductPage> {
  const first = Math.min(Math.max(opts.first ?? 24, 1), 100);
  const data = await shopifyGraphQL<{
    products: {
      edges: Array<{ node: ShopifyAdminProduct }>;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  }>(LIST_QUERY, { first, after: opts.after ?? null, query: opts.query || null });

  return {
    products: data.products.edges.map((e) => e.node),
    pageInfo: data.products.pageInfo,
  };
}

const BY_ID_QUERY = `
  query LmProduct($id: ID!) {
    product(id: $id) { ${PRODUCT_FIELDS} }
  }
`;

const BY_HANDLE_QUERY = `
  query LmProductByHandle($handle: String!) {
    productByHandle(handle: $handle) { ${PRODUCT_FIELDS} }
  }
`;

export async function getProductById(id: string): Promise<ShopifyAdminProduct | null> {
  const gid = id.startsWith("gid://") ? id : `gid://shopify/Product/${id}`;
  const data = await shopifyGraphQL<{ product: ShopifyAdminProduct | null }>(BY_ID_QUERY, { id: gid });
  return data.product;
}

export async function getProductByHandle(handle: string): Promise<ShopifyAdminProduct | null> {
  const data = await shopifyGraphQL<{ productByHandle: ShopifyAdminProduct | null }>(BY_HANDLE_QUERY, {
    handle,
  });
  return data.productByHandle;
}

/** Full-text-ish product search using Shopify's query syntax. */
export async function searchProducts(term: string, first = 20): Promise<ShopifyAdminProduct[]> {
  const safe = term.replace(/["\\]/g, " ").trim().slice(0, 80);
  if (!safe) return [];
  const query = `title:*${safe}* OR tag:${safe} OR vendor:${safe} OR product_type:${safe}`;
  const page = await listProducts({ first, query });
  return page.products;
}

const COLLECTIONS_QUERY = `
  query LmCollections($first: Int!) {
    collections(first: $first, sortKey: TITLE) {
      edges { node { id title handle description image { url altText } productsCount { count } } }
    }
  }
`;

export async function listCollections(first = 50) {
  const data = await shopifyGraphQL<{
    collections: {
      edges: Array<{
        node: {
          id: string;
          title: string;
          handle: string;
          description: string;
          image: { url: string; altText: string | null } | null;
          productsCount: { count: number } | null;
        };
      }>;
    };
  }>(COLLECTIONS_QUERY, { first: Math.min(Math.max(first, 1), 100) });
  return data.collections.edges.map((e) => e.node);
}

/** Optical metafields (category, frame_shape, ...) flattened to a plain object. */
export function optical(product: ShopifyAdminProduct): Record<string, string> {
  const out: Record<string, string> = {};
  for (const { node } of product.metafields?.edges ?? []) out[node.key] = node.value;
  return out;
}
