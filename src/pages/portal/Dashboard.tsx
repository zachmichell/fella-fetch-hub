import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, LogIn, LogOut, Check, X, Loader2 } from "lucide-react";
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

export default function Dashboard() {
  const { profile, user } = useAuth();
  const qc = useQueryClient();
  const locationId = useLocationFilter();

  const today = new Date();
  const dayStart = startOfDay(today);
  const dayEnd = endOfDay(today);

  const { data: rows = [] } = useQuery({
    queryKey: ["dashboard-today", locationId, dayStart.toISOString()],
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
          `and(start_at.gte.${dayStart.toISOString()},start_at.lte.${dayEnd.toISOString()}),status.eq.checked_in,and(end_at.gte.${dayStart.toISOString()},end_at.lte.${dayEnd.toISOString()})`,
        )
        .order("start_at", { ascending: true });
      if (locationId) q = q.eq("location_id", locationId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as Row[];
    },
  });

  const expected = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.status === "confirmed" &&
          new Date(r.start_at) >= dayStart &&
          new Date(r.start_at) <= dayEnd,
      ),
    [rows, dayStart, dayEnd],
  );

  const checkedIn = useMemo(() => rows.filter((r) => r.status === "checked_in"), [rows]);

  const goingHome = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.status === "checked_in" &&
          new Date(r.end_at) >= dayStart &&
          new Date(r.end_at) <= dayEnd,
      ),
    [rows, dayStart, dayEnd],
  );

  const requested = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.status === "requested" &&
          new Date(r.start_at) >= dayStart &&
          new Date(r.start_at) <= dayEnd,
      ),
    [rows, dayStart, dayEnd],
  );

  // Counters
  const arrivingCount = expected.length;
  const departingCount = goingHome.length;
  const overnightCount = useMemo(
    () =>
      rows.filter(
        (r) =>
          r.status === "checked_in" &&
          r.services?.module === "boarding" &&
          new Date(r.end_at) > dayEnd,
      ).length,
    [rows, dayEnd],
  );
  const onSiteCount = checkedIn.length;

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["dashboard-today"] });
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
  const todayLabel = today.toLocaleDateString("en-CA", {
    weekday: "long",
    month: "long",
    day: "numeric",
    timeZone: "America/Regina",
  });

  const kpis = [
    { label: "Arriving", value: arrivingCount, bar: "bg-success", bg: "bg-brand-mist-bg" },
    { label: "Departing", value: departingCount, bar: "bg-teal", bg: "bg-brand-frost-bg" },
    { label: "Overnight", value: overnightCount, bar: "bg-plum", bg: "bg-brand-cotton-bg" },
    { label: "Total On Site", value: onSiteCount, bar: "bg-primary", bg: "bg-brand-vanilla-bg" },
  ];

  return (
    <PortalLayout>
      <div className="px-8 py-6">
        <header className="mb-6">
          <h1 className="font-display text-2xl text-foreground">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            {todayLabel} · {arrivingCount} arriving · {onSiteCount} on site
          </p>
        </header>

        {/* Daily Summary */}
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
