import { useMemo, useState } from "react";
import PortalLayout from "@/components/portal/PortalLayout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Scissors, Play, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format, addDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useGroomingAppointments, type GroomingAppointment } from "@/hooks/useGroomingAppointments";
import { useGroomers } from "@/hooks/useGroomers";
import GroomingAppointmentDialog from "./GroomingAppointmentDialog";

const STATUS_META: Record<string, { label: string; className: string }> = {
  scheduled: { label: "Scheduled", className: "bg-teal-light text-teal" },
  in_progress: { label: "In Progress", className: "bg-warning-light text-warning" },
  completed: { label: "Completed", className: "bg-success-light text-success" },
  cancelled: { label: "Cancelled", className: "bg-muted text-text-secondary" },
  no_show: { label: "No Show", className: "bg-destructive-light text-destructive" },
};

function StatusBadge({ status }: { status: string }) {
  const m = STATUS_META[status] ?? { label: status, className: "bg-muted text-text-secondary" };
  return <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium", m.className)}>{m.label}</span>;
}

function fmtTime(t: string) {
  const [h, m] = t.split(":");
  const hh = parseInt(h, 10);
  const ampm = hh >= 12 ? "PM" : "AM";
  const h12 = hh % 12 || 12;
  return `${h12}:${m} ${ampm}`;
}

export default function Grooming() {
  const [date, setDate] = useState<Date>(new Date());
  const dateStr = format(date, "yyyy-MM-dd");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tab, setTab] = useState("schedule");

  const { data: appts = [], isLoading } = useGroomingAppointments(dateStr);
  const { data: groomers = [] } = useGroomers({ activeOnly: true });
  const qc = useQueryClient();

  const stats = useMemo(() => {
    const scheduled = appts.filter((a) => a.status === "scheduled").length;
    const inProgress = appts.filter((a) => a.status === "in_progress").length;
    const completed = appts.filter((a) => a.status === "completed").length;
    const revenue = appts
      .filter((a) => a.status === "completed")
      .reduce((sum, a) => sum + (a.price_cents ?? 0), 0);
    return { scheduled, inProgress, completed, revenue };
  }, [appts]);

  const transition = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updates: any = { status };
      if (status === "in_progress") updates.check_in_time = new Date().toISOString();
      if (status === "completed") updates.completed_time = new Date().toISOString();
      const { error } = await supabase.from("grooming_appointments").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, vars) => {
      toast.success(`Appointment ${STATUS_META[vars.status]?.label.toLowerCase()}`);
      qc.invalidateQueries({ queryKey: ["grooming-appointments"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed"),
  });

  const apptsByGroomer = useMemo(() => {
    const map = new Map<string, GroomingAppointment[]>();
    groomers.forEach((g) => map.set(g.id, []));
    appts.forEach((a) => {
      if (!map.has(a.groomer_id)) map.set(a.groomer_id, []);
      map.get(a.groomer_id)!.push(a);
    });
    return map;
  }, [appts, groomers]);

  const renderActions = (a: GroomingAppointment) => {
    if (a.status === "scheduled") {
      return (
        <div className="flex gap-1">
          <Button size="sm" variant="outline" onClick={() => transition.mutate({ id: a.id, status: "in_progress" })}>
            <Play className="h-3 w-3" /> Start
          </Button>
          <Button size="sm" variant="outline" onClick={() => transition.mutate({ id: a.id, status: "cancelled" })}>
            <XCircle className="h-3 w-3" /> Cancel
          </Button>
          <Button size="sm" variant="outline" onClick={() => transition.mutate({ id: a.id, status: "no_show" })}>
            No Show
          </Button>
        </div>
      );
    }
    if (a.status === "in_progress") {
      return (
        <Button size="sm" onClick={() => transition.mutate({ id: a.id, status: "completed" })}>
          <CheckCircle2 className="h-3 w-3" /> Complete
        </Button>
      );
    }
    return <span className="text-xs text-text-tertiary">—</span>;
  };

  return (
    <PortalLayout>
      <div className="px-8 py-6">
        <header className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="font-display text-2xl text-foreground">Grooming</h1>
            <p className="mt-1 text-sm text-text-secondary">Schedule and track grooming appointments</p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4" /> New Appointment
          </Button>
        </header>

        {/* Date nav */}
        <div className="mb-4 flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setDate((d) => addDays(d, -1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={() => setDate(new Date())}>Today</Button>
          <Button variant="outline" size="icon" onClick={() => setDate((d) => addDays(d, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="ml-2">
                <CalendarIcon className="h-4 w-4" />
                {format(date, "EEEE, MMM d, yyyy")}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* KPIs */}
        <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-4 border-l-4" style={{ borderLeftColor: "hsl(var(--brand-cotton))" }}>
            <div className="label-eyebrow">Scheduled Today</div>
            <div className="mt-1 font-display text-2xl text-foreground">{stats.scheduled}</div>
          </Card>
          <Card className="p-4 border-l-4" style={{ borderLeftColor: "hsl(var(--brand-vanilla))" }}>
            <div className="label-eyebrow">In Progress</div>
            <div className="mt-1 font-display text-2xl text-foreground">{stats.inProgress}</div>
          </Card>
          <Card className="p-4 border-l-4" style={{ borderLeftColor: "hsl(var(--brand-mist))" }}>
            <div className="label-eyebrow">Completed</div>
            <div className="mt-1 font-display text-2xl text-foreground">{stats.completed}</div>
          </Card>
          <Card className="p-4 border-l-4" style={{ borderLeftColor: "hsl(var(--brand-frost))" }}>
            <div className="label-eyebrow">Revenue Today</div>
            <div className="mt-1 font-display text-2xl text-foreground">${(stats.revenue / 100).toFixed(2)}</div>
          </Card>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="by-groomer">By Groomer</TabsTrigger>
          </TabsList>

          <TabsContent value="schedule" className="mt-4">
            <Card className="p-0 overflow-hidden">
              {isLoading ? (
                <div className="p-8 text-sm text-text-secondary">Loading...</div>
              ) : appts.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 p-12 text-center">
                  <Scissors className="h-8 w-8 text-text-tertiary" />
                  <div className="font-display text-base">No appointments</div>
                  <p className="text-sm text-text-secondary">Nothing scheduled for {format(date, "MMM d")}.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Time</TableHead>
                      <TableHead>Pet</TableHead>
                      <TableHead>Owner</TableHead>
                      <TableHead>Groomer</TableHead>
                      <TableHead>Services</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appts.map((a) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium">{fmtTime(a.start_time)}</TableCell>
                        <TableCell>{a.pet?.name ?? "—"}</TableCell>
                        <TableCell>{a.owner ? `${a.owner.first_name} ${a.owner.last_name}` : "—"}</TableCell>
                        <TableCell>{a.groomer?.display_name ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {a.services_requested.map((s) => (
                              <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-text-secondary">{a.estimated_duration_minutes}m</TableCell>
                        <TableCell><StatusBadge status={a.status} /></TableCell>
                        <TableCell className="text-right">{renderActions(a)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </TabsContent>

          <TabsContent value="by-groomer" className="mt-4">
            {groomers.length === 0 ? (
              <Card className="p-8 text-center text-sm text-text-secondary">
                No active groomers. Add some in Groomer Management.
              </Card>
            ) : (
              <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(groomers.length, 4)}, minmax(0, 1fr))` }}>
                {groomers.map((g) => {
                  const list = apptsByGroomer.get(g.id) ?? [];
                  return (
                    <Card key={g.id} className="p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="font-display text-base">{g.display_name}</div>
                        <Badge variant="secondary" className="text-[10px]">{list.length}</Badge>
                      </div>
                      <div className="space-y-2">
                        {list.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-text-tertiary">
                            No appointments
                          </div>
                        ) : (
                          list.map((a) => (
                            <div key={a.id} className="rounded-lg border border-border bg-surface p-3">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                                  <Clock className="h-3 w-3" />
                                  {fmtTime(a.start_time)} · {a.estimated_duration_minutes}m
                                </div>
                                <StatusBadge status={a.status} />
                              </div>
                              <div className="mt-1.5 text-sm font-medium">{a.pet?.name}</div>
                              <div className="text-xs text-text-tertiary">
                                {a.owner ? `${a.owner.first_name} ${a.owner.last_name}` : ""}
                              </div>
                              {a.services_requested.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {a.services_requested.map((s) => (
                                    <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <GroomingAppointmentDialog open={dialogOpen} onOpenChange={setDialogOpen} defaultDate={dateStr} />
    </PortalLayout>
  );
}
