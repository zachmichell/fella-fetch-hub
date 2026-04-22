import { useQuery } from "@tanstack/react-query";
import PortalLayout from "@/components/portal/PortalLayout";
import { useAuth } from "@/hooks/useAuth";
import { greeting } from "@/lib/timezones";
import { supabase } from "@/integrations/supabase/client";
import { formatCentsShort } from "@/lib/money";
import { useLocationFilter } from "@/contexts/LocationContext";

const TZ = "America/Edmonton";

function todayBoundsEdmonton() {
  // Compute today's start/end in Edmonton, returned as ISO UTC strings.
  const now = new Date();
  const ymd = now.toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD
  const start = new Date(`${ymd}T00:00:00-06:00`); // MDT/MST approx; use offset of Edmonton naively
  // More robust: use the date string and rely on UTC offset of America/Edmonton via Date math
  const end = new Date(start.getTime() + 86400000 - 1);
  return { startISO: start.toISOString(), endISO: end.toISOString() };
}

export default function Dashboard() {
  const { profile } = useAuth();
  const locationId = useLocationFilter();

  const { data: revenueCents = 0 } = useQuery({
    queryKey: ["dashboard-today-revenue", locationId],
    queryFn: async () => {
      const { startISO, endISO } = todayBoundsEdmonton();
      let q = supabase
        .from("invoices")
        .select("total_cents")
        .eq("status", "paid")
        .gte("paid_at", startISO)
        .lte("paid_at", endISO)
        .is("deleted_at", null);
      if (locationId) q = q.eq("location_id", locationId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []).reduce((sum: number, r: any) => sum + (r.total_cents ?? 0), 0);
    },
  });

  const kpis = [
    { label: "Checked In", value: "0", bar: "bg-brand-cotton", bg: "bg-brand-cotton-bg" },
    { label: "Expected Today", value: "0", bar: "bg-brand-vanilla", bg: "bg-brand-vanilla-bg" },
    { label: "Boarding Guests", value: "0", bar: "bg-brand-frost", bg: "bg-brand-frost-bg" },
    { label: "Today's Revenue", value: formatCentsShort(revenueCents), bar: "bg-brand-mist", bg: "bg-brand-mist-bg" },
  ];
  const firstName = profile?.first_name || "there";
  const today = new Date().toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Regina",
  });

  return (
    <PortalLayout>
      <div className="px-8 py-6">
        {/* Greeting */}
        <header className="mb-6">
          <h1 className="font-display text-2xl text-foreground">{greeting()}, {firstName}</h1>
          <p className="mt-1 text-sm text-text-secondary">{today} · 0 dogs expected today</p>
        </header>

        {/* KPI Row */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => (
            <div
              key={k.label}
              className={`relative overflow-hidden rounded-lg border border-border ${k.bg} p-5 shadow-card`}
            >
              <span className={`absolute left-0 top-0 h-full w-1 ${k.bar}`} />
              <div className="label-eyebrow">{k.label}</div>
              <div className="mt-2 font-display text-3xl font-bold text-foreground">{k.value}</div>
            </div>
          ))}
        </div>

        {/* Reservations table */}
        <section className="rounded-lg border border-border bg-surface shadow-card">
          <header className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
            <h2 className="font-display text-base font-semibold">Today's reservations</h2>
          </header>
          <div className="overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-background">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                  <th className="px-5 py-3">Pet</th>
                  <th className="px-5 py-3">Owner</th>
                  <th className="px-5 py-3">Service</th>
                  <th className="px-5 py-3">Time</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center">
                    <div className="font-display text-base text-foreground">No reservations yet</div>
                    <div className="mt-1 text-sm text-text-secondary">
                      Create your first service to start booking.
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </PortalLayout>
  );
}
