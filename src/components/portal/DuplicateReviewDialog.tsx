import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Search, ChevronDown, ChevronRight, Merge, X, Mail, Phone, Users } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatDate } from "@/lib/format";
import {
  findOwnerDuplicates,
  findPetDuplicates,
  dupePairKey,
  type Confidence,
  type DuplicateGroup,
  type OwnerRecord,
  type PetRecord,
} from "@/lib/duplicates";

type Mode = "owner" | "pet";

const confidenceTone: Record<Confidence, string> = {
  high: "bg-status-success-bg text-status-success border-status-success/30",
  medium: "bg-status-warning-bg text-status-warning border-status-warning/30",
  low: "bg-status-teal-bg text-status-teal border-status-teal/30",
};

export default function DuplicateReviewDialog({
  open,
  onOpenChange,
  mode,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  mode: Mode;
}) {
  const { membership } = useAuth();
  const orgId = membership?.organization_id;
  const qc = useQueryClient();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [merging, setMerging] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["duplicates", mode, orgId],
    enabled: open && !!orgId,
    queryFn: async () => {
      // Fetch dismissed pairs
      const { data: dismissed } = await supabase
        .from("dismissed_duplicates")
        .select("record_id_1, record_id_2")
        .eq("organization_id", orgId!)
        .eq("entity_type", mode);
      const dismissedSet = new Set(
        (dismissed ?? []).map((r: any) => dupePairKey(r.record_id_1, r.record_id_2)),
      );

      if (mode === "owner") {
        const owners = await fetchAllOwners(orgId!);
        const groups = findOwnerDuplicates(owners, dismissedSet);
        return { groups: groups as DuplicateGroup<any>[] };
      } else {
        const pets = await fetchAllPets(orgId!);
        const groups = findPetDuplicates(pets, dismissedSet);
        return { groups: groups as DuplicateGroup<any>[] };
      }
    },
  });

  const groups = data?.groups ?? [];
  const summary = useMemo(() => {
    const c = { high: 0, medium: 0, low: 0 };
    for (const g of groups) c[g.confidence]++;
    return c;
  }, [groups]);

  const dismiss = useMutation({
    mutationFn: async (group: DuplicateGroup<any>) => {
      const ids = group.records.map((r) => r.id);
      const rows: any[] = [];
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          rows.push({
            organization_id: orgId,
            entity_type: mode,
            record_id_1: ids[i],
            record_id_2: ids[j],
          });
        }
      }
      const { error } = await supabase.from("dismissed_duplicates").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Marked as not duplicates");
      qc.invalidateQueries({ queryKey: ["duplicates", mode, orgId] });
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to dismiss"),
  });

  const merge = useMutation({
    mutationFn: async ({
      primary,
      duplicates,
    }: {
      primary: any;
      duplicates: any[];
    }) => {
      const dupIds = duplicates.map((d) => d.id);
      if (mode === "owner") {
        // Reassign pet_owners
        const { data: pos } = await supabase
          .from("pet_owners")
          .select("id, pet_id, owner_id")
          .in("owner_id", dupIds);
        // Avoid duplicate pet_owner rows (pet_id, primary owner already linked)
        const { data: existing } = await supabase
          .from("pet_owners")
          .select("pet_id")
          .eq("owner_id", primary.id);
        const existingPets = new Set((existing ?? []).map((r: any) => r.pet_id));
        for (const po of pos ?? []) {
          if (existingPets.has(po.pet_id)) {
            // Already linked to primary — delete duplicate link
            await supabase.from("pet_owners").delete().eq("id", po.id);
          } else {
            await supabase
              .from("pet_owners")
              .update({ owner_id: primary.id })
              .eq("id", po.id);
            existingPets.add(po.pet_id);
          }
        }
        // Reassign reservations & invoices (best-effort, ignore errors on tables that don't exist for this org)
        await supabase.from("reservations").update({ owner_id: primary.id }).in("owner_id", dupIds);
        await supabase.from("invoices").update({ owner_id: primary.id }).in("owner_id", dupIds);
        // Soft delete duplicates
        const { error } = await supabase
          .from("owners")
          .update({ deleted_at: new Date().toISOString() })
          .in("id", dupIds);
        if (error) throw error;
      } else {
        // Pet merge
        // Reassign pet_owners → primary (dedupe)
        const { data: existing } = await supabase
          .from("pet_owners")
          .select("owner_id")
          .eq("pet_id", primary.id);
        const existingOwners = new Set((existing ?? []).map((r: any) => r.owner_id));
        const { data: dupPos } = await supabase
          .from("pet_owners")
          .select("id, owner_id")
          .in("pet_id", dupIds);
        for (const po of dupPos ?? []) {
          if (existingOwners.has(po.owner_id)) {
            await supabase.from("pet_owners").delete().eq("id", po.id);
          } else {
            await supabase
              .from("pet_owners")
              .update({ pet_id: primary.id })
              .eq("id", po.id);
            existingOwners.add(po.owner_id);
          }
        }
        // Reassign vaccinations and reservation_pets if present
        await supabase.from("vaccinations").update({ pet_id: primary.id }).in("pet_id", dupIds);
        await supabase
          .from("reservation_pets")
          .update({ pet_id: primary.id })
          .in("pet_id", dupIds);
        // Soft delete dup pets
        const { error } = await supabase
          .from("pets")
          .update({ deleted_at: new Date().toISOString() })
          .in("id", dupIds);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Records merged");
      setMerging(null);
      qc.invalidateQueries({ queryKey: ["duplicates", mode, orgId] });
      qc.invalidateQueries({ queryKey: [mode === "owner" ? "owners" : "pets"] });
    },
    onError: (e: any) => {
      toast.error(e.message ?? "Merge failed");
      setMerging(null);
    },
  });

  const toggle = (k: string) => {
    setExpanded((s) => {
      const n = new Set(s);
      n.has(k) ? n.delete(k) : n.add(k);
      return n;
    });
  };

  const title = mode === "owner" ? "Find Duplicate Owners" : "Find Duplicate Pets";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display">{title}</DialogTitle>
          <DialogDescription>
            Review records that look similar. Pick a primary record to merge into, or mark a group as
            not a duplicate.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-text-secondary">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="text-sm">Scanning {mode === "owner" ? "owners" : "pets"}…</span>
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-background px-4 py-3">
              <Search className="h-4 w-4 text-text-tertiary" />
              <span className="text-sm text-foreground">
                Found <strong>{groups.length}</strong> potential duplicate group
                {groups.length === 1 ? "" : "s"}
              </span>
              <span className="text-text-tertiary">·</span>
              <Badge className={confidenceTone.high}>{summary.high} high</Badge>
              <Badge className={confidenceTone.medium}>{summary.medium} medium</Badge>
              <Badge className={confidenceTone.low}>{summary.low} low</Badge>
            </div>

            <ScrollArea className="flex-1 -mx-6 px-6">
              {groups.length === 0 ? (
                <div className="py-16 text-center text-sm text-text-secondary">
                  No duplicate {mode === "owner" ? "owners" : "pets"} found. ✨
                </div>
              ) : (
                <div className="space-y-3 py-2">
                  {groups.map((g) => (
                    <GroupCard
                      key={g.key}
                      group={g}
                      mode={mode}
                      expanded={expanded.has(g.key)}
                      onToggle={() => toggle(g.key)}
                      onDismiss={() => dismiss.mutate(g)}
                      onMerge={(primary) => {
                        const duplicates = g.records.filter((r) => r.id !== primary.id);
                        setMerging(g.key);
                        merge.mutate({ primary, duplicates });
                      }}
                      isMerging={merging === g.key}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function GroupCard({
  group,
  mode,
  expanded,
  onToggle,
  onDismiss,
  onMerge,
  isMerging,
}: {
  group: DuplicateGroup<any>;
  mode: Mode;
  expanded: boolean;
  onToggle: () => void;
  onDismiss: () => void;
  onMerge: (primary: any) => void;
  isMerging: boolean;
}) {
  // Default primary: most pets/reservations, then earliest created
  const primary = useMemo(() => {
    const sorted = [...group.records].sort((a: any, b: any) => {
      const score = (r: any) =>
        (mode === "owner" ? (r.pet_count ?? 0) + (r.reservation_count ?? 0) : (r.owner_ids?.length ?? 0));
      const sb = score(b) - score(a);
      if (sb !== 0) return sb;
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    });
    return sorted[0];
  }, [group, mode]);

  const [chosen, setChosen] = useState<string>(primary.id);

  return (
    <div className="rounded-lg border border-border bg-surface shadow-card">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
      >
        <div className="flex items-center gap-3">
          {expanded ? (
            <ChevronDown className="h-4 w-4 text-text-tertiary" />
          ) : (
            <ChevronRight className="h-4 w-4 text-text-tertiary" />
          )}
          <Badge className={confidenceTone[group.confidence]}>{group.confidence}</Badge>
          <span className="text-sm font-medium text-foreground">{group.reason}</span>
          <span className="text-xs text-text-tertiary">
            {group.records.length} records
          </span>
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border-subtle p-4">
          <div className="grid gap-3 md:grid-cols-2">
            {group.records.map((r: any) => (
              <RecordCard
                key={r.id}
                record={r}
                mode={mode}
                isPrimary={chosen === r.id}
                onPick={() => setChosen(r.id)}
              />
            ))}
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
            <Button variant="outline" size="sm" onClick={onDismiss} disabled={isMerging}>
              <X className="h-4 w-4" /> Not a duplicate
            </Button>
            <Button
              size="sm"
              onClick={() => onMerge(group.records.find((r: any) => r.id === chosen))}
              disabled={isMerging}
            >
              {isMerging ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Merge className="h-4 w-4" />
              )}
              Merge into selected
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function RecordCard({
  record,
  mode,
  isPrimary,
  onPick,
}: {
  record: any;
  mode: Mode;
  isPrimary: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className={`rounded-lg border p-3 text-left transition-colors ${
        isPrimary
          ? "border-primary bg-primary-light"
          : "border-border bg-card-alt hover:border-primary/40"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          {mode === "owner" ? (
            <>
              <div className="font-medium text-foreground truncate">
                {record.first_name} {record.last_name}
              </div>
              {record.email && (
                <div className="mt-1 flex items-center gap-1.5 text-xs text-text-secondary truncate">
                  <Mail className="h-3 w-3" /> {record.email}
                </div>
              )}
              {record.phone && (
                <div className="mt-0.5 flex items-center gap-1.5 text-xs text-text-secondary">
                  <Phone className="h-3 w-3" /> {record.phone}
                </div>
              )}
              {(record.street_address || record.city) && (
                <div className="mt-0.5 text-xs text-text-tertiary truncate">
                  {[record.street_address, record.city].filter(Boolean).join(", ")}
                </div>
              )}
              <div className="mt-2 flex items-center gap-3 text-xs text-text-secondary">
                <span className="inline-flex items-center gap-1">
                  <Users className="h-3 w-3" /> {record.pet_count ?? 0} pets
                </span>
                <span>{record.reservation_count ?? 0} reservations</span>
              </div>
            </>
          ) : (
            <>
              <div className="font-medium text-foreground truncate">{record.name}</div>
              <div className="mt-1 text-xs text-text-secondary capitalize">
                {record.breed ?? "—"} · {record.species ?? "—"}
              </div>
              {record.owner_names?.length > 0 && (
                <div className="mt-0.5 text-xs text-text-tertiary truncate">
                  Owner: {record.owner_names.join(", ")}
                </div>
              )}
              {record.date_of_birth && (
                <div className="mt-0.5 text-xs text-text-tertiary">
                  DOB: {formatDate(record.date_of_birth)}
                </div>
              )}
            </>
          )}
          <div className="mt-2 text-xs text-text-tertiary">
            Created {formatDate(record.created_at)}
          </div>
        </div>
        {isPrimary && (
          <Badge className="bg-primary text-primary-foreground">Primary</Badge>
        )}
      </div>
    </button>
  );
}

// ---------- Data fetching ----------

async function fetchAllOwners(orgId: string): Promise<OwnerRecord[]> {
  const PAGE = 1000;
  let from = 0;
  const all: OwnerRecord[] = [];
  while (true) {
    const { data, error } = await supabase
      .from("owners")
      .select(
        "id, first_name, last_name, email, phone, street_address, city, created_at, pet_owners(id), reservations(id)",
      )
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const o of data as any[]) {
      all.push({
        id: o.id,
        first_name: o.first_name,
        last_name: o.last_name,
        email: o.email,
        phone: o.phone,
        street_address: o.street_address,
        city: o.city,
        created_at: o.created_at,
        pet_count: o.pet_owners?.length ?? 0,
        reservation_count: o.reservations?.length ?? 0,
      });
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}

async function fetchAllPets(orgId: string): Promise<PetRecord[]> {
  const PAGE = 1000;
  let from = 0;
  const all: PetRecord[] = [];
  while (true) {
    const { data, error } = await supabase
      .from("pets")
      .select(
        "id, name, species, breed, date_of_birth, created_at, pet_owners(owner:owners(id, first_name, last_name))",
      )
      .eq("organization_id", orgId)
      .is("deleted_at", null)
      .range(from, from + PAGE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const p of data as any[]) {
      const owners = (p.pet_owners ?? []).map((po: any) => po.owner).filter(Boolean);
      all.push({
        id: p.id,
        name: p.name,
        species: p.species,
        breed: p.breed,
        date_of_birth: p.date_of_birth,
        created_at: p.created_at,
        owner_ids: owners.map((o: any) => o.id),
        owner_names: owners.map((o: any) => `${o.first_name ?? ""} ${o.last_name ?? ""}`.trim()),
      });
    }
    if (data.length < PAGE) break;
    from += PAGE;
  }
  return all;
}
