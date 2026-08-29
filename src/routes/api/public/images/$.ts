import { createFileRoute } from "@tanstack/react-router";
import { createClient } from "@supabase/supabase-js";

export const Route = createFileRoute("/api/public/images/$")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const path = params._splat;
        if (!path || path.includes("..") || path.startsWith("/")) {
          return new Response("Invalid path", { status: 400 });
        }

        const url = process.env['SUPABASE_URL']!;
        const key = process.env['SUPABASE_SERVICE_ROLE_KEY']!;
        const supabase = createClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
          global: {
            fetch: (input, init) => {
              const h = new Headers(init?.headers);
              if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
                h.delete("Authorization");
              }
              h.set("apikey", key);
              return fetch(input, { ...init, headers: h });
            },
          },
        });

        const { data, error } = await supabase.storage.from("product-images").download(path);
        if (error || !data) {
          console.error("[image-proxy] download failed", error);
          return new Response("Not found", { status: 404 });
        }

        const headers = new Headers();
        headers.set("content-type", data.type || "image/jpeg");
        headers.set("cache-control", "public, max-age=86400");
        return new Response(data, { headers });
      },
    },
  },
});
