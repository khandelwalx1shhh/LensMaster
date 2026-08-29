/** Shopify customer reads — server only, admin use. */
import { shopifyGraphQL } from "./client.server";

const CUSTOMERS_QUERY = `
  query LmCustomers($first: Int!, $after: String, $query: String) {
    customers(first: $first, after: $after, query: $query, sortKey: UPDATED_AT, reverse: true) {
      edges {
        node {
          id
          firstName
          lastName
          email
          phone
          numberOfOrders
          amountSpent { amount currencyCode }
          createdAt
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

export async function listCustomers(opts: { first?: number; after?: string | null; query?: string | null } = {}) {
  const first = Math.min(Math.max(opts.first ?? 25, 1), 100);
  const data = await shopifyGraphQL<{
    customers: {
      edges: Array<{
        node: {
          id: string;
          firstName: string | null;
          lastName: string | null;
          email: string | null;
          phone: string | null;
          numberOfOrders: string;
          amountSpent: { amount: string; currencyCode: string };
          createdAt: string;
        };
      }>;
      pageInfo: { hasNextPage: boolean; endCursor: string | null };
    };
  }>(CUSTOMERS_QUERY, { first, after: opts.after ?? null, query: opts.query || null });
  return { customers: data.customers.edges.map((e) => e.node), pageInfo: data.customers.pageInfo };
}

const COUNT_QUERY = `query LmCustomerCount { customersCount { count } }`;

export async function countCustomers(): Promise<number> {
  try {
    const data = await shopifyGraphQL<{ customersCount: { count: number } | null }>(COUNT_QUERY);
    return data.customersCount?.count ?? 0;
  } catch {
    return 0;
  }
}
