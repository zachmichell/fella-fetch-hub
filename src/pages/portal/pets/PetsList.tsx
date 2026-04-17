import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, PawPrint } from "lucide-react";
import PortalLayout from "@/components/portal/PortalLayout";
import PageHeader from "@/components/portal/PageHeader";
import EmptyState from "@/components/portal/EmptyState";
import StatusBadge, { intakeTone } from "@/components/portal/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatDate, speciesIcon } from "@/lib/format";

const PAGE_SIZE = 10;

export default function PetsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [species, setSpecies] = useState<string>("all");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["pets", search, species, page],
    queryFn: async () => {
      let q = supabase
        .from("pets")
        .select(
          "id, name, species, breed, intake_status, created_at, microchip_id, pet_owners(relationship, owner:owners(id, first_name, last_name))",
          { count: "exact" },
        )
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (species !== "all") q = q.eq("species", species as any);
      const term = search.trim();
      if (term) q = q.or(`name.ilike.%${term}%,breed.ilike.%${term}%,microchip_id.ilike.%${term}%`);
      const { data, count, error } = await q;
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });

  const totalPages = useMemo(() => Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE)), [data?.count]);

  return (
    <PortalLayout>
      <div className="px-8 py-6">
        <PageHeader
          title="Pets"
          actions={
            <Button onClick={() => navigate("/pets/new")}>
              <Plus className="h-4 w-4" /> Add Pet
            </Button>
          }
        />

        <div className="rounded-lg border border-border bg-surface shadow-card">
          <div className="flex flex-wrap items-center gap-3 border-b border-border-subtle p-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                placeholder="Search pets…"
                value={search}
                onChange={(e) => {
                  setPage(0);
                  setSearch(e.target.value);
                }}
                className="bg-background pl-9"
              />
            </div>
            <Select value={species} onValueChange={(v) => { setPage(0); setSpecies(v); }}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All species</SelectItem>
                <SelectItem value="dog">Dogs</SelectItem>
                <SelectItem value="cat">Cats</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-sm text-text-secondary">Loading…</div>
          ) : data && data.rows.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={PawPrint}
                title="No pets yet"
                description="Add your first pet to start building profiles."
                action={
                  <Button onClick={() => navigate("/pets/new")}>
                    <Plus className="h-4 w-4" /> Add Pet
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-background text-left">
                    <th className="px-[18px] py-[14px] label-eyebrow">Name</th>
                    <th className="px-[18px] py-[14px] label-eyebrow">Species</th>
                    <th className="px-[18px] py-[14px] label-eyebrow">Breed</th>
                    <th className="px-[18px] py-[14px] label-eyebrow">Owners</th>
                    <th className="px-[18px] py-[14px] label-eyebrow">Status</th>
                    <th className="px-[18px] py-[14px] label-eyebrow">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.rows.map((p: any) => {
                    const owners = (p.pet_owners ?? []).filter((po: any) => po.owner);
                    return (
                      <tr key={p.id} className="border-t border-border-subtle hover:bg-background">
                        <td className="px-[18px] py-[14px]">
                          <Link to={`/pets/${p.id}`} className="font-medium text-foreground hover:text-primary">
                            {p.name}
                          </Link>
                        </td>
                        <td className="px-[18px] py-[14px]">
                          <span className="mr-1.5">{speciesIcon(p.species)}</span>
                          <span className="text-text-secondary capitalize">{p.species}</span>
                        </td>
                        <td className="px-[18px] py-[14px] text-text-secondary">{p.breed ?? "—"}</td>
                        <td className="px-[18px] py-[14px] text-text-secondary">
                          {owners.length === 0 ? (
                            <span className="text-text-tertiary">Unlinked</span>
                          ) : (
                            owners.map((po: any, i: number) => (
                              <span key={po.owner.id}>
                                <Link
                                  to={`/owners/${po.owner.id}`}
                                  className={`hover:text-primary ${po.relationship === "primary" ? "font-semibold text-foreground" : ""}`}
                                >
                                  {po.owner.first_name} {po.owner.last_name}
                                </Link>
                                {i < owners.length - 1 && ", "}
                              </span>
                            ))
                          )}
                        </td>
                        <td className="px-[18px] py-[14px]">
                          <StatusBadge tone={intakeTone(p.intake_status)}>
                            {p.intake_status.replace("_", " ")}
                          </StatusBadge>
                        </td>
                        <td className="px-[18px] py-[14px] text-text-secondary">{formatDate(p.created_at)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div className="flex items-center justify-between border-t border-border-subtle px-4 py-3 text-xs text-text-secondary">
                <span>
                  {data!.count} pet{data!.count === 1 ? "" : "s"}
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>
                    Previous
                  </Button>
                  <span>
                    Page {page + 1} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page + 1 >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </PortalLayout>
  );
}
