import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  startOfDay,
  startOfMonth,
  startOfWeek,
  subDays,
  subMonths,
} from "date-fns";
import PortalLayout from "@/components/portal/PortalLayout";
import PageHeader from "@/components/portal/PageHeader";
import StatusBadge from "@/components/portal/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight, BedDouble } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSuites, type SuiteRow } from "@/hooks/useSuites";
import { cn } from "@/lib/utils";
import { useLocationFilter } from "@/contexts/LocationContext";

type ViewMode = "weekly" | "monthly";

type ResvRow = {
  id: string;
  status: string;
  start_at: string;
  end_at: string;
  suite_id: string | null;
  reservation_pets: { pets: { name: string } | null }[];
};

const TYPE_TONES: Record<SuiteRow["type"], "muted" | "primary" | "plum"> = {
  standard: "muted",
  deluxe: "primary",
  presidential: "plum",
};

export default function Lodging() {
  const navigate = useNavigate();
  const { membership } = useAuth();
  const orgId = membership?.organization_id;
  const locationId = useLocationFilter();

  const [view, setView] = useState<ViewMode>("weekly");
  const [anchor, setAnchor] = useState<Date>(startOfDay(new Date()));

  const allSuites = useSuites({ activeOnly: false });
  const suites = (allSuites.data ?? []).filter(
    (s: any) => !locationId || s.location_id === locationId,
  );
  const suitesLoading = allSuites.isLoading;

  const { rangeStart, rangeEnd, days } = useMemo(() => {
    if (view === "weekly") {
      const start = startOfWeek(anchor, { weekStartsOn: 1 });
      const end = endOfWeek(anchor, { weekStartsOn: 1 });
      const ds: Date[] = [];
      for (let d = start; d <= end; d = addDays(d, 1)) ds.push(d);
      return { rangeStart: start, rangeEnd: end, days: ds };
    }
    const start = startOfMonth(anchor);
    const end = endOfMonth(anchor);
    const ds: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) ds.push(d);
    return { rangeStart: start, rangeEnd: end, days: ds };
  }, [view, anchor]);

  const { data: reservations = [] } = useQuery({
    queryKey: [
      "lodging-reservations",
      orgId,
      rangeStart.toISOString(),
      rangeEnd.toISOString(),
      locationId,
    ],
    enabled: !!orgId,
    queryFn: async () => {
      const startIso = rangeStart.toISOString();
      const endIso = addDays(rangeEnd, 1).toISOString();
      let q = supabase
        .from("reservations")
        .select("id, status, start_at, end_at, suite_id, reservation_pets(pets(name))")
        .eq("organization_id", orgId!)
        .not("suite_id", "is", null)
        .in("status", ["confirmed", "checked_in", "requested"])
        .is("deleted_at", null)
        .lt("start_at", endIso)
        .gte("end_at", startIso);
      if (locationId) q = q.eq("location_id", locationId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as ResvRow[];
    },
  });

  // Cell lookup: suiteId|YYYY-MM-DD -> reservation
  const cellMap = useMemo(() => {
    const m = new Map<string, ResvRow>();
    for (const r of reservations) {
      if (!r.suite_id) continue;
      const start = startOfDay(new Date(r.start_at));
      const end = startOfDay(new Date(r.end_at));
      for (let d = start; d <= end; d = addDays(d, 1)) {
        m.set(`${r.suite_id}|${format(d, "yyyy-MM-dd")}`, r);
      }
    }
    return m;
  }, [reservations]);

  // Stats
  const today = startOfDay(new Date());
  const occupiedToday = useMemo(() => {
    const set = new Set<string>();
    const key = format(today, "yyyy-MM-dd");
    for (const s of suites) {
      if (cellMap.has(`${s.id}|${key}`)) set.add(s.id);
    }
    return set.size;
  }, [cellMap, suites, today]);
  const totalActive = suites.filter((s) => s.status === "active").length;
  const available = Math.max(0, totalActive - occupiedToday);
  const occupancyPct = totalActive > 0 ? Math.round((occupiedToday / totalActive) * 100) : 0;

  const goPrev = () => setAnchor(view === "weekly" ? subDays(anchor, 7) : subMonths(anchor, 1));
  const goNext = () => setAnchor(view === "weekly" ? addDays(anchor, 7) : addMonths(anchor, 1));
  const goToday = () => setAnchor(startOfDay(new Date()));

  const petName = (r: ResvRow) =>
    r.reservation_pets?.[0]?.pets?.name ?? "Guest";

  const handleEmptyCell = (suiteId: string, day: Date) => {
    const dateStr = format(day, "yyyy-MM-dd'T'09:00");
    navigate(`/reservations/new?suite_id=${suiteId}&start=${encodeURIComponent(dateStr)}`);
  };

  const rangeLabel =
    view === "weekly"
      ? `${format(rangeStart, "MMM d")} – ${format(rangeEnd, "MMM d, yyyy")}`
      : format(anchor, "MMMM yyyy");

  return (
    <PortalLayout>
      <div className="px-8 py-6">
        <PageHeader
          title="Lodging"
          description="Suite occupancy at a glance"
          actions={
            <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
              <TabsList>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>
          }
        />

        {/* Stats bar */}
        <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
          <StatCard label="Total suites" value={totalActive} accent="bg-brand-cottoncandy" />
          <StatCard label="Occupied today" value={occupiedToday} accent="bg-brand-vanilla" />
          <StatCard label="Available" value={available} accent="bg-brand-mist" />
          <StatCard label="Occupancy" value={`${occupancyPct}%`} accent="bg-brand-frost" />
        </div>

        {/* Date nav */}
        <div className="mb-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goPrev} aria-label="Previous">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goNext} aria-label="Next">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="font-display text-lg text-foreground">{rangeLabel}</div>
        </div>

        {suitesLoading ? (
          <div className="h-64 animate-pulse rounded-lg bg-surface" />
        ) : suites.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-surface p-12 text-center shadow-card">
            <BedDouble className="mx-auto h-10 w-10 text-text-tertiary" />
            <div className="mt-3 font-display text-lg">No suites yet</div>
            <p className="mt-1 text-sm text-text-secondary">
              Add suites in Suite Management to start tracking occupancy.
            </p>
            <Button className="mt-4" onClick={() => navigate("/suite-management")}>
              Manage suites
            </Button>
          </div>
        ) : (
          <>
            {/* Desktop grid */}
            <Card className="hidden overflow-x-auto border-border bg-card md:block">
              {view === "weekly" ? (
                <WeeklyGrid
                  suites={suites}
                  days={days}
                  cellMap={cellMap}
                  petName={petName}
                  onEmptyClick={handleEmptyCell}
                  onOccupiedClick={(r) => navigate(`/reservations/${r.id}`)}
                />
              ) : (
                <MonthlyGrid
                  suites={suites}
                  days={days}
                  cellMap={cellMap}
                  reservations={reservations}
                  petName={petName}
                  rangeStart={rangeStart}
                  rangeEnd={rangeEnd}
                  onCellClick={(suiteId, day) => {
                    const r = cellMap.get(`${suiteId}|${format(day, "yyyy-MM-dd")}`);
                    if (r) navigate(`/reservations/${r.id}`);
                    else handleEmptyCell(suiteId, day);
                  }}
                />
              )}
            </Card>

            {/* Mobile stacked */}
            <div className="space-y-3 md:hidden">
              {suites.map((s) => (
                <Card key={s.id} className="border-border bg-card p-4">
                  <div className="mb-3 flex items-center justify-between">
                    <div>
                      <div className="font-display text-base text-foreground">{s.name}</div>
                      <div className="mt-1 flex items-center gap-2">
                        <StatusBadge tone={TYPE_TONES[s.type]}>
                          {s.type.charAt(0).toUpperCase() + s.type.slice(1)}
                        </StatusBadge>
                        <span className="text-xs text-text-secondary">Cap {s.capacity}</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {days.slice(0, 7).map((d) => {
                      const r = cellMap.get(`${s.id}|${format(d, "yyyy-MM-dd")}`);
                      return (
                        <button
                          key={d.toISOString()}
                          onClick={() => (r ? navigate(`/reservations/${r.id}`) : handleEmptyCell(s.id, d))}
                          className={cn(
                            "flex min-h-[48px] flex-col items-center justify-center rounded-md border text-[10px] transition-colors",
                            r
                              ? r.status === "checked_in"
                                ? "border-success/30 bg-success-light text-success"
                                : "border-primary/30 bg-primary-light text-primary"
                              : "border-border bg-background text-text-tertiary hover:bg-surface",
                          )}
                        >
                          <span className="font-semibold">{format(d, "EEEEE")}</span>
                          <span>{format(d, "d")}</span>
                        </button>
                      );
                    })}
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}

        {/* Legend */}
        <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-text-secondary">
          <LegendDot className="bg-success" label="Checked in" />
          <LegendDot className="bg-primary" label="Reserved" />
          <LegendDot className="bg-border" label="Available" />
        </div>
      </div>
    </PortalLayout>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent: string;
}) {
  return (
    <Card className="overflow-hidden border-border bg-card">
      <div className={cn("h-1.5 w-full", accent)} />
      <div className="p-4">
        <div className="label-eyebrow">{label}</div>
        <div className="mt-1 font-display text-2xl text-foreground">{value}</div>
      </div>
    </Card>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-2.5 w-2.5 rounded-full", className)} />
      {label}
    </span>
  );
}

function SuiteRowHeader({ s }: { s: SuiteRow }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="font-medium text-foreground">{s.name}</div>
      <div className="flex items-center gap-2">
        <StatusBadge tone={TYPE_TONES[s.type]}>
          {s.type.charAt(0).toUpperCase() + s.type.slice(1)}
        </StatusBadge>
        <span className="text-[11px] text-text-tertiary">Cap {s.capacity}</span>
      </div>
    </div>
  );
}

function WeeklyGrid({
  suites,
  days,
  cellMap,
  petName,
  onEmptyClick,
  onOccupiedClick,
}: {
  suites: SuiteRow[];
  days: Date[];
  cellMap: Map<string, ResvRow>;
  petName: (r: ResvRow) => string;
  onEmptyClick: (suiteId: string, day: Date) => void;
  onOccupiedClick: (r: ResvRow) => void;
}) {
  const today = startOfDay(new Date());
  return (
    <div className="min-w-[800px]">
      <div
        className="grid border-b border-border bg-surface"
        style={{ gridTemplateColumns: `220px repeat(${days.length}, minmax(80px, 1fr))` }}
      >
        <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Suite
        </div>
        {days.map((d) => (
          <div
            key={d.toISOString()}
            className={cn(
              "border-l border-border-subtle px-2 py-3 text-center text-xs",
              isSameDay(d, today) && "bg-primary-light text-primary",
            )}
          >
            <div className="font-semibold uppercase">{format(d, "EEE")}</div>
            <div className="text-text-secondary">{format(d, "MMM d")}</div>
          </div>
        ))}
      </div>
      {suites.map((s) => (
        <div
          key={s.id}
          className="grid border-b border-border-subtle last:border-b-0"
          style={{ gridTemplateColumns: `220px repeat(${days.length}, minmax(80px, 1fr))` }}
        >
          <div className="border-r border-border-subtle px-4 py-3">
            <SuiteRowHeader s={s} />
          </div>
          {days.map((d) => {
            const key = `${s.id}|${format(d, "yyyy-MM-dd")}`;
            const r = cellMap.get(key);
            return (
              <button
                key={key}
                onClick={() => (r ? onOccupiedClick(r) : onEmptyClick(s.id, d))}
                className={cn(
                  "min-h-[64px] border-l border-border-subtle px-2 py-2 text-left text-xs transition-colors",
                  r
                    ? r.status === "checked_in"
                      ? "bg-success-light text-success hover:bg-success-light/80"
                      : "bg-primary-light text-primary hover:bg-primary-light/80"
                    : "bg-card hover:bg-surface text-text-tertiary",
                )}
                aria-label={r ? `${petName(r)} in ${s.name} on ${format(d, "MMM d")}` : `Available — ${s.name} on ${format(d, "MMM d")}`}
              >
                {r ? (
                  <span className="line-clamp-2 font-medium">{petName(r)}</span>
                ) : (
                  <span className="opacity-0 hover:opacity-100">+</span>
                )}
              </button>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function MonthlyGrid({
  suites,
  days,
  cellMap,
  reservations,
  petName,
  rangeStart,
  rangeEnd,
  onCellClick,
}: {
  suites: SuiteRow[];
  days: Date[];
  cellMap: Map<string, ResvRow>;
  reservations: ResvRow[];
  petName: (r: ResvRow) => string;
  rangeStart: Date;
  rangeEnd: Date;
  onCellClick: (suiteId: string, day: Date) => void;
}) {
  const today = startOfDay(new Date());
  const colWidth = 36;
  return (
    <div className="min-w-[1000px]">
      <div
        className="grid border-b border-border bg-surface"
        style={{ gridTemplateColumns: `200px repeat(${days.length}, ${colWidth}px)` }}
      >
        <div className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-text-secondary">
          Suite
        </div>
        {days.map((d) => (
          <div
            key={d.toISOString()}
            className={cn(
              "border-l border-border-subtle py-2 text-center text-[10px]",
              isSameDay(d, today) && "bg-primary-light text-primary",
            )}
          >
            <div className="font-semibold">{format(d, "d")}</div>
            <div className="text-text-tertiary">{format(d, "EEEEE")}</div>
          </div>
        ))}
      </div>
      {suites.map((s) => {
        const suiteResvs = reservations.filter((r) => r.suite_id === s.id);
        return (
          <div
            key={s.id}
            className="relative grid border-b border-border-subtle last:border-b-0"
            style={{ gridTemplateColumns: `200px repeat(${days.length}, ${colWidth}px)` }}
          >
            <div className="border-r border-border-subtle px-4 py-3">
              <SuiteRowHeader s={s} />
            </div>
            {/* Background cells (clickable) */}
            {days.map((d) => {
              const r = cellMap.get(`${s.id}|${format(d, "yyyy-MM-dd")}`);
              return (
                <button
                  key={d.toISOString()}
                  onClick={() => onCellClick(s.id, d)}
                  className={cn(
                    "h-12 border-l border-border-subtle bg-card hover:bg-surface",
                    isSameDay(d, today) && !r && "bg-primary-light/30",
                  )}
                  aria-label={r ? `Booked — ${s.name} on ${format(d, "MMM d")}` : `Available — ${s.name} on ${format(d, "MMM d")}`}
                />
              );
            })}
            {/* Reservation bars overlay */}
            {suiteResvs.map((r) => {
              const start = startOfDay(new Date(r.start_at));
              const end = startOfDay(new Date(r.end_at));
              const clampedStart = start < rangeStart ? rangeStart : start;
              const clampedEnd = end > rangeEnd ? rangeEnd : end;
              const startIdx = Math.max(
                0,
                Math.round((clampedStart.getTime() - rangeStart.getTime()) / (1000 * 60 * 60 * 24)),
              );
              const span = Math.max(
                1,
                Math.round((clampedEnd.getTime() - clampedStart.getTime()) / (1000 * 60 * 60 * 24)) + 1,
              );
              const left = 200 + startIdx * colWidth + 2;
              const width = span * colWidth - 4;
              return (
                <button
                  key={r.id}
                  onClick={() => onCellClick(s.id, clampedStart)}
                  className={cn(
                    "pointer-events-auto absolute top-3 flex h-6 items-center truncate rounded-md px-2 text-[11px] font-medium shadow-sm transition-opacity hover:opacity-90",
                    r.status === "checked_in"
                      ? "bg-success text-white"
                      : "bg-primary text-primary-foreground",
                  )}
                  style={{ left, width }}
                  title={`${petName(r)} — ${format(start, "MMM d")} to ${format(end, "MMM d")}`}
                >
                  {petName(r)}
                </button>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
