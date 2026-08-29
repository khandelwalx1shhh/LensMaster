import { createFileRoute } from "@tanstack/react-router";
import { getPaytmConfig, paramsToString, verifySignature } from "@/lib/paytm.server";

/**
 * Paytm posts the transaction result here as form-urlencoded data.
 * Lives under /api/public/* because Paytm is an unauthenticated external caller —
 * the payload is therefore only trusted after the checksum verifies.
 */
function redirectTo(path: string) {
  return new Response(null, { status: 303, headers: { Location: path } });
}

export const Route = createFileRoute("/api/public/paytm/callback")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        let params: Record<string, string> = {};
        try {
          const form = await request.formData();
          for (const [key, value] of form.entries()) {
            if (typeof value === "string" && key.length <= 64 && value.length <= 512) {
              params[key] = value;
            }
          }
        } catch (error) {
          console.error("[paytm] unreadable callback body", error);
          return redirectTo("/order-status?status=UNKNOWN");
        }

        const signature = params.CHECKSUMHASH;
        let key: string;
        try {
          key = getPaytmConfig().key;
        } catch (error) {
          console.error("[paytm] missing configuration on callback", error);
          return redirectTo("/order-status?status=UNKNOWN");
        }

        if (!signature || !verifySignature(paramsToString(params), key, signature)) {
          console.error("[paytm] checksum verification failed", { orderId: params.ORDERID });
          return redirectTo("/order-status?status=INVALID");
        }

        const status = params.STATUS === "TXN_SUCCESS" ? "TXN_SUCCESS" : "TXN_FAILURE";
        const query = new URLSearchParams({ status });
        if (params.ORDERID) query.set("orderId", params.ORDERID);
        if (params.TXNID) query.set("txnId", params.TXNID);
        if (params.TXNAMOUNT) query.set("amount", params.TXNAMOUNT);

        console.log("[paytm] verified callback", {
          orderId: params.ORDERID,
          status,
          respCode: params.RESPCODE,
        });

        return redirectTo(`/order-status?${query.toString()}`);
      },
    },
  },
});
