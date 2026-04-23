import { useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));
  const [activeId, setActiveId] = useState<string | null>(null);
  const activeResv = activeId ? reservations.find((r) => r.id === activeId) ?? null : null;

  const onDragStart = (e: DragStartEvent) => setActiveId(String(e.active.id));
  const onDragEnd = (e: DragEndEvent) => {
    setActiveId(null);
    if (!e.over) return;
    const resvId = String(e.active.id);
    const targetId = String(e.over.id);
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
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        <SuiteColumn
          id={UNASSIGNED}
          title="Unassigned"
          subtitle="Boarding pets without a suite"
          items={unassignedList}
          capacity={null}
        />
        {suites.map((s) => (
          <SuiteColumn
            key={s.id}
            id={s.id}
            title={s.name}
            subtitle={typeLabel(s.type)}
            items={grouped.get(s.id) ?? []}
            capacity={s.capacity}
          />
        ))}
      </div>
      <DragOverlay>
        {activeResv ? (
          <PetCardDisplay resv={activeResv} dragging />
        ) : null}
      </DragOverlay>
    </DndContext>
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
}: {
  id: string;
  title: string;
  subtitle: string;
  items: BoardResv[];
  capacity: number | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  const isUnassigned = id === UNASSIGNED;
  const overCap = capacity !== null && items.length > capacity;
  return (
    <Card
      ref={setNodeRef}
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
          items.map((r) => <DraggablePetCard key={r.id} resv={r} />)
        )}
      </div>
    </Card>
  );
}

function DraggablePetCard({ resv }: { resv: BoardResv }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: resv.id });
  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={cn("cursor-grab active:cursor-grabbing", isDragging && "opacity-30")}
    >
      <PetCardDisplay resv={resv} />
    </div>
  );
}

function PetCardDisplay({ resv, dragging }: { resv: BoardResv; dragging?: boolean }) {
  const pet = resv.reservation_pets?.[0]?.pets;
  const ownerName =
    [resv.owners?.first_name, resv.owners?.last_name].filter(Boolean).join(" ") || "—";
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-surface p-3 shadow-sm transition-shadow",
        dragging && "rotate-2 shadow-lg ring-2 ring-primary/50",
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
