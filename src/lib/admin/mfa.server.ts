/**
 * TOTP two-factor helpers — SERVER ONLY.
 * Architected so WebAuthn/passkeys can be added as an additional factor later.
 */
import { Secret, TOTP } from "otpauth";

const ISSUER = "Lens Master Admin";

export function generateSecret(): string {
  return new Secret({ size: 20 }).base32;
}

function totpFor(secret: string, label: string): TOTP {
  return new TOTP({
    issuer: ISSUER,
    label,
    algorithm: "SHA1",
    digits: 6,
    period: 30,
    secret: Secret.fromBase32(secret),
  });
}

export function otpauthUri(secret: string, email: string): string {
  return totpFor(secret, email).toString();
}

/** Verifies a 6-digit code with a ±1 step window. */
export function verifyTotp(secret: string, code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  try {
    return totpFor(secret, "admin").validate({ token: code, window: 1 }) !== null;
  } catch {
    return false;
  }
}

const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateBackupCodes(count = 10): string[] {
  const codes: string[] = [];
  for (let i = 0; i < count; i++) {
    const bytes = new Uint8Array(10);
    crypto.getRandomValues(bytes);
    codes.push(Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join(""));
  }
  return codes;
}
