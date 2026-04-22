import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, ArrowUp, ArrowDown, Minus } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
} from "recharts";
import PortalLayout from "@/components/portal/PortalLayout";
import PageHeader from "@/components/portal/PageHeader";
import InvoiceStatusBadge from "@/components/portal/InvoiceStatusBadge";
import ReservationStatusBadge from "@/components/portal/ReservationStatusBadge";
import { useAnalytics } from "@/hooks/useAnalytics";
import { getDateRange, RangePreset, formatMoney } from "@/lib/analytics";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useLocationFilter } from "@/contexts/LocationContext";

function useOrgCurrency() {
  const { membership } = useAuth();
  return useQuery({
    enabled: !!membership?.organization_id,
    queryKey: ["org-currency", membership?.organization_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("currency")
        .eq("id", membership!.organization_id)
        .maybeSingle();
      return (data?.currency as string) ?? "CAD";
    },
  });
}

function DeltaPill({ delta }: { delta: number | null }) {
  if (delta === null) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-text-tertiary">
        <Minus className="h-3 w-3" /> —
      </span>
    );
  }
  const up = delta >= 0;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-[11px] font-semibold",
        up ? "text-success" : "text-destructive",
      )}
    >
      {up ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
      {Math.abs(delta).toFixed(1)}%
    </span>
  );
}

function MetricCard({
  label,
  value,
  subtitle,
  delta,
  sparkData,
  sparkColor,
  accent,
}: {
  label: string;
  value: string;
  subtitle?: string;
  delta?: number | null;
  sparkData?: { x: string; y: number }[];
  sparkColor?: string;
  accent: string;
}) {
  return (
    <Card className="relative overflow-hidden p-5 shadow-card">
      <div className={cn("absolute left-0 top-0 h-full w-1", accent)} />
      <div className="pl-2">
        <div className="label-eyebrow">{label}</div>
        <div className="mt-2 flex items-end justify-between gap-2">
          <div className="font-display text-2xl text-foreground leading-tight">{value}</div>
          {delta !== undefined && <DeltaPill delta={delta ?? null} />}
        </div>
        {subtitle && <div className="mt-1 text-xs text-text-secondary">{subtitle}</div>}
        {sparkData && sparkData.length > 0 && (
          <div className="mt-3 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={sparkData}>
                <Line
                  type="monotone"
                  dataKey="y"
                  stroke={sparkColor ?? "hsl(var(--brand-camel))"}
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Card>
  );
}

const PRESETS: { value: RangePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 Days" },
  { value: "30d", label: "Last 30 Days" },
  { value: "this_month", label: "This Month" },
  { value: "last_month", label: "Last Month" },
  { value: "custom", label: "Custom Range" },
];

export default function Analytics() {
  const [preset, setPreset] = useState<RangePreset>("7d");
  const [customFrom, setCustomFrom] = useState<Date | undefined>();
  const [customTo, setCustomTo] = useState<Date | undefined>();
  const locationId = useLocationFilter();

  const range = useMemo(
    () =>
      getDateRange(
        preset,
        preset === "custom" && customFrom && customTo
          ? { from: customFrom, to: customTo }
          : undefined,
      ),
    [preset, customFrom, customTo],
  );

  const { data, isLoading } = useAnalytics(range, locationId);
  const { data: currency = "CAD" } = useOrgCurrency();

  const reservationSpark = data?.reservationSeries.map((d) => ({ x: d.key, y: d.total })) ?? [];
  const revenueSpark = data?.revenueSeries.map((d) => ({ x: d.key, y: d.revenue })) ?? [];

  return (
    <PortalLayout>
      <div className="px-8 py-6">
        <PageHeader
          title="Analytics"
          description="Your facility at a glance"
          actions={
            <div className="flex items-center gap-2">
              <Select value={preset} onValueChange={(v) => setPreset(v as RangePreset)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PRESETS.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      {p.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {preset === "custom" && (
                <>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {customFrom ? format(customFrom, "MMM d") : "From"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={customFrom}
                        onSelect={setCustomFrom}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        {customTo ? format(customTo, "MMM d") : "To"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="end">
                      <Calendar
                        mode="single"
                        selected={customTo}
                        onSelect={setCustomTo}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                    </PopoverContent>
                  </Popover>
                </>
              )}
            </div>
          }
        />

        {isLoading || !data ? (
          <div className="text-sm text-text-secondary">Loading analytics…</div>
        ) : (
          <div className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Total Reservations"
                value={data.totals.reservations.toLocaleString()}
                subtitle={`${data.totals.moduleBreakdown.daycare} daycare, ${data.totals.moduleBreakdown.boarding} boarding`}
                delta={data.totals.reservationsDelta}
                sparkData={reservationSpark}
                sparkColor="hsl(var(--brand-sage))"
                accent="bg-brand-sage"
              />
              <MetricCard
                label="Occupancy Rate (today)"
                value={`${Math.round(data.totals.daycareOccupancy)}% / ${Math.round(data.totals.boardingOccupancy)}%`}
                subtitle={`Daycare ${data.totals.daycarePets}/${data.totals.daycareCapacity} · Boarding ${data.totals.occupiedRuns}/${data.totals.totalRuns}`}
                accent="bg-brand-frost"
              />
              <MetricCard
                label="Revenue"
                value={formatMoney(data.totals.revenue, currency)}
                subtitle={`Previous ${formatMoney(data.totals.revenuePrev, currency)}`}
                delta={data.totals.revenueDelta}
                sparkData={revenueSpark}
                sparkColor="hsl(var(--brand-gold))"
                accent="bg-brand-gold"
              />
              <MetricCard
                label="Active Pets"
                value={data.totals.activePets.toLocaleString()}
                subtitle={`${data.totals.newPets} new this period`}
                accent="bg-brand-cotton"
              />
            </div>

            {/* Charts row 1 */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="p-5 shadow-card">
                <div className="mb-4">
                  <h3 className="font-display text-base text-foreground">Reservations Over Time</h3>
                  <div className="text-xs text-text-secondary">{range.label}</div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer>
                    <BarChart data={data.reservationSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 10,
                          fontSize: 12,
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Bar dataKey="daycare" stackId="a" fill="hsl(var(--brand-sage))" name="Daycare" radius={[0, 0, 0, 0]} />
                      <Bar dataKey="boarding" stackId="a" fill="hsl(var(--brand-plum))" name="Boarding" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-5 shadow-card">
                <div className="mb-4">
                  <h3 className="font-display text-base text-foreground">Revenue Over Time</h3>
                  <div className="text-xs text-text-secondary">{range.label}</div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer>
                    <LineChart data={data.revenueSeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="label" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <Tooltip
                        formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]}
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 10,
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--brand-gold))"
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: "hsl(var(--brand-gold))" }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Card>
            </div>

            {/* Charts row 2 */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="p-5 shadow-card">
                <div className="mb-4">
                  <h3 className="font-display text-base text-foreground">Check-in Activity</h3>
                  <div className="text-xs text-text-secondary">Average per day of week</div>
                </div>
                <div className="h-64">
                  <ResponsiveContainer>
                    <BarChart data={data.weekdaySeries}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                      <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                      <Tooltip
                        formatter={(v: number) => [v.toFixed(1), "Avg check-ins"]}
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: 10,
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="avg" fill="hsl(var(--brand-camel))" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Card>

              <Card className="p-5 shadow-card">
                <div className="mb-4">
                  <h3 className="font-display text-base text-foreground">Top Services</h3>
                  <div className="text-xs text-text-secondary">By reservation count</div>
                </div>
                {data.topServices.length === 0 ? (
                  <div className="py-12 text-center text-sm text-text-secondary">No services in this period</div>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer>
                      <BarChart data={data.topServices} layout="vertical" margin={{ left: 16 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={false} />
                        <XAxis type="number" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="name"
                          width={120}
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                        />
                        <Tooltip
                          formatter={(v: number, _n, p) => [`${v} (${p.payload.pct.toFixed(0)}%)`, "Reservations"]}
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 10,
                            fontSize: 12,
                          }}
                        />
                        <Bar dataKey="count" fill="hsl(var(--brand-plum))" radius={[0, 6, 6, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </Card>
            </div>

            {/* No-show / cancel summary */}
            <Card className="p-5 shadow-card">
              <div className="flex flex-wrap items-center gap-x-8 gap-y-2 text-sm">
                <div>
                  <span className="label-eyebrow mr-2">No-shows</span>
                  <span className="font-display text-lg text-foreground">{data.totals.noShows}</span>
                  <span className="ml-1 text-xs text-text-secondary">
                    ({data.totals.noShowPct.toFixed(1)}%)
                  </span>
                </div>
                <div className="h-6 w-px bg-border" />
                <div>
                  <span className="label-eyebrow mr-2">Cancellations</span>
                  <span className="font-display text-lg text-foreground">{data.totals.cancels}</span>
                  <span className="ml-1 text-xs text-text-secondary">
                    ({data.totals.cancelPct.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </Card>

            {/* Tables */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Card className="p-5 shadow-card">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-base text-foreground">Recent Activity</h3>
                  <Link to="/reservations" className="text-xs font-medium text-primary hover:underline">
                    View all →
                  </Link>
                </div>
                {data.recentActivity.length === 0 ? (
                  <div className="py-8 text-center text-sm text-text-secondary">No activity</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border-subtle text-left text-[11px] uppercase tracking-wide text-text-tertiary">
                          <th className="pb-2 pr-3 font-semibold">Date</th>
                          <th className="pb-2 pr-3 font-semibold">Pet</th>
                          <th className="pb-2 pr-3 font-semibold">Owner</th>
                          <th className="pb-2 pr-3 font-semibold">Service</th>
                          <th className="pb-2 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.recentActivity.map((r) => (
                          <tr key={r.id} className="border-b border-border-subtle last:border-0">
                            <td className="py-2 pr-3 text-text-secondary">
                              {format(new Date(r.date), "MMM d")}
                            </td>
                            <td className="py-2 pr-3 text-foreground">{r.pets}</td>
                            <td className="py-2 pr-3 text-text-secondary">{r.owner}</td>
                            <td className="py-2 pr-3 text-text-secondary">{r.service}</td>
                            <td className="py-2">
                              <ReservationStatusBadge status={r.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>

              <Card className="p-5 shadow-card">
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-display text-base text-foreground">Outstanding Invoices</h3>
                  <Link to="/invoices" className="text-xs font-medium text-primary hover:underline">
                    View all →
                  </Link>
                </div>
                {data.outstandingInvoices.length === 0 ? (
                  <div className="py-8 text-center text-sm text-text-secondary">No outstanding invoices</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border-subtle text-left text-[11px] uppercase tracking-wide text-text-tertiary">
                          <th className="pb-2 pr-3 font-semibold">Invoice</th>
                          <th className="pb-2 pr-3 font-semibold">Owner</th>
                          <th className="pb-2 pr-3 font-semibold">Amount</th>
                          <th className="pb-2 pr-3 font-semibold">Due</th>
                          <th className="pb-2 font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.outstandingInvoices.map((i) => (
                          <tr key={i.id} className="border-b border-border-subtle last:border-0">
                            <td className="py-2 pr-3">
                              <Link to={`/invoices/${i.id}`} className="text-primary hover:underline">
                                {i.invoice_number ?? i.id.slice(0, 6)}
                              </Link>
                            </td>
                            <td className="py-2 pr-3 text-text-secondary">{i.ownerName}</td>
                            <td className="py-2 pr-3 text-foreground">{formatMoney(i.total_cents, currency)}</td>
                            <td className="py-2 pr-3 text-text-secondary">
                              {i.due_at ? format(new Date(i.due_at), "MMM d") : "—"}
                            </td>
                            <td className="py-2">
                              <InvoiceStatusBadge status={i.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </Card>
            </div>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}
