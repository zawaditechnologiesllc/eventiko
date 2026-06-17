import { getActiveBroadcasts, getSettings } from "@/lib/data";
import { Navbar } from "@/components/layout/navbar";
import { Footer } from "@/components/layout/footer";
import { PromoBar } from "@/components/layout/promo-bar";

export default async function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, broadcasts] = await Promise.all([
    getSettings(),
    getActiveBroadcasts(),
  ]);

  return (
    <div className="flex min-h-screen flex-col">
      <PromoBar broadcasts={broadcasts} />
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
    </div>
  );
}
