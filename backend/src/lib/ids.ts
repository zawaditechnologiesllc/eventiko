import crypto from "crypto";
import jwt from "jsonwebtoken";
import { config } from "../config";

// Unambiguous alphabet (no 0/O/1/I) for human-readable codes.
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

function code(len: number): string {
  const bytes = crypto.randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** Order number, e.g. EVK-ORD-7F3A9K */
export function generateOrderNumber(): string {
  return `EVK-ORD-${code(6)}`;
}

/** Ticket reference shown at the door, e.g. EVK-7F3A-91KD */
export function generateReference(): string {
  return `EVK-${code(4)}-${code(4)}`;
}

export interface TicketTokenPayload {
  tid: string; // ticket id
  ref: string; // reference number
  eid: string; // event id
}

/** Sign the payload embedded into the QR code. */
export function signTicketToken(payload: TicketTokenPayload): string {
  return jwt.sign(payload, config.ticketSecret, {
    algorithm: "HS256",
    expiresIn: "365d",
  });
}

/** Verify a scanned QR token. Returns the payload or null if invalid/tampered. */
export function verifyTicketToken(token: string): TicketTokenPayload | null {
  try {
    return jwt.verify(token, config.ticketSecret) as TicketTokenPayload;
  } catch {
    return null;
  }
}

export function sha1(input: string): string {
  return crypto.createHash("sha1").update(input).digest("hex");
}
