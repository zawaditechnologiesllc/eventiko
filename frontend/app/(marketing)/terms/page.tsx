import type { Metadata } from "next";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: `The terms and conditions governing your use of ${SITE.name}, the global events ticketing platform.`,
  alternates: { canonical: "/terms" },
};

const sections = [
  {
    title: "1. Acceptance of terms",
    body: [
      `By accessing or using ${SITE.name} (the "Platform"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the Platform. These terms apply to all visitors, buyers and sellers.`,
    ],
  },
  {
    title: "2. The platform",
    body: [
      `${SITE.name} is a marketplace that lets event organizers ("Sellers") list events and sell tickets, and lets attendees ("Buyers") discover and purchase those tickets. We provide the technology and payment infrastructure; the Seller is responsible for the event itself.`,
    ],
  },
  {
    title: "3. Accounts",
    body: [
      "You can browse and buy tickets without an account. To sell tickets you must create a seller account and provide accurate, complete information. You are responsible for safeguarding your credentials and for all activity under your account.",
      "We may suspend or terminate accounts that violate these terms, provide false information, or engage in fraudulent or harmful activity.",
    ],
  },
  {
    title: "4. Buying tickets",
    body: [
      "When you purchase a ticket, you enter into a contract with the Seller of that event, not with Eventiko. Payment is processed securely through Stripe. Your ticket is delivered electronically with a unique QR code for entry.",
      "All sales are final unless the Seller's stated policy or applicable consumer law provides otherwise. Refunds, exchanges and cancellations are governed by the Seller's policy and the section below.",
    ],
  },
  {
    title: "5. Refunds & cancellations",
    body: [
      "If an event is cancelled by the Seller, you are generally entitled to a refund of the ticket price. If an event is postponed or materially changed, the Seller will communicate options. Platform and processing fees may be non-refundable except where required by law.",
      "Buyers should direct refund requests to the Seller in the first instance. We will assist in facilitating communication and, where appropriate, processing eligible refunds.",
    ],
  },
  {
    title: "6. Selling tickets",
    body: [
      "Sellers are solely responsible for their events, including accuracy of listings, delivery of the event, compliance with all applicable laws and licenses, taxes, and honoring tickets sold.",
      `Eventiko charges a platform fee on each ticket sold, disclosed at the time of listing. Payouts are made to your verified payout method subject to our payout schedule and minimum thresholds. You must not list illegal, infringing, fraudulent or prohibited events.`,
    ],
  },
  {
    title: "7. Fees & payments",
    body: [
      "Buyers pay the ticket price plus any disclosed fees at checkout. Sellers receive proceeds net of the platform fee and payment processing costs. We may change our fees with reasonable notice; changes do not affect transactions already completed.",
    ],
  },
  {
    title: "8. Prohibited conduct",
    body: [
      "You agree not to misuse the Platform, including by: reselling tickets in violation of applicable law; attempting to circumvent QR validation or duplicate tickets; scraping, hacking or disrupting the service; or using the Platform for any unlawful purpose.",
    ],
  },
  {
    title: "9. Intellectual property",
    body: [
      `All content, trademarks and software on the Platform are owned by ${SITE.name} or its licensors. Sellers grant us a license to display their event content for the purpose of operating and promoting the marketplace.`,
    ],
  },
  {
    title: "10. Disclaimers & liability",
    body: [
      `The Platform is provided "as is" without warranties of any kind. ${SITE.name} is not the organizer of events and is not liable for the conduct of Sellers or Buyers, the quality or occurrence of events, or losses arising from them, except to the extent required by law.`,
      "Our aggregate liability for any claim relating to the Platform is limited to the amount of fees we received in connection with the relevant transaction.",
    ],
  },
  {
    title: "11. Changes to these terms",
    body: [
      "We may update these terms from time to time. We will post the revised version with an updated date. Your continued use after changes take effect constitutes acceptance.",
    ],
  },
  {
    title: "12. Contact",
    body: [
      `Questions about these terms? Email us at support@eventiko.com and we'll be happy to help.`,
    ],
  },
];

export default function TermsPage() {
  return <LegalPage title="Terms of Service" sections={sections} />;
}

function LegalPage({
  title,
  sections,
}: {
  title: string;
  sections: { title: string; body: string[] }[];
}) {
  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-slate-100 pb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Legal</span>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 text-sm text-slate-400">Last updated 16 June 2026</p>
        </header>

        <div className="mt-10 space-y-10">
          {sections.map((section) => (
            <section key={section.title}>
              <h2 className="font-display text-xl font-bold text-slate-900">{section.title}</h2>
              <div className="mt-3 space-y-3 leading-relaxed text-slate-600">
                {section.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
