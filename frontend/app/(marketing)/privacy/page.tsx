import type { Metadata } from "next";
import { SITE } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${SITE.name} collects, uses and protects your personal data. We take your privacy seriously.`,
  alternates: { canonical: "/privacy" },
};

const sections = [
  {
    title: "1. Introduction",
    body: [
      `This Privacy Policy explains how ${SITE.name} ("we", "us") collects, uses, shares and protects your personal data when you use our platform. We are committed to handling your data responsibly and in line with applicable data protection laws, including the GDPR.`,
    ],
  },
  {
    title: "2. Data we collect",
    body: [
      "Information you provide: your name, email address and phone number when buying tickets; account and business details when selling; and any messages you send us.",
      "Information collected automatically: device and browser information, IP address, and usage data gathered through cookies and similar technologies to keep the service secure and improve it.",
      "Payment information: card and payment details are collected and processed directly by our payment processor, Stripe. We do not store full card numbers on our servers.",
    ],
  },
  {
    title: "3. How we use your data",
    body: [
      "To process ticket purchases, issue and deliver tickets, and validate entry at events.",
      "To operate seller accounts, process payouts and provide analytics.",
      "To communicate with you about orders, support requests and important service updates.",
      "To detect, prevent and address fraud, abuse and security issues.",
      "To improve and personalize the platform, and — where you have opted in — to send marketing about events and features.",
    ],
  },
  {
    title: "4. Legal bases",
    body: [
      "We process your data to perform our contract with you (e.g. fulfilling ticket orders), to comply with legal obligations, for our legitimate interests in operating and securing the platform, and on the basis of your consent where required (e.g. marketing emails).",
    ],
  },
  {
    title: "5. Sharing your data",
    body: [
      "With event organizers (Sellers) for the events you buy tickets to, so they can manage attendance and check-in.",
      "With service providers who help us operate the platform, such as Stripe (payments), hosting and email providers, under appropriate safeguards.",
      "When required by law, to protect our rights, or in connection with a business transfer. We never sell your personal data.",
    ],
  },
  {
    title: "6. Cookies",
    body: [
      "We use essential cookies to keep you signed in and the platform working, and analytics cookies to understand usage. You can control non-essential cookies through your browser settings.",
    ],
  },
  {
    title: "7. Data retention",
    body: [
      "We keep personal data only as long as necessary for the purposes described, to comply with legal and accounting obligations, and to resolve disputes. Ticket and order records are typically retained for the period required by applicable law.",
    ],
  },
  {
    title: "8. Your rights",
    body: [
      "Depending on your location, you may have the right to access, correct, delete or export your data, to object to or restrict certain processing, and to withdraw consent. To exercise these rights, contact us at support@eventiko.com.",
      "You also have the right to lodge a complaint with your local data protection authority.",
    ],
  },
  {
    title: "9. Security",
    body: [
      "We use industry-standard measures — including encryption in transit, access controls and secure payment processing through Stripe — to protect your data. No method of transmission is perfectly secure, but we work hard to safeguard your information.",
    ],
  },
  {
    title: "10. International transfers",
    body: [
      "Your data may be processed in countries outside your own. Where this happens, we rely on appropriate safeguards such as standard contractual clauses to protect your information.",
    ],
  },
  {
    title: "11. Children",
    body: [
      "The platform is not directed at children under 16. We do not knowingly collect personal data from children. If you believe a child has provided us data, please contact us.",
    ],
  },
  {
    title: "12. Changes & contact",
    body: [
      "We may update this policy from time to time and will post the revised version with a new date. Questions or requests? Email support@eventiko.com.",
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="container-page py-12 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <header className="border-b border-slate-100 pb-8">
          <span className="text-xs font-bold uppercase tracking-wider text-brand-600">Legal</span>
          <h1 className="mt-2 font-display text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Privacy Policy
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
