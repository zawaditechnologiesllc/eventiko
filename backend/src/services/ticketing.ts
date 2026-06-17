import { supabaseAdmin } from "../lib/supabase";
import { generateReference, signTicketToken } from "../lib/ids";
import { qrDataUrl } from "../lib/qr";
import { sendEmail, ticketEmailHtml } from "../lib/email";
import { config } from "../config";

/**
 * Issue individual tickets for a paid order. Idempotent: if tickets already
 * exist for the order, it does nothing.
 */
export async function issueTicketsForOrder(orderId: string): Promise<void> {
  const { data: existing } = await supabaseAdmin
    .from("tickets")
    .select("id")
    .eq("order_id", orderId)
    .limit(1);
  if (existing && existing.length > 0) return; // already issued

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("*, order_items(*)")
    .eq("id", orderId)
    .single();
  if (!order) throw new Error(`Order ${orderId} not found`);

  const rows: any[] = [];
  for (const item of order.order_items || []) {
    for (let i = 0; i < item.quantity; i++) {
      const reference = generateReference();
      // Placeholder token; replaced with a signed token once we know the row id.
      rows.push({
        order_id: order.id,
        event_id: order.event_id,
        ticket_type_id: item.ticket_type_id,
        reference_number: reference,
        qr_token: reference, // temporary, updated below
        holder_name: order.buyer_name,
        holder_email: order.buyer_email,
        status: "valid",
      });
    }
  }

  if (!rows.length) return;

  const { data: inserted, error } = await supabaseAdmin
    .from("tickets")
    .insert(rows)
    .select("id, reference_number, event_id");
  if (error) throw error;

  // Now sign a tamper-proof token per ticket and persist it.
  for (const t of inserted || []) {
    const token = signTicketToken({
      tid: t.id,
      ref: t.reference_number,
      eid: t.event_id,
    });
    await supabaseAdmin.from("tickets").update({ qr_token: token }).eq("id", t.id);
  }
}

/**
 * Atomically transition an order to "paid" and finalize it (issue tickets,
 * bump sold counts + seller balance, email the buyer). Safe to call multiple
 * times — only the first transition does the work.
 */
export async function finalizeOrder(
  orderId: string,
  paymentIntent?: string
): Promise<void> {
  // Atomic guard: only succeeds for the first caller.
  const { data: transitioned } = await supabaseAdmin
    .from("orders")
    .update({ status: "paid", stripe_payment_intent: paymentIntent || null })
    .eq("id", orderId)
    .neq("status", "paid")
    .select("*")
    .maybeSingle();

  if (!transitioned) {
    // Already finalized by another caller (webhook vs. success page race).
    return;
  }

  await issueTicketsForOrder(orderId);

  // Bump ticket_types.sold. Credit the seller's platform balance only for
  // manual-payout orders; Connect (direct payout) orders are paid by Stripe.
  const { error: rpcError } = await supabaseAdmin.rpc("finalize_paid_order", {
    p_order_id: orderId,
    p_credit_balance: !(transitioned as { direct_payout?: boolean }).direct_payout,
  });
  if (rpcError) console.error("[finalize] rpc error:", rpcError.message);

  // Fire-and-forget confirmation email.
  void sendConfirmationEmail(orderId);
}

async function sendConfirmationEmail(orderId: string): Promise<void> {
  try {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("order_number, buyer_name, buyer_email, event:events(title)")
      .eq("id", orderId)
      .single();
    if (!order) return;

    const { data: tickets } = await supabaseAdmin
      .from("tickets")
      .select("reference_number")
      .eq("order_id", orderId);

    const event = Array.isArray(order.event) ? order.event[0] : order.event;

    await sendEmail({
      to: order.buyer_email,
      subject: `🎟️ Your tickets for ${event?.title ?? "your event"}`,
      html: ticketEmailHtml({
        buyerName: order.buyer_name || "",
        eventTitle: event?.title ?? "your event",
        orderNumber: order.order_number,
        references: (tickets || []).map((t) => t.reference_number),
        downloadUrl: `${config.frontendUrl}/checkout/success?order=${order.order_number}`,
      }),
    });
  } catch (err) {
    console.error("[email] confirmation failed:", (err as Error).message);
  }
}

/**
 * Build the API response (order + enriched tickets with QR data URLs) consumed
 * by the frontend success / lookup pages.
 */
export async function buildOrderResponse(orderId: string) {
  const { data: order } = await supabaseAdmin
    .from("orders")
    .select(
      "order_number, buyer_name, buyer_email, currency, subtotal, total, status, created_at, event:events(title, slug, venue_name, city, country, starts_at, cover_image_url)"
    )
    .eq("id", orderId)
    .single();
  if (!order) return null;

  const { data: tickets } = await supabaseAdmin
    .from("tickets")
    .select(
      "id, reference_number, holder_name, status, qr_token, ticket_type:ticket_types(name, price, currency, design)"
    )
    .eq("order_id", orderId)
    .order("created_at", { ascending: true });

  const enriched = await Promise.all(
    (tickets || []).map(async (t: any) => {
      const tt = Array.isArray(t.ticket_type) ? t.ticket_type[0] : t.ticket_type;
      return {
        id: t.id,
        reference_number: t.reference_number,
        holder_name: t.holder_name,
        status: t.status,
        ticket_type_name: tt?.name ?? "General",
        price: tt?.price ?? 0,
        currency: tt?.currency ?? order.currency,
        design: tt?.design ?? {},
        qr_data_url: await qrDataUrl(t.qr_token),
      };
    })
  );

  const event = Array.isArray(order.event) ? order.event[0] : order.event;
  return { order: { ...order, event }, tickets: enriched };
}
