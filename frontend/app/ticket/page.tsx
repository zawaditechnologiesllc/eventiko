"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, Download, AlertCircle, Loader2 } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { TicketPreview } from "@/components/ticket/ticket-preview";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/utils";

export default function TicketLookupPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<{ order: any; tickets: any[] } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setData(null);
    setLoading(true);
    try {
      const res = await api.getOrder(orderNumber.trim(), email.trim());
      if (!res.order) throw new Error("Order not found.");
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't find that order.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="container-page flex h-16 items-center justify-between">
          <Logo />
          <Link href="/events" className="text-sm font-semibold text-slate-600 hover:text-slate-900">
            Browse events
          </Link>
        </div>
      </header>

      <div className="container-page py-12">
        <div className="mx-auto max-w-xl text-center">
          <h1 className="font-display text-3xl font-extrabold tracking-tight text-slate-900">
            Find my tickets
          </h1>
          <p className="mt-2 text-slate-500">
            Enter your order number and the email you used at checkout.
          </p>
        </div>

        <form onSubmit={onSubmit} className="card mx-auto mt-8 max-w-xl space-y-4 p-6">
          {error && (
            <div className="flex items-start gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          <div>
            <label className="label" htmlFor="order">Order number</label>
            <input
              id="order"
              required
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              className="input font-mono uppercase"
              placeholder="EVK-ORD-XXXXXX"
            />
          </div>
          <div>
            <label className="label" htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input"
              placeholder="you@email.com"
            />
          </div>
          <Button type="submit" loading={loading} size="lg" className="w-full">
            {!loading && <Search className="h-4 w-4" />}
            Find tickets
          </Button>
        </form>

        {loading && (
          <div className="mt-10 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
          </div>
        )}

        {data?.order && (
          <div className="mx-auto mt-10 max-w-5xl">
            <div className="card mb-6 flex flex-col items-start justify-between gap-3 p-6 sm:flex-row sm:items-center">
              <div>
                <p className="font-mono text-lg font-bold text-slate-900">{data.order.order_number}</p>
                <p className="text-sm text-slate-500">
                  {data.tickets.length} tickets · {formatMoney(data.order.total ?? 0, data.order.currency ?? "EUR")}
                </p>
              </div>
              <a
                href={api.orderPdfUrl(data.order.order_number)}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
              >
                <Download className="h-4 w-4" /> Download all (PDF)
              </a>
            </div>
            <div className="grid gap-8 sm:grid-cols-2">
              {data.tickets.map((t) => (
                <div key={t.id} className="space-y-3">
                  <TicketPreview
                    data={{
                      eventTitle: data.order.event?.title ?? "Event",
                      ticketTypeName: t.ticket_type_name ?? "General",
                      venue: data.order.event?.venue_name,
                      city: data.order.event?.city,
                      country: data.order.event?.country,
                      startsAt: data.order.event?.starts_at,
                      holderName: t.holder_name ?? data.order.buyer_name,
                      reference: t.reference_number,
                      price: t.price,
                      currency: t.currency ?? data.order.currency,
                      qrDataUrl: t.qr_data_url,
                      design: t.design,
                      organizer: data.order.event?.title,
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
          </div>
        )}
      </div>
    </div>
  );
}
