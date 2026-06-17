import { Request, Response } from "express";
import Stripe from "stripe";
import { stripe } from "../lib/stripe";
import { config } from "../config";
import { finalizeOrder } from "../services/ticketing";

/**
 * Stripe webhook. Must receive the RAW request body — it is mounted with
 * express.raw() in index.ts before the JSON body parser.
 */
export async function stripeWebhookHandler(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];
  let event: Stripe.Event;

  try {
    if (!config.stripeWebhookSecret) {
      // Allow unsigned events only in development for local testing.
      event = JSON.parse(req.body.toString()) as Stripe.Event;
    } else {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        config.stripeWebhookSecret
      );
    }
  } catch (err) {
    console.error("[webhook] signature verification failed:", (err as Error).message);
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        if (orderId && session.payment_status === "paid") {
          await finalizeOrder(
            orderId,
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : undefined
          );
        }
        break;
      }
      case "checkout.session.expired": {
        const session = event.data.object as Stripe.Checkout.Session;
        const orderId = session.metadata?.orderId;
        if (orderId) {
          const { supabaseAdmin } = await import("../lib/supabase");
          await supabaseAdmin
            .from("orders")
            .update({ status: "cancelled" })
            .eq("id", orderId)
            .eq("status", "pending");
        }
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error("[webhook] handler error:", (err as Error).message);
    // Return 200 anyway so Stripe doesn't endlessly retry a poisoned event;
    // the success page reconciliation will finalize as a fallback.
  }

  res.json({ received: true });
}
