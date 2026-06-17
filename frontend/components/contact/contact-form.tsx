"use client";

import { useState } from "react";
import { Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContactForm({ supportEmail }: { supportEmail: string }) {
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [submitted, setSubmitted] = useState(false);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const subject = form.subject.trim() || `Message from ${form.name || "a visitor"}`;
    const body = `Name: ${form.name}\nEmail: ${form.email}\n\n${form.message}`;
    const href = `mailto:${supportEmail}?subject=${encodeURIComponent(
      subject
    )}&body=${encodeURIComponent(body)}`;
    setSubmitted(true);
    window.location.href = href;
  }

  if (submitted) {
    return (
      <div className="card grid place-items-center p-10 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
          <CheckCircle2 className="h-7 w-7" />
        </span>
        <h3 className="mt-5 font-display text-xl font-bold text-slate-900">Opening your email…</h3>
        <p className="mt-2 max-w-sm text-slate-500">
          We&apos;ve prepared a message in your email app. If nothing opened, write to us directly at{" "}
          <a href={`mailto:${supportEmail}`} className="font-semibold text-brand-600 hover:underline">
            {supportEmail}
          </a>
          .
        </p>
        <Button variant="ghost" className="mt-6" onClick={() => setSubmitted(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="card space-y-4 p-6 sm:p-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="c-name" className="label">
            Your name
          </label>
          <input
            id="c-name"
            type="text"
            required
            autoComplete="name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            placeholder="Jane Doe"
            className="input"
          />
        </div>
        <div>
          <label htmlFor="c-email" className="label">
            Email
          </label>
          <input
            id="c-email"
            type="email"
            required
            autoComplete="email"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            placeholder="you@email.com"
            className="input"
          />
        </div>
      </div>
      <div>
        <label htmlFor="c-subject" className="label">
          Subject
        </label>
        <input
          id="c-subject"
          type="text"
          value={form.subject}
          onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
          placeholder="How can we help?"
          className="input"
        />
      </div>
      <div>
        <label htmlFor="c-message" className="label">
          Message
        </label>
        <textarea
          id="c-message"
          required
          rows={6}
          value={form.message}
          onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
          placeholder="Tell us a bit more…"
          className="input resize-y"
        />
      </div>
      <Button type="submit" size="lg" className="w-full sm:w-auto">
        <Send className="h-4 w-4" />
        Send message
      </Button>
    </form>
  );
}
