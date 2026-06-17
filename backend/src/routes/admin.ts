import { Router } from "express";
import { stripe } from "../lib/stripe";
import { supabaseAdmin } from "../lib/supabase";
import { asyncHandler, AppError } from "../lib/http";
import { getUserFromRequest } from "../lib/auth";

export const adminRouter = Router();

/**
 * Refund a paid order (admin only). Issues a Stripe refund, cancels the issued
 * tickets, releases inventory and reverses the seller's balance. For Connect
 * (direct payout) orders the transfer + application fee are reversed too.
 */
adminRouter.post(
  "/orders/:orderNumber/refund",
  asyncHandler(async (req, res) => {
    const user = await getUserFromRequest(req);
    if (user.role !== "admin") throw new AppError(403, "Admins only.");

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, status, stripe_payment_intent, direct_payout")
      .eq("order_number", req.params.orderNumber)
      .single();
    if (!order) throw new AppError(404, "Order not found.");
    if (order.status !== "paid") throw new AppError(409, "Only paid orders can be refunded.");
    if (!order.stripe_payment_intent) throw new AppError(409, "No payment to refund.");

    // Claim the refund atomically so two admins can't double-refund.
    const { data: claimed } = await supabaseAdmin
      .from("orders")
      .update({ status: "refunded" })
      .eq("id", order.id)
      .eq("status", "paid")
      .select("id")
      .maybeSingle();
    if (!claimed) throw new AppError(409, "Order is already being refunded.");

    try {
      await stripe.refunds.create({
        payment_intent: order.stripe_payment_intent,
        ...(order.direct_payout ? { reverse_transfer: true, refund_application_fee: true } : {}),
      });
    } catch (err) {
      // Roll back the status so it can be retried.
      await supabaseAdmin.from("orders").update({ status: "paid" }).eq("id", order.id);
      throw new AppError(502, `Stripe refund failed: ${(err as Error).message}`);
    }

    await supabaseAdmin.from("tickets").update({ status: "cancelled" }).eq("order_id", order.id);
    const { error: rpcErr } = await supabaseAdmin.rpc("reverse_paid_order", { p_order_id: order.id });
    if (rpcErr) console.error("[refund] reverse_paid_order failed:", rpcErr.message);

    res.json({ ok: true });
  })
);
