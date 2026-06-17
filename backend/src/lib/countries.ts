// Map the human-readable country names used in onboarding to ISO 3166-1 alpha-2
// codes for Stripe Connect account creation. Falls back to undefined (Stripe
// then uses the platform's country / collects it during onboarding).
const MAP: Record<string, string> = {
  France: "FR",
  "United Kingdom": "GB",
  Germany: "DE",
  Spain: "ES",
  Italy: "IT",
  Netherlands: "NL",
  Belgium: "BE",
  Portugal: "PT",
  Ireland: "IE",
  Switzerland: "CH",
  Austria: "AT",
  Sweden: "SE",
  Denmark: "DK",
  Norway: "NO",
  Poland: "PL",
  Greece: "GR",
  "Czech Republic": "CZ",
  Hungary: "HU",
  "United States": "US",
  Canada: "CA",
};

export function countryToIso(name?: string | null): string | undefined {
  if (!name) return undefined;
  return MAP[name];
}
