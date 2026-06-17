import type { Metadata } from "next";
import { Mail, MessageCircle, Building2, Clock, Ticket } from "lucide-react";
import { getSettings } from "@/lib/data";
import { ContactForm } from "@/components/contact/contact-form";
import { ButtonLink } from "@/components/ui/button";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact us",
  description: `Get in touch with the ${SITE.name} team. Questions about an order, selling tickets, or partnerships — we're here to help.`,
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const settings = await getSettings();
  const supportEmail = settings.support_email || "support@eventiko.com";

  return (
    <div className="container-page py-12 sm:py-16">
      <header className="max-w-3xl animate-fade-up">
        <span className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-brand-700">
          <MessageCircle className="h-3.5 w-3.5" />
          Contact
        </span>
        <h1 className="mt-4 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          We&apos;d love to hear from you
        </h1>
        <p className="mt-3 text-lg text-slate-500">
          Whether you need help with an order, want to sell tickets, or have a partnership idea, our
          team is ready. We typically reply within one business day.
        </p>
      </header>

      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        {/* Info cards */}
        <div className="space-y-4 lg:col-span-1">
          <InfoCard
            icon={<Mail className="h-5 w-5" />}
            title="Email us"
            body={
              <a href={`mailto:${supportEmail}`} className="font-semibold text-brand-600 hover:underline">
                {supportEmail}
              </a>
            }
          />
          <InfoCard
            icon={<Ticket className="h-5 w-5" />}
            title="Order help"
            body={
              <span className="text-slate-500">
                Bought a ticket? Look it up anytime on the{" "}
                <a href="/ticket" className="font-semibold text-brand-600 hover:underline">
                  ticket lookup
                </a>{" "}
                page.
              </span>
            }
          />
          <InfoCard
            icon={<Clock className="h-5 w-5" />}
            title="Response time"
            body={<span className="text-slate-500">Within 24 hours, Monday to Friday.</span>}
          />
          <InfoCard
            icon={<Building2 className="h-5 w-5" />}
            title="Organizers"
            body={
              <span className="text-slate-500">
                Ready to sell?{" "}
                <a href="/sell" className="font-semibold text-brand-600 hover:underline">
                  Start here
                </a>
                .
              </span>
            }
          />
        </div>

        {/* Form */}
        <div className="lg:col-span-2">
          <ContactForm supportEmail={supportEmail} />
        </div>
      </div>

      {/* Bottom CTA */}
      <div className="mt-16 rounded-3xl bg-brand-gradient px-6 py-10 text-center text-white shadow-glow sm:px-12">
        <h2 className="font-display text-2xl font-extrabold tracking-tight sm:text-3xl">
          Looking for something to do?
        </h2>
        <p className="mx-auto mt-2 max-w-lg text-white/90">
          Explore thousands of events and grab your tickets in seconds.
        </p>
        <ButtonLink href="/events" variant="secondary" size="lg" className="mt-6">
          Browse events
        </ButtonLink>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: React.ReactNode;
}) {
  return (
    <div className="card flex items-start gap-4 p-5">
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-brand-50 text-brand-600">
        {icon}
      </span>
      <div>
        <p className="font-display font-bold text-slate-900">{title}</p>
        <div className="mt-1 text-sm">{body}</div>
      </div>
    </div>
  );
}
