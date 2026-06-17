import { Router } from "express";
import { stripe } from "../lib/stripe";
import { supabaseAdmin } from "../lib/supabase";
import { generateOrderNumber } from "../lib/ids";
import { asyncHandler, AppError } from "../lib/http";
import { config } from "../config";

export const checkoutRouter = Router();

interface CartItem {
  ticketTypeId: string;
  quantity: number;
}

checkoutRouter.post(
  "/",
  asyncHandler(async (req, res) => {
    const { eventId, items, buyer } = req.body as {
      eventId?: string;
      items?: CartItem[];
      buyer?: { name?: string; email?: string; phone?: string };
    };

    if (!eventId || !Array.isArray(items) || items.length === 0) {
      throw new AppError(400, "eventId and at least one item are required.");
    }
    if (!buyer?.email || !/^\S+@\S+\.\S+$/.test(buyer.email)) {
      throw new AppError(400, "A valid buyer email is required.");
    }

    // Load the event and confirm it is on sale.
    const { data: event } = await supabaseAdmin
      .from("events")
      .select("id, title, status, seller_id")
      .eq("id", eventId)
      .single();
    if (!event || event.status !== "published") {
      throw new AppError(404, "Event is not available for purchase.");
    }

    // Load the requested ticket types and validate them.
    const ids = items.map((i) => i.ticketTypeId);
    const { data: types } = await supabaseAdmin
      .from("ticket_types")
      .select("*")
      .in("id", ids)
      .eq("event_id", eventId);

    if (!types || types.length !== ids.length) {
      throw new AppError(400, "One or more ticket types are invalid.");
    }

    const now = Date.now();
    let subtotal = 0;
    let currency = "EUR";
    const lineItems: any[] = [];
    const orderItems: any[] = [];

    for (const item of items) {
      const tt = types.find((t) => t.id === item.ticketTypeId)!;
      const qty = Math.max(1, Math.floor(item.quantity));

      if (!tt.is_active) throw new AppError(400, `"${tt.name}" is not on sale.`);
      if (tt.sale_ends_at && new Date(tt.sale_ends_at).getTime() < now) {
        throw new AppError(400, `Sales for "${tt.name}" have ended.`);
      }
      if (tt.sale_starts_at && new Date(tt.sale_starts_at).getTime() > now) {
        throw new AppError(400, `Sales for "${tt.name}" have not started yet.`);
      }
      if (qty > tt.max_per_order) {
        throw new AppError(400, `Maximum ${tt.max_per_order} per order for "${tt.name}".`);
      }
      const remaining = tt.quantity - tt.sold;
      if (qty > remaining) {
        throw new AppError(400, `Only ${Math.max(0, remaining)} left for "${tt.name}".`);
      }

      currency = tt.currency || currency;
      subtotal += tt.price * qty;

      orderItems.push({
        ticket_type_id: tt.id,
        ticket_type_name: tt.name,
        unit_price: tt.price,
        quantity: qty,
      });

      if (tt.price > 0) {
        lineItems.push({
          quantity: qty,
          price_data: {
            currency: currency.toLowerCase(),
            unit_amount: Math.round(tt.price * 100),
            product_data: {
              name: `${event.title} — ${tt.name}`,
              description: tt.description || undefined,
            },
          },
        });
      }
    }

    // Platform fee (8% by default) is charged to the seller, deducted from payout.
    const { data: settings } = await supabaseAdmin
      .from("settings")
      .select("platform_fee_rate")
      .eq("id", 1)
      .single();
    const feeRate = settings?.platform_fee_rate ?? 8;
    const platformFee = Math.round(subtotal * feeRate) / 100;

    const orderNumber = generateOrderNumber();

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        order_number: orderNumber,
        event_id: eventId,
        seller_id: event.seller_id,
        buyer_email: buyer.email,
        buyer_name: buyer.name || null,
        buyer_phone: buyer.phone || null,
        currency,
        subtotal,
        platform_fee: platformFee,
        platform_fee_rate: feeRate,
        total: subtotal,
        status: "pending",
      })
      .select("id")
      .single();
    if (orderErr || !order) throw new AppError(500, "Could not create order.");

    await supabaseAdmin
      .from("order_items")
      .insert(orderItems.map((oi) => ({ ...oi, order_id: order.id })));

    // Free tickets: skip Stripe entirely and confirm immediately.
    if (subtotal === 0 || lineItems.length === 0) {
      const { finalizeOrder } = await import("../services/ticketing");
      await finalizeOrder(order.id);
      return res.json({
        url: `${config.frontendUrl}/checkout/success?order=${orderNumber}`,
        orderNumber,
        free: true,
      });
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      customer_email: buyer.email,
      success_url: `${config.frontendUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.frontendUrl}/checkout/cancel`,
      metadata: { orderId: order.id, orderNumber },
      payment_intent_data: {
        description: `Eventiko order ${orderNumber} — ${event.title}`,
        metadata: { orderId: order.id, orderNumber },
      },
    });

    await supabaseAdmin
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    res.json({ url: session.url, orderNumber });
  })
);
