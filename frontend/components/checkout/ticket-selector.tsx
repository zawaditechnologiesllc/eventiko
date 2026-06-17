"use client";

import { useMemo, useState } from "react";
import { Minus, Plus, ShieldCheck, Ticket, AlertCircle, Lock, QrCode } from "lucide-react";
import { api } from "@/lib/api";
import { formatMoney } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { EventRecord, TicketType } from "@/lib/types";

interface AvailabilityInfo {
  type: TicketType;
  remaining: number;
  saleEnded: boolean;
  saleNotStarted: boolean;
  soldOut: boolean;
  buyable: boolean;
  maxSelectable: number;
}

function getAvailability(type: TicketType): AvailabilityInfo {
  const now = Date.now();
  const remaining = Math.max(0, (type.quantity || 0) - (type.sold || 0));
  const saleEnded = type.sale_ends_at ? new Date(type.sale_ends_at).getTime() < now : false;
  const saleNotStarted = type.sale_starts_at
    ? new Date(type.sale_starts_at).getTime() > now
    : false;
  const soldOut = remaining <= 0;
  const buyable = type.is_active && !saleEnded && !saleNotStarted && !soldOut;
  const maxPerOrder = type.max_per_order && type.max_per_order > 0 ? type.max_per_order : 10;
  const maxSelectable = Math.min(remaining, maxPerOrder);
  return { type, remaining, saleEnded, saleNotStarted, soldOut, buyable, maxSelectable };
}

export function TicketSelector({ event }: { event: EventRecord }) {
  const ticketTypes = useMemo(
    () =>
      (event.ticket_types || [])
        .slice()
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [event.ticket_types]
  );

  const availability = useMemo(() => ticketTypes.map(getAvailability), [ticketTypes]);
  const anyBuyable = availability.some((a) => a.buyable);

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [buyer, setBuyer] = useState({ name: "", email: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const currency = ticketTypes[0]?.currency || event.ticket_types?.[0]?.currency || "EUR";

  const lineItems = useMemo(
    () =>
      availability
        .map((a) => ({ ...a, quantity: quantities[a.type.id] || 0 }))
        .filter((a) => a.quantity > 0),
    [availability, quantities]
  );

  const subtotal = useMemo(
    () => lineItems.reduce((sum, item) => sum + item.type.price * item.quantity, 0),
    [lineItems]
  );

  const totalTickets = lineItems.reduce((sum, item) => sum + item.quantity, 0);

  function setQty(id: string, next: number, max: number) {
    const clamped = Math.max(0, Math.min(next, max));
    setQuantities((prev) => ({ ...prev, [id]: clamped }));
    setError(null);
  }

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyer.email.trim());
  const canCheckout = totalTickets > 0 && buyer.name.trim().length > 0 && emailValid;

  async function checkout() {
    setTouched(true);
    setError(null);
    if (totalTickets === 0) {
      setError("Please add at least one ticket.");
      return;
    }
    if (!buyer.name.trim() || !emailValid) {
      setError("Please enter your name and a valid email address.");
      return;
    }

    setLoading(true);
    try {
      const res = await api.createCheckout({
        eventId: event.id,
        items: lineItems.map((item) => ({
          ticketTypeId: item.type.id,
          quantity: item.quantity,
        })),
        buyer: {
          name: buyer.name.trim(),
          email: buyer.email.trim(),
          phone: buyer.phone.trim() || undefined,
        },
      });
      window.location.href = res.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  if (!ticketTypes.length || !anyBuyable) {
    return (
      <div className="card p-6">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-500">
            <Ticket className="h-5 w-5" />
          </span>
          <div>
            <h3 className="font-display text-lg font-bold text-slate-900">Tickets unavailable</h3>
            <p className="text-sm text-slate-500">
              {ticketTypes.length ? "Sales for this event are closed." : "No tickets on sale yet."}
            </p>
          </div>
        </div>
        <p className="mt-4 text-sm text-slate-500">
          Check back soon or follow the organizer for updates on new releases.
        </p>
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="border-b border-slate-100 bg-gradient-to-br from-brand-50 to-accent-50/50 px-6 py-5">
        <div className="flex items-center justify-between">
          <h3 className="font-display text-lg font-bold text-slate-900">Get your tickets</h3>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold text-emerald-600 ring-1 ring-emerald-100">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure
          </span>
        </div>
      </div>

      <div className="space-y-3 px-6 py-5">
        {availability.map((a) => (
          <TicketRow
            key={a.type.id}
            info={a}
            currency={currency}
            quantity={quantities[a.type.id] || 0}
            onChange={(next) => setQty(a.type.id, next, a.maxSelectable)}
          />
        ))}
      </div>

      <div className="space-y-4 border-t border-slate-100 px-6 py-5">
        <div>
          <label htmlFor="buyer-name" className="label">
            Full name
          </label>
          <input
            id="buyer-name"
            type="text"
            autoComplete="name"
            value={buyer.name}
            onChange={(e) => setBuyer((b) => ({ ...b, name: e.target.value }))}
            placeholder="Jane Doe"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="buyer-email" className="label">
            Email <span className="text-accent-500">*</span>
          </label>
          <input
            id="buyer-email"
            type="email"
            autoComplete="email"
            value={buyer.email}
            onChange={(e) => setBuyer((b) => ({ ...b, email: e.target.value }))}
            placeholder="you@email.com"
            className="input"
            aria-invalid={touched && !emailValid}
          />
          <p className="mt-1 text-xs text-slate-400">Your tickets will be sent here.</p>
        </div>
        <div>
          <label htmlFor="buyer-phone" className="label">
            Phone <span className="font-normal text-slate-400">(optional)</span>
          </label>
          <input
            id="buyer-phone"
            type="tel"
            autoComplete="tel"
            value={buyer.phone}
            onChange={(e) => setBuyer((b) => ({ ...b, phone: e.target.value }))}
            placeholder="+33 6 12 34 56 78"
            className="input"
          />
        </div>
      </div>

      <div className="border-t border-slate-100 px-6 py-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-sm text-slate-500">
              {totalTickets > 0
                ? `${totalTickets} ${totalTickets === 1 ? "ticket" : "tickets"}`
                : "Subtotal"}
            </p>
            <p className="font-display text-2xl font-extrabold text-slate-900">
              {formatMoney(subtotal, currency)}
            </p>
          </div>
          {subtotal === 0 && totalTickets > 0 && (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-600">
              Free
            </span>
          )}
        </div>

        {error && (
          <div
            role="alert"
            className="mt-4 flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-2.5 text-sm font-medium text-red-700"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          onClick={checkout}
          loading={loading}
          disabled={!canCheckout || loading}
          size="lg"
          className="mt-4 w-full"
        >
          {!loading && <Lock className="h-4 w-4" />}
          {loading ? "Redirecting to checkout…" : "Checkout securely"}
        </Button>

        <div className="mt-3 flex items-center justify-center gap-4 text-xs text-slate-400">
          <span className="inline-flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            Secured by Stripe
          </span>
          <span className="inline-flex items-center gap-1">
            <QrCode className="h-3.5 w-3.5 text-brand-500" />
            Instant QR ticket
          </span>
        </div>
      </div>
    </div>
  );
}

function TicketRow({
  info,
  currency,
  quantity,
  onChange,
}: {
  info: AvailabilityInfo;
  currency: string;
  quantity: number;
  onChange: (next: number) => void;
}) {
  const { type, buyable, soldOut, saleEnded, saleNotStarted, remaining, maxSelectable } = info;

  const statusLabel = soldOut
    ? "Sold out"
    : saleEnded
      ? "Sales ended"
      : saleNotStarted
        ? "Coming soon"
        : remaining <= 10
          ? `Only ${remaining} left`
          : null;

  return (
    <div
      className={`rounded-2xl border p-4 transition ${
        buyable ? "border-slate-200 hover:border-brand-200" : "border-slate-100 bg-slate-50/60"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-slate-900">{type.name}</p>
          {type.description && (
            <p className="mt-0.5 line-clamp-2 text-sm text-slate-500">{type.description}</p>
          )}
          <p className="mt-1.5 font-display text-lg font-bold text-brand-700">
            {type.price === 0 ? "Free" : formatMoney(type.price, type.currency || currency)}
          </p>
        </div>

        {buyable ? (
          <div className="flex shrink-0 items-center gap-1 rounded-xl bg-slate-50 p-1 ring-1 ring-slate-200">
            <button
              type="button"
              onClick={() => onChange(quantity - 1)}
              disabled={quantity <= 0}
              aria-label={`Remove one ${type.name}`}
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition hover:bg-white hover:text-brand-600 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-7 text-center text-sm font-bold tabular-nums text-slate-900">
              {quantity}
            </span>
            <button
              type="button"
              onClick={() => onChange(quantity + 1)}
              disabled={quantity >= maxSelectable}
              aria-label={`Add one ${type.name}`}
              className="grid h-9 w-9 place-items-center rounded-lg text-slate-600 transition hover:bg-white hover:text-brand-600 disabled:opacity-30 disabled:hover:bg-transparent"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <span className="shrink-0 rounded-full bg-slate-200 px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-500">
            {statusLabel || "Unavailable"}
          </span>
        )}
      </div>

      {buyable && statusLabel && (
        <p className="mt-2 text-xs font-semibold text-accent-600">{statusLabel}</p>
      )}
      {buyable && quantity >= maxSelectable && maxSelectable > 0 && (
        <p className="mt-2 text-xs text-slate-400">Max {maxSelectable} per order reached.</p>
      )}
    </div>
  );
}
