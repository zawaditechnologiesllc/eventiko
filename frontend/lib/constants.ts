export const SITE = {
  name: "Eventiko",
  tagline: "Live moments, made unforgettable.",
  description:
    "Eventiko is a global events ticketing platform. Discover concerts, festivals and events across Europe and the world, buy secure QR tickets, and sell your own in minutes.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://eventiko.vercel.app",
  defaultCurrency: "EUR",
};

export const EVENT_CATEGORIES = [
  "Concert",
  "Festival",
  "Club Night",
  "Theatre",
  "Comedy",
  "Sports",
  "Conference",
  "Exhibition",
  "Workshop",
  "Family",
  "Food & Drink",
  "Other",
] as const;

export const COUNTRIES = [
  "France",
  "United Kingdom",
  "Germany",
  "Spain",
  "Italy",
  "Netherlands",
  "Belgium",
  "Portugal",
  "Ireland",
  "Switzerland",
  "Austria",
  "Sweden",
  "Denmark",
  "Norway",
  "Poland",
  "Greece",
  "Czech Republic",
  "Hungary",
  "United States",
  "Canada",
  "Other",
] as const;

export const TICKET_LAYOUTS = [
  { id: "modern", label: "Modern" },
  { id: "classic", label: "Classic" },
  { id: "minimal", label: "Minimal" },
  { id: "festival", label: "Festival" },
] as const;

export const PAYOUT_METHODS = [
  { id: "bank", label: "Bank transfer" },
  { id: "paypal", label: "PayPal" },
  { id: "wise", label: "Wise" },
  { id: "mpesa", label: "M-Pesa" },
  { id: "crypto", label: "Crypto (USDT)" },
  { id: "other", label: "Other" },
] as const;

export const NAV_LINKS = [
  { label: "Events", href: "/events" },
  { label: "News", href: "/news" },
  { label: "Sell tickets", href: "/sell" },
  { label: "About", href: "/about" },
];

export const DEFAULT_TICKET_DESIGN = {
  primaryColor: "#7C3AED",
  accentColor: "#EC4899",
  bgColor: "#0B0A1A",
  textColor: "#FFFFFF",
  layout: "modern" as const,
  perks: [] as string[],
  terms: "Non-refundable. Valid for one entry only. Subject to organizer terms.",
  showQr: true,
};
