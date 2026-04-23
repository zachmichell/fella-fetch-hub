import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BedDouble, GripVertical } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSuites, type SuiteRow } from "@/hooks/useSuites";
import { useLocationFilter } from "@/contexts/LocationContext";
import { cn } from "@/lib/utils";

const UNASSIGNED = "__unassigned__";
const MIME = "application/x-snout-resv";

type BoardResv = {
  id: string;
  status: string;
  start_at: string;
  end_at: string;
  suite_id: string | null;
  primary_owner_id: string | null;
  reservation_pets: { pets: { id: string; name: string } | null }[];
  owners: { first_name: string | null; last_name: string | null } | null;
};

export default function SuiteBoard() {
  const { membership } = useAuth();
  const orgId = membership?.organization_id;
  const locationId = useLocationFilter();
  const qc = useQueryClient();

  const allSuites = useSuites({ activeOnly: true });
  const suites = (allSuites.data ?? []).filter(
    (s: any) => !locationId || s.location_id === locationId,
  );

  const todayIso = new Date().toISOString();

  const { data: reservations = [], isLoading } = useQuery({
    queryKey: ["lodging-board", orgId, locationId],
    enabled: !!orgId,
    queryFn: async () => {
      let q = supabase
        .from("reservations")
        .select(
          "id, status, start_at, end_at, suite_id, primary_owner_id, reservation_pets(pets(id, name)), owners:primary_owner_id(first_name, last_name)",
        )
        .eq("organization_id", orgId!)
        .in("status", ["confirmed", "checked_in"])
        .is("deleted_at", null)
        .lte("start_at", todayIso)
        .gte("end_at", todayIso);
      if (locationId) q = q.eq("location_id", locationId);
      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as unknown as BoardResv[];
    },
  });

  const moveMut = useMutation({
    mutationFn: async ({ id, suite_id }: { id: string; suite_id: string | null }) => {
      const { error } = await supabase
        .from("reservations")
        .update({ suite_id })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lodging-board"] });
      qc.invalidateQueries({ queryKey: ["lodging-reservations"] });
    },
    onError: (e: any) => toast.error(e.message ?? "Move failed"),
  });

  const grouped = useMemo(() => {
    const m = new Map<string, BoardResv[]>();
    m.set(UNASSIGNED, []);
    for (const s of suites) m.set(s.id, []);
    for (const r of reservations) {
      const key = r.suite_id && m.has(r.suite_id) ? r.suite_id : UNASSIGNED;
      m.get(key)!.push(r);
    }
    return m;
  }, [reservations, suites]);

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const handleDrop = (targetId: string, resvId: string) => {
    setDraggingId(null);
    setOverId(null);
    const resv = reservations.find((r) => r.id === resvId);
    if (!resv) return;
    const targetSuiteId = targetId === UNASSIGNED ? null : targetId;
    if (resv.suite_id === targetSuiteId) return;
    const targetSuite = suites.find((s) => s.id === targetSuiteId);
    const petName = resv.reservation_pets?.[0]?.pets?.name ?? "Guest";
    moveMut.mutate(
      { id: resvId, suite_id: targetSuiteId },
      {
        onSuccess: () =>
          toast.success(
            targetSuite
              ? `Moved ${petName} to ${targetSuite.name}`
              : `Unassigned ${petName} from suite`,
          ),
      },
    );
  };

  if (allSuites.isLoading || isLoading) {
    return <div className="h-64 animate-pulse rounded-lg bg-surface" />;
  }
  if (suites.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface p-12 text-center shadow-card">
        <BedDouble className="mx-auto h-10 w-10 text-text-tertiary" />
        <div className="mt-3 font-display text-lg">No active suites</div>
        <p className="mt-1 text-sm text-text-secondary">
          Add suites in Suite Management to use the board.
        </p>
      </div>
    );
  }

  const unassignedList = grouped.get(UNASSIGNED) ?? [];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <SuiteColumn
        id={UNASSIGNED}
        title="Unassigned"
        subtitle="Boarding pets without a suite"
        items={unassignedList}
        capacity={null}
        isOver={overId === UNASSIGNED}
        draggingId={draggingId}
        onDragStart={setDraggingId}
        onDragEnd={() => {
          setDraggingId(null);
          setOverId(null);
        }}
        onEnter={() => setOverId(UNASSIGNED)}
        onLeave={() => setOverId((cur) => (cur === UNASSIGNED ? null : cur))}
        onDrop={handleDrop}
      />
      {suites.map((s) => (
        <SuiteColumn
          key={s.id}
          id={s.id}
          title={s.name}
          subtitle={typeLabel(s.type)}
          items={grouped.get(s.id) ?? []}
          capacity={s.capacity}
          isOver={overId === s.id}
          draggingId={draggingId}
          onDragStart={setDraggingId}
          onDragEnd={() => {
            setDraggingId(null);
            setOverId(null);
          }}
          onEnter={() => setOverId(s.id)}
          onLeave={() => setOverId((cur) => (cur === s.id ? null : cur))}
          onDrop={handleDrop}
        />
      ))}
    </div>
  );
}

function typeLabel(t: SuiteRow["type"]) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

function SuiteColumn({
  id,
  title,
  subtitle,
  items,
  capacity,
  isOver,
  draggingId,
  onDragStart,
  onDragEnd,
  onEnter,
  onLeave,
  onDrop,
}: {
  id: string;
  title: string;
  subtitle: string;
  items: BoardResv[];
  capacity: number | null;
  isOver: boolean;
  draggingId: string | null;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
  onEnter: () => void;
  onLeave: () => void;
  onDrop: (targetId: string, resvId: string) => void;
}) {
  const isUnassigned = id === UNASSIGNED;
  const overCap = capacity !== null && items.length > capacity;

  return (
    <Card
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        onEnter();
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        onEnter();
      }}
      onDragLeave={(e) => {
        // Only clear when leaving the column entirely
        const related = e.relatedTarget as Node | null;
        if (!related || !e.currentTarget.contains(related)) {
          onLeave();
        }
      }}
      onDrop={(e) => {
        e.preventDefault();
        const resvId = e.dataTransfer.getData(MIME) || e.dataTransfer.getData("text/plain");
        if (resvId) onDrop(id, resvId);
      }}
      className={cn(
        "flex min-h-[280px] flex-col gap-3 border-border bg-card p-4 transition-all",
        isOver && "border-primary ring-2 ring-primary/40 shadow-md",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="truncate font-display text-base font-semibold text-foreground">
            {title}
          </div>
          <div className="text-xs text-text-secondary">{subtitle}</div>
        </div>
        {isUnassigned ? (
          <Badge variant="outline" className="text-[10px]">
            {items.length}
          </Badge>
        ) : (
          <Badge
            variant={overCap ? "destructive" : "secondary"}
            className="text-[10px] whitespace-nowrap"
          >
            {items.length}/{capacity} occupied
          </Badge>
        )}
      </div>
      <div className="flex-1 space-y-2">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-border bg-background/50 p-4 text-center text-xs text-text-tertiary">
            {isUnassigned ? "Drop pets here to unassign" : "Drop a pet here"}
          </div>
        ) : (
          items.map((r) => (
            <DraggablePetCard
              key={r.id}
              resv={r}
              dragging={draggingId === r.id}
              onDragStart={onDragStart}
              onDragEnd={onDragEnd}
            />
          ))
        )}
      </div>
    </Card>
  );
}

function DraggablePetCard({
  resv,
  dragging,
  onDragStart,
  onDragEnd,
}: {
  resv: BoardResv;
  dragging: boolean;
  onDragStart: (id: string) => void;
  onDragEnd: () => void;
}) {
  const pet = resv.reservation_pets?.[0]?.pets;
  const ownerName =
    [resv.owners?.first_name, resv.owners?.last_name].filter(Boolean).join(" ") || "—";
  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData(MIME, resv.id);
        e.dataTransfer.setData("text/plain", resv.id);
        onDragStart(resv.id);
      }}
      onDragEnd={onDragEnd}
      className={cn(
        "cursor-grab rounded-lg border border-border bg-surface p-3 shadow-sm transition-all active:cursor-grabbing hover:shadow-md",
        dragging && "opacity-40",
        resv.status === "checked_in"
          ? "border-l-4 border-l-success"
          : "border-l-4 border-l-primary",
      )}
    >
      <div className="flex items-center gap-2">
        <GripVertical className="h-3.5 w-3.5 shrink-0 text-text-tertiary" />
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-medium text-foreground">
            {pet?.name ?? "Guest"}
          </div>
          <div className="truncate text-xs text-text-secondary">{ownerName}</div>
        </div>
        <Badge variant="outline" className="text-[9px]">
          {resv.status === "checked_in" ? "In" : "Res"}
        </Badge>
      </div>
    </div>
  );
}
