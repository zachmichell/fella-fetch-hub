import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useSuites } from "@/hooks/useSuites";
import { Search } from "lucide-react";
import PortalLayout from "@/components/portal/PortalLayout";
import PageHeader from "@/components/portal/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import {
  formatCentsShort,
  formatDurationType,
  computeEndFromStart,
  toDatetimeLocalValue,
} from "@/lib/money";
import {
  DAY_LABELS_SHORT,
  combineDateTime,
  generateOccurrenceDates,
  toDateOnly,
  toTimeOnly,
  type EndsKind,
} from "@/lib/recurrence";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="border-b border-border-subtle py-5 first:pt-0 last:border-b-0 last:pb-0">
      <div className="label-eyebrow mb-3">{title}</div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{children}</div>
    </div>
  );
}

function Field({
  label,
  required,
  error,
  children,
  span = 1,
  hint,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
  span?: 1 | 2;
  hint?: string;
}) {
  return (
    <div className={span === 2 ? "md:col-span-2" : ""}>
      <label className="mb-1.5 block text-xs font-semibold text-text-secondary">
        {label} {required && <span className="text-destructive">*</span>}
      </label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-text-tertiary">{hint}</p>}
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

export default function ReservationForm() {
  const navigate = useNavigate();
  const { membership, user } = useAuth();
  const [searchParams] = useSearchParams();
  const presetSuiteId = searchParams.get("suite_id") ?? "";
  const presetStart = searchParams.get("start") ?? "";

  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [showOwnerResults, setShowOwnerResults] = useState(false);
  const [serviceId, setServiceId] = useState("");
  const [suiteId, setSuiteId] = useState<string>(presetSuiteId || "none");
  const [startAt, setStartAt] = useState(presetStart);
  const [endAt, setEndAt] = useState("");
  const [petIds, setPetIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  const { data: suites = [] } = useSuites({ activeOnly: true });

  // Owner search
  const { data: ownerResults } = useQuery({
    queryKey: ["owner-search", ownerSearch],
    enabled: ownerSearch.trim().length >= 1,
    queryFn: async () => {
      const term = ownerSearch.trim();
      const { data, error } = await supabase
        .from("owners")
        .select("id, first_name, last_name, email, phone")
        .is("deleted_at", null)
        .or(`first_name.ilike.%${term}%,last_name.ilike.%${term}%,email.ilike.%${term}%`)
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });

  // Selected owner details
  const { data: selectedOwner } = useQuery({
    queryKey: ["owner-detail", ownerId],
    enabled: !!ownerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("owners")
        .select("id, first_name, last_name, email, phone")
        .eq("id", ownerId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  // Pets owned by selected owner
  const { data: ownerPets } = useQuery({
    queryKey: ["owner-pets-for-resv", ownerId],
    enabled: !!ownerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pet_owners")
        .select("pet_id, pets(id, name, species, breed)")
        .eq("owner_id", ownerId);
      if (error) throw error;
      return (data ?? [])
        .map((row: any) => row.pets)
        .filter((p: any) => p) as { id: string; name: string; species: string; breed: string | null }[];
    },
  });

  // Active services
  const { data: services } = useQuery({
    queryKey: ["active-services", membership?.organization_id],
    enabled: !!membership?.organization_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("id, name, base_price_cents, duration_type, location_id, max_pets_per_booking, locations(name)")
        .eq("organization_id", membership!.organization_id)
        .is("deleted_at", null)
        .eq("active", true)
        .order("name");
      if (error) throw error;
      return data ?? [];
    },
  });

  const selectedService = useMemo(
    () => services?.find((s) => s.id === serviceId) ?? null,
    [services, serviceId],
  );

  // Auto end time when service or start changes
  useEffect(() => {
    if (selectedService && startAt) {
      setEndAt(computeEndFromStart(startAt, selectedService.duration_type));
    }
  }, [selectedService, startAt]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!ownerId) e.owner = "Required";
    if (!serviceId) e.service = "Required";
    if (!startAt) e.startAt = "Required";
    if (!endAt) e.endAt = "Required";
    if (startAt && endAt && new Date(endAt) <= new Date(startAt)) e.endAt = "Must be after start";
    if (petIds.length === 0) e.pets = "Select at least one pet";
    if (selectedService?.max_pets_per_booking && petIds.length > selectedService.max_pets_per_booking) {
      e.pets = `Max ${selectedService.max_pets_per_booking} pet(s) per booking`;
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate() || !membership || !selectedService) return;
    setSaving(true);

    const nowIso = new Date().toISOString();
    const { data: resv, error: rErr } = await supabase
      .from("reservations")
      .insert({
        organization_id: membership.organization_id,
        location_id: selectedService.location_id,
        service_id: serviceId,
        primary_owner_id: ownerId,
        start_at: new Date(startAt).toISOString(),
        end_at: new Date(endAt).toISOString(),
        status: "requested",
        source: "staff_created",
        notes: notes || null,
        created_by: user?.id ?? null,
        requested_at: nowIso,
        suite_id: suiteId && suiteId !== "none" ? suiteId : null,
      } as any)
      .select("id")
      .single();

    if (rErr) {
      setSaving(false);
      return toast.error(rErr.message);
    }

    const links = petIds.map((pid) => ({
      reservation_id: resv.id,
      pet_id: pid,
      organization_id: membership.organization_id,
    }));
    const { error: pErr } = await supabase.from("reservation_pets").insert(links);
    if (pErr) {
      setSaving(false);
      return toast.error(pErr.message);
    }

    const { logActivity } = await import("@/lib/activity");
    await logActivity({
      organization_id: membership.organization_id,
      action: "created",
      entity_type: "reservation",
      entity_id: resv.id,
      metadata: { service_id: serviceId, pet_count: petIds.length, start_at: startAt },
    });

    setSaving(false);
    toast.success("Reservation created");
    navigate(`/reservations/${resv.id}`);
  };

  return (
    <PortalLayout>
      <div className="px-8 py-6">
        <PageHeader title="New Reservation" />

        <form onSubmit={handleSubmit} className="mx-auto max-w-[720px]">
          <div className="rounded-lg border border-border bg-surface p-6 shadow-card">
            <Section title="Booking Details">
              <Field label="Owner" required error={errors.owner} span={2}>
                {ownerId && selectedOwner ? (
                  <div className="flex items-center justify-between rounded-md border border-border bg-background px-3 py-2.5">
                    <div>
                      <div className="font-medium text-foreground">
                        {selectedOwner.first_name} {selectedOwner.last_name}
                      </div>
                      <div className="text-xs text-text-secondary">
                        {[selectedOwner.email, selectedOwner.phone].filter(Boolean).join(" · ")}
                      </div>
                    </div>
                    <button
                      type="button"
                      className="text-xs text-primary hover:underline"
                      onClick={() => {
                        setOwnerId("");
                        setPetIds([]);
                        setOwnerSearch("");
                      }}
                    >
                      Change
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-tertiary" />
                    <Input
                      placeholder="Search by name or email…"
                      value={ownerSearch}
                      onChange={(e) => {
                        setOwnerSearch(e.target.value);
                        setShowOwnerResults(true);
                      }}
                      onFocus={() => setShowOwnerResults(true)}
                      className="bg-background pl-9"
                    />
                    {showOwnerResults && ownerResults && ownerResults.length > 0 && (
                      <div className="absolute left-0 right-0 z-10 mt-1 max-h-60 overflow-y-auto rounded-md border border-border bg-card shadow-card">
                        {ownerResults.map((o) => (
                          <button
                            key={o.id}
                            type="button"
                            onClick={() => {
                              setOwnerId(o.id);
                              setShowOwnerResults(false);
                              setPetIds([]);
                            }}
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-background"
                          >
                            <div className="font-medium text-foreground">
                              {o.first_name} {o.last_name}
                            </div>
                            <div className="text-xs text-text-secondary">{o.email ?? o.phone ?? ""}</div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </Field>

              <Field label="Service" required error={errors.service} span={2}>
                <Select value={serviceId} onValueChange={setServiceId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select…" />
                  </SelectTrigger>
                  <SelectContent>
                    {(services ?? []).map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} — {formatDurationType(s.duration_type)} · {formatCentsShort(s.base_price_cents)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedService && (
                  <p className="mt-1 text-xs text-text-secondary">
                    Base price: {formatCentsShort(selectedService.base_price_cents)} · Location:{" "}
                    {(selectedService as any).locations?.name ?? "—"}
                  </p>
                )}
              </Field>

              <Field label="Start" required error={errors.startAt}>
                <Input
                  type="datetime-local"
                  value={startAt}
                  onChange={(e) => setStartAt(e.target.value)}
                  className="bg-background"
                />
              </Field>
              <Field label="End" required error={errors.endAt} hint="Auto-calculated, override as needed">
                <Input
                  type="datetime-local"
                  value={endAt}
                  onChange={(e) => setEndAt(e.target.value)}
                  className="bg-background"
                />
              </Field>
              <Field label="Suite" span={2} hint="Optional — assign an overnight suite for lodging">
                <Select value={suiteId} onValueChange={setSuiteId}>
                  <SelectTrigger className="bg-background">
                    <SelectValue placeholder="No suite" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No suite</SelectItem>
                    {suites.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name} — {s.type.charAt(0).toUpperCase() + s.type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </Section>

            <Section title="Pets">
              <Field
                label="Select pets"
                required
                error={errors.pets}
                span={2}
                hint={
                  selectedService?.max_pets_per_booking
                    ? `Max ${selectedService.max_pets_per_booking} pet(s) per booking`
                    : undefined
                }
              >
                {!ownerId ? (
                  <div className="rounded-md border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-text-secondary">
                    Select an owner first to see their pets.
                  </div>
                ) : !ownerPets || ownerPets.length === 0 ? (
                  <div className="rounded-md border border-dashed border-border bg-background px-4 py-6 text-center text-sm text-text-secondary">
                    This owner has no linked pets yet.
                  </div>
                ) : (
                  <div className="rounded-md border border-border bg-background">
                    {ownerPets.map((p) => (
                      <label
                        key={p.id}
                        className="flex cursor-pointer items-center gap-3 border-b border-border-subtle px-3 py-2.5 last:border-b-0 hover:bg-card"
                      >
                        <Checkbox
                          checked={petIds.includes(p.id)}
                          onCheckedChange={(v) =>
                            setPetIds((cur) =>
                              v ? [...cur, p.id] : cur.filter((x) => x !== p.id),
                            )
                          }
                        />
                        <div>
                          <div className="text-sm font-medium text-foreground">{p.name}</div>
                          <div className="text-xs text-text-secondary">
                            {p.species} {p.breed ? `· ${p.breed}` : ""}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </Field>
            </Section>

            <Section title="Notes">
              <Field label="Notes" span={2} hint="Visible internally and to owner">
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </Field>
            </Section>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <Button type="button" variant="ghost" onClick={() => navigate("/reservations")}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Create Reservation"}
            </Button>
          </div>
        </form>
      </div>
    </PortalLayout>
  );
}
