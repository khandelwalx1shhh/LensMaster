import { createClient } from "@supabase/supabase-js";
import { argon2id } from "hash-wasm";
import fs from "fs";
import path from "path";

try {
  const envPath = path.resolve(process.cwd(), ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const match = line.trim().match(/^([^#=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim().replace(/^["']|["']$/g, "");
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
} catch (e) {}

const url = process.env.SUPABASE_URL || "https://dxqtbwwkjjsdlpfnkiem.supabase.co";
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "";

console.log("Using URL:", url);
console.log("Using Key prefix:", key.slice(0, 15) + "...");

const client = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
});

async function hashPassword(password: string): Promise<string> {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return argon2id({
    password,
    salt,
    parallelism: 1,
    iterations: 3,
    memorySize: 19456,
    hashLength: 32,
    outputType: "encoded",
  });
}

async function main() {
  const email = (process.env.ADMIN_BOOTSTRAP_EMAIL || "owner@lensmaster.in").trim();
  const password = process.env.ADMIN_PASSWORD || "LensMaster@2026!Admin";
  const emailNormalized = email.toLowerCase();

  console.log(`Checking admin user: ${email}...`);

  const { data: existing, error: selectErr } = await client
    .from("admin_users")
    .select("*")
    .eq("email_normalized", emailNormalized)
    .maybeSingle();

  if (selectErr) {
    console.error("Select error:", selectErr);
    return;
  }

  const passwordHash = await hashPassword(password);

  if (existing) {
    console.log(`Found existing admin user (${existing.id}). Updating password and resetting lock/failed attempts...`);
    const { error: updateErr } = await client
      .from("admin_users")
      .update({
        password_hash: passwordHash,
        must_change_password: true,
        status: "ACTIVE",
        failed_login_count: 0,
        locked_until: null,
      })
      .eq("id", existing.id);

    if (updateErr) {
      console.error("Update error:", updateErr);
      return;
    }
    console.log("Admin user updated successfully!");
  } else {
    console.log("No existing admin found with that email. Creating new SUPER_ADMIN user...");
    const { error: insertErr } = await client.from("admin_users").insert({
      email,
      email_normalized: emailNormalized,
      name: "Owner",
      password_hash: passwordHash,
      role: "SUPER_ADMIN",
      status: "ACTIVE",
      must_change_password: true,
    });

    if (insertErr) {
      console.error("Insert error:", insertErr);
      return;
    }
    console.log("Admin user created successfully!");
  }

  console.log("\n--- Admin Credentials ---");
  console.log("Email:", email);
  console.log("Password:", password);
  console.log("Role: SUPER_ADMIN");
  console.log("Status: ACTIVE");
  console.log("URL: /admin/login");
}

main().catch(console.error);
