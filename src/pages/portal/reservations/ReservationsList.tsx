import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Plus, ClipboardList } from "lucide-react";
import PortalLayout from "@/components/portal/PortalLayout";
import PageHeader from "@/components/portal/PageHeader";
import EmptyState from "@/components/portal/EmptyState";
import ReservationStatusBadge from "@/components/portal/ReservationStatusBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { formatDateTime } from "@/lib/money";
import { formatDate } from "@/lib/format";
import { usePermissions } from "@/hooks/usePermissions";
import { useLocationFilter } from "@/contexts/LocationContext";
import { downloadCsv, toCsv } from "@/lib/csv";
import { Download } from "lucide-react";

const PAGE_SIZE = 10;

function startOfWeekISO() {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day; // start Sunday
  const start = new Date(d.setDate(diff));
  start.setHours(0, 0, 0, 0);
  return start.toISOString().slice(0, 10);
}
function endOfWeekISO() {
  const d = new Date();
  const day = d.getDay();
  const diff = d.getDate() + (6 - day);
  const end = new Date(d.setDate(diff));
  end.setHours(23, 59, 59, 999);
  return end.toISOString().slice(0, 10);
}

export default function ReservationsList() {
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canCreate = can("reservations.create");
  const locationId = useLocationFilter();
  const [startDate, setStartDate] = useState<string>(startOfWeekISO());
  const [endDate, setEndDate] = useState<string>(endOfWeekISO());
  const [status, setStatus] = useState<string>("all");
  const [page, setPage] = useState(0);

  const { data, isLoading } = useQuery({
    queryKey: ["reservations", startDate, endDate, status, page, locationId],
    queryFn: async () => {
      let q = supabase
        .from("reservations")
        .select(
          "id, start_at, end_at, status, source, created_at, primary_owner_id, owners:primary_owner_id(first_name, last_name), services(name), reservation_pets(pet_id, pets(name))",
          { count: "exact" },
        )
        .is("deleted_at", null)
        .order("start_at", { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (startDate) q = q.gte("start_at", new Date(startDate + "T00:00:00").toISOString());
      if (endDate) q = q.lte("start_at", new Date(endDate + "T23:59:59").toISOString());
      if (status !== "all") q = q.eq("status", status as any);
      if (locationId) q = q.eq("location_id", locationId);

      const { data, count, error } = await q;
      if (error) throw error;
      return { rows: data ?? [], count: count ?? 0 };
    },
  });

  const totalPages = useMemo(() => Math.max(1, Math.ceil((data?.count ?? 0) / PAGE_SIZE)), [data?.count]);

  return (
    <ReservationsListBody
      data={data}
      isLoading={isLoading}
      startDate={startDate}
      endDate={endDate}
      status={status}
      page={page}
      totalPages={totalPages}
      setStartDate={setStartDate}
      setEndDate={setEndDate}
      setStatus={setStatus}
      setPage={setPage}
      can={can}
      canCreate={canCreate}
      navigate={navigate}
      withLayout
    />
  );
}

function ReservationsListBody({
  data, isLoading, startDate, endDate, status, page, totalPages,
  setStartDate, setEndDate, setStatus, setPage, can, canCreate, navigate, withLayout,
}: any) {
  const inner = (
    <div className="px-8 py-6">
        <PageHeader
          title="Reservations"
          actions={
            <div className="flex gap-2">
              {can("data.export") && (
                <Button variant="outline" onClick={() => {
                  const rows = (data?.rows ?? []).map((r: any) => ({
                    start_at: r.start_at, end_at: r.end_at, status: r.status, source: r.source,
                    owner: r.owners ? `${r.owners.first_name} ${r.owners.last_name}` : "",
                    service: r.services?.name ?? "",
                    pets: (r.reservation_pets ?? []).map((rp: any) => rp.pets?.name).filter(Boolean).join("; "),
                    created_at: r.created_at,
                  }));
                  downloadCsv(`reservations-${startDate}-to-${endDate}.csv`, toCsv(rows));
                }}>
                  <Download className="h-4 w-4" /> Export CSV
                </Button>
              )}
              {canCreate && (
                <Button onClick={() => navigate("/reservations/new")}>
                  <Plus className="h-4 w-4" /> New Reservation
                </Button>
              )}
            </div>
          }
        />

        <div className="rounded-lg border border-border bg-surface shadow-card">
          <div className="flex flex-wrap items-end gap-3 border-b border-border-subtle p-4">
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-text-secondary">From</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setPage(0);
                  setStartDate(e.target.value);
                }}
                className="bg-background"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] font-semibold text-text-secondary">To</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setPage(0);
                  setEndDate(e.target.value);
                }}
                className="bg-background"
              />
            </div>
            <div className="w-44">
              <label className="mb-1 block text-[11px] font-semibold text-text-secondary">Status</label>
              <Select
                value={status}
                onValueChange={(v) => {
                  setPage(0);
                  setStatus(v);
                }}
              >
                <SelectTrigger className="bg-background">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="requested">Requested</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="checked_in">Checked In</SelectItem>
                  <SelectItem value="checked_out">Checked Out</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="no_show">No Show</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-sm text-text-secondary">Loading…</div>
          ) : data && data.rows.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={ClipboardList}
                title="No reservations yet"
                description="Create your first reservation to start managing bookings."
                action={
                  <Button onClick={() => navigate("/reservations/new")}>
                    <Plus className="h-4 w-4" /> New Reservation
                  </Button>
                }
              />
            </div>
          ) : (
            <>
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-background text-left">
                    <th className="px-[18px] py-[14px] label-eyebrow">Date / Time</th>
                    <th className="px-[18px] py-[14px] label-eyebrow">Owner</th>
                    <th className="px-[18px] py-[14px] label-eyebrow">Pets</th>
                    <th className="px-[18px] py-[14px] label-eyebrow">Service</th>
                    <th className="px-[18px] py-[14px] label-eyebrow">Status</th>
                    <th className="px-[18px] py-[14px] label-eyebrow">Source</th>
                    <th className="px-[18px] py-[14px] label-eyebrow">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {data!.rows.map((r: any) => (
                    <tr key={r.id} className="border-t border-border-subtle hover:bg-background">
                      <td className="px-[18px] py-[14px]">
                        <Link
                          to={`/reservations/${r.id}`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {formatDateTime(r.start_at)}
                        </Link>
                        <div className="text-xs text-text-tertiary">→ {formatDateTime(r.end_at)}</div>
                      </td>
                      <td className="px-[18px] py-[14px]">
                        {r.owners ? (
                          <Link
                            to={`/owners/${r.primary_owner_id}`}
                            className="text-foreground hover:text-primary"
                          >
                            {r.owners.first_name} {r.owners.last_name}
                          </Link>
                        ) : (
                          <span className="text-text-tertiary">—</span>
                        )}
                      </td>
                      <td className="px-[18px] py-[14px] text-text-secondary">
                        {(r.reservation_pets ?? []).map((rp: any) => rp.pets?.name).filter(Boolean).join(", ") ||
                          "—"}
                      </td>
                      <td className="px-[18px] py-[14px] text-text-secondary">{r.services?.name ?? "—"}</td>
                      <td className="px-[18px] py-[14px]">
                        <ReservationStatusBadge status={r.status} />
                      </td>
                      <td className="px-[18px] py-[14px]">
                        <span className="inline-flex items-center rounded-pill border border-border bg-background px-2 py-0.5 text-[11px] font-semibold text-text-secondary">
                          {r.source === "owner_self_serve" ? "Owner" : "Staff"}
                        </span>
                      </td>
                      <td className="px-[18px] py-[14px] text-text-secondary">{formatDate(r.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-between border-t border-border-subtle px-4 py-3 text-xs text-text-secondary">
                <span>
                  {data!.count} reservation{data!.count === 1 ? "" : "s"}
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
