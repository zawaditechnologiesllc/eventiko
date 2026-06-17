import { Request } from "express";
import { supabaseAdmin } from "./supabase";
import { AppError } from "./http";

export interface AuthedUser {
  userId: string;
  email?: string;
  role: "buyer" | "seller" | "admin";
  sellerId: string | null;
}

/**
 * Validate the Supabase access token from the Authorization header and resolve
 * the caller's role + seller id.
 */
export async function getUserFromRequest(req: Request): Promise<AuthedUser> {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) throw new AppError(401, "Authentication required.");

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) throw new AppError(401, "Invalid or expired session.");

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .single();

  const { data: seller } = await supabaseAdmin
    .from("sellers")
    .select("id")
    .eq("user_id", data.user.id)
    .maybeSingle();

  return {
    userId: data.user.id,
    email: data.user.email,
    role: (profile?.role as AuthedUser["role"]) || "buyer",
    sellerId: seller?.id ?? null,
  };
}

/** True if the user is an admin or the seller that owns the given event. */
export async function canManageEvent(user: AuthedUser, eventId: string): Promise<boolean> {
  if (user.role === "admin") return true;
  if (!user.sellerId) return false;
  const { data: event } = await supabaseAdmin
    .from("events")
    .select("seller_id")
    .eq("id", eventId)
    .single();
  return !!event && event.seller_id === user.sellerId;
}
