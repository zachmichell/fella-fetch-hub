import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, Search, Users } from "lucide-react";
import PortalLayout from "@/components/portal/PortalLayout";
import PageHeader from "@/components/portal/PageHeader";
import EmptyState from "@/components/portal/EmptyState";
import StatusBadge, { commPrefTone } from "@/components/portal/StatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { formatDate } from "@/lib/format";

const PAGE_SIZE = 10;

export default function OwnersList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["owners", search, page],
    queryFn: async () => {
      let q = supabase
        .from("owners")
        .select("id, first_name, last_name, email, phone, communication_preference, created_at, pet_owners(id)", {
          count: "exact",
        })
        .is("deleted_at", null)
        .order("created_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      const term = search.trim();
      if (term) {
        q = q.or(
          `first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`,
        );
      }
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
          title="Owners"
          actions={
            <Button onClick={() => navigate("/owners/new")}>
              <Plus className="h-4 w-4" /> Add Owner
            </Button>
          }
        />

        <div className="rounded-lg border border-border bg-surface shadow-card">
          <div className="flex items-center gap-3 border-b border-border-subtle p-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
              <Input
                placeholder="Search owners…"
                value={search}
                onChange={(e) => {
                  setPage(0);
                  setSearch(e.target.value);
                }}
                className="bg-background pl-9"
              />
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-sm text-text-secondary">Loading…</div>
          ) : data && data.rows.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="No owners yet"
                description="Add your first pet owner to get started."
                action={
                  <Button onClick={() => navigate("/owners/new")}>
                    <Plus className="h-4 w-4" /> Add Owner
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
                    <th className="px-[18px] py-[14px] label-eyebrow">Email</th>
                    <th className="px-[18px] py-[14px] label-eyebrow">Phone</th>
                    <th className="px-[18px] py-[14px] label-eyebrow">Pets</th>
                    <th className="px-[18px] py-[14px] label-eyebrow">Comm.</th>
                    <th className="px-[18px] py-[14px] label-eyebrow">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.rows.map((o: any) => (
                    <tr key={o.id} className="border-t border-border-subtle hover:bg-background">
                      <td className="px-[18px] py-[14px]">
                        <Link to={`/owners/${o.id}`} className="font-medium text-foreground hover:text-primary">
                          {o.first_name} {o.last_name}
                        </Link>
                      </td>
                      <td className="px-[18px] py-[14px] text-text-secondary">{o.email ?? "—"}</td>
                      <td className="px-[18px] py-[14px] text-text-secondary">{o.phone ?? "—"}</td>
                      <td className="px-[18px] py-[14px]">
                        <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-pill bg-primary-light px-2 text-xs font-semibold text-primary">
                          {o.pet_owners?.length ?? 0}
                        </span>
                      </td>
                      <td className="px-[18px] py-[14px]">
                        <StatusBadge tone={commPrefTone(o.communication_preference)}>
                          {o.communication_preference}
                        </StatusBadge>
                      </td>
                      <td className="px-[18px] py-[14px] text-text-secondary">{formatDate(o.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-between border-t border-border-subtle px-4 py-3 text-xs text-text-secondary">
                <span>
                  {data!.count} owner{data!.count === 1 ? "" : "s"}
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
