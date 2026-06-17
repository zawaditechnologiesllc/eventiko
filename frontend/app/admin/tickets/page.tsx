import { TicketsSearch } from "@/components/admin/tickets-search";

export const dynamic = "force-dynamic";

export default function AdminTicketsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Tickets
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          Look up issued tickets by reference number — handy for door support.
        </p>
      </div>
      <TicketsSearch />
    </div>
  );
}
