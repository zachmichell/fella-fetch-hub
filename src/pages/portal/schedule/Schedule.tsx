import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";
import PortalLayout from "@/components/portal/PortalLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOrgModules } from "@/hooks/useOrgModules";
import StatCard from "@/components/portal/schedule/StatCard";
import ReservationCard, { ScheduleReservation } from "@/components/portal/schedule/ReservationCard";
import WeekView from "@/components/portal/schedule/WeekView";
import { formatTime } from "@/lib/money";
import { createInvoiceForReservation } from "@/lib/invoice";
import { Link } from "react-router-dom";
import { useLocationFilter } from "@/contexts/LocationContext";

const TZ = "America/Edmonton";

function ymd(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function nightsBetween(start: Date, end: Date) {
  const s = startOfDay(start).getTime();
  const e = startOfDay(end).getTime();
  return Math.max(1, Math.round((e - s) / 86400000));
}

type ModuleFilter = "all" | "daycare" | "boarding";

export default function Schedule() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { data: enabledModules } = useOrgModules();
  const locationId = useLocationFilter();
  const [view, setView] = useState<"day" | "week">("day");
  const [date, setDate] = useState<Date>(() => startOfDay(new Date()));
  const [moduleFilter, setModuleFilter] = useState<ModuleFilter>("all");
  const [completedOpen, setCompletedOpen] = useState(false);

  const dayStart = startOfDay(date);
  const dayEnd = endOfDay(date);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["schedule-day", ymd(date), locationId],
    queryFn: async () => {
      // Fetch reservations whose start_at falls on the selected day
      // OR are still checked_in (multi-day boarders)
      // OR were checked out today
      let q = supabase
        .from("reservations")
        .select(
          `id, start_at, end_at, status, notes,
           checked_in_at, checked_out_at,
           services:service_id(name, module),
           owners:primary_owner_id(last_name),
           reservation_pets(pets(name, breed))`,
        )
        .is("deleted_at", null)
        .or(
          `and(start_at.gte.${dayStart.toISOString()},start_at.lte.${dayEnd.toISOString()}),status.eq.checked_in,and(status.eq.checked_out,checked_out_at.gte.${dayStart.toISOString()},checked_out_at.lte.${dayEnd.toISOString()})`,
        )
        .order("start_at", { ascending: true });
      if (locationId) q = q.eq("location_id", locationId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as ScheduleReservation[];
    },
  });

  const { data: classInstances = [] } = useQuery({
    queryKey: ["schedule-day-classes", ymd(date), locationId],
    queryFn: async () => {
      let q = supabase
        .from("class_instances")
        .select("id, start_at, end_at, status, class_type:class_type_id(name, category)")
        .is("deleted_at", null)
        .eq("status", "scheduled")
        .gte("start_at", dayStart.toISOString())
        .lte("start_at", dayEnd.toISOString())
        .order("start_at");
      if (locationId) q = q.eq("location_id", locationId);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(
    () =>
      rows.filter((r) => {
        if (moduleFilter === "all") return true;
        return r.services?.module === moduleFilter;
      }),
    [rows, moduleFilter],
  );

  const expected = filtered.filter(
    (r) =>
      r.status === "confirmed" &&
      new Date(r.start_at) >= dayStart &&
      new Date(r.start_at) <= dayEnd,
  );

  const checkedIn = filtered.filter(
    (r) => r.status === "checked_in" && !(r.services?.module === "boarding" && new Date(r.end_at) > dayEnd),
  );

  const boardingOvernight = filtered.filter(
    (r) =>
      r.status === "checked_in" &&
      r.services?.module === "boarding" &&
      new Date(r.end_at) > dayEnd,
  );

  const completed = filtered.filter(
    (r) =>
      r.status === "checked_out" &&
      r.checked_out_at &&
      new Date(r.checked_out_at as any) >= dayStart &&
      new Date(r.checked_out_at as any) <= dayEnd,
  );

  const checkInMut = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from("reservations")
        .update({
          status: "checked_in",
          checked_in_at: new Date().toISOString(),
          checked_in_by_user_id: user?.id ?? null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_d, vars) => {
      const r = rows.find((x) => x.id === vars.id);
      const petName = r?.reservation_pets?.[0]?.pets?.name ?? "Pet";
      toast.success(`${petName} checked in`);
      qc.invalidateQueries({ queryKey: ["schedule-day"] });
      qc.invalidateQueries({ queryKey: ["schedule-week"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Check-in failed"),
  });

  const checkOutMut = useMutation({
    mutationFn: async ({ id }: { id: string }) => {
      const { error } = await supabase
        .from("reservations")
        .update({
          status: "checked_out",
          checked_out_at: new Date().toISOString(),
          checked_out_by_user_id: user?.id ?? null,
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: async (_d, vars) => {
      const r = rows.find((x) => x.id === vars.id);
      const petName = r?.reservation_pets?.[0]?.pets?.name ?? "Pet";
      toast.success(`${petName} checked out`);
      qc.invalidateQueries({ queryKey: ["schedule-day"] });
      try {
        const inv = await createInvoiceForReservation(vars.id);
        if (!inv.alreadyExisted) {
          toast.success(`Invoice ${inv.invoice_number ?? ""} created`, {
            action: {
              label: "View",
              onClick: () => window.location.assign(`/invoices/${inv.id}`),
            },
          });
        }
        qc.invalidateQueries({ queryKey: ["invoices-list"] });
      } catch (e: any) {
        toast.error(`Invoice creation failed: ${e.message ?? "unknown"}`);
      }
    },
    onError: (e: any) => toast.error(e.message ?? "Check-out failed"),
  });

  const goPrev = () => {
    const d = new Date(date);
    d.setDate(d.getDate() - 1);
    setDate(startOfDay(d));
  };
  const goNext = () => {
    const d = new Date(date);
    d.setDate(d.getDate() + 1);
    setDate(startOfDay(d));
  };
  const goToday = () => setDate(startOfDay(new Date()));

  const longDate = date.toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: TZ,
  });

  const showDaycare = !enabledModules || enabledModules.has("daycare");
  const showBoarding = !enabledModules || enabledModules.has("boarding");

  return (
    <PortalLayout>
      <div className="px-8 py-6">
        {/* Header */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goPrev} aria-label="Previous day">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={goNext} aria-label="Next day">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToday}>
                Today
              </Button>
              <Input
                type="date"
                value={ymd(date)}
                onChange={(e) => {
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split("-").map(Number);
                    setDate(startOfDay(new Date(y, m - 1, d)));
                  }
                }}
                className="w-[170px] bg-background"
              />
            </div>
            <h1 className="mt-3 font-display text-2xl text-foreground">{longDate}</h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-md border border-border bg-card p-0.5">
              <button
                onClick={() => setView("day")}
                className={`rounded-sm px-3 py-1.5 text-xs font-semibold transition ${
                  view === "day" ? "bg-primary text-primary-foreground" : "text-text-secondary"
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setView("week")}
                className={`rounded-sm px-3 py-1.5 text-xs font-semibold transition ${
                  view === "week" ? "bg-primary text-primary-foreground" : "text-text-secondary"
                }`}
              >
                Week
              </button>
            </div>

            <div className="inline-flex rounded-pill border border-border bg-card p-0.5">
              {(
                [
                  { k: "all", label: "All" },
                  ...(showDaycare ? [{ k: "daycare", label: "Daycare" }] : []),
                  ...(showBoarding ? [{ k: "boarding", label: "Boarding" }] : []),
                ] as { k: ModuleFilter; label: string }[]
              ).map((p) => (
                <button
                  key={p.k}
                  onClick={() => setModuleFilter(p.k)}
                  className={`rounded-pill px-3 py-1 text-xs font-semibold transition ${
                    moduleFilter === p.k ? "bg-primary text-primary-foreground" : "text-text-secondary"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Expected" value={expected.length} variant="cotton" />
          <StatCard label="On Site" value={checkedIn.length + boardingOvernight.length} variant="vanilla" />
          <StatCard label="Boarding" value={boardingOvernight.length} variant="frost" />
          <StatCard label="Completed" value={completed.length} variant="mist" />
        </div>

        {view === "week" ? (
          <WeekView
            selectedDate={date}
            moduleFilter={moduleFilter}
            onPickDay={(d) => {
              setDate(startOfDay(d));
              setView("day");
            }}
          />
        ) : isLoading ? (
          <div className="rounded-lg border border-border bg-card p-12 text-center text-sm text-text-secondary">
            Loading…
          </div>
        ) : (
          <div className="space-y-6">
            <Section title="Expected" count={expected.length}>
              {expected.length === 0 ? (
                <EmptyRow text="No expected reservations" />
              ) : (
                expected.map((r) => (
                  <ReservationCard
                    key={r.id}
                    reservation={r}
                    timezone={TZ}
                    action={{
                      label: "Check In",
                      onClick: () => checkInMut.mutate({ id: r.id }),
                      loading: checkInMut.isPending && checkInMut.variables?.id === r.id,
                    }}
                  />
                ))
              )}
            </Section>

            <Section title="Checked In" count={checkedIn.length}>
              {checkedIn.length === 0 ? (
                <EmptyRow text="No pets currently on site" />
              ) : (
                checkedIn.map((r) => {
                  const overdue = new Date() > new Date(r.end_at);
                  return (
                    <ReservationCard
                      key={r.id}
                      reservation={r}
                      timezone={TZ}
                      overdue={overdue}
                      meta={`In ${formatTime(r.checked_in_at as any, TZ)} · Out by ${formatTime(r.end_at, TZ)}`}
                      action={{
                        label: "Check Out",
                        variant: "outline",
                        onClick: () => checkOutMut.mutate({ id: r.id }),
                        loading: checkOutMut.isPending && checkOutMut.variables?.id === r.id,
                      }}
                    />
                  );
                })
              )}
            </Section>

            <Section title="Boarding Overnight" count={boardingOvernight.length}>
              {boardingOvernight.length === 0 ? (
                <EmptyRow text="No overnight boarders" />
              ) : (
                boardingOvernight.map((r) => {
                  const start = new Date(r.start_at);
                  const end = new Date(r.end_at);
                  const totalNights = nightsBetween(start, end);
                  const elapsed = Math.max(
                    1,
                    Math.min(totalNights, nightsBetween(start, date) + 1),
                  );
                  return (
                    <ReservationCard
                      key={r.id}
                      reservation={r}
                      timezone={TZ}
                      meta={`Night ${elapsed} of ${totalNights} · Out ${end.toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        timeZone: TZ,
                      })}`}
                    />
                  );
                })
              )}
            </Section>

            <Section
              title="Completed Today"
              count={completed.length}
              collapsible
              open={completedOpen}
              onToggle={() => setCompletedOpen((o) => !o)}
            >
              {completed.length === 0 ? (
                <EmptyRow text="No checkouts today" />
              ) : (
                completed.map((r) => (
                  <ReservationCard
                    key={r.id}
                    reservation={r}
                    timezone={TZ}
                    meta={`${formatTime(r.checked_in_at as any, TZ)} → ${formatTime(
                      r.checked_out_at as any,
                      TZ,
                    )}`}
                  />
                ))
              )}
            </Section>

            <Section title="Group Classes" count={classInstances.length}>
              {classInstances.length === 0 ? (
                <EmptyRow text="No classes scheduled today" />
              ) : (
                classInstances.map((c: any) => (
                  <Link
                    key={c.id}
                    to="/group-classes"
                    className="block rounded-lg border border-border bg-card p-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium text-foreground">{c.class_type?.name ?? "Class"}</div>
                        <div className="text-xs text-text-secondary">
                          {formatTime(c.start_at, TZ)} – {formatTime(c.end_at, TZ)}
                        </div>
                      </div>
                      <span className="rounded-pill bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-text-secondary">
                        Class
                      </span>
                    </div>
                  </Link>
                ))
              )}
            </Section>
          </div>
        )}
      </div>
    </PortalLayout>
  );
}

function Section({
  title,
  count,
  children,
  collapsible,
  open,
  onToggle,
}: {
  title: string;
  count: number;
  children: React.ReactNode;
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
}) {
  const isOpen = collapsible ? !!open : true;
  return (
    <section>
      <header className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
          <span className="rounded-pill bg-card px-2 py-0.5 text-xs font-semibold text-text-secondary">
            {count}
          </span>
        </div>
        {collapsible && (
          <button
            onClick={onToggle}
            className="inline-flex items-center gap-1 text-xs font-semibold text-text-secondary hover:text-foreground"
          >
            {isOpen ? "Hide" : "Show"}
            {isOpen ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        )}
      </header>
      {isOpen && <div className="space-y-2">{children}</div>}
    </section>
  );
}

function EmptyRow({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card/40 px-4 py-5 text-center text-xs text-text-tertiary">
      {text}
    </div>
  );
}
