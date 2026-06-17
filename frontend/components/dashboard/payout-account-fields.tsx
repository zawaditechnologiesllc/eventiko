"use client";

import { PAYOUT_METHODS } from "@/lib/constants";
import type { PayoutMethod } from "@/lib/types";

export interface PayoutAccountDraft {
  method: PayoutMethod;
  label: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  iban: string;
  swift: string;
  routing_number: string;
  paypal_email: string;
  other_details: string;
  currency: string;
  is_primary: boolean;
}

export function emptyPayoutAccount(): PayoutAccountDraft {
  return {
    method: "bank",
    label: "",
    account_name: "",
    account_number: "",
    bank_name: "",
    iban: "",
    swift: "",
    routing_number: "",
    paypal_email: "",
    other_details: "",
    currency: "EUR",
    is_primary: false,
  };
}

const CURRENCIES = ["EUR", "GBP", "USD"];

/**
 * Conditional field block for a single payout account. Field set depends on the
 * chosen method (bank / paypal / other). Fully controlled.
 */
export function PayoutAccountFields({
  value,
  onChange,
}: {
  value: PayoutAccountDraft;
  onChange: (next: PayoutAccountDraft) => void;
}) {
  function set<K extends keyof PayoutAccountDraft>(key: K, v: PayoutAccountDraft[K]) {
    onChange({ ...value, [key]: v });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Method</label>
          <select
            className="input"
            value={value.method}
            onChange={(e) => set("method", e.target.value as PayoutMethod)}
          >
            {PAYOUT_METHODS.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label">Payout currency</label>
          <select
            className="input"
            value={value.currency}
            onChange={(e) => set("currency", e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="label">Account holder name</label>
        <input
          className="input"
          value={value.account_name}
          onChange={(e) => set("account_name", e.target.value)}
          placeholder="Name on the account"
        />
      </div>

      {value.method === "bank" || value.method === "wise" ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="label">Bank name</label>
            <input
              className="input"
              value={value.bank_name}
              onChange={(e) => set("bank_name", e.target.value)}
              placeholder="e.g. Revolut Bank"
            />
          </div>
          <div>
            <label className="label">IBAN / Account number</label>
            <input
              className="input"
              value={value.iban}
              onChange={(e) => set("iban", e.target.value)}
              placeholder="IBAN preferred"
            />
          </div>
          <div>
            <label className="label">SWIFT / BIC</label>
            <input
              className="input"
              value={value.swift}
              onChange={(e) => set("swift", e.target.value)}
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="label">Routing number</label>
            <input
              className="input"
              value={value.routing_number}
              onChange={(e) => set("routing_number", e.target.value)}
              placeholder="Optional (US accounts)"
            />
          </div>
        </div>
      ) : value.method === "paypal" ? (
        <div>
          <label className="label">PayPal email</label>
          <input
            type="email"
            className="input"
            value={value.paypal_email}
            onChange={(e) => set("paypal_email", e.target.value)}
            placeholder="you@example.com"
          />
        </div>
      ) : (
        <div>
          <label className="label">
            {value.method === "mpesa"
              ? "M-Pesa phone number"
              : value.method === "crypto"
                ? "Wallet address (USDT)"
                : "Payout details"}
          </label>
          <textarea
            className="input min-h-[80px]"
            value={value.other_details}
            onChange={(e) => set("other_details", e.target.value)}
            placeholder={
              value.method === "mpesa"
                ? "+254 7XX XXX XXX"
                : value.method === "crypto"
                  ? "Network + wallet address"
                  : "How we should pay you"
            }
          />
        </div>
      )}

      <div>
        <label className="label">Label (optional)</label>
        <input
          className="input"
          value={value.label}
          onChange={(e) => set("label", e.target.value)}
          placeholder="e.g. Main business account"
        />
      </div>
    </div>
  );
}
