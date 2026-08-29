/** Shopify fulfillment operations — server only. */
import { shopifyREST } from "./client.server";

export async function fulfillOrder(orderId: string, trackingNumber?: string) {
  const numericId = orderId.split("/").pop();
  const orderData = await shopifyREST<{
    order: { id: number; fulfillment_orders?: Array<{ id: number }> };
  }>("GET", `/orders/${numericId}.json?fields=id,fulfillment_orders`);

  const fulfillmentOrders = orderData.order.fulfillment_orders ?? [];
  if (!fulfillmentOrders.length) throw new Error("NO_FULFILLMENT_ORDERS");

  for (const fo of fulfillmentOrders) {
    await shopifyREST("POST", "/fulfillments.json", {
      fulfillment: {
        line_items_by_fulfillment_order: [{ fulfillment_order_id: fo.id }],
        ...(trackingNumber ? { tracking_info: { number: trackingNumber } } : {}),
        notify_customer: true,
      },
    });
  }
  console.info("[shopify] fulfillment created");
}
