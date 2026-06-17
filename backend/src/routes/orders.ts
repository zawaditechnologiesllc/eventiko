import { Router } from "express";
import { stripe } from "../lib/stripe";
import { supabaseAdmin } from "../lib/supabase";
import { asyncHandler, AppError } from "../lib/http";
import { buildOrderResponse, finalizeOrder } from "../services/ticketing";
import { streamOrderPdf } from "../lib/pdf";

export const ordersRouter = Router();

/** Resolve an order from a Stripe checkout session id (success page). */
ordersRouter.get(
  "/session/:sessionId",
  asyncHandler(async (req, res) => {
    const { sessionId } = req.params;
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, status")
      .eq("stripe_session_id", sessionId)
      .single();
    if (!order) throw new AppError(404, "Order not found.");

    // Reconcile against Stripe in case the webhook hasn't arrived yet.
    if (order.status !== "paid") {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === "paid") {
          await finalizeOrder(
            order.id,
            typeof session.payment_intent === "string" ? session.payment_intent : undefined
          );
        }
      } catch (err) {
        console.error("[orders] reconcile failed:", (err as Error).message);
      }
    }

    const result = await buildOrderResponse(order.id);
    res.json(result);
  })
);

/** Look up an order by its order number (post-purchase / ticket lookup). */
ordersRouter.get(
  "/:orderNumber",
  asyncHandler(async (req, res) => {
    const { orderNumber } = req.params;
    const email = (req.query.email as string | undefined)?.toLowerCase();

    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, status, buyer_email, stripe_session_id")
      .eq("order_number", orderNumber)
      .single();
    if (!order) throw new AppError(404, "Order not found.");

    if (email && order.buyer_email.toLowerCase() !== email) {
      throw new AppError(403, "Email does not match this order.");
    }

    if (order.status !== "paid" && order.stripe_session_id) {
      try {
        const session = await stripe.checkout.sessions.retrieve(order.stripe_session_id);
        if (session.payment_status === "paid") await finalizeOrder(order.id);
      } catch {
        /* ignore */
      }
    }

    const result = await buildOrderResponse(order.id);
    res.json(result);
  })
);

/** Download a single PDF containing every ticket in the order. */
ordersRouter.get(
  "/:orderNumber/pdf",
  asyncHandler(async (req, res) => {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("id, status")
      .eq("order_number", req.params.orderNumber)
      .single();
    if (!order) throw new AppError(404, "Order not found.");
    if (order.status !== "paid") throw new AppError(409, "Order is not paid yet.");

    const ok = await streamOrderPdf(order.id, res);
    if (!ok) throw new AppError(404, "No tickets found for this order.");
  })
);
