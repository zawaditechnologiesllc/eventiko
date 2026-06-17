import { Router } from "express";
import { stripe } from "../lib/stripe";
import { supabaseAdmin } from "../lib/supabase";
import { asyncHandler, AppError } from "../lib/http";
import { getUserFromRequest } from "../lib/auth";
import { config } from "../config";

export const promotionsRouter = Router();

/**
 * Seller pays to promote (pin) an event on the homepage. Creates a pending
 * promotion + a Stripe Checkout session. Once paid, an admin reviews and
 * activates it (which pins the event for the plan's duration).
 */
promotionsRouter.post(
  "/checkout",
  asyncHandler(async (req, res) => {
    const user = await getUserFromRequest(req);
    if (!user.sellerId) throw new AppError(403, "Only sellers can promote events.");

    const { eventId, planId } = req.body as { eventId?: string; planId?: string };
    if (!eventId || !planId) throw new AppError(400, "eventId and planId are required.");

    // Event must belong to this seller and be published.
    const { data: event } = await supabaseAdmin
      .from("events")
      .select("id, title, status, seller_id")
      .eq("id", eventId)
      .single();
    if (!event || event.seller_id !== user.sellerId) {
      throw new AppError(403, "You can only promote your own events.");
    }
    if (event.status !== "published") {
      throw new AppError(400, "Publish the event before promoting it.");
    }

    // Plan must exist and be active.
    const { data: plan } = await supabaseAdmin
      .from("promotion_plans")
      .select("*")
      .eq("id", planId)
      .eq("is_active", true)
      .single();
    if (!plan) throw new AppError(404, "Promotion plan not available.");

    // Create the pending promotion record.
    const { data: promo, error: promoErr } = await supabaseAdmin
      .from("event_promotions")
      .insert({
        event_id: eventId,
        seller_id: user.sellerId,
        plan_id: plan.id,
        plan_name: plan.name,
        placement: plan.placement,
        duration_days: plan.duration_days,
        amount: plan.price,
        currency: plan.currency,
        status: "pending_payment",
      })
      .select("id")
      .single();
    if (promoErr || !promo) throw new AppError(500, "Could not create the promotion.");

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: (plan.currency || "EUR").toLowerCase(),
            unit_amount: Math.round(plan.price * 100),
            product_data: {
              name: `Promotion — ${plan.name}`,
              description: `Homepage spotlight for "${event.title}" (${plan.duration_days} days)`,
            },
          },
        },
      ],
      customer_email: user.email,
      success_url: `${config.frontendUrl}/dashboard/promote?status=success`,
      cancel_url: `${config.frontendUrl}/dashboard/promote?status=cancel`,
      metadata: { type: "promotion", promotionId: promo.id },
      payment_intent_data: {
        description: `Eventiko promotion ${plan.name} — ${event.title}`,
        metadata: { type: "promotion", promotionId: promo.id },
      },
    });

    await supabaseAdmin
      .from("event_promotions")
      .update({ stripe_session_id: session.id })
      .eq("id", promo.id);

    res.json({ url: session.url, promotionId: promo.id });
  })
);
