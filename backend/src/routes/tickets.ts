import { Router } from "express";
import { supabaseAdmin } from "../lib/supabase";
import { asyncHandler, AppError } from "../lib/http";
import { streamTicketPdf } from "../lib/pdf";
import { qrDataUrl } from "../lib/qr";

export const ticketsRouter = Router();

/** Download a single ticket as a PDF. */
ticketsRouter.get(
  "/:ticketId/pdf",
  asyncHandler(async (req, res) => {
    const ok = await streamTicketPdf(req.params.ticketId, res);
    if (!ok) throw new AppError(404, "Ticket not found.");
  })
);

/** Return a ticket's QR as a PNG data URL (used as an image fallback). */
ticketsRouter.get(
  "/:ticketId/qr",
  asyncHandler(async (req, res) => {
    const { data: ticket } = await supabaseAdmin
      .from("tickets")
      .select("qr_token")
      .eq("id", req.params.ticketId)
      .single();
    if (!ticket) throw new AppError(404, "Ticket not found.");
    res.json({ qr: await qrDataUrl(ticket.qr_token) });
  })
);
