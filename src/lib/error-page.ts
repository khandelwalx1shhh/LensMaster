export function renderErrorPage(error?: unknown): string {
  const message = error instanceof Error ? error.message : typeof error === "string" ? error : "";
  const isDev = process.env.NODE_ENV !== "production";

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load — Lens Master</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; background: #ffffff; border: 1px solid #e5e7eb; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05); }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; font-weight: 600; }
      p { color: #4b5563; margin: 0 0 1.5rem; font-size: 0.9375rem; }
      .error-box { background: #fef2f2; border: 1px solid #fee2e2; color: #991b1b; padding: 0.75rem 1rem; border-radius: 0.5rem; font-family: monospace; font-size: 0.8125rem; word-break: break-word; text-align: left; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: 0.75rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.625rem 1.25rem; border-radius: 9999px; font: inherit; font-size: 0.875rem; font-weight: 500; cursor: pointer; text-decoration: none; border: 1px solid transparent; transition: background-color 0.2s, opacity 0.2s; }
      .primary { background: #111; color: #fff; }
      .primary:hover { opacity: 0.9; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
      .secondary:hover { background: #f3f4f6; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      ${message && (isDev || !process.env.NODE_ENV) ? `<div class="error-box">${message.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>` : ""}
      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}
