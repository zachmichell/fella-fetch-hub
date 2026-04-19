import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, PawPrint, CalendarDays, Receipt, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useOwnerRecord } from "@/hooks/useOwnerRecord";
import { formatDate, speciesIcon } from "@/lib/format";
import { formatCents } from "@/lib/money";
import { getVaccinationStatus } from "@/lib/vaccines";
import VaccinationStatusBadge from "@/components/portal-owner/VaccinationStatusBadge";
import InvoiceStatusBadge from "@/components/portal/InvoiceStatusBadge";
import ReservationStatusBadge from "@/components/portal/ReservationStatusBadge";

export default function OwnerDashboard() {
  const { profile, membership } = useAuth();
  const { data: owner, isLoading: ownerLoading } = useOwnerRecord();

  const { data: org } = useQuery({
    queryKey: ["owner-org", membership?.organization_id],
    enabled: !!membership?.organization_id,
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("name")
        .eq("id", membership!.organization_id)
        .maybeSingle();
      return data;
    },
  });

  const { data: upcoming } = useQuery({
    queryKey: ["owner-upcoming", owner?.id],
    enabled: !!owner?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reservations")
        .select("id, start_at, end_at, status, services(name), reservation_pets(pets(name))")
        .eq("primary_owner_id", owner!.id)
        .in("status", ["confirmed", "requested"])
        .gte("start_at", new Date().toISOString())
        .is("deleted_at", null)
        .order("start_at", { ascending: true })
        .limit(3);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: pets } = useQuery({
    queryKey: ["owner-pets", owner?.id],
    enabled: !!owner?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pet_owners")
        .select(
          "pets(id, name, breed, species, photo_url, deleted_at, vaccinations(id, expires_on, deleted_at))",
        )
        .eq("owner_id", owner!.id);
      if (error) throw error;
      return (data ?? [])
        .map((row: any) => row.pets)
        .filter((p: any) => p && !p.deleted_at)
        .map((p: any) => ({
          ...p,
          vaccinations: (p.vaccinations ?? []).filter((v: any) => !v.deleted_at),
        }));
    },
  });

  const { data: invoices } = useQuery({
    queryKey: ["owner-invoices", owner?.id],
    enabled: !!owner?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("invoices")
        .select("id, invoice_number, total_cents, currency, due_at, status")
        .eq("owner_id", owner!.id)
        .in("status", ["sent", "overdue"])
        .is("deleted_at", null)
        .order("due_at", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: waiverAlert } = useQuery({
    queryKey: ["owner-waivers-alert", owner?.id, membership?.organization_id],
    enabled: !!owner?.id && !!membership?.organization_id,
    queryFn: async () => {
      const [{ data: waivers }, { data: signatures }] = await Promise.all([
        supabase
          .from("waivers")
          .select("id, version")
          .eq("organization_id", membership!.organization_id)
          .eq("active", true)
          .is("deleted_at", null),
        supabase
          .from("waiver_signatures")
          .select("waiver_id")
          .eq("owner_id", owner!.id),
      ]);
      const signedIds = new Set((signatures ?? []).map((s: any) => s.waiver_id));
      const unsigned = (waivers ?? []).filter((w: any) => !signedIds.has(w.id));
      return unsigned.length;
    },
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 18) return "Good afternoon";
    return "Good evening";
  })();

  const setupBanner = !ownerLoading && !owner;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
          {greeting}, {profile?.first_name ?? "there"}
        </h1>
        {org?.name && <p className="mt-2 text-base text-muted-foreground">{org.name}</p>}
      </div>

      {setupBanner && (
        <div className="rounded-xl border border-warning/30 bg-warning-light p-5">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-warning" />
            <div>
              <p className="font-semibold text-foreground">Your account is being set up</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Please contact {org?.name ?? "your pet care provider"} to complete your profile.
              </p>
            </div>
          </div>
        </div>
      )}

      {!!waiverAlert && waiverAlert > 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary-light p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 text-primary-hover" />
              <div>
                <p className="font-semibold text-foreground">Action required</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  You have {waiverAlert} waiver{waiverAlert === 1 ? "" : "s"} to sign.
                </p>
              </div>
            </div>
            <Link
              to="/portal/waivers"
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
            >
              Sign now
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Upcoming bookings" icon={CalendarDays} viewAllTo="/portal/bookings">
          {upcoming && upcoming.length > 0 ? (
            <ul className="divide-y divide-border-subtle">
              {upcoming.map((r: any) => (
                <li key={r.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {r.services?.name ?? "Service"}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {formatDate(r.start_at, {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                        {r.reservation_pets?.length > 0 &&
                          ` · ${r.reservation_pets.map((rp: any) => rp.pets?.name).filter(Boolean).join(", ")}`}
                      </p>
                    </div>
                    <ReservationStatusBadge status={r.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty
              text="No upcoming bookings"
              cta={{ label: "Book your next visit", to: "/portal/bookings" }}
            />
          )}
        </Card>

        <Card title="My pets" icon={PawPrint} viewAllTo="/portal/pets">
          {pets && pets.length > 0 ? (
            <>
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {pets.length} pet{pets.length === 1 ? "" : "s"}
              </p>
              <ul className="space-y-3">
                {pets.slice(0, 4).map((p: any) => (
                  <li key={p.id} className="flex items-center gap-3">
                    {p.photo_url ? (
                      <img
                        src={p.photo_url}
                        alt={p.name}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-lg">
                        {speciesIcon(p.species)}
                      </span>
                    )}
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{p.breed ?? "—"}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <Empty text="No pets yet" />
          )}
        </Card>

        <Card title="Outstanding invoices" icon={Receipt} viewAllTo="/portal/invoices">
          {invoices && invoices.length > 0 ? (
            <ul className="divide-y divide-border-subtle">
              {invoices.map((inv: any) => (
                <li key={inv.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {inv.invoice_number ?? "Invoice"}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {formatCents(inv.total_cents, inv.currency)} · Due {formatDate(inv.due_at)}
                      </p>
                    </div>
                    <InvoiceStatusBadge status={inv.status} />
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <Empty text="You're all caught up!" />
          )}
        </Card>
      </div>
    </div>
  );
}

function Card({
  title,
  icon: Icon,
  viewAllTo,
  children,
}: {
  title: string;
  icon: any;
  viewAllTo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-5 w-5 text-primary" />
          <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
        </div>
        <Link
          to={viewAllTo}
          className="inline-flex items-center text-sm font-medium text-primary-hover hover:underline"
        >
          View all <ChevronRight className="ml-0.5 h-4 w-4" />
        </Link>
      </div>
      {children}
    </section>
  );
}

function Empty({ text, cta }: { text: string; cta?: { label: string; to: string } }) {
  return (
    <div className="py-6 text-center">
      <p className="text-sm text-muted-foreground">{text}</p>
      {cta && (
        <Link
          to={cta.to}
          className="mt-3 inline-flex items-center text-sm font-medium text-primary-hover hover:underline"
        >
          {cta.label}
        </Link>
      )}
    </div>
  );
}
