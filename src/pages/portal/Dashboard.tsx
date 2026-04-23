import React, { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Search,
  LogIn,
  LogOut,
  Check,
  X,
  Loader2,
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  ChevronDown,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import PortalLayout from "@/components/portal/PortalLayout";
import { useAuth } from "@/hooks/useAuth";
import { greeting } from "@/lib/timezones";
import { supabase } from "@/integrations/supabase/client";
import { useLocationFilter } from "@/contexts/LocationContext";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { createInvoiceForReservation } from "@/lib/invoice";
import { formatTime } from "@/lib/money";

const TZ = "America/Edmonton";

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
function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

type Row = {
  id: string;
  start_at: string;
  end_at: string;
  status: string;
  checked_in_at: string | null;
  checked_out_at: string | null;
  services: { name: string | null; module: string | null } | null;
  owners: { id: string; first_name: string | null; last_name: string | null } | null;
  reservation_pets: { pets: { id: string; name: string | null } | null }[];
};

type DrillKey = "arriving" | "departing" | "overnight" | "onsite" | null;

export default function Dashboard() {
  const { profile, user } = useAuth();
  const qc = useQueryClient();
  const locationId = useLocationFilter();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [drill, setDrill] = useState<DrillKey>(null);
  const [datePopoverOpen, setDatePopoverOpen] = useState(false);
  const [moduleFilter, setModuleFilter] = useState<"all" | "daycare" | "boarding" | "grooming" | "training">("all");
  const [searchTerm, setSearchTerm] = useState("");

  const dayStart = startOfDay(selectedDate);
  const dayEnd = endOfDay(selectedDate);

  const { data: rows = [] } = useQuery({
    queryKey: ["dashboard-day", locationId, dayStart.toISOString()],
    queryFn: async () => {
      let q = supabase
        .from("reservations")
        .select(
          `id, start_at, end_at, status, checked_in_at, checked_out_at,
           services:service_id(name, module),
           owners:primary_owner_id(id, first_name, last_name),
           reservation_pets(pets(id, name))`,
        )
        .is("deleted_at", null)
        .or(
          `and(start_at.gte.${dayStart.toISOString()},start_at.lte.${dayEnd.toISOString()}),and(checked_in_at.lte.${dayEnd.toISOString()},or(checked_out_at.is.null,checked_out_at.gte.${dayStart.toISOString()})),and(end_at.gte.${dayStart.toISOString()},end_at.lte.${dayEnd.toISOString()})`,
        )
        .order("start_at", { ascending: true });
      if (locationId) q = q.eq("location_id", locationId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  // Apply module filter to all rows first
  const filteredRows = useMemo(() => {
    if (moduleFilter === "all") return rows;
    return rows.filter((r) => r.services?.module === moduleFilter);
  }, [rows, moduleFilter]);

  // Apply search term across pet + owner names
  const searchFilter = (list: Row[]) => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return list;
    return list.filter((r) => {
      const pets = petNames(r).toLowerCase();
      const owner = ownerName(r).toLowerCase();
      return pets.includes(term) || owner.includes(term);
    });
  };

  const expectedAll = useMemo(
    () =>
      filteredRows.filter(
        (r) =>
          r.status === "confirmed" &&
          new Date(r.start_at) >= dayStart &&
          new Date(r.start_at) <= dayEnd,
      ),
    [filteredRows, dayStart, dayEnd],
  );

  const checkedInAll = useMemo(
    () =>
      filteredRows.filter(
        (r) =>
          r.status === "checked_in" &&
          (!r.checked_in_at || new Date(r.checked_in_at) <= dayEnd) &&
          (!r.checked_out_at || new Date(r.checked_out_at) >= dayStart),
      ),
    [filteredRows, dayStart, dayEnd],
  );

  const goingHomeAll = useMemo(
    () =>
      filteredRows.filter(
        (r) =>
          r.status === "checked_in" &&
          new Date(r.end_at) >= dayStart &&
          new Date(r.end_at) <= dayEnd,
      ),
    [filteredRows, dayStart, dayEnd],
  );

  const requestedAll = useMemo(
    () =>
      filteredRows.filter(
        (r) =>
          r.status === "requested" &&
          new Date(r.start_at) >= dayStart &&
          new Date(r.start_at) <= dayEnd,
      ),
    [filteredRows, dayStart, dayEnd],
  );

  // Search-filtered versions for the tabs (counts in tab labels reflect search)
  const expected = useMemo(() => searchFilter(expectedAll), [expectedAll, searchTerm]);
  const checkedIn = useMemo(() => searchFilter(checkedInAll), [checkedInAll, searchTerm]);
  const goingHome = useMemo(() => searchFilter(goingHomeAll), [goingHomeAll, searchTerm]);
  const requested = useMemo(() => searchFilter(requestedAll), [requestedAll, searchTerm]);

  // Counters use the (unsearched) filtered totals so KPIs reflect day+module
  const arrivingCount = expectedAll.length;
  const departingCount = goingHomeAll.length;
  const overnight = useMemo(
    () =>
      checkedInAll.filter(
        (r) => r.services?.module === "boarding" && new Date(r.end_at) > dayEnd,
      ),
    [checkedInAll, dayEnd],
  );
  const overnightCount = overnight.length;
  const onSiteCount = checkedInAll.length;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["dashboard-day"] });
    qc.invalidateQueries({ queryKey: ["schedule-day"] });
    qc.invalidateQueries({ queryKey: ["schedule-week"] });
  };

  const checkInMut = useMutation({
    mutationFn: async (id: string) => {
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
    onSuccess: () => {
      toast.success("Checked in");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message ?? "Check-in failed"),
  });

  const checkOutMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("reservations")
        .update({
          status: "checked_out",
          checked_out_at: new Date().toISOString(),
          checked_out_by_user_id: user?.id ?? null,
        })
        .eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: async (id) => {
      toast.success("Checked out");
      invalidate();
      try {
        const inv = await createInvoiceForReservation(id);
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

  const approveMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reservations").update({ status: "confirmed" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reservation approved");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message ?? "Approval failed"),
  });

  const declineMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("reservations").update({ status: "cancelled" }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Reservation declined");
      invalidate();
    },
    onError: (e: any) => toast.error(e.message ?? "Decline failed"),
  });

  const [quickOpen, setQuickOpen] = useState(false);

  const firstName = profile?.first_name || "there";
  const dateLabel = selectedDate.toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Regina",
  });
  const shortDateLabel = selectedDate.toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Regina",
  });

  const today = new Date();
  const isToday = isSameDay(selectedDate, today);

  const shiftDay = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
    setDrill(null);
  };

  const kpis: { key: Exclude<DrillKey, null>; label: string; value: number; bar: string; bg: string }[] = [
    { key: "arriving", label: "Arriving", value: arrivingCount, bar: "bg-success", bg: "bg-brand-mist-bg" },
    { key: "departing", label: "Departing", value: departingCount, bar: "bg-teal", bg: "bg-brand-frost-bg" },
    { key: "overnight", label: "Overnight", value: overnightCount, bar: "bg-plum", bg: "bg-brand-cotton-bg" },
    { key: "onsite", label: "Total On Site", value: onSiteCount, bar: "bg-primary", bg: "bg-brand-vanilla-bg" },
  ];

  const toggleDrill = (k: Exclude<DrillKey, null>) => setDrill((cur) => (cur === k ? null : k));

  return (
    <PortalLayout>
      <div className="px-8 py-6">
        <header className="mb-5">
          <h1 className="font-display text-2xl text-foreground">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {shortDateLabel} · {arrivingCount} arriving · {onSiteCount} on site
          </p>
        </header>

        {/* Date Navigation */}
        <div className="mb-5 flex flex-wrap items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => shiftDay(-1)} aria-label="Previous day">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant={isToday ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setSelectedDate(new Date());
              setDrill(null);
            }}
          >
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={() => shiftDay(1)} aria-label="Next day">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2 font-normal">
                <CalendarIcon className="h-4 w-4" />
                {dateLabel}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(d) => {
                  if (d) {
                    setSelectedDate(d);
                    setDrill(null);
                    setDatePopoverOpen(false);
                  }
                }}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Daily Summary */}
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((k) => {
            const active = drill === k.key;
            return (
              <button
                key={k.key}
                type="button"
                onClick={() => toggleDrill(k.key)}
                className={cn(
                  "group relative overflow-hidden rounded-lg border p-5 text-left shadow-card transition-all",
                  k.bg,
                  active ? "border-primary ring-2 ring-primary/30" : "border-border hover:border-primary/40",
                )}
              >
                <span className={`absolute left-0 top-0 h-full w-1 ${k.bar}`} />
                <div className="flex items-start justify-between">
                  <div>
                    <div className="label-eyebrow">{k.label}</div>
                    <div className="mt-2 font-display text-3xl font-bold text-foreground">{k.value}</div>
                  </div>
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 text-text-tertiary transition-transform",
                      active && "rotate-180 text-primary",
                    )}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Drill-down panel */}
        {drill && (
          <section className="mb-6 animate-fade-in overflow-hidden rounded-lg border border-border bg-surface shadow-card">
            <div className="flex items-center justify-between border-b border-border-subtle px-5 py-3">
              <h2 className="font-display text-base font-semibold text-foreground">
                {drill === "arriving" && "Arriving"}
                {drill === "departing" && "Departing"}
                {drill === "overnight" && "Overnight Boarders"}
                {drill === "onsite" && "Total On Site"}
              </h2>
              <Button variant="ghost" size="sm" onClick={() => setDrill(null)} className="gap-1">
                <X className="h-3.5 w-3.5" />
                Close
              </Button>
            </div>
            {drill === "arriving" && (
              <GroupedTable
                rows={expectedAll}
                emptyText="No arrivals for this day"
                columns={["Pet", "Owner", "Service", "Scheduled Time", "Status"]}
                renderRow={(r) => [
                  <PetCell r={r} />,
                  ownerName(r),
                  r.services?.name ?? "—",
                  formatTime(r.start_at, TZ),
                  <StatusPill label={r.status === "confirmed" ? "Confirmed" : "Pending"} tone={r.status === "confirmed" ? "success" : "warning"} />,
                ]}
              />
            )}
            {drill === "departing" && (
              <GroupedTable
                rows={goingHomeAll}
                emptyText="No departures for this day"
                columns={["Pet", "Owner", "Service", "Scheduled Pickup", "Status"]}
                renderRow={(r) => [
                  <PetCell r={r} />,
                  ownerName(r),
                  r.services?.name ?? "—",
                  formatTime(r.end_at, TZ),
                  <StatusPill label={r.checked_out_at ? "Checked Out" : "Ready"} tone="teal" />,
                ]}
              />
            )}
            {drill === "overnight" && (
              <FlatTable
                rows={overnight}
                emptyText="No overnight boarders"
                columns={["Pet", "Owner", "Check-in", "Scheduled Checkout", "Nights Remaining"]}
                renderRow={(r) => {
                  const end = new Date(r.end_at);
                  const nights = Math.max(
                    0,
                    Math.ceil((end.getTime() - dayEnd.getTime()) / (1000 * 60 * 60 * 24)),
                  );
                  return [
                    <PetCell r={r} />,
                    ownerName(r),
                    r.checked_in_at ? format(new Date(r.checked_in_at), "MMM d, h:mm a") : "—",
                    format(end, "MMM d, h:mm a"),
                    `${nights} night${nights === 1 ? "" : "s"}`,
                  ];
                }}
              />
            )}
            {drill === "onsite" && (
              <GroupedTable
                rows={checkedIn}
                emptyText="No pets currently on site"
                columns={["Pet", "Owner", "Service", "Checked In"]}
                renderRow={(r) => [
                  <PetCell r={r} />,
                  ownerName(r),
                  r.services?.name ?? "—",
                  r.checked_in_at ? formatTime(r.checked_in_at, TZ) : "—",
                ]}
              />
            )}
          </section>
        )}

        {/* Quick Actions */}
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Button size="lg" onClick={() => setQuickOpen(true)} className="gap-2">
            <Search className="h-4 w-4" />
            Quick Check-In
          </Button>
        </div>

        {/* Today's Reservations */}
        <section className="rounded-lg border border-border bg-surface shadow-card">
          <Tabs defaultValue="expected" className="w-full">
            <div className="border-b border-border-subtle px-5 pt-4">
              <TabsList>
                <TabsTrigger value="expected">Expected ({expected.length})</TabsTrigger>
                <TabsTrigger value="checkedin">Checked In ({checkedIn.length})</TabsTrigger>
                <TabsTrigger value="going">Going Home ({goingHome.length})</TabsTrigger>
                <TabsTrigger value="requested">Requested ({requested.length})</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="expected" className="m-0">
              <ResTable
                rows={expected}
                emptyText="No expected arrivals"
                timeLabel="Scheduled"
                getTime={(r) => formatTime(r.start_at, TZ)}
                action={(r) => (
                  <Button
                    size="sm"
                    onClick={() => checkInMut.mutate(r.id)}
                    disabled={checkInMut.isPending}
                    className="gap-1"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    Check In
                  </Button>
                )}
              />
            </TabsContent>

            <TabsContent value="checkedin" className="m-0">
              <ResTable
                rows={checkedIn}
                emptyText="No pets currently on site"
                timeLabel="Checked In"
                getTime={(r) => (r.checked_in_at ? formatTime(r.checked_in_at, TZ) : "—")}
                action={(r) => (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => checkOutMut.mutate(r.id)}
                    disabled={checkOutMut.isPending}
                    className="gap-1"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Check Out
                  </Button>
                )}
              />
            </TabsContent>

            <TabsContent value="going" className="m-0">
              <ResTable
                rows={goingHome}
                emptyText="No departures today"
                timeLabel="Scheduled Pickup"
                getTime={(r) => formatTime(r.end_at, TZ)}
                action={(r) => (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => checkOutMut.mutate(r.id)}
                    disabled={checkOutMut.isPending}
                    className="gap-1"
                  >
                    <LogOut className="h-3.5 w-3.5" />
                    Check Out
                  </Button>
                )}
              />
            </TabsContent>

            <TabsContent value="requested" className="m-0">
              <ResTable
                rows={requested}
                emptyText="No pending requests"
                timeLabel="Requested Date"
                getTime={(r) =>
                  new Date(r.start_at).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    timeZone: TZ,
                  })
                }
                action={(r) => (
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => approveMut.mutate(r.id)}
                      disabled={approveMut.isPending}
                      className="gap-1"
                    >
                      <Check className="h-3.5 w-3.5" />
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => declineMut.mutate(r.id)}
                      disabled={declineMut.isPending}
                      className="gap-1"
                    >
                      <X className="h-3.5 w-3.5" />
                      Decline
                    </Button>
                  </div>
                )}
              />
            </TabsContent>
          </Tabs>
        </section>
      </div>

      <QuickCheckInDialog
        open={quickOpen}
        onOpenChange={setQuickOpen}
        candidates={expected}
        onCheckIn={(id) => {
          checkInMut.mutate(id);
          setQuickOpen(false);
        }}
        loading={checkInMut.isPending}
      />
    </PortalLayout>
  );
}

function petNames(r: Row) {
  return (r.reservation_pets ?? [])
    .map((rp) => rp.pets?.name)
    .filter(Boolean)
    .join(", ");
}

function ownerName(r: Row) {
  return [r.owners?.first_name, r.owners?.last_name].filter(Boolean).join(" ") || "—";
}

function PetCell({ r }: { r: Row }) {
  return (
    <Link to={`/reservations/${r.id}`} className="font-medium text-foreground hover:text-primary">
      {petNames(r) || "—"}
    </Link>
  );
}

function StatusPill({ label, tone }: { label: string; tone: "success" | "warning" | "teal" }) {
  const cls =
    tone === "success"
      ? "bg-success-bg text-success"
      : tone === "warning"
        ? "bg-warning-bg text-warning"
        : "bg-brand-frost-bg text-teal";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", cls)}>
      {label}
    </span>
  );
}

function moduleLabel(m: string | null | undefined) {
  switch (m) {
    case "daycare":
      return "Daycare";
    case "boarding":
      return "Boarding";
    case "grooming":
      return "Grooming";
    case "training":
      return "Training";
    default:
      return "Other";
  }
}

function FlatTable({
  rows,
  emptyText,
  columns,
  renderRow,
}: {
  rows: Row[];
  emptyText: string;
  columns: string[];
  renderRow: (r: Row) => React.ReactNode[];
}) {
  if (rows.length === 0) {
    return (
      <div className="px-5 py-10 text-center font-display text-sm text-text-secondary">{emptyText}</div>
    );
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-background">
          <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
            {columns.map((c) => (
              <th key={c} className="px-5 py-3">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const cells = renderRow(r);
            return (
              <tr key={r.id} className="border-t border-border-subtle hover:bg-background/60">
                {cells.map((c, i) => (
                  <td key={i} className="px-5 py-3 text-text-secondary">
                    {c}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function GroupedTable({
  rows,
  emptyText,
  columns,
  renderRow,
}: {
  rows: Row[];
  emptyText: string;
  columns: string[];
  renderRow: (r: Row) => React.ReactNode[];
}) {
  if (rows.length === 0) {
    return (
      <div className="px-5 py-10 text-center font-display text-sm text-text-secondary">{emptyText}</div>
    );
  }
  const groups = new Map<string, Row[]>();
  for (const r of rows) {
    const key = moduleLabel(r.services?.module);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }
  const order = ["Daycare", "Boarding", "Grooming", "Training", "Other"];
  const sorted = Array.from(groups.entries()).sort(
    (a, b) => order.indexOf(a[0]) - order.indexOf(b[0]),
  );
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-background">
          <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
            {columns.map((c) => (
              <th key={c} className="px-5 py-3">
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sorted.map(([group, list]) => (
            <React.Fragment key={`grp-${group}`}>
              <tr className="bg-background/60">
                <td
                  colSpan={columns.length}
                  className="px-5 py-2 text-[11px] font-semibold uppercase tracking-wider text-text-secondary"
                >
                  {group} · {list.length}
                </td>
              </tr>
              {list.map((r) => {
                const cells = renderRow(r);
                return (
                  <tr key={r.id} className="border-t border-border-subtle hover:bg-background/60">
                    {cells.map((c, i) => (
                      <td key={i} className="px-5 py-3 text-text-secondary">
                        {c}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ResTable({
  rows,
  emptyText,
  timeLabel,
  getTime,
  action,
}: {
  rows: Row[];
  emptyText: string;
  timeLabel: string;
  getTime: (r: Row) => string;
  action: (r: Row) => React.ReactNode;
}) {
  return (
    <div className="overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-background">
          <tr className="text-left text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
            <th className="px-5 py-3">Pet</th>
            <th className="px-5 py-3">Owner</th>
            <th className="px-5 py-3">Service</th>
            <th className="px-5 py-3">{timeLabel}</th>
            <th className="px-5 py-3 text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-5 py-12 text-center">
                <div className="font-display text-base text-foreground">{emptyText}</div>
              </td>
            </tr>
          ) : (
            rows.map((r) => (
              <tr key={r.id} className="border-t border-border-subtle hover:bg-background/60">
                <td className="px-5 py-3">
                  <Link to={`/reservations/${r.id}`} className="font-medium text-foreground hover:text-primary">
                    {petNames(r) || "—"}
                  </Link>
                </td>
                <td className="px-5 py-3 text-text-secondary">{ownerName(r)}</td>
                <td className="px-5 py-3 text-text-secondary">{r.services?.name ?? "—"}</td>
                <td className="px-5 py-3 text-text-secondary">{getTime(r)}</td>
                <td className="px-5 py-3 text-right">{action(r)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

function QuickCheckInDialog({
  open,
  onOpenChange,
  candidates,
  onCheckIn,
  loading,
}: {
  open: boolean;
  onOpenChange: (b: boolean) => void;
  candidates: Row[];
  onCheckIn: (id: string) => void;
  loading: boolean;
}) {
  const [q, setQ] = useState("");
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return candidates;
    return candidates.filter((r) => {
      const pets = petNames(r).toLowerCase();
      const owner = ownerName(r).toLowerCase();
      return pets.includes(term) || owner.includes(term);
    });
  }, [candidates, q]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Quick Check-In</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
          <Input
            autoFocus
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search pet or owner name…"
            className="pl-9"
          />
        </div>
        <div className="max-h-80 overflow-y-auto rounded-md border border-border-subtle">
          {filtered.length === 0 ? (
            <div className="p-6 text-center text-sm text-text-secondary">
              {candidates.length === 0 ? "No expected arrivals today" : "No matches"}
            </div>
          ) : (
            <ul className="divide-y divide-border-subtle">
              {filtered.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium text-foreground">{petNames(r) || "—"}</div>
                    <div className="truncate text-xs text-text-secondary">
                      {ownerName(r)} · {r.services?.name ?? "—"} · {formatTime(r.start_at, TZ)}
                    </div>
                  </div>
                  <Button size="sm" onClick={() => onCheckIn(r.id)} disabled={loading} className="gap-1">
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <LogIn className="h-3.5 w-3.5" />}
                    Check In
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
