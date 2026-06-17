import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { asyncHandler, AppError } from "../lib/http";
import { verifyTicketToken } from "../lib/ids";
import { getUserFromRequest, canManageEvent } from "../lib/auth";

export const scanRouter = Router();

type ScanResult = "valid" | "already_used" | "invalid" | "expired" | "wrong_event";

async function logScan(ticketId: string | null, eventId: string, userId: string, result: ScanResult) {
  await supabaseAdmin.from("scan_logs").insert({
    ticket_id: ticketId,
    event_id: eventId,
    scanned_by: userId,
    result,
  });
}

/**
 * Validate a scanned ticket (QR token or manual reference) for a given event.
 * Only the event's seller or an admin may scan. Marks the ticket as used on a
 * successful first scan (atomic — prevents double admission).
 */
scanRouter.post(
  "/validate",
  asyncHandler(async (req, res) => {
    const user = await getUserFromRequest(req);
    const { token, reference, eventId } = req.body as {
      token?: string;
      reference?: string;
      eventId?: string;
    };

    if (!eventId) throw new AppError(400, "eventId is required.");
    if (!token && !reference) throw new AppError(400, "A QR token or reference is required.");
    if (!(await canManageEvent(user, eventId))) {
      throw new AppError(403, "You are not allowed to scan tickets for this event.");
    }

    // Resolve the ticket.
    let ticketId: string | null = null;
    if (token) {
      const payload = verifyTicketToken(token);
      if (!payload) {
        await logScan(null, eventId, user.userId, "invalid");
        return res.json({ result: "invalid", message: "This QR code is not a valid Eventiko ticket." });
      }
      ticketId = payload.tid;
    }

    let query = supabaseAdmin
      .from("tickets")
      .select("id, status, event_id, scanned_at, holder_name, reference_number, ticket_type:ticket_types(name, sale_ends_at)");
    query = ticketId
      ? query.eq("id", ticketId)
      : query.eq("reference_number", (reference || "").trim().toUpperCase());

    const { data: ticket } = await query.maybeSingle();
    if (!ticket) {
      await logScan(null, eventId, user.userId, "invalid");
      return res.json({ result: "invalid", message: "Ticket not found." });
    }

    const tt = Array.isArray(ticket.ticket_type) ? ticket.ticket_type[0] : ticket.ticket_type;

    if (ticket.event_id !== eventId) {
      await logScan(ticket.id, eventId, user.userId, "wrong_event");
      return res.json({ result: "wrong_event", message: "This ticket is for a different event.", ticket: publicTicket(ticket, tt) });
    }

    if (ticket.status === "cancelled") {
      await logScan(ticket.id, eventId, user.userId, "invalid");
      return res.json({ result: "invalid", message: "This ticket has been cancelled.", ticket: publicTicket(ticket, tt) });
    }

    if (ticket.status === "used") {
      await logScan(ticket.id, eventId, user.userId, "already_used");
      return res.json({
        result: "already_used",
        message: `Already scanned${ticket.scanned_at ? " at " + new Date(ticket.scanned_at).toLocaleString("en-GB") : ""}.`,
        ticket: publicTicket(ticket, tt),
      });
    }

    // Expiry check (seller-defined ticket validity).
    if (tt?.sale_ends_at && new Date(tt.sale_ends_at).getTime() < Date.now()) {
      await logScan(ticket.id, eventId, user.userId, "expired");
      return res.json({ result: "expired", message: "This ticket has expired.", ticket: publicTicket(ticket, tt) });
    }

    // Atomic admit: only the first scan transitions valid -> used.
    const { data: admitted } = await supabaseAdmin
      .from("tickets")
      .update({
        status: "used",
        scanned_at: new Date().toISOString(),
        scanned_by: user.userId,
        scan_count: (ticket as any).scan_count ? (ticket as any).scan_count + 1 : 1,
      })
      .eq("id", ticket.id)
      .eq("status", "valid")
      .select("id")
      .maybeSingle();

    if (!admitted) {
      await logScan(ticket.id, eventId, user.userId, "already_used");
      return res.json({ result: "already_used", message: "Already scanned a moment ago.", ticket: publicTicket(ticket, tt) });
    }

    await logScan(ticket.id, eventId, user.userId, "valid");
    res.json({ result: "valid", message: "Valid ticket — admit entry.", ticket: publicTicket(ticket, tt) });
  })
);

function publicTicket(ticket: any, tt: any) {
  return {
    reference_number: ticket.reference_number,
    holder_name: ticket.holder_name,
    ticket_type_name: tt?.name ?? "General",
    scanned_at: ticket.scanned_at,
  };
}
