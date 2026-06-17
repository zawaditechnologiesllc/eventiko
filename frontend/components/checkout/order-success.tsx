"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Download, Loader2, AlertCircle, Ticket as TicketIcon, Mail } from "lucide-react";
import { api } from "@/lib/api";
import { ButtonLink } from "@/components/ui/button";
import { TicketPreview } from "@/components/ticket/ticket-preview";
import { formatMoney } from "@/lib/utils";

interface OrderData {
  order: any;
  tickets: any[];
}

export function OrderSuccess() {
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const orderNumber = params.get("order");

  const [data, setData] = useState<OrderData | null>(null);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">("loading");
  const tries = useRef(0);

  const poll = useCallback(async () => {
    try {
      const res = sessionId
        ? await api.getOrderBySession(sessionId)
        : orderNumber
          ? await api.getOrder(orderNumber)
          : null;

      if (!res) {
        setPhase("error");
        return;
      }

      const paid = res.order?.status === "paid" && (res.tickets?.length ?? 0) > 0;
      if (paid) {
        setData(res);
        setPhase("ready");
        return;
      }

      tries.current += 1;
      if (tries.current > 15) {
        setData(res);
        setPhase(res.order ? "ready" : "error");
        return;
      }
      setTimeout(poll, 2000);
    } catch {
      tries.current += 1;
      if (tries.current > 15) {
        setPhase("error");
        return;
      }
      setTimeout(poll, 2000);
    }
  }, [sessionId, orderNumber]);

  useEffect(() => {
    if (!sessionId && !orderNumber) {
      setPhase("error");
      return;
    }
    poll();
  }, [poll, sessionId, orderNumber]);

  if (phase === "loading") {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
        <h1 className="mt-6 font-display text-2xl font-bold text-slate-900">Confirming your payment…</h1>
        <p className="mt-2 max-w-md text-slate-500">
          Hang tight — we&apos;re generating your tickets. This only takes a few seconds.
        </p>
      </div>
    );
  }

  if (phase === "error" || !data?.order) {
    return (
      <div className="container-page flex min-h-[60vh] flex-col items-center justify-center text-center">
        <AlertCircle className="h-10 w-10 text-amber-500" />
        <h1 className="mt-6 font-display text-2xl font-bold text-slate-900">We couldn&apos;t load your tickets</h1>
        <p className="mt-2 max-w-md text-slate-500">
          Your payment may still be processing. You can look up your order any time using your order number and email.
        </p>
        <ButtonLink href="/ticket" className="mt-6">Look up my tickets</ButtonLink>
      </div>
    );
  }

  const { order, tickets } = data;
  const pending = order.status !== "paid";

  return (
    <div className="container-page py-12">
      <div className="mx-auto max-w-3xl text-center">
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
          {pending ? <Loader2 className="h-8 w-8 animate-spin" /> : <CheckCircle2 className="h-8 w-8" />}
        </span>
        <h1 className="mt-5 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {pending ? "Almost there…" : "You're going! 🎉"}
        </h1>
        <p className="mt-3 text-slate-500">
          {pending
            ? "Your payment is processing. Your tickets will appear here shortly — we've also emailed them to you."
            : `Your tickets for ${order.event?.title ?? "your event"} are confirmed and ready below.`}
        </p>
        <div className="mt-2 inline-flex items-center gap-2 rounded-full bg-slate-100 px-4 py-1.5 text-sm font-semibold text-slate-700">
          <Mail className="h-4 w-4 text-brand-500" />
          Sent to {order.buyer_email}
        </div>
      </div>

      {/* Order summary + download all */}
      <div className="mx-auto mt-8 max-w-3xl">
        <div className="card flex flex-col items-start justify-between gap-4 p-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Order</p>
            <p className="font-mono text-lg font-bold text-slate-900">{order.order_number}</p>
            <p className="mt-1 text-sm text-slate-500">
              {tickets.length} {tickets.length === 1 ? "ticket" : "tickets"} ·{" "}
              {formatMoney(order.total ?? 0, order.currency ?? "EUR")}
            </p>
          </div>
          {!pending && (
            <a
              href={api.orderPdfUrl(order.order_number)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary w-full sm:w-auto"
            >
              <Download className="h-4 w-4" /> Download all tickets (PDF)
            </a>
          )}
        </div>

        <div className="mt-4 rounded-2xl bg-amber-50 p-4 text-sm text-amber-800 ring-1 ring-amber-100">
          <strong>Keep your reference numbers.</strong> Show the QR code on your phone at the door. If your
          phone runs out of battery, the reference number below is accepted as a backup.
        </div>
      </div>

      {/* Tickets */}
      <div className="mx-auto mt-8 grid max-w-5xl gap-8 sm:grid-cols-2">
        {tickets.map((t) => (
          <div key={t.id} className="space-y-3">
            <TicketPreview
              data={{
                eventTitle: order.event?.title ?? "Event",
                ticketTypeName: t.ticket_type_name ?? "General",
                venue: order.event?.venue_name,
                city: order.event?.city,
                country: order.event?.country,
                startsAt: order.event?.starts_at,
                holderName: t.holder_name ?? order.buyer_name,
                reference: t.reference_number,
                price: t.price,
                currency: t.currency ?? order.currency,
                qrDataUrl: t.qr_data_url,
                design: t.design,
                organizer: order.event?.title,
              }}
            />
            <a
              href={api.ticketPdfUrl(t.id)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary w-full"
            >
              <Download className="h-4 w-4" /> Download this ticket
            </a>
          </div>
        ))}
      </div>

      <div className="mx-auto mt-12 flex max-w-3xl flex-col items-center gap-3 text-center">
        <TicketIcon className="h-6 w-6 text-brand-500" />
        <p className="text-sm text-slate-500">
          Discover more unforgettable events on Eventiko.
        </p>
        <Link href="/events" className="font-semibold text-brand-600 hover:underline">
          Browse more events →
        </Link>
      </div>
    </div>
  );
}
