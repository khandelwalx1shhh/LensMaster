// Shared zod schemas for user input. Protects against OWASP A03 (Injection)
// and A04 (Insecure Design) by enforcing strict shape/length on every field
// that leaves the browser or feeds into a URL / storage / cart attribute.
import { z } from "zod";

export const phoneSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ""))
  .pipe(z.string().regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number"));


export const prescriptionNoteSchema = z
  .string()
  .trim()
  .max(500, "Note must be under 500 characters")
  .optional()
  .default("");

// Numeric prescription values (SPH, CYL, ADD in diopters; AXIS in degrees; PD in mm).
export const diopterSchema = z
  .string()
  .trim()
  .max(8)
  .regex(/^-?\d{0,2}(\.\d{1,2})?$/, "Invalid value")
  .optional()
  .default("");

export const axisSchema = z
  .string()
  .trim()
  .max(3)
  .regex(/^(\d{1,3})?$/, "AXIS must be 0-180")
  .refine((v) => v === "" || (Number(v) >= 0 && Number(v) <= 180), "AXIS must be 0-180")
  .optional()
  .default("");

export const searchQuerySchema = z
  .string()
  .trim()
  .max(100, "Search query too long")
  .transform((v) => v.replace(/[<>"'`]/g, ""));

// Checkout delivery details — mirrors the server-side schema in
// src/routes/api/paytm/initiate.ts so the client can never submit a payload
// the server would reject.
const nameRe = /^[A-Za-z][A-Za-z .'-]*$/;
const placeRe = /^[A-Za-z][A-Za-z .'()-]*$/;

export const checkoutSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Please enter your full name")
    .max(80, "Name must be under 80 characters")
    .regex(nameRe, "Name can only contain letters, spaces, . ' -"),
  phone: z
    .string()
    .trim()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit mobile number"),
  email: z
    .string()
    .trim()
    .max(120, "Email must be under 120 characters")
    .refine((v) => v === "" || /^[^@\s]+@[^@\s]+\.[^@\s]{2,}$/.test(v), "Enter a valid email address"),
  line1: z
    .string()
    .trim()
    .min(5, "Enter your street address")
    .max(180, "Address must be under 180 characters"),
  line2: z.string().trim().max(180, "Landmark must be under 180 characters"),
  city: z
    .string()
    .trim()
    .min(2, "Enter your city")
    .max(60, "City must be under 60 characters")
    .regex(placeRe, "Enter a valid city name"),
  state: z
    .string()
    .trim()
    .min(2, "Enter your state")
    .max(60, "State must be under 60 characters")
    .regex(placeRe, "Enter a valid state name"),
  pincode: z
    .string()
    .trim()
    .regex(/^[1-9]\d{5}$/, "Enter a valid 6-digit PIN code"),
});

export type CheckoutForm = z.infer<typeof checkoutSchema>;

export type Phone = z.infer<typeof phoneSchema>;
