import PDFDocument from "pdfkit";
import { Response } from "express";
import { supabaseAdmin } from "./supabase";
import { qrBuffer } from "./qr";

interface PdfTicket {
  eventTitle: string;
  ticketTypeName: string;
  venue?: string | null;
  city?: string | null;
  country?: string | null;
  startsAt?: string | null;
  holderName?: string | null;
  reference: string;
  price?: number | null;
  currency?: string;
  organizer?: string | null;
  design: any;
  qr: Buffer;
}

function fmtMoney(amount?: number | null, currency = "EUR") {
  if (amount == null) return "";
  try {
    return new Intl.NumberFormat("en-GB", { style: "currency", currency }).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(2)}`;
  }
}

function fmtDate(d?: string | null) {
  if (!d) return "Date to be announced";
  return new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(d));
}

/** Draw a single ticket onto the current page of the document. */
function drawTicket(doc: PDFKit.PDFDocument, t: PdfTicket) {
  const design = t.design || {};
  const primary = design.primaryColor || "#7C3AED";
  const accent = design.accentColor || "#EC4899";
  const textColor = "#0B0A1A";

  const margin = 48;
  const cardX = margin;
  const cardW = doc.page.width - margin * 2;
  const cardY = 60;
  const radius = 18;

  // Card background
  doc.save();
  doc.roundedRect(cardX, cardY, cardW, 640, radius).fill("#ffffff");
  doc.restore();

  // Header band with brand gradient
  const headerH = 140;
  doc.save();
  doc.roundedRect(cardX, cardY, cardW, headerH, radius).clip();
  const grad = doc.linearGradient(cardX, cardY, cardX + cardW, cardY + headerH);
  grad.stop(0, primary).stop(1, accent);
  doc.rect(cardX, cardY, cardW, headerH).fill(grad);
  doc.restore();

  doc.fillColor("#ffffff");
  doc.fontSize(11).font("Helvetica-Bold").text((t.organizer || "EVENTIKO").toUpperCase(), cardX + 28, cardY + 26, { characterSpacing: 1.5 });
  doc.fontSize(24).font("Helvetica-Bold").text(t.eventTitle, cardX + 28, cardY + 50, { width: cardW - 56, lineGap: 2 });

  // Ticket type pill
  const pillText = t.ticketTypeName;
  doc.fontSize(11).font("Helvetica-Bold");
  const pillW = doc.widthOfString(pillText) + 24;
  doc.roundedRect(cardX + cardW - pillW - 24, cardY + 24, pillW, 24, 12).fill("#ffffff");
  doc.fillColor(primary).text(pillText, cardX + cardW - pillW - 24, cardY + 31, { width: pillW, align: "center" });

  // Dashed perforation
  const perfY = cardY + headerH + 26;
  doc.save();
  doc.moveTo(cardX + 24, perfY).lineTo(cardX + cardW - 24, perfY).dash(4, { space: 4 }).strokeColor("#d7d3e6").lineWidth(1.2).stroke();
  doc.restore();
  doc.circle(cardX, perfY, 12).fill("#f1f5f9");
  doc.circle(cardX + cardW, perfY, 12).fill("#f1f5f9");

  // Details grid
  const detailY = perfY + 28;
  const col1 = cardX + 28;
  const col2 = cardX + cardW / 2 + 8;
  const label = (x: number, y: number, l: string) => {
    doc.fillColor(accent).fontSize(8.5).font("Helvetica-Bold").text(l.toUpperCase(), x, y, { characterSpacing: 1 });
  };
  const value = (x: number, y: number, v: string, w: number) => {
    doc.fillColor(textColor).fontSize(12).font("Helvetica-Bold").text(v, x, y + 12, { width: w });
  };

  label(col1, detailY, "Date & time");
  value(col1, detailY, fmtDate(t.startsAt), cardW / 2 - 40);
  label(col2, detailY, "Venue");
  value(col2, detailY, [t.venue, t.city, t.country].filter(Boolean).join(", ") || "TBA", cardW / 2 - 40);

  const detailY2 = detailY + 56;
  label(col1, detailY2, "Holder");
  value(col1, detailY2, t.holderName || "Bearer", cardW / 2 - 40);
  label(col2, detailY2, "Reference");
  doc.fillColor(textColor).fontSize(13).font("Courier-Bold").text(t.reference, col2, detailY2 + 12, { width: cardW / 2 - 40 });

  // QR block
  const qrSize = 150;
  const qrY = detailY2 + 60;
  const qrX = cardX + (cardW - qrSize) / 2;
  doc.roundedRect(qrX - 14, qrY - 14, qrSize + 28, qrSize + 28, 14).fill("#f8fafc");
  doc.image(t.qr, qrX, qrY, { width: qrSize, height: qrSize });

  doc.fillColor("#64748b").fontSize(10).font("Helvetica").text(
    "Scan this QR code at the door. Keep the reference number as a backup.",
    cardX + 28,
    qrY + qrSize + 6,
    { width: cardW - 56, align: "center" }
  );

  // Perks
  let cursorY = qrY + qrSize + 36;
  const perks: string[] = (design.perks || []).filter(Boolean);
  if (perks.length) {
    doc.fillColor(accent).fontSize(8.5).font("Helvetica-Bold").text("INCLUDES", col1, cursorY, { characterSpacing: 1 });
    cursorY += 14;
    doc.fillColor(textColor).fontSize(10).font("Helvetica").text(perks.join("  •  "), col1, cursorY, { width: cardW - 56 });
    cursorY += 22;
  }

  // Terms
  if (design.terms) {
    doc.fillColor("#94a3b8").fontSize(8).font("Helvetica").text(design.terms, col1, cursorY, { width: cardW - 56 });
  }

  // Footer
  const footerY = cardY + 600;
  doc.fillColor("#94a3b8").fontSize(9).font("Helvetica").text("Powered by Eventiko", cardX + 28, footerY);
  if (t.price != null) {
    doc.font("Helvetica-Bold").fillColor("#64748b").text(fmtMoney(t.price, t.currency), cardX + 28, footerY, { width: cardW - 56, align: "right" });
  }
}

async function loadPdfTickets(filter: { orderId?: string; ticketId?: string }): Promise<{ tickets: PdfTicket[]; orderNumber: string } | null> {
  let query = supabaseAdmin
    .from("tickets")
    .select(
      "id, reference_number, holder_name, qr_token, order:orders(order_number, currency), event:events(title, venue_name, city, country, starts_at, seller:sellers(business_name)), ticket_type:ticket_types(name, price, currency, design)"
    );
  if (filter.orderId) query = query.eq("order_id", filter.orderId);
  if (filter.ticketId) query = query.eq("id", filter.ticketId);

  const { data } = await query.order("created_at", { ascending: true });
  if (!data || !data.length) return null;

  const one = <T,>(v: T | T[]): T => (Array.isArray(v) ? v[0] : v);

  const tickets: PdfTicket[] = await Promise.all(
    data.map(async (t: any) => {
      const ev = one(t.event);
      const tt = one(t.ticket_type);
      const seller = ev ? one(ev.seller) : null;
      return {
        eventTitle: ev?.title ?? "Event",
        ticketTypeName: tt?.name ?? "General",
        venue: ev?.venue_name,
        city: ev?.city,
        country: ev?.country,
        startsAt: ev?.starts_at,
        holderName: t.holder_name,
        reference: t.reference_number,
        price: tt?.price,
        currency: tt?.currency || one(t.order)?.currency || "EUR",
        organizer: seller?.business_name,
        design: tt?.design ?? {},
        qr: await qrBuffer(t.qr_token),
      };
    })
  );

  return { tickets, orderNumber: one(data[0].order)?.order_number ?? "tickets" };
}

export async function streamOrderPdf(orderId: string, res: Response): Promise<boolean> {
  const loaded = await loadPdfTickets({ orderId });
  if (!loaded) return false;
  streamPdf(loaded.tickets, `eventiko-${loaded.orderNumber}.pdf`, res);
  return true;
}

export async function streamTicketPdf(ticketId: string, res: Response): Promise<boolean> {
  const loaded = await loadPdfTickets({ ticketId });
  if (!loaded) return false;
  streamPdf(loaded.tickets, `eventiko-ticket-${loaded.tickets[0].reference}.pdf`, res);
  return true;
}

function streamPdf(tickets: PdfTicket[], filename: string, res: Response) {
  const doc = new PDFDocument({ size: "A4", margin: 0 });
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  doc.pipe(res);
  tickets.forEach((t, i) => {
    if (i > 0) doc.addPage();
    drawTicket(doc, t);
  });
  doc.end();
}
