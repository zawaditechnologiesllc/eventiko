// Typed client for the Eventiko backend (Render service).

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
    cache: "no-store",
  });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      message = body.error || body.message || message;
    } catch {
      /* ignore */
    }
    throw new Error(message);
  }
  return res.json() as Promise<T>;
}

export interface CartItem {
  ticketTypeId: string;
  quantity: number;
}

export const api = {
  /** Create a Stripe Checkout session and return the redirect URL. */
  createCheckout(payload: {
    eventId: string;
    items: CartItem[];
    buyer: { name: string; email: string; phone?: string };
  }) {
    return request<{ url: string; orderNumber: string }>(
      "/api/checkout",
      { method: "POST", body: JSON.stringify(payload) }
    );
  },

  /** Look up a completed order + its issued tickets (post-purchase page). */
  getOrder(orderNumber: string, email?: string) {
    const q = email ? `?email=${encodeURIComponent(email)}` : "";
    return request<{ order: any; tickets: any[] }>(
      `/api/orders/${orderNumber}${q}`
    );
  },

  /** Resolve order from a Stripe checkout session id (success page). */
  getOrderBySession(sessionId: string) {
    return request<{ order: any; tickets: any[] }>(
      `/api/orders/session/${sessionId}`
    );
  },

  /** Download URL for a ticket PDF. */
  ticketPdfUrl(ticketId: string) {
    return `${API_URL}/api/tickets/${ticketId}/pdf`;
  },

  /** Download URL for an entire order's tickets (single PDF). */
  orderPdfUrl(orderNumber: string) {
    return `${API_URL}/api/orders/${orderNumber}/pdf`;
  },

  /** Create a Stripe Checkout session to pay for an event promotion. */
  createPromotionCheckout(
    payload: { eventId: string; planId: string },
    accessToken: string
  ) {
    return request<{ url: string; promotionId: string }>("/api/promotions/checkout", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    });
  },

  /** Validate a scanned QR token (seller scanner). Requires bearer token. */
  validateTicket(payload: { token?: string; reference?: string; eventId: string }, accessToken: string) {
    return request<{
      result: "valid" | "already_used" | "invalid" | "expired" | "wrong_event";
      ticket?: any;
      message: string;
    }>("/api/scan/validate", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(payload),
    });
  },
};

export const apiUrl = API_URL;
